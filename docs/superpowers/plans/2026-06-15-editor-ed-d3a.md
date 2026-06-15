# Editor ED-D3a (Per-Question Validation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a type-gated "Validation" section to the Option editor (`option.validation`: range / length / format + messages) and make the inline preview show per-question validation errors live, by porting the viewer's `perQuestion` and feeding the renderer's `requiredErrors`/`errorMessages`.

**Architecture:** `option/ops.ts` gains a `PerQuestionValidation` type + a canonical-preserving `setValidation` (and clears `validation` on any type-switch). `OptionEditor` renders type-gated validation controls (number→range; text→length+format) + relabels the existing `input_validation` regex. A pure `logic/validation.ts` ports `perQuestion` + adds `collectPerQuestionErrors(pages, answers)` keyed exactly as the renderer (`elementKey`/`pageElementFallback`/`sectionChildFallback`). `PreviewPane` computes errors over `visiblePages` and passes `requiredErrors`+`errorMessages` to `StepRenderer`.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/logic/validation.ts` — `ValidationError`, `perQuestion`, `collectPerQuestionErrors` (pure).
- Test files alongside changed/created modules.

**Modify:**
- `editor/src/option/ops.ts` — `PerQuestionValidation` type + `validation?` on `EditableOption` + `setValidation` + clear-on-type-switch.
- `editor/src/option/OptionEditor.tsx` — type-gated Validation section + relabel `input_validation`.
- `editor/src/preview/PreviewPane.tsx` — compute + pass `requiredErrors`/`errorMessages`.
- `editor/FOLLOWUPS.md` — ED-D3a follow-ups.

---

## Task 1: `PerQuestionValidation` type + `setValidation`

**Files:**
- Modify: `editor/src/option/ops.ts`
- Test: `editor/src/option/ops.test.ts` (append)

- [ ] **Step 1: Add the type + field**

In `editor/src/option/ops.ts`, add the interface (near the other exported types) and add `validation?` to `EditableOption`:

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

Add to the `EditableOption` interface (alongside `input_validation`):

```ts
  validation?: PerQuestionValidation
```

- [ ] **Step 2: Write the failing test**

Append to `editor/src/option/ops.test.ts`:

```ts
import { setValidation } from './ops'
import type { EditableOption } from './ops'

const numOpt = { input_data_type: 'number', measurement_type: 'ratio', content: { en: { status: 'draft' } } } as unknown as EditableOption

describe('setValidation', () => {
  it('sets a range and does not mutate input', () => {
    const out = setValidation(numOpt, { range: [0, 10] })
    expect(out.validation).toEqual({ range: [0, 10] })
    expect(numOpt.validation).toBeUndefined()
  })
  it('merges patches', () => {
    const out = setValidation(setValidation(numOpt, { range: [0, 10] }), { range_message: 'too big' })
    expect(out.validation).toEqual({ range: [0, 10], range_message: 'too big' })
  })
  it('keeps open bounds ([n,null] / [null,n])', () => {
    expect(setValidation(numOpt, { range: [3, null] }).validation).toEqual({ range: [3, null] })
  })
  it('drops a [null,null] tuple', () => {
    const out = setValidation(setValidation(numOpt, { range: [0, 10] }), { range: [null, null] })
    expect('validation' in out).toBe(false)
  })
  it('drops empty-string messages and removes validation when empty', () => {
    const out = setValidation(setValidation(numOpt, { range_message: 'x' }), { range_message: '' })
    expect('validation' in out).toBe(false)
  })
  it('clears validation when switching input type', () => {
    const withVal = setValidation(numOpt, { range: [0, 10] })
    expect('validation' in setInputDataType(withVal, 'choice')).toBe(false)
    expect('validation' in setInputDataType(withVal, 'text')).toBe(false)
  })
})
```

> `setInputDataType` is already imported at the top of `ops.test.ts` from ED-C1; if not, add it to the existing import.

- [ ] **Step 3: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/option/ops.test.ts`
Expected: FAIL — `setValidation` not exported / type-switch doesn't clear validation.

- [ ] **Step 4: Implement `setValidation` + clear-on-switch**

In `editor/src/option/ops.ts`, add the function:

```ts
export function setValidation(opt: EditableOption, patch: Partial<PerQuestionValidation>): EditableOption {
  const next = clone(opt)
  const v: PerQuestionValidation = { ...(next.validation ?? {}), ...patch }
  for (const k of Object.keys(v) as (keyof PerQuestionValidation)[]) {
    const val = v[k]
    if (val === undefined) { delete v[k]; continue }
    if ((k === 'range' || k === 'length') && Array.isArray(val) && val[0] === null && val[1] === null) { delete v[k]; continue }
    if (typeof val === 'string' && val === '') { delete v[k]; continue }
  }
  if (Object.keys(v).length === 0) delete next.validation
  else next.validation = v
  return next
}
```

In `setInputDataType`, clear `validation` on every switch — add `delete next.validation` right after `next.input_data_type = t` (validators are type-specific, so a type change discards them):

```ts
export function setInputDataType(opt: EditableOption, t: InputDataType): EditableOption {
  const next = clone(opt)
  next.input_data_type = t
  delete next.validation
  // ... existing branch logic unchanged
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/option/ops.test.ts`
Expected: PASS (existing ops tests + the 6 new `setValidation` cases).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/option/ops.ts editor/src/option/ops.test.ts
git commit -m "feat(editor): ED-D3a PerQuestionValidation type + setValidation (clears on type-switch)"
```

---

## Task 2: Option editor Validation section

**Files:**
- Modify: `editor/src/option/OptionEditor.tsx`
- Test: `editor/src/option/OptionEditor.test.tsx` (append; create if absent)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/option/OptionEditor.test.tsx` (mirror the file's existing render/import style; if the file doesn't exist, create it with the standard RTL imports + an `onChange` spy):

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OptionEditor } from './OptionEditor'
import type { EditableOption } from './ops'

const numOpt = { input_data_type: 'number', measurement_type: 'ratio', content: { en: { status: 'draft' } } } as unknown as EditableOption
const textOpt = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft' } } } as unknown as EditableOption
const choiceOpt = { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single', options: [{ index: 1, value: null }, { index: 2, value: null }], content: { en: { status: 'draft', options: [{ index: 1, text: 'a' }, { index: 2, text: 'b' }] } } } as unknown as EditableOption

describe('OptionEditor validation section', () => {
  it('number type shows range inputs + range message, not length/format', () => {
    render(<OptionEditor option={numOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Min value')).toBeInTheDocument()
    expect(screen.getByLabelText('Max value')).toBeInTheDocument()
    expect(screen.getByLabelText('Range message')).toBeInTheDocument()
    expect(screen.queryByLabelText('Min length')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Format (regex)')).not.toBeInTheDocument()
  })
  it('text type shows length + format + their messages', () => {
    render(<OptionEditor option={textOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Min length')).toBeInTheDocument()
    expect(screen.getByLabelText('Max length')).toBeInTheDocument()
    expect(screen.getByLabelText('Length message')).toBeInTheDocument()
    expect(screen.getByLabelText('Format (regex)')).toBeInTheDocument()
    expect(screen.getByLabelText('Format message')).toBeInTheDocument()
  })
  it('choice type shows no validation inputs', () => {
    render(<OptionEditor option={choiceOpt} locale="en" onChange={() => {}} />)
    expect(screen.queryByLabelText('Min value')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Min length')).not.toBeInTheDocument()
  })
  it('editing Max value writes the range tuple', () => {
    const onChange = vi.fn()
    render(<OptionEditor option={numOpt} locale="en" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Max value'), { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ validation: { range: [null, 10] } }))
  })
  it('still renders the input mask field for text (relabeled)', () => {
    render(<OptionEditor option={textOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Input mask (RegEx)')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/option/OptionEditor.test.tsx`
Expected: FAIL — the validation labels don't exist yet; the input-mask field is still labeled "Validation regex".

- [ ] **Step 3: Add the Validation section + relabel `input_validation`**

In `editor/src/option/OptionEditor.tsx`:

(a) Extend the imports to include `setValidation` + the type:

```tsx
import {
  setInputDataType, setMeasurementType, setSelection, setMinMaxSelected, setBounds, setLabel, setUnits,
  setInputValidation, setPlaceholderText, setHelpText, setValidation,
  type EditableOption, type InputDataType, type MeasurementType,
} from './ops'
```

(b) Relabel the existing text `input_validation` block (change the visible text + `aria-label` to "Input mask (RegEx)" and add a hint):

```tsx
      {option.input_data_type === 'text' && (
        <label className="block text-sm">Input mask (RegEx)
          <input value={typeof option.input_validation === 'string' ? option.input_validation : ''}
                 onChange={(e) => onChange(setInputValidation(option, e.target.value || undefined))}
                 className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs" aria-label="Input mask (RegEx)" />
          <span className="mt-0.5 block text-[11px] text-slate-400">Input-level pattern. For a validation error message, use Format below.</span>
        </label>
      )}
```

(c) Add the Validation section just before the Placeholder block (so it sits with the field's constraints). Insert:

```tsx
      {option.input_data_type !== 'choice' && (() => {
        const v = option.validation ?? {}
        const numStr = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))
        const parse = (raw: string): number | null => (raw === '' ? null : Number(raw))
        return (
          <div className="space-y-2 rounded border border-slate-200 p-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation</div>
            {option.input_data_type === 'number' && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">Min value
                  <input type="number" aria-label="Min value" value={numStr(v.range?.[0])}
                         onChange={(e) => onChange(setValidation(option, { range: [parse(e.target.value), v.range?.[1] ?? null] }))}
                         className="ml-1 w-24 rounded border border-slate-300 px-1 py-0.5" />
                </label>
                <label className="text-sm">Max value
                  <input type="number" aria-label="Max value" value={numStr(v.range?.[1])}
                         onChange={(e) => onChange(setValidation(option, { range: [v.range?.[0] ?? null, parse(e.target.value)] }))}
                         className="ml-1 w-24 rounded border border-slate-300 px-1 py-0.5" />
                </label>
                <label className="block w-full text-sm">Range message
                  <input value={v.range_message ?? ''} aria-label="Range message"
                         onChange={(e) => onChange(setValidation(option, { range_message: e.target.value }))}
                         className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
                </label>
              </div>
            )}
            {option.input_data_type === 'text' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm">Min length
                    <input type="number" aria-label="Min length" min={0} value={numStr(v.length?.[0])}
                           onChange={(e) => onChange(setValidation(option, { length: [parse(e.target.value), v.length?.[1] ?? null] }))}
                           className="ml-1 w-24 rounded border border-slate-300 px-1 py-0.5" />
                  </label>
                  <label className="text-sm">Max length
                    <input type="number" aria-label="Max length" min={0} value={numStr(v.length?.[1])}
                           onChange={(e) => onChange(setValidation(option, { length: [v.length?.[0] ?? null, parse(e.target.value)] }))}
                           className="ml-1 w-24 rounded border border-slate-300 px-1 py-0.5" />
                  </label>
                  <label className="block w-full text-sm">Length message
                    <input value={v.length_message ?? ''} aria-label="Length message"
                           onChange={(e) => onChange(setValidation(option, { length_message: e.target.value }))}
                           className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
                  </label>
                </div>
                <label className="block text-sm">Format (regex)
                  <input value={v.format ?? ''} aria-label="Format (regex)"
                         onChange={(e) => onChange(setValidation(option, { format: e.target.value }))}
                         className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs" />
                </label>
                <label className="block text-sm">Format message
                  <input value={v.format_message ?? ''} aria-label="Format message"
                         onChange={(e) => onChange(setValidation(option, { format_message: e.target.value }))}
                         className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
                </label>
              </div>
            )}
          </div>
        )
      })()}
```

> Place this block before the existing `{option.input_data_type !== 'choice' && ( … Placeholder … )}` block. Controlled inputs (`value=`), not `defaultValue` — the ED-C1/ED-D1 lesson.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/option/OptionEditor.test.tsx`
Expected: PASS (5 new validation tests + any existing OptionEditor tests).

- [ ] **Step 5: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/option/OptionEditor.tsx editor/src/option/OptionEditor.test.tsx
git commit -m "feat(editor): ED-D3a Option editor validation section (type-gated range/length/format)"
```

---

## Task 3: `perQuestion` + `collectPerQuestionErrors`

**Files:**
- Create: `editor/src/logic/validation.ts`, `editor/src/logic/validation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { perQuestion, collectPerQuestionErrors } from './validation'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

describe('perQuestion', () => {
  it('skips empty values', () => {
    expect(perQuestion('k', { range: [0, 10] }, null)).toBeNull()
    expect(perQuestion('k', { range: [0, 10] }, '')).toBeNull()
  })
  it('flags numeric range under/over with the custom message', () => {
    expect(perQuestion('k', { range: [0, 10], range_message: 'oops' }, 15)).toEqual({ key: 'k', message: 'oops' })
    expect(perQuestion('k', { range: [5, null] }, 3)).toEqual({ key: 'k', message: 'Value out of range.' })
    expect(perQuestion('k', { range: [0, 10] }, 5)).toBeNull()
  })
  it('flags string length', () => {
    expect(perQuestion('k', { length: [3, null] }, 'ab')).toEqual({ key: 'k', message: 'Invalid length.' })
    expect(perQuestion('k', { length: [0, 3], length_message: 'too long' }, 'abcd')).toEqual({ key: 'k', message: 'too long' })
  })
  it('flags format mismatch; invalid regex passes', () => {
    expect(perQuestion('k', { format: '^\\d+$' }, 'abc')).toEqual({ key: 'k', message: 'Invalid format.' })
    expect(perQuestion('k', { format: '^\\d+$' }, '123')).toBeNull()
    expect(perQuestion('k', { format: '(' }, 'anything')).toBeNull() // invalid regex → pass
  })
  it('does not apply range to a string value', () => {
    expect(perQuestion('k', { range: [0, 10] }, 'hello')).toBeNull()
  })
})

describe('collectPerQuestionErrors', () => {
  const pages = [{ id: 'p1', elements: [
    { id: 'it_a', question: {}, option: { validation: { range: [0, 10] } } },
    { id: 'sec', elements: [{ id: 'it_b', question: {}, option: { validation: { length: [3, null] } } }] },
    { id: 'it_novalid', question: {}, option: {} },
  ] }] as unknown as RuntimePage[]

  it('keys page-level items by id and section children too', () => {
    const errs = collectPerQuestionErrors(pages, { it_a: 15, it_b: 'xx' })
    expect(errs.find((e) => e.key === 'it_a')?.message).toBe('Value out of range.')
    expect(errs.find((e) => e.key === 'it_b')?.message).toBe('Invalid length.')
  })
  it('ignores items without validation and valid/empty answers', () => {
    expect(collectPerQuestionErrors(pages, { it_a: 5 })).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/validation.test.ts`
Expected: FAIL — `Cannot find module './validation'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/validation.ts`:

```ts
import { elementKey, pageElementFallback, sectionChildFallback } from '@behaverse/questionnaire-renderer'
import type { RuntimeElement, RuntimePage, AnswerValue } from '@behaverse/questionnaire-renderer'

export type ValidationError = { key: string; message: string }

/** Port of web-viewer `perQuestion`: empty value → no error; numeric range, string length,
 *  string format (unanchored; invalid regex passes). Display-only, non-blocking. */
export function perQuestion(key: string, v: Record<string, unknown>, value: unknown): ValidationError | null {
  if (value === null || value === undefined || value === '') return null
  const range = v.range as [number | null, number | null] | undefined
  if (range && typeof value === 'number') {
    const [lo, hi] = range
    if ((lo !== null && value < lo) || (hi !== null && value > hi)) return { key, message: String(v.range_message ?? 'Value out of range.') }
  }
  const length = v.length as [number | null, number | null] | undefined
  if (length && typeof value === 'string') {
    const [lo, hi] = length
    if ((lo !== null && value.length < lo) || (hi !== null && value.length > hi)) return { key, message: String(v.length_message ?? 'Invalid length.') }
  }
  const fmt = v.format as string | undefined
  if (fmt && typeof value === 'string') {
    let ok = false
    try { ok = new RegExp(fmt).test(value) } catch { ok = true }
    if (!ok) return { key, message: String(v.format_message ?? 'Invalid format.') }
  }
  return null
}

/** The per-question validation object on a runtime element. The editor's projected runtime
 *  keeps `option` nested (renderer reads `el.option`), so validation lives at `el.option.validation`;
 *  fall back to `el.validation` for parity with the viewer's denormalised runtime. */
function validationOf(el: unknown): Record<string, unknown> | undefined {
  const optVal = (el as { option?: { validation?: unknown } }).option?.validation
  if (optVal && typeof optVal === 'object') return optVal as Record<string, unknown>
  const elVal = (el as { validation?: unknown }).validation
  return elVal && typeof elVal === 'object' ? (elVal as Record<string, unknown>) : undefined
}

/** Per-question validation errors over the given pages, keyed exactly as the renderer keys
 *  elements (page-level `elementKey`; section children `${parentKey}__r${j}`). */
export function collectPerQuestionErrors(pages: RuntimePage[], answers: Record<string, AnswerValue>): ValidationError[] {
  const errors: ValidationError[] = []
  for (const page of pages) {
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      const v = validationOf(el)
      if (v) { const e = perQuestion(key, v, answers[key]); if (e) errors.push(e) }
      const children = (el as { elements?: RuntimeElement[] }).elements
      if (Array.isArray(children)) {
        children.forEach((c, j) => {
          const ck = elementKey(c, sectionChildFallback(key, j))
          const cv = validationOf(c)
          if (cv) { const e = perQuestion(ck, cv, answers[ck]); if (e) errors.push(e) }
        })
      }
    })
  }
  return errors
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/validation.test.ts`
Expected: PASS (all perQuestion + collectPerQuestionErrors cases).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/validation.ts editor/src/logic/validation.test.ts
git commit -m "feat(editor): ED-D3a perQuestion + collectPerQuestionErrors (viewer port)"
```

---

## Task 4: Preview shows per-question errors live

**Files:**
- Modify: `editor/src/preview/PreviewPane.tsx`
- Create: `editor/src/preview/PreviewValidation.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/preview/PreviewValidation.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { PreviewPane } from './PreviewPane'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  pages: [{ id: 'p1', elements: [
    { id: 'it_n',
      question: { prompt: { content: { en: { status: 'complete', text: 'Your age?' } } } },
      option: { input_data_type: 'number', measurement_type: 'ratio', content: { en: {} }, validation: { range: [0, 10], range_message: 'Too big' } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane per-question validation', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(model), { kind: 'new' } as never))

  it('shows the range error for an out-of-range value, none when valid', async () => {
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getAllByText('Your age?').length).toBeGreaterThan(0))
    const input = screen.getByRole('spinbutton') // the number widget
    fireEvent.change(input, { target: { value: '15' } })
    await waitFor(() => expect(screen.getByText('Too big')).toBeInTheDocument())
    fireEvent.change(input, { target: { value: '5' } })
    await waitFor(() => expect(screen.queryByText('Too big')).not.toBeInTheDocument())
  })
})
```

> Note: the renderer's number widget should expose `role="spinbutton"` (a number input). If the actual role/selector differs, adjust to match the rendered widget; the assertion that matters is the message appears for `15` and is gone for `5`. The fixture's option carries `validation` under `option.validation` (where the editor's projected runtime keeps it).

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/PreviewValidation.test.tsx`
Expected: FAIL — no error shown (PreviewPane passes `requiredErrors={[]}`, no validation computed).

- [ ] **Step 3: Wire validation into `PreviewPane`**

In `editor/src/preview/PreviewPane.tsx`:

Add the import:

```tsx
import { collectPerQuestionErrors } from '../logic/validation'
```

After the `visiblePages` line, compute the errors:

```tsx
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const errorMessages = Object.fromEntries(verrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = verrors.map((e) => e.key)
```

Change the `StepRenderer` invocation's `requiredErrors={[]}` to pass the computed errors:

```tsx
                <StepRenderer elements={flattenPage(page)} locale={locale} answers={answers} onAnswer={onAnswer}
                              requiredErrors={requiredErrorKeys} errorMessages={errorMessages} strings={STRINGS} />
```

> `verrors` is computed once over all `visiblePages` and shared across the per-page `StepRenderer`s — each renderer only displays the keys it renders, so passing the full map to each page is correct + harmless.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/PreviewValidation.test.tsx`
Expected: PASS — "Too big" shown for 15, gone for 5.

- [ ] **Step 5: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass (D1 visibility + D2 piping preview tests unaffected — `requiredErrors` was `[]` and is now computed, but those fixtures have no `validation`, so the array is empty for them).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/preview/PreviewPane.tsx editor/src/preview/PreviewValidation.test.tsx
git commit -m "feat(editor): ED-D3a preview shows per-question validation errors live"
```

---

## Task 5: Playwright smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/validation.spec.ts`
- Create: `editor/src/__fixtures__/validation_demo.json` (a bundle with one number item)

- [ ] **Step 1: Create the fixture**

Create `editor/src/__fixtures__/validation_demo.json` — a `{questionnaire, entities}` bundle with one number item whose prompt is a pinned ref (resolved via the stubbed endpoint, like the D1/D2 fixtures), and which carries `option.validation.range`:

```json
{
  "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
  "questionnaire": {
    "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
    "metadata": { "id": "qst_validation_demo", "title": "Validation Demo", "description": "ED-D3a smoke", "version": "v26.0615", "language": "en" },
    "pages": [
      { "id": "page_1", "title": "Page 1", "elements": [
        { "id": "it_age",
          "question": { "prompt": { "ref": "pr_age@v26.0615" } },
          "option": { "input_data_type": "number", "measurement_type": "ratio", "content": { "en": { "status": "validated", "label": "Age" } },
            "validation": { "range": [0, 120], "range_message": "Enter an age between 0 and 120" } } }
      ] }
    ]
  },
  "entities": {
    "prompt/pr_age": { "id": "pr_age", "content": { "en": { "status": "validated", "text": "How old are you?" } } }
  }
}
```

> Confirm the prompt entity body shape matches `show_if_demo.json`'s `prompt/*` entries (the resolver expects `{ id, content: { <locale>: { status, text } } }`). Adjust to match if the existing fixtures differ.

- [ ] **Step 2: Write the smoke spec**

Create `editor/tests/e2e/validation.spec.ts`, mirroring `editor/tests/e2e/piping.spec.ts` for the bundle-load + `**/v1/entities/**` stub:

```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/validation_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a per-question range shows an inline validation error in the preview', async ({ page }) => {
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'validation_demo.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'How old are you?' })).toBeVisible()

  // Enter an out-of-range age → the inline validation message appears.
  await preview.getByRole('spinbutton').fill('999')
  await expect(preview.getByText('Enter an age between 0 and 120')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d3a-validation.png', fullPage: true })
})
```

> The validation is authored in the FIXTURE (not via the UI) to keep the smoke focused on the preview-display payoff. Use `page.getByLabel`/`getByRole` only. If the number widget's role differs from `spinbutton`, adjust.

- [ ] **Step 3: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- validation`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-d3a-validation.png`. (Install chromium first if needed. If it can't run here, commit the spec + fixture and report the exact failure; do NOT weaken assertions.)

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/validation.spec.ts editor/src/__fixtures__/validation_demo.json
git commit -m "test(editor): ED-D3a Playwright per-question validation smoke + screenshot"
```

---

## Task 6: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-D3a follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-D3a Follow-ups

Known limitations and open items carried out of ED-D3a (per-question validation).

## (eee) Two regex fields: `input_validation` vs `validation.format`

`OptionBase` has BOTH `input_validation` (a standalone RegEx/RegExRef, edited as "Input mask")
AND `validation.format` (the per-question format check the viewer validates + messages on).
ED-D3a edits `validation`; `input_validation` stays as the ED-C1 field. Whether the schema
should keep both regexes is a schema/domain question for the owner, not the editor's to resolve.

## (fff) Validation is display-only + live in the preview (no submit gate)

The editor preview computes per-question errors live and shows them via the renderer's
`requiredErrors`/`errorMessages`. There is no blocking "Validate"/submit gate (the deployed
viewer validates on Next; the editor preview is an authoring aid). Empty values never error
(that's the separate `required` flag from ED-C4).

## (ggg) No inline validator-linting

The editor does not lint the validators themselves (e.g. min>max, or a broken `format` regex —
which silently passes at runtime per the viewer). Author-facing linting is a later refinement.

## (hhh) Cross-question validation is ED-D3b

Cross-question rules (`Questionnaire.validation[]`: id + condition + message + targets) and their
panel + preview are ED-D3b, which extends `collectPerQuestionErrors` with cross-question rules.

## (iii) Per-question validation reads `el.option.validation` in the editor runtime

`collectPerQuestionErrors` reads validation from `el.option.validation` (where the editor's
faithful projection keeps it), with an `el.validation` fallback for parity with the viewer's
denormalised runtime (which hoists it). If the editor's projection ever hoists validation, the
fallback already covers it.
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 3: Production build smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: succeeds, emits the wasm asset.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-D3a FOLLOWUPS"
```

---

## Done criteria (mirror of spec §5)

1. Option editor authors `validation` (type-gated range/length/format + messages); round-trips Schema-2-valid; empty → no `validation`; distinct from `input_validation`. — Tasks 1, 2.
2. Inline preview shows per-question errors live (present-invalid → message; valid/empty → none). — Tasks 3, 4.
3. `perQuestion` faithfully ports the viewer. — Task 3.
4. All suites green; screenshot delivered. — Tasks 5, 6.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_d3a` memory + MEMORY.md line + HANDOFF update.
```
