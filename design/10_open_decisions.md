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

## OD-18 — Schema 3 (Questionnaire Runtime) shape and production model

**Opened.** 2026-06-03 (downstream of OD-17; the data-schema family is now sufficiently locked to design the runtime view).

**Context.** Per OD-01 (resolved 2026-05-23), **Schema 3 is a flattened, denormalised view of Schema 2** produced when a session is minted. Library refs resolved to inline objects, translations applied for the active locale, scoring formulas (now: Scorer refs, per OD-16) pass through to the viewer's WASM evaluator (OD-11). OD-01 said "must encode every Schema 2 feature the viewer's conformance manifest claims to support; nothing else." The conformance manifest concept exists conceptually but isn't yet designed; Schema 3's shape, where it's produced, and how it integrates with deployment-time choices need settling.

The post-v26.0602/OD-17 reality changes some details from OD-01's framing:
- "Scoring formulas" no longer exist; scoring is by external Scorer reference (per OD-16).
- Stripping "scoring formulas if show_score is false" now means selectively dropping Scorer references that are *only* used for display (vs. those also driving LogicRule branching).
- Schema 5/6 are already authored; Schema 3 plays into a now-clearer data pipeline.

**Sub-questions to resolve.**

- **18a — Where does Schema 3 get produced?**
  - (i) **Viewer Service (server-side); cached per (qst@version, locale, viewer_conformance_hash, deployment_config_hash).** *(Recommended.)* One source of truth; consistent across viewers; supports deployment-time feature gating.
  - (ii) Client-side by the viewer at session-start; viewer fetches Schema 2 + library entities, denormalises locally.
  - (iii) Hybrid — Service-produced with viewer fallback.

- **18b — Locale handling: single-locale or multi-locale runtime?**
  - (i) **Single-locale: Schema 3 includes only the active locale's text; mid-session language switching triggers a re-mint.** *(Recommended.)* Smaller payload; simpler viewer; aligns with OD-14 last-active-locale persistence on resume.
  - (ii) Multi-locale: all available locales travel; viewer switches client-side without re-mint. Bigger payload; faster switch.
  - (iii) Single primary + on-demand fetch for others.

- **18c — Conformance manifest shape.**
  - (i) **Per-viewer JSON document declaring supported features**: schema_version, evaluator language version, widget kinds (radio/checkbox/slider/...), behavioural channel kinds (mouse/keyboard/...), scorer impl kinds (wasm/http/python/r), max session duration, etc. Published at a stable URL per viewer release. Viewer Service hashes it as part of cache key. *(Recommended.)*
  - (ii) Implicit/no manifest; Viewer Service emits everything; viewer silently ignores what it can't render.
  - (iii) Per-deployment minimal-feature-set declared at deployment creation; Service trims accordingly.

- **18d — Scorer implementation selection in Schema 3.**
  - (i) **Schema 3 pins ONE implementation per Scorer ref** (selected by Viewer Service from the deployment config + viewer conformance manifest). E.g., for `scr_phq9@v26.0602`, the runtime carries `{ kind: "wasm", url: "...", sha256: "..." }` chosen from the Scorer's `implementations[]`. *(Recommended.)*
  - (ii) Schema 3 lists all available implementations; the viewer picks at runtime.
  - (iii) Schema 3 keeps the Scorer ref unchanged; implementation selection is a separate runtime concern.

- **18e — Scoring stripping under `show_score: false`.**
  - (i) **Selective stripping via graph walk**: keep every Scorer reference that's transitively reachable from a LogicRule.condition (branching is always-on); strip references that are reachable only from `scores[]` declarations used by display. *(Recommended.)* When `show_score: true`, no stripping.
  - (ii) Keep all Scorer refs regardless of `show_score`.
  - (iii) Strip all Scorer refs when `show_score: false`; the post-session analysis pipeline computes scores. Loses branching capability under show_score: false.

- **18f — Cache key and invalidation.**
  - (i) **Key: `(qst_id, qst_version, locale, viewer_conformance_hash, deployment_config_hash, show_score)`**; invalidate on deployment-config change, on library-entity republish for any pinned ref, on viewer-conformance change. *(Recommended.)*
  - (ii) Key by `(qst_id, qst_version, locale)` only; ignore deployment/viewer changes (simpler but produces wrong runtime when feature support shifts).

**Knock-ons.**

- The "conformance manifest" needs its own small schema (call it Schema 3 sidecar or Schema 7) — a JSON document each viewer publishes describing what it supports. Likely lives at a stable URL per viewer release; published as part of the viewer's release artefact.
- OD-13's outbox model is unaffected — Schema 3 is upstream of response data; submission carries Schema 5 / Schema 6.
- Schema 3 ships a `provenance` block: `{ source_questionnaire_id, source_version, generated_at, locale, viewer_conformance_hash, scorer_impl_choices }` so the analyst can re-derive the exact runtime used.
- The viewer's WASM evaluator (OD-11) gains a `score(id)` host function (per OD-16 §3 architecture); Schema 3 must include enough info for the evaluator to look up the score: each score id maps to `{ scorer_impl, path }`.

**Resolution criterion.** Six sub-questions answered; Schema 3 spec + plan follow, alongside the conformance-manifest sidecar.

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
| OD-17 | 2026-06-03 | **Schema 5 (Response Data) shape — strict BDM adherence with three documented deviations.** Schema 5 *is* the [BDM Response trial table](https://github.com/behaverse/data-model). One row per response. 17a-d collapsed to a single "strict adherence" resolution. Six mapping decisions resolved: (17e) BDM `block_*` columns ← our **Page** concept, our cross-page **Block** folds into BDM `timeline_id`; (17f) `stimulus_id` is a **synthetic string** concatenating the Question-side entity ids (Context + Instruction + Prompt) in canonical order, `stimulus_description` is the concatenated text; for Messages, `stimulus_id` is the Message id; (17g) per-questionnaire scorer outputs live in **Schema 6's `scorer_outputs`** field (not in Response rows); (17h) BDM's `session_id` (integer ordering) renamed to `session_index` in our usage, and our `session_id` keeps UUID v4 semantics for globally-unique identity. Three BDM deviations logged in [05c_bdm_alignment.md](05c_bdm_alignment.md) with proposed upstream changes. | [05c_bdm_alignment.md](05c_bdm_alignment.md) (deviations log); [05_data_model.md](05_data_model.md) §"Schema 5", §"Schema 6"; future schemas at `schemas/response/`, `schemas/session/` |
| OD-16 | 2026-06-02 | **Scoring runtime semantics — external Scorer entity (path B).** Scoring logic does *not* live in the Questionnaire JSON; a new Library entity `Scorer` (`scr_*`) owns the procedure. Questionnaire declares scores by id via `scores[]: { id, scorer, path }` referencing JSON Pointer paths into the Scorer's structured output. Scorer is a contract (input schema, output schema, test cases) with multiple conformant implementations (WASM / HTTP / language packages); deployment picks one. Subscale entity survives as a pure grouping/labeling entity (id, name, description); membership lives on the Prompt (`Prompt.subscales: string[]`); the Questionnaire's old `subscales[]` block dissolves. Reversed-value pipeline: viewer's WASM evaluator auto-applies `value' = max + min − value` before Scorer reads; response payload carries both `value` and `scored_value`. Per-item `correct: bool` persisted for Solution-bearing Items only; comparator derived from Option's triple. Two-trigger evaluation (branching always-on at page-submit; display `show_score`-gated, terminal-by-default with `lock_show_score_timing` canonical override). Cache key `(scorer_ref, hash(inputs))`. InterpretationBand and ScoringDef entities dissolve. 6 sub-decisions resolved 2026-06-02. | [05b_scoring.md](05b_scoring.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md), [06_library.md](06_library.md), [04_architecture.md](04_architecture.md), [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md), [11_content_licensing.md](11_content_licensing.md), [13_importers.md](13_importers.md) |
| OD-15 | 2026-05-31 | **Pure pivot of the Schema 2 entity model to align with the legacy survey_database catalogue.** Eleven reusable entity types in two categories: **content-bearing** (Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx) and **ref-binding** (Question, Item, Solution). **Item** = Question + Option (saved `it_*` or inline on Page elements). **Question** = Prompt + optional Context + optional Instruction (saved `q_*` or inline inside Item). All content-bearing entities use a `content` language-keyed map (`{ status, fields }`) instead of v26.0528's `text` + `translations` split. UI input widget derived from Option's `(input_data_type, measurement_type, selection)` — no polymorphic Question $defs. Construct on Prompt (psychometric concept measured); Dimension on Prompt + Option (kind of judgment / scale, typically matching). Section's `shared_option` for matrix layouts. v26.0528 archived under `versions/v26.0528/`; new schema lands at fresh CalVer with `breaking` severity. Subscales auto-derivation deferred to a future Scoring OD. 23 sub-questions resolved across grilling sessions on 2026-05-29/30/31. | [05a_reusable_entities.md](05a_reusable_entities.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md) §"Content hierarchy", [06_library.md](06_library.md) §"Library content", [13_importers.md](13_importers.md) |
