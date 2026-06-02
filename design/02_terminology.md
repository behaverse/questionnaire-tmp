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

Per OD-15 (resolved 2026-05-31; full body in [05a_reusable_entities.md](05a_reusable_entities.md)) and OD-16 (resolved 2026-06-02; scoring-related entities and terms in [05b_scoring.md](05b_scoring.md)). The terms below replace the v26.0528 entity vocabulary.

| Term | Meaning | Example |
|---|---|---|
| **Questionnaire** | A complete instrument: metadata (Schema 1) plus structured pages of Items, blocks, subscales, logic. | A validated open-licensed depression scale |
| **Block** | A cross-page thematic wrapper that references one or more Pages by ID. Optional; short instruments use Pages directly. In this project Block is the *larger* unit (cognitive-testing usage), inverting everyday English. | A "Part A" block holding three demographics pages |
| **Page** | A screen unit. The required structural backbone — every Item lives on some Page. Carries an `elements[]` array (heterogeneous: Section / Message ref / saved Item ref + overrides / inline Item). | "PHQ-9 items page 1" |
| **Section** | A within-page layout grouping (matrix layout for shared-Option items). May carry a `shared_option` (inline or reference) that inner Items inherit. | A 9-item PHQ-9 matrix section |
| **Item** | The participant-administered unit: **Question + Option**. The thing that appears as one element on a Page. Saved as `it_*` Library entity (refs only) or authored inline. Use-specific fields (`required`, `show_if`) live on the Page element. | "Canonical PHQ-9 item 1" |
| **Question** | The "asking" composition: **Prompt + optional Context + optional Instruction**. Saved as `q_*` Library entity (refs only) or inline inside an Item. Does **not** include the response options. | A Question bundling a depression Prompt with its canonical Instruction |
| **Prompt** | The stem text the participant reads. Content-bearing entity (`pr_*`); carries `name`, `construct`, `dimension`, `topics[]`, `reversed`, and a `content` language-keyed map. | "How often did you feel sad in the past week?" |
| **Option** | The response-options specification. Content-bearing entity (`opt_*`) with structural fields (input/measurement type, value/index per choice, selection mode, min/max/step) at the top level and translatable text (label, units, per-choice text) inside `content`. Determines the UI input widget. | A 7-point agreement Likert; a numeric hours-per-week input |
| **Context** | Background paragraph that frames the meaning of an upcoming Question. Content-bearing entity (`ctx_*`). | "When we ask about 'physical activity' in the next questions, we mean…" |
| **Instruction** | How to interact with the response options. Content-bearing entity (`ins_*`). Carries an optional `dimension`. | "Rate each statement on the 7-point agreement scale" |
| **Message** | Standalone participant-facing text that is not a Question (welcome, end, transitions, informational). Content-bearing entity (`msg_*`) with `type` string-array. | "Thank you for participating." |
| **Placeholder** | Hint text inside an input field. Content-bearing entity (`ph_*`). | "e.g. 5" |
| **Help** | Tooltip / "?" content next to a field. Content-bearing entity (`help_*`). | "ORCID is a 16-digit identifier…" |
| **RegEx** | Reusable validation pattern. Content-bearing entity (`rx_*`); carries `regex` + `example_input` (structural, not translatable) plus optional `content.description`. ECMAScript flavour. | `^(19\|20)\d{2}$` for four-digit year |
| **Solution** | The correct response for a Prompt that has one. Hybrid ref-binding entity (`sol_*`) — refs Prompt + optional Option, carries an `expected_response` value. | The correct answer to an attention-check Item |
| **Subscale** | Per OD-16: a Library entity (`scl_*`) carrying only `id`, `name`, `description`, and translatable `content`. Membership lives on the Prompt side: `Prompt.subscales: string[]` lists the Subscale ids the Prompt belongs to (multi-valued). No `prompt_ids` or `weight_per_prompt` on the Subscale entity. | "PHQ-9 Anxiety subscale" referenced by `Prompt.subscales: ["scl_phq9_anxiety"]` |
| **Score** | Per OD-16: a named computed value declared in the Questionnaire's `scores[]: { id, scorer, path }`. Each entry references a JSON Pointer path into a Scorer's structured output. Consumable by LogicRule conditions and display layers. | `{id: "phq9_total", scorer: "scr_phq9@v26.0601", path: "/total"}` |
| **Scorer** | Per OD-16: a Library entity (`scr_*`) representing a versioned scoring procedure. Declares input schema, output schema, conformant implementations (WASM / HTTP / language packages), and test cases. The same logical Scorer can have multiple implementations; all must pass the same test cases. | `scr_phq9@v26.0601` |
| **`scored_value`** | Per OD-16 (16a): the post-reversal value per Item, computed by the viewer from `value` using the Prompt's `reversed` flag and the Option's range. Persisted alongside `value` in the response payload. Stored value wins on read. | `value: 2`, `scored_value: 4` (on a 1–5 reversed Likert) |
| **Construct** | The psychometric concept a Prompt loads on (`depression`, `sensation_seeking`). Open vocabulary with curator registry. Lives on Prompt only. | `sensation_seeking` |
| **Dimension** | The kind of judgment / scale (`agreement`, `frequency`, `duration`). Same concept on Prompt and Option; typically matches across a Prompt-Option pairing. Open vocabulary with curator registry. | `agreement` |
| **Reversed** | A boolean on Prompt: when true, the Prompt is worded as the *opposite* of its Construct. Scoring applies `value' = max + min − value`. | "Are you feeling sad?" with construct `happiness` → `reversed: true` |
| **Topic** | Free-form analytic label on a Prompt (in `topics[]`). | `["risk_taking", "novelty_seeking"]` |
| **Composition** | The structure that defines a questionnaire's contents — `metadata` + `pages[].elements[]` + `blocks[]` + `subscales[]`. Reserved for the questionnaire-level binding, not as a generic synonym for any ref-binding. | (the JSON document as a whole) |
| **UI input widget** | The user-interface control the viewer renders (radio, checkbox, slider, numeric spinner, text input). Derived from the Option's `(input_data_type, measurement_type, selection)` triple — not declared explicitly. | Radio buttons rendering an Option with `input_data_type: choice, selection: single` |

A **Questionnaire** is composed of top-level **`pages[]`**, optional **`blocks[]`** (referencing `page_ids`), optional **`subscales[]`** (referencing `prompt_ids`), and the **Items, Questions, Prompts, Options, Messages, Contexts, Instructions, Placeholders, Helps, RegExes, Solutions** the pages and sections reference. The referenced reusable entities exist independently in the Library and may appear in many questionnaires. The pagination model is specified in OD-12 and the entity model is specified in OD-15 ([10_open_decisions.md](10_open_decisions.md)); body in [05a_reusable_entities.md](05a_reusable_entities.md).

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
