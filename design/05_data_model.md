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
| 1 | Instrument Metadata | Bibliographic + psychometric properties, licensing, provenance | `behaverse.org/schemas/instrument/vYY.MMDD/schema.json` |
| 2 | Questionnaire Definition | Structural specification (pages, blocks, sections, questions, subscales, tags, style, flow, logic, scoring, translations) | `behaverse.org/schemas/questionnaire/vYY.MMDD/schema.json` |
| 3 | Questionnaire Runtime | Optimised for viewer rendering — a denormalised view of Schema 2 (references resolved, translations applied for the requested language, scoring optionally stripped) | `behaverse.org/schemas/questionnaire/runtime/vYY.MMDD.json` |
| 4a | Event Data (xAPI) | Semantic events: viewed, answered, navigated, submitted, recorded, … | `behaverse.org/schemas/questionnaire/events/xapi/vYY.MMDD.json` |
| 4b | Behavioural Channels | Per-session attachments for continuous data (mouse, keyboard, future webcam/microphone) | `behaverse.org/schemas/questionnaire/channels/vYY.MMDD.json` |
| 5 | Response Data | Participant answers per item / per session | `behaverse.org/schemas/questionnaire/response/vYY.MMDD.json` |
| 6 | Session Metadata | Session-level tracking | `behaverse.org/schemas/questionnaire/session/vYY.MMDD.json` |
| 7 | Viewer Conformance Manifest | Per-viewer declaration of supported features (schema versions, evaluator, widgets, channels, Scorer impl kinds, logic actions, locale switching, resume). Per OD-18c; consumed by the Viewer Service when generating Schema 3. | `behaverse.org/schemas/viewer_conformance/vYY.MMDD/schema.json` |

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

Schema enforces a minimum-valid floor (id, title, description, language). The Library publish workflow layers additional requirements (version, author ≥1, license) at promote-to-published time.

**Required fields.**

| Field | Type | Notes |
|---|---|---|
| `id` | string | `qst_{slug}` |
| `title` | string | Full official title |
| `description` | string | One- to two-sentence description |
| `language` | string | Canonical language (BCP-47; ISO 639-1 base with optional script/region subtags) |

**Recommended fields.**

| Field | Notes |
|---|---|
| `short_title` | Common abbreviation (e.g. "PHQ-9") |
| `version` | Calendar version `vYY.MMDD` (per [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)); schema floor optional, required at Library publish |
| `author` | Each with `name`; optional `orcid`, `affiliation` |
| `publication` | At minimum `year` and `citation`; optional `doi`, `isbn`, `publisher`, `url`; optional in schema — if present, inner `year` and `citation` required |
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

**Current version: v26.0602** (per OD-15 resolved 2026-05-31 and OD-16 resolved 2026-06-02). The authoritative entity model lives in [05a_reusable_entities.md](05a_reusable_entities.md); the authoritative scoring model lives in [05b_scoring.md](05b_scoring.md). This section summarises the structure; see 05a for entity-by-entity field tables and the OD-15 resolution log, and 05b for scoring runtime semantics — the `Scorer` Library entity (`scr_*`), `scores[]` declarations with JSON Pointer paths, reversed-value pipeline, two-trigger evaluation. v26.0602 landed the OD-16 changes: added `Scorer` + `scores[]` + `Prompt.subscales[]` + `lock_show_score_timing`; narrowed `Subscale` to a label entity; removed `ScoringDef`, `InterpretationBand`, and the Questionnaire's top-level `subscales[]` / `scoring[]` blocks. Severity: `breaking`.

**Eleven reusable entities in two categories:**

- **Content-bearing entities** (carry human-authored text or numeric content in a `content` language-keyed map): Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx.
- **Ref-binding entities** (carry only references to other entities, no content of their own): Question, Item, Solution. (Solution is the documented hybrid — carries an `expected_response` value.)

**Item** is the participant-administered unit: Question + Option. Items can be saved as Library entities (`it_*`) or authored inline on Page elements. Page `elements[]` is a heterogeneous array of: Section / Message ref / saved Item ref + overrides / inline Item.

**Question** is the "asking" composition: Prompt + optional Context + optional Instruction. Saved (`q_*`) or inline inside Item. Refs-only.

**UI input widget** the viewer renders is derived from the Option's `(input_data_type, measurement_type, selection)` triple — *not* declared on the question.

**Construct** (psychometric concept measured) lives on Prompt. **Dimension** (kind of judgment / scale) lives on both Prompt and Option, typically matching; the Library warns on mismatch.

**Section's `shared_option`** for matrix layouts; inner Items omit their `option` and inherit.

**`metadata` field** still embeds Schema 1 (Instrument) via cross-schema `$ref`. Schema 1 is unchanged at v26.0528.

**Versioning:** the bump from v26.0528 to v26.0601 is `breaking` per CalVer severity policy. The v26.0528 schema is archived under `schemas/questionnaire/versions/v26.0528/`; published v26.0528 instances remain valid until re-authored.

---

## Schema 3 — Questionnaire Runtime

**Purpose.** Optimised for viewer rendering. The authoritative model lives in [05d_runtime.md](05d_runtime.md) (per OD-18 resolved 2026-06-03). This section is a summary; 05d carries the full sub-decision log, the runtime pipeline diagram, Schema 3 and Schema 7 skeletons, and the knock-on details.

**Production.** Schema 3 is produced **server-side by the Viewer Service** at session-mint, via a shared Python denormaliser library (`questionnaire-runtime-denormaliser`) also consumed by the Editor for preview. One canonical document per (qst@version, locale, viewer_conformance_hash, deployment_runtime_policy_hash); cached in a Postgres-backed table with LRU eviction and an admin purge API. Lazy generation on first session.

**Shape.** Flattened, denormalised view of Schema 2 with all Library refs inlined, single-locale text only, Scorer implementations pinned. Carries a `provenance` block (denormaliser version, all cache-key inputs, stripped Scorer refs) for analyst reproducibility.

**Locale.** Single-locale by default; mid-session locale switch triggers re-mint. Deployment-config flag `pre_fetch_all_locales: true` flips to multi-locale for offline kiosks.

**Viewer trim.** Each viewer publishes a **Conformance Manifest** (the new formal **Schema 7**) declaring its supported widgets, behavioural channels, Scorer impl kinds, LogicRule actions, evaluator language version, etc. The Viewer Service stores manifests in a viewer-registry table and trims Schema 3 to only the features the receiving viewer can render.

**Scorer impl selection.** Deployment declares an ordered `scorer_impl_preference: ["wasm", "http", "python", "r"]`. Schema 3 generation picks the first kind in the intersection of (deployment preference, Scorer.implementations[], viewer.scorer_impl_kinds) and pins it into Schema 3 — e.g., `impl: { kind: "wasm", url: "...", sha256: "..." }`. Pre-flight error if no intersection exists.

**Scoring stripping under `show_score: false`.** Selective graph walk: keep every Scorer reference that's transitively reachable from any `LogicRule.condition` or `LogicRule.action` (always-on branching); strip display-only Scorer refs. Stripped refs recorded in `Schema 3.provenance.stripped_scorer_refs`. Hard-mode deployment flag `disable_in_session_scoring: true` strips every Scorer ref AND every dependent LogicRule.

**Schema-version compatibility.** Schema 3 is independent of Schema 2's CalVer — the viewer's conformance manifest declares which Schema 2 versions it accepts; the Viewer Service refuses to generate Schema 3 for unsupported pairings.

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

**Purpose.** Participant answers to questions, in a standardised analysis-ready tabular format.

**Basis.** [Behaverse Data Model (BDM) — Response trial table](https://github.com/behaverse/data-model/blob/main/spec/trials/1-response.qmd). Per OD-17 (resolved 2026-06-03), Schema 5 is **strict adherence to BDM** with three local deviations documented in [05c_bdm_alignment.md](05c_bdm_alignment.md). The nested-JSON sketch in earlier revisions of this section is **non-canonical** and superseded by what follows.

**Shape.** One row per response. Tabular (CSV-friendly). BDM defines 75 columns across categories: Key / Context / Task / Stimulus / Option / Input / Expectation / Response / Evaluation / Feedback / Outcome / Accessory. Schema 5 ships those columns natively.

**Mapping table — project concepts → BDM columns.**

| BDM column | Our v26.0602 concept | Notes |
|---|---|---|
| `response_id` | Per-row primary key | Generated at row creation |
| `agent_id` | participant identifier | (from Schema 6 / Identity sibling project) |
| `session_index` | Our integer per-agent session ordering | **Renamed from BDM's `session_id`** — see deviation D3 in 05c_bdm_alignment.md |
| `session_id` (our extension) | Our UUID v4 session handle | Sidecar — not standard BDM yet; see D3 |
| `instrument_id` | Our Questionnaire `metadata.id` (`qst_…`) | |
| `block_index`, `block_name`, `block_type` | Our **Page** (per OD-12 — *not* our Block) | See OD-17e for the inversion explanation |
| `timeline_id`, `timeline_repetition` | Our **Block** (cross-page wrapper) | Per OD-17e |
| `trial_index` | Item order within the Page | |
| `stimulus_id` | Synthetic id concatenating Question-side entity ids: `(ctx_X+)?(ins_Y+)?pr_Z` in canonical order; for Messages: the `msg_…` id directly | Per OD-17f; **string type** — see deviation D1 in 05c_bdm_alignment.md |
| `stimulus_description` | Concatenated text content of Context + Instruction + Prompt in active locale (or Message text for Message rows) | |
| `stimulus_type` | enum — e.g., `text` for Prompts, `instruction` for Messages | |
| `option_id` | Our Option id (`opt_…`) | |
| `option_data_type`, `measurement_type` | From our Option's `input_data_type` / `measurement_type` | |
| `option_count` | Number of choices in the Option (for choice-typed Options) | |
| `expected_response_option_index`, `expected_response_description` | From our Solution's `expected_response` for Solution-bearing Items | |
| `response_option_index`, `response_description`, `response_numeric` | Participant's actual answer (multiple representations) | |
| `response_time`, `response_datetime`, `response_initiation_time`, `response_validation_time` | Timing | |
| `response_skipped`, `timed_out` | Booleans | |
| `correct` | Per-item correct boolean for Solution-bearing Items (per OD-16 16c); **omitted** when no Solution | |
| `score` | Per-item `scored_value` (post-reversal per OD-16 16a) | |
| `accuracy`, `evaluation_label` | Optional, derived | |
| `language` | Active locale at moment of response (BCP-47 base) | Per "Locale resolution" below |
| `additional_measures` | Project extras (Item id reference for joins, etc.) as JSON-stringified | BDM-defined escape hatch |

**Emission model.** Per-row at response time (BDM is tabular by construction). A session's complete response set is its accumulated rows in the CSV. The OD-13 forwarding pipeline carries rows; submission marks the session's row set as complete. No separate "session batch" structure is needed — `session_index` / `session_id` group rows by session naturally.

**Per-questionnaire scorer outputs do NOT live here.** Per OD-17g, aggregate scoring outputs (e.g., `phq9_total`, `phq9_severity`) live in **Schema 6's `scorer_outputs`** field — session-level facts, not per-row. Putting them on every Response row would repeat ×N redundantly and conflict with BDM's row-level semantics. See 05c_bdm_alignment.md D2 — BDM has no session-level scoring table; proposing one upstream.

**Export formats** for researcher analysis: CSV (BDM-native), Parquet, SPSS `.sav` (with variable/value labels), R `.rds`, JSON. Codebook generation accompanies tabular exports.

---

## Schema 6 — Session Metadata

**Purpose.** Identifies a single attempt at a questionnaire and ties responses, events, and (where applicable) Participant Platform assignments together. Also carries session-level facts that don't fit BDM's per-row Response shape (notably per-questionnaire scorer outputs per OD-16 / OD-17g).

**Required fields:** `session_id` (UUID v4 — our globally-unique handle), `session_index` (integer, BDM-aligned per-agent ordering count, 1-based), `agent_id` (participant identifier), `instrument_id` (our `qst_…`), `instrument_version` (CalVer, pinned at session-mint per OD-14 sub-question 3), `status`, `started_at`.

**Recommended fields:** `deployment_id`, `completed_at`, `submitted_at` (Viewer Service receipt), `forwarded_at` (Behaverse delivery receipt — see OD-13), `forward_attempts` (integer, default 0), `forward_failure_reason` (last error message if any), `initial_locale` (`{ language, region }`), `last_active_locale` (`{ language, region }` — persisted per OD-14 sub-question 6; equal to `initial_locale` until the participant switches mid-session), `device` (user-agent, platform, device type, viewport, timezone), `scorer_outputs` (per OD-17g — object keyed by CalVer-pinned Scorer ref, each value the full structured output the Scorer produced; only present for Scorers actually invoked in this session).

**`scorer_outputs` shape.**

```jsonc
"scorer_outputs": {
  "scr_phq9@v26.0602": {
    "total":         12,
    "severity":      "moderate",
    "band":          { "min": 10, "max": 14, "label": "Moderate Depression" },
    "missing_count": 0
  }
}
```

One entry per Scorer invoked in the session. Keyed by CalVer-pinned Scorer reference. Value conforms to the Scorer entity's `output_schema`. See [05b_scoring.md](05b_scoring.md) §4.5 for the Scorer contract. The deviation log in [05c_bdm_alignment.md](05c_bdm_alignment.md) D2 tracks the proposal to add a BDM session-level scoring table that would host this natively.

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

Translations may be keyed at any BCP-47 granularity (e.g. pt, pt-BR, pt-PT). Runtime resolution falls back from most-specific to base to canonical language: pt-BR → pt → instrument canonical. Authors choose the granularity per translation; bare base-language tags (e.g. pt) serve all regional participants who haven't specified a region preference.

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
