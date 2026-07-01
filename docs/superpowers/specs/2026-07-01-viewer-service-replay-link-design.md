# Viewer Service replay link (#7 RP2) — design

**Date:** 2026-07-01 · **Component:** `viewer-service/` only
**Context:** #7 RP1 (merged) added an embedded `?replay=<src>` player mode that reconstructs + plays
back a run from a replay bundle `{runtime, statements, mouse?}`. RP2 lets a researcher replay a
**real participant's live session** by having the VS assemble that exact bundle server-side, reachable
via a signed HMAC link — so the RP1 player consumes it unchanged.

## Goal

A researcher mints a short-lived signed replay link for a session; opening it in the player fetches a
VS-assembled bundle `{runtime, statements, mouse}` for that session and plays it back. No player code
change (RP1's `loadBundle` already fetches an absolute URL; CORS already allows the player).

## Decisions (resolved)

1. **Assembly:** VS assembles `{runtime, statements, mouse}` server-side (one bundle endpoint). ✅
2. **Auth:** a signed HMAC replay link (mirrors the PP-B invite-link pattern); the bundle endpoint is
   token-authorized (unauthenticated fetch), the mint is researcher-gated. ✅

## Reuse (verified)

- `invites.py` `_b64u`/`_sign`/`mint_invite`/`verify_invite` — the exact HMAC pattern to mirror for a
  session-scoped token; `config.invite_signing_secret` (fails closed on empty).
- `store/sessions.py` `get_session(conn, session_id)` → the session dict (deployment_id, viewer_id,
  viewer_version, last_active_locale, participant_sub).
- `sessions.py` `session_runtime(conn, session)` → re-mints the runtime for a session (cache-hit) —
  the bundle's `runtime`.
- `store/export.py` `iter_event_rows_for_participant` / `iter_recording_rows` — the readers to mirror
  per-session.
- `store/deployments.py` `get_deployment` — to validate the session belongs to the researcher's deployment.
- CORS: the global `VS_CORS_ORIGINS` middleware already covers a new GET endpoint.

## Non-goals (RP2)

- No player code change (that verification is RP3 — a follow-up e2e + docs).
- No researcher UI to browse/mint links (API only, like the rest of the researcher surface).
- No `.jsonl.gz`, no per-recording pagination, no long-poll live replay of an in-progress session
  (the session is replayed as-recorded; incremental live-follow is a later idea).
- No new signing secret — reuse `invite_signing_secret` (a dedicated `REPLAY_SIGNING_SECRET` is a
  later hardening if link scopes must be revoked independently).

## Architecture / units

| Unit | File | Responsibility |
|---|---|---|
| Signed token | `replay_links.py` (new) | `mint_replay` / `verify_replay` (session-scoped HMAC, mirrors invites.py) |
| Per-session readers | `store/export.py` | `iter_event_rows_for_session`, `iter_recording_rows_for_session` |
| Bundle assembly | `replay.py` (new service) | session → `{runtime, statements, mouse}` |
| Link mint | `api/replay.py` `POST /deployments/{id}/sessions/{sid}/replay-link` | researcher-gated; validate session-in-deployment; return the link |
| Bundle endpoint | `api/replay.py` `GET /replay` | token-authorized; assemble + return the bundle |
| Config | `config.py` | optional `web_viewer_base_url` (for the returned `replay_url`) |
| Router | `api/app.py` | `include_router(replay.router)` |

### `replay_links.py` (mirror invites.py, session-scoped)

```python
def mint_replay(secret, *, deployment_id: str, session_id: str, ttl: int, now: int|None=None) -> str
def verify_replay(secret, token: str|None, now: int|None=None) -> dict | None   # -> {deployment_id, session_id, exp} | None
```
Reuse `_b64u`/`_sign` (import from `invites` or duplicate the two tiny helpers). Payload
`{deployment_id, session_id, exp}`; `verify_replay` checks the HMAC + `exp`, never raises, fails
closed on an empty secret. Unlike `verify_invite`, it does NOT pre-know the deployment_id — it decodes
it from the token (the caller re-checks the session belongs to that deployment).

### Per-session readers (`store/export.py`)

```python
def iter_event_rows_for_session(conn, session_id) -> Iterator[dict]      # kind='events', WHERE o.session_id=%s, ORDER BY o.id
def iter_recording_rows_for_session(conn, session_id) -> Iterator[dict]  # kind='recording', same
```

### Bundle assembly (`replay.py` service)

```python
def build_replay_bundle(conn, session: dict) -> dict:
    runtime = sessions_svc.session_runtime(conn, session)
    statements = [s for payload in iter_event_rows_for_session(conn, session["session_id"])
                    for s in (payload.get("events") or []) if isinstance(payload, dict)]
    mouse = [m for payload in iter_recording_rows_for_session(conn, session["session_id"])
               for m in (payload.get("samples") or []) if isinstance(payload, dict)]
    return {"runtime": runtime, "statements": statements, "mouse": mouse}
```

### Endpoints (`api/replay.py`)

- `POST /v1/deployments/{deployment_id}/sessions/{session_id}/replay-link` — `require_researcher`.
  - `404` if the deployment doesn't exist; `404` if the session doesn't exist or its `deployment_id`
    != the path deployment (no cross-deployment access).
  - Mint a token: `mint_replay(secret, deployment_id, session_id, ttl=REPLAY_LINK_TTL)` (e.g. 7 days).
  - Build `bundle_url = str(request.base_url).rstrip('/') + '/v1/replay?token=' + token`.
  - `replay_url = f"{web_viewer_base_url}/?replay={quote(bundle_url, safe='')}"` when `web_viewer_base_url`
    is configured, else `null`.
  - Return `{ "token": token, "bundle_url": bundle_url, "replay_url": replay_url }`.
- `GET /v1/replay?token=<signed>` — no auth.
  - `verify_replay(secret, token)` → `401 {code:"invalid_replay_token"}` on failure/expiry/empty secret.
  - `get_session(conn, payload["session_id"])`; if `None` or its `deployment_id != payload["deployment_id"]`
    → `404`.
  - Return `build_replay_bundle(conn, session)` as JSON `{runtime, statements, mouse}` (the RP1 bundle
    shape).

## Data flow

researcher (Bearer) → `POST …/replay-link` → signed link → open `?replay=<bundle_url>` in the player →
player `GET /v1/replay?token=` (token-authorized, CORS-allowed) → VS assembles `{runtime, statements,
mouse}` (session_runtime + per-session events + per-session recording) → RP1 `ReplayApp` reconstructs +
plays.

## Error / edge handling

- Empty `invite_signing_secret` → mint still returns a token but `verify_replay` fails closed → the
  bundle endpoint 401s (no replay possible without a configured secret; same posture as invites).
- Unknown/foreign session (token's session not in token's deployment) → 404.
- Expired token → 401.
- A session with no recording → `mouse: []` (replay plays without a cursor). No events → `statements: []`
  (RP1 shows a zero-length timeline). Ephemeral/demo sessions have no outbox rows → empty bundle (still valid).
- `session_runtime` preflight failure (unsupported runtime) → surface as the existing 422 preflight
  error shape (reuse the sessions.py `_preflight_422` handling if it bubbles).

## Testing (pytest + testcontainers; `DOCKER_CONFIG=/tmp/lib_docker`, run `viewer-service/` alone)

- **`replay_links`** (pure unit, no DB): `mint_replay` → `verify_replay` round-trips `{deployment_id,
  session_id}`; a tampered token, an expired token (`now` past `exp`), and an empty secret all → None.
- **Per-session readers:** `iter_event_rows_for_session` / `iter_recording_rows_for_session` return only
  that session's `events` / `recording` rows (exclude other sessions + other kinds), in id order.
- **Bundle assembly:** `build_replay_bundle` for a seeded session returns `{runtime, statements, mouse}`
  with the flattened events + samples and a real runtime.
- **Endpoints:** `POST …/replay-link` is researcher-gated (403 for participant; 404 unknown deployment /
  foreign session) and returns a token; `GET /v1/replay?token=` with that token returns the bundle;
  a bad/expired token → 401; a token whose session isn't in its deployment → 404.

## Follow-ups (RP3 + later)

- **RP3** (`web-viewer/`, small): an end-to-end test + docs confirming `?replay=<vs bundle url>` plays a
  live session (route-mock or against a live VS); a "Replay" affordance is a UI nicety, not required.
- A dedicated `REPLAY_SIGNING_SECRET` + link revocation; a researcher UI to list sessions + copy replay
  links; incremental live-follow of an in-progress session; researcher CSV of the event log.
