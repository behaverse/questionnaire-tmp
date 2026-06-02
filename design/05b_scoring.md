# 05b — Scoring model (Schema 2 runtime semantics — OD-16)

**Status.** **OD-16 resolved 2026-06-02.** This document is the authoritative body for the OD-16 resolution; the Resolution-log row in [10_open_decisions.md](10_open_decisions.md) points here. Six sub-decisions resolved (16a Reversed-value pipeline, 16b Subscale auto-derivation, 16c Per-item correctness persistence, 16d Evaluation triggers, 16e Scoring architecture / Scorer entity, 16f Interpretation bands — subsumed by 16e). Companion to [05a_reusable_entities.md](05a_reusable_entities.md): 05a defines *what entities exist*; 05b defines *how scoring computes values from response data*.

OD-15 deferred scoring entirely. The Schema 2 v26.0601 entity model ships the **shapes** scoring needs (Prompt.reversed, Prompt.construct, Subscale entity, Solution entity) but no runtime semantics. 05b fills that in. It also pivots the scoring architecture away from in-JSON formulas and toward an **external Scorer** model (path B in the grilling log).

---

## 1. Glossary

| Term | Definition | Distinct from |
|---|---|---|
| **Score** | A named computed value produced by a Scorer, declared on the Questionnaire in `scores[]`. Each entry is a `{id, scorer, path}` reference into a structured Scorer output. Consumable by LogicRule conditions and display layers. | Subscale (Subscale is a *grouping tag* on Prompts; Score is a *computed value*) |
| **Scorer** | A new Library entity (`scr_*`) representing a versioned scoring procedure. Declares input schema, output schema, conformant implementations (WASM / HTTP / subprocess / language packages), and test cases. The same logical Scorer can have multiple implementations; all must pass the same test cases. | Score (Score is a *reference* into a Scorer's output; Scorer is the procedure itself) |
| **Procedure** | (Deprecated mid-grilling.) Earlier drafts modelled a Scorer as exposing named procedures; the resolved model replaces this with a **structured output object** + JSON Pointer paths. The term does not appear in the schema. | — |
| **`scored_value`** | The post-reversal value per Item, computed by the viewer's WASM evaluator from `response.value` using the Prompt's `reversed` flag and the Option's range: `scored_value = max + min − value` if `reversed`, else `scored_value = value`. Persisted alongside `value` in the response payload (16a). | `value` (the raw participant input — what they clicked) |
| **Subscale (revised)** | A Library entity (`scl_*`) that **labels a group of Prompts** as conceptually belonging together. Carries only `id`, `name`, `description`, and translatable `content`. **No `prompt_ids`** and **no `weight_per_prompt`** — those have moved. Membership is declared on the Prompt side: `Prompt.subscales: string[]` lists the Subscale ids the Prompt belongs to. | Score (Subscales group Prompts descriptively; Scores compute values) |
| **On-demand scoring** | The invocation model: any consumer (LogicRule, display, downstream tool) requests a named Score by id at any point in the flow. The engine resolves the request by invoking the Scorer (or hitting a cache). Replaces the earlier mid-session-vs-post-session dichotomy, which assumed an ill-defined "session" boundary. | Pre-computed scoring (the engine doesn't precompute; it computes lazily on request) |
| **Branching trigger** | A scoring evaluation fired by `LogicRule.condition`. Always-on regardless of `show_score`. Fires at page-submit time, when the participant clicks Next, because branching is a navigation decision (16d). | Display trigger (display is `show_score`-gated; branching is not) |
| **Display trigger** | A scoring evaluation fired by the viewer's render of a score to the participant. Gated by `show_score`. Terminal-by-default; deployment can opt-in to `show_score_live` for live running totals, unless the canonical Questionnaire sets `lock_show_score_timing: true` (16d). | Branching trigger |
| **Conformance** | The property that every implementation of a Scorer entity produces identical outputs for identical inputs across the entity's test cases. Enforced at Library publish time. Custom variants of an instrument's scoring (population-specific cutoffs, IRT-corrected formulas) require a **new Scorer entity** with its own id and test cases, not a non-conformant implementation of an existing one (16e, 16f). | Implementation (the code that runs); Scorer (the contract) |

---

## 2. Why this document exists

OD-15 (resolved 2026-05-31) reshaped the Schema 2 entity model and explicitly **deferred subscale and scoring semantics**. The Schema 2 v26.0601 implementation ships with `Subscale.prompt_ids`, `Subscale.weight_per_prompt`, `ScoringDef.formula`, `ScoringDef.interpretation` — all of which assume an in-JSON formula language for scoring computation. The deferred OD intended to design that language.

The 2026-06-01 grilling session pivoted away from the formula-language approach. The user's pushback: a formula DSL handles the simple sum/mean cases but breaks down on real-world scoring needs — value recoding before sum (different recodings for the same item across different subscales), items contributing to multiple subscales, IRT-calibrated scoring (NIH-PROMIS family), and proprietary lab procedures. The resolution path (B): **scoring logic lives in an external Scorer entity, not in the Questionnaire JSON.** The Questionnaire only declares scores by id and references a Scorer.

This dissolves the previously-implemented `ScoringDef`, `InterpretationBand`, `Subscale.prompt_ids`, and `Subscale.weight_per_prompt`. A new Library entity (`Scorer`) is introduced. The model is documented here in full; the implementation (next Schema 2 CalVer bump) follows.

---

## 3. The scoring architecture in one picture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Questionnaire (Schema 2)                   │
│                                                                  │
│  pages[]   ─── elements (Sections, Items, Messages, ...)         │
│  logic[]   ─── LogicRule.condition references score ids          │
│  scores[]  ─── [ { id, scorer: "scr_phq9@v26.0601",              │
│                    path: "/severity", name: "..." },             │
│                  ... ]                                           │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │  references (CalVer-pinned per OD-06)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Scorer entity (Library, scr_*)                │
│                                                                  │
│  id: "scr_phq9"        version: "v26.0601"                       │
│  inputs:        JSON Schema (responses, participant, deployment) │
│  output_schema: JSON Schema (total, severity, band, items, ...)  │
│  implementations: [                                              │
│    { kind: "wasm",   url: "...", sha256: "..." },                │
│    { kind: "http",   url: "..." },                               │
│    { kind: "python", package: "..." }                            │
│  ]                                                               │
│  test_cases: [ { input: {...}, expected: {...} }, ... ]          │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │  resolved at deployment to one impl
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Scoring engine (runtime)                        │
│                                                                  │
│  invoke(scorer_ref, inputs) → output_object                      │
│  cache_key = (scorer_ref, hash(inputs))                          │
│                                                                  │
│  Consumer asks for score id "phq9_severity":                     │
│    1. Look up scores[].{id} → { scorer, path }                   │
│    2. Cache hit on (scorer, hash(inputs))? Extract path.         │
│    3. Cache miss: invoke scorer, cache result, extract path.     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Decision summary (the six sub-OD resolutions)

### 4.1 — 16a: Reversed-value pipeline

**Resolved (i) + (b) + Library guardrail.**

- The viewer's WASM evaluator applies `value' = max + min − value` to any response whose Prompt has `reversed: true` **before** any consumer reads it. Formulas and Scorer inputs always see post-reversal `scored_value`.
- The response payload carries **both** `value` (raw participant input) and `scored_value` (post-reversal). On read, stored `scored_value` wins — it's what the viewer's `show_score` displayed and what the Scorer's test cases were validated against; recomputing from current metadata would silently disagree.
- The Library **rejects** `reversed: true` on Prompts whose Option's `measurement_type` is `nominal` (categorical / unordered). Warns on unbounded `text` / `numeric` Options.

### 4.2 — 16b: Subscale auto-derivation from `construct`

**Resolved (ii) Editor-assisted, never automatic; + (β) refuse resync after hand-edit.**

- The Editor offers an explicit "Fill subscale membership from `construct`" action when authoring a Subscale entity or a Questionnaire. Once accepted, the result is canonical JSON with explicit references; no implicit dependency on `construct` at read time.
- After the author hand-edits a subscale's membership, the resync action is **disabled**; a separate "reset to auto-fill" button is available for explicit start-over. (α) overwrite was rejected — destroys curation. (γ) three-way merge was rejected — too much UI for a rare case.

Note: under path (B) the membership lives on the Prompt (`Prompt.subscales: string[]`), not on the Subscale entity. The Editor's auto-fill assists in setting `Prompt.subscales[]` from `Prompt.construct`, not a Questionnaire-level `subscales[]` block (which has dissolved — see 4.5).

### 4.3 — 16c: Per-item correctness for Solution-bearing Items

**Resolved (ii) + (α) + (α′).**

- When an Item references a Solution, the viewer computes `correct: bool` at submission time by comparing `response.value` (or `scored_value`, see below) against `solution.expected_response`. The boolean is persisted on the response.
- Items **without** a Solution have **no** `correct` field on the response — omitted, not `null`. Presence of `correct` is the signal that the Item has a right answer.
- The **comparator** is derived from the Option's `(input_data_type, measurement_type, selection)` triple. Single-select Option ⇒ `equals`. Multi-select ⇒ `set_equals`. Text Option with a regex Validation ⇒ `matches_regex`. The Solution does **not** declare a `comparator` field.

### 4.4 — 16d: When scoring evaluates (two-trigger model)

**Resolved (i) + (q) + (α).**

Two distinct evaluation triggers, on different cadences:

| Trigger | What evaluates | When | `show_score`-gated? |
|---|---|---|---|
| **Branching** | Scores referenced by any `LogicRule.condition` | Page-submit (when participant clicks Next) | No — always fires |
| **Display** | Scores shown to the participant | Session terminal by default; live opt-in | Yes — only if `show_score: true` |

The display-timing knob (`show_score_live`) is **deployment-level by default**, with an optional **canonical lock**: the Questionnaire can set `lock_show_score_timing: true` to forbid deployment override (clinical-methodology requirement). Without the lock, deployments freely choose terminal-vs-live.

Formula errors / Scorer failures / missing inputs → score evaluates to **sentinel `null`**. LogicRule conditions treat `null` as false; display layers render an em-dash. The viewer surfaces an error toast only if `null` propagates to a *required* display element.

### 4.5 — 16e: Scoring architecture (path B; external Scorer)

The biggest pivot. Eight sub-decisions resolved as:

**(B) Logic lives in the Scorer; the Questionnaire JSON only declares scores by id.** A `ScoringDef.formula` field no longer exists. The Schema 2 formula language disappears as a problem; in its place, the Scorer Library entity owns the procedure.

**Rationale.** Real psychometric scoring is arbitrary code. Value recoding before sum, items contributing to multiple subscales with different recodings, IRT-calibrated scoring (NIH-PROMIS), and proprietary lab procedures are awkward-to-impossible in any DSL we would reasonably design. They are trivial in real code. The cost — the JSON is no longer self-describing for scoring — is honest about a reality that's already true: published instruments cite their scoring procedure separately from the questionnaire itself. The Scorer entity makes that separation first-class.

**(P) Subscale survives as a property of items/prompts.** `Subscale` (`scl_*`) is a **Library entity carrying only id, name, description, and translatable `content`** — no `prompt_ids`, no `weight_per_prompt`. Subscale membership lives on the Prompt: `Prompt.subscales: string[]` (multi-valued, because items routinely load on multiple subscales). The Questionnaire's old `subscales[]` block dissolves entirely.

**(T) One Scorer reference per declared score, not per Questionnaire.** Each `scores[]` entry names its Scorer and a path into the Scorer's output. Composition is automatic — a battery combining PHQ-9 + GAD-7 + PSS-10 references the three Scorer entities directly, without a glue "composite Scorer" artefact. Custom composite scores that genuinely combine outputs across instruments (e.g., a "mental-health composite") require a *new* Scorer entity that consumes other Scorers' outputs as inputs.

**(Z) Multi-implementation per Scorer.** The Scorer entity declares the **contract** (inputs schema, output schema, test cases) and lists **conformant implementations** (WASM, HTTP, language packages, …). Deployment picks one. Library publish enforces that every implementation passes every test case. Custom variants ⇒ new Scorer entity (e.g., `scr_phq9_dichotomised`, `scr_phq9_<population>`), not non-conformant impls of an existing one.

**Structured-output model with JSON Pointer paths (β).** The Scorer returns **one structured result object** per invocation, conforming to its declared `output_schema` (JSON Schema). The notion of named "procedures" is dropped; the Scorer just produces a result. Each `scores[]` entry references a JSON Pointer path into that result:

```jsonc
// Scorer entity (in Library)
{
  "id": "scr_phq9",
  "version": "v26.0601",
  "inputs": {
    "type": "object",
    "properties": {
      "scored_responses": {
        "type": "object",
        "patternProperties": { "^pr_phq9_[1-9]$": { "type": "integer" } }
      }
    },
    "required": ["scored_responses"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "total":         { "type": "integer", "minimum": 0, "maximum": 27 },
      "severity":      { "type": "string",
                         "enum": ["minimal","mild","moderate","mod_severe","severe"] },
      "band":          { "type": "object",
                         "properties": {
                           "min":   { "type": "integer" },
                           "max":   { "type": "integer" },
                           "label": { "type": "string" } } },
      "missing_count": { "type": "integer" },
      "items":         { "type": "array", "items": { "type": "object" } }
    }
  },
  "implementations": [
    { "kind": "wasm",   "url": "https://behaverse.org/scorers/phq9/v26.0601/scorer.wasm",
      "sha256": "..." },
    { "kind": "http",   "url": "https://scorer.behaverse.org/phq9/v26.0601" },
    { "kind": "python", "package": "behaverse-scorer-phq9==26.0601" }
  ],
  "test_cases": [
    { "input":    { "scored_responses": { "pr_phq9_1": 1, "pr_phq9_2": 2,
                                          "pr_phq9_3": 1, "pr_phq9_4": 2,
                                          "pr_phq9_5": 1, "pr_phq9_6": 1,
                                          "pr_phq9_7": 2, "pr_phq9_8": 1,
                                          "pr_phq9_9": 1 } },
      "expected": { "total": 12, "severity": "moderate",
                    "band": { "min": 10, "max": 14, "label": "Moderate Depression" },
                    "missing_count": 0 } }
  ]
}

// Questionnaire
"scores": [
  { "id": "phq9_total",     "scorer": "scr_phq9@v26.0601", "path": "/total",
    "name": "PHQ-9 Total" },
  { "id": "phq9_severity",  "scorer": "scr_phq9@v26.0601", "path": "/severity",
    "name": "PHQ-9 Severity Category" },
  { "id": "phq9_band_label","scorer": "scr_phq9@v26.0601", "path": "/band/label" }
]
```

**InterpretationBand dissolves into Scorer output (K).** Bands are part of the published scoring procedure; they live inside the Scorer's implementation. The Scorer exposes them as fields in its output (`severity`, `band`, etc.). The Questionnaire references them via `scores[]` like any other field. The Schema no longer declares bands.

**Broad inputs JSON Schema (N).** The Scorer's input is a full JSON object whose schema it declares. Conventional top-level fields:
- `responses` — keyed by Prompt id, raw participant `value`s
- `scored_responses` — keyed by Prompt id, post-reversal `scored_value`s (per 4.1)
- `participant` — pulled from Schema 6 session profile: age, sex, locale, …
- `deployment` — deployment-level context: study id, locale override, scoring profile

A Scorer declares only the fields it needs. The viewer assembles them at invocation time from session state. Missing required fields → `null` score per 4.4. This makes population-specific / demographics-aware scoring (PROMIS-CAT, culturally adapted cutoffs) native to the model without requiring demographics to be asked twice (once on registration, once as questionnaire items).

**Score declaration shape (minimal).** Each `scores[]` entry is `{id, scorer, path, name?, description?}`. The `value_type` / `range` / `values` are *not* restated on the score entry — the Scorer's `output_schema` dereferenced at `path` is authoritative; the Library validator does the type-resolution at publish time for LogicRule type-checking.

**Cache invalidation.** Cache key is `(scorer_ref, hash(inputs))` where `inputs` includes every field the Scorer's input schema declared (`scored_responses`, `participant`, `deployment`). Any input change invalidates the cache; the next read of any `scores[]` entry referencing that Scorer triggers re-invocation. The viewer does not pre-emptively re-invoke on every response change — it waits for a consumer (LogicRule at page-submit, display when triggered) to ask.

**Versioning.** Scorer refs in `scores[]` are CalVer-pinned per OD-06 (`scr_phq9@v26.0601`). No separate `formula_language_version` field — there is no formula language. Schema 2's `$schema` version carries the contract version (input/output shape conventions, JSON Pointer convention, structured-result model).

### 4.6 — 16f: InterpretationBand boundary semantics

**Subsumed by 16e.** Under path (B) with the structured-output model, bands live inside the Scorer's implementation. Boundary semantics (closed vs. half-open intervals) are a Scorer-internal concern, observable via test cases. If two Scorers treat a boundary value differently, they are observably different Scorers and the (Z) discipline says they must have different entity ids. The Schema no longer expresses bands; 16f has no separate resolution.

---

## 5. Knock-on changes to Schema 2

The v26.0601 implementation needs to evolve. The next CalVer bump will:

**Add.**
- New Library entity: `Scorer` (`scr_*`) with the shape described in §4.5.
- New field on Prompt: `subscales: string[]` (multi-valued list of Subscale ids the Prompt belongs to).
- New top-level Questionnaire field: `scores[]` (list of `{id, scorer, path, name?, description?}` entries).
- New top-level Questionnaire field: `lock_show_score_timing: boolean` (default false).
- New field on response (Schema 5, when authored): `scored_value` alongside `value` (per 4.1).
- New field on response: `correct: bool` for Solution-bearing Items, omitted otherwise (per 4.3).

**Modify.**
- Subscale entity: remove `prompt_ids`, remove `weight_per_prompt`. Retain `id`, `name`, `description`, `content`.

**Remove.**
- Questionnaire's `subscales[]` block. (Subscale entities still exist in the Library; the Questionnaire just doesn't enumerate them — Subscale membership is on the Prompt side now.)
- `ScoringDef` entity. Replaced by the `scores[]` list of Scorer-references.
- `InterpretationBand` entity. Subsumed by Scorer output schema.

**Preserve unchanged.**
- `PerQuestionValidation` on Option — input validation, not scoring. Survives.
- `CrossQuestionValidationRule` on Questionnaire — cross-item validation, not scoring. Survives.
- `LogicRule` — branching is unchanged in shape; `condition` expressions now resolve `score(id)` references via the new engine.

**Severity:** `breaking` per CalVer policy. The bump happens at next ratification.

---

## 6. Knock-on changes to other schemas

**Schema 1 (Instrument metadata)** — unchanged.

**Schema 3 (Questionnaire Runtime)** — must denormalise `scores[]` along with the rest. The flattened runtime view includes the score declarations and the deployment-resolved Scorer implementation references; the WASM evaluator (OD-11) gains a `score(id)` host function that dispatches to the engine.

**Schema 5 (Response Data)** — must accommodate `scored_value` and (for Solution-bearing Items) `correct`. Authoring this schema is now blocked behind OD-16 resolution; it can proceed.

**Schema 6 (Session Metadata)** — gains conventional fields read by Scorers' `participant` input (age, sex, locale). These already exist conceptually; OD-16 just names them as the source of truth for demographics-aware scoring.

**Behaverse Trial Format (xAPI Schema 4a)** — gains a `scored` verb (or extends `answered`) to carry `scored_value` + `correct` in the xAPI context per session, allowing the analysis layer to consume them without re-running the Scorer for already-computed values.

---

## 7. Knock-on changes to the architecture and other docs

- **[04_architecture.md](04_architecture.md)** — gains a "Scoring engine" component shown alongside the Viewer Service. Documents the (scorer_ref, hash) caching layer and the three engine-location options (WASM-embedded, HTTP service, local subprocess).
- **[06_library.md](06_library.md)** — adds Scorer to the Library content table. Documents the conformance-testing publish gate (every implementation passes every test case).
- **[07_editor.md](07_editor.md)** — adds the "auto-fill `Prompt.subscales` from `construct`" action (per 4.2). Adds Scorer-reference picker for `scores[]`.
- **[08_viewer.md](08_viewer.md)** — documents the two-trigger evaluation model (4.4) and the `show_score_live` deployment option.
- **[08a_viewer_service.md](08a_viewer_service.md)** — documents the engine deployment options.
- **[11_content_licensing.md](11_content_licensing.md)** — Scorer entities are now first-class licensed content. Their licensing posture (`scoring_procedure_license`) may differ from the Questionnaire's content licensing (e.g., PHQ-9 questionnaire is permissive; the specific clinical-cutoff scoring may be proprietary). Library publish records each.
- **[13_importers.md](13_importers.md)** — gains a "Scorer importer" workflow for porting legacy R/SAS/Python scoring scripts into Scorer entities.

---

## 8. Migration of legacy scoring

The 792 legacy `survey_database/` Prompts carry a `reversed` flag (migrates 1:1 to `Prompt.reversed` per 4.1) and a `construct`-equivalent that migrates to `Prompt.construct` (already done in v26.0601). What does **not** migrate automatically:

- Subscale aggregation logic (was implicit in legacy scoring scripts). Each instrument's scoring becomes a new Scorer entity, hand-authored or auto-generated from the legacy script with human review.
- Interpretation bands (were inline in legacy reports). Move into the Scorer's `output_schema` / implementation.

For the MVP, **the Library ships with Scorer entities for the highest-priority migrated instruments** (PHQ-9, GAD-7, PSS-10, BDI-II as a starting set). Other instruments can be ported as needed.

---

## 9. Resolution log

| Sub-OD | Title | Resolution | Settled |
|---|---|---|---|
| 16a | Reversed-value pipeline | (i) auto-apply in evaluator; (b) payload carries both `value` + `scored_value`; Library rejects `reversed: true` on nominal Options | 2026-06-02 |
| 16b | Subscale auto-derivation from `construct` | (ii) Editor-assisted, never automatic; (β) refuse resync after hand-edit | 2026-06-02 |
| 16c | Per-item correctness | (ii) persist `correct: bool` at submission; (α) omit when no Solution; (α′) comparator derived from Option triple | 2026-06-02 |
| 16d | When scoring evaluates | Two-trigger model (branching always-on at page-submit, display `show_score`-gated, terminal-by-default); (q) deployment-override + optional canonical lock; (α) sentinel `null` on error | 2026-06-02 |
| 16e | Scoring architecture | (B) external Scorer; (P) Subscale as Library entity + `Prompt.subscales[]`; (T) per-score Scorer ref; (Z) multi-impl per Scorer; structured-output model; (β) JSON Pointer paths; (K) bands inside Scorer; (N) broad inputs JSON Schema | 2026-06-02 |
| 16f | InterpretationBand boundary semantics | Subsumed by 16e | 2026-06-02 |

Grilling session conducted 2026-06-02 (one-question-at-a-time, recommendations-up-for-challenge style, per the project's standing pattern).
