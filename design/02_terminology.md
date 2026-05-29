# 02 — Terminology

All code, documentation, and interfaces in this ecosystem use the terms below consistently. When in doubt, prefer the canonical term and avoid the anti-patterns at the bottom of this document.

## System components

| Term | Meaning |
|---|---|
| **Questionnaire Library** | A three-layer concept (see [06_library.md](06_library.md) for the full callout): **(a)** the *software* — backend + web UI codebase that implements catalogue, search, contribution workflow; **(b)** the single *deployment* of that software operated by the operating organisation per OD-10; **(c)** the *content* inside (b) — validated questionnaires, reusable questions, option-sets, instructions, prompts, translations, reviews, ratings, usage statistics. Other docs say "the Library" without specifying which sense; per OD-10 the three map 1:1:1 in this project. |
| **Questionnaire Editor** | The authoring tool used to create, version, translate, and refine questionnaires. |
| **Questionnaire Viewer** | A generic term for any renderer that presents a questionnaire to a participant and captures responses. |
| **Web Viewer** | The browser-based viewer implementation. |
| **Native Viewer** | The Godot-based viewer implementation (desktop, mobile, kiosk, embedded). |
| **PDF export** | A static-PDF rendering of a questionnaire (paper administration). Produced by the Library or the Editor as an export format; not a viewer in the data-collection sense. |
| **Viewer Service** | The service that owns deployments, mints sessions, and brokers submission. Sits between the viewers and Behaverse. See [08a_viewer_service.md](08a_viewer_service.md). |
| **Participant Platform** | The longitudinal-study and participant-account service: enrolment, scheduling, consent, dashboards. |

## Content hierarchy

| Term | Meaning | Example |
|---|---|---|
| **Questionnaire** | A complete instrument: metadata, instructions, structured pages of questions, logic, scoring. | A validated open-licensed depression scale |
| **Block** | A cross-page thematic wrapper that references one or more Pages by ID. Used to express "Part A: Background" sections in long instruments, including section-level progress UI ("2 more pages in this block"). Optional; short instruments use Pages directly without Blocks. **Note:** in this project Block is the *larger* unit (matches cognitive-testing usage: "a block of 50 trials"), inverting the everyday English convention where Section > Block. | A "Part A" block holding three demographics pages |
| **Page** | A screen unit. The author controls which questions appear on which Page, and a Page has its own `show_if` for visibility and `randomize` for shuffling its entries. `page_id` is recorded in xAPI events and per-item responses. The required structural unit — every Question lives on some Page. | "Demographics page", "PHQ-9 items page 1" |
| **Section** | A within-page layout grouping (a labelled block or matrix on a single screen). A Section may carry a `shared_option_set` (inline or reference) to render its questions as a matrix. Optional; simple pages have no Sections and just list bare Questions. | A "Likert matrix" section on the symptoms page |
| **Scale / Subscale** | A named subset of questions scored together. Questions and subscales have a many-to-many relationship: one question can belong to several subscales; subscales reference questions, not the other way around. Orthogonal to Block/Page/Section. | "Anxiety subscale" |
| **Tag** | A free-form (or controlled-vocabulary) analytic label on a Question, used for codebooks, faceted analysis exports, and ad-hoc analytic groupings. Not an entity in the Library; lives as a `tags[]` array on each Question. | `["depression", "self-report", "screening"]` |
| **Question** | A single item requiring a response. Reusable across questionnaires. | "How often did you feel sad in the past week?" |
| **Item** | Synonym for *Question* in psychometric contexts. |
| **Option-set** | A reusable set of answer options, referenced by one or more questions. | The five-point Likert agree/disagree set |
| **Answer Option** | A single selectable choice within an option-set. | "Strongly agree" |
| **Instruction** | A reusable instructional block (text/media) presented to participants. | "Read each statement carefully…" |
| **Prompt** | A reusable text snippet inserted into questions (e.g. introductory or contextual). |
| **Translation** | A language-specific rendering of any text-bearing entity above. |

A **Questionnaire** is composed of top-level **`pages[]`**, optional **`blocks[]`** (referencing `page_ids`), optional **`subscales[]`** (referencing `question_ids`), and the **Questions / Option-sets / Instructions / Prompts** the pages and sections reference. The referenced reusable entities exist independently in the Library and may appear in many questionnaires. The pagination model is specified in OD-12 ([10_open_decisions.md](10_open_decisions.md)) and detailed in [05_data_model.md](05_data_model.md).

## User roles

| Role | Description | Typical permissions |
|---|---|---|
| **Researcher** | Authors questionnaires, designs studies, analyses data. | Edit own/team content, deploy, view collected data |
| **Participant** | Completes assigned questionnaires. | Complete assignments, view and export own data |
| **Administrator** | Operates the system. | Full access |
| **Reviewer** | Reviews questionnaires submitted to the Library. | Comment, approve/reject submissions |
| **Contributor** | Submits questionnaires to the Library. | Submit, respond to review feedback |
| **Guest (Anonymous)** | Browses the public Library; completes public deployments. | No login |

## Data concepts

| Term | Meaning | Format |
|---|---|---|
| **Questionnaire Definition** | The canonical JSON document fully describing a questionnaire's structure, content, logic, and scoring. | JSON, validated against the Definition Schema |
| **Questionnaire Metadata** | Bibliographic and psychometric properties of a questionnaire. | JSON, validated against the Metadata Schema |
| **Response Data** | Participant answers to questions in a session. | Behaverse trial format |
| **Event Data** | Fine-grained interaction telemetry. | xAPI 2.0 statements |
| **Session** | A single attempt by a participant to complete a questionnaire. | UUID v4 |
| **Submission** | A completed session with all data transmitted. |
| **Deployment** | An active instance of a questionnaire that participants can complete. | URL or access code |

## Identifiers

| Entity | Format | Example |
|---|---|---|
| Questionnaire | `qst_{slug}` | `qst_phq9` |
| Question | `q_{slug}` | `q_depression_1` |
| Option-set | `os_{slug}` | `os_likert5_agree` |
| Instruction | `ins_{slug}` | `ins_consent_v1` |
| Prompt | `pr_{slug}` | `pr_subscale_intro` |
| Scale / Subscale | `scl_{slug}` | `scl_anxiety` |
| Block | `blk_{slug}` | `blk_part_a` |
| Page | `page_{slug}` | `page_demographics` |
| Section | `sec_{slug}` | `sec_likert_matrix` |
| Deployment | `dep_{uuid8}` | `dep_a1b2c3d4` |
| Session | UUID v4 | `550e8400-e29b-41d4-…` |
| Version | Calendar version `vYY.MMDD` (per [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)) | `v26.0523` |

## Response states

| State | Meaning |
|---|---|
| **Not Started** | Deployment exists; no session created yet for this participant. |
| **In Progress** | Session created, partial responses recorded, can be resumed. |
| **Completed** | All required questions answered. |
| **Submitted** | Data received and durably stored at the Viewer Service. |
| **Forwarded** | Behaverse has acknowledged receipt of the submission (delivery receipt confirmed). |
| **Validated** | Submission passed all server-side validation rules at Behaverse. |
| **Abandoned** | Session inactive past the configured timeout without completion. |

The split between **Submitted** and **Forwarded** reflects OD-13's queued forwarding model: the Viewer Service stores submissions durably and returns success to the viewer immediately, then forwards to Behaverse asynchronously with retry. See [10_open_decisions.md](10_open_decisions.md) OD-13.

## Question types

The `type` field accepts either a **core short-name** (the small stable set below) or a **namespaced IRI** of the form `behaverse.org/types/{name}` for extension types. Each viewer's conformance manifest declares which core and extension types it supports.

### Core types

| Type | Description |
|---|---|
| `text` | Single-line text input |
| `textarea` | Multi-line text input (alternatively expressible as `text` with `style.multiline = true`) |
| `radio` | Single selection from a list |
| `checkbox` | Multiple selections allowed |
| `slider` | Continuous or discrete slider |
| `ranking` | Order items by preference |
| `date` | Date and/or time selection |
| `file` | File upload |
| `display` | Information only (instructions, separators, rich content). Carries an optional media payload (audio/video/image stimulus). |

### Demoted types (collapsed into a core type + a `style` value)

| Former type | Becomes |
|---|---|
| `dropdown` | `radio` + `style.layout = "dropdown"` |
| `vas` | `slider` + `style.anchors_visible_only = true` |
| `matrix` | A **Section** with `style.layout = "matrix"` and `shared_option_set` set (the matrix is N questions of type `radio` sharing an option-set, rendered together on one page). Not a question type. |
| `rating` | `radio` (or `slider`) + `style.icon = "star"` |
| `boolean` | `radio` with two options + `style.layout = "toggle"` |
| `media` | `display` with a media payload (the former type self-admitted it captured no response) |

### Extension types

Namespaced IRIs under `behaverse.org/types/...`. Examples: `behaverse.org/types/n_back`, `behaverse.org/types/clock_drawing`, `behaverse.org/types/iat`. Each extension type carries its own type-specific schema fragment, declared alongside its viewer support manifests.

## Validation types

| Type | Description |
|---|---|
| **Required** | The question must be answered. |
| **Format** | Response must match a pattern (e.g. email, regex). |
| **Range** | Numeric response within `[min, max]`. |
| **Length** | Character / item count within bounds. |
| **Cross-question** | Constraint over multiple questions (e.g. "if Q1 = yes, Q2 is required"). |

## Logic types

| Type | Description |
|---|---|
| **Skip logic** | Show/hide a question, section, page, or block based on prior answers. |
| **Branch logic** | Navigate to a different page based on conditions. |
| **Piping** | Inject a prior answer into later question text. |
| **Randomization** | Random ordering of questions, options, sections, pages, or blocks (declared on the instrument; the per-session seed strategy is on the deployment). |
| **Quota** | Limit responses per condition (e.g. stop after N per arm). |

## xAPI terminology

| Term | Meaning |
|---|---|
| **Actor** | The participant (UUID or pseudonym) performing the action. |
| **Verb** | The action taken (`viewed`, `answered`, `submitted`, `abandoned`, `recorded`, …). |
| **Object** | The target of the action (a question, page, section, block, questionnaire, or behavioural-channel attachment). |
| **Context** | Additional info (session ID, deployment ID, device, timing). |
| **Statement** | A complete xAPI event combining Actor + Verb + Object + Context. |
| **`recorded` verb** | The linker verb emitted when a behavioural-channel attachment (mouse trajectory, keyboard timing, future webcam/mic) is finalised. Its `result.extensions` carry `channel`, `sample_rate_hz`, `attachment_url`, `attachment_sha256`, `duration_ms`. The xAPI stream stays small (one statement per channel per session); the samples themselves live in the attachment. |

Extensions specific to this ecosystem are namespaced under `https://behaverse.org/xapi/extensions/`.

## Deployment modes

Modes are **named presets** that resolve to specific combinations of orthogonal dimensions in the Viewer Service (see [08a_viewer_service.md](08a_viewer_service.md)). Researchers pick a preset; the Viewer Service stores the resolved dimensions. Unusual combinations (e.g. *Kiosk Demo*) are expressible by setting dimensions directly via an "advanced" surface.

| Preset | Description | Resolved dimensions (auth / persistence / lifecycle / rendering_context) |
|---|---|---|
| **Anonymous Link** | Shareable URL, no account required. | `none` / `persisted` / `standard` / `standalone` |
| **Access Code** | Code-protected URL. | `access_code` / `persisted` / `standard` / `standalone` |
| **Platform Study** | Assigned to enrolled participants via the Participant Platform. | `platform_session` / `persisted` / `standard` / `standalone` |
| **Embedded** | Rendered inside another application (game, VR, kiosk). | `host_inherited` / `persisted` / `standard` / `embedded` |
| **Kiosk** | Native viewer on a locked device. | `local` / `persisted` / `kiosk_reset` / `standalone` |
| **Demo** | Visual-identical mode with no data persistence. | `none` / `ephemeral` / `standard` / `standalone` |
| **Preview** | Author preview from the Editor; short-lived; no data persistence. | `editor_session` / `ephemeral` / `preview_short_lived` / `standalone` |

## Data privacy terms

| Term | Meaning |
|---|---|
| **Anonymous** | No identifying information is collected. |
| **Pseudonymous** | A coded identifier is used; the key linking it to a real identity is held separately. |
| **Identified** | Direct identifiers are stored (name, email, etc.). |
| **Consent** | Explicit informed agreement to participate, recorded with timestamp. |
| **Data Controller** | Entity that determines the purposes of data processing. |
| **Data Processor** | Entity that processes data on behalf of the controller. |

## File and endpoint naming

- Questionnaire definitions: `{qst-id}_{version}.json` — e.g. `qst_phq9_v26.0523.json` (calendar version `vYY.MMDD` per [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning))
- Response exports: `{dep-id}_responses_{date}.csv` — e.g. `dep_a1b2_responses_2026-05-15.csv`
- Event logs (xAPI semantic events): `{dep-id}_events_{date}.jsonl`
- Behavioural-channel attachments: `{dep-id}_{session-id}_{channel}.{ext}` — e.g. `dep_a1b2_550e8400_mouse.jsonl.gz`

API endpoints use plural resource collections (`/questionnaires`, `/sessions`) and conventional resource IDs (`/questionnaires/{id}`). Actions on a resource use action suffixes (`/sessions/{id}/submit`).

## Naming conventions for data-model fields

All fields in data models owned by this project use **`snake_case`**. Fields inherited from external standards (xAPI verbs and contexts, Schema.org, Behaverse trial format) keep the standard's native casing; only project-owned fields follow the snake_case rule.

## Anti-patterns (terms to avoid)

| Avoid | Use | Reason |
|---|---|---|
| Survey | **Questionnaire** | "Survey" connotes marketing/customer feedback. |
| Form | **Questionnaire** | "Form" is too generic. |
| Test | **Assessment** or **Questionnaire** | "Test" implies right/wrong answers. |
| Quiz | **Questionnaire** | Too casual for research. |
| Response (alone) | **Response Data** or **Submission** | Ambiguous between item answer and full submission. |
| User | **Researcher** or **Participant** | Always be specific about the role. |
| Template | **Questionnaire Definition** | "Template" suggests an empty form. |

## Abbreviations

| Abbr. | Full term |
|---|---|
| xAPI | Experience API (IEEE 9274.3.1-2023) |
| UUID | Universally Unique Identifier |
| DOI | Digital Object Identifier |
| ORCID | Open Researcher and Contributor ID |
| GDPR | General Data Protection Regulation |
| WCAG | Web Content Accessibility Guidelines |
| ISO | International Organization for Standardization |
| JSON | JavaScript Object Notation |
| API | Application Programming Interface |
| CMS | Content Management System |
| OAuth | Open Authorization |
| REST | Representational State Transfer |
| CORS | Cross-Origin Resource Sharing |
