# Design — dedicated `REPLAY_SIGNING_SECRET` + per-session replay revocation

- **Date:** 2026-07-03
- **Track:** QA / research tooling — replay (#7), follow-on #7-4
- **Branch:** `work/replay-revocation`
- **Predecessor:** RP2 replay-link mint/verify (merged); #7-2/#7-3 `/studies` surface (merged).

## Problem

Replay tokens are signed with the shared `invite_signing_secret`, so operators cannot rotate replay access
independently of invite links. And there is **no revocation**: a compromised replay link stays valid until
its TTL (default 7 days) expires. Two independent levers are missing: (a) a dedicated secret whose rotation
kills all replay tokens at once, and (b) targeted revocation short of rotating the secret.

## Decision

1. **Dedicated `REPLAY_SIGNING_SECRET`**, non-breaking: mint + verify use `replay_signing_secret or
   invite_signing_secret`, so replay keeps working on the invite secret until an operator sets the dedicated
   one. Rotating `REPLAY_SIGNING_SECRET` invalidates every replay token without touching invites.
2. **Per-session revocation** (owner-chosen over per-token): "revoke all replay links for this session" in
   one action, keyed by `session_id`, enforced by comparing the token's `iat` against the session's
   `revoked_at`. The researcher needs only the `session_id` (which `/studies` already shows), and re-minting
   after a revoke works.

## Scope

**In scope:** the dedicated secret (config + resolution), the token `iat` addition, a `replay_revocation`
table + store functions, a researcher-gated revoke endpoint, the revocation check in the bundle endpoint,
and a `/studies` per-session "Revoke links" button.

**Out of scope:** per-token revocation, invite-link changes, a revocation-audit/history UI, automatic
revocation on any lifecycle event. Additive schema + config only; no change to existing endpoints beyond the
revocation check inside `GET /v1/replay`.

## Components

### 1. Config — `viewer-service/src/viewer_service/config.py`

Add `replay_signing_secret: str = ""` (default) read from `os.environ.get("REPLAY_SIGNING_SECRET", "")` in
`get_settings()`.

### 2. Effective-secret resolution + token `iat` — `replay_links.py` / `api/replay.py`

- `mint_replay` adds `iat` to the signed payload (it already computes `iat`): payload becomes
  `{deployment_id, session_id, iat, exp}`. `verify_replay` continues to validate `deployment_id`,
  `session_id`, and `exp`; `iat` is passed through in the returned dict (present for new tokens, absent for
  legacy ones).
- A small helper resolves the effective secret — `_effective_replay_secret(s) = s.replay_signing_secret or
  s.invite_signing_secret` — used by BOTH the mint endpoint and the verify endpoint (replacing the current
  direct `s.invite_signing_secret`).

### 3. Schema — `viewer-service/src/viewer_service/store/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS replay_revocation (
  session_id     text PRIMARY KEY REFERENCES session (session_id),
  deployment_id  text NOT NULL,
  revoked_at     timestamptz NOT NULL DEFAULT now()
);
```
Idempotent, appended to the schema (applied on startup like the others).

### 4. Store — `viewer-service/src/viewer_service/store/replay_revocation.py` (new small module)

- `revoke_session(conn, deployment_id, session_id)` — upsert: `INSERT ... ON CONFLICT (session_id) DO
  UPDATE SET revoked_at = now(), deployment_id = EXCLUDED.deployment_id`.
- `revoked_at(conn, session_id) -> datetime | None` — the session's `revoked_at`, else `None`.

### 5. Revoke endpoint — `POST /v1/deployments/{deployment_id}/sessions/{session_id}/replay-link/revoke`

In `api/replay.py`, `require_researcher`-gated (mirrors `mint_link`): 404 if the deployment is unknown or
the session does not belong to it; else `revoke_session(...)` and return `{ "revoked_at": <iso> }`.

### 6. Revocation enforcement — in `GET /v1/replay` (`bundle`)

After `verify_replay` returns a payload (HMAC + exp OK) and the session/deployment match check passes, add:
look up `revoked_at(conn, session_id)`; if it is set AND (`payload` has no `iat` OR `payload["iat"] <
revoked_at.timestamp()`), return **401** with a `replay_link_revoked` error envelope. This rejects tokens
minted before the revoke (and, conservatively, any legacy token without `iat` for a revoked session), while
a token minted after the revoke (`iat > revoked_at`) passes.

### 7. participant-app — revoke wiring

- `participant-app/src/studies/api.ts`: `revokeReplayLinks(vsBaseUrl, authFetch, deploymentId, sessionId)`
  → `POST .../replay-link/revoke`; throws on non-ok.
- `participant-app/src/studies/StudiesView.tsx`: a per-session **Revoke links** button next to Copy →
  calls `revokeReplayLinks`, shows inline "Revoked ✓" (or an inline error). Reuses the existing per-session
  status slot.

## Testing strategy

- **VS** (`viewer-service/tests/`):
  - Dedicated secret: with `REPLAY_SIGNING_SECRET` set, mint→verify round-trips; a token whose signature is
    from the invite secret fails verify once the replay secret differs; with the replay secret unset, it
    falls back to the invite secret (existing behavior preserved).
  - Revocation: mint a link → `POST .../revoke` → `GET /v1/replay?token=` is 401; a freshly minted link
    after the revoke is 200; revoke is researcher-gated (403 for participant) and 404 for unknown
    deployment/session; revoking session A does not affect a link for session B.
- **participant-app** (vitest): `revokeReplayLinks` posts to the revoke URL; the StudiesView Revoke button
  calls it and shows the confirmation.

## Risks

- **Legacy tokens without `iat`** — handled conservatively (a revoked session rejects them); they also
  expire within the 7-day TTL. Non-revoked sessions are unaffected (no `revoked_at` row → no check).
- **Clock/timestamp comparison** — compare `payload["iat"]` (epoch int) against `revoked_at.timestamp()`;
  ensure `revoked_at` is timezone-aware (Postgres `timestamptz`) so `.timestamp()` is correct.
- **Secret migration** — setting `REPLAY_SIGNING_SECRET` on a live VS invalidates outstanding replay links
  minted under the invite secret; document this as the intended rotation behavior (note in the replay doc).

## Deliverables checklist

- [ ] `REPLAY_SIGNING_SECRET` config + `_effective_replay_secret` used at mint + verify; `iat` in the token payload.
- [ ] `replay_revocation` table + `revoke_session` / `revoked_at` store fns.
- [ ] `POST .../replay-link/revoke` (researcher-gated, 404 scoping) + revocation check in `GET /v1/replay` (401).
- [ ] VS tests: dedicated-secret isolation/fallback + revoke/re-mint/gating/scoping.
- [ ] participant-app `revokeReplayLinks` + StudiesView Revoke button + tests.
- [ ] Doc: note the dedicated secret + revocation + rotation behavior in `web-viewer/docs/replay.md`.
- [ ] FOLLOWUPS + HANDOFF: mark #7-4 done; leave #7-5 (live-follow) as the last remaining #7 item.
