# Viewer Service VS-A (Runtime Generation Core) — Design Spec

**Date drafted:** 2026-06-10
**Author:** Viewer Service VS-A brainstorming session (2026-06-10)
**Component:** **Viewer Service**, sub-project **VS-A** — the first of three stages (VS-A runtime generation core → VS-B sessions + submission + forwarding → VS-C deployment management + monitoring + theming). VS-A is the **first real consumer of `questionnaire-runtime-denormaliser`** and the spine the rest of the Viewer Service hangs off.
**Target repo:** `questionnaire-viewer-service` (built in the current folder under `viewer-service/` for now; mirrors `library/` / `questionnaire-runtime-denormaliser/`; migrates at the deferred repo split per [design/14_repository_topology.md](../../../design/14_repository_topology.md)).
**Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3, `jsonb`) · `httpx` (Library client) · `jsonschema` + `referencing` (Schema 7 validation) · the `denormaliser` package (sibling, installed editable) · pytest + testcontainers.
**Authoritative source documents:**

- [design/08a_viewer_service.md](../../../design/08a_viewer_service.md) — the Viewer Service component spec (deployments, sessions, runtime cache, etc.). VS-A implements the runtime-generation slice: §"Deployments" (minimal), §"Locale resolution", and the OD-18 runtime cache.
- [design/05d_runtime.md](../../../design/05d_runtime.md) — **OD-18**: the runtime pipeline, the 5-tuple cache key (18f), conformance manifest (18c), scorer-impl selection (18d). VS-A is the "Viewer Service" box in that doc's pipeline diagram.
- [docs/superpowers/specs/2026-06-10-runtime-denormaliser-design.md](2026-06-10-runtime-denormaliser-design.md) — the denormaliser VS-A consumes (its public `denormalise(...)` + `RuntimePolicy` + `PreflightError` + `canonical_hash`).
- [schemas/viewer_conformance/schema.json](../../../schemas/viewer_conformance/schema.json) — Schema 7 (viewer manifests VS-A stores + hashes).
- [schemas/runtime/schema.json](../../../schemas/runtime/schema.json) — Schema 3 (the denormaliser output VS-A caches).
- `library/src/library/` — the Library Core VS-A reads from over HTTP, and where the additive resolution-bundle endpoint (§5) is added.

**VS-A** is a FastAPI + Postgres service that, given a **deployment** (a version-pinned questionnaire + a runtime policy + locale defaults), a registered **viewer** (its Schema 7 conformance manifest), and a locale, produces a **Schema 3 runtime** by calling the `denormaliser` — caching the result under the OD-18f 5-tuple key. It reads questionnaire definitions + reusable-entity bodies from the **Library** over HTTP (never sharing its DB or importing its code).

---

## 1 — Scope

### 1.1 In scope
- A new `viewer-service/` Python package (FastAPI app + Postgres store + Library client), mirroring `library/` conventions.
- **Three Postgres tables**: `deployment` (minimal), `viewer_registry`, `runtime_cache`.
- **Viewer registry** — register a viewer by **POSTing its Schema 7 manifest** (validated against Schema 7, stored, hashed via `denormaliser.canonical_hash`). 1:1 `(viewer_id, viewer_version)` → manifest (OD-18c).
- **Minimal deployment** — create + get a deployment carrying `questionnaire_ref` (version-pinned), `runtime_policy` (the 6 OD-18f fields), `default_locale`, `available_locales`, nullable `theme_id`.
- **Runtime cache** — Postgres-backed, **OD-18f 5-tuple key**, `jsonb` Schema 3 value, **LRU eviction** (configurable cap, default 10 000), **admin purge API** (`DELETE /v1/runtime_cache[?deployment_id=]`).
- **Library client** (`httpx`) — fetch the resolution bundle for a `qst_{id}@version`.
- **Additive Library endpoint** `GET /v1/questionnaires/{id}/versions/{v}/resolution-bundle` (§5) — returns the un-resolved Schema 2 definition + a map of every transitively-referenced entity/scorer body.
- **Mint-runtime path** (§4) — the core flow: resolve locale → compute the 5-tuple key → cache hit returns; miss fetches the bundle, calls `denormalise(...)`, caches, returns. `PreflightError` → HTTP **422** carrying the problem list.
- **VS-A locale resolution** — deployment-level only: requested `locale` if ∈ `deployment.available_locales`, else `deployment.default_locale`. (Questionnaire-language availability is enforced downstream by the denormaliser's strict missing-locale check.)
- Endpoints: `POST/GET /v1/viewers`, `POST/GET /v1/deployments`, `POST /v1/deployments/{id}/runtime`, `DELETE /v1/runtime_cache`, `GET /healthz`. Error envelope `{error:{code,message,detail?}}` mirroring the Library.

### 1.2 Non-goals (deferred to VS-B / VS-C / later)
- **No sessions** — no session minting, tokens, validation, resume (OD-14), or session lifecycle. The mint-runtime endpoint is session-less; VS-B's `/sessions/new` will wrap the same runtime-gen function.
- **No submission brokering** — no responses/events/attachment endpoints, no outbox, no forwarding, no sinks, no transport-security hop signing (all OD-13 → VS-B).
- **No deployment management UX** — no modes/dimensions/presets beyond the stored fields, no quota, no `active_from`/`active_until`, no CRUD beyond create+get (→ VS-C).
- **No monitoring dashboard, no theming editor** (→ VS-C). `theme_id` is stored but unused.
- **No auth** — no Identity federation; all endpoints are open in VS-A (auth arrives with sessions/Identity later). Admin purge is unauthenticated for now (documented risk; gated when auth lands).
- **No URL-fetch manifest ingestion** (OD-18c variant) — direct POST only for now.
- **No browser/platform locale precedence** (Accept-Language, platform profile) — those need request/session context (→ VS-B).
- **No eager cache pre-warming** (OD-18f: lazy for MVP).

---

## 2 — Module layout

Built under `viewer-service/` (becomes `questionnaire-viewer-service` at reorg):

```
viewer-service/
├── pyproject.toml                  # dist: questionnaire-viewer-service; module: viewer_service
├── README.md
├── FOLLOWUPS.md
├── src/viewer_service/
│   ├── __init__.py
│   ├── config.py                   # env: DATABASE_URL, LIBRARY_BASE_URL, RUNTIME_CACHE_CAP, DENORMALISER_VERSION, SCHEMAS_DIR
│   ├── models.py                   # Pydantic request/response models
│   ├── hashing.py                  # re-exports denormaliser.canonical_hash (single source)
│   ├── store/
│   │   ├── schema.sql              # deployment + viewer_registry + runtime_cache DDL
│   │   ├── db.py                   # connection / pool helpers (mirror library/store)
│   │   ├── deployments.py          # deployment insert/get
│   │   ├── viewers.py              # viewer_registry insert/get
│   │   └── runtime_cache.py        # cache get/put + LRU evict + purge
│   ├── library_client.py           # httpx client: fetch_resolution_bundle(qid, version)
│   ├── manifests.py                # Schema 7 validation + hash
│   ├── locale.py                   # VS-A locale resolution (deployment-level)
│   ├── runtime.py                  # mint-runtime orchestration (the core flow)
│   ├── validation.py               # Schema 7 registry/validator (mirror library/denormaliser pattern)
│   ├── errors.py                   # error envelope + HTTPException helpers
│   ├── api/
│   │   ├── app.py                  # create_app() factory; routers; healthz
│   │   ├── viewers.py              # POST/GET /v1/viewers
│   │   ├── deployments.py          # POST/GET /v1/deployments
│   │   ├── runtime.py              # POST /v1/deployments/{id}/runtime
│   │   └── admin.py                # DELETE /v1/runtime_cache
│   └── cli.py                      # migrate (apply schema.sql); maybe `serve`
└── tests/
    ├── conftest.py                 # ephemeral Postgres (testcontainers) + app client + SCHEMAS_DIR
    ├── test_manifests.py
    ├── test_locale.py
    ├── test_runtime_cache.py       # key + LRU evict + purge
    ├── test_library_client.py      # httpx MockTransport
    ├── test_viewers_api.py
    ├── test_deployments_api.py
    └── test_runtime_api.py         # mint hit/miss, 422 on PreflightError, e2e against a seeded library
```

**Dependency on the denormaliser:** `denormaliser` is a runtime dependency installed editable in the same venv (not on PyPI). Dev/test setup: `pip install -e questionnaire-runtime-denormaliser/` then `pip install -e viewer-service/[dev]`. VS imports `from denormaliser import denormalise, RuntimePolicy, PreflightError, canonical_hash`. Postgres conventions mirror `library/` (psycopg 3; tests use testcontainers with `DOCKER_CONFIG=/tmp/lib_docker`).

---

## 3 — Data model (Postgres)

```sql
CREATE TABLE deployment (
  deployment_id     text PRIMARY KEY,            -- dep_{uuid8}
  questionnaire_ref text NOT NULL,               -- qst_{id}@vYY.MMDD
  runtime_policy    jsonb NOT NULL,              -- the 6 OD-18f fields (canonical dict)
  default_locale    text NOT NULL,
  available_locales jsonb NOT NULL,              -- ["en","pt"]
  theme_id          text,                        -- nullable, unused in VS-A
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE viewer_registry (
  viewer_id      text NOT NULL,
  viewer_version text NOT NULL,
  manifest       jsonb NOT NULL,                 -- Schema 7
  manifest_hash  text NOT NULL,                  -- canonical_hash(manifest), 64-hex
  registered_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_id, viewer_version)
);

CREATE TABLE runtime_cache (
  qst_id                         text NOT NULL,
  qst_version                    text NOT NULL,
  locale                         text NOT NULL,
  viewer_conformance_hash        text NOT NULL,
  deployment_runtime_policy_hash text NOT NULL,
  runtime                        jsonb NOT NULL, -- Schema 3
  deployment_id                  text NOT NULL,  -- for per-deployment purge
  created_at                     timestamptz NOT NULL DEFAULT now(),
  last_accessed_at               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)
);
CREATE INDEX runtime_cache_lru ON runtime_cache (last_accessed_at);
CREATE INDEX runtime_cache_dep ON runtime_cache (deployment_id);
```

**Hash consistency (critical).** On **deployment create**, the incoming `runtime_policy` is normalized through `RuntimePolicy(**input).to_canonical_dict()` before storage — so `deployment.runtime_policy` is *always* exactly the canonical 6-field dict (missing optional fields defaulted, extras rejected). `deployment_runtime_policy_hash = canonical_hash(runtime_policy_dict)` then uses that stored canonical dict. When VS calls the denormaliser it constructs `RuntimePolicy(**runtime_policy_dict)`; the denormaliser internally hashes `RuntimePolicy.to_canonical_dict()`, which yields the identical dict → identical hash. Likewise `viewer_conformance_hash = canonical_hash(manifest)` (stored at registration) equals the denormaliser's `provenance.viewer_conformance_hash`. Because `canonical_hash` sorts keys, the stored runtime's provenance hashes always match its own cache key — VS asserts this defensively after `denormalise` returns.

---

## 4 — The mint-runtime flow

`POST /v1/deployments/{deployment_id}/runtime` — body `{ "viewer_id": str, "viewer_version": str, "locale": str | null }`:

1. **Load deployment** → 404 if absent. Parse `questionnaire_ref` into `(qst_id, qst_version)`.
2. **Load viewer** from `viewer_registry` by `(viewer_id, viewer_version)` → 404 if absent. Read its `manifest` + `manifest_hash`.
3. **Resolve locale** (VS-A rule): `requested = body.locale`; `locale = requested if requested in deployment.available_locales else deployment.default_locale`.
4. **Compute key**: `(qst_id, qst_version, locale, viewer_conformance_hash=manifest_hash, deployment_runtime_policy_hash=canonical_hash(runtime_policy))`.
5. **Cache lookup**. Hit → `UPDATE last_accessed_at = now()`, return `runtime` (200).
6. **Miss**:
   a. `bundle = library_client.fetch_resolution_bundle(qst_id, qst_version)` → on Library 404 return 404; on 410 (withdrawn) return 410; on transport error return 502.
   b. `resolve_entity = bundle["entities"].get` (dict lookup).
   c. `runtime = denormalise(bundle["definition"], locale=locale, runtime_policy=RuntimePolicy(**policy), viewer_manifest=manifest, resolve_entity=resolve_entity, generated_at=now_iso(), denormaliser_version=config.DENORMALISER_VERSION, schemas_dir=config.SCHEMAS_DIR)`.
   d. On `PreflightError` → **422** `{error:{code:"preflight_failed", message, detail:[{kind,where,detail}...]}}`.
   e. **Defensive assert** `runtime["provenance"]["viewer_conformance_hash"] == manifest_hash` and `...["deployment_runtime_policy_hash"] == policy_hash` (internal invariant; 500 if violated — indicates a hashing-consistency bug).
   f. **Store** in `runtime_cache` (upsert); **LRU-evict**: if `COUNT(*) > cap`, `DELETE` the oldest-`last_accessed_at` rows down to the cap (same transaction).
   g. Return `runtime` (200).

**Admin purge** (OD-18f): `DELETE /v1/runtime_cache` (all) or `DELETE /v1/runtime_cache?deployment_id=X` (per-deployment). Returns `{purged: <count>}`.

---

## 5 — The additive Library endpoint

Added to the `library/` package (additive, like the library-web Core changes):

`GET /v1/questionnaires/{qid}/versions/{version}/resolution-bundle` →
```jsonc
{
  "definition": { /* un-resolved Schema 2 content_json, refs intact */ },
  "entities":   { "pr_x@v26.0609": { /* raw body */ }, "scr_y@v26.0609": { /* raw body */ }, ... }
}
```

- **410** if the questionnaire version is withdrawn (mirrors `/definition`); **404** if absent.
- **Bundle builder** (new function reusing the existing `refs`/`resolve` machinery): starting from the questionnaire `content_json`, transitively collect the raw body of every referenced entity:
  - every `{"ref": "<id>@<v>"}` target (the existing recursive walk), **and**
  - every `scores[].scorer` value (`scr_*@v` — these are bare strings, not `{ref}` objects, so the existing walk misses them).
  - Each collected body is itself scanned for further refs/scorers (an Item → Question → Prompt chain; a Scorer has no further refs). Fixed-point over the id@version set.
  - **Withdrawn/missing** referenced entity → **omitted** from `entities` (so the consumer's `resolve_entity` returns `None` → the denormaliser raises an `unresolved_ref` pre-flight problem, surfaced as VS 422). No silent inlining of withdrawn content.
- Bodies are the stored `entity.content_json` (the same dicts `/definition?resolved=true` inlines), keyed by `"<id>@<version>"`.
- Tested in `library/tests/` (the existing suite): bundle for the kitchensink/phq9 examples collects the expected ids; withdrawn entity omitted; unknown → 404.

---

## 6 — Error handling

| Condition | HTTP | `error.code` |
|---|---|---|
| Unknown deployment / viewer | 404 | `not_found` |
| Denormaliser `PreflightError` | 422 | `preflight_failed` (detail = problem list) |
| Bad request body (missing viewer_id, malformed manifest) | 422 | `invalid` |
| Questionnaire withdrawn (Library 410) | 410 | `gone` |
| Library unreachable / 5xx | 502 | `upstream_unavailable` |
| Manifest fails Schema 7 validation (on register) | 422 | `invalid_manifest` |

Envelope: `{"error": {"code": ..., "message": ..., "detail": ...?}}` (mirrors `library/`).

---

## 7 — Testing (TDD)

- **Unit:** `runtime_cache` key build + LRU eviction + purge (testcontainers Postgres); `locale` resolution; `manifests` Schema 7 validation + hash equals `canonical_hash`; `library_client` against `httpx.MockTransport` (bundle, 404, 410, transport error).
- **API (testcontainers Postgres):** register viewer (valid + invalid manifest); create + get deployment; mint runtime **cache miss** (Library mocked to return a bundle) → returns Schema 3, row cached; **cache hit** (second call, Library mock asserted *not* called again); `PreflightError` → 422; admin purge (all + per-deployment); 404s.
- **Near-e2e:** with a real local Library (seeded from the survey-db importer or a fixture) + the new bundle endpoint, register a viewer manifest, create a deployment against a real `qst_*@v`, mint → the denormaliser validates the Schema 3 output against the real schemas; assert provenance hashes match the cache key.
- **Library side:** the new `resolution-bundle` endpoint is covered in `library/tests/` (bundle completeness incl. scorers, withdrawn omission, 404/410).
- **Verification gate:** `viewer-service/` suite green; `library/` suite still green **with the new endpoint** (count goes up, not down); `questionnaire-runtime-denormaliser/` (56) + `tools/tests` (309) untouched.

---

## 8 — Decisions locked in this session (2026-06-10)

| # | Decision | Choice |
|---|---|---|
| D1 | Viewer Service decomposition | **VS-A → VS-B → VS-C**; VS-A = runtime generation core (this spec). |
| D2 | Library integration | **Resolution-bundle endpoint** — one additive Library route returns `{definition, entities}`; VS's `resolve_entity` is a dict lookup. |
| D3 | Manifest ingestion | **Direct POST upload** of the Schema 7 manifest (URL-fetch deferred). |
| D4 | Library access | **HTTP only** — no DB sharing, no importing `library` code (repo topology). |
| D5 | Locale resolution (VS-A) | Deployment-level only (requested ∈ available_locales else default); questionnaire-language availability enforced by the denormaliser → 422. |
| D6 | Cache | Postgres `runtime_cache`, OD-18f 5-tuple composite PK, LRU by `last_accessed_at`, admin purge; lazy generation. |
| D7 | Auth | None in VS-A (open endpoints incl. admin purge); arrives with sessions/Identity later. |
