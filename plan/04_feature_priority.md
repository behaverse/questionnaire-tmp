# 04 — Feature Priority

Each question type and cross-cutting feature defined in [../design/02_terminology.md](../design/02_terminology.md) and [../design/05_data_model.md](../design/05_data_model.md) is mapped to a delivery phase here. As with use cases, the design folder defines *what* the feature is; this file defines *when* it lands.

A feature being assigned to a phase means: by the end of that phase, every component that should support the feature does so. Earlier phases may render or store the feature partially, but full end-to-end support is gated by the assigned phase.

## Question types

Per `design/02_terminology.md`, there are nine **core types** plus a set of **demoted types** that collapse into a core type + a `style` value. The table below tracks viewer support per core type; the demoted-type aliases are listed in a second sub-table for cross-reference.

### Core types

| Type | Phase first supported in viewers | Notes |
|---|---|---|
| `text` | Phase 2 | Single-line text input |
| `textarea` | Phase 2 | Multi-line text input (also reachable via `text` + `style.multiline = true`) |
| `radio` | Phase 2 | Single selection from a list. Covers former `dropdown` (via `style.layout = "dropdown"`), former `rating` (via `style.icon = "star"`), former `boolean` (two options + `style.layout = "toggle"`). |
| `checkbox` | Phase 2 | Multiple selections allowed |
| `slider` | Phase 2 | Continuous or discrete slider. Covers former `vas` (via `style.anchors_visible_only = true`). |
| `ranking` | Phase 2 | Order items by preference |
| `date` | Phase 2 | Date and/or time selection |
| `file` | Phase 2 (Web) / Phase 4 (Native) | File upload semantics differ across platforms |
| `display` | Phase 2 | Information-only blocks; carries an optional media payload (audio/video/image stimulus — required for behavioural paradigms; covers former `media`) |

### Structural layouts (not question types)

| Concept | Phase first supported in viewers | Notes |
|---|---|---|
| `matrix` layout | Phase 2 | Not a question type. Renders as a **Section** on a Page with `style.layout = "matrix"` and a `shared_option_set_id` — i.e., N `radio` questions sharing one option-set. Per OD-12 / `design/02_terminology.md`. |

### Extension types

| Type | Phase first supported in viewers | Notes |
|---|---|---|
| `behaverse.org/types/{name}` | Phase 4+ (Native) / Phase 6+ (Web) | Behavioural paradigms (`n_back`, `clock_drawing`, `iat`, …) registered under the Behaverse types namespace. Each carries its own type-specific schema fragment + per-viewer support manifest. |

The Library data model supports all of these from MVP (Phase 1); they are simply not *rendered* by any viewer until the listed phase.

## Cross-cutting features

### Core (must land with the first usable viewer)

| Feature | Phase | Notes |
|---|---|---|
| Skip logic | Phase 2 | Required for screening and adaptive flows |
| Branching | Phase 2 | Required by clinical instruments |
| Multi-language rendering | Phase 2 | Switching language in the viewer; the data is already multilingual from MVP |
| Validation rules (per-question) | Phase 2 | Required, format, range, length |
| Validation rules (cross-question) | Phase 2 | Conditional required-ness |
| Scoring rules | Phase 2 | Computed scores attached to submission |
| Anonymous deployment mode | Phase 2 | |
| Demo deployment mode | Phase 2 | |

### Advanced (after the viewer pipeline is proven)

| Feature | Phase | Notes |
|---|---|---|
| Randomisation (questions / options / pages) | Phase 2 | Useful early; ships with the first viewer |
| Piping (insert prior answer into later text) | Phase 3 | Tighter coupling with logic builder; ships with Editor |
| Session resume | Phase 2 (Web) / Phase 4 (Native) | Web Viewer ships with local-storage resume; Native Viewer adds robust offline resume |
| Response-time capture | Phase 2 | On by default per OD-07 (resolved 2026-05-21) |
| Mouse tracking | Phase 6 | Opt-in per OD-07; valuable for behavioural research but not core |
| Keyboard timing | Phase 6 | Opt-in per OD-07 |
| Webcam recording | Future (Phase 6+) | Always opt-in with explicit per-session consent |
| Microphone recording | Future (Phase 6+) | Always opt-in with explicit per-session consent |
| Theming infrastructure (deployment `theme_id`, built-in default + institutional templates) | Phase 2 | UC-13 — split per 2026-05-23 |
| Theming editor (logo upload, colour customisation, custom CSS, accessibility checks, theme versioning) | Phase 6 | UC-13 — split per 2026-05-23 |
| Webhook integrations | Phase 6 | UC-14 |
| Client SDKs (Python, R, JavaScript) | Phase 6 | UC-14 |

### Authoring features (Editor — Phase 3 by default)

| Feature | Notes |
|---|---|
| Visual structure editor | Required for UC-02 |
| Reusable-component pick-from-Library | The defining UX of the Editor |
| Logic builder | Skip / branching / piping / randomisation through a form UI |
| Validation builder | Per-question and cross-question |
| Scoring builder | Formula + interpretation |
| Translation interface | UC-03 |
| Version control + diff | |
| Import from SurveyJS / CSV | Tier-1 import surface; ship with the Editor (Phase 3) |
| Import from REDCap data dictionary | Backlog — promote when a partner study requires it |
| Import from LimeSurvey LSS/LSA | Backlog |
| Import from Qualtrics QSF | Backlog |
| Submission to Library | Closes the loop with the Library's contribution workflow |

### Participant Platform features (Phase 5)

| Feature | Notes |
|---|---|
| Participant accounts | |
| Study and protocol builder | UC-05 |
| Enrolment (researcher-initiated + self-enrolment) | |
| Randomised group assignment | |
| Assignment scheduler | OD-09 |
| Email notifications | |
| SMS notifications | Deferred unless promoted; OD covered in Platform spec |
| Participant dashboard | UC-09 |
| Compliance dashboard | UC-12 (full version) |
| Consent versioning | |
| Personal-data export and deletion | PRIV-03, PRIV-04 |

## Cross-cutting non-feature work

| Work item | Phase | Notes |
|---|---|---|
| Migrate `survey_database/` content into the Library | Phase 1 | Population of MVP catalogue |
| Canonical Schema 2 (Questionnaire Definition) authoring | Phase 1 | JSON Schema 2020-12 published at `behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` per the CalVer policy. Biggest single payoff; unblocks Library validation, Web Viewer rendering, Editor authoring, migration ETL. |
| WASM expression evaluator (OD-11) | Phase 2 | Independent project. Rust or AssemblyScript module embedded by Web Viewer, Native Viewer, and Editor preview. Ships with a normative test suite. |
| OD-10 lifecycle state machine grilling | Phase 1+ | Resolve `draft → in_review → published → withdrawn` permission details before `design/06_library.md`'s permission table is fully finalised. Not gating MVP but needed before published-content can flow through the contribution workflow. |

*All originally-tracked open decisions have been resolved.* Summary:
- *2026-05-15:* OD-02 (merged into OD-01), OD-03 (Editor preview), OD-04 (backend stack), OD-08 (identity).
- *2026-05-21:* OD-05 (override rules — B), OD-06 (deprecation — A), OD-07 (channel defaults), OD-09 (DB-driven scheduler), OD-10 (single Library, all lifecycle), OD-11 (WASM evaluator), OD-14 (session resume semantics).
- *2026-05-23:* OD-13 (queued forwarding via Postgres outbox), OD-01 (S1 — Pure custom canonical + Web Viewer renderer; no SurveyJS dependency), OD-12 (five-concept pagination model).
