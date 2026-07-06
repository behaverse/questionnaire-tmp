# identity-service — ID-A core auth

Standalone Identity/Auth service (OD-08 keystone). Issues EdDSA-JWT access tokens
(verified via JWKS) + opaque rotating refresh tokens; email+password accounts; 5-role
audience-scoped RBAC. API-only (no UI). See `docs/superpowers/specs/2026-06-21-identity-id-a-design.md`.

## Quickstart

```bash
pip install -e '.[dev]'
export DATABASE_URL=postgresql://localhost/identity_service
export IDENTITY_ISSUER=http://localhost:8100
identity migrate            # creates tables + seeds the questionnaire-apps client
identity generate-key       # mints the first Ed25519 signing key
identity create-admin --email you@example.com --password 'change-me'
uvicorn identity_service.api.app:create_app --factory --reload --port 8100
```

### Housekeeping — `identity reap`

The token tables (`handoff_codes`, `email_tokens`, `refresh_tokens`) accumulate rows; once a row is
past its `expires_at` it is useless. Run the reaper periodically (e.g. a daily cron) to delete expired
rows and bound table growth:

```bash
identity reap                      # delete everything already expired
identity reap --grace-seconds 86400  # keep rows for a day past expiry (audit buffer)
```

It is safe for `refresh_tokens`: reuse-detection only needs still-valid rotated rows, which the reaper
never touches (expired refresh tokens are already rejected on use).

## Endpoints

- `POST /v1/auth/register | login | refresh | logout`
- `GET  /v1/auth/me` (Bearer access token)
- `POST /v1/auth/change-password` (Bearer access token; `{old_password, new_password≥8}`; **204**
  on success; **403** `wrong_password` if `old_password` is incorrect; **422** if `new_password`
  is shorter than 8 characters; **401** if the Bearer token is missing or invalid; does **not**
  revoke existing sessions)
- `POST /v1/auth/verify-email | request-password-reset | reset-password`
- `GET  /v1/admin/users`, `GET /v1/admin/users/{id}`,
  `POST|DELETE /v1/admin/users/{id}/roles`, `GET|POST /v1/admin/clients` (administrator only)
- `GET  /.well-known/jwks.json`

## Tests

```bash
DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q   # run in its own invocation
```

## Consuming tokens (ID-B+)

```python
from identity_service.identity_client import JwksCache, verify, require_roles
jwks = JwksCache("http://localhost:8100/.well-known/jwks.json")
claims = verify(token, jwks=jwks, audience="questionnaire-apps", issuer="http://localhost:8100")
```

## Mailer (email slice)

Verify-email and password-reset emails are sent via a config-selected mailer:

| Mailer | When | Behaviour |
|---|---|---|
| `ResendMailer` | `RESEND_API_KEY` env var is set | Sends via the Resend API (production). |
| `SmtpMailer` | `SMTP_HOST` set (no `RESEND_API_KEY`) | Sends via SMTP with STARTTLS. Credentials optional. |
| `ConsoleMailer` | neither set (default) | Logs the full email body (including the link) at INFO level — zero-setup local dev. |
| `NullMailer` | tests only | Records messages in `.sent`; never logs or connects. |

`make_mailer(settings)` (in `identity_service/mailer.py`) chooses among `ResendMailer` (preferred when
`RESEND_API_KEY` is set), `SmtpMailer`, and `ConsoleMailer` at startup; tests inject `NullMailer` directly.

**Email link format:**

- Verify-email: `{WEB_VIEWER_BASE_URL}/verify-email?token={raw_token}`
- Password-reset: `{WEB_VIEWER_BASE_URL}/reset-password?token={raw_token}`

### New environment variables

| Variable | Default | Description |
|---|---|---|
| `WEB_VIEWER_BASE_URL` | `http://localhost:5173` | Base URL of the web viewer; used to build the verify/reset links in outgoing emails. |
| `RESEND_API_KEY` | *(unset)* | Resend API key. Set → sends via the Resend API (production); preferred over SMTP/Console. |
| `SMTP_HOST` | *(unset)* | SMTP server hostname. Unset (and no `RESEND_API_KEY`) → ConsoleMailer. |
| `SMTP_PORT` | `587` | SMTP port (STARTTLS). |
| `SMTP_USERNAME` | *(unset)* | SMTP auth username (optional). |
| `SMTP_PASSWORD` | *(unset)* | SMTP auth password (optional). |
| `SMTP_FROM` | `no-reply@behaverse.local` | Sender address on outgoing emails. |

With the default ConsoleMailer (no SMTP config), look for the verify/reset link in the **Identity
service console** (`uvicorn` stdout at INFO level). Copy the URL into the browser.

## Out of scope for ID-A
Social/ORCID/GitHub federation, hosted login UI, full OAuth2/OIDC, MFA, JS/TS verifier — all later slices.
