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
| `SmtpMailer` | `SMTP_HOST` env var is set | Sends via SMTP with STARTTLS. Credentials optional. |
| `ConsoleMailer` | `SMTP_HOST` not set (default) | Logs the full email body (including the link) at INFO level — zero-setup local dev. |
| `NullMailer` | tests only | Records messages in `.sent`; never logs or connects. |

`make_mailer(settings)` (in `identity_service/mailer.py`) chooses between `SmtpMailer` and
`ConsoleMailer` at startup; tests inject `NullMailer` directly.

**Email link format:**

- Verify-email: `{WEB_VIEWER_BASE_URL}/verify-email?token={raw_token}`
- Password-reset: `{WEB_VIEWER_BASE_URL}/reset-password?token={raw_token}`

### New environment variables

| Variable | Default | Description |
|---|---|---|
| `WEB_VIEWER_BASE_URL` | `http://localhost:5173` | Base URL of the web viewer; used to build the verify/reset links in outgoing emails. |
| `SMTP_HOST` | *(unset)* | SMTP server hostname. Unset → ConsoleMailer. |
| `SMTP_PORT` | `587` | SMTP port (STARTTLS). |
| `SMTP_USERNAME` | *(unset)* | SMTP auth username (optional). |
| `SMTP_PASSWORD` | *(unset)* | SMTP auth password (optional). |
| `SMTP_FROM` | `no-reply@behaverse.local` | Sender address on outgoing emails. |

With the default ConsoleMailer (no SMTP config), look for the verify/reset link in the **Identity
service console** (`uvicorn` stdout at INFO level). Copy the URL into the browser.

## Out of scope for ID-A
Real email sending (NullMailer stub only), social/ORCID/GitHub federation, hosted login UI,
full OAuth2/OIDC, MFA, JS/TS verifier, and wiring existing consumers — all later slices.
