# Identity Service — Handoff

**Path:** `identity-service/` · **Stack:** Python / FastAPI / Postgres · **Status:** ✅ built + LIVE (https://identity-service-three.vercel.app) · **Suggested branch:** `work/identity`

> The OD-08 keystone: a standalone auth service that issues tokens, stores accounts, and gates every
> control-plane endpoint across the platform. Consumers verify tokens *locally* via JWKS and import the
> `identity_client` verifier. Architected to later stand alone and serve multiple Behaverse projects (audience-aware).
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **Tokens:** EdDSA-JWT access tokens (≤15 min, verified offline via `GET /.well-known/jwks.json`) + opaque
  rotating refresh tokens (reuse → family-revoke). Argon2id email+password accounts. Audience-scoped 5-role RBAC.
- **Auth API:** `POST /v1/auth/register|login|refresh|logout`, `GET /v1/auth/me`, `POST /v1/auth/change-password`,
  `POST /v1/auth/verify-email|request-password-reset|reset-password`.
- **SSO handoff (cross-origin):** `POST /v1/auth/handoff` (mint one-time 60s code) + `POST /v1/auth/handoff/exchange`
  (redeem for tokens). Portal mints at launch; player exchanges on boot — authenticated deployments no longer re-login.
- **Admin API:** `GET /v1/admin/users[/{id}]`, `POST|DELETE /v1/admin/users/{id}/roles`, `GET|POST /v1/admin/clients`
  (administrator only). Plus `GET /internal/reap` housekeeping route.
- **Reusable verifier:** `identity_service.identity_client` (`JwksCache`, `verify`, `require_roles`) — imported by the
  Viewer Service (and future consumers) to gate endpoints. Mirrors the `library/` + `viewer-service/` layout.
- **Mailer:** config-selected via `make_mailer` — `ResendMailer` when `RESEND_API_KEY` set (production), else
  `SmtpMailer` when `SMTP_HOST` set, else `ConsoleMailer` (logs the link at INFO); `NullMailer` in tests.
  Verify/reset links built from `WEB_VIEWER_BASE_URL`.
- Built ID-A..C1 + email slice + PP/PA auth slices + SSO handoff. Live, sharing one Supabase DB with the Viewer Service.

## Run & test
```bash
pip install -e '.[dev]'
export DATABASE_URL=postgresql://localhost/identity_service
export IDENTITY_ISSUER=http://localhost:8100
identity migrate          # create tables + seed the questionnaire-apps client
identity generate-key     # mint the first Ed25519 signing key
identity create-admin --email you@example.com --password 'change-me'
uvicorn identity_service.api.app:create_app --factory --reload --port 8100

# tests (~70 fns) — run in its OWN pytest invocation, NOT alongside library/+viewer-service/
DOCKER_CONFIG=/tmp/lib_docker python -m pytest identity-service/ -q
```
Other CLI commands: `identity create-client`, `identity reap [--grace-seconds N]` (deletes expired
`handoff_codes` / `email_tokens` / `refresh_tokens` rows — see TTL-reaper item below).

## What's left to do
Service is feature-complete for the participant/editor auth needs shipped so far. Remaining items:

### Now
- **Shared TTL reaper across services** — Identity's own reaper is scheduled (Vercel daily cron `0 4 * * *` →
  `GET /internal/reap`). Open item: coordinate a shared reaper across the Viewer Service (shared Supabase DB) so all
  TTL tables are covered. See [README.md](README.md) "Housekeeping".

### Next
- **Revoke other sessions on password change (PA-3)** — `change-password` only rewrites the hash; multi-device
  sessions stay live. Add `revoke_all_families(user_id)` inside `change_password` if "sign out everywhere" is wanted
  (note ≤15 min access-token window). FOLLOWUPS: "Revoke other sessions on password change".
- **httpOnly-cookie hardening for refresh tokens** — refresh tokens currently live in client localStorage; move to
  httpOnly cookies to reduce XSS exposure (cross-origin/SSO implications — coordinate with portal + player).
- **Resend-verification + email-change endpoints** — no `POST /v1/auth/resend-verification` or `/v1/auth/change-email`
  yet; lost-verification users need an admin re-trigger today. FOLLOWUPS: "Resend-verification", "Email-change".
- **Refresh `FOR UPDATE` + minor store cleanups** — concurrent-double-refresh race returns 500 instead of clean 401;
  plus `/v1/auth/me` double DB connection, `rstore.revoke` helper, N+1 in `get_user`. FOLLOWUPS (several items).

### Deferred / blocked
- 🔒 **ID-C2 — contribution write/review workflow** (drafts/in_review lifecycle; unblocks the editor's "Propose shared
  version") — blocked on an OPEN design decision (GitHub-PR vs DB-draft model); needs its own brainstorm.
- 🔒 **ID-C3 — DOI minting** — blocked on DataCite / external service.
- ⏸ **ID-D — Editor collaboration** (projects / roles / invites) — Phase 5 Participant-Platform territory.
- 🔒 **Admin API audience isolation** — `require_admin` is global, not per-audience; revisit when a second audience is
  in production (multi-tenant slice). FOLLOWUPS: "Admin API audience isolation".
- **Access-JWT revocation on reset/change** — inherent stateless-JWT trade-off; mitigated by ≤15 min `exp`. Document, don't fix.

## Conventions & gotchas
- **Run tests in their own invocation** with `DOCKER_CONFIG=/tmp/lib_docker` (testcontainers Postgres) — do NOT run in
  the same pytest process as `library/` or `viewer-service/`.
- **Consumers verify offline** — never call back to Identity to check a token; import `identity_client` and verify the
  JWT signature against the cached JWKS (`audience="questionnaire-apps"`, the configured issuer).
- **Deploy dependency:** the repo-root `requirements.txt` includes `./identity-service` (ID-C1) — keep it there or the
  Library/VS deploy loses the verifier.
- **Shared Supabase DB** with the Viewer Service — schema changes and the TTL reaper must be coordinated with that agent.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing.

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md)
- Design: [docs/superpowers/specs/2026-06-21-identity-id-a-design.md](../docs/superpowers/specs/2026-06-21-identity-id-a-design.md)
- Consumer side: [../viewer-service/](../viewer-service/) (ID-B control-plane gating) · [../library/](../library/) (ID-C1 community signals)
- System-wide context: root [HANDOFF.md](../HANDOFF.md)
