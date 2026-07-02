# Design — researcher `/studies` surface + copy replay link

- **Date:** 2026-07-02
- **Track:** QA / research tooling — replay (#7), follow-ons #7-2 (copy replay link) + #7-3 (session-list surface), combined
- **Branch:** `work/researcher-studies`
- **Predecessor:** RP1/RP2/RP3-core + multi-select (merged). RP2 already mints replay links; this gives
  researchers a UI to reach them instead of calling the API by hand.

## Problem

There is **no researcher-facing frontend** today: researchers manage deployments and pull
exports/metrics/replay-links purely via the API. RP2 lets a researcher mint a replay link for a session,
but only if they already know the `session_id` — and there is **no endpoint that lists a deployment's
sessions** (only participant-self `GET /me/sessions`). So a researcher cannot, in practice, get from "a
deployment" to "a replay link for one of its sessions".

## Decision

Build the first small researcher surface as a **role-gated `/studies` route in participant-app** (the owner
chose this over the editor or a new standalone app — participant-app already wires Identity auth/session and
is deployed). Add the missing backend **`GET /deployments/{id}/sessions`** endpoint. The per-session
**Copy replay link** action (#7-2) lives on this session list (#7-3), satisfying both in one feature.

## Scope

**In scope:**
1. VS: `GET /deployments/{deployment_id}/sessions` (researcher-gated) + a store list function.
2. participant-app: a role-gated `/studies` view — deployment picker → sessions table → per-session
   Copy-replay-link.

**Out of scope (stays API-only for now):** deployment CRUD, metrics/exports/comments panels, recordings,
bulk actions, pagination/filtering. The session list is unpaginated (fine for current data volumes; note
the cap in the doc if we ever add it).

## Components

### 1. VS store — `viewer-service/src/viewer_service/store/sessions.py`

`list_sessions_for_deployment(conn, deployment_id) -> list[dict]` — mirrors the existing
`list_sessions_for_participant` (reuses `_SELECT_COLS` / `_row_to_dict`), `WHERE deployment_id=%s ORDER BY
started_at DESC`.

### 2. VS endpoint — `GET /deployments/{deployment_id}/sessions` (`require_researcher`)

- 404 if `dep_store.get_deployment` is None.
- Returns `{ "sessions": [ ... ] }` where each item is a **curated projection** of the row —
  `{ session_id, session_index, status, participant_sub, started_at, completed_at, submitted_at }`.
- **Security requirement:** the response MUST NOT include `token_hash` (a session credential present in
  `_row_to_dict`) — nor other non-display internals like `viewer_*`/`agent_id`/`scorer_outputs`. Project
  explicitly; do not dump the raw row dict.
- Timestamps serialized ISO-8601 (match how existing endpoints serialize `timestamptz`).
- Lives alongside the existing deployment/session routers (e.g. extend `api/sessions.py` or the deployments
  router — whichever already imports `require_researcher` + `dep_store`; the plan will pick the exact file).

### 3. participant-app API client — `participant-app/src/studies/api.ts`

Thin wrappers over `useSession().authFetch` (injects the researcher bearer token, refreshes on 401), against
the VS base URL the app already uses:
- `listDeployments()` → `GET /v1/deployments`.
- `listSessions(deploymentId)` → `GET /v1/deployments/{id}/sessions` → the sessions array.
- `mintReplayLink(deploymentId, sessionId)` → `POST /v1/deployments/{id}/sessions/{sid}/replay-link` →
  `{ token, bundle_url, replay_url }`.

### 4. participant-app view — `participant-app/src/studies/StudiesView.tsx`

- **Role gate:** `const { user } = useSession()`; if `!user?.roles?.includes('researcher')`, render a short
  "Researchers only" notice (no data calls). Researchers see the surface.
- **Deployment picker:** load `listDeployments()`; render a select/list showing `deployment_id` +
  `questionnaire_ref` (+ mode/status if present). Selecting one loads its sessions.
- **Sessions table:** columns — session (id, truncated), status, participant (`participant_sub` or "anon"),
  started. Newest first (endpoint order). Empty state when a deployment has no sessions.
- **Copy replay link (per row):** button → `mintReplayLink(dep, sid)` → `navigator.clipboard.writeText(replay_url)`
  → inline "Copied ✓" on that row (transient). If `replay_url` is null (VS `WEB_VIEWER_BASE_URL` unset),
  copy `bundle_url` instead and show "Copied bundle URL (set WEB_VIEWER_BASE_URL for a player link)". Errors
  (mint 4xx/5xx, clipboard denied) show an inline error on the row, never a dead button.

### 5. participant-app routing/nav

- `participant-app/src/shell/ParticipantApp.tsx`: add a `/studies` route rendering `StudiesView`.
- `participant-app/src/shell/NavShell.tsx`: add a "Studies" nav item shown **only** when the user has the
  `researcher` role (read `useSession().user`).

## Data flow / auth

participant-app is already an Identity-authenticated app; `authFetch` carries the logged-in user's bearer
token. VS `require_researcher` authorizes the endpoints (403 for non-researchers — the UI also hides the
route, but the server remains the real gate). participant-app's origin is already in `VS_CORS_ORIGINS`
(it is the portal), so no CORS change. No schema change.

## Testing strategy

- **VS** (`viewer-service/tests/`): researcher lists a deployment's sessions; response excludes
  `token_hash`; non-researcher → 403; unknown deployment → 404; a session belonging to another deployment is
  not returned. Run in the viewer-service pytest suite (`DOCKER_CONFIG=/tmp/lib_docker`).
- **participant-app** (vitest + @testing-library/react): `StudiesView` renders sessions from a mocked
  `authFetch`; the Copy-link button calls `mintReplayLink` and `navigator.clipboard.writeText` with
  `replay_url`; a non-researcher sees the gated notice and NO nav item; null-`replay_url` falls back to
  `bundle_url`. `npm test` + `npm run build`.

## Risks

- **Leaking `token_hash`** — mitigated by the explicit safe-field projection (Component 2) + a test asserting
  its absence.
- **Unbounded list** — acceptable now; if session counts grow, add pagination in a later slice (note it).
- **Role source of truth** — the UI gate is convenience; the VS `require_researcher` gate is authoritative.

## Deliverables checklist

- [ ] VS store `list_sessions_for_deployment` + `GET /deployments/{id}/sessions` (curated projection, no `token_hash`).
- [ ] VS tests: list / 403 / 404 / cross-deployment isolation / no `token_hash`.
- [ ] participant-app `src/studies/{api,StudiesView}.tsx` + `/studies` route + researcher-only nav item.
- [ ] participant-app tests: render, copy-link (mint + clipboard), role gate, null-replay_url fallback.
- [ ] `npm test` + `npm run build` (participant-app) green; viewer-service suite green.
- [ ] FOLLOWUPS updated: mark #7-2 (copy replay link UI) + #7-3 (session-list surface) done in
      `web-viewer/FOLLOWUPS.md` + `viewer-service/FOLLOWUPS.md`; refresh HANDOFF #7 remaining list.
