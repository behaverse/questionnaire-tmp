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

## Out of scope for ID-A
Real email sending (NullMailer stub only), social/ORCID/GitHub federation, hosted login UI,
full OAuth2/OIDC, MFA, JS/TS verifier, and wiring existing consumers — all later slices.
