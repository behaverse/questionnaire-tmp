# Identity Service — Deferred Items (FOLLOWUPS)

## Admin API audience isolation

- `create_client`, `list_users`, and `get_user` (api/admin.py) are currently
  gated only by "administrator in any audience" (via `require_admin`). The
  distinction between platform-global-admin and per-audience-admin is deferred
  to the multi-tenant slice (ID-B+); revisit when a second audience is actually
  in production use.

## Refresh token race condition

- `service/auth.py` refresh: the reuse-detection lookup is not
  `SELECT ... FOR UPDATE`. A small concurrent-double-refresh race exists; the
  UNIQUE constraint on `token_hash` makes one rotation fail rather than silently
  succeeding, but the losing request sees a 500 instead of a clean 401. Add
  `FOR UPDATE` when hardening.

## Access JWT revocation on password reset

- `reset_password` revokes all refresh families for the user but cannot revoke
  already-issued access JWTs (valid until `exp`, ≤15 min). This is an inherent
  stateless-JWT trade-off. Document in the security model; consider short-lived
  access tokens (already ≤15 min) as the mitigation.

## logout rstore.revoke helper

- `api/auth.py` logout uses inline SQL rather than an `rstore.revoke` helper.
  Add `rstore.revoke(conn, token_hash)` for consistency with the rest of the
  store layer.

## GET /v1/auth/me duplicate DB connection

- `GET /v1/auth/me` opens two DB connections: one from `require_access` and
  one from the route's own `Depends(get_conn)`. Deduplicate by threading the
  connection through `require_access` or using a request-scoped connection.

## store.users.roles_for ordering

- `store/users.py roles_for` returns roles in DB insertion order. If a
  deterministic ordering is ever needed, add `ORDER BY role`.

## store.clients grant ON CONFLICT target

- `store/users.py grant_role` uses an unnamed `ON CONFLICT DO NOTHING`. The
  `(user_id, client_id, role)` unique constraint is implied; make it explicit
  (`ON CONFLICT (user_id, client_id, role) DO NOTHING`) once the constraint
  name is known.

## revoke_role does not 404 on unknown user

- `admin.py revoke_role` silently no-ops if `user_id` does not exist. Consider
  returning 404 for consistency with `grant_role`.

## get_user N+1 over clients

- `admin.py get_user` issues one query per client in `cstore.list_all`. Replace
  with a single JOIN query when the client list grows.

## Revoke other sessions on password change (PA-3)

- `POST /v1/auth/change-password` only updates the stored password hash; it does **not**
  revoke existing refresh families or invalidate outstanding access JWTs. A participant who
  changes their password while signed in on multiple devices remains signed in everywhere.
  Add a `revoke_all_families(user_id)` call inside `change_password` when a "sign out
  everywhere on password change" policy is wanted; also note the ≤15 min access-token window
  (same trade-off as `reset_password` — see "Access JWT revocation on password reset" above).

## NullMailer blocks email delivery (PA-3)

- The `verify-email`, `request-password-reset`, and `reset-password` endpoints are fully
  implemented but **not deliverable** in production: `NullMailer` silently drops every
  outbound message. Wire a real SMTP mailer (or a transactional email provider) before
  enabling email-verification or self-service forgot/reset-password flows.

## CLI `_opt` edge cases

- `cli.py _opt` raises `IndexError` when a flag appears at the end of argv
  with no following value. Add a bounds check and a helpful error message.
  The unknown-command path is also not separately tested; add a test.
