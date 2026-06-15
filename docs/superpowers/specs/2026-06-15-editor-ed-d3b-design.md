# Editor ED-D3b (Cross-Question Validation) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D3b brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders), slice **D3** (validation), sub-slice **D3b**. **D3b COMPLETES ED-D3.** D3a delivered per-question validation (`Option.validation`) + live per-question preview errors; **D3b** adds the cross-question validation panel (`Questionnaire.validation[]`) + live cross-question preview errors.
**Builds on:** ED-D2a (the `LogicPanel`/`RuleEditor`/`ruleOps`/`updateLogic` pattern + `collectLogicTargets`, `RuleIssue`), ED-D3a (`logic/validation.ts` `perQuestion`/`collectPerQuestionErrors`; `PreviewPane` feeding `StepRenderer` `requiredErrors`/`errorMessages`), ED-D1 (`ExpressionInput`, `useEvaluator`, `collectIdCatalogue`). Memories `project_editor_ed_d2a`, `project_editor_ed_d3a`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · Immer · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §5: "Cross-question validation rules are configured in a dedicated panel with the same expression language as logic conditions."
- Schema 2 `v26.0602` (`schemas/questionnaire/schema.json`): `CrossQuestionValidationRule` = `{ id: string(^[a-z][a-z0-9_]+$), condition: Expression, message: string(≤256), targets?: string[] }`, required `[id, condition, message]`, `additionalProperties:false`. Lives on `Questionnaire.validation[]` (0..N). **`id` is REQUIRED** (unlike `LogicRule.id`).
- Viewer port target — `web-viewer/src/logic/validation.ts` cross-question loop: `for (const cv of programs.crossValidation) { if (ev.condition(cv.condition, bindings)) for (const t of cv.targets) errors.push({key: t, message: cv.message}) }`.
- Editor (mirror/extend): `editor/src/logic/{LogicPanel,RuleEditor,ruleOps,targets}.{ts,tsx}` (D2a), `editor/src/logic/validation.ts` (D3a — `ValidationError`, `collectPerQuestionErrors`), `editor/src/model/tree.ts` (`updateLogic`), `editor/src/preview/PreviewPane.tsx` (computes `verrors` + feeds the renderer), `editor/src/inspector/Inspector.tsx` (hosts `<LogicPanel/>`).

---

## 1 — Scope (ED-D3b)

### 1.1 In scope

- **Typed model + helper** — `CrossQuestionValidationRule` type (`{id, condition, message, targets?}`) + `validation?: CrossQuestionValidationRule[]` on `Questionnaire` (off the catch-all); `updateValidation(model, rules)` in `tree.ts` (Immer; set, or `delete draft.validation` when empty), mirroring `updateLogic`.
- **`logic/validationRuleOps.ts`** (pure) — `newValidationRule(existing)` (first-free `val_N` id; `condition:''`, `message:''`, `targets:[]`); `summarizeValidationRule(rule)`; `validateValidationRule(rule, targets, allRules)` → `{errors: RuleIssue[]}` (reuse D2a `RuleIssue`): id empty/bad-pattern=error, duplicate=warning; condition empty=error; message empty=error; unknown target=warning; empty targets=warning.
- **`logic/ValidationRuleEditor.tsx`** — id input (aria "Rule id") + condition `ExpressionInput` + message input (aria "Error message") + a targets multi-select (`TargetMultiSelect`: a checkbox per `targets.elementKeys` ∪ the rule's current targets; toggles `rule.targets`) + inline issues.
- **`logic/ValidationPanel.tsx`** — mirror `LogicPanel`: list + `summarizeValidationRule` + "+ Add rule" (`newValidationRule`, auto-open) + delete + "N need attention"; writes via `applyEdit(updateValidation(...))`. Mounted in the Inspector `kind === 'questionnaire'` branch, after `<LogicPanel/>`.
- **Live cross-question preview** — `collectCrossQuestionErrors(rules, ev, bindings)` in `logic/validation.ts`; `PreviewPane` merges per-question + cross-question errors → `requiredErrors`/`errorMessages`.
- **Completes ED-D3.**
- **Tests:** pure (`updateValidation`, `validationRuleOps`, `collectCrossQuestionErrors`); RTL (`ValidationRuleEditor`, `ValidationPanel`, Inspector mount, `PreviewPane` merged errors); a Playwright smoke + screenshot.

### 1.2 Non-goals (deferred → FOLLOWUPS)

- **Translation** of `message` → ED-E.
- **Blocking "Validate" gate** — preview is live + display-only.
- **Hard id-uniqueness** — duplicate id is a warning, not a blocking error (editor's permissive stance; schema doesn't enforce uniqueness).
- **Score-referencing conditions** — work via the evaluator but scores resolve to `null` in preview until D4 (`score: () => null`, same as the Logic panel).
- **Logic/Validation/Scoring → Inspector tabs** — revisit when D4 lands.
- **Duplicate-key message merge precedence** — if a per-question and a cross-question error target the same key, the cross-question message wins the display (last-written); acceptable.

---

## 2 — Architecture & components

- **`editor/src/model/types.ts`** — add:
  ```ts
  export interface CrossQuestionValidationRule {
    id: string
    condition: string
    message: string
    targets?: string[]
  }
  ```
  add `validation?: CrossQuestionValidationRule[]` to `Questionnaire`.
- **`editor/src/model/tree.ts`** — `updateValidation(model, rules: CrossQuestionValidationRule[])` (Immer; `rules.length === 0` → `delete draft.validation` else `draft.validation = rules`).
- **`editor/src/logic/validationRuleOps.ts`** (pure):
  - `newValidationRule(existing): CrossQuestionValidationRule` — `id = 'val_' + n` where n is the smallest positive int with no existing `val_${n}`; `{ id, condition: '', message: '', targets: [] }`.
  - `summarizeValidationRule(rule)` — `\`${rule.id || '?'}: if ${rule.condition?.trim() || '…'} → ${(rule.targets ?? []).join(', ') || '(no targets)'}\``.
  - `validateValidationRule(rule, targets: LogicTargets, allRules: CrossQuestionValidationRule[]): { errors: RuleIssue[] }` — import `RuleIssue` from `./ruleOps`. id empty→error "id required"; id not `/^[a-z][a-z0-9_]+$/`→error; id appears >1× in `allRules`→warning "duplicate id"; condition empty→error; message empty→error; each `target` not in `targets.elementKeys`→warning; `(targets ?? []).length === 0`→warning "no targets — the error won't display".
- **`editor/src/logic/ValidationRuleEditor.tsx`** — props `{rule, targets, catalogue, evaluator, onChange, onDelete}`. id `<input aria-label="Rule id">`; `ExpressionInput` (condition); message `<input aria-label="Error message">`; `TargetMultiSelect` (inline helper): options = `[...new Set([...targets.elementKeys, ...(rule.targets ?? [])])]`, each a checkbox; toggling adds/removes from `rule.targets`; issues list (red/amber per `RuleIssue.level`).
- **`editor/src/logic/ValidationPanel.tsx`** — reads `model.validation ?? []`; `collectLogicTargets(model)`; `collectIdCatalogue(model, pool)`; `useEvaluator`; attention = rules with an error from `validateValidationRule(r, targets, rules)`; add/edit/delete via `updateValidation`. Same list/summary/expand idiom as `LogicPanel`.
- **`editor/src/inspector/Inspector.tsx`** — `<ValidationPanel />` after `<LogicPanel />` in the questionnaire branch.
- **`editor/src/logic/validation.ts`** — add:
  ```ts
  export function collectCrossQuestionErrors(rules, ev, bindings): ValidationError[]
  ```
  for each rule: `const c = rule.condition; if (typeof c === 'string' && c.length > 0 && ev.check(c) === null && ev.condition(c, bindings)) for (const t of rule.targets ?? []) errors.push({ key: t, message: rule.message })`.
- **`editor/src/preview/PreviewPane.tsx`** — after `verrors`: `const cqErrors = evaluator ? collectCrossQuestionErrors(model.validation ?? [], evaluator, bindings) : []`; `const allErrors = [...verrors, ...cqErrors]`; build `requiredErrorKeys`/`errorMessages` from `allErrors`.

**Dependency direction:** `model/{types,tree}` + `logic/validationRuleOps` (pure) → `ValidationRuleEditor`/`ValidationPanel` → store; `logic/validation.ts` gains pure `collectCrossQuestionErrors`; `PreviewPane` merges. Reuses `ExpressionInput`/`useEvaluator`/`collectIdCatalogue`/`collectLogicTargets`/`RuleIssue`.

## 3 — Data flow + semantics

**Authoring:** "+ Add rule" → `newValidationRule(rules)` → `updateValidation`; edits replace-by-index; delete by index. `targets: []` rules are kept (flagged by the empty-targets warning, not dropped). Round-trips Schema-2-valid.

**Validation (`validateValidationRule`, non-blocking):** id required+pattern (errors) + duplicate (warning); condition required (error; parse errors via `ExpressionInput`); message required (error); unknown target (warning); empty targets (warning). List-level "N need attention" counts error-level rules.

**Preview (live, merged):** `verrors` (per-question, D3a) + `cqErrors` (cross-question) → `allErrors` → `requiredErrors`/`errorMessages` on `StepRenderer`. Re-evaluated on each answer change. `bindings` = throwaway answers + `score: () => null`.

**Error-safety:** malformed cross-question condition (`ev.check !== null`) → rule skipped (no throw); targets not currently rendered → not displayed (harmless); `targets: []` → nothing pushed; duplicate-key (per-question + cross-question on same key) → cross-question message wins display (last-written).

## 4 — Test plan

- `updateValidation` — set/replace/clear-on-empty/immutable/Schema-2-valid.
- `validationRuleOps` — `newValidationRule` first-free `val_N` (given `[val_1,val_3]`→`val_2`); `summarizeValidationRule` incl. "(no targets)"; `validateValidationRule` id empty/bad/duplicate, condition empty, message empty, unknown target, empty targets, valid→none.
- `collectCrossQuestionErrors` — condition true→one error per target; false→none; malformed→skip; `[]` targets→none; multi-target→one each.
- `ValidationRuleEditor` (RTL) — id/condition/message inputs + a checkbox per element key; toggling a target updates `rule.targets`; out-of-catalogue target stays checked; edits emit; issues show.
- `ValidationPanel` (RTL) — list summaries; add appends auto-id rule; delete by index; attention count; Inspector mount present at root / absent for a page selection.
- `PreviewPane` (RTL) — cross-question rule shows its message on the target when condition holds, clears otherwise; merges with a per-question error; malformed → no crash.
- Playwright — author a cross-question rule, trip it by answering in the preview, screenshot the error on the target.

## 5 — Success criteria

1. `validation[]` typed + edited via `updateValidation`; round-trips Schema-2-valid.
2. Validation panel (root Inspector, below Logic) does CRUD — auto-`val_N` id (editable), condition `ExpressionInput`, message, targets multi-select — with per-field validation (errors + dup/unknown/empty-targets warnings).
3. Preview shows cross-question errors live on targets, merged with per-question (D3a).
4. `collectCrossQuestionErrors` faithfully mirrors the viewer (valid+true → message per target; malformed → skip).
5. All suites green; a screenshot delivered showing a cross-question validation error.
6. **ED-D3 COMPLETE** (per-question + cross-question authored + displayed live).
