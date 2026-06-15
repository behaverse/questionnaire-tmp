# Editor ED-D2a (Navigation & Visibility Logic Rules) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D2a brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders). ED-D is sliced **D1..D4**; **D2** (logic rules) is itself sliced **D2a / D2b**. **D2a** (this spec) = the questionnaire-global Logic Rules panel + **skip / branch / visibility** authoring + live visibility-rule execution in the preview. **D2b** (next) = piping + randomization.
**Builds on:** ED-D1 (`editor/src/logic/`: `evaluator.ts`, `useEvaluator.ts`, `ExpressionInput.tsx`, `ids.ts` `collectIdCatalogue`, `visibility.ts` `makeBindings`/`isElementShown`/`filterPageVisible`, the preview's live `show_if` evaluation). Memories `project_editor_ed_d1`, `project_od19_events_vocabulary` (not relevant), `project_expression_evaluator_wv_c` (OD-11).
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §4 (Logic builder): skip, visibility, piping, branching, randomization; "drop-down / form-based UI for common rules; advanced users can drop into the canonical expression language directly. A live evaluator — the same WASM module embedded by the Web Viewer (OD-11) — validates that conditions reference real question IDs…".
- Schema 2 `v26.0602` (`schemas/questionnaire/versions/v26.0602/schema.json`): `LogicRule` (lines 714–734) = `{ id?: string (^[a-z][a-z0-9_]+$), type: enum[skip,visibility,piping,branch], condition: Expression (required), action: object (required) }`. `action` properties: `skip_to`, `show`, `target_id`, `field_path`, `source` — **`additionalProperties: false`, but NO per-type if/then/oneOf** (a loose bag; semantic validity is the editor's job). `Questionnaire.logic[]` (line 27) is the only place LogicRules live; unbounded.
- Per-type action shapes (confirmed from `web-viewer/src/logic/*` tests): **skip/branch** → `action.skip_to` = target page id (forward-only; branch's false path falls through to next). **visibility** → `action.target_id` = element key + `action.show` = boolean. **piping** → `action.field_path` + `action.source` (D2b).
- Web-viewer execution (mirror targets): `web-viewer/src/logic/navigation.ts` `nextStepIndex(...)` (skip/branch at page-submit), `web-viewer/src/logic/visibility.ts` `isElementVisible(key, programs, ev, bindings)` (rule → show_if → default, at render), `compile.ts` `collectPrograms` (warn-and-drop malformed).
- Editor: `editor/src/model/types.ts` (`Questionnaire` has `[k:string]: unknown` catch-all; `logic` untyped), `editor/src/model/tree.ts` (`updateMetadata` pattern, Immer), `editor/src/state/store.ts` (`applyEdit`), `editor/src/inspector/Inspector.tsx` (`kind === 'questionnaire'` branch edits root metadata — the panel's home).

---

## 1 — Scope (ED-D2a)

### 1.1 In scope

- **Typed model + helper.** Add a typed `LogicRule` interface and surface `logic?: LogicRule[]` on `Questionnaire` (no schema bump — typing what the schema already allows). Add `updateLogic(model, rules)` to `tree.ts` (Immer; sets/clears `model.logic`), mirroring `updateMetadata`.
- **Logic target catalogue** — `editor/src/logic/targets.ts` (pure): `collectLogicTargets(model)` → `{ pageIds: string[]; elementKeys: string[] }`. `pageIds` for skip/branch `skip_to`; `elementKeys` (page/section/item ids the renderer keys on) for visibility `target_id`. Distinct from D1's `collectIdCatalogue` (that gathers *condition variable* ids).
- **Rule ops** — `editor/src/logic/ruleOps.ts` (pure): `newRule(type)` (valid skeleton per type), `summarizeRule(rule)` (one-line list summary), `validateRule(rule, targets)` → `{ errors: RuleIssue[] }` enforcing per-type semantics (the loose schema doesn't). `RuleIssue = { field, message, level: 'error'|'warning' }`.
- **`RuleEditor.tsx`** — per-rule form: type select; `ExpressionInput` for `condition`; type-specific action fields (skip/branch → `skip_to` page dropdown; visibility → `target_id` element dropdown + show/hide toggle); inline issues from `validateRule`. Switching `type` resets `action` to `newRule(type).action` but **preserves `condition`**.
- **`LogicPanel.tsx`** — list of rules (summary + edit/delete) + "+ Add rule"; writes the whole `logic[]` back via `applyEdit(updateLogic(...))`; shows "N rules need attention" from `validateRule`. Mounted in the Inspector `kind === 'questionnaire'` branch, below metadata.
- **Preview executes visibility rules.** Extend `editor/src/logic/visibility.ts` so element visibility follows the viewer precedence: **(1)** a `type:visibility` rule matching `target_id` whose condition holds → its `show`; **(2)** else the element's `show_if`; **(3)** else visible. `PreviewPane` passes the model's `logic[]` (visibility rules) into the filter; it already has the evaluator + bindings from D1. Malformed rule conditions are dropped (logged) → element falls through to `show_if`/visible.
- **Skip/branch = author + validate only.** No navigation runtime in the preview; the panel labels these "navigation — runs in the deployed viewer".
- **Tests:** pure (`updateLogic`, `collectLogicTargets`, `newRule`/`summarizeRule`/`validateRule`); RTL (`RuleEditor`, `LogicPanel`, Inspector mount, preview visibility-rule execution); a Playwright smoke + screenshot (visibility rule hides/shows an element, real prompts via the D1 stubbed-endpoint bundle pattern).

### 1.2 Non-goals (deferred)

- **Piping** (authoring + `field_path` picker + same-page piping preview) → **ED-D2b**.
- **Randomization** checkboxes (`Page/Section/Block.randomize`, `flow.randomize_pages`) → **ED-D2b**. (Option-order randomization is NOT in Schema 2 v26.0602 — out of scope entirely.)
- **Skip/branch navigation execution in preview** — the preview has no page-to-page runtime; author + validate only.
- **Nested AND/OR rule-builder** beyond the `ExpressionInput` escape hatch (expression-first philosophy).
- **Backward skips** (the viewer ignores non-forward `skip_to`).
- **Tabs consolidation** of the questionnaire-global panels (Logic/Validation/Scoring) — revisit when D3/D4 add their panels.

---

## 2 — Architecture & components

All under `editor/src/` unless noted.

- **`model/types.ts`** — add:
  ```ts
  export interface LogicRule {
    id?: string
    type: 'skip' | 'visibility' | 'piping' | 'branch'
    condition: string
    action: Record<string, unknown>
  }
  ```
  and add `logic?: LogicRule[]` to `Questionnaire` (keep the `[k: string]: unknown` catch-all).
- **`model/tree.ts`** — `updateLogic(model, rules: LogicRule[]): Questionnaire` (Immer `produce`; `draft.logic = rules`; if `rules.length === 0` delete `draft.logic`).
- **`logic/targets.ts`** (pure) — `collectLogicTargets(model): { pageIds: string[]; elementKeys: string[] }`. Walks `pages` (ids), each page's `elements` (item/section keys), section children; `blocks` page-membership doesn't add element keys. Dedupes.
- **`logic/ruleOps.ts`** (pure):
  - `newRule(type): LogicRule` — `skip`/`branch` → `{type, condition:'', action:{skip_to:''}}`; `visibility` → `{type, condition:'', action:{target_id:'', show:false}}`; `piping` → `{type, condition:'', action:{source:'', field_path:''}}` (skeleton only; piping editing is D2b).
  - `summarizeRule(rule): string` — e.g. `skip → page_3 if q_a == 9`, `show it_x if …` / `hide it_x if …`.
  - `validateRule(rule, targets): { errors: RuleIssue[] }` — see §4 semantics.
- **`logic/RuleEditor.tsx`** — props `{ rule, targets, catalogue, evaluator, onChange(rule), onDelete() }`. Type `<select>`; `ExpressionInput` (condition); type-specific fields; inline `RuleIssue` list. On type change: `onChange({ ...newRule(nextType), condition: rule.condition, id: rule.id })`.
- **`logic/LogicPanel.tsx`** — reads `model.logic ?? []`; renders summaries + edit (expand `RuleEditor` inline) + delete; "+ Add rule" (default `newRule('skip')`); writes via `applyEdit((m) => updateLogic(m, nextRules))`; "N rules need attention" badge.
- **`inspector/Inspector.tsx`** — render `<LogicPanel />` at the end of the `kind === 'questionnaire'` branch.
- **`logic/visibility.ts`** — add `isElementShownWithRules(el, rules, ev, bindings)` (or extend `isElementShown`): visibility-rule precedence then `show_if`. `filterPageVisible(page, rules, ev, bindings)` gains the `rules` param. Keep the existing 2-arg behaviour working (default `rules = []`) so D1 tests/preview stay green, or thread `rules` through everywhere it's called.
- **`preview/PreviewPane.tsx`** — pass `model.logic ?? []` (filtered to `type:visibility`) into `filterPageVisible`.

**Dependency direction:** `model/{types,tree}` + `logic/{targets,ruleOps}` (pure) → `RuleEditor`/`LogicPanel` → store via `applyEdit`. Reuses D1's `ExpressionInput`, `useEvaluator`, `collectIdCatalogue`, `makeBindings`, `filterPageVisible`.

## 3 — Rule data flow

1. **Add** → `newRule('skip')` appended via `updateLogic`; the new rule opens in `RuleEditor`.
2. **Edit** → `RuleEditor` emits the full edited rule; `LogicPanel` replaces it by index and writes via `updateLogic`. Type change preserves `condition`+`id`, resets `action`.
3. **Delete** → removed by index, written back.
4. **Validate** → Ajv (whole questionnaire) on every edit (loose on `action`), plus inline `validateRule` (semantic). Both non-blocking; rules save as WIP.
5. **Preview** → `PreviewPane` filters page elements: a matching valid `type:visibility` rule wins (`show`), else `show_if`, else visible. Skip/branch/piping rules are ignored by the preview.

## 4 — Validation / error semantics (`validateRule`)

Non-blocking, mirrors D1's "save WIP, flag it". `RuleIssue.level`:
- **condition** empty → error "condition required". (Parse errors are surfaced by `ExpressionInput`'s own status line; `validateRule` does not re-run `check`.)
- **skip / branch:** `action.skip_to` empty → error "choose a target page"; non-empty but not in `targets.pageIds` → warning "unknown page id" (may be added later).
- **visibility:** `action.target_id` empty → error "choose a target element"; non-empty but not in `targets.elementKeys` → warning "unknown element"; `action.show` not boolean → error (the toggle prevents this; guards imports).
- **piping** (skeleton only in D2a): if a piping rule exists, `validateRule` flags "piping editing arrives in D2b" (info/warning) — D2a doesn't author piping but must not crash on one.
- **List-level:** `LogicPanel` counts rules with ≥1 error → "N rules need attention".

**Dropdowns** are populated from `collectLogicTargets` but always include the rule's current raw value (even if out-of-catalogue) so imported/renamed targets show with a ⚠ rather than snapping to blank.

**Preview error-safety:** a visibility rule whose condition fails `evaluator.check` is dropped from preview evaluation (logged) → the targeted element falls through to `show_if`/visible. Matches the viewer + D1's visible-on-malformed stance.

## 5 — Test plan

vitest + RTL + one Playwright smoke:

- **`updateLogic`** — set/replace-by-index/clear-to-absent/immutable/Schema-2-valid round-trip.
- **`collectLogicTargets`** — page ids + element/section keys; dedupe; ignores non-targets.
- **`ruleOps`** — `newRule` skeletons per type; `summarizeRule` per type; `validateRule` (condition-required; skip/branch skip_to required + unknown-page warning; visibility target_id required + unknown-element warning + boolean show; valid rule → no errors).
- **`RuleEditor`** (RTL) — type-specific fields; type switch resets action + keeps condition; edits emit updated rule; inline issues; dropdown includes out-of-catalogue current value.
- **`LogicPanel`** (RTL) — list summaries; add appends skeleton; delete by index; attention count.
- **Inspector** (RTL) — LogicPanel in questionnaire-root branch; absent for page/item selections.
- **Preview** (RTL) — visibility rule hides element when condition holds, shows otherwise; rule precedence over `show_if`; malformed rule → visible.
- **Playwright** — author a visibility rule, toggle the controlling answer in the preview, screenshot the element hiding/showing (real prompts via the D1 stubbed-`/v1/entities/` bundle pattern).

## 6 — Success criteria

ED-D2a is done when:
1. `logic[]` is typed + edited via `updateLogic`; round-trips Schema-2-valid.
2. The Logic panel (questionnaire-root Inspector) does full CRUD on **skip / branch / visibility** rules — condition via `ExpressionInput` + type-specific target dropdowns + per-type semantic validation (errors + unknown-target warnings).
3. The preview executes **visibility rules** live (rule → `show_if` → default precedence), layered on D1.
4. Skip/branch are authored + validated (labelled "runs in the deployed viewer"; not executed in preview).
5. All suites green; a screenshot delivered showing a visibility rule hiding/showing an element.

This is the first slice of ED-D2; **D2b** (piping + randomization) follows, reusing this panel + the rule-ops + target catalogue.
