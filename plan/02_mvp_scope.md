# 02 — MVP Scope

The MVP boundary: what the first deliverable contains, and what it deliberately does not.

**Last revised.** 2026-06-05.

## MVP outcome

A researcher can:

1. Open the Library's web interface.
2. Search the catalogue (seeded with real validated questionnaires migrated from `survey_database/`).
3. View a questionnaire's metadata and items.
4. Download its canonical JSON.
5. Access the same content through the public REST API.

The schemas the Library validates against are published at `behaverse.org/schemas/` and validate every artefact the Library stores.

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

### Library — STATUS: not started ❌

- Catalogue with metadata, full item listing, version history per `design/06_library.md`.
- Reusable-component pool — per OD-15 (resolved 2026-05-31), 11 entity types: Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx (content-bearing) + Question, Item, Solution (ref-binding). Plus Subscale (label) and Scorer (procedural) per OD-16/17. Each with cross-reference tracking.
- Search by keyword, domain, population, language, item count, license tag (per the controlled vocabulary in `design/11_content_licensing.md`).
- Public read REST API (list, detail, version, definition, search).
- Authenticated write surface for submitting / promoting new versions (via the GitHub-backed contribution workflow defined in `design/06_library.md`).
- Migrated content: the 793 Prompts, 64 questionnaires, 30 Contexts, 22 Instructions, 100 Messages, 35 Solutions from `survey_database/`, normalised into Schema 2 v26.0602 entities (per `design/13_importers.md`).
- Authentication of Library writers (per OD-08, resolved 2026-05-15: federates against the Identity sibling project; until that sibling exists, a minimal-viable Identity service stood up alongside MVP is acceptable).

### Open decisions resolved by MVP exit

All 20 originally-tracked open decisions are now resolved. The full Resolution log lives in [../design/10_open_decisions.md](../design/10_open_decisions.md). Carry every resolution into MVP without re-deciding:

- *2026-05-15:* OD-03 (Editor preview = shared renderer), OD-04 (Python + FastAPI + PostgreSQL), OD-08 (Identity sibling project).
- *2026-05-21:* OD-05 (reference-with-safe-overrides), OD-06 (hard-pin all references), OD-07 (channel default-state matrix), OD-09 (DB-driven scheduler), OD-10 (single Library, all lifecycle), OD-11 (WASM expression evaluator), OD-14 (session resume semantics).
- *2026-05-23:* OD-13 (queued forwarding via Postgres outbox), OD-01 (**S1 — Pure custom canonical + Web Viewer renderer; no SurveyJS dependency**), OD-12 (five-concept pagination model: Block, Page, Section, Subscale, Tag).
- *2026-05-31:* OD-15 (Schema 2 reusable-entity pivot to 11 entities).
- *2026-06-02:* OD-16 (external Scorer Library entity for scoring; per-trial `correct`+`score` model).
- *2026-06-03:* OD-17 (Schema 5 strict BDM Response adherence + Schema 6 session metadata), OD-18 (Schema 3 Runtime production model + new Schema 7 Conformance Manifest).
- *2026-06-05:* OD-19 (BDM Events vocabulary — `bdm:` namespace with 24 verbs / 15 object types / 5 actor types), OD-20 (Schema 4b family per source, mouse + keyboard MVP).

No design decision blocks the start of MVP implementation. **The remaining MVP work is the Library implementation and content import.**

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

| Criterion | How verified | Status (2026-06-05) |
|---|---|---|
| Canonical schemas published at `behaverse.org/schemas/` and resolvable | `GET https://behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` returns the schema (calendar version per the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)). | ✅ Schemas authored + tagged locally. Public hosting at `behaverse.org/schemas/` is a separate publish step. |
| Every artefact in the Library validates against its schema | A validation pass over the full catalogue runs in CI with zero failures. | ⏳ Validator harness works locally; Library/CI integration pending. |
| Library catalogue is seeded with all content from `survey_database/` | Item counts match: ≥ 64 questionnaires, ≥ 793 Prompts (plus the Options, Contexts, Instructions, Messages, Solutions they reference). | ❌ Library not built; import not started. |
| Library public read API is documented and reachable | `GET /questionnaires`, `GET /questionnaires/{id}`, `GET /search` return correct responses; an OpenAPI document is available. | ❌ Library not built. |
| A researcher can search the catalogue and download a definition end-to-end | Manual walkthrough with one of the seeded instruments. | ❌ Depends on Library. |
| Authoritative location for the design is `design/`; for the plan is `plan/`. Old scattered docs are archived. | The verification steps in `archive_do_not_edit/README.md` (post-archive) report no surviving root-level spec files. | ✅ Done. |

When all six criteria are satisfied, MVP is shipped and Phase 2 begins. Current state: **schema-authoring portion shipped; Library implementation is the gating remaining work.**
