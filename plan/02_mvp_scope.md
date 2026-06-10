# 02 — MVP Scope

The MVP boundary: what the first deliverable contains, and what it deliberately does not.

**Last revised.** 2026-06-06 (schema-hosting decision added 2026-06-10: schemas kept in-repo; public hosting at `behaverse.org/schemas/` deferred — see "Schema hosting" below).

## MVP outcome

A researcher can:

1. Open the Library's web interface.
2. Search the catalogue (seeded with real validated questionnaires migrated from `survey_database/`).
3. View a questionnaire's metadata and items.
4. Download its canonical JSON.
5. Access the same content through the public REST API.

The schemas the Library validates against live in this repo (`schemas/`) — the source of truth — and validate every artefact the Library stores.

### Schema hosting — kept in-repo for now (owner decision, 2026-06-10)

The schemas are **kept here, in `schemas/`**; we are **not** publishing them to `behaverse.org/schemas/` as part of the MVP. Their canonical `$id`/`$ref` URLs (`https://behaverse.org/schemas/<name>/<version>/schema.json`) remain unchanged — they are stable *identifiers* that the validator resolves locally via a URI→file registry (`tools/validate_schemas.py`), so nothing needs them to be publicly live. Public hosting at `behaverse.org/schemas/`, and the eventual migration into `behaverse/schemas`, stay as the documented post-MVP end-state ([../design/14_repository_topology.md](../design/14_repository_topology.md) §8, [../design/12_governance.md](../design/12_governance.md)); they are **out of MVP scope**.

## In scope

### Data standards — STATUS: complete ✅

All 8 data-model schemas are authored, validated, tagged. The schema-authoring portion of MVP is done.

- Schema 1 Instrument Metadata — `instrument-v26.0605` (renamed `authors` → `author` 2026-06-05).
- Schema 2 Questionnaire Definition — `v26.0602` (per OD-15 reusable-entity model + OD-16 external Scorer scoring).
- Schema 3 Questionnaire Runtime — `runtime-v26.0603` (per OD-18).
- Schema 4a Event Data — `events-v26.0605` (per OD-19 — `bdm:` events vocabulary).
- Schema 4b Behavioural Channels (Mouse + Keyboard) — `recordings-v26.0605` (per OD-20; EEG / webcam / microphone deferred to Phase 6).
- Schema 5 Response Data — `response-v26.0603` (per OD-17 — strict BDM Response trial table).
- Schema 6 Session Metadata — `session-v26.0603` (per OD-17 — carries `scorer_outputs`).
- Schema 7 Viewer Conformance Manifest — `viewer_conformance-v26.0603` (per OD-18 — sibling of Schema 3).

Validator (`tools/validate_schemas.py`) walks every schema's examples and runs 9 cross-checks. 308 tests pass; 43 examples validate.

### Library — STATUS: Core + importer built ✅; web UI + contribution workflow + deployment pending

**Built + merged** (`library/`, 2026-06-05/06): the **Library Core** (catalogue + Git-backed ingestion + public read API: list/detail/versions/definition, reusable entities, dependency-graph `dependents`, full-text search, facets, withdrawn→410) and the **legacy `survey_database/` importer** (canonical JSON + provenance + loss report; converts all content, validates, ingests). **Not yet built:** the authenticated write surface + contribution/review workflow + DOI (need auth/Identity, OD-08), community signals (Identity), the **web interface** (sub-project 5), and deployment + persistent content seeding (public schema hosting at `behaverse.org/schemas/` is **deferred** — schemas kept in-repo for now; see "Schema hosting" above). The original capability list below, with build status:

- Catalogue with metadata, full item listing, version history per `design/06_library.md`. ✅ (read API)
- Reusable-component pool — 11 entity types + Subscale + Scorer, with cross-reference tracking. ✅ (ingested + catalogued; `dependents` endpoint).
- Search by keyword, domain, population, language, item count, license tag. ✅ (full-text search + facets + filters).
- Public read REST API (list, detail, version, definition, search). ✅.
- Authenticated write surface for submitting / promoting new versions (GitHub-backed contribution workflow). ❌ — content enters via Git-backed ingestion only; the authenticated write surface + contribution workflow are sub-project 3 (need auth).
- Migrated content: the 793 Prompts, 64 questionnaires, etc. from `survey_database/`, normalised into Schema 2 v26.0602 entities (per `design/13_importers.md`). ✅ importer built + proven (converts all, validates, ingests in test); persistent seeding into a deployed instance pending.
- Authentication of Library writers (per OD-08). ❌ deferred — out of Library-Core scope; needs the Identity sibling (or a minimal-viable Identity).

### Open decisions resolved by MVP exit

All 20 originally-tracked open decisions are now resolved. The full Resolution log lives in [../design/10_open_decisions.md](../design/10_open_decisions.md). Carry every resolution into MVP without re-deciding:

- *2026-05-15:* OD-03 (Editor preview = shared renderer), OD-04 (Python + FastAPI + PostgreSQL), OD-08 (Identity sibling project).
- *2026-05-21:* OD-05 (reference-with-safe-overrides), OD-06 (hard-pin all references), OD-07 (channel default-state matrix), OD-09 (DB-driven scheduler), OD-10 (single Library, all lifecycle), OD-11 (WASM expression evaluator), OD-14 (session resume semantics).
- *2026-05-23:* OD-13 (queued forwarding via Postgres outbox), OD-01 (**S1 — Pure custom canonical + Web Viewer renderer; no SurveyJS dependency**), OD-12 (five-concept pagination model: Block, Page, Section, Subscale, Tag).
- *2026-05-31:* OD-15 (Schema 2 reusable-entity pivot to 11 entities).
- *2026-06-02:* OD-16 (external Scorer Library entity for scoring; per-trial `correct`+`score` model).
- *2026-06-03:* OD-17 (Schema 5 strict BDM Response adherence + Schema 6 session metadata), OD-18 (Schema 3 Runtime production model + new Schema 7 Conformance Manifest).
- *2026-06-05:* OD-19 (BDM Events vocabulary — `bdm:` namespace with 24 verbs / 15 object types / 5 actor types), OD-20 (Schema 4b family per source, mouse + keyboard MVP).

No design decision blocks MVP implementation. **The Library Core + content importer are built; the remaining MVP work is the Library web UI (sub-project 5), the contribution workflow (sub-project 3, needs auth), and deployment + persistent content seeding.** (Public schema hosting at `behaverse.org/schemas/` is **deferred** — schemas kept in-repo for now, owner decision 2026-06-10.)

## Out of scope for MVP

### Components

- **Editor** — entirely Phase 3. New questionnaires arrive in the MVP Library either through the GitHub contribution workflow (hand-written JSON or scripts) or through the content-migration tooling.
- **Web Viewer / Native Viewer** — Phase 2 / Phase 4. The MVP Library exports definitions; no viewer reads them yet. (PDF is an export format produced by the Library / Editor — not a viewer in the data-collection sense; see `design/02_terminology.md`.)
- **Participant Platform** — Phase 5. No participant accounts, no studies, no scheduling, no dashboards.

### Features

- Response and event data collection (depends on a Viewer).
- Behaverse Data Collection API integration (depends on a Viewer producing data).
- Logic / branching / piping / scoring **execution** (the schema encodes them; nothing runs them yet).
- Validation **execution** (the schema encodes rules; nothing runs them yet).
- Translation interface (Editor responsibility).
- Theming and branding (Viewer responsibility).
- Notifications, scheduling, dashboards (Platform responsibility).
- Advanced behavioural capture (mouse, keyboard, RT, webcam, mic).
- External-system integrations (REDCap, Qualtrics, SDKs).

## Definition of done for MVP

| Criterion | How verified | Status (2026-06-06) |
|---|---|---|
| Canonical schemas present + resolvable | The validator resolves every `$id` (`behaverse.org/schemas/…`) to a local schema file in `schemas/`. | ✅ Schemas in-repo + validated locally. **Public hosting at `behaverse.org/schemas/` deferred** — out of MVP scope (owner decision 2026-06-10); revisited post-MVP. |
| Every artefact in the Library validates against its schema | A validation pass over the full catalogue runs with zero failures. | ✅ The importer smoke test validates every produced artifact against the schemas, and the Library validates each on ingest. |
| Library catalogue is seeded with all content from `survey_database/` | Item counts match: ≥ 64 questionnaires, ≥ 793 Prompts (plus the entities they reference). | ⏳ Importer built + proven (converts all, validates, ingests all 64 questionnaires into Postgres in test). Persistent seeding into a *deployed* Library instance is pending. |
| Library public read API is documented and reachable | `GET /v1/questionnaires`, `/v1/questionnaires/{id}`, `/v1/search` return correct responses; OpenAPI available. | ✅ Built + tested (auto OpenAPI). A deployed instance is an ops step. |
| A researcher can search the catalogue and download a definition end-to-end | Manual walkthrough with one of the seeded instruments. | ⏳ Works at the API level (tested); the web-UI surface (sub-project 5) is not built. |
| Authoritative location for the design is `design/`; for the plan is `plan/`. Old scattered docs are archived. | No surviving root-level spec files. | ✅ Done. |

Current state: **schemas authored + Library Core + importer built and proven in test.** What remains for a *shipped* MVP: deploy a Library instance with the content persistently seeded, and build the web UI (sub-project 5). (Public schema hosting at `behaverse.org/schemas/` is **deferred** — schemas kept in-repo for now; not an MVP step.) Then Phase 2 begins.
