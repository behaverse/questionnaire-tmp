# Editor ED-D3b (Cross-Question Validation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a questionnaire-global "Validation rules" panel (CRUD on `Questionnaire.validation[]`: auto-`val_N` id + condition + message + targets multi-select) below the Logic panel, and make the inline preview show cross-question validation errors live, merged with D3a's per-question errors. Completes ED-D3.

**Architecture:** A clean clone of the D2a Logic pattern: typed `CrossQuestionValidationRule` + `updateValidation` (mirror `updateLogic`); pure `validationRuleOps.ts` (`newValidationRule`/`summarizeValidationRule`/`validateValidationRule`, reusing `RuleIssue`); `ValidationRuleEditor` + `ValidationPanel` mirroring `RuleEditor`/`LogicPanel` (reusing `ExpressionInput`/`useEvaluator`/`collectIdCatalogue`/`collectLogicTargets`). `logic/validation.ts` gains `collectCrossQuestionErrors`; `PreviewPane` merges per-question + cross-question errors into the renderer's `requiredErrors`/`errorMessages`.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind · Zustand · Immer · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/logic/validationRuleOps.ts` — `newValidationRule`, `summarizeValidationRule`, `validateValidationRule` (pure).
- `editor/src/logic/ValidationRuleEditor.tsx` — per-rule form.
- `editor/src/logic/ValidationPanel.tsx` — the panel.
- `editor/src/__fixtures__/cross_validation_demo.json` — e2e bundle.
- Test files alongside.

**Modify:**
- `editor/src/model/types.ts` — `CrossQuestionValidationRule` + `validation?` on `Questionnaire`.
- `editor/src/model/tree.ts` — `updateValidation`.
- `editor/src/logic/validation.ts` — `collectCrossQuestionErrors`.
- `editor/src/preview/PreviewPane.tsx` — merge cross-question errors.
- `editor/src/inspector/Inspector.tsx` — mount `<ValidationPanel/>` after `<LogicPanel/>`.
- `editor/FOLLOWUPS.md` — ED-D3b follow-ups.

---

## Task 1: `CrossQuestionValidationRule` type + `updateValidation`

**Files:**
- Modify: `editor/src/model/types.ts`, `editor/src/model/tree.ts`
- Test: `editor/src/model/tree.test.ts` (append)

- [ ] **Step 1: Add the type**

In `editor/src/model/types.ts`, add (near `LogicRule`):

```ts
export interface CrossQuestionValidationRule {
  id: string
  condition: string
  message: string
  targets?: string[]
}
```

Add to `Questionnaire` (alongside `logic?`):

```ts
  validation?: CrossQuestionValidationRule[]
```

- [ ] **Step 2: Write the failing test**

Append to `editor/src/model/tree.test.ts`:

```ts
import { updateValidation } from './tree'
import type { CrossQuestionValidationRule } from './types'

describe('updateValidation', () => {
  const base = { metadata: { id: 'qst_x', language: 'en' }, pages: [] } as unknown as import('./types').Questionnaire
  const rule: CrossQuestionValidationRule = { id: 'val_1', condition: 'a > b', message: 'oops', targets: ['it_a'] }
  it('sets validation[] without mutating input', () => {
    const out = updateValidation(base, [rule])
    expect(out.validation).toEqual([rule])
    expect(base.validation).toBeUndefined()
  })
  it('replaces the whole array', () => {
    const out = updateValidation(updateValidation(base, [rule]), [{ ...rule, message: 'changed' }])
    expect(out.validation).toEqual([{ ...rule, message: 'changed' }])
  })
  it('deletes validation when given an empty array', () => {
    expect('validation' in updateValidation(updateValidation(base, [rule]), [])).toBe(false)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts`
Expected: FAIL — `updateValidation` not exported.

- [ ] **Step 4: Implement**

In `editor/src/model/tree.ts`, extend the type import to include `CrossQuestionValidationRule` and add (near `updateLogic`):

```ts
export function updateValidation(model: Questionnaire, rules: CrossQuestionValidationRule[]): Questionnaire {
  return produce(model, (draft) => {
    if (rules.length === 0) delete draft.validation
    else draft.validation = rules
  })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts`
Expected: PASS (existing tree tests + 3 new).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/model/types.ts editor/src/model/tree.ts editor/src/model/tree.test.ts
git commit -m "feat(editor): ED-D3b typed CrossQuestionValidationRule + updateValidation"
```

---

## Task 2: `validationRuleOps`

**Files:**
- Create: `editor/src/logic/validationRuleOps.ts`, `editor/src/logic/validationRuleOps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/validationRuleOps.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { newValidationRule, summarizeValidationRule, validateValidationRule } from './validationRuleOps'
import type { CrossQuestionValidationRule } from '../model/types'

const targets = { pageIds: ['p1'], elementKeys: ['it_a', 'it_b'] }

describe('newValidationRule', () => {
  it('picks the first free val_N id', () => {
    expect(newValidationRule([]).id).toBe('val_1')
    expect(newValidationRule([{ id: 'val_1' }, { id: 'val_3' }] as CrossQuestionValidationRule[]).id).toBe('val_2')
  })
  it('starts empty with an empty targets array', () => {
    expect(newValidationRule([])).toEqual({ id: 'val_1', condition: '', message: '', targets: [] })
  })
})

describe('summarizeValidationRule', () => {
  it('summarizes with targets', () => {
    expect(summarizeValidationRule({ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a', 'it_b'] }))
      .toBe('val_1: if a>b → it_a, it_b')
  })
  it('shows (no targets) when empty', () => {
    expect(summarizeValidationRule({ id: 'val_1', condition: 'a>b', message: 'm', targets: [] }))
      .toBe('val_1: if a>b → (no targets)')
  })
})

describe('validateValidationRule', () => {
  const rule = (o: Partial<CrossQuestionValidationRule>): CrossQuestionValidationRule => ({ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a'], ...o })
  it('a fully-valid rule has no errors', () => {
    expect(validateValidationRule(rule({}), targets, [rule({})]).errors).toEqual([])
  })
  it('flags empty / bad-pattern id', () => {
    expect(validateValidationRule(rule({ id: '' }), targets, []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
    expect(validateValidationRule(rule({ id: 'Bad Id' }), targets, []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
  })
  it('warns on a duplicate id', () => {
    const r = rule({})
    expect(validateValidationRule(r, targets, [r, rule({ message: 'other' })]).errors.some((e) => e.field === 'id' && e.level === 'warning')).toBe(true)
  })
  it('flags empty condition + empty message', () => {
    expect(validateValidationRule(rule({ condition: '' }), targets, []).errors.some((e) => e.field === 'condition' && e.level === 'error')).toBe(true)
    expect(validateValidationRule(rule({ message: '' }), targets, []).errors.some((e) => e.field === 'message' && e.level === 'error')).toBe(true)
  })
  it('warns on an unknown target and on empty targets', () => {
    expect(validateValidationRule(rule({ targets: ['it_x'] }), targets, []).errors.some((e) => e.field === 'targets' && e.level === 'warning')).toBe(true)
    expect(validateValidationRule(rule({ targets: [] }), targets, []).errors.some((e) => e.field === 'targets' && e.level === 'warning')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/validationRuleOps.test.ts`
Expected: FAIL — `Cannot find module './validationRuleOps'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/validationRuleOps.ts`:

```ts
import type { CrossQuestionValidationRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { RuleIssue } from './ruleOps'

const ID_RE = /^[a-z][a-z0-9_]+$/

export function newValidationRule(existing: CrossQuestionValidationRule[]): CrossQuestionValidationRule {
  const ids = new Set(existing.map((r) => r.id))
  let n = 1
  while (ids.has(`val_${n}`)) n++
  return { id: `val_${n}`, condition: '', message: '', targets: [] }
}

export function summarizeValidationRule(rule: CrossQuestionValidationRule): string {
  const cond = (rule.condition ?? '').trim() || '…'
  const tgts = (rule.targets ?? []).join(', ') || '(no targets)'
  return `${rule.id || '?'}: if ${cond} → ${tgts}`
}

export function validateValidationRule(
  rule: CrossQuestionValidationRule,
  targets: LogicTargets,
  allRules: CrossQuestionValidationRule[],
): { errors: RuleIssue[] } {
  const errors: RuleIssue[] = []
  if (!rule.id) errors.push({ field: 'id', message: 'Id required', level: 'error' })
  else if (!ID_RE.test(rule.id)) errors.push({ field: 'id', message: 'Id must be lowercase letters/digits/underscore (≥2 chars)', level: 'error' })
  else if (allRules.filter((r) => r.id === rule.id).length > 1) errors.push({ field: 'id', message: `Duplicate id: ${rule.id}`, level: 'warning' })
  if (!rule.condition || !rule.condition.trim()) errors.push({ field: 'condition', message: 'Condition required', level: 'error' })
  if (!rule.message || !rule.message.trim()) errors.push({ field: 'message', message: 'Message required', level: 'error' })
  for (const t of rule.targets ?? []) if (!targets.elementKeys.includes(t)) errors.push({ field: 'targets', message: `Unknown element: ${t}`, level: 'warning' })
  if ((rule.targets ?? []).length === 0) errors.push({ field: 'targets', message: "No targets — the error won't display", level: 'warning' })
  return { errors }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/validationRuleOps.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/validationRuleOps.ts editor/src/logic/validationRuleOps.test.ts
git commit -m "feat(editor): ED-D3b validation rule ops (newValidationRule/summarize/validate)"
```

---

## Task 3: `ValidationRuleEditor`

**Files:**
- Create: `editor/src/logic/ValidationRuleEditor.tsx`, `editor/src/logic/ValidationRuleEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/ValidationRuleEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ValidationRuleEditor } from './ValidationRuleEditor'
import { makeFakeEvaluator } from './evaluator'
import type { CrossQuestionValidationRule } from '../model/types'

const targets = { pageIds: ['p1'], elementKeys: ['it_a', 'it_b'] }
const cat = { questionIds: ['it_a', 'it_b'], scoreIds: [] }
const ev = makeFakeEvaluator({})

function setup(rule: CrossQuestionValidationRule, onChange = vi.fn()) {
  render(<ValidationRuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev} allRules={[rule]} onChange={onChange} onDelete={vi.fn()} />)
  return onChange
}
const base: CrossQuestionValidationRule = { id: 'val_1', condition: 'a>b', message: 'oops', targets: ['it_a'] }

describe('ValidationRuleEditor', () => {
  it('renders id, condition, message inputs + a checkbox per element key', () => {
    setup(base)
    expect((screen.getByLabelText('Rule id') as HTMLInputElement).value).toBe('val_1')
    expect((screen.getByLabelText('Error message') as HTMLInputElement).value).toBe('oops')
    expect(screen.getByLabelText('Target it_a')).toBeChecked()
    expect(screen.getByLabelText('Target it_b')).not.toBeChecked()
  })
  it('toggling a target updates rule.targets', () => {
    const onChange = setup(base)
    fireEvent.click(screen.getByLabelText('Target it_b'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: ['it_a', 'it_b'] }))
  })
  it('unchecking removes a target', () => {
    const onChange = setup(base)
    fireEvent.click(screen.getByLabelText('Target it_a'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: [] }))
  })
  it('keeps an out-of-catalogue current target checked', () => {
    setup({ ...base, targets: ['it_gone'] })
    expect(screen.getByLabelText('Target it_gone')).toBeChecked()
  })
  it('editing the message emits the updated rule', () => {
    const onChange = setup(base)
    fireEvent.change(screen.getByLabelText('Error message'), { target: { value: 'new msg' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ message: 'new msg' }))
  })
  it('shows an error for an empty message and a warning for empty targets', () => {
    setup({ ...base, message: '', targets: [] })
    expect(screen.getByText(/message required/i)).toBeInTheDocument()
    expect(screen.getByText(/no targets/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ValidationRuleEditor.test.tsx`
Expected: FAIL — `Cannot find module './ValidationRuleEditor'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/ValidationRuleEditor.tsx`:

```tsx
import type { CrossQuestionValidationRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { IdCatalogue } from './ids'
import type { LogicEvaluator } from './types'
import { validateValidationRule } from './validationRuleOps'
import { ExpressionInput } from './ExpressionInput'

export function ValidationRuleEditor({ rule, targets, catalogue, evaluator, allRules, onChange, onDelete }: {
  rule: CrossQuestionValidationRule
  targets: LogicTargets
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
  allRules: CrossQuestionValidationRule[]
  onChange: (rule: CrossQuestionValidationRule) => void
  onDelete: () => void
}) {
  const issues = validateValidationRule(rule, targets, allRules).errors
  const current = rule.targets ?? []
  const targetOptions = [...new Set([...targets.elementKeys, ...current])]
  const toggle = (key: string) =>
    onChange({ ...rule, targets: current.includes(key) ? current.filter((t) => t !== key) : [...current, key] })

  return (
    <div className="space-y-2 rounded border border-slate-200 p-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Id
          <input aria-label="Rule id" value={rule.id} onChange={(e) => onChange({ ...rule, id: e.target.value })}
            className="ml-1 rounded border border-slate-300 px-1 py-0.5 font-mono text-xs" />
        </label>
        <button type="button" aria-label="Delete rule" onClick={onDelete}
          className="ml-auto rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
      </div>

      <div className="text-xs font-medium text-slate-500">Condition</div>
      <ExpressionInput value={rule.condition} onChange={(v) => onChange({ ...rule, condition: v })} catalogue={catalogue} evaluator={evaluator} />

      <label className="block text-xs font-medium text-slate-500">Error message
        <input aria-label="Error message" value={rule.message} onChange={(e) => onChange({ ...rule, message: e.target.value })}
          className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>

      <div className="text-xs font-medium text-slate-500">Targets</div>
      <div className="flex flex-wrap gap-2">
        {targetOptions.length === 0 && <span className="text-[11px] text-slate-400">No elements to target yet.</span>}
        {targetOptions.map((k) => (
          <label key={k} className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" aria-label={`Target ${k}`} checked={current.includes(k)} onChange={() => toggle(k)} />
            {k}
          </label>
        ))}
      </div>

      {issues.length > 0 && (
        <ul className="space-y-0.5 text-xs">
          {issues.map((it, i) => (
            <li key={i} className={it.level === 'error' ? 'text-red-600' : 'text-amber-600'}>
              {it.level === 'error' ? '✗' : '⚠'} {it.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ValidationRuleEditor.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/ValidationRuleEditor.tsx editor/src/logic/ValidationRuleEditor.test.tsx
git commit -m "feat(editor): ED-D3b ValidationRuleEditor (id/condition/message/targets multi-select)"
```

---

## Task 4: `ValidationPanel` + Inspector mount

**Files:**
- Create: `editor/src/logic/ValidationPanel.tsx`, `editor/src/logic/ValidationPanel.test.tsx`
- Modify: `editor/src/inspector/Inspector.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/ValidationPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('./useEvaluator', async () => {
  const real = await import('./evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { ValidationPanel } from './ValidationPanel'
import { Inspector } from '../inspector/Inspector'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
  pages: [{ id: 'p1', elements: [{ id: 'it_a', question: {}, option: {} }] }],
} as unknown as Questionnaire

describe('ValidationPanel', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('adds an auto-id rule via + Add rule', () => {
    render(<ValidationPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    expect(useEditorStore.getState().model!.validation?.[0]?.id).toBe('val_1')
  })
  it('deletes a rule', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, validation: [{ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a'] }] }))
    render(<ValidationPanel />)
    fireEvent.click(screen.getByRole('button', { name: /edit validation rule 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete rule/i }))
    expect(useEditorStore.getState().model!.validation).toBeUndefined()
  })
  it('shows an attention count for invalid rules', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, validation: [{ id: '', condition: '', message: '', targets: [] }] }))
    render(<ValidationPanel />)
    expect(screen.getByText(/need.* attention/i)).toBeInTheDocument()
  })
})

describe('Inspector mounts ValidationPanel at the questionnaire root', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))
  it('shows Validation rules at root', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    expect(screen.getByText(/validation rules/i)).toBeInTheDocument()
  })
  it('does not show Validation rules for a page selection', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    expect(screen.queryByText(/validation rules/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ValidationPanel.test.tsx`
Expected: FAIL — `Cannot find module './ValidationPanel'`.

- [ ] **Step 3: Implement `ValidationPanel`**

Create `editor/src/logic/ValidationPanel.tsx`:

```tsx
import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { updateValidation } from '../model/tree'
import type { CrossQuestionValidationRule } from '../model/types'
import { collectLogicTargets } from './targets'
import { collectIdCatalogue } from './ids'
import { useEvaluator } from './useEvaluator'
import { newValidationRule, summarizeValidationRule, validateValidationRule } from './validationRuleOps'
import { ValidationRuleEditor } from './ValidationRuleEditor'

export function ValidationPanel() {
  const { model, pool, applyEdit } = useEditorStore()
  const evaluator = useEvaluator()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (!model) return null
  const rules = (model.validation ?? []) as CrossQuestionValidationRule[]
  const targets = collectLogicTargets(model)
  const catalogue = collectIdCatalogue(model, pool)
  const attention = rules.filter((r) => validateValidationRule(r, targets, rules).errors.some((e) => e.level === 'error')).length

  const write = (next: CrossQuestionValidationRule[]) => applyEdit((m) => updateValidation(m, next))
  const add = () => { const next = [...rules, newValidationRule(rules)]; write(next); setOpenIdx(next.length - 1) }
  const edit = (i: number, rule: CrossQuestionValidationRule) => write(rules.map((r, j) => (j === i ? rule : r)))
  const del = (i: number) => { write(rules.filter((_, j) => j !== i)); setOpenIdx(null) }

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation rules</h4>
        {attention > 0 && <span className="text-[11px] text-red-600">{attention} need{attention === 1 ? 's' : ''} attention</span>}
        <button type="button" onClick={add}
          className="ml-auto rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">+ Add rule</button>
      </div>
      {rules.length === 0 && <p className="text-[11px] text-slate-400">No rules yet.</p>}
      <ul className="space-y-1">
        {rules.map((r, i) => (
          <li key={i}>
            <button type="button" aria-label={`Edit validation rule ${i + 1}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="block w-full truncate rounded px-1 py-0.5 text-left font-mono text-xs hover:bg-slate-50">
              {summarizeValidationRule(r)}
            </button>
            {openIdx === i && (
              <div className="mt-1">
                <ValidationRuleEditor rule={r} targets={targets} catalogue={catalogue} evaluator={evaluator}
                  allRules={rules} onChange={(rule) => edit(i, rule)} onDelete={() => del(i)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Mount it in the Inspector**

In `editor/src/inspector/Inspector.tsx`: add the import:

```tsx
import { ValidationPanel } from '../logic/ValidationPanel'
```

In the `kind === 'questionnaire'` branch, render `<ValidationPanel />` immediately after `<LogicPanel />`:

```tsx
        <LogicPanel />
        <ValidationPanel />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ValidationPanel.test.tsx`
Expected: PASS (add/delete/attention + Inspector mount present/absent).

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass. (The existing `Inspector.test.tsx` "Logic rules" / randomize tests still pass — `ValidationPanel` adds a sibling section with a distinct "Validation rules" heading + "Edit validation rule N" row labels, so no query collision with the Logic panel's "Edit rule N".)

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/ValidationPanel.tsx editor/src/logic/ValidationPanel.test.tsx editor/src/inspector/Inspector.tsx
git commit -m "feat(editor): ED-D3b ValidationPanel mounted in the questionnaire-root Inspector"
```

---

## Task 5: Preview shows cross-question errors live (merged)

**Files:**
- Modify: `editor/src/logic/validation.ts`, `editor/src/preview/PreviewPane.tsx`
- Create: `editor/src/logic/crossValidation.test.ts`
- Modify: `editor/src/preview/PreviewValidation.test.tsx` (append a cross-question case)

- [ ] **Step 1: Write the failing unit test**

Create `editor/src/logic/crossValidation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectCrossQuestionErrors } from './validation'
import { makeBindings } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { CrossQuestionValidationRule } from '../model/types'

const ev = makeFakeEvaluator({ "a == 'x'": (b) => b.var('a') === 'x' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const rule: CrossQuestionValidationRule = { id: 'val_1', condition: "a == 'x'", message: 'bad combo', targets: ['it_a', 'it_b'] }

describe('collectCrossQuestionErrors', () => {
  it('pushes one error per target when the condition holds', () => {
    const errs = collectCrossQuestionErrors([rule], ev, binds({ a: 'x' }))
    expect(errs).toEqual([{ key: 'it_a', message: 'bad combo' }, { key: 'it_b', message: 'bad combo' }])
  })
  it('pushes nothing when the condition is false', () => {
    expect(collectCrossQuestionErrors([rule], ev, binds({ a: 'y' }))).toEqual([])
  })
  it('skips a malformed condition', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(collectCrossQuestionErrors([rule], evBad, binds({ a: 'x' }))).toEqual([])
  })
  it('pushes nothing for a rule with no targets', () => {
    expect(collectCrossQuestionErrors([{ ...rule, targets: [] }], ev, binds({ a: 'x' }))).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/crossValidation.test.ts`
Expected: FAIL — `collectCrossQuestionErrors` not exported.

- [ ] **Step 3: Implement `collectCrossQuestionErrors`**

In `editor/src/logic/validation.ts`, add the imports (extend the existing import lines):

```ts
import type { Bindings, LogicEvaluator } from './types'
import type { CrossQuestionValidationRule } from '../model/types'
```

Add the function:

```ts
/** Cross-question validation errors: for each rule whose condition is valid + true, push the
 *  message onto each target. Mirrors the viewer's cross-question loop; the `ev.check` guard is
 *  the editor's malformed-safe addition. */
export function collectCrossQuestionErrors(rules: CrossQuestionValidationRule[], ev: LogicEvaluator, bindings: Bindings): ValidationError[] {
  const errors: ValidationError[] = []
  for (const rule of rules) {
    const c = rule.condition
    if (typeof c !== 'string' || c.length === 0 || ev.check(c) !== null) continue
    if (!ev.condition(c, bindings)) continue
    for (const t of rule.targets ?? []) errors.push({ key: t, message: rule.message })
  }
  return errors
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/crossValidation.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Merge into `PreviewPane`**

In `editor/src/preview/PreviewPane.tsx`:

Add the import (extend the existing `from '../logic/validation'`):

```tsx
import { collectPerQuestionErrors, collectCrossQuestionErrors } from '../logic/validation'
```

Replace the current per-question error block (the three lines `const verrors … const errorMessages … const requiredErrorKeys …`) with the merged computation:

```tsx
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const cqErrors = evaluator ? collectCrossQuestionErrors(model.validation ?? [], evaluator, bindings) : []
  const allErrors = [...verrors, ...cqErrors]
  const errorMessages = Object.fromEntries(allErrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = allErrors.map((e) => e.key)
```

(`bindings` + `evaluator` are already in scope above; `requiredErrorKeys`/`errorMessages` keep the same names already passed to `StepRenderer`.)

- [ ] **Step 6: Append a cross-question preview RTL test**

Append to `editor/src/preview/PreviewValidation.test.tsx` a cross-question case (the file already mocks `useEvaluator` + imports `PreviewPane`/store; reuse them). Add a model + test:

```tsx
const crossModel = {
  metadata: { id: 'qst_cv', title: 'CV', description: 'd', language: 'en', version: 'v26.0601' },
  validation: [{ id: 'val_1', condition: "it_pick == 'no'", message: 'Please reconsider', targets: ['it_pick'] }],
  pages: [{ id: 'p1', elements: [
    { id: 'it_pick',
      question: { prompt: { content: { en: { status: 'complete', text: 'Continue?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'yes' }, { index: 1, value: 'no' }],
        content: { en: { options: [{ index: 0, text: 'Yes' }, { index: 1, text: 'No' }] } } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane cross-question validation', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(crossModel), { kind: 'new' } as never))
  it('shows the cross-question message on the target when the condition holds', async () => {
    // Use the REAL fake-evaluator condition table for this model:
    // (the file's top-level useEvaluator mock returns makeFakeEvaluator({}) — for this test we
    //  need the condition to evaluate, so override per the file's mock pattern OR assert via answer.)
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getAllByText('Continue?').length).toBeGreaterThan(0))
    expect(screen.queryByText('Please reconsider')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('No'))
    await waitFor(() => expect(screen.getByText('Please reconsider')).toBeInTheDocument())
  })
})
```

> The file's existing `useEvaluator` mock returns `makeFakeEvaluator({})` (every condition false). For THIS test the condition `it_pick == 'no'` must evaluate true when answered "no". Adjust the mock to a table-driven fake that handles `"it_pick == 'no'"` (e.g. `makeFakeEvaluator({ "it_pick == 'no'": (b) => b.var('it_pick') === 'no' })`) — but that mock is module-level and shared with the per-question test. Use `vi.mocked`/`vi.spyOn` or restructure the mock to a table covering BOTH this condition and leaving per-question (no conditions) unaffected. Simplest: change the module mock to `makeFakeEvaluator({ "it_pick == 'no'": (b) => b.var('it_pick') === 'no' })` — the per-question test doesn't use conditions, so it's unaffected. Confirm both tests pass after the change.

- [ ] **Step 7: Run preview tests + full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/ && npm run typecheck && npx vitest run`
Expected: the per-question (D3a) + new cross-question preview tests pass; typecheck clean; whole suite green. (D1 visibility + D2 piping preview tests unaffected — no `validation` in those fixtures → `cqErrors` empty.)

- [ ] **Step 8: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/validation.ts editor/src/logic/crossValidation.test.ts editor/src/preview/PreviewPane.tsx editor/src/preview/PreviewValidation.test.tsx
git commit -m "feat(editor): ED-D3b preview shows cross-question errors live (merged with per-question)"
```

---

## Task 6: Playwright smoke + screenshot

**Files:**
- Create: `editor/src/__fixtures__/cross_validation_demo.json`, `editor/tests/e2e/cross-validation.spec.ts`

The cross-question rule is authored IN THE FIXTURE (panel authoring is covered by the RTL tests; the smoke focuses on the live-display payoff + shows the populated Validation panel in the screenshot).

- [ ] **Step 1: Create the fixture**

Create `editor/src/__fixtures__/cross_validation_demo.json` — a `{questionnaire, entities}` bundle with one choice item `it_pick` (yes/no, pinned prompt) + a `validation[]` rule firing on "no". Confirm the prompt-entity body shape matches `show_if_demo.json`'s `prompt/*` entries:

```json
{
  "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
  "questionnaire": {
    "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
    "metadata": { "id": "qst_cross_validation_demo", "title": "Cross-Validation Demo", "description": "ED-D3b smoke", "version": "v26.0615", "language": "en" },
    "validation": [
      { "id": "val_1", "condition": "it_pick == 'no'", "message": "Please reconsider your choice", "targets": ["it_pick"] }
    ],
    "pages": [
      { "id": "page_1", "title": "Page 1", "elements": [
        { "id": "it_pick",
          "question": { "prompt": { "ref": "pr_pick@v26.0615" } },
          "option": { "input_data_type": "choice", "measurement_type": "nominal", "selection": "single",
            "options": [{ "index": 1, "value": "yes" }, { "index": 2, "value": "no" }],
            "content": { "en": { "status": "validated", "label": "Pick", "options": [{ "index": 1, "text": "Yes" }, { "index": 2, "text": "No" }] } } } }
      ] }
    ]
  },
  "entities": {
    "prompt/pr_pick": { "id": "pr_pick", "content": { "en": { "status": "validated", "text": "Do you want to continue?" } } }
  }
}
```

- [ ] **Step 2: Write the smoke spec**

Create `editor/tests/e2e/cross-validation.spec.ts`, mirroring `editor/tests/e2e/validation.spec.ts` (D3a) for the bundle-load + `**/v1/entities/**` stub:

```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/cross_validation_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a cross-question validation rule shows its message in the preview when tripped', async ({ page }) => {
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'cross_validation_demo.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()
  // The Validation panel shows the authored rule at the questionnaire root.
  await expect(page.getByText(/validation rules/i)).toBeVisible()

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Do you want to continue?' })).toBeVisible()
  await preview.getByText('No').click()
  await expect(preview.getByText('Please reconsider your choice')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d3b-cross-validation.png', fullPage: true })
})
```

> Use `page.getByLabel`/`getByRole` only. The control "No" option value is `no` (matches the rule's condition). If the renderer's choice label differs, adjust the click target; the assertion that matters is the message appears after answering "No".

- [ ] **Step 3: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- cross-validation`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-d3b-cross-validation.png` (install chromium first if needed). If chromium can't run here, commit the spec + fixture + report the exact failure; do NOT weaken assertions. Confirm the screenshot shows the Validation panel rule + the inline cross-question error, with no schema-validation banner.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/cross-validation.spec.ts editor/src/__fixtures__/cross_validation_demo.json
git commit -m "test(editor): ED-D3b Playwright cross-question validation smoke + screenshot"
```

---

## Task 7: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-D3b follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-D3b Follow-ups

Known limitations and open items carried out of ED-D3b (cross-question validation). ED-D3 COMPLETE.

## (jjj) Duplicate-id is a warning, not a hard error

A duplicate cross-question rule `id` is flagged as a warning (the editor's permissive stance;
Schema 2 doesn't enforce uniqueness). Auto-`val_N` ids avoid collisions for added rules; manual
edits can still collide (warned, not blocked).

## (kkk) Validation is display-only + live (no submit gate)

Cross-question errors compute live over the throwaway answers and display via the renderer's
`requiredErrors`/`errorMessages` (merged with per-question). There is no blocking submit gate
(the deployed viewer validates on Next; the editor preview is an authoring aid).

## (lll) Scores are inert in cross-question conditions in preview

A cross-question condition that references a `score()` evaluates that score to null in the
preview (`score: () => null`, same as the Logic panel) until ED-D4 wires the Scorer. The
authored rule is correct; only the preview can't compute the score yet.

## (mmm) Duplicate-key error merge: cross-question wins display

If a per-question and a cross-question error target the same element key, the merged
`errorMessages` keeps the cross-question message (last-written). Both indicate a problem; the
single displayed message is acceptable.

## (nnn) ED-D3 is COMPLETE; questionnaire-global panels not yet tabbed

ED-D3 (validation) is COMPLETE: D3a (per-question) + D3b (cross-question), both displayed live.
Logic + Validation now both live as sections in the questionnaire-root Inspector; when ED-D4
(scoring) adds its panel, consolidate Logic / Validation / Scoring into tabs. NEXT = ED-D4.
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
git commit -m "docs(editor): ED-D3b FOLLOWUPS (ED-D3 complete)"
```

---

## Done criteria (mirror of spec §5)

1. `validation[]` typed + edited via `updateValidation`; round-trips Schema-2-valid. — Task 1.
2. Validation panel (root Inspector, below Logic) does CRUD — auto-`val_N` id, condition `ExpressionInput`, message, targets multi-select, per-field validation. — Tasks 2, 3, 4.
3. Preview shows cross-question errors live on targets, merged with per-question. — Task 5.
4. `collectCrossQuestionErrors` faithfully mirrors the viewer. — Task 5.
5. All suites green; screenshot delivered. — Tasks 6, 7.
6. ED-D3 COMPLETE. — Task 7.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_d3b` memory + MEMORY.md line + HANDOFF update.
```
