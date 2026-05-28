# 05 — Data Model

This document defines the data formats the ecosystem uses. Every component speaks these formats; interoperability between Library, Editor, Viewers, and Participant Platform depends on them.

The actual JSON Schema files are not in this document; this document defines the **model** — entities, fields, relationships, and the open questions that must be answered before schema files are written. Schemas, once finalised, will be published at `https://behaverse.org/schemas/`.

## Adopted external standards

These are not defined here; we adopt them as-is.

| Standard | Used for |
|---|---|
| **JSON Schema Draft 2020-12** | Validating every JSON document the ecosystem produces |
| **xAPI 2.0** (IEEE 9274.3.1-2023) | Interaction event telemetry |
| **ISO 639-1** | Language codes |
| **ISO 8601** | Timestamps and durations |
| **UUID v4** (RFC 4122) | Unique identifiers for sessions and deployments |
| **[Calendar Versioning (CalVer)](https://behaverse.org/schemas/#versioning)** | Version numbering for schemas, questionnaires, and reusable entities. Format `vYY.MMDD`. Aligns with the Behaverse schemas versioning policy. |
| **Schema.org** | Bibliographic metadata patterns |
| **Dublin Core** | Metadata elements for catalogue records |
| **DataCite** | Research citation metadata |
| **Behaverse Trial Format** ([spec](https://behaverse.org/data-model/spec/trials/response.html)) | Response data |

## Field-naming convention

All fields in data models owned by this project use **`snake_case`**. Fields inherited from external standards (xAPI verbs and context keys, Schema.org property names, Behaverse trial format keys) keep the standard's native casing; only project-owned fields are renamed.

## Schemas to define (Behaverse-published)

| # | Schema | Purpose | Hosted at |
|---|---|---|---|
| 1 | Questionnaire Metadata | Bibliographic + psychometric properties, licensing, provenance | `behaverse.org/schemas/questionnaire/metadata/vYY.MMDD.json` |
| 2 | Questionnaire Definition (Canonical) | Structural specification (pages, blocks, sections, questions, subscales, tags, style, flow, logic, scoring, translations) | `behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` |
| 3 | Questionnaire Runtime | Optimised for viewer rendering — a denormalised view of Schema 2 (references resolved, translations applied for the requested language, scoring optionally stripped) | `behaverse.org/schemas/questionnaire/runtime/vYY.MMDD.json` |
| 4a | Event Data (xAPI) | Semantic events: viewed, answered, navigated, submitted, recorded, … | `behaverse.org/schemas/questionnaire/events/xapi/vYY.MMDD.json` |
| 4b | Behavioural Channels | Per-session attachments for continuous data (mouse, keyboard, future webcam/microphone) | `behaverse.org/schemas/questionnaire/channels/vYY.MMDD.json` |
| 5 | Response Data | Participant answers per item / per session | `behaverse.org/schemas/questionnaire/response/vYY.MMDD.json` |
| 6 | Session Metadata | Session-level tracking | `behaverse.org/schemas/questionnaire/session/vYY.MMDD.json` |

## Reusable-component model

A central design choice in this ecosystem: **questions, option-sets, instructions, prompts, and translations are independent versioned entities in the Library, not inline blobs in each questionnaire.**

A Questionnaire Definition is a composition of references to these entities. The Library is the source of truth for the entities themselves; the questionnaire is the source of truth for the composition (which entities, in what order, with what logic).

**Forward-looking commitment.** The reusable-component model is chosen to *encourage and reward reuse going forward* — not to retrofit a description of past authoring practice. Legacy migrations populate the pool from existing content; the model's success is measured against the reuse curve of newly-authored content, evidenced by usage counts across independent studies.

### Reusable entities

| Entity | ID prefix | Content |
|---|---|---|
| **Question** | `q_` | Prompt, type, type-specific properties, optional default option-set reference, optional validation rules |
| **Option-set** | `os_` | An ordered list of answer options, each with a value and a text. Reused by many questions (e.g. one Likert-5 set used across hundreds of items). |
| **Instruction** | `ins_` | Rich-text instructional block (Markdown / HTML allowed) |
| **Prompt** | `pr_` | Short reusable text snippets (subscale intros, transitions) |
| **Translation** | (no prefix; keyed by target entity + language) | The localised text for any text-bearing field of any entity above |

Each entity carries: its ID, calendar version, language of the canonical text, ownership, and a usage count (how many questionnaires reference it).

A questionnaire references a specific **versioned** entity (`q_depression_1@v26.0523`), so updates to an entity do not silently change deployed questionnaires.

### Open questions on the reusable model

These are deliberately not resolved in this document; they appear in [10_open_decisions.md](10_open_decisions.md):

- How are inline overrides handled? Can a questionnaire override the prompt text of a referenced question, or must it create a derived question?
- How are translations versioned independently from the source-language text they translate?
- What is the conflict-resolution rule if a referenced question is deprecated while a draft questionnaire still references it?

---

## Schema 1 — Questionnaire Metadata

**Purpose.** Bibliographic and psychometric properties for cataloguing, search, and citation. Embedded in every Questionnaire Definition's `metadata` field, and also queryable independently from the Library.

**Related standards.** Schema.org `ScholarlyArticle`, Dublin Core, DataCite.

**Required fields.**

| Field | Type | Notes |
|---|---|---|
| `id` | string | `qst_{slug}` |
| `title` | string | Full official title |
| `version` | string | Calendar version `vYY.MMDD` (per [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)) |
| `language` | string | Canonical language (ISO 639-1) |
| `authors` | array of objects | Each with `name`; optional `orcid`, `affiliation` |
| `publication` | object | At minimum `year` and `citation`; optional `doi`, `isbn`, `publisher`, `license`, `url` |

**Recommended fields.**

| Field | Notes |
|---|---|
| `short_title` | Common abbreviation (e.g. "PHQ-9") |
| `description` | One- to two-sentence description |
| `available_languages` | All ISO 639-1 codes with validated translations |
| `classification` | `domain[]`, `population[]`, `tags[]`, `age_range`, `administration_mode[]` |
| `psychometrics` | `item_count`, `estimated_minutes`, `reliability[]`, `validity[]`, `norms[]` |
| `license` | Controlled-vocabulary tag from [11_content_licensing.md](11_content_licensing.md) (e.g. `public_domain`, `cc_by`, `proprietary_open_redistribution`, `proprietary_restricted`, `unknown`, `mixed_see_components`). May also carry `license_notes`, `rights_holder`, `request_url`. |
| `usage` | `requires_permission`, `cost`, `clinical_use_only`, `training_required` |
| `provenance` | (Imported content only.) `source`, `source_version`, `imported_at`, `imported_by`, `import_loss_report_url`, `importer_version`. See [13_importers.md](13_importers.md). |
| `timestamps` | `created`, `modified`, `published` (ISO 8601) |

The structure of `psychometrics.reliability[]` and `psychometrics.validity[]` follows the existing draft in `schemas/questionnaire_metadata.md` (archived).

Reusable entities below the questionnaire level (questions, option-sets, instructions, prompts) also carry their own `license` tag. The **effective composite license** for a questionnaire is computed at display time from the maximum-restriction across its components and its own tag; both per-component and effective-composite are surfaced in the Library UI.

---

## Schema 2 — Questionnaire Definition (Canonical)

**Purpose.** Complete structural specification. The source of truth for what a questionnaire is. Stored in the Library; produced by the Editor; consumed by viewers.

**Root structure.**

```jsonc
{
  "$schema": "https://behaverse.org/schemas/questionnaire/definition/v26.0523.json",
  "id": "qst_phq9",
  "version": "v26.0523",
  "metadata":     { /* Schema 1 */ },
  "style":        { /* questionnaire-level appearance */ },
  "flow":         { /* navigation, completion, randomisation declarations */ },
  "translations": { /* per-language overrides */ },
  "pages":        [ /* Page objects (required structural backbone) */ ],
  "blocks":       [ /* Block wrappers referencing page_ids (optional) */ ],
  "subscales":    [ /* Subscale objects referencing question_ids (optional) */ ],
  "logic":        [ /* Logic rules */ ],
  "scoring":      [ /* Scoring definitions */ ],
  "validation":   { /* cross-question validation rules */ }
}
```

The five-concept structural model (Block, Page, Section, Subscale, Tag) is specified in OD-12 ([10_open_decisions.md](10_open_decisions.md)). Pages are the required structural backbone; Blocks and Subscales are top-level wrappers that reference pages and questions by ID respectively; Sections live inside their owning Page (containment, since their scope is one page only); Tags are per-question labels.

### Page

A Page is the screen unit and the required structural backbone of a questionnaire. The author controls which questions appear on which Page. Every Question lives on exactly one Page; the same question entity (referenced from the Library) may appear on different Pages of different questionnaires.

```jsonc
{
  "id": "page_demographics",
  "title": "Demographics",
  "description": "Optional",
  "entries": [
    /* mix of Section objects and bare Question objects/references */
  ],
  "show_if": null,                 // logic expression, optional — hides the whole page
  "randomize": false,              // shuffle entries within this page
  "style": { /* page-level appearance overrides */ }
}
```

Pagination is page-by-page by default. Each Page renders as one screen.

### Section

A Section is a within-page layout grouping. It contains questions only (not other Sections — no nesting) and lives inside a Page's `entries[]` alongside any bare Questions on that page. The most common use is a labelled block or a matrix layout (where all questions in the Section share an option-set).

```jsonc
{
  "id": "sec_likert_matrix",
  "title": "Symptoms",
  "questions": [ /* references to or inline Question objects */ ],
  "show_if": null,                 // logic expression, optional — hides the section; other entries on the page still render
  "randomize": false,              // shuffle questions within this section
  "shared_option_set_id": null,    // set when all questions in the section share an option-set (matrix layout)
  "style": { /* section-level appearance overrides; "layout": "matrix" renders the section as a matrix */ }
}
```

Sections cannot nest in the current schema. Sections cannot span pages.

### Block

A Block is a cross-page thematic wrapper. Unlike Page and Section, a Block does not own its content — it *references* pages by ID, the same way a Subscale references questions. A Page may belong to zero, one, or several Blocks. Block UI affordances include section-level progress signals ("2 more pages in this block").

```jsonc
{
  "id": "blk_part_a",
  "title": "Part A: Background",
  "description": "Optional",
  "page_ids": ["page_demographics", "page_history"],
  "show_if": null,                 // logic expression, optional — hides the whole block (all referenced pages)
  "randomize": false               // shuffle the order in which the referenced pages appear
}
```

Blocks declare structural intent without enforcing it: the canonical reading order of a questionnaire is `pages[]` order at the top level. Block UI is layered over that.

### Subscale

Subscales are first-class top-level entities, separate from Pages, Sections, and Blocks. The relationship between questions and subscales is many-to-many: one question may belong to multiple subscales; subscales declare which questions belong to them by ID.

```jsonc
{
  "id": "scl_anxiety",
  "name": "Anxiety",
  "description": "Optional",
  "question_ids": ["q_anx_1", "q_anx_2", "q_anx_3", "q_validity_1"],
  "weight_per_question": null      // optional map of {question_id: weight}; defaults to 1.0 each
}
```

### Question

Each question carries (at minimum): `id`, `type`, `prompt`, optional `required`, optional `show_if`, optional `validation`, optional `style`, optional `tags[]`, and `properties` (type-specific).

The `type` field accepts either a **core short-name** (`text`, `textarea`, `radio`, `checkbox`, `slider`, `ranking`, `date`, `file`, `display`) or a **namespaced IRI** of the form `behaverse.org/types/{name}` for extension types. The list and mapping is in [02_terminology.md](02_terminology.md).

The `tags[]` field is a list of free-form (or controlled-vocabulary) labels used for analysis grouping, codebook generation, and faceted analysis. Tags are not entities in the Library; they are per-question metadata. A question can carry any number of tags. Tags are not used by viewers for runtime behaviour — they pass through into response exports for the researcher's analysis tools.

Where reusable-component references are supported, a question entry in a Page or Section is either:

- a **reference** to an existing question entity in the Library: `{ "$ref": "q_depression_1@v26.0523" }` with a defined set of allowed local overrides (see below), or
- an **inline** question object with all fields present.

**Allowed overrides on a Library reference** (per OD-05, resolved 2026-05-21):

| Field | Overridable on reference? | Notes |
|---|---|---|
| Position (place in the parent's `entries[]` / `questions[]`) | **Yes** | Determined by the reference's location in the composition; no "override" per se. |
| `required` flag | **Yes** | The same question may be optional in one questionnaire and required in another. |
| `show_if` | **Yes** | Visibility logic is a property of the *usage*, not the entity. |
| Per-question `style` | **No** | Style is part of the entity's identity; deviations must fork. (This narrows the prior wording — the strict cross-study analytic guarantee wins.) |
| `prompt`, `type`, `properties`, `validation`, `tags`, default option-set | **No** | Content edits require forking a derived entity in the Library. |

When an author edits a non-overridable field, the Editor surfaces a fork prompt (see [07_editor.md](07_editor.md) §"Reusable-component workflow") with three actions: derive locally, propose a new shared version through the Library's PR workflow, or cancel.

Rationale: cross-study analytic integrity requires that `q_depression_1@v26.0523` means *the same prompt, the same options, the same validation* wherever it appears. Visibility and required-ness are properties of how a question is *used* in a particular flow, not of the question itself.

### Style and flow

The questionnaire owns two top-level blocks for instrument-level appearance and runtime behaviour:

- **`style`** — *how the instrument looks.* Examples: `progress_bar` (boolean), `question_numbering` (`"sequential"`, `"per_page"`, `"none"`), `label_visible` (default for all questions).
- **`flow`** — *how the participant moves through the instrument.* Examples: `allow_back` (boolean), `require_complete` (boolean), `randomize_pages` (boolean), `randomize_pages_in_block` (array of block IDs), `randomize_questions_in_page` (array of page IDs), `randomize_questions_in_section` (array of section IDs), `max_time_seconds` (number or null).

The same `style` and `flow` keys may also appear on a Block, a Page, a Section, and a Question (each overriding the next-higher level's default for content scoped within it). Inheritance order — questionnaire → block → page → section → question — applies; the most specific declaration wins.

Deployment-configurable subset (see [08a_viewer_service.md](08a_viewer_service.md)):

- **Overridable at deployment time** (deployment value wins when specified; falls back to the instrument's value otherwise): `style.progress_bar`, `style.question_numbering`, `flow.max_time_seconds`.
- **Instrument-only** (deployment cannot override; changing requires a new instrument version): `flow.allow_back`, `flow.require_complete`, `flow.randomize_pages`, `flow.randomize_pages_in_block`, `flow.randomize_questions_in_page`, `flow.randomize_questions_in_section`.

Deployment-specific configuration that does **not** live in the questionnaire (it lives in the Viewer Service's deployment record): theme, redirect URL, completion message, randomisation seed strategy, show-score flag, active-from/until window, quota.

### Translations

A flat map keyed by `language → field-path → translated-text`, where `field-path` uses dotted/bracket notation matching the canonical document (`pages[0].entries[0].prompt` for a bare question; `pages[0].entries[1].questions[0].prompt` when the entry is a Section).

Each entry carries a `status`: `draft`, `complete`, or `validated`. Only `validated` translations are served to participants (see "Locale resolution" below).

### Logic

A list of rules. Each rule has a `type`, a `condition` (boolean expression over question IDs), and an `action`.

Recognised rule types:

| Type | Action target | Effect |
|---|---|---|
| `skip` | a page / block / question ID | Skip to target when condition is true |
| `visibility` | a question / section / page / block ID | Show or hide target based on condition |
| `piping` | a text field path | Substitute another question's answer into the text |
| `branch` | a page ID | Navigate to a non-default next page |

**Expression syntax.** Operators `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`; helper functions `contains()`, `is_empty()`, `length()`, `sum()`, `avg()`. Identifiers reference question IDs.

**Canonical evaluator.** Detailed semantics (type coercion, missing-value behaviour, multi-select references, date arithmetic, translation-aware references) are defined by **a single WASM module** that ships alongside the schemas (per OD-11, resolved 2026-05-21). The same binary is embedded by the Web Viewer, the Native (Godot) Viewer, and the Editor preview — guaranteeing identical evaluation by construction (deterministic float arithmetic, deterministic date arithmetic, deterministic locale-aware comparisons). A normative test suite ships alongside the module as a regression harness, not as the cross-viewer contract.

### Scoring

A list of named computations over responses.

```jsonc
{
  "id": "total_score",
  "name": "Total score",
  "formula": "sum(scl_depression)",
  "range": [0, 27],
  "interpretation": [
    { "min": 0,  "max": 4,  "label": "None to minimal" },
    { "min": 5,  "max": 9,  "label": "Mild"            },
    { "min": 10, "max": 14, "label": "Moderate"        },
    { "min": 15, "max": 19, "label": "Moderately severe" },
    { "min": 20, "max": 27, "label": "Severe"          }
  ]
}
```

Scoring formulas may reference subscale IDs (`sum(scl_anxiety)`, `mean(scl_validity)`) or question-ID patterns (`sum(q_depression_*)`). Subscale references are preferred when subscales are declared, because they make the dependency explicit.

Computed scores are emitted as part of the submission and are available in the participant dashboard (when configured) and in researcher exports.

### Validation

Per-question validation lives on the question itself. Cross-question validation (e.g. "if Q1 = yes, Q2 must be answered") lives in the top-level `validation` block as a list of rules with the same expression language as `logic.condition`. Validation expressions are evaluated by the same WASM module that evaluates logic and scoring (per OD-11).

### Versioning rules

Per OD-06 (resolved 2026-05-21), and aligned with the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning) (Calendar Versioning `vYY.MMDD`), every reference from a questionnaire to a reusable Library entity (`q_*`, `os_*`, `ins_*`, `pr_*`) **hard-pins** to a specific calendar version: `q_depression_1@v26.0523`. The runtime contract:

- Published entity versions are immutable. A new version produces a new entry; the old entry remains addressable for as long as anything references it.
- Reference resolution: the version is part of the reference; no implicit "latest" semantics exist. A reference without `@version` is a schema violation.
- Deprecation: an entity may carry a `deprecated` flag (separate from the version itself). Deprecation marks the entity but never removes it; deployed questionnaires keep rendering. The Editor warns at edit time when a referenced entity is deprecated; the author may continue with the deprecated version, upgrade explicitly, or fork.
- New versions never silently flow into existing questionnaires — published or draft. The Editor surfaces "new version available" as an explicit notification with a diff and an explicit upgrade action; the author chooses.
- A separate **deprecation-conflict rule:** if a referenced entity version is being withdrawn (per the Library takedown procedure in [11_content_licensing.md](11_content_licensing.md)), the Library marks the version `withdrawn` but keeps the content addressable; deployed questionnaires keep rendering. The dependency-graph API ([06_library.md](06_library.md)) lets a contributor see the impact surface before proposing a withdrawal.
- **Property URIs remain stable across versions** (per the Behaverse policy), ensuring backward compatibility at the property level even when the parent schema or entity is re-versioned.

**Breaking-vs-non-breaking under CalVer.** The version string itself (e.g. `v26.0523`) does not encode whether a change is breaking — CalVer dates are pure timestamps. The analytic distinction is carried by a separate `severity` metadata field on each new version:

| `severity` value | Meaning (preserves the analytic content of the older SemVer Major/Minor/Patch framing) |
|---|---|
| `breaking` | Changes that alter responses or scoring — re-wording an item, changing an option-set, changing a scoring formula. Tools should treat this version as analytically distinct from prior versions. |
| `additive` | Additions that do not change existing responses — a new optional question, a new translation, a new psychometric data point. |
| `corrective` | Corrections that should not affect interpretation — typos, formatting, comment text. |

With hard-pinning, none of these flow into a referencing questionnaire automatically — even a `corrective` version requires explicit author opt-in. The `severity` tag exists to inform the author's decision, not to authorise auto-upgrade.

### Open questions for Schema 2

These four questions were left open in the original draft (`archive_do_not_edit/specs/05_DATA_STANDARDS.md`) and are tracked as requirements the eventual schema must satisfy. Concrete syntax is produced when the schemas are authored:

1. **Validation rules.** The schema must encode per-question validation (required, format, range, length) and cross-question validation in a way that is portable across viewers. Validation messages must be translatable.
2. **Logic rules.** The schema must encode skip, branching, piping, and visibility rules in a viewer-independent expression language. The same logic must evaluate identically in the Web Viewer, the Native Viewer, and the Editor preview (see OD-11 — reference expression evaluator).
3. **Versioning and translations.** Questionnaires evolve. The schema supports calendar versioning (`vYY.MMDD`, per the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)) at the questionnaire level, the reusable-entity level, and the per-language translation level. The version number itself does not encode breaking-vs-non-breaking — that distinction is carried by a separate `severity` metadata tag (see §"Versioning rules" below).
4. **Scoring and analysis.** The schema must encode scoring definitions (sums, means, weighted, subscales, derived scores) and their interpretation (cutoffs, severity bands, norm-based percentiles) in a form a viewer can execute and a researcher can audit.

All decisions referenced from this schema are resolved; see the Resolution log in [10_open_decisions.md](10_open_decisions.md): OD-01 (canonical-format stack), OD-05 (overrides), OD-06 (versioning), OD-11 (expression evaluator), OD-12 (structural model).

---

## Schema 3 — Questionnaire Runtime

**Purpose.** Optimised for viewer rendering. Per OD-01 (resolved 2026-05-23 → S1 Pure custom), Schema 3 is a **flattened, denormalised view of Schema 2** produced by the Viewer Service (or computed client-side by the viewer) when minting a session:

- Reusable-entity references (`$ref: "q_x@v26.0523"`) resolved to inline question objects.
- Translations applied for the participant's active locale; only the active-locale text is included.
- Logic / validation / scoring blocks pass through unchanged for the viewer's WASM evaluator (OD-11) to consume.
- Optional: scoring formulas may be stripped if the deployment's `show_score` is false (the formulas still travel with the submission, but the viewer never evaluates them).

The contract: Schema 3 must encode every Schema 2 feature the viewer's conformance manifest claims to support; nothing else.

---

## Schema 4a — Event Data (xAPI semantic events)

**Purpose.** Semantic interaction telemetry — one statement per action. Every viewer emits xAPI 2.0 statements with a consistent vocabulary, batched and sent to the Viewer Service (which forwards to Behaverse).

**Standard.** [xAPI 2.0 / IEEE 9274.3.1-2023](https://github.com/adlnet/xAPI-Spec).

**Verbs used by this ecosystem.**

| Verb | When emitted |
|---|---|
| `initialized` | Session created (viewer loaded the questionnaire) |
| `launched` | First page actually shown to the participant |
| `viewed` | A page (or media stimulus, or a section / block transition) was rendered |
| `focused` | A question received focus |
| `answered` | A question received a response (initial or changed) — `result.extensions.response_time_ms` carries the per-question RT |
| `navigated` | The participant moved between pages |
| `paused` | The participant paused (visibility change, session inactivity) |
| `resumed` | The participant returned after a pause |
| `completed` | All required questions answered |
| `submitted` | Session data confirmed sent to Behaverse |
| `abandoned` | Session timed out without completion |
| `recorded` | Linker statement for a behavioural-channel attachment (Schema 4b) — `result.extensions` carries `channel`, `sample_rate_hz`, `attachment_url`, `attachment_sha256`, `duration_ms` |

**Custom extensions.** Namespaced under `https://behaverse.org/xapi/extensions/`. Common extensions include `page_id`, `section_id` (when applicable), `block_id` (when applicable), `question_index`, `total_questions`, `device_type`, `viewport`, `input_method`, `orientation`, `previous_answer`, `change_count`, `time_since_page_view`, and `locale` — an object `{ language, region? }` carrying the participant's active locale at the moment of the event (see "Locale resolution" below). The `locale` extension shape matches the `locale` field in per-item responses (Schema 5) for symmetric analysis.

**Transport.** Newline-delimited JSON Lines (`.jsonl`), one statement per line. Batched in-viewer (typical batch: every 5 seconds or every 20 statements). Each batch is POSTed to the Viewer Service's events endpoint. In offline mode, batches accumulate locally and flush when connectivity returns.

Per-session statement count is bounded — typically 50–500 statements per completed session. High-frequency continuous data (mouse, keyboard, webcam, microphone) is **not** carried in xAPI statements; it goes in Schema 4b attachments.

---

## Schema 4b — Behavioural Channels (per-session attachments)

**Purpose.** Continuous, high-frequency behavioural signals that don't fit the actor-verb-object frame: mouse trajectories, keystroke timing, future webcam and microphone. Captured as compact per-session files; referenced from the xAPI stream via one `recorded` statement per channel.

**Channels.**

| Channel | Captured | Format | Sample rate |
|---|---|---|---|
| `mouse` | Position, button state, time | JSON Lines or Parquet | Configurable (default 30 Hz when enabled) |
| `keyboard` | Keystroke timing, inter-key intervals (not the keys themselves except for designated paradigms) | JSON Lines | Event-driven |
| `webcam` *(future)* | Video stream | WebM | Capture-driven |
| `microphone` *(future)* | Audio stream | WAV or Opus | Capture-driven |

**Per-channel attachment record.** Stored separately (object storage), referenced from xAPI by a single `recorded` statement. The statement carries:

- `result.extensions.channel` — channel name.
- `result.extensions.sample_rate_hz` — for sampled channels.
- `result.extensions.attachment_url` — stable URL to the attachment.
- `result.extensions.attachment_sha256` — content hash.
- `result.extensions.duration_ms` — captured duration.

**Transport.** Chunked upload from the viewer to the Viewer Service: `POST /sessions/{session_id}/channels/{channel_name}` accepts an attachment in chunks; the final call closes the channel and triggers the `recorded` xAPI statement emission.

**Response time (RT).** Treated at *both* levels:

- **Summary RT** — per-question latency — stays as a `result.extensions.response_time_ms` on the `answered` xAPI statement (Schema 4a). Cheap to capture, easy to query from the xAPI stream alone. Default on; see OD-07.
- **Detailed RT** — per-keystroke / intra-question dynamics — when captured, goes in the keyboard channel attachment (Schema 4b).

**Deployment-level default-state matrix** (per OD-07, resolved 2026-05-21):

| Channel | Default state | Researcher action required | Participant action required |
|---|---|---|---|
| Summary RT (Schema 4a `answered.response_time_ms`) | **On** | None (disable if not wanted) | None |
| `mouse` | **Opt-in** | Enable per deployment | None (covered by deployment-time consent text) |
| `keyboard` | **Opt-in** | Enable per deployment | None (covered by deployment-time consent text) |
| `webcam` *(future)* | **Opt-in** | Enable per deployment | Explicit per-session consent prompt before any media access |
| `microphone` *(future)* | **Opt-in** | Enable per deployment | Explicit per-session consent prompt before any media access |

Channels that are not enabled produce no attachment and no `recorded` xAPI statement; downstream consumers don't know the channel exists. The webcam / microphone two-layer consent (researcher enables on the deployment AND participant explicitly grants at session start) is the privacy floor; no silent recording is possible under any combination of settings.

---

## Schema 5 — Response Data

**Purpose.** Participant answers to questions, in a standardised analysis-ready format.

**Basis.** [Behaverse Response Trial Format](https://behaverse.org/data-model/spec/trials/response.html).

**Two emission modes:**

1. **Per item.** A single response object emitted as soon as a question is answered. Useful for streaming dashboards and resilience to mid-session drop-outs.
2. **Batched per session.** All responses, plus computed scores and metadata, emitted once at submission. Useful for offline collection.

Both modes coexist. A viewer may emit per-item statements *and* a final batched submission; deployment configuration decides.

**Per-item response (sketch):**

```jsonc
{
  "trial_type":   "questionnaire_response",
  "trial_index":  1,
  "time_elapsed": 3500,
  "session_id":   "550e8400-…",
  "questionnaire_id": "qst_phq9",
  "question_id":  "q_depression_1",
  "question_type": "radio",
  "response":     1,
  "response_text": "Several days",
  "rt":           4200,
  "locale":       { "language": "en", "region": null }
}
```

**Session batch (sketch):**

```jsonc
{
  "session_id":             "550e8400-…",
  "questionnaire_id":       "qst_phq9",
  "questionnaire_version":  "v26.0523",
  "status":                 "completed",
  "started_at":             "2026-02-06T14:30:00Z",
  "completed_at":           "2026-02-06T14:42:15Z",
  "initial_locale":         { "language": "en", "region": null },
  "responses":              [ /* per-item objects */ ],
  "computed_scores":        { "total_score": 8 },
  "device_info":            { "platform": "web", "device_type": "desktop", "viewport": "1920x1080" }
}
```

Each per-item response carries the `locale` *active at the time of the answer* — this supports mid-session language switching (per "Locale resolution" below). The session-level `initial_locale` records the language at session start, for convenience in analyses that treat language as a session-level attribute.

**Export formats** for researcher analysis: CSV wide, CSV long (tidy), SPSS `.sav` (with variable/value labels), R `.rds`, JSON. Codebook generation accompanies tabular exports.

---

## Schema 6 — Session Metadata

**Purpose.** Identifies a single attempt at a questionnaire and ties responses, events, and (where applicable) Participant Platform assignments together.

**Required fields:** `session_id` (UUID v4), `questionnaire_id`, `questionnaire_version` (pinned at session-mint per OD-14 sub-question 3), `status`, `started_at`.

**Recommended fields:** `deployment_id`, `participant_id`, `completed_at`, `submitted_at` (Viewer Service receipt), `forwarded_at` (Behaverse delivery receipt — see OD-13), `forward_attempts` (integer, default 0), `forward_failure_reason` (last error message if any), `initial_locale` (`{ language, region }`), `last_active_locale` (`{ language, region }` — persisted per OD-14 sub-question 6; equal to `initial_locale` until the participant switches mid-session), `device` (user-agent, platform, device type, viewport, timezone).

**Resumable-state shape** (per OD-14, resolved 2026-05-21): the viewer's local resumable store mirrors a subset of Schema 6 plus the per-question answer values. The minimum durable state for a `persistence=persisted` session is:

- `session_id`, `questionnaire_version` (pinned)
- `last_active_locale`
- `current_page_id` and the per-question answer values for every answered question on every visited page
- The set of pages visited (so the viewer knows where the participant has been; combines with `current_page_id` and the `pages[]` ordering to compute the resume target)

Persistence granularity (per OD-14 sub-question 2): the viewer writes to the local store on every answer change, debounced ~500 ms for text inputs. For `persistence=persisted` deployments the local store is mirrored to the Viewer Service through the existing per-item response endpoint.

The full state machine is `not_started → in_progress → completed → submitted → forwarded → validated`, with `abandoned` as a sink state from `in_progress`. The split between `submitted` (received at the Viewer Service) and `forwarded` (acknowledged by Behaverse) reflects OD-13's queued forwarding model; see [10_open_decisions.md](10_open_decisions.md) OD-13 for the lifecycle rationale.

---

## Locale resolution

Every participant session has a single *active locale* at any moment, used to select translated text and locale-sensitive rendering (dates, numbers). The locale is resolved when the session starts and may change mid-session (in-viewer language switcher); each per-item response and each xAPI `answered` statement carries the locale active at that moment.

### Locale shape

A locale is `{ language, region? }`:

- `language` — required, ISO 639-1 code (e.g. `"en"`, `"pt"`, `"ar"`).
- `region` — optional, ISO 3166-1 alpha-2 code (e.g. `"BR"`, `"PT"`). Used for region-sensitive rendering (date formats, decimal separators) when present; ignored for translation matching.

Translations are keyed by `language` only. `pt-BR` and `pt-PT` resolve to the same translation entries; the `region` distinguishes only locale-sensitive rendering.

### Resolution precedence

At session start, the Viewer Service determines the active locale by precedence (highest wins):

1. URL `?lang=xx` query parameter (explicit user request).
2. Participant Platform profile (authenticated platform-study deployments).
3. Deployment-level `default_locale`.
4. Browser `Accept-Language` header, intersected with available translations.
5. Questionnaire canonical language.

### Available-translations rule

A language is *available* for serving only if **every required-rendered field has a `validated` translation** (not `draft`, not `complete`). Partial translations are not served. If a language doesn't qualify at any step in the precedence chain, the resolver falls through to the next step. No mixed-language rendering: a viewer never displays English placeholders inside a Portuguese flow.

### Mid-session switching

Participants may switch the active locale at any time (subject to viewer support and the deployment's allowed-languages list). On switch:

- The viewer re-renders subsequent content in the new locale.
- The session's `initial_locale` does not change.
- Each subsequent `answered` xAPI statement and each per-item response record the new `locale`.

### RTL

Languages tagged RTL (Arabic, Hebrew, Persian, Urdu) trigger viewer-side `dir="rtl"` symmetrically. Conformance manifests declare `rtl_supported`; deployments cannot serve a questionnaire in an RTL language to a viewer that lacks RTL support.

### Expression evaluation and locale

Expressions in `logic`, `validation`, and `scoring` evaluate against **canonical option-set values**, not localised display text. A `radio` question whose option-set has `{ "value": 1, "text": "Strongly agree" }` and a Portuguese translation `"Concordo plenamente"` evaluates `q_x == 1` the same in both locales. This is part of the OD-11 normative test suite.

### Available-translations API

The Library exposes, per questionnaire, the list of locales with validated translations. The Viewer Service uses this to constrain the deployment's `available_locales` at creation time.

---

## Identifier conventions

Recapitulated from [02_terminology.md](02_terminology.md):

| Entity | Format | Example |
|---|---|---|
| Questionnaire | `qst_{slug}` | `qst_phq9` |
| Question | `q_{slug}` | `q_depression_1` |
| Option-set | `os_{slug}` | `os_likert5_agree` |
| Instruction | `ins_{slug}` | `ins_consent_v1` |
| Prompt | `pr_{slug}` | `pr_subscale_intro` |
| Scale | `scl_{slug}` | `scl_anxiety` |
| Block | `blk_{slug}` | `blk_part_a` |
| Page | `page_{slug}` | `page_demographics` |
| Section | `sec_{slug}` | `sec_likert_matrix` |
| Deployment | `dep_{uuid8}` | `dep_a1b2c3d4` |
| Session | UUID v4 | `550e8400-e29b-…` |
| Version | Calendar version `vYY.MMDD` | `v26.0523` |

All public-facing identifiers used in xAPI Object IRIs follow the pattern:
`https://behaverse.org/{entity-type}/{id}` — for example
`https://behaverse.org/questionnaires/qst_phq9/questions/q_depression_1`.

---

## File naming

| File type | Pattern | Example |
|---|---|---|
| Questionnaire definition | `{qst-id}_{version}.json` | `qst_phq9_v26.0523.json` |
| Response export | `{dep-id}_responses_{date}.csv` | `dep_a1b2_responses_2026-05-15.csv` |
| Event log (xAPI semantic events) | `{dep-id}_events_{date}.jsonl` | `dep_a1b2_events_2026-05-15.jsonl` |
| Behavioural-channel attachment | `{dep-id}_{session-id}_{channel}.{ext}` | `dep_a1b2_550e8400_mouse.jsonl.gz` |
| Codebook | `{qst-id}_{version}_codebook.csv` | `qst_phq9_v26.0523_codebook.csv` |

---

## What this document deliberately does not pin down

Specific JSON Schema files. The schema documents at `behaverse.org/schemas/` are an implementation deliverable, generated from this data model and the open decisions in [10_open_decisions.md](10_open_decisions.md). The discipline this document enforces is the model — entities, fields, relationships, requirements — not the precise JSON syntax.
