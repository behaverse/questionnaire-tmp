# 02 — MVP Scope

The MVP boundary: what the first deliverable contains, and what it deliberately does not.

## MVP outcome

A researcher can:

1. Open the Library's web interface.
2. Search the catalogue (seeded with real validated questionnaires migrated from `survey_database/`).
3. View a questionnaire's metadata and items.
4. Download its canonical JSON.
5. Access the same content through the public REST API.

The schemas the Library validates against are published at `behaverse.org/schemas/` and validate every artefact the Library stores.

## In scope

### Data standards

- Canonical Questionnaire Definition schema (`design/05_data_model.md` Schema 2) — finalised, published, with the four open data-model questions (validation, logic, versioning, scoring) resolved in concrete syntax.
- Questionnaire Metadata schema (Schema 1) — finalised and published.
- Session Metadata schema (Schema 6) — finalised; not exercised end-to-end until Phase 2.
- Event Data schema (Schema 4) — finalised; not exercised end-to-end until Phase 2.
- Response Data schema (Schema 5) — finalised; not exercised end-to-end until Phase 2.

### Library

- Catalogue with metadata, full item listing, version history per `design/06_library.md`.
- Reusable-component pool (questions, option-sets, instructions, prompts, translations) with cross-reference tracking.
- Search by keyword, domain, population, language, item count, license tag (per the controlled vocabulary in `design/11_content_licensing.md`).
- Public read REST API (list, detail, version, definition, search).
- Authenticated write surface for submitting / promoting new versions (via the GitHub-backed contribution workflow defined in `design/06_library.md`).
- Migrated content: the 792 questions and 59 questionnaires from `survey_database/`, normalised into reusable entities.
- Authentication of Library writers (per OD-08, resolved 2026-05-15: federates against the Identity sibling project; until that sibling exists, a minimal-viable Identity service stood up alongside MVP is acceptable).

### Open decisions resolved by MVP exit

All 13 originally-tracked open decisions are now resolved. The full Resolution log lives in [../design/10_open_decisions.md](../design/10_open_decisions.md). Carry every resolution into MVP without re-deciding:

- *2026-05-15:* OD-03 (Editor preview = shared renderer), OD-04 (Python + FastAPI + PostgreSQL), OD-08 (Identity sibling project).
- *2026-05-21:* OD-05 (reference-with-safe-overrides), OD-06 (hard-pin all references), OD-07 (channel default-state matrix), OD-09 (DB-driven scheduler), OD-10 (single Library, all lifecycle), OD-11 (WASM expression evaluator), OD-14 (session resume semantics).
- *2026-05-23:* OD-13 (queued forwarding via Postgres outbox), OD-01 (**S1 — Pure custom canonical + Web Viewer renderer; no SurveyJS dependency**), OD-12 (five-concept pagination model: Block, Page, Section, Subscale, Tag).

No design decision blocks the start of MVP implementation.

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

| Criterion | How verified |
|---|---|
| Canonical schemas published at `behaverse.org/schemas/` and resolvable | `GET https://behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` returns the schema (calendar version per the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)). |
| Every artefact in the Library validates against its schema | A validation pass over the full catalogue runs in CI with zero failures. |
| Library catalogue is seeded with all content from `survey_database/` | Item counts match: ≥ 59 questionnaires, ≥ 792 questions (plus the option-sets, instructions, prompts they reference). |
| Library public read API is documented and reachable | `GET /questionnaires`, `GET /questionnaires/{id}`, `GET /search` return correct responses; an OpenAPI document is available. |
| A researcher can search the catalogue and download a definition end-to-end | Manual walkthrough with one of the seeded instruments. |
| Authoritative location for the design is `design/`; for the plan is `plan/`. Old scattered docs are archived. | The verification steps in `archive_do_not_edit/README.md` (post-archive) report no surviving root-level spec files. |

When all six criteria are satisfied, MVP is shipped and Phase 2 begins.
