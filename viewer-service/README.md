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
| `GET /v1/deployments/{id}/metrics` | Per-deployment monitoring snapshot (UC-12): active/completion/quota/recent + forwarding alert. |
| `POST /v1/themes` · `GET /v1/themes` · `GET /v1/themes/{id}` | Theme infrastructure (UC-13 infra): create (WCAG-AA-checked), list, get. |
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

## Authentication

The **control-plane** (deployment CRUD, viewer registry, theme writes, runtime mint,
`export.csv`, and metrics) requires a valid Identity access token (Bearer JWT) issued by
the sibling `identity-service`.  The token must carry at least one of the roles
`researcher`, `reviewer`, or `administrator`.

`DELETE /runtime_cache` is stricter: it requires the `administrator` role.

The **participant path** (`/v1/sessions/*`) and `GET /v1/scorers/{ref}/impl.wasm` are
intentionally **anonymous** — no token is required or checked.

`GET /healthz` is also anonymous.

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `IDENTITY_JWKS_URL` | JWKS endpoint of the identity-service (e.g. `http://localhost:9000/.well-known/jwks.json`) | — (required for auth) |
| `IDENTITY_ISSUER` | Expected `iss` claim in the JWT | — (required for auth) |
| `IDENTITY_AUDIENCE` | Expected `aud` claim in the JWT | `questionnaire-apps` |

The control-plane gate is **always active** — there is no "disable auth" mode. If
`IDENTITY_JWKS_URL` / `IDENTITY_ISSUER` are unset, the gate falls back to the localhost
defaults; control-plane requests then **fail closed** (token verification cannot reach a real
JWKS, so they return `401`). For local development, run the sibling `identity-service` and point
these vars at it.

### Obtaining a token

Use the sibling `identity-service`:

```bash
identity create-admin          # first-time setup
identity login                 # prints a Bearer token
```

Pass the token as `Authorization: Bearer <token>` on every control-plane request.

## Development

```bash
source ../.venv/bin/activate
pip install -e ../questionnaire-runtime-denormaliser   # denormaliser dep (editable)
pip install -e .[dev]
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
viewer-service migrate
export LIBRARY_BASE_URL=http://localhost:8000          # a running Library
export VS_CORS_ORIGINS=http://localhost:5173           # allow the web-viewer dev server
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

## Monitoring & theming (VS-E)

`GET /deployments/{id}/metrics` returns a JSON snapshot (poll it; SSE is deferred until a dashboard
UI exists). `/themes` stores theme bundles; `POST /themes` runs a WCAG-AA check (palette text colours
>= 4.5:1 vs background + base_size >= 14) and blocks save on failure. `viewer-service migrate` seeds
the built-in themes (`default`, `institutional_blue`, `institutional_green`). `/sessions/new` returns
the deployment's resolved `theme` bundle (or null) for the viewer to apply.

## Deployment modes & lifecycle (VS-C)

`POST /deployments` takes a `mode_preset` (default `anonymous_link`; `demo`, `authenticated`,
and `invite_link` also supported — other presets require Identity/Platform and are rejected with
422). The preset resolves to the four orthogonal dimensions
(auth/persistence/lifecycle/rendering_context). At
`/sessions/new` the active window (`active_from`/`active_until`) and a per-deployment
`quota.max_sessions` are enforced: minting past `active_until` → `410`, before `active_from` or
over quota → `409`. **Demo (ephemeral)** deployments mint sessions whose submissions are validated
but never forwarded ("no data leaves VS"), and which refuse resume (`409 ephemeral_no_resume`).
Resume of an in-progress session is allowed even after `active_until` (asymmetric, OD-14).

### `invite_link` mode (PP-B)

Deployments created with `mode_preset: "invite_link"` allow access via **stateless
HMAC-signed invite tokens** — no Identity login is required. Invites are multi-use until
they expire.

**Minting an invite (researcher):**

```
POST /v1/deployments/{id}/invites
Authorization: Bearer <researcher token>
Content-Type: application/json

{ "participant_id": "alice", "ttl_seconds": 86400 }   # ttl_seconds is optional
```

Returns `201`:

```json
{
  "invite_token": "<signed token>",
  "participant_id": "alice",
  "deployment_id": "dep_...",
  "expires_at": "2026-06-23T12:00:00Z",
  "url": "/v1/invites/<signed token>"
}
```

The `url` field is relative unless `VS_PUBLIC_BASE` is set (e.g.
`VS_PUBLIC_BASE=https://viewer.example` → `url` becomes an absolute URL).

Returns `404` if the deployment does not exist or is not `invite_link` mode, `422` on bad
input, `503` if `INVITE_SIGNING_SECRET` is not configured.

**Redeeming an invite (participant):**

`POST /v1/sessions/new` with the `invite` field in the request body:

```json
{ "deployment_id": "dep_...", "invite": "<invite_token>" }
```

- If the invite is valid and unexpired: the session is minted and tagged
  `participant_sub = "invite:<participant_id>"` (namespaced to distinguish invite participants
  from Identity-backed participants). `agent_id` = `<participant_id>`;
  `session_index` = count of prior invite sessions for this `participant_sub` + 1.
- If the invite is invalid, expired, or bound to a different deployment: `401 invite_required`.
- If `INVITE_SIGNING_SECRET` is unset: the verify call returns `None` → `401 invite_required`
  (fail-closed).

`anonymous_link`, `demo`, and `authenticated` deployments do not accept the `invite` field.

**Configuration:**

| Variable | Description | Default |
|---|---|---|
| `INVITE_SIGNING_SECRET` | 32 + byte secret for HMAC-SHA256 signing. Required for `invite_link` mode. If unset, mint returns 503 and verify returns None (fail-closed). | — (required) |
| `INVITE_DEFAULT_TTL_SECONDS` | Default invite TTL if `ttl_seconds` is omitted at mint time. | `604800` (7 days) |
| `VS_PUBLIC_BASE` | Public base URL prepended to the `url` field on minted invites. If unset, `url` is relative. | — (optional) |

### `authenticated` mode (PP-A)

Deployments created with `mode_preset: "authenticated"` require the participant to hold a valid
Identity access token **at session-mint time**.

`POST /v1/sessions/new` for an `authenticated` deployment:

- Requires `Authorization: Bearer <Identity access token>` (audience `questionnaire-apps`,
  issued by the sibling `identity-service`).  Any valid token is accepted — role is not checked.
- Returns `401 { error: { code: "auth_required" } }` if no token is present or the token is
  invalid/expired.
- On success, tags the session with `participant_sub` (= the token's `sub` claim, which is
  the stable `agent_id` for this participant) and increments `session_index` per participant
  (count of prior sessions for this `participant_sub` + 1).
- The mint response includes `participant_sub` alongside the usual `session_id`,
  `session_token`, and `runtime`.

`anonymous_link` and `demo` deployments are unchanged — no `Authorization` header is required or
examined.
