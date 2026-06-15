# Editor ED-D1 (Expression Foundation + Visibility) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D1 brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders). ED-D is sliced **D1..D4**. **D1** (this spec) is the **first slice**: the shared expression-authoring substrate + per-element `show_if` visibility, including making the inline preview actually evaluate visibility.
**Builds on:** ED-A..ED-C (the 3-pane shell, the entity pool, the inline WYSIWYG preview, the canonical Schema-2 model + `updateNodeProps`/`unsetNodeProp`). Reuses the **OD-11 WASM expression evaluator** (`questionnaire-expression-evaluator/web`) the Web Viewer already embeds (WV-D), and faithfully ports the viewer's tiny visibility helpers.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §4 (Logic builder): "a structured editor for the logic types… The builder offers a drop-down / form-based UI for common rules; advanced users can drop into the canonical expression language directly. A live evaluator — the **same WASM module** embedded by the Web Viewer (per OD-11) — validates that conditions reference real question IDs, produce valid types, and evaluate consistently with what the deployed viewer will compute at run time."
- [design/15_expression_language.md](../../../design/15_expression_language.md) — normative grammar, value lattice, built-in functions, error model. Truthiness for rules is strict: only `Bool(true)` → true; everything else (incl. Null / parse-failure) → false.
- Schema 2 `v26.0602` (`schemas/questionnaire/versions/v26.0602/schema.json`): `Expression` = string (minLength 1, maxLength 1024); `show_if` appears on Page (509), Section (540, 564), Block (635), PageElementSavedItem (590), PageElementInlineItem (602), ItemElement.
- Evaluator host API (`questionnaire-expression-evaluator/web/src/lib.rs`): `check_expression(expr) → string|null` (null = valid), `evaluate_condition(expr, bindings) → bool`, `reversed`, `compare`. `JsBindings = { var(id): unknown; score(id): unknown }`.
- Web Viewer logic layer (faithfully mirrored, NOT cross-imported): `web-viewer/src/logic/{types,bindings,compile,visibility}.ts` — `LogicEvaluator`, `makeBindings`, `collectPrograms`, `isElementVisible`.
- Editor model/store: `editor/src/model/tree.ts` (`updateNodeProps`, `unsetNodeProp`), `editor/src/state/store.ts` (`applyEdit`). Preview: `editor/src/preview/{project,PreviewPane}.tsx` — `PreviewPane` owns `answers` state (`useState`, line 24) + `onAnswer` (line 61) and hands `flattenPage(page)` to the presentational `StepRenderer`.

---

## 1 — Scope (ED-D1)

### 1.1 In scope

- **Embed the evaluator in the editor.** Reuse the OD-11 WASM module (`questionnaire-expression-evaluator/web` build) via a **static-string dynamic import** so Vite bundles the `.wasm` (the WV-D gotcha). Thin wrapper `editor/src/logic/evaluator.ts`: `loadEvaluator(): Promise<LogicEvaluator>` exposing `check(expr): string|null` (syntax) and `condition(expr, bindings): boolean` (evaluation). Interface mirrors the viewer's `LogicEvaluator` so the preview hands it straight to the visibility helpers.
- **Reusable `ExpressionInput` component** (`editor/src/logic/ExpressionInput.tsx`): a controlled textarea bound to `check` for **live syntax validation** (debounced; ✓ valid / ✗ `‹offset›: ‹message›`) plus **reference checking** (⚠ unknown ids, non-blocking) and an **"insert condition" helper** popover (`[question ▾][op ▾][value]` → appends a well-formed `id op value` snippet). Reused verbatim by D2/D3.
- **Id catalogue** (`editor/src/logic/ids.ts`, pure): `collectIdCatalogue(model, pool) → { questionIds, scoreIds }` — answerable question ids + declared `scores[].id` — powering autocomplete + reference-checking. **Reference checking** (`editor/src/logic/refcheck.ts`, pure): `unknownRefs(expr, catalogue) → string[]` (lexer-lite; ignores string-literal contents, built-in fn names `length`/`count`/`contains`/`is_empty`/`not_empty`/`score`, numbers/bools/null).
- **`show_if` authoring** (`editor/src/canvas/ShowIfEditor.tsx`): a "Visible when…" section for the selected element (item / section / page / block) — an `ExpressionInput` bound to that node's `show_if`, with **Set** (`applyEdit(updateNodeProps(path, {show_if}))`) / **Clear** (`unsetNodeProp(path, 'show_if')`). Round-trips Schema-2-valid; malformed string saves and surfaces in the validation banner (authors save WIP expressions).
- **Preview evaluates visibility.** Port the viewer's visibility helpers into `editor/src/logic/visibility.ts` (~30 lines: `collectShowIf(runtime)`, `isVisible(key, showIf, ev, bindings)`, `makeBindings(answers, scoreResolver)`). In `PreviewPane`, filter `flattenPage(page)` by `isVisible(...)` against the editor's existing `answers` state → **elements hide/show live** as throwaway answers change. Partially closes ED-B FOLLOWUP (i) (visibility only). `score` resolver is `() => null` in D1 (scores arrive in D4).

### 1.2 Non-goals (deferred)

- **Logic rules** — skip / branch / piping / randomization + the `logic[]` panel → **ED-D2**.
- **Validation** — per-question (`Option.validation`) + cross-question (`Questionnaire.validation[]`) → **ED-D3**.
- **Scoring** — `scores[]` Scorer-picker + path-selector + live score preview + score bindings in `makeBindings` → **ED-D4**.
- **Richer form-builder** beyond the single-row "insert condition" helper (nested AND/OR rows, value pickers driven by option sets) — possible later refinement; the helper just emits expression strings, so no rework.
- **Piping / templating in prompt text** — not in Schema 2 yet; out of scope.
- **Translation** of any text (validation messages etc.) → **ED-E**.

---

## 2 — Architecture & components

All new files under `editor/src/`:

- **`logic/evaluator.ts`** — `loadEvaluator()` (static-string dynamic import of the evaluator web build; bundles the wasm). Returns a `LogicEvaluator` (`check`, `condition`). Singleton-cached promise so multiple consumers share one instance.
- **`logic/ids.ts`** (pure) — `collectIdCatalogue(model, pool): { questionIds: string[]; scoreIds: string[] }`. Walks questionnaire + resolved pool entities; gathers answerable question ids (variables a condition can reference) + `scores[].id`; dedupes.
- **`logic/refcheck.ts`** (pure) — `unknownRefs(expr, catalogue): string[]`. Lexer-lite identifier extraction; ignores string literals, built-in fn names, literals; returns ids absent from the catalogue. Warning-grade (ids may precede their question).
- **`logic/visibility.ts`** (pure, faithful port of `web-viewer/src/logic/{compile,visibility,bindings}.ts`) — `collectShowIf(runtime)`, `makeBindings(answers, scoreResolver)`, `isVisible(key, showIf, ev, bindings)`. **Visible-on-malformed** (a `show_if` that fails to parse/evaluate → element shown, mirroring the viewer's warn-and-skip — a typo must not silently vanish content).
- **`logic/ExpressionInput.tsx`** — controlled textarea + debounced status line (✓ / ✗ offset:message / ⚠ unknown refs) + "insert condition" popover. Props: `value`, `onChange`, `catalogue`, `evaluator`.
- **`canvas/ShowIfEditor.tsx`** — "Visible when…" block for the selected element; Set/Clear wired to `applyEdit`/`unsetNodeProp`.
- **`preview/PreviewPane.tsx`** (changed) — load the evaluator in an effect; build `showIf` from the projected runtime; filter `flattenPage(page)` by `isVisible` using `makeBindings(answers, { score: () => null })`. **Until the evaluator resolves (or if it fails to load), everything is visible** (graceful no-op).

**Dependency direction:** `logic/*` (pure helpers + evaluator) → components → store via `applyEdit`. **No new store slice** — `show_if` is a node prop; the id-catalogue is derived on render, not stored.

**Build-time verification (logged, not blocking):** confirm the evaluator web build's exact import specifier and that the editor's Vite config bundles its `.wasm` (the WV-D static-string-dynamic-import gotcha).

---

## 3 — Preview-evaluation data flow

1. `PreviewPane` loads `loadEvaluator()` once (effect) → holds a `LogicEvaluator | null`.
2. On each render it projects the model → `runtime`, then `collectShowIf(runtime)` → `Map<key, expr>`.
3. It builds `bindings = makeBindings(answers, { score: () => null })` from its existing throwaway `answers` state.
4. `flattenPage(page).filter(el => evaluator ? isVisible(el.key, showIf, evaluator, bindings) : true)` → handed to `StepRenderer`.
5. Answering a question calls `onAnswer` → `setAnswers` → re-render → re-filter → **elements appear/disappear live**.
6. The original model is untouched; this is preview-only evaluation against throwaway answers.

---

## 4 — Error handling

- **Parse error** (`check` → message): inline red `‹offset›: ‹message›` under the `ExpressionInput`; the model **still saves** the string (authors save WIP). The questionnaire validation banner flags malformed expressions; the viewer treats a non-bool result as false.
- **Unknown ref** (`unknownRefs` non-empty): amber ⚠ warning, **non-blocking** (an id may legitimately precede its question's creation).
- **Malformed `show_if` at preview time**: logged + treated as **visible** (false-safe to *shown*), mirroring the viewer's `collectPrograms` warn-and-skip.
- **Evaluator fails to load**: preview shows everything; no crash; logged once.

---

## 5 — Test plan

vitest + RTL, plus one Playwright smoke (the editor's established mix):

- `logic/ids.ts` — gathers question + score ids from model + pool; ignores non-answerable nodes; dedupes.
- `logic/refcheck.ts` — flags genuine unknowns; ignores string-literal contents, built-in fn names, literals; empty expr → none.
- `logic/visibility.ts` — `collectShowIf` maps keys→exprs; `isVisible` true when no `show_if`, evaluates true/false via a stub evaluator, **visible-on-malformed**.
- `logic/evaluator.ts` — `check` valid→null / invalid→message; `condition` true/false against the real wasm if it loads in jsdom, else a guarded skip (WV-D approach).
- `ExpressionInput.tsx` (RTL) — valid→✓; invalid→offset/message; unknown id→⚠; insert-condition appends a well-formed `id op value`; debounced check.
- `ShowIfEditor.tsx` (RTL) — Set writes `show_if` via `updateNodeProps`; Clear removes via `unsetNodeProp`; round-trips Schema-2-valid.
- `PreviewPane` (RTL) — element with `show_if: "q == 'yes'"` hidden when `answers.q != 'yes'`, appears after `onAnswer('q','yes')`; visible before the evaluator loads.
- Playwright smoke — author a `show_if`, answer the controlling question in the preview, screenshot the element appearing (the deliverable screenshot).

---

## 6 — Success criteria

ED-D1 is done when:

1. The WASM evaluator is embedded in the editor and bundles cleanly (`npm run build`; no bare `tsc`).
2. `ExpressionInput` gives live syntax validation + unknown-ref warnings + an insert-condition helper, driven by the question/score id catalogue.
3. An author can set/clear a `show_if` on any element (item / section / page / block); it round-trips Schema-2-valid and surfaces in the validation banner if malformed.
4. **The inline preview actually hides/shows elements live** as throwaway answers change — partially closing ED-B FOLLOWUP (i) for visibility.
5. All suites green; a screenshot delivered showing conditional visibility working.

This is the first slice of **ED-D**; D2 (logic rules), D3 (validation), D4 (scoring) follow, each reusing this expression substrate and extending the preview evaluation.
