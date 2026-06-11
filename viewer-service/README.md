# questionnaire-viewer-service (VS-A: runtime generation core)

FastAPI + Postgres service that mints **cached Schema 3 runtimes** by calling the
`questionnaire-runtime-denormaliser`, reading questionnaire + entity bodies from the
**Library** over HTTP. VS-A is the runtime-generation spine; sessions, submission
forwarding (OD-13), and deployment-management UX arrive in VS-B / VS-C.

## Endpoints (`/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /viewers` | Register a viewer by POSTing its Schema 7 manifest (validated + hashed). |
| `GET /viewers/{id}/{version}` | Fetch a stored manifest. |
| `POST /deployments` | Create a minimal deployment (questionnaire_ref + runtime_policy + locales). |
| `GET /v1/deployments` | List deployment summaries. |
| `PATCH /v1/deployments/{id}` | Narrow update — `active_until` and/or `quota` only. |
| `GET /v1/deployments/{id}/export.csv` | Stream a BDM-native CSV of all collected responses for the deployment (UC-11). |
| `GET /deployments/{id}` | Fetch a deployment. |
| `POST /deployments/{id}/runtime` | Mint (or return cached) Schema 3 for `{viewer_id, viewer_version, locale?}`. |
| `POST /v1/sessions/new` | Mint a session for a deployment → `{session_id, session_token, runtime}`. |
| `GET /v1/sessions/{id}` | (Bearer session token) status + last_active_locale + outbox counts (resume read). |
| `GET /v1/sessions/{id}/runtime` | (token) Schema 3 runtime in the session's last_active_locale. |
| `POST /v1/sessions/{id}/locale` | (token) switch locale → re-minted runtime. |
| `POST /v1/sessions/{id}/responses` · `/events` | (token) submit Schema 5 / Schema 4a → enqueued to the outbox (202). |
| `POST /v1/sessions/{id}/complete` | (token) mark the session submitted. |
| `DELETE /runtime_cache[?deployment_id=]` | Admin purge (OD-18f). |
| `GET /healthz` | Health. |

The runtime cache is keyed by the OD-18f 5-tuple `(qst_id, qst_version, locale,
viewer_conformance_hash, deployment_runtime_policy_hash)` with LRU eviction.

## Development

```bash
source ../.venv/bin/activate
pip install -e ../questionnaire-runtime-denormaliser   # denormaliser dep (editable)
pip install -e .[dev]
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
viewer-service migrate
export LIBRARY_BASE_URL=http://localhost:8000          # a running Library
uvicorn viewer_service.api.app:create_app --factory --reload
```

Tests (testcontainers needs the Docker config override, same as `library/`):
```bash
DOCKER_CONFIG=/tmp/lib_docker pytest -q
```

## Forwarding worker (OD-13)

Submissions are buffered in a durable Postgres `outbox` and shipped to Behaverse by a
separate worker:

```bash
export BEHAVERSE_BASE_URL=https://behaverse.example/ingest
export BEHAVERSE_BEARER_TOKEN=...
viewer-service forward-worker --once          # one batch (cron / scheduled invoke)
viewer-service forward-worker --loop --interval 5   # daemon
```

A session reaches `forwarded` once it is `submitted` and all its outbox rows are forwarded.

## Deployment modes & lifecycle (VS-C)

`POST /deployments` takes a `mode_preset` (default `anonymous_link`; `demo` also supported —
other presets require Identity/Platform and are rejected with 422). The preset resolves to the
four orthogonal dimensions (auth/persistence/lifecycle/rendering_context). At `/sessions/new` the
active window (`active_from`/`active_until`) and a per-deployment `quota.max_sessions` are enforced:
minting past `active_until` → `410`, before `active_from` or over quota → `409`. **Demo (ephemeral)**
deployments mint sessions whose submissions are validated but never forwarded ("no data leaves VS"),
and which refuse resume (`409 ephemeral_no_resume`). Resume of an in-progress session is allowed even
after `active_until` (asymmetric, OD-14).
