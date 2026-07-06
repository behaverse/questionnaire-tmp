# Viewer Service — Handoff

**Path:** `viewer-service/` · **Stack:** Python / FastAPI / Postgres · **Status:** ✅ feature-complete for Phase 2 (VS-A..E + participant slices), LIVE · **Suggested branch:** `work/viewer-service`

> The runtime + participant-data backend of the platform. It mints cached Schema-3 runtimes (calls the
> denormaliser, reads the Library resolution-bundle), runs the participant data path (sessions →
> responses/events → durable outbox → Behaverse forwarder), and owns deployment lifecycle, export,
> metrics, themes, the public catalogue, and signed invite links. LIVE at
> https://viewer-service.vercel.app (shares one Supabase DB with Identity).
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **Runtime minting** — calls `questionnaire-runtime-denormaliser` (Schema 2 → 3) over Library bodies; cached by the OD-18f 5-tuple `(qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)` with LRU eviction. Routes: [`runtime.py`](src/viewer_service/api/runtime.py), [`viewers.py`](src/viewer_service/api/viewers.py).
- **Participant data path** — anonymous + authenticated + `invite_link` sessions; opaque hashed session tokens; resume/locale switch; response (Schema 5) / event (Schema 4a) submission → durable Postgres outbox (202). Routes: [`sessions.py`](src/viewer_service/api/sessions.py), [`submission.py`](src/viewer_service/api/submission.py), [`me.py`](src/viewer_service/api/me.py), [`invites.py`](src/viewer_service/api/invites.py).

### Behavioural-channel recordings (SP3)

SP3 adds server-side ingest and retrieval of raw behavioural recordings (mouse, keyboard) to the participant data path. The player-side live capture is SP2 (deferred; see FOLLOWUPS.md).

- **`POST /v1/sessions/{id}/recordings`** — session-token gated (`require_session`). Body `{channel, samples}` where `channel` ∈ `mouse|keyboard` and `samples` is a list of Schema-4b mouse samples `{t, x, y, button_state}`. Validates channel/samples (400 on bad input; 401 on bad token). Enqueued as a `kind='recording'` outbox row via `submission.submit_recording`—no Schema-4a event-schema validation, unlike regular event submission. The OD-13 forwarder ships it to Behaverse identically to events/responses (kind-agnostic). Ephemeral/demo sessions return `202 {"ephemeral": true}` and store nothing. Implemented in [`api/recordings.py`](src/viewer_service/api/recordings.py).
- **`GET /v1/me/recordings`** — participant-scoped JSON download (`{"recordings": [...]}`, `Content-Disposition: attachment; filename=my_recordings.json`). 401 without a valid participant token. Implemented in [`api/recordings.py`](src/viewer_service/api/recordings.py); reader in [`store/export.py`](src/viewer_service/store/export.py).
- **`GET /v1/deployments/{id}/recordings`** — researcher-gated (`require_researcher`). Returns all recordings for the deployment. 404 for an unknown deployment; 403 for a non-researcher token. Reader in [`store/export.py`](src/viewer_service/store/export.py).
- **Mint `channels` field** — `POST /v1/sessions/new` now returns a `channels` object (sourced from `deployment.channels`, default `{rt: true, mouse: false, …}`) so the player knows which behavioural channels to activate at session start. No schema migration: reuses the existing `deployment.channels` jsonb column and the existing `outbox` table (`kind` is free text; the forwarder is kind-agnostic).
- **Deployment CRUD + lifecycle** — `mode_preset` (anonymous_link/demo/authenticated/invite_link) → 4 orthogonal dimensions; active-window + quota gating (410/409); `listed`/`title`/`description` catalogue; `consent`/`confirmation_message`/`redirect_url`. [`deployments.py`](src/viewer_service/api/deployments.py), [`catalogue.py`](src/viewer_service/api/catalogue.py).
- **Export / metrics / themes** — UC-11 BDM-native CSV stream ([`export.py`](src/viewer_service/api/export.py)); UC-12 snapshot metrics ([`metrics.py`](src/viewer_service/api/metrics.py)); WCAG-AA-at-save themes ([`themes.py`](src/viewer_service/api/themes.py)); scorer wasm serving + scorer_outputs ([`scorers.py`](src/viewer_service/api/scorers.py), [`scoring.py`](src/viewer_service/api/scoring.py)).
- **Replay link + session list + revocation (#7 RP2 + follow-ons)** — researcher mints a signed, short-lived capability URL for a specific participant session; the web-viewer's `?replay=` mode (RP1) then replays that session unchanged. Four endpoints:
  - **`GET /v1/deployments/{id}/sessions`** — researcher-gated (`require_researcher`). Lists a deployment's sessions via `list_sessions_for_deployment`, projected to a **credential-free** shape (`session_id`, `session_index`, `status`, `participant_sub`, `started_at`, `completed_at`, `submitted_at`) — never `token_hash`. Implemented in [`api/deployments.py`](src/viewer_service/api/deployments.py).
  - **`POST /v1/deployments/{id}/sessions/{sid}/replay-link`** — researcher-gated (`require_researcher`). Validates the session belongs to the deployment (404 otherwise). Mints a short-lived HMAC token (dedicated `REPLAY_SIGNING_SECRET`, falling back to `invite_signing_secret` when unset; TTL from `REPLAY_LINK_TTL_SECONDS`, default 7 days). Returns `{token, bundle_url, replay_url}` — `bundle_url` is the VS `GET /v1/replay?token=…` URL (built from `VS_PUBLIC_BASE` or the request base); `replay_url` is `${WEB_VIEWER_BASE_URL}/?replay=<encoded bundle_url>` when `WEB_VIEWER_BASE_URL` is set, else null. Implemented in [`api/replay_links.py`](src/viewer_service/api/replay_links.py).
  - **`POST /v1/deployments/{id}/sessions/{sid}/replay-link/revoke`** — researcher-gated. Upserts a `replay_revocation` row (`revoked_at = now()`) for the session. Returns `{revoked_at}`. Implemented in [`api/replay.py`](src/viewer_service/api/replay.py); store in [`store/replay_revocation.py`](src/viewer_service/store/replay_revocation.py).
  - **`GET /v1/replay?token=<signed>`** — no auth (the token is the capability). Verifies the HMAC + expiry (401 on bad/expired token or empty secret), re-checks the token's session belongs to the token's deployment (404), then checks `replay_revocation`: a token whose `iat` predates the session's `revoked_at` gets `401 replay_link_revoked` (a token minted *after* a revoke still works — revoke invalidates only prior links). Otherwise assembles and returns the RP1 bundle `{runtime, statements, mouse}` from `session_runtime` + the session's `events`/`recording` outbox rows. Implemented in [`api/replay.py`](src/viewer_service/api/replay.py); per-session readers in [`store/export.py`](src/viewer_service/store/export.py).
  - New table `replay_revocation` (session_id PK, deployment_id, revoked_at) via `viewer-service migrate`; reuses the invite HMAC pattern and `session_runtime` otherwise. New config: dedicated `REPLAY_SIGNING_SECRET` (falls back to `invite_signing_secret`), `WEB_VIEWER_BASE_URL` (player origin), `REPLAY_LINK_TTL_SECONDS`.
- **OD-13 forwarder** — `viewer-service forward-worker --once|--loop` ships outbox rows to Behaverse (TLS + SHA-256 + bearer); session → `forwarded` once `submitted` + all rows shipped.
- **Auth split** — control-plane (deployment CRUD, viewers, themes, mint, export, metrics) is Identity-gated (`require_researcher` / `require_admin` for cache purge); the participant path (`/v1/sessions/*`, scorer wasm, `/healthz`) stays anonymous/session-token. [`identity.py`](src/viewer_service/api/identity.py), [`deps.py`](src/viewer_service/api/deps.py).

## Run & test
```bash
source .venv/bin/activate
# Tests (260; testcontainers Postgres; DOCKER_CONFIG override REQUIRED;
# run viewer-service/ in its OWN pytest invocation — NOT combined with library/):
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q

# Local run:
pip install -e ../questionnaire-runtime-denormaliser   # denormaliser dep (editable)
pip install -e .[dev]
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
viewer-service migrate                                 # also seeds built-in themes
export LIBRARY_BASE_URL=http://localhost:8000          # a running Library
export VS_CORS_ORIGINS=http://localhost:5173,...       # MUST list EVERY frontend origin
uvicorn viewer_service.api.app:create_app --factory --reload
```
- Control-plane requests fail closed (401) unless `IDENTITY_JWKS_URL` / `IDENTITY_ISSUER` point at a running `identity-service`. Get a token via `identity create-admin` then `identity login`.
- `invite_link` mode needs `INVITE_SIGNING_SECRET` (else mint 503 / verify fail-closed). In-session scoring needs `VS_SCORER_DIR` + `VS_SCORER_MAP` + `VS_PUBLIC_BASE` (README VS-E section).
- Forwarder env: `BEHAVERSE_BASE_URL` + `BEHAVERSE_BEARER_TOKEN`.

## What's left to do
The service is feature-complete for Phase 2; everything below is deferred or blocked. Verify against [FOLLOWUPS.md](FOLLOWUPS.md) before picking up.

**Now (small, self-contained, no external blocker)**
- **Shared TTL reaper.** No sweeper exists for the outbox (forwarded/failed rows kept forever), demo/ephemeral `session` rows, or `abandoned`-on-timeout in_progress sessions — all grow unbounded. Build an age-based pruning job and **coordinate the schedule/semantics with Identity's reaper** (handoff/email/refresh tokens). Document what the participant "my data" export can still guarantee once pruning runs. (VS-B / VS-C / PP-C FOLLOWUPS.)
- **`session_index` concurrent-mint race.** Computed as `count(prior sessions)+1`, not serialised — two near-simultaneous mints can collide. Fix with `SELECT ... FOR UPDATE` or a per-participant counter if collision-free indices are required. (PP-A FOLLOWUPS.)
- **Library client resilience.** No retry/backoff on transient Library 5xx (just 502 passthrough); add before production load. (VS-A FOLLOWUPS.)

**Next**
- **Metrics dashboard transport.** Snapshot JSON metrics exist; the 08a **SSE live stream** and **per-question abandonment hotspots** (needs event-level telemetry) are deferred until a dashboard UI consumes them. (VS-E FOLLOWUPS.)
- **Catalogue scale.** No pagination/search/filter; N+1 count query per candidate; no "study full" status badge (full deployments silently drop out). Fine at handful-of-deployments scale. (PP-D FOLLOWUPS.)
- **Auto-fill title from Library + human titles in `/v1/me/sessions`** (cross-service Library lookup + caching). (PP-D / PP-C FOLLOWUPS.)
- **Cache LRU under concurrency** (best-effort `DELETE ... OFFSET`; can momentarily exceed cap) — advisory lock / sweeper if it matters. (VS-A FOLLOWUPS.)

**Deferred / blocked**
- 🔒 **Per-record deployment ownership** — `created_by` is stored but not checked; any authorized researcher can operate on any deployment. Needs project scoping → **ID-D**. (ID-B FOLLOWUPS.)
- 🔒 **`editor_session` / `platform_session` mode presets** — rejected with 422 today; mint-time enforcement deferred to **ID-D (editor) / Phase 5 (platform)**. Other non-`none`-auth presets (access_code/platform_study/embedded/kiosk/preview) likewise blocked on **Identity/Platform/OD-08**. (ID-B / VS-C FOLLOWUPS.)
- 🔒 **`validated` state + Behaverse reconciliation** — VS stops at `forwarded`; `validated` is a no-op stub. Needs a Behaverse validation callback / query endpoint that doesn't exist → **Behaverse-side**. (VS-B / VS-D FOLLOWUPS.)
- **Participant data erasure** (`DELETE /v1/me…`), **JSON export**, **events/codebook/Parquet/SPSS exports**, **single-use + bulk invites**, **invite→account-attach**, **scorer_outputs forwarding (SP3)** + **scorer storage in Library**, **full consent lifecycle (versioned/withdrawal)** — all deferred (see FOLLOWUPS by section).

**Done — do NOT re-open:** the unsupported-locale path is **fixed** (denormaliser `PreflightError` → clean **422**, not a 500 dead-end; see the 2026-06-23 FOLLOWUPS note). Identity gating of the control-plane (ID-B) is done.

## Conventions & gotchas
- **Run `viewer-service/` tests in their OWN pytest invocation** — never combine with `library/` (separate testcontainers Postgres). `DOCKER_CONFIG=/tmp/lib_docker` is required.
- `VS_CORS_ORIGINS` must list **every** frontend origin (per-origin CORS): library-web, editor, participant-app (portal :5174), web-viewer (player :5173). Test the actual browser request, not the raw API.
- Restart the service after merging changes (Python services don't hot-reload in deploy).
- Canonical content is already live on Supabase (222 Qs) — **do not re-import**.
- Hard-pin Library refs `@vYY.MMDD`; never silently upgrade. CalVer `vYY.MMDD` everywhere.
- Finish branches by **merging to master locally + pushing — no PRs.** `git fetch` + ff/rebase before pushing.

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md)
- Design: [design/08a_viewer_service.md](../design/08a_viewer_service.md) · [design/08_viewer.md](../design/08_viewer.md) · [design/05d_runtime.md](../design/05d_runtime.md) · [design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md) · [design/05e_events_vocabulary.md](../design/05e_events_vocabulary.md)
- Sibling: `identity-service/` (auth gate) · `questionnaire-runtime-denormaliser/` (Schema 2→3) · `web-viewer/` (player) · `participant-app/` (portal)
- Manual e2e: [docs/testing-participant-flow.md](../docs/testing-participant-flow.md)
- System-wide context: root [HANDOFF.md](../HANDOFF.md)
