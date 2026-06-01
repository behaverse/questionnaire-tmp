# 10 — Open Decisions

This document records design decisions that have been **intentionally deferred**. Each entry describes the decision, the options considered, the trade-offs, and the criteria for resolving it later.

Open decisions are referenced from the other design docs — they are not re-decided in passing. When a decision is resolved, its body moves out of this document into the relevant design doc; only a summary remains here in the **Resolution log** at the bottom.

## OD-02 — *Merged into OD-01.*

OD-02 originally asked "Does the Web Viewer render canonical JSON directly, or transform to SurveyJS first?" That question was the runtime half of the coupled stack choice in OD-01 and was resolved together with the canonical-format question (see Resolution log below; OD-01 resolved 2026-05-23 → S1). References to "OD-02" in older material should be read as "OD-01 (stack choice, runtime half)."

---

## OD-15 — *Resolved 2026-05-31. See Resolution log row below.*

---

## OD-16 — Scoring semantics (reversed, subscales, per-item correctness)

**Opened.** 2026-06-01 (deferred from OD-15 closure on 2026-05-31).

**Context.** Schema 2 v26.0601 ships *shapes* for scoring — `Prompt.reversed`, `Prompt.construct`, `Subscale.prompt_ids` / `weight_per_prompt`, `ScoringDef.formula` / `range` / `interpretation`, `Solution.expected_response` — but does **not** yet specify the **runtime semantics**: when each piece is evaluated, what reads what, and what is persisted vs. derived. Until OD-16 resolves, viewers and the analysis layer have no shared contract; two implementations could produce different totals from the same response set.

OD-01 already established that scoring formulas evaluate inside the WASM expression evaluator (OD-11), live in the viewer iff the deployment's `show_score` is true, and otherwise travel inert with the submission. OD-16 picks up from there.

**Sub-questions to resolve.**

- **16a — Reversed-value pipeline.** When a Prompt sets `reversed: true`, where is `value' = max + min − value` applied?
  - (i) **Auto-applied by the evaluator** before any user formula sees the value. Formulas always read forward-scored values; authors set the flag once and stop thinking about direction. *(Recommended.)* Pros: every subscale `mean(prompt_ids)` is correct without per-author care; no risk of double-reversal. Cons: the canonical JSON's `responses[].value` and a `mean()` result are no longer trivially derivable from each other — analysts must re-apply the same rule, or read the post-reversal "scored value" the viewer emits.
  - (ii) **Metadata only**; formulas must call an explicit `reverse(prompt_id)` helper. Pros: pure transparency. Cons: every author has to remember; one missed call silently corrupts a subscale total.
  - (iii) **Analysis-layer only**: viewer never reverses; downstream tools handle it. Pros: viewer stays dumb. Cons: live `show_score` formulas in the viewer produce wrong totals.

- **16b — Subscale auto-derivation from `construct`.** When several Prompts share the same `construct`, should the Library / Editor auto-create the corresponding `Subscale` entry?
  - (i) **Never.** Subscales must be explicitly authored with their `prompt_ids` list. Pros: canonical JSON is deterministic; renaming a `construct` value never silently changes a subscale total. Cons: tedious for instruments with many subscales.
  - (ii) **Editor-assisted, never automatic.** Editor offers a "fill from constructs" action; once accepted, the result is canonical JSON with explicit `prompt_ids`. *(Recommended.)* Pros: ergonomic without spooky action; canonical JSON remains the source of truth.
  - (iii) **Implicit at read time.** If `subscales[]` is empty, viewers and the analysis layer auto-group by `construct`. Pros: zero authoring. Cons: rename-spookiness; two consumers of the same JSON can disagree if one ignores the implicit rule.

- **16c — Per-item correctness for Solution-bearing Items.** When an Item references a `Solution` (sol_*), is correctness materialised on the response, or recomputed each time?
  - (i) **Recompute on read** (raw response only). Pros: minimal payload; no risk of stale correctness if the Solution is corrected post-hoc. Cons: every consumer needs the Solution at hand.
  - (ii) **Persist `correct: bool` alongside `value`** at submission time. *(Recommended.)* Pros: response is self-describing for downstream tools; the analysis layer doesn't need to dereference Library entries. Cons: if the Solution is later corrected, the stored value goes stale (mitigated by re-running a small recompute job — or by treating Solutions as version-pinned per OD-06 already).
  - (iii) **Both** — persist `correct` and re-verify on read. Pros: defence-in-depth. Cons: complexity for marginal benefit.

- **16d — Where do `Subscale` and `ScoringDef` evaluate?** OD-01 settled formula evaluation in principle. To make 16a/16b coherent we need to be explicit:
  - (i) **Viewer-side via WASM evaluator** when `show_score` is true; otherwise inert metadata travelling with the submission. *(Recommended — restates OD-01 for this scope.)*
  - (ii) Always offline (analysis layer only).
  - (iii) Always live in viewer regardless of `show_score`.

- **16e — Formula vocabulary.** `ScoringDef.formula` is a string today. What can it reference?
  - (i) **Prompt values + Subscale results + literals + a fixed function set** (`sum`, `mean`, `count`, `if`, basic arithmetic, comparison). Subscales referenced by `id`. *(Recommended.)* Pros: matches the WASM evaluator's existing surface; predictable. Cons: no escape hatch.
  - (ii) The above + arbitrary JS expressions. Pros: maximal expressiveness. Cons: hard to validate, hard to port across viewers.

- **16f — `InterpretationBand` boundary semantics.** When the schema declares `min` and `max` on a band:
  - (i) **`min` inclusive, `max` inclusive** (closed intervals). Adjacent bands MUST NOT overlap; the Library rejects overlaps. *(Recommended.)* Pros: matches how clinical cutoffs are usually written ("score 5–9 = mild").
  - (ii) `min` inclusive, `max` exclusive (half-open). Pros: half-open intervals tile naturally. Cons: cognitively foreign to the questionnaire audience.

**Knock-ons.**

- Once 16a is settled, the response schema (Schema 5) must specify whether `responses[].value` is the raw or the post-reversal value, or both (e.g., `value` + `scored_value`).
- Once 16c is settled, the response schema may grow a `correct` field on each item.
- Once 16e is settled, the WASM evaluator's function table is the contract — and Schema 2 needs a `formula_language_version` so future expansions are not silently breaking.
- The Importer (13_importers.md) needs to know how to migrate legacy `survey_database` `reversed` flags (already 1:1 to `Prompt.reversed`, but per 16a it now has a runtime contract).

**Resolution criterion.** All six sub-questions answered; recommended-defaults locked in unless flagged for grilling.

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
| OD-15 | 2026-05-31 | **Pure pivot of the Schema 2 entity model to align with the legacy survey_database catalogue.** Eleven reusable entity types in two categories: **content-bearing** (Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx) and **ref-binding** (Question, Item, Solution). **Item** = Question + Option (saved `it_*` or inline on Page elements). **Question** = Prompt + optional Context + optional Instruction (saved `q_*` or inline inside Item). All content-bearing entities use a `content` language-keyed map (`{ status, fields }`) instead of v26.0528's `text` + `translations` split. UI input widget derived from Option's `(input_data_type, measurement_type, selection)` — no polymorphic Question $defs. Construct on Prompt (psychometric concept measured); Dimension on Prompt + Option (kind of judgment / scale, typically matching). Section's `shared_option` for matrix layouts. v26.0528 archived under `versions/v26.0528/`; new schema lands at fresh CalVer with `breaking` severity. Subscales auto-derivation deferred to a future Scoring OD. 23 sub-questions resolved across grilling sessions on 2026-05-29/30/31. | [05a_reusable_entities.md](05a_reusable_entities.md) (full body); knock-on to [05_data_model.md](05_data_model.md) §"Schema 2", [02_terminology.md](02_terminology.md) §"Content hierarchy", [06_library.md](06_library.md) §"Library content", [13_importers.md](13_importers.md) |
