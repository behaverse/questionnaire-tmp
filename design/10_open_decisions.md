# 10 — Open Decisions

This document records design decisions that have been **intentionally deferred**. Each entry describes the decision, the options considered, the trade-offs, and the criteria for resolving it later.

Open decisions are referenced from the other design docs — they are not re-decided in passing. When a decision is resolved, its body moves out of this document into the relevant design doc; only a summary remains here in the **Resolution log** at the bottom.

## OD-02 — *Merged into OD-01.*

OD-02 originally asked "Does the Web Viewer render canonical JSON directly, or transform to SurveyJS first?" That question was the runtime half of the coupled stack choice in OD-01 and was resolved together with the canonical-format question (see Resolution log below; OD-01 resolved 2026-05-23 → S1). References to "OD-02" in older material should be read as "OD-01 (stack choice, runtime half)."

---

## OD-15 — *Resolved 2026-05-31. See Resolution log row below.*

---

## OD-16 — *Resolved 2026-06-02. See Resolution log row below.*

Body in [05b_scoring.md](05b_scoring.md). Pivoted away from in-JSON formula language; scoring logic lives in a new `Scorer` Library entity (`scr_*`) referenced by the Questionnaire's `scores[]`. Six sub-decisions resolved (16f subsumed by 16e).

---

## OD-17 — *Resolved 2026-06-03. See Resolution log row below.*

Body across two docs: deviations-from-BDM tracker in [05c_bdm_alignment.md](05c_bdm_alignment.md); Schema 5 / Schema 6 mapping decisions in [05_data_model.md](05_data_model.md) §"Schema 5". Six sub-decisions resolved (17a-d collapsed; 17e-h grilled individually 2026-06-02 / 2026-06-03).

---

## OD-18 — *Resolved 2026-06-03. See Resolution log row below.*

Body in [05d_runtime.md](05d_runtime.md). Six sub-decisions resolved (18a Production location, 18b Locale handling, 18c Conformance manifest = formal Schema 7, 18d Scorer impl selection, 18e Scoring stripping, 18f Cache key + invalidation).

---

## OD-19 — *Resolved 2026-06-05. See Resolution log row below.*

Body in [05e_events_vocabulary.md](05e_events_vocabulary.md). The initial framing (strict xAPI 2.0 profile vs. Behaverse-specific) was reframed early in the grilling: BDM already has its own Events spec extending xAPI; OD-19 settled the *BDM-events vocabulary* rather than picking between xAPI and project-specific. Resolution: own `bdm:` namespace covering 24 verbs / 15 object types / 5 actor types / ~50 extension keys, designed to cover questionnaires, cognitive tasks, and (looking ahead) video games under one consistent vocabulary. Three BDM upstream-change deviations logged in [05c_bdm_alignment.md](05c_bdm_alignment.md): D4 (bdm: namespace + vocabulary), D5 (`agent` → `actor` field rename), D6 (session/activity/runtime hierarchy + context keys).

---

## OD-20 — Schema 4b (Behavioural Channels) shape

**Opened.** 2026-06-05 (Schema 4a v26.0605 just shipped; Schema 4b is the natural sibling — the schema for the *captured-data files* that `bdm:recording_started`/`bdm:recording_ended` events reference via `bdm:recording_url`).

**Context.** [Section §Schema 4b in 05_data_model.md](05_data_model.md) sketches the channels (mouse, keyboard, webcam, microphone) with file formats (JSON Lines for mouse/keyboard; WebM for webcam; WAV/Opus for microphone). OD-07 (resolved) settled the privacy/default-state matrix: response time on by default; mouse/keyboard opt-in per deployment; webcam/microphone opt-in plus per-session participant consent. OD-19 added EEG as a recording source and renamed `channel` → `source` in the manifest extensions.

What's not yet decided is the **per-source content schema** — what the captured file *contains*.

**Sub-questions.**

- **20a — Schema architecture: one polymorphic schema vs family per source.**
  - (i) **Family per source** (`schemas/recordings/mouse/`, `schemas/recordings/keyboard/`, `schemas/recordings/eeg/`, etc.). Each source has its own JSON Schema validating its content shape. Mirrors how Schema 5 vs Schema 6 are separate schemas for distinct data shapes. *(Recommended.)*
  - (ii) One Schema 4b with `oneOf` across source types. Single schema, polymorphic. Simpler folder layout; harder to evolve sources independently.
  - (iii) Skip per-source content schemas; validate only the *manifest* (the `bdm:recording_url` + `bdm:recording_sha256` + `bdm:duration` + `bdm:sample_rate` + `bdm:source` extensions on Schema 4a events). Defer per-source content validation to downstream tooling. Smallest scope.

- **20b — Sources to ship in this initial release.**
  - (i) **Mouse + Keyboard only.** JSON Lines format, structured sample schemas. The two most-implemented channels. *(Recommended for MVP.)*
  - (ii) Mouse + Keyboard + EEG. Adds EEG (Parquet or EDF format); requires domain modelling.
  - (iii) All five (mouse, keyboard, EEG, webcam, microphone). Webcam/microphone are binary media files — schemas validate only the side-car manifest, not the bytes.

- **20c — Mouse sample schema.** Each row of the mouse JSONL file.
  - (i) **`{t, x, y, button_state}`** — minimal sample shape. `t` in seconds (float, full precision) from recording start; `x`/`y` in viewport pixels; `button_state` enum (`up`, `left_down`, `right_down`, `middle_down`). *(Recommended.)*
  - (ii) Add wheel events: `{t, x, y, button_state, wheel_dx?, wheel_dy?}`.
  - (iii) Richer: also pressure (stylus), screen DPI, multi-touch fingers.

- **20d — Keyboard sample schema.** Each row of the keyboard JSONL file.
  - (i) **`{t, key, key_code, action, modifiers}`** where `action` ∈ `down`/`up`; `modifiers` is array of `shift`/`ctrl`/`alt`/`meta` if held. *(Recommended.)*
  - (ii) Same as (i) plus the full text content of the focused input at this moment (for typed-input paradigms).
  - (iii) Simpler: just `{t, key, action}`.

- **20e — Per-source manifest sidecar vs embedded.**
  - (i) **Manifest in the Schema 4a `bdm:recording_ended` event extensions only** (`bdm:source`, `bdm:sample_rate`, `bdm:duration`, `bdm:recording_url`, `bdm:recording_sha256`). No separate manifest file. *(Recommended.)*
  - (ii) A sidecar JSON manifest file alongside the data file (e.g., `mouse_session-xyz.manifest.json` next to `mouse_session-xyz.jsonl`). Adds discoverability when the data file is moved without the event stream.

- **20f — File naming convention.** Per [05_data_model.md](05_data_model.md) §"File naming": `{dep-id}_{session-id}_{channel}.{ext}` (e.g., `dep_a1b2_550e8400_mouse.jsonl.gz`). Confirm `.jsonl` (uncompressed) vs `.jsonl.gz` (gzipped) default. Recommendation: `.jsonl.gz` default for mouse/keyboard (high-cardinality data; compression is meaningful).

**Resolution criterion.** Six sub-questions answered; Schema 4b spec + plan + implementation follow.

---

## Resolution log

A decision moves out of this document and into the relevant design doc once resolved. The original entry is summarised here; the full body lives in the linked doc.

| ID | Resolved on | Resolution summary | Moved to |
|---|---|---|---|
| OD-03 | 2026-05-15 | Option A — shared rendering library; Web Viewer's renderer published as a library consumed by Editor preview. | [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md) |
| OD-04 | 2026-05-15 | Python + FastAPI for all four backends; PostgreSQL default, SQLite permitted for single-machine self-hosted; Behaverse retains its own MongoDB-based stack. | [04_architecture.md](04_architecture.md) §"Deployment shape" |
| OD-08 | 2026-05-15 | Identity is a third sibling project under the same operating organisation. | [12_governance.md](12_governance.md) |
| OD-05 | 2026-05-21 | Option B — Reference with safe overrides. Position, `required`, and `show_if` overridable on a Library reference; any content change requires forking a derived entity. | [05_data_model.md](05_data_model.md) §"Question", [06_library.md](06_library.md), [07_editor.md](07_editor.md) |
| OD-06 | 2026-05-21 (updated 2026-05-23: Calendar Versioning adopted) | Option A — Hard-pin all references. Every reference pins to a specific version; deprecation never silently breaks deployed questionnaires; Editor surfaces new versions as explicit notifications. **Version format updated 2026-05-23** to Calendar Versioning `vYY.MMDD` per the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning); the SemVer Major/Minor/Patch classification is replaced by a separate `severity` metadata tag (`breaking` / `additive` / `corrective`). | [05_data_model.md](05_data_model.md) §"Versioning rules", [06_library.md](06_library.md) §"Versioning" |
| OD-07 | 2026-05-21 | Recommended default-state matrix adopted: response time on by default; mouse / keyboard opt-in per deployment; webcam / microphone opt-in per deployment AND explicit per-session participant consent. | [05_data_model.md](05_data_model.md) §"Schema 4b", [08_viewer.md](08_viewer.md) §"Behavioural channels", [08a_viewer_service.md](08a_viewer_service.md) |
| OD-09 | 2026-05-21 | Option C — Database-driven scheduler. PostgreSQL `scheduled_assignments` table polled by one-of-N workers using `SELECT ... FOR UPDATE SKIP LOCKED`; default cadence 60 s. | [09_platform.md](09_platform.md) §"Scheduling" |
| OD-10 | 2026-05-21 | Option A (modified) — single Library hosting all instrument lifecycle states (drafts, in-review, published, withdrawn). No federation; no separate lab-private instances. Visibility is per-entry, not per-instance. | [06_library.md](06_library.md) |
| OD-11 | 2026-05-21 | Option A — Single WASM module as canonical expression evaluator. Embedded by Web, Native, and Editor; same binary across all three. A normative test suite ships as a regression harness, not as the cross-viewer contract. | [05_data_model.md](05_data_model.md) §"Logic / Validation / Scoring", [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md) |
| OD-14 | 2026-05-21 | Six sub-questions resolved (all option A): (1) mid-page resume targets first unanswered question; (2) per-question persistence on change; (3) pin definition at session-mint time; (4) ephemeral deployments refuse resume; (5) `active_until` doesn't kill in-progress sessions; (6) last-active locale persists across resume. | [08_viewer.md](08_viewer.md) §"Session resume semantics", [05_data_model.md](05_data_model.md) §"Schema 6", [08a_viewer_service.md](08a_viewer_service.md) |
| OD-13 | 2026-05-23 | Asynchronous queued forwarding via Postgres outbox; extended lifecycle `submitted → forwarded → validated`; per-hop TLS 1.3+ + SHA-256 + signed bearer tokens; pluggable-sink interfaces (Behaverse-only ship in MVP); end-to-end encryption deferred to a future OD. Sub-q 1: dashboard collapses `submitted`/`forwarded` by default and expands on threshold-exceeded alert. Sub-q 2: two-tier outbox bound — soft alert at depth N pages operator, hard cap at much larger M refuses new writes; thresholds operator-configurable. | [04_architecture.md](04_architecture.md) §"Response and event flow", [08a_viewer_service.md](08a_viewer_service.md) §"Submission forwarding to Behaverse" |
| OD-01 | 2026-05-23 | **S1 (Pure custom).** Canonical questionnaire format is custom JSON validated against `behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` (calendar version per [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning)). Web Viewer is custom React + TypeScript (published as a library, consumed by Editor preview per OD-03). Native Viewer is custom Godot / GDScript. Editor authoring UI is custom React + TypeScript. No SurveyJS dependency in the stack. Rationale: single-file canonical preserves research-grade metadata first-class; one renderer mental model across viewers (OD-11 WASM evaluator already guarantees identical expression evaluation); transformer-route (S2) imposes ongoing maintenance burden over 5-year lifetime. The original ~6-week human-implementation cost is no longer the binding constraint — Claude Code as implementer collapses upfront effort substantially. | [05_data_model.md](05_data_model.md) §"Schema 3", [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md) |
| OD-12 | 2026-05-23 | **Five-concept reference model.** Block (cross-page wrapper, `blk_`), Page (screen unit, `page_`), Section (within-page layout grouping, `sec_`), Subscale (scoring, `scl_`), Tag (per-question analytic label, no prefix). Wiring by reference: top-level `pages[]` is the structural backbone; `blocks[]` references `page_ids[]`; `subscales[]` references `question_ids[]`; Sections live *inside* their owning Page (their only containment relation). Canonical field name is `flow.randomize_pages`. Block/Section naming inverts English convention to match cognitive-testing usage (a "block" is the larger unit, as in "a block of 50 trials"). | [02_terminology.md](02_terminology.md) §"Content hierarchy", [05_data_model.md](05_data_model.md) §"Schema 2", [08a_viewer_service.md](08a_viewer_service.md) §"Style and flow overrides" |
| OD-19 | 2026-06-05 | **BDM Events vocabulary for Schema 4a.** Resolved across four revision rounds. Own `bdm:` namespace (rejected mixed xAPI/Schema.org/AS2 namespaces). 24 verbs across 6 layers: RuntimeInstance lifecycle (`initialized`/`started`/`paused`/`resumed`/`completed`/`submitted`/`abandoned`), Presentation (`presented` polymorphic), Agent interactions (`clicked`/`drag_and_dropped`/`key_pressed`/`typed`/`selected`/`deselected`/`adjusted`/`got_focus`/`lost_focus`/`consented`), System events (`trial_started`/`trial_ended`/`state_changed`), Recording lifecycle (`recording_started`/`recording_ended`), Navigation (`navigated`). 15 object types (RuntimeInstance, Screen, Panel, Stimulus, Option, Trial, UIComponent, Window, Feedback, ConsentForm, Consent, Recording, Timer, Scorer, LocaleSwitch). 5 actor types (`Agent`, `Group`, `Engine`, `Orchestrator`, `Researcher`). ~50 extension keys. Three BDM upstream-change deviations: D4 (bdm: namespace + vocabulary), D5 (`agent` → `actor` field rename), D6 (session/activity/runtime hierarchy). Vocabulary covers questionnaires, cognitive tasks, and video games. | [05e_events_vocabulary.md](05e_events_vocabulary.md) (full body); knock-on to [05c_bdm_alignment.md](05c_bdm_alignment.md) (deviations); future Schema 4a JSON Schema at `schemas/events/` |
| OD-18 | 2026-06-03 | **Schema 3 (Questionnaire Runtime) shape and production model.** Schema 3 produced server-side by the Viewer Service at session-mint; cached per 5-tuple `(qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)` in a Postgres-backed table with LRU eviction and admin purge API. Denormaliser packaged as a shared Python library (`behaverse-runtime-denormaliser`) consumed by both Viewer Service and Editor preview. Single-locale runtime by default; kiosk opt-in `pre_fetch_all_locales: true` for offline locale switching. Each viewer publishes a Conformance Manifest (new formal **Schema 7** — sibling of the data schemas) at a stable URL; Service stores it in a viewer-registry table and hashes it for the cache key. Scorer impl selection by deployment-ordered preference list ∩ Scorer.implementations[] ∩ viewer.scorer_impl_kinds; pre-flight error if empty. Scoring stripping under `show_score: false`: selective graph walk over LogicRules keeps branching-required Scorers, strips display-only ones; `disable_in_session_scoring: true` deployment flag strips everything plus dependent LogicRules. Schema 3 ships a `provenance` block recording stripped refs, denormaliser version, and all cache-key inputs for analyst reproducibility. Six sub-decisions resolved 2026-06-03. | [05d_runtime.md](05d_runtime.md) (full body); knock-on to [04_architecture.md](04_architecture.md), [05_data_model.md](05_data_model.md) §"Schema 3", [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md), [08a_viewer_service.md](08a_viewer_service.md) |
| OD-17 | 2026-06-03 | **Schema 5 (Response Data) shape — strict BDM adherence with three documented deviations.** Schema 5 *is* the [BDM Response trial table](https://github.com/behaverse/data-model). One row per response. 17a-d collapsed to a single "strict adherence" resolution. Six mapping decisions resolved: (17e) BDM `block_*` columns ← our **Page** concept, our cross-page **Block** folds into BDM `timeline_id`; (17f) `stimulus_id` is a **synthetic string** concatenating the Question-side entity ids (Context + Instruction + Prompt) in canonical order, `stimulus_description` is the concatenated text; for Messages, `stimulus_id` is the Message id; (17g) per-questionnaire scorer outputs live in **Schema 6's `scorer_outputs`** field (not in Response rows); (17h) BDM's `session_id` (integer ordering) renamed to `session_index` in our usage, and our `session_id` keeps UUID v4 semantics for globally-unique identity. Three BDM deviations logged in [05c_bdm_alignment.md](05c_bdm_alignment.md) with proposed upstream changes. | [05c_bdm_alignment.md](05c_bdm_alignment.md) (deviations log); [05_data_model.md](05_data_model.md) §"Schema 5", §"Schema 6"; future schemas at `schemas/response/`, `schemas/session/` |
| OD-16 | 2026-06-02 | **Scoring runtime semantics — external Scorer entity (path B).** Scoring logic does *not* live in the Questionnaire JSON; a new Library entity `Scorer` (`scr_*`) owns the procedure. Questionnaire declares scores by id via `scores[]: { id, scorer, path }` referencing JSON Pointer paths into the Scorer's structured output. Scorer is a contract (input schema, output schema, test cases) with multiple conformant implementations (WASM / HTTP / language packages); deployment picks one. Subscale entity survives as a pure grouping/labeling entity (id, name, description); membership lives on the Prompt (`Prompt.subscales: string[]`); the Questionnaire's old `subscales[]` block dissolves. Reversed-value pipeline: viewer's WASM evaluator auto-applies `value' = max + min − value` before Scorer reads; response payload carries both `value` and `scored_value`. Per-item `correct: bool` persisted for Solution-bearing Items only; comparator derived from Option's triple. Two-trigger evaluation (branching always-on at page-submit; display `show_score`-gated, terminal-by-default with `lock_show_score_timing` canonical override). Cache key `(scorer_ref, hash(inputs))`. InterpretationBand and ScoringDef entities dissolve. 6 sub-decisions resolved 2026-06-02. | [05b_scoring.md](05b_scoring.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md), [06_library.md](06_library.md), [04_architecture.md](04_architecture.md), [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md), [11_content_licensing.md](11_content_licensing.md), [13_importers.md](13_importers.md) |
| OD-15 | 2026-05-31 | **Pure pivot of the Schema 2 entity model to align with the legacy survey_database catalogue.** Eleven reusable entity types in two categories: **content-bearing** (Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx) and **ref-binding** (Question, Item, Solution). **Item** = Question + Option (saved `it_*` or inline on Page elements). **Question** = Prompt + optional Context + optional Instruction (saved `q_*` or inline inside Item). All content-bearing entities use a `content` language-keyed map (`{ status, fields }`) instead of v26.0528's `text` + `translations` split. UI input widget derived from Option's `(input_data_type, measurement_type, selection)` — no polymorphic Question $defs. Construct on Prompt (psychometric concept measured); Dimension on Prompt + Option (kind of judgment / scale, typically matching). Section's `shared_option` for matrix layouts. v26.0528 archived under `versions/v26.0528/`; new schema lands at fresh CalVer with `breaking` severity. Subscales auto-derivation deferred to a future Scoring OD. 23 sub-questions resolved across grilling sessions on 2026-05-29/30/31. | [05a_reusable_entities.md](05a_reusable_entities.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md) §"Content hierarchy", [06_library.md](06_library.md) §"Library content", [13_importers.md](13_importers.md) |
