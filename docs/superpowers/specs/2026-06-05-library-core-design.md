# Library Core — Design Spec

**Date drafted:** 2026-06-05
**Author:** Library Core brainstorming session (2026-06-05)
**Component:** Library — sub-project 1 of 5 (Core). See [design/14_repository_topology.md](../../../design/14_repository_topology.md) for the sub-project decomposition.
**Target repo:** `questionnaire-library-service` (built in the current folder under `library/` for now; migrates at the deferred reorg).
**Stack:** Python 3.11+ · FastAPI · PostgreSQL (Postgres-only) · psycopg 3 · Pydantic v2 · Alembic · pytest.
**Authoritative source documents:**

- [design/06_library.md](../../../design/06_library.md) — Library component spec (capabilities, API surface §7, lifecycle, dependency graph §6)
- [design/04_architecture.md](../../../design/04_architecture.md) §"Deployment shape" — OD-04 stack (Python + FastAPI + Postgres + jsonb)
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) — the 11 reusable entity types (+ Subscale, Scorer) the catalogue stores
- [design/11_content_licensing.md](../../../design/11_content_licensing.md) — license tags + effective composite license
- [design/12_governance.md](../../../design/12_governance.md) — withdrawn → 410 Gone; URI stability
- [plan/02_mvp_scope.md](../../../plan/02_mvp_scope.md) — Library MVP Definition of Done

The **Library Core** is a read-only catalogue service: it **ingests** canonical JSON (questionnaires + reusable entities) from a Git-tracked content tree, **stores** it in PostgreSQL (canonical `jsonb` source-of-truth + a derived relational index), and **serves** a public read REST API with search, faceting, version history, downloadable definitions, and a dependency graph.

---

## 1 — Scope

### 1.1 In scope
- Ingestion of canonical JSON from a checkout of `questionnaire-library-content` (a directory tree).
- Schema validation of every artifact at ingestion (reusing the project's JSON Schemas + `tools/` validation logic).
- Hard-pinned reference (`id@vYY.MMDD`) resolution + a dependency graph.
- PostgreSQL storage: immutable canonical `jsonb` + derived, rebuildable index tables (storage Approach C).
- Public read REST API: list/detail/versions/definition for questionnaires + the 13 reusable entity types; faceted filters; full-text search; dependency-graph (`dependents`) endpoints.
- Lifecycle: **`published`** and **`withdrawn`** only. Withdrawn ⇒ metadata stub retained, distributable content removed, `/definition` returns `410 Gone`.
- Effective composite license computation for questionnaires.
- A CLI ingestion entrypoint, runnable in CI.

### 1.2 Non-goals (deferred to later sub-projects)
- **No authenticated write API** — content enters only via Git-backed ingestion.
- **No `draft`/`in_review` states** — those are content-repo PR-branch states owned by the contribution workflow (sub-project 3).
- **No contribution/review workflow, no DOI minting, no community signals (comments/ratings/usage stats), no web UI** — sub-projects 3/4/5.
- **No Identity / auth** (OD-08) — read access is open; nothing in the Core authenticates.
- **No SQLite** — Postgres-only (the OD-04 single-machine SQLite option is deferred).
- **No lifecycle transition state machine** — [design/06_library.md](../../../design/06_library.md) explicitly defers it.

---

## 2 — Module layout

Built under `library/` in the current repo (becomes the `questionnaire-library-service` root at reorg):

```
library/
├── pyproject.toml
├── alembic.ini
├── migrations/                  # Alembic migration scripts
│   └── versions/
├── src/library/
│   ├── __init__.py
│   ├── config.py                # env config (DATABASE_URL, CONTENT_DIR, ...)
│   ├── models.py                # Pydantic v2 API + ingestion models
│   ├── entity_types.py          # the 14 entity types + id-prefix map + schema map
│   ├── loader.py                # walk content tree, parse, identify (type,id,version)
│   ├── validation.py            # JSON Schema validation (wraps tools/ registry)
│   ├── refs.py                  # parse/resolve id@vYY.MMDD references
│   ├── licensing.py             # effective composite license computation
│   ├── ingest.py                # the ingestion pipeline (orchestrates the above)
│   ├── store/
│   │   ├── db.py                # psycopg 3 connection/pool
│   │   ├── schema.sql           # canonical DDL (mirrored by Alembic)
│   │   ├── entities.py          # upsert/read canonical `entity` rows
│   │   └── index.py            # (re)build catalogue_entry, entity_ref, facet
│   ├── query.py                 # search/filter/facet SQL builders
│   ├── api/
│   │   ├── app.py              # FastAPI app factory, error handlers, /v1 router
│   │   ├── questionnaires.py
│   │   ├── entities.py
│   │   └── search.py
│   └── cli.py                   # `library ingest <dir>`, `library serve`, `library rebuild-index`
└── tests/
    ├── conftest.py              # Postgres fixture, seeded content fixtures
    ├── unit/
    └── integration/
```

Each unit has one responsibility and a typed interface; `ingest.py` orchestrates `loader → validation → refs → store → index → licensing`.

---

## 3 — Data model (PostgreSQL)

### 3.1 Source-of-truth (immutable)

```sql
CREATE TYPE entity_type AS ENUM (
  'message','context','instruction','prompt','option','placeholder','help','regex',
  'question','item','solution','subscale','scorer','questionnaire'
);
CREATE TYPE entity_status AS ENUM ('published','withdrawn');

CREATE TABLE entity (
  id            text          NOT NULL,           -- e.g. pr_phq9_1, qst_phq9 (prefix ⇒ globally unique)
  version       text          NOT NULL,           -- CalVer vYY.MMDD
  entity_type   entity_type   NOT NULL,
  severity      text,                             -- breaking|additive|corrective (entity metadata)
  status        entity_status NOT NULL DEFAULT 'published',
  license       text,                             -- controlled-vocab tag (11_content_licensing §"tags")
  content_json  jsonb,                            -- full canonical artifact; NULL/stub when withdrawn
  withdrawn_at  timestamptz,
  source_commit text,                             -- content-repo git SHA at ingest (provenance)
  ingested_at   timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version)
);
CREATE INDEX entity_content_gin ON entity USING gin (content_json jsonb_path_ops);
CREATE INDEX entity_type_idx    ON entity (entity_type, status);
```

**Immutability (OD-06):** re-ingesting an existing `(id, version)` whose `content_json` differs from the stored row is **rejected**. Identical re-ingest is a no-op (idempotent). A withdrawal transition (`published → withdrawn`, stubbing content) is the one permitted mutation.

For questionnaires, `content_json` holds the **Schema 2 definition** (which embeds a Schema 1-shaped `metadata` block); see §4.4 for the metadata-source rule.

### 3.2 Derived index (rebuildable from `entity.content_json`)

```sql
CREATE TABLE catalogue_entry (
  id                 text NOT NULL,
  version            text NOT NULL,
  entity_type        entity_type NOT NULL,
  status             entity_status NOT NULL,
  title              text,
  short_title        text,
  description        text,
  language           text,                 -- canonical language
  available_languages text[],
  item_count         int,                  -- questionnaires
  estimated_minutes  int,
  effective_license  text,                 -- composite for questionnaires; own tag otherwise
  search_tsv         tsvector,
  PRIMARY KEY (id, version),
  FOREIGN KEY (id, version) REFERENCES entity (id, version) ON DELETE CASCADE
);
CREATE INDEX catalogue_tsv_gin ON catalogue_entry USING gin (search_tsv);

CREATE TABLE entity_ref (                  -- dependency graph
  from_id      text NOT NULL,
  from_version text NOT NULL,
  to_id        text NOT NULL,
  to_version   text NOT NULL,
  ref_kind     text NOT NULL,             -- prompt|context|instruction|option|question|item|solution|scorer|subscale|placeholder|help|regex
  PRIMARY KEY (from_id, from_version, to_id, to_version, ref_kind)
);
CREATE INDEX entity_ref_to_idx ON entity_ref (to_id, to_version);

CREATE TABLE facet (                       -- faceted browse/filter
  id         text NOT NULL,
  version    text NOT NULL,
  facet_type text NOT NULL,               -- domain|population|tag|administration_mode
  value      text NOT NULL,
  PRIMARY KEY (id, version, facet_type, value)
);
CREATE INDEX facet_lookup_idx ON facet (facet_type, value);
```

The derived layer is a **pure projection** of `entity` — `library rebuild-index` regenerates it from `content_json` alone, so it is never hand-maintained and ingestion is idempotent.

---

## 4 — Ingestion pipeline

### 4.1 Input
A local checkout of `questionnaire-library-content`, tree shaped like the existing prototype:
`<root>/<plural-type>/<id>.json` (e.g. `prompts/pr_phq9_1.json`, `questionnaires/qst_phq9.json`). `entity_types.py` maps plural dir ↔ `entity_type` ↔ id-prefix ↔ JSON Schema.

### 4.2 Algorithm (per `library ingest <dir> [--commit <sha>]`)
1. **Walk** the tree; for each file, `loader` parses JSON and derives `(entity_type, id, version)` from the directory + the artifact's `id`/`version` (cross-check the id-prefix; mismatch ⇒ error).
2. **Validate** against the entity's JSON Schema (`validation.py`, reusing the `tools/` registry that resolves both schema URLs).
3. **Extract refs** (`refs.py`): scan for `{"ref": "<id>@vYY.MMDD"}` shapes; record `(to_id, to_version, ref_kind)`.
4. **Stage** all parsed artifacts; then **resolve refs**: every referenced `id@version` must be present in this batch or already in `entity`. Unresolved ref ⇒ batch error with a per-file report.
5. **Upsert** `entity` rows (immutability check per §3.1) inside a single transaction.
6. **Rebuild derived rows** for the affected entities (`store/index.py`): `catalogue_entry` (+ `search_tsv`), `entity_ref`, `facet`.
7. **Compute effective composite license** (§4.3) for questionnaires.
8. **Commit**; emit an ingestion report (counts, skips, errors, `source_commit`).

`--rebuild-index` runs only steps 6–7 from existing `entity` rows.

### 4.3 Effective composite license
Per [design/11_content_licensing.md](../../../design/11_content_licensing.md): a questionnaire's `effective_license` = the **strictest** license among itself and all entities it (transitively) references; if components differ, it is `mixed_see_components` with the strictest surfaced. Strictness ordering and the tag vocabulary come from doc 11 (`public_domain`/`cc0`/`cc_by`/`cc_by_sa`/`cc_by_nc`/`proprietary_open_redistribution`/`proprietary_restricted`/`unknown`). `unknown` is treated as restrictive for surfacing.

### 4.4 Questionnaire metadata source
`catalogue_entry` fields for a questionnaire derive from the Schema 1-shaped `metadata` block embedded in the Schema 2 definition (`content_json.metadata`): `title`, `short_title`, `description`, `language`, `available_languages`, `psychometrics.item_count`, `psychometrics.estimated_minutes`, `license`, `classification.{domain,population,administration_mode}` → `facet` rows. *(If the content repo also maintains a standalone Schema 1 instrument file per questionnaire, ingestion treats it as the authoritative metadata and asserts the definition's embedded block matches — finalize in the plan.)*

---

## 5 — API surface (`/v1`, read-only)

FastAPI app; JSON; `limit`/`offset` pagination (default 20, max 100); auto `openapi.json` + `/healthz`.

| Method · Path | Purpose | Key params |
|---|---|---|
| `GET /v1/questionnaires` | List/search questionnaires | `q`, `domain`, `population`, `language`, `license`, `min_items`, `max_items`, `limit`, `offset`, `sort` |
| `GET /v1/questionnaires/{id}` | Latest published version — metadata + item list | — |
| `GET /v1/questionnaires/{id}/versions` | Version history | — |
| `GET /v1/questionnaires/{id}/versions/{version}` | Specific version detail | — |
| `GET /v1/questionnaires/{id}/versions/{version}/definition` | Canonical Schema 2 JSON (download) | — |
| `GET /v1/entities/{type}` | List/search a reusable entity type | `q`, `language`, `license`, `limit`, `offset` |
| `GET /v1/entities/{type}/{id}` | Latest version of a reusable entity | — |
| `GET /v1/entities/{type}/{id}/versions/{version}` | Specific version | — |
| `GET /v1/entities/{type}/{id}/versions/{version}/dependents` | Dependency graph — who references this `id@version` | `limit`, `offset` |
| `GET /v1/search` | Full-text across all entity types | `q`, `type`, `limit`, `offset` |
| `GET /v1/facets` | Available facet values + counts (for browse UI) | `facet_type` |

Convenience aliases `GET /v1/questions`, `GET /v1/options` map to `entities/question`, `entities/option` (per [06](../../../design/06_library.md) §7).

**Responses** are Pydantic v2 models: list endpoints return `{items: [...], total, limit, offset}`; detail endpoints return the catalogue metadata + (for questionnaires) the resolved item list; `/definition` streams the raw `content_json`.

**Withdrawn behaviour:** detail endpoints return the metadata stub with `status: "withdrawn"`; `/definition` returns **`410 Gone`** with `{withdrawn_at, message}` (per [12_governance.md](../../../design/12_governance.md)).

---

## 6 — Search & faceting

- **Full-text:** `search_tsv` is built at ingestion from title/short_title/description + key content text (per locale, canonical language weighted highest). `q` → `plainto_tsquery`/`websearch_to_tsquery`; rank with `ts_rank`.
- **Filters:** `domain`/`population`/`administration_mode` via `facet` joins; `language` via `catalogue_entry`/`available_languages`; `license` via `effective_license`; item-count range via `item_count`.
- **Sort:** relevance (default when `q` present), recency (`version`), title.
- **Facet counts:** `GET /v1/facets` aggregates `facet` for browse sidebars.

---

## 7 — Error handling

| Condition | Surface |
|---|---|
| Schema-invalid artifact | ingestion: per-file error, batch aborts (transaction rollback) |
| Unresolved `@version` ref | ingestion: per-file error listing the missing ref |
| Immutability violation (changed `(id,version)`) | ingestion: error naming the conflicting id/version |
| Unknown id/version | API `404` |
| Withdrawn `/definition` | API `410 Gone` |
| Bad query params | API `422` (FastAPI validation) |

All API errors use one JSON envelope: `{error: {code, message, detail?}}`.

---

## 8 — Configuration & deployment

- Env: `DATABASE_URL`, `CONTENT_DIR` (ingestion source), `LOG_LEVEL`, `API_PREFIX` (default `/v1`).
- Migrations: Alembic; `schema.sql` is the canonical DDL mirrored by the initial migration.
- Run: `uvicorn library.api.app:app`; ingestion as a CLI / CI step (`library ingest $CONTENT_DIR`).
- Structured JSON logs.

---

## 9 — Testing strategy (TDD)

- **Unit:** `loader` (type/id/version identification, prefix cross-check), `refs` (parse/resolve), `licensing` (composite ordering incl. `mixed_see_components`/`unknown`), `index` builders (tsv, facets, refs), immutability check.
- **Integration (Postgres fixture):** ingest the existing `schemas/questionnaire/examples/library_examples/` + `phq9.json`/`kitchensink.json` as fixtures; assert canonical round-trip and derived rows. API tests via FastAPI `TestClient` + httpx: list/filter/search, facets, detail, version history, `/definition` download, `dependents`, `404`, `410`, pagination, idempotent re-ingest, immutability rejection.
- Framework: pytest, consistent with the existing `tools/tests/` suite. A throwaway/ephemeral Postgres (testcontainers or a CI service container) backs integration tests.

---

## 10 — Definition of done (this sub-project)

1. `library ingest` loads the existing `library_examples/` + the 3 questionnaire examples into Postgres with zero validation/ref errors; re-running is a no-op.
2. The read API answers `GET /v1/questionnaires`, `/questionnaires/{id}`, `/search`, and `/entities/{type}/{id}/.../dependents` correctly over the seeded data, with an OpenAPI document.
3. Withdrawn `/definition` returns `410`; immutability violations are rejected at ingest.
4. Full unit + integration suite green; matches house pytest conventions.
5. Maps cleanly onto the MVP DoD rows in [plan/02_mvp_scope.md](../../../plan/02_mvp_scope.md) for "public read API reachable" and "catalogue validates against schema."

---

## 11 — Open questions to finalize in the plan

- **Metadata source (§4.4):** standalone Schema 1 instrument file vs the definition's embedded `metadata` block as the authoritative catalogue source (default: embedded block; assert-match if a standalone file exists).
- **`search_tsv` content depth:** title/description only vs including item/prompt text (affects index size + recall) — default to metadata + prompt stems.
- **Test Postgres provisioning:** testcontainers vs CI service container vs a `docker compose` dev DB — pick in the plan.
- **psycopg 3 raw SQL vs SQLAlchemy Core** for the repository layer — default psycopg 3 + hand-written SQL given the small, stable schema.
