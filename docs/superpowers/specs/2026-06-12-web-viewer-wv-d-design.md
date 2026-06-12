# Web Viewer WV-D (Logic, Validation, In-Session Scoring) — Design Spec

**Date drafted:** 2026-06-12
**Author:** Web Viewer WV-D brainstorming session (2026-06-12)
**Component:** **Web Viewer**, sub-project **WV-D** — fourth stage (decomposition in the [WV-A spec §0](2026-06-11-web-viewer-wv-a-design.md)). It embeds the now-built **expression evaluator** ([WV-C](2026-06-12-expression-evaluator-wv-c-design.md)) to turn the linear viewer into a *logic-driven* one: `show_if` visibility, `skip`/`branch` navigation, `piping`, per- and cross-question validation, and the deterministic scoring helpers (`reversed_value`, Solution `correct`). It flips the viewer's Schema 7 manifest to **declare** logic support so the Viewer Service stops stripping logic from minted runtimes.
**Target:** `web-viewer/` + the `questionnaire-expression-evaluator/` web package as a local dependency. No Viewer Service change.
**Authoritative source documents:**

- [design/15_expression_language.md](../../../design/15_expression_language.md) + `questionnaire-expression-evaluator/` — the evaluator WV-D drives (`evaluate_condition(expr, {var,score})`, `reversed`, `compare`, `check_expression`; grammar/determinism/sentinel-Null).
- [schemas/questionnaire/schema.json](../../../schemas/questionnaire/schema.json) `$defs`: `LogicRule` (type `skip`/`visibility`/`piping`/`branch`; `condition`; `action.{skip_to,show,target_id,field_path,source}`), `PerQuestionValidation` (`format`/`range`/`length` + messages — declarative, **not** expressions), `CrossQuestionValidationRule` (`condition` Expression, `message`, `targets[]`), `Solution` (`expected_response`), `Score` (`id`/`scorer`/`path`). The `show_if` Expression on Page/Section/Item page-elements.
- [design/05b_scoring.md](../../../design/05b_scoring.md) §§4.1–4.4 — reversed-value (`scored_value = max + min − value`), Solution comparator derivation (single→equals, multi→set_equals, text+regex→matches_regex), the **two-trigger model** (branching trigger fires at page-submit, always-on; display trigger gated by `show_score`), sentinel-`null` (LogicRule conditions treat null as false).
- [schemas/runtime/examples/kitchensink_runtime.json](../../../schemas/runtime/examples/kitchensink_runtime.json) — a real Schema 3 with `logic[]` (a `branch` rule `phq9_total >= 10` → `page_followup`) + pinned `scores[]`.
- `web-viewer/src/` WV-A/B — `flattenSteps`/`Step`, the session reducer, `responses.ts` (`buildItemRow` — WV-D adds `scored_value`/`correct`), `App.tsx` `advance()`/gating.

---

## 1 — Scope

### 1.1 In scope

- **Evaluator integration** (§3): depend on the WV-C web package; wrap it behind a tiny injectable TS port (`LogicEvaluator`) so the logic engine is unit-testable without loading WASM in jsdom, while production and an integration test use the real binary (preserves the OD-11 determinism guarantee).
- **Logic engine** (§4): at session start, collect + compile every `show_if`, `LogicRule.condition`, and cross-question `condition` into evaluator `Program`s (compile-once). Expose pure query functions the App calls on the right triggers.
- **Dynamic navigation** (§5): replace WV-A's static `stepIndex + 1` with a **graph walk**. `show_if`-hidden steps are skipped; `skip`/`branch` rules (condition true at page-submit) jump to `skip_to`; Back retraces the actual visited path. This is the architecturally significant change.
- **Visibility** (§4.1): element `show_if` (Item/Section/Message) + `visibility` LogicRules (`target_id`, `show`) filter what renders within a step; re-evaluated on answer change.
- **Piping** (§4.4): `piping` rules substitute the `source` answer's text into the `field_path` location (a prompt/label/message) before render; unresolved path → no-op + dev warning.
- **Validation** (§6): **per-question** (declarative `range`/`length`/`format`-as-regex) + **cross-question** (`condition` Expression; condition-true ⇒ error) checked at advance; failures block advance, focus + message the offending targets (reuses WV-A's required-gating focus path).
- **Scoring helpers** (§7): `reversed_value` applied at answer-commit → the response row carries **both** `value` and `scored_value` (fills the field WV-B left out); Solution-bearing items compute **`correct`** at commit via the derived comparator → the row's `correct` field. Both via the WV-C helpers.
- **`score(id)` host binding** (§7.3): wire the evaluator's `score` resolver to a `ScoreResolver` interface. Its **default implementation returns Null** (scores unavailable) → score-dependent branching/visibility degrade to the sentinel "false" — until the external Scorer host exists (Flag F1).
- **Manifest** (§8): `logic_actions: ["skip","visibility","piping","branch"]` + `evaluator: { language_version, functions:[…] }` + `viewer_version` bump. The VS then stops stripping logic for this viewer.

### 1.2 Non-goals (deferred)

- **External Scorer execution** (Flag F1): running the pinned `scores[].impl` (wasm/http/python/r) to actually compute a score. No Scorer ABI is defined and no scorer artifacts exist (the example URLs are placeholders) — that's the **Scorer conformance runner** (OD-16), a separate later track. WV-D ships the resolver *boundary*, not the execution.
- **In-session score *display*** (Flag F3): the display trigger (`show_score`, `show_score_live`, terminal score screens) — there is nothing to display until scorer execution lands. WV-D handles only the branching-trigger plumbing.
- **`style.layout` widget refinements** (dropdown/slider — WV-A follow-up), behavioural channels, resume (WV-E), locale switch — unchanged from WV-A/B.
- **Randomisation** (`randomize` on Page/Section) — deferred; deterministic document order retained (no RNG in the viewer yet; noted follow-up).

## 2 — Module layout (additions to `web-viewer/src/`)

```
src/logic/
├── evaluator.ts      # LogicEvaluator port + the real WASM-backed adapter + a test double factory
├── compile.ts        # collectPrograms(runtime): compile every show_if / LogicRule / cross-validation expr (compile-once)
├── visibility.ts     # isElementVisible(key, ctx) — show_if + visibility rules → boolean
├── navigation.ts     # nextStepIndex / prevStep — graph walk honouring skip/branch + hidden steps
├── piping.ts         # applyPiping(elements, ctx) — substitute source answers into field_path text
├── validation.ts     # validateStep(step, answers): per-question (range/length/format) + cross-question (eval)
└── scoring.ts         # scoredValueFor(option, value) + solutionCorrect(item, value) (WV-C helper calls) + ScoreResolver
src/app/
├── App.tsx           # wires the engine into advance()/back()/render; recompute visible steps on answer change
└── responses.ts      # buildItemRow gains scored_value + correct (from scoring.ts)
web-viewer/manifest.json  # logic_actions + evaluator + version bump
```

Each `src/logic/` module is a pure function over `(runtime, answers, resolver)` — no React, independently testable with an injected evaluator. `App.tsx` owns the only stateful wiring.

## 3 — Evaluator integration

WV-C built `@behaverse/expression-evaluator` with `wasm-pack --target nodejs` (for its own determinism test). WV-D needs it **in the browser** (Vite) *and* in **vitest**. The `LogicEvaluator` port decouples these:

```ts
export interface LogicEvaluator {
  condition(expr: string, bindings: Bindings): boolean   // compiled+evaluated; non-Bool/Null → false
  reversedValue(value: number, min: number, max: number): number
  compareSolution(cmp: 'equals'|'set_equals'|'matches_regex', response: unknown, expected: unknown): boolean
}
export interface Bindings { var(id: string): unknown; score(id: string): unknown }
```

- **Production**: a `wasmEvaluator()` adapter over the real WASM (Flag F2 — built `--target web`/bundler for Vite; loaded once at boot, before first render).
- **Tests**: the *logic-engine* tests inject a deterministic `fakeEvaluator` (a thin TS implementation of the few operators the test expressions use, OR a hand-mapped `{expr → result}` table) so navigation/visibility/validation orchestration is tested independently of WASM. **One** node-environment integration test loads the real nodejs-built WASM and runs representative expressions, and the live smoke (§9) exercises the real browser WASM end-to-end. Evaluator *correctness* is already proven by WV-C's `test_vectors.json`; WV-D tests the *engine*, not the language.

Rationale: loading real WASM inside jsdom is brittle; injecting the evaluator keeps WV-D's ~30 engine tests fast and hermetic without weakening the determinism contract (the real binary still runs in the browser and in the integration test).

## 4 — Logic engine

`collectPrograms(runtime)` walks the runtime once and returns a compiled bundle: `{ showIf: Map<elementKey, Program>, rules: CompiledRule[], crossValidation: CompiledValidation[] }`. Compilation uses `check_expression` to reject malformed expressions at boot (logged; a malformed `show_if` defaults to *visible*, a malformed rule is dropped — fail-open for visibility, fail-safe for navigation). The **bindings** for every evaluation are built from the current answers (`var(id)` = the answer `AnswerValue` mapped to an evaluator value; the host falls through answer-ids → score-ids per WV-C F1) and the `ScoreResolver` (`score(id)`).

### 4.1 Visibility (`show_if` + `visibility` rules)
An element is visible iff: its own `show_if` (if any) evaluates true (absent ⇒ visible), AND no `visibility` LogicRule targeting it has fired with `show:false` (and any with `show:true` force-show). Evaluated whenever answers change. A hidden item is **not rendered, not gated, not submitted** (its answer, if previously given then hidden, is excluded from the step's required-set and from row emission — consistent with WV-B's "untouched optional → no row").

### 4.2/4.3 Navigation (`skip` + `branch`) — see §5.

### 4.4 Piping
A `piping` rule with condition true substitutes the text value of `action.source` (an answer id) into `action.field_path` (a dotted path into the runtime, e.g. `pages.page_scalars.elements.0.label`). WV-D resolves `field_path` against the runtime structure and renders the substituted text for that element; if the path doesn't resolve, it's a no-op with a dev console warning. Piping is recomputed on answer change. (Substitution is into the rendered copy, never the stored runtime.)

## 5 — Dynamic navigation (the core change)

WV-A/B flattened the runtime into a static `Step[]` and advanced `stepIndex++`. WV-D keeps `flattenSteps` (the full ordered list) but navigation becomes a **graph walk** over it:

- **Visible steps**: a step is shown only if it contains ≥1 visible element (§4.1); fully-hidden steps are skipped silently.
- **Advance**: on Next/Enter/auto-advance from the current step, after validation passes (§6) and rows/events emit (WV-B), evaluate the page-submit logic rules **in document order**; the **first** `skip`/`branch` rule whose condition is true sets the next target = its `skip_to` **page**; navigation jumps to the first visible step of that page. If no rule fires, advance to the next visible step. Reaching past the last → finishing (WV-B).
- **Back**: retraces the **actual visited path** (a stack of visited step indices pushed on each forward move), not `stepIndex − 1` — because skips/branches make the path non-contiguous. Answers preserved (WV-A case-1).
- **Re-entry**: revisiting a step after Back shows its current visible elements + preserved answers; changing an answer that flips a downstream branch is handled naturally because rules re-evaluate at the next advance.
- **Progress**: the bar denominator becomes **indeterminate** under branching (the remaining path depends on answers). WV-D shows progress as "answered of currently-reachable" or a simpler step counter without a false total — see Flag F4.

A small `NavState` (visited-stack + current index) lives in the reducer; `nextStepIndex(runtime, programs, answers, current)` and `prevStep(navState)` are pure functions in `navigation.ts`.

## 6 — Validation

Checked at **advance**, before the step's rows emit (a blocked advance emits nothing):

- **Per-question** (declarative, from the Item's `validation`): `range: [min,max]` (numeric bounds, null = open), `length: [min,max]` (string length), `format` (a regex string or a referenced `RegEx` runtime entity → `compareSolution('matches_regex', value, pattern)`). Each failure shows its `*_message` (or a localized default) on the item. Empty optional answers skip validation; required-gating (WV-A) still runs first.
- **Cross-question** (`CrossValidationRule`): evaluate `condition`; **true ⇒ validation error** (the canonical example: condition true means the inconsistency exists). Show `message` on `targets[]`. Cross-rules run after per-question, before navigation.

Failures populate the existing `stepErrors` channel (WV-A focuses the first offender + `aria-live`), extended to carry per-item messages (not just the generic required text). Validation never auto-corrects.

## 7 — Scoring helpers

### 7.1 Reversed value
At answer-commit, if the item's Prompt has `reversed: true` and the Option is bounded numeric (min/max known), `scored_value = reversedValue(value, min, max)`; else `scored_value = value`. The response row (WV-B `buildItemRow`) gains **`scored_value`** alongside `value` (per 05b 4.1; on read, stored `scored_value` wins). Reversed is read from the runtime's resolved Prompt.

### 7.2 Solution correctness
For a Solution-bearing item, at commit compute `correct = compareSolution(cmp, response, expected_response)` where `cmp` derives from the Option triple (single→`equals`, multi→`set_equals`, text+regex→`matches_regex`). The row gains **`correct: bool`** (present *only* for Solution-bearing items — its presence is the signal the item has a right answer, per 05b 4.3). Schema 5 already allows `correct`/`score`.

### 7.3 `score(id)` resolver (boundary only)
`ScoreResolver.score(id) → Value`. WV-D ships the **default resolver returning Null** for every id (scores unavailable). Effect: a `LogicRule.condition` referencing a score (`phq9_total >= 10`) evaluates the score to Null → comparison → Null → condition false (sentinel) → that branch doesn't fire. This is **correct, safe degradation**, not a bug: until the Scorer host runs, score-gated branches simply don't trigger, and a dev warning logs which score ids were referenced-but-unresolved. The interface is the single seam the future Scorer host plugs into.

## 8 — Manifest

`web-viewer/manifest.json` gains:
```jsonc
"logic_actions": ["skip", "visibility", "piping", "branch"],
"evaluator": { "language_version": "v26.0612",   // the expression-language version (design/15)
               "functions": ["length","is_empty","not_empty","count","contains","score"] },
```
`viewer_version` bumps (e.g. `v26.0612`), and `bootstrap.ts` `VIEWER_VERSION` + the manifest-validation identity check move in lockstep (WV-A's CI guard). **Effect**: the denormaliser/VS no longer strips `logic[]` when minting for this viewer (WV-A declared no `logic_actions`, so logic was stripped — now it flows through and WV-D evaluates it). `scorer_impl_kinds` stays `["wasm"]` (the pin target; execution still deferred). A short note is added to design/08 §"Web Viewer" that the viewer now supports the four logic actions + the evaluator.

## 9 — Testing

1. **Pure engine units** (injected `fakeEvaluator`): `collectPrograms` (compiles all, fail-open/safe on malformed); `visibility` (show_if true/false/absent, visibility-rule override, hidden-item-not-gated); `navigation` (skip jump, branch jump, first-rule-wins, hidden-step skip, Back retraces visited path, no-rule linear advance); `piping` (substitute, unresolved path no-op); `validation` (range/length/format pass+fail, cross-rule true⇒error, messages); `scoring` (reversedValue via reversed flag, solutionCorrect per comparator, ScoreResolver-null → condition false).
2. **Evaluator integration** (node env): load the real nodejs WASM; run a representative `show_if`, a `branch` condition, a cross-validation, `reversed`, and `compare` — proving the port wiring matches the engine's expectations.
3. **App integration** (RTL, fakeEvaluator): a branching fixture — answer A routes to page X, answer B to page Y; a `show_if` item appears/disappears as a prior answer changes; a validation block stops advance with a message; `scored_value`/`correct` land in the posted rows.
4. **Manifest**: validates against Schema 7 with the new `logic_actions`/`evaluator`; identity check green.
5. **Live gate smoke** (extends WV-B's): build the evaluator `--target web`, deploy a questionnaire **with a real branch rule** (kitchensink-style) against the local stack, complete it twice taking both branches in a real browser, and confirm `export.csv` reflects the divergent paths + `scored_value` columns. Proves logic flows end-to-end (VS no longer strips it) and the real WASM evaluates in-browser.

## 10 — Review flags for the owner (decide at spec review)

- **F1 — Defer external Scorer execution; `score(id)` resolves to Null for now.** No Scorer ABI/artifacts exist; running `scores[].impl` is the OD-16 Scorer-conformance track. WV-D ships the `ScoreResolver` boundary (default null → score-gated branches safely don't fire + dev warning). Recommendation: **defer** (build the seam, not the engine). Confirm — this is the big scope call.
- **F2 — Evaluator load: add a `--target web`/bundler build of the WV-C package for Vite; inject the evaluator behind a TS port so engine tests stay WASM-free.** Recommendation: yes (port + real-WASM in prod & one integration test + live smoke). Confirm you're happy testing the engine against an injected double rather than loading WASM in every unit test.
- **F3 — Defer in-session score *display* (`show_score`/terminal score screen).** Nothing to display until F1's scorer host exists. Recommendation: defer; WV-D does branching plumbing only. Confirm.
- **F4 — Progress bar under branching.** The total step count is answer-dependent once branches exist. Recommendation: show a step **counter** (`Question N`) without a misleading fixed total/percentage when the runtime has branch/skip rules; keep the WV-A bar+total for purely-linear runtimes. Confirm (alt: estimate a total from the longest path — rejected as misleading).
- **F5 — Piping in v1?** It's the least-used action and the only one that mutates rendered text via a `field_path`. Recommendation: include it (it's in the manifest contract + the canonical example), with the documented unresolved-path no-op. Confirm, or defer piping to keep WV-D tighter (manifest would then omit `"piping"`).

## 11 — Out of scope / follow-ups
- External Scorer execution + in-session score display (OD-16 Scorer track).
- `randomize` (Page/Section) — needs a seeded RNG decision (determinism); deferred.
- Reusing the engine in the Editor preview (OD-03) — when the Editor is built.
- A reusable compiled-`Program` WASM handle if profiling shows per-evaluation recompilation matters (WV-C follow-up).
