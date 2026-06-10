# Viewer Service VS-B (Sessions + Submission + Forwarding) — Design Spec

**Date drafted:** 2026-06-10
**Author:** Viewer Service VS-B brainstorming session (2026-06-10)
**Component:** **Viewer Service**, sub-project **VS-B** — the second of three stages (VS-A runtime generation core ✅ → **VS-B sessions + submission + forwarding** → VS-C deployment management + monitoring + theming). VS-B is the **participant data path**: it mints sessions, accepts responses + events, and forwards them to Behaverse via the OD-13 durable outbox.
**Target repo:** `questionnaire-viewer-service` — VS-B **extends the existing `viewer-service/` package** (new modules + tables + routes; not a new package).
**Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3, `jsonb`) · `httpx` (Behaverse sink) · `jsonschema` + `referencing` (Schema 5/4a validation) · the `denormaliser` package (reused via VS-A) · pytest + testcontainers. New stdlib use: `secrets` + `hashlib` (session tokens).
**Authoritative source documents:**

- [design/08a_viewer_service.md](../../../design/08a_viewer_service.md) — §"Sessions" (minting, resume rules), §"Submission brokering" (response/event endpoints, OD-13 outbox, two-tier bounds, transport security, pluggable sink).
- [design/04_architecture.md](../../../design/04_architecture.md) §"Session lifecycle" — the state machine `in_progress → completed → submitted → forwarded → validated` (+ `abandoned`).
- **OD-13** (queued forwarding via Postgres outbox; lifecycle split; transport security; pluggable sink; two-tier bounds) and **OD-14** (session resume) — see [design/10_open_decisions.md](../../../design/10_open_decisions.md) + the `project_forwarding_queued` / `project_session_resume_resolved` memories.
- [docs/superpowers/specs/2026-06-10-viewer-service-vs-a-design.md](2026-06-10-viewer-service-vs-a-design.md) — VS-A, which VS-B extends (`mint_runtime`, `resolve_locale`, stores, `runtime_cache`, `library_client`, exported `canonical_hash`).
- [schemas/response/schema.json](../../../schemas/response/schema.json) — Schema 5 (`oneOf [Response, ResponseSet]`; ResponseSet = `{session_id, responses[]}`).
- [schemas/events/schema.json](../../../schemas/events/schema.json) — Schema 4a (`oneOf [Event, EventBatch]`).
- [schemas/session/schema.json](../../../schemas/session/schema.json) — Schema 6 (the session-metadata fields VS-B's `session` table mirrors).

**VS-B** turns the runtime-minting spine (VS-A) into a live data path: a participant opens a deployment → VS-B mints a **session** (+ opaque token + Schema 3 runtime), the viewer streams **responses** (Schema 5) and **events** (Schema 4a) which VS-B durably buffers in a **Postgres outbox**, and a **forwarder worker** ships them to **Behaverse** (a pluggable sink) with retry/back-off — driving the session through `submitted → forwarded`.

---

## 1 — Scope

### 1.1 In scope
- Two new Postgres tables: **`session`** (Schema 6 fields + `token_hash`) and **`outbox`** (durable submission queue).
- **Session minting** — `POST /v1/sessions/new` for the anonymous (`auth: none`) preset: generates an anonymous `agent_id`, mints the Schema 3 runtime via VS-A's `mint_runtime`, allocates a `session_id` (uuid4) + an **opaque random session token** (stored only as its SHA-256), returns `{session_id, session_token, runtime}`.
- **Session token auth** — a FastAPI dependency validating `Authorization: Bearer <token>` against `session.token_hash` on every per-session request (401 on miss).
- **Core resume (OD-14 sub-q3 + sub-q6)** — `GET /v1/sessions/{id}` (status + `last_active_locale` + outbox counts) and `GET /v1/sessions/{id}/runtime` (Schema 3 in `last_active_locale`); the deployment's questionnaire ref is already version-pinned, so resume is automatically against the pinned version. **Locale switch** — `POST /v1/sessions/{id}/locale` re-mints the runtime in the new locale and updates `last_active_locale`.
- **Submission endpoints** — `POST /v1/sessions/{id}/responses` (Schema 5) and `POST /v1/sessions/{id}/events` (Schema 4a): validate, write an `outbox` row (with `payload_sha256`) in one transaction, return **202**. `POST /v1/sessions/{id}/complete` transitions the session to `submitted`.
- **Lifecycle subset** — `in_progress → submitted → forwarded`. (`completed` collapses into `submitted` for MVP.)
- **OD-13 forwarding** — `process_outbox_batch(conn, sink, ...)` claiming due rows with `FOR UPDATE SKIP LOCKED`, exponential back-off, `max_attempts → failed`; a session with zero remaining pending/failed rows + `submitted` → `forwarded`. A **`Sink`** interface + **`HTTPBehaverseSink`** (POST with per-submission SHA-256 header + bearer token over TLS). A **`viewer-service forward-worker`** CLI (`--once` / `--loop --interval N`).
- **Two-tier outbox bounds (OD-13)** — hard cap → submissions refused with **503** at `outbox_hard_threshold`; soft threshold logged + exposed in status. Both config-tunable.
- New config: `BEHAVERSE_BASE_URL`, `BEHAVERSE_BEARER_TOKEN`, `OUTBOX_SOFT_THRESHOLD`, `OUTBOX_HARD_THRESHOLD`, `FORWARD_MAX_ATTEMPTS`, `FORWARD_BATCH_SIZE`.

### 1.2 Non-goals (deferred to VS-C / later / Phase 6)
- **No behavioural-channel attachments** — Schema 4b mouse/keyboard *capture* is Phase 6 per the roadmap; no `POST /sessions/{id}/channels/{name}` here.
- **No researcher / Identity auth** — session tokens cover the participant↔VS channel only; deployment CRUD + admin endpoints stay open (gated when Identity lands, OD-08).
- **No `validated` state, no Behaverse reconciliation** — VS-B stops at `forwarded` (sink 2xx). `validated` needs Behaverse validation feedback (a callback / reconciliation poll) → VS-C/later.
- **No `abandoned`-on-timeout** — a session-timeout sweeper is later.
- **No `active_until` / quota / ephemeral-deployment resume rules** (OD-14 sub-q4 + sub-q5) — these need deployment lifecycle/date/mode fields VS-C owns; VS-B treats every deployment as persisted + always-open.
- **No monitoring dashboard / alerting UI** (VS-C) — VS-B exposes raw counts via the status endpoint; the dashboard + threshold alert banner are VS-C.
- **No mTLS / end-to-end encryption** — TLS (https) + SHA-256 + bearer for MVP; mTLS + E2E deferred per OD-13.

---

## 2 — Module layout (additions to `viewer-service/`)

```
viewer-service/src/viewer_service/
├── config.py                       # (modify) + Behaverse + outbox-threshold + forward settings
├── tokens.py                       # NEW: mint_token() + hash_token()
├── models.py                       # (modify) + SessionNew, LocaleSwitch request models
├── sessions.py                     # NEW: session-mint + resume orchestration (wraps VS-A mint_runtime)
├── submission.py                   # NEW: validate + enqueue responses/events; complete; bounds check
├── forwarding.py                   # NEW: process_outbox_batch + backoff + session-forwarded aggregate
├── sinks.py                        # NEW: Sink protocol + HTTPBehaverseSink
├── store/
│   ├── schema.sql                  # (modify) + session + outbox DDL
│   ├── sessions.py                 # NEW: session insert/get/update-state/update-locale
│   └── outbox.py                   # NEW: enqueue / claim-due / mark-forwarded / mark-failed / depth / counts
├── api/
│   ├── deps.py                     # (modify) + require_session token-auth dependency
│   ├── app.py                      # (modify) + sessions + submission routers
│   ├── sessions.py                 # NEW: /sessions/new, GET /sessions/{id}, /runtime, /locale
│   └── submission.py               # NEW: /sessions/{id}/responses, /events, /complete
└── cli.py                          # (modify) + forward-worker subcommand
tests/
├── test_tokens.py
├── test_outbox_store.py            # enqueue/claim SKIP-LOCKED/counts/depth
├── test_forwarding.py              # batch forward, retry/backoff, max_attempts, session aggregate
├── test_sinks.py                   # HTTPBehaverseSink via httpx.MockTransport
├── test_sessions_api.py            # mint, resume, locale switch, token auth
└── test_submission_api.py          # responses/events enqueue, complete, Schema validation, hard-cap 503
```

---

## 3 — Data model (new tables)

```sql
CREATE TABLE IF NOT EXISTS session (
  session_id             uuid PRIMARY KEY,
  session_index          bigint NOT NULL,
  deployment_id          text NOT NULL,
  viewer_id              text NOT NULL,          -- viewer used at mint (so resume/locale-switch re-mint with the same manifest)
  viewer_version         text NOT NULL,
  agent_id               text NOT NULL,
  instrument_id          text NOT NULL,
  instrument_version     text NOT NULL,
  status                 text NOT NULL,          -- in_progress | submitted | forwarded
  token_hash             text NOT NULL,          -- sha256(session_token)
  initial_locale         text NOT NULL,
  last_active_locale     text NOT NULL,
  started_at             timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,
  submitted_at           timestamptz,
  forwarded_at           timestamptz,
  forward_attempts       int NOT NULL DEFAULT 0,
  forward_failure_reason text,
  device                 jsonb
);
CREATE INDEX IF NOT EXISTS session_token_idx ON session (token_hash);
CREATE INDEX IF NOT EXISTS session_deployment_idx ON session (deployment_id);

CREATE TABLE IF NOT EXISTS outbox (
  id              bigserial PRIMARY KEY,
  session_id      uuid NOT NULL REFERENCES session (session_id),
  kind            text NOT NULL,                 -- responses | events
  payload         jsonb NOT NULL,                -- Schema 5 ResponseSet | Schema 4a (Event|EventBatch)
  payload_sha256  text NOT NULL,                 -- canonical_hash(payload) — tamper detection
  status          text NOT NULL DEFAULT 'pending', -- pending | forwarded | failed
  attempts        int NOT NULL DEFAULT 0,
  last_error      text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  forwarded_at    timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_due_idx ON outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS outbox_session_idx ON outbox (session_id);
```

`payload_sha256` reuses the denormaliser's `canonical_hash` (same deterministic JSON hash). `session_index` is the per-agent counter (OD-17); anonymous deployments mint a fresh `agent_{uuid8}` per session, so it is `1`.

---

## 4 — Session minting & resume

**`POST /v1/sessions/new`** — body `{deployment_id, viewer_id, viewer_version, locale?}`:
1. Load deployment (404) + viewer (404). *(VS-B treats every deployment as active; windows/quota → VS-C.)*
2. `auth: none` → `agent_id = "agent_" + uuid4().hex[:8]`.
3. `locale = resolve_locale(body.locale, available=deployment.available_locales, default=deployment.default_locale)` (VS-A).
4. `runtime = mint_runtime(conn, deployment, viewer, locale)` (VS-A; raises `PreflightError` → 422, `LibraryError` → its status).
5. Allocate `session_id = uuid4()`; `token = tokens.mint_token()`; insert `session` row (`status=in_progress`, `viewer_id`/`viewer_version` from the request, `initial_locale=last_active_locale=locale`, `instrument_id`/`instrument_version` parsed from `deployment.questionnaire_ref`, `session_index=1`, `token_hash=hash_token(token)`).
6. Return `{session_id, session_token: token, runtime}`. (The plaintext token is returned **once**, never stored.)

**Token auth** — `require_session(session_id, authorization header) -> session_row`: hash the bearer token, `SELECT ... WHERE session_id=%s AND token_hash=%s`; 401 if no row.

**Resume (OD-14 core)** — `GET /v1/sessions/{id}` (token) → `{status, last_active_locale, outbox:{pending,forwarded,failed}}`. `GET /v1/sessions/{id}/runtime` (token) → the Schema 3 runtime in `last_active_locale`, re-minted via `mint_runtime` using the deployment + the **viewer stored on the session** (`session.viewer_id`/`viewer_version`); the deployment ref is version-pinned and the runtime cache key is unchanged, so resume returns the same cached runtime.

**Locale switch (OD-14 sub-q6 + OD-18b)** — `POST /v1/sessions/{id}/locale` (token) `{locale}`: validate `locale ∈ deployment.available_locales`, update `session.last_active_locale`, re-mint the runtime in the new locale (deployment + the session's stored viewer), return `{runtime}`.

---

## 5 — Submission & lifecycle

- **`POST /v1/sessions/{id}/responses`** (token) — body is Schema 5 (`Response` | `ResponseSet`); validate against Schema 5. **Bounds check**: if `outbox` depth ≥ `OUTBOX_HARD_THRESHOLD` → **503** `{error.code: "service_unavailable"}`. Else, in one transaction, `outbox.enqueue(conn, session_id, "responses", payload, canonical_hash(payload))`. Return **202** `{enqueued: <outbox_id>}`. Session stays `in_progress`.
- **`POST /v1/sessions/{id}/events`** (token) — same, validated against Schema 4a, `kind="events"`.
- **`POST /v1/sessions/{id}/complete`** (token) — set `status='submitted'`, `completed_at = submitted_at = now()`. (After this the session is eligible to reach `forwarded` once its outbox drains.)

The session is owned by VS-B; the viewer reports transitions, VS-B records them. The `submitted → forwarded` transition is performed by the forwarder (§6), not the request path.

---

## 6 — Forwarding subsystem (OD-13)

**`process_outbox_batch(conn, sink, *, batch_size, max_attempts, backoff)`** → returns a summary `{forwarded, failed, retried}`:
1. Claim up to `batch_size` due rows: `SELECT ... WHERE status='pending' AND next_attempt_at<=now() ORDER BY id LIMIT %s FOR UPDATE SKIP LOCKED`.
2. For each row: re-verify `payload_sha256 == canonical_hash(payload)` (tamper check); call `sink.send(kind, payload)`.
   - **Success** → `status='forwarded'`, `forwarded_at=now()`.
   - **Failure** (`SinkError`) → `attempts+=1`, `last_error=<msg>`; if `attempts >= max_attempts` → `status='failed'`; else `next_attempt_at = now() + backoff(attempts)` (e.g. `min(2**attempts, 3600)` seconds).
3. After the batch, for each affected `session_id`: if the session is `submitted` and has **no** `pending`/`failed` outbox rows → `status='forwarded'`, `forwarded_at=now()`; if it has `failed` rows, set `forward_failure_reason` (visible in status) but leave the session `submitted`.

**Sinks** (`sinks.py`):
- `class SinkError(Exception)` — transient/permanent forwarding failure.
- `Sink` protocol: `send(kind: str, payload: dict) -> None` (raises `SinkError` on non-2xx / transport error).
- `HTTPBehaverseSink(base_url, bearer_token, *, client=None)` — `POST {base_url}/{kind}` with headers `Authorization: Bearer ...` + `X-Payload-SHA256: <hash>`, JSON body = payload; non-2xx / transport error → `SinkError`. `client` injectable for tests.
- A test `FakeSink` (configurable to succeed / fail / fail-N-times) lives in the tests.

**CLI** (`cli.py`): `viewer-service forward-worker [--once | --loop --interval N]` — builds an `HTTPBehaverseSink` from config and calls `process_outbox_batch` (once, or on an interval). `--once` is the cron/test entry; `--loop` is the daemon entry. Deployment-agnostic (cron, systemd, k8s sidecar, or a serverless scheduled invoke).

**Transport security (OD-13 MVP subset):** TLS assumed (https sink URL); per-submission SHA-256 (stored + sent as a header, re-checked by Behaverse); service-to-service bearer token. mTLS + E2E encryption deferred.

---

## 7 — Error handling

| Condition | HTTP | `error.code` |
|---|---|---|
| Unknown deployment / viewer (mint) | 404 | `not_found` |
| `PreflightError` from `mint_runtime` | 422 | `preflight_failed` |
| Library 410 (withdrawn) / unreachable | 410 / 502 | `gone` / `upstream_unavailable` |
| Missing / bad session token | 401 | `unauthorized` |
| Unknown session | 404 | `not_found` |
| Response/event body fails Schema 5 / 4a | 422 | `invalid_submission` |
| Outbox at hard cap | 503 | `service_unavailable` |
| Locale not in deployment.available_locales (switch) | 422 | `invalid` |

Envelope `{error:{code,message,detail?}}` (mirrors VS-A / `library/`). A `401` handler is added to VS-A's `_CODE_FOR` map.

---

## 8 — Testing (TDD)

- **Unit:** `tokens` (mint entropy + hash determinism); `backoff(attempts)`; `outbox` store (enqueue, claim due with `SKIP LOCKED`, depth, per-session counts); the session-forwarded aggregate.
- **Sinks:** `HTTPBehaverseSink` via `httpx.MockTransport` — 2xx → ok; 5xx / connect-error → `SinkError`; asserts the `Authorization` + `X-Payload-SHA256` headers + correct path per `kind`.
- **Forwarding (testcontainers):** enqueue rows → `process_outbox_batch(FakeSink ok)` → all `forwarded`; FakeSink failing → row `pending` with `attempts=1` + future `next_attempt_at`; after `max_attempts` → `failed`; a `submitted` session with all rows forwarded → session `forwarded`; a session with a `failed` row stays `submitted` with `forward_failure_reason`.
- **Sessions API (testcontainers):** `/sessions/new` (mock Library bundle, as VS-A's runtime test) → `{session_id, session_token, runtime}`; token auth 401 on bad/missing token; resume `GET /sessions/{id}` + `/runtime` (returns runtime in `last_active_locale`); locale switch updates `last_active_locale` + re-mints.
- **Submission API (testcontainers):** valid responses/events → 202 + outbox row (with sha256); Schema-invalid body → 422; `complete` → `submitted`; hard-cap → 503.
- **Verification gate** (run each suite separately): `viewer-service/` green (VS-A 26 + VS-B additions); `library/` 126; `questionnaire-runtime-denormaliser/` 56; `tools/tests` 309 — all unaffected.

---

## 9 — Decisions locked in this session (2026-06-10)

| # | Decision | Choice |
|---|---|---|
| D1 | Forwarder execution | **Batch function + CLI worker** (`process_outbox_batch` + `forward-worker --once/--loop`) — testable, deployment-agnostic; no in-process API coupling. |
| D2 | Session token | **Opaque random token, stored hashed** (sha256); validate by lookup. No JWT. |
| D3 | Resume scope | **Core resume now** (in_progress against pinned version + `last_active_locale`); `active_until`/ephemeral/quota → VS-C. |
| D4 | Lifecycle subset | `in_progress → submitted → forwarded`; `validated`/`abandoned` deferred. |
| D5 | Attachments | **Out of scope** — Schema 4b channel capture is Phase 6. |
| D6 | Transport security | TLS + per-submission SHA-256 + bearer for MVP; mTLS + E2E deferred (OD-13). |
| D7 | Sink | `Sink` interface + `HTTPBehaverseSink`; `FakeSink` in tests. Real Behaverse wiring is deployment config. |
