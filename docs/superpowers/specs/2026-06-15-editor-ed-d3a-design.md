# Editor ED-D3a (Per-Question Validation) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D3a brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders), slice **D3** (validation), sub-slice **D3a**. ED-D3 is split **D3a / D3b**: **D3a** (this spec) = per-question validation (`Option.validation`) authoring + live per-question preview errors; **D3b** = cross-question validation (`Questionnaire.validation[]`) panel + preview.
**Builds on:** ED-C1 (Option editor + `option/ops.ts` canonical-preserving helpers), ED-D1 (`PreviewPane` live answers + evaluator), ED-D2a/b (`PreviewPane` pipe-then-filter producing `visiblePages`; `logic/visibility.ts`, `logic/piping.ts` ports). Memories `project_editor_ed_c1`, `project_editor_ed_d1`, `project_editor_ed_d2b`.
**Stack:** Vite · React 19 · TS · Tailwind · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §5: "Per-question validation (required, format, range, length) is configurable in the question's property panel. … Validation messages are translatable text fields."
- Schema 2 `v26.0602` (`schemas/questionnaire/versions/v26.0602/schema.json`): `PerQuestionValidation` (lines 937-964) = `{ format?: string; range?: [number|null, number|null]; length?: [integer|null, integer|null]; format_message?: string(≤256); range_message?: string(≤256); length_message?: string(≤256) }`, `additionalProperties:false`. Lives on `OptionBase.validation` (optional). **`OptionBase` ALSO has a separate `input_validation` field** (`RegExRef | string`, ED-C1 edits it) — distinct from `validation.format`; the viewer validates `validation`, not `input_validation`.
- Viewer port target — `web-viewer/src/logic/validation.ts` `perQuestion(key, v, value)`: returns `{key, message}|null`; **skips empty** (null/undefined/''); numeric `range` strict `<lo`/`>hi` (null=open) → `range_message ?? 'Value out of range.'`; string `length` → `length_message ?? 'Invalid length.'`; string `format` unanchored `new RegExp(fmt).test(value)`, **invalid regex → pass** → `format_message ?? 'Invalid format.'`.
- Renderer error contract — `web-viewer/dist-lib/StepRenderer.d.ts`: `requiredErrors: string[]` (element keys to flag) + `errorMessages?: Record<string, string>` (key→message). `ItemRenderer` shows the message for keys present in `errorMessages`. Section children keyed `${parentKey}__r${j}` (per `validateStep`).
- Editor: `editor/src/option/{ops.ts,OptionEditor.tsx}` (type-gated UI, `input_data_type ∈ {choice,number,text}`); `editor/src/preview/PreviewPane.tsx` (passes `requiredErrors={[]}` today; has `answers`, `visiblePages`, `flattenPage`); `editor/src/preview/flatten.ts` (imports `elementKey`, `pageElementFallback` from the renderer lib).

---

## 1 — Scope (ED-D3a)

### 1.1 In scope

- **Option `validation` model + ops.** Add `validation?: PerQuestionValidation` to `EditableOption` (local type mirroring the schema). `setValidation(opt, patch: Partial<PerQuestionValidation>)` in `option/ops.ts`: canonical-preserving — merge `patch` into `opt.validation`, drop keys whose value is `undefined`/empty, **delete the whole `validation` object when empty**. Extend the existing `setInputDataType` type-switch deletes to clear `validation` when switching to `choice`.
- **Option editor "Validation" section** (type-gated, mirrors the min/max gating):
  - `number` → `range` `[min,max]` (each numeric input clearable → `null`) + `range_message`.
  - `text` → `length` `[min,max]` + `length_message`, and `format` (regex) + `format_message`.
  - `choice` → none.
  - Relabel the existing ED-C1 `input_validation` field "Validation regex" → "Input mask (RegEx)" + a one-line hint distinguishing it from format-validation.
- **Live per-question preview errors.** Port `perQuestion` into `editor/src/logic/validation.ts` + add `collectPerQuestionErrors(pages, answers): ValidationError[]` (walk `visiblePages`, key by the renderer's `elementKey`; section children `${parentKey}__r${j}`). `PreviewPane` maps the result to `requiredErrors` (keys) + `errorMessages` (key→message) on `StepRenderer` (replacing the hardcoded `[]`). Recomputed each render → live.
- **Tests:** pure (`setValidation`, `perQuestion`, `collectPerQuestionErrors`); RTL (`OptionEditor` type-gated section, `PreviewPane` live error display); a Playwright smoke + screenshot (range error on a number item).

### 1.2 Non-goals (deferred → D3b / FOLLOWUPS)

- **Cross-question validation** (`Questionnaire.validation[]`) + its panel + preview → **ED-D3b** (this spec's `collectPerQuestionErrors` is extended there with cross-question rules).
- **`required`** flag — already shipped (ED-C4 page-element checkbox).
- **Reconciling `input_validation` vs `validation.format`** (two regex fields in the schema) — a schema/domain question for the owner, not the editor's to resolve → FOLLOWUP.
- **Inline validator-linting** (min>max, broken-regex hint) → FOLLOWUP.
- **Translation** of `*_message` → ED-E.
- **Blocking "Validate" gate/button** — the editor preview validates live + display-only, not as a submit gate.

---

## 2 — Architecture & components

- **`editor/src/option/ops.ts`** — add:
  ```ts
  export interface PerQuestionValidation {
    format?: string
    range?: [number | null, number | null]
    length?: [number | null, number | null]
    format_message?: string
    range_message?: string
    length_message?: string
  }
  ```
  add `validation?: PerQuestionValidation` to `EditableOption`. `setValidation(opt, patch)`: clone; `const v = { ...opt.validation, ...patch }`; delete keys that are `undefined`; for `range`/`length` if the tuple is `[null,null]` delete it; if `v` has no keys, `delete next.validation` else `next.validation = v`. Extend `setInputDataType('choice')` branch to `delete next.validation`.
- **`editor/src/option/OptionEditor.tsx`** — a "Validation" sub-section after the existing type-specific block:
  - number: "Min value"/"Max value" numeric inputs → `setValidation(option, { range: [min, max] })` (empty input → that side `null`; both empty → `setValidation(option, { range: undefined })`); "Range message" text → `{ range_message }`.
  - text: "Min length"/"Max length" → `{ length: [...] }`; "Length message"; "Format (regex)" → `{ format }`; "Format message".
  - choice: none.
  - Relabel the `input_validation` control + add the hint.
- **`editor/src/logic/validation.ts`** (new, pure):
  - `ValidationError = { key: string; message: string }`.
  - `perQuestion(key, validation, value): ValidationError | null` — faithful port (see §3).
  - `collectPerQuestionErrors(pages: RuntimePage[], answers: Record<string, AnswerValue>): ValidationError[]` — walk pages; for each top-level item with `option.validation`, `perQuestion(elementKey(el, pageElementFallback(page.id,i)), validation, answers[key])`; for section children use `${parentKey}__r${j}` (replicate the viewer's keying; if `sectionChildFallback` is exported from the renderer use it, else the `__r` formula). Push non-null results.
- **`editor/src/preview/PreviewPane.tsx`** — after `visiblePages`: `const verrors = collectPerQuestionErrors(visiblePages, answers)`, `const errorMessages = Object.fromEntries(verrors.map(e => [e.key, e.message]))`; on `StepRenderer` set `requiredErrors={verrors.map(e => e.key)}` + `errorMessages={errorMessages}`.

**Dependency direction:** `option/ops` (pure) → `OptionEditor`; `logic/validation` (pure) → `PreviewPane`. Reuses the renderer key helpers + the existing `answers` state. No store changes (validation rides the option, edited via the existing ItemEditor `updateNodeProps` path).

## 3 — Data flow + `perQuestion` semantics

**Authoring:** Option editor control → `setValidation(option, patch)` → `onChange` → ItemEditor writes `option` via `applyEdit(updateNodeProps(path, {option}))`. Round-trips Schema-2-valid; empty `validation` removed.

**Preview (live):** `visiblePages` → `collectPerQuestionErrors(visiblePages, answers)` → `requiredErrors`+`errorMessages` → `StepRenderer`. Re-validates on each answer change.

**`perQuestion(key, v, value)` (port — non-blocking, display-only):**
- `value` null/undefined/'' → return null (no error; emptiness is the separate `required` concern).
- `v.range` + `typeof value === 'number'`: `[lo,hi]`; if `(lo!==null && value<lo) || (hi!==null && value>hi)` → `{key, message: v.range_message ?? 'Value out of range.'}`.
- `v.length` + `typeof value === 'string'`: check `value.length` against `[lo,hi]` → `length_message ?? 'Invalid length.'`.
- `v.format` + `typeof value === 'string'`: `try { ok = new RegExp(v.format).test(value) } catch { ok = true }`; `!ok` → `format_message ?? 'Invalid format.'`.
- Order: range → length → format; first failure returned.

**Edge semantics:** nullable bounds = open; type-mismatched checks silently skip; invalid regex passes (try/catch); message fallback to defaults; keys not matching a rendered element simply don't display (harmless).

## 4 — Test plan

- `setValidation` — merge/clear/open-bounds/empty-tuple-removed/all-empty-deletes-validation/choice-switch-clears/immutable/Schema-2-valid.
- `perQuestion` — empty→null; range under/over/within/null-bounds; length; format match/no-match/invalid-regex-passes; custom vs default message; type-mismatch skip.
- `collectPerQuestionErrors` — page + section-child keying (`__r`); items without validation → nothing; `{key,message}[]`.
- `OptionEditor` (RTL) — number shows range+range_message (not length/format); text shows length+format+messages (not range); choice shows none; editing min/max writes the `range` tuple; `input_validation` still renders (relabeled).
- `PreviewPane` (RTL) — number `range=[0,10]`: `15`→error message shown, `5`→none; text `length=[3,null]`: 1-char→error; empty→none.
- Playwright — author a `range` on a number item, preview, enter out-of-range value, screenshot the inline error.

## 5 — Success criteria

1. Option editor authors `validation` (type-gated range/length/format + messages); round-trips Schema-2-valid; empty → no `validation`; distinct from `input_validation`.
2. Inline preview shows per-question errors **live** — present-invalid value → message (custom/default) under the widget; valid/empty → none.
3. `perQuestion` faithfully ports the viewer (empty-skip, nullable bounds, invalid-regex-pass, type-gated, message fallbacks).
4. All suites green; a screenshot delivered showing an inline validation error.

This is the first slice of ED-D3; **D3b** (cross-question validation panel + preview) follows, extending `collectPerQuestionErrors` with cross-question rules.
