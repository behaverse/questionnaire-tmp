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

## OD-17 — Schema 5 (Response Data) shape

**Opened.** 2026-06-02 (downstream of OD-16 resolution; now unblocked).

**Context.** [Section §Schema 5 in 05_data_model.md](05_data_model.md) carries a sketch from the v26.0528 era. Several field names are stale (`question_id`, `question_type`, `response`) and the sketch predates OD-15 (Item entity) and OD-16 (scored_value, correct, external Scorer). The actual JSON Schema 5 file has never been authored. With v26.0602 shipped, Schema 5 is now writable but the shape needs design decisions first.

The adopted basis is the [Behaverse Response Trial Format](https://behaverse.org/data-model/spec/trials/response.html) (BTF) — declared in [05_data_model.md](05_data_model.md) §"Adopted external standards" as the response-data standard. OD-17 settles how strictly Schema 5 binds to BTF vs. how much it extends.

**Sub-questions.**

- **17a — Relationship with BTF.** Is Schema 5 a *strict profile* of BTF (every Schema-5-valid document is also BTF-valid; differences via additive extensions only), or a *parallel format* with an adapter at the boundary (Schema 5 uses our v26.0602 vocabulary natively; an adapter translates to/from BTF when emitting to Behaverse)?
  - (i) **Strict profile of BTF.** Same field names as BTF (`question_id`, `question_type`, `response`, `rt`, `trial_index`). Project-specific additions (e.g., `scored_value`, `correct`, Item ref instead of Question ref) live as BTF *extensions* under a namespace.
  - (ii) **Parallel format with adapter.** *(Recommended.)* Schema 5 uses v26.0602-native names: `item` (CalVer-pinned ref), `value`, `scored_value`, `correct`. The Viewer Service includes an adapter that emits BTF when forwarding to Behaverse per OD-13's pluggable-sink contract. Pro: Schema 5 and Schema 2 share vocabulary, making round-trip analysis natural. Con: more code at the boundary; analysts who already speak BTF need to learn one new field-naming convention.

- **17b — Per-response identifier convention.** Each response references the administered unit. Per OD-15 that unit is the **Item** (Question + Option). The sketch says `question_id`.
  - (i) **`item: "it_X@vYY.MMDD"`.** *(Recommended.)* CalVer-pinned Item reference. Consistent with v26.0602; the Item version pins Question+Option versions transitively. LogicRule conditions reference items too, so consistency.
  - (ii) **`question_id` + `option_id` separately.** Two fields. Pro: explicit. Con: redundant — the Item already binds them.
  - (iii) **`prompt_id`.** Most fine-grained but loses the Option context.

- **17c — Computed scores in payload.** Per OD-16, scores are computed by the external Scorer engine via on-demand invocation. When emitting a session batch, what does the payload carry?
  - (i) **Nothing — recompute downstream.** Smallest payload. Analysts run the Scorer themselves.
  - (ii) **Resolved `scores` map.** A flat object `{ "phq9_total": 12, "phq9_severity": "moderate" }` keyed by the `scores[]` ids declared in the Questionnaire. Pro: self-describing for offline analysis. Con: requires the viewer to have run the Scorer.
  - (iii) **Full scorer-output objects, keyed by `scorer_ref`.** *(Recommended.)* `"scorer_outputs": { "scr_phq9@v26.0602": { "total": 12, "severity": "moderate", "band": {...}, "missing_count": 0 } }`. Pro: best-of-both — analysts get the full structured output without re-running the Scorer; can derive any declared Score id by walking the JSON Pointer. Con: largest payload (~200B–2KB per Scorer per session).
  - The viewer only emits `scorer_outputs` for Scorers it actually invoked (i.e., when `show_score` was true or LogicRule branched on a score). For `show_score: false` deployments, the field may be absent and analysts compute scores downstream.

- **17d — Per-item vs batched-session emission.** The sketch describes two modes (per-item streaming + batched-at-submission). OD-13's queued-forwarding model assumes per-item statements arrive at the Viewer Service over the session lifetime, with a final submission marker.
  - (i) **Both modes coexist; per-item is the primary path.** *(Recommended.)* Schema 5 defines two top-level shapes — `Response` (per-item) and `SessionBatch` (the full session's responses + metadata) — with the latter being a wrapper around the former. The viewer always emits per-item; the SessionBatch is constructed at submission for offline export and reanalysis. Consistent with OD-13.
  - (ii) Per-item only. SessionBatch derived offline at analysis time.
  - (iii) Batched only. Throws out the streaming-resilience benefit OD-13 was built around.

**Knock-ons.**

- Schema 6 (Session Metadata) overlap: the SessionBatch carries session-level fields (`started_at`, `completed_at`, `submitted_at`, locale state). Some of these belong to Schema 6 conceptually. Decision: SessionBatch *embeds* a Schema 6 instance at `session`, rather than duplicating fields. Schema 6 authoring becomes a near-term sibling task.
- Schema 4a (xAPI events) overlap: an `answered` xAPI statement carries similar per-item data. Decision: per-item Schema 5 emissions and xAPI `answered` statements are *two views of the same event* — the xAPI envelope wraps the Schema 5 response object as its `result.response` (or similar). Avoids duplication.

**Resolution criterion.** Four sub-questions answered; the recommended-defaults locked unless flagged for grilling. Schema 5 spec + implementation follow.

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
| OD-16 | 2026-06-02 | **Scoring runtime semantics — external Scorer entity (path B).** Scoring logic does *not* live in the Questionnaire JSON; a new Library entity `Scorer` (`scr_*`) owns the procedure. Questionnaire declares scores by id via `scores[]: { id, scorer, path }` referencing JSON Pointer paths into the Scorer's structured output. Scorer is a contract (input schema, output schema, test cases) with multiple conformant implementations (WASM / HTTP / language packages); deployment picks one. Subscale entity survives as a pure grouping/labeling entity (id, name, description); membership lives on the Prompt (`Prompt.subscales: string[]`); the Questionnaire's old `subscales[]` block dissolves. Reversed-value pipeline: viewer's WASM evaluator auto-applies `value' = max + min − value` before Scorer reads; response payload carries both `value` and `scored_value`. Per-item `correct: bool` persisted for Solution-bearing Items only; comparator derived from Option's triple. Two-trigger evaluation (branching always-on at page-submit; display `show_score`-gated, terminal-by-default with `lock_show_score_timing` canonical override). Cache key `(scorer_ref, hash(inputs))`. InterpretationBand and ScoringDef entities dissolve. 6 sub-decisions resolved 2026-06-02. | [05b_scoring.md](05b_scoring.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md), [06_library.md](06_library.md), [04_architecture.md](04_architecture.md), [07_editor.md](07_editor.md), [08_viewer.md](08_viewer.md), [11_content_licensing.md](11_content_licensing.md), [13_importers.md](13_importers.md) |
| OD-15 | 2026-05-31 | **Pure pivot of the Schema 2 entity model to align with the legacy survey_database catalogue.** Eleven reusable entity types in two categories: **content-bearing** (Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx) and **ref-binding** (Question, Item, Solution). **Item** = Question + Option (saved `it_*` or inline on Page elements). **Question** = Prompt + optional Context + optional Instruction (saved `q_*` or inline inside Item). All content-bearing entities use a `content` language-keyed map (`{ status, fields }`) instead of v26.0528's `text` + `translations` split. UI input widget derived from Option's `(input_data_type, measurement_type, selection)` — no polymorphic Question $defs. Construct on Prompt (psychometric concept measured); Dimension on Prompt + Option (kind of judgment / scale, typically matching). Section's `shared_option` for matrix layouts. v26.0528 archived under `versions/v26.0528/`; new schema lands at fresh CalVer with `breaking` severity. Subscales auto-derivation deferred to a future Scoring OD. 23 sub-questions resolved across grilling sessions on 2026-05-29/30/31. | [05a_reusable_entities.md](05a_reusable_entities.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md) §"Content hierarchy", [06_library.md](06_library.md) §"Library content", [13_importers.md](13_importers.md) |
