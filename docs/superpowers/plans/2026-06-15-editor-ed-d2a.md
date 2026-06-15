# Editor ED-D2a (Navigation & Visibility Logic Rules) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a questionnaire-global Logic Rules panel (in the Inspector's root view) that does full CRUD on **skip / branch / visibility** rules — condition via the D1 `ExpressionInput`, type-specific target dropdowns, per-type semantic validation — and make the inline preview execute **visibility** rules live (skip/branch are author+validate-only).

**Architecture:** `Questionnaire.logic[]` becomes a typed `LogicRule[]`, edited via a new pure `updateLogic` Immer helper. Pure helpers `targets.ts` (page-id / element-key catalogues) and `ruleOps.ts` (`newRule`/`summarizeRule`/`validateRule`) carry the semantics the loose schema doesn't. `RuleEditor`/`LogicPanel` reuse D1's `ExpressionInput` + `useEvaluator` + `collectIdCatalogue`. The preview extends D1's `visibility.ts` with an optional `rules` param (default `[]` keeps D1 green) implementing viewer precedence: visibility-rule → `show_if` → default-visible.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind · Zustand · Immer · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/logic/targets.ts` — `collectLogicTargets(model)` → `{pageIds, elementKeys}` (pure).
- `editor/src/logic/ruleOps.ts` — `RuleIssue`, `newRule`, `summarizeRule`, `validateRule` (pure).
- `editor/src/logic/RuleEditor.tsx` — per-rule form (type select + condition + type-specific action fields + inline issues).
- `editor/src/logic/LogicPanel.tsx` — rule list + add/delete + attention count.
- Test files alongside each.

**Modify:**
- `editor/src/model/types.ts` — add `LogicRule` interface + `logic?: LogicRule[]` on `Questionnaire`.
- `editor/src/model/tree.ts` — add `updateLogic`.
- `editor/src/logic/visibility.ts` — `isElementShown` + `filterPageVisible` gain an optional `rules: LogicRule[] = []` param (visibility-rule precedence).
- `editor/src/preview/PreviewPane.tsx` — pass `model.logic ?? []` into `filterPageVisible`.
- `editor/src/inspector/Inspector.tsx` — mount `<LogicPanel />` in the `kind === 'questionnaire'` branch.
- `editor/FOLLOWUPS.md` — ED-D2a follow-ups.

---

## Task 1: Typed `LogicRule` + `updateLogic`

**Files:**
- Modify: `editor/src/model/types.ts`, `editor/src/model/tree.ts`
- Test: `editor/src/model/tree.test.ts` (append)

- [ ] **Step 1: Add the type**

In `editor/src/model/types.ts`, add (above `Questionnaire`):

```ts
export interface LogicRule {
  id?: string
  type: 'skip' | 'visibility' | 'piping' | 'branch'
  condition: string
  action: Record<string, unknown>
}
```

and add `logic?: LogicRule[]` to the `Questionnaire` interface (keep the `[k: string]: unknown` catch-all):

```ts
export interface Questionnaire {
  '@context'?: string
  metadata: Metadata
  pages: Page[]
  blocks?: Block[]
  style?: unknown
  flow?: unknown
  logic?: LogicRule[]
  [k: string]: unknown
}
```

- [ ] **Step 2: Write the failing test**

Append to `editor/src/model/tree.test.ts`:

```ts
import { updateLogic } from './tree'
import type { LogicRule } from './types'

describe('updateLogic', () => {
  const base = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as import('./types').Questionnaire
  const rule: LogicRule = { type: 'skip', condition: "q == 'y'", action: { skip_to: 'p2' } }

  it('sets logic[] and does not mutate the input', () => {
    const out = updateLogic(base, [rule])
    expect(out.logic).toEqual([rule])
    expect(base.logic).toBeUndefined()
  })
  it('replaces the whole array', () => {
    const out = updateLogic(updateLogic(base, [rule]), [{ ...rule, action: { skip_to: 'p3' } }])
    expect(out.logic).toEqual([{ ...rule, action: { skip_to: 'p3' } }])
  })
  it('deletes logic when given an empty array', () => {
    const out = updateLogic(updateLogic(base, [rule]), [])
    expect('logic' in out).toBe(false)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts`
Expected: FAIL — `updateLogic` is not exported.

- [ ] **Step 4: Implement `updateLogic`**

In `editor/src/model/tree.ts`, extend the type import and add the function:

```ts
// change the existing import to include LogicRule:
import type { Questionnaire, Block, Metadata, LogicRule } from './types'

// add near updateMetadata:
export function updateLogic(model: Questionnaire, rules: LogicRule[]): Questionnaire {
  return produce(model, (draft) => {
    if (rules.length === 0) delete draft.logic
    else draft.logic = rules
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
git commit -m "feat(editor): ED-D2a typed LogicRule + updateLogic helper"
```

---

## Task 2: `collectLogicTargets`

**Files:**
- Create: `editor/src/logic/targets.ts`, `editor/src/logic/targets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/targets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectLogicTargets } from './targets'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  pages: [
    { id: 'p1', elements: [
      { id: 'it_a', question: {}, option: {} },
      { id: 'sec1', elements: [{ id: 'it_b', question: {} }] },
    ] },
    { id: 'p2', elements: [{ id: 'it_c', question: {}, option: {} }] },
  ],
} as unknown as Questionnaire

describe('collectLogicTargets', () => {
  it('collects page ids for skip/branch targets', () => {
    expect(collectLogicTargets(model).pageIds.sort()).toEqual(['p1', 'p2'])
  })
  it('collects element + section + section-child keys for visibility targets', () => {
    expect(collectLogicTargets(model).elementKeys.sort()).toEqual(['it_a', 'it_b', 'it_c', 'sec1'].sort())
  })
  it('is safe on a model with no pages', () => {
    expect(collectLogicTargets({ metadata: { id: 'x' } } as unknown as Questionnaire)).toEqual({ pageIds: [], elementKeys: [] })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/targets.test.ts`
Expected: FAIL — `Cannot find module './targets'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/targets.ts`:

```ts
import type { Questionnaire } from '../model/types'

export interface LogicTargets { pageIds: string[]; elementKeys: string[] }

/** Targets for logic rules: page ids (skip/branch `skip_to`) + element/section keys
 *  (visibility `target_id`). Element keys are the `id` fields the renderer keys on. */
export function collectLogicTargets(model: Questionnaire): LogicTargets {
  const pageIds = new Set<string>()
  const elementKeys = new Set<string>()
  for (const page of (model.pages ?? [])) {
    if (typeof page.id === 'string') pageIds.add(page.id)
    for (const el of (page.elements ?? [])) {
      const id = (el as { id?: unknown }).id
      if (typeof id === 'string') elementKeys.add(id)
      const children = (el as { elements?: unknown }).elements
      if (Array.isArray(children)) {
        for (const c of children) {
          const cid = (c as { id?: unknown }).id
          if (typeof cid === 'string') elementKeys.add(cid)
        }
      }
    }
  }
  return { pageIds: [...pageIds], elementKeys: [...elementKeys] }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/targets.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/targets.ts editor/src/logic/targets.test.ts
git commit -m "feat(editor): ED-D2a logic target catalogue (page ids + element keys)"
```

---

## Task 3: `ruleOps` — newRule / summarizeRule / validateRule

**Files:**
- Create: `editor/src/logic/ruleOps.ts`, `editor/src/logic/ruleOps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/ruleOps.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { newRule, summarizeRule, validateRule } from './ruleOps'

const targets = { pageIds: ['p1', 'p2'], elementKeys: ['it_a', 'it_b'] }

describe('newRule', () => {
  it('skip/branch skeleton has skip_to', () => {
    expect(newRule('skip')).toEqual({ type: 'skip', condition: '', action: { skip_to: '' } })
    expect(newRule('branch')).toEqual({ type: 'branch', condition: '', action: { skip_to: '' } })
  })
  it('visibility skeleton has target_id + show', () => {
    expect(newRule('visibility')).toEqual({ type: 'visibility', condition: '', action: { target_id: '', show: false } })
  })
  it('piping skeleton has source + field_path', () => {
    expect(newRule('piping')).toEqual({ type: 'piping', condition: '', action: { source: '', field_path: '' } })
  })
})

describe('summarizeRule', () => {
  it('summarizes per type', () => {
    expect(summarizeRule({ type: 'skip', condition: 'q == 9', action: { skip_to: 'p2' } })).toBe('skip → p2 if q == 9')
    expect(summarizeRule({ type: 'visibility', condition: 'q == 1', action: { target_id: 'it_a', show: false } })).toBe('hide it_a if q == 1')
    expect(summarizeRule({ type: 'visibility', condition: 'q == 1', action: { target_id: 'it_a', show: true } })).toBe('show it_a if q == 1')
  })
})

describe('validateRule', () => {
  it('flags empty condition', () => {
    const e = validateRule({ type: 'skip', condition: '', action: { skip_to: 'p1' } }, targets).errors
    expect(e.some((x) => x.field === 'condition' && x.level === 'error')).toBe(true)
  })
  it('skip requires a skip_to and warns on unknown page', () => {
    expect(validateRule({ type: 'skip', condition: 'q==1', action: { skip_to: '' } }, targets).errors
      .some((x) => x.field === 'skip_to' && x.level === 'error')).toBe(true)
    expect(validateRule({ type: 'skip', condition: 'q==1', action: { skip_to: 'pX' } }, targets).errors
      .some((x) => x.field === 'skip_to' && x.level === 'warning')).toBe(true)
  })
  it('visibility requires target_id + boolean show, warns on unknown element', () => {
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: '', show: false } }, targets).errors
      .some((x) => x.field === 'target_id' && x.level === 'error')).toBe(true)
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'itX', show: false } }, targets).errors
      .some((x) => x.field === 'target_id' && x.level === 'warning')).toBe(true)
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'it_a' } }, targets).errors
      .some((x) => x.field === 'show' && x.level === 'error')).toBe(true)
  })
  it('a fully-valid rule has no errors', () => {
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'it_a', show: false } }, targets).errors).toEqual([])
  })
  it('flags a piping rule as deferred to D2b', () => {
    expect(validateRule({ type: 'piping', condition: 'q==1', action: { source: 'it_a', field_path: 'x' } }, targets).errors
      .some((x) => x.level === 'warning')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ruleOps.test.ts`
Expected: FAIL — `Cannot find module './ruleOps'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/ruleOps.ts`:

```ts
import type { LogicRule } from '../model/types'
import type { LogicTargets } from './targets'

export type RuleIssue = { field: string; message: string; level: 'error' | 'warning' }

export function newRule(type: LogicRule['type']): LogicRule {
  if (type === 'visibility') return { type, condition: '', action: { target_id: '', show: false } }
  if (type === 'piping') return { type, condition: '', action: { source: '', field_path: '' } }
  return { type, condition: '', action: { skip_to: '' } } // skip + branch
}

export function summarizeRule(rule: LogicRule): string {
  const cond = (rule.condition ?? '').trim() || '…'
  const a = (rule.action ?? {}) as Record<string, unknown>
  switch (rule.type) {
    case 'skip': return `skip → ${a.skip_to || '?'} if ${cond}`
    case 'branch': return `branch → ${a.skip_to || '?'} if ${cond}`
    case 'visibility': return `${a.show ? 'show' : 'hide'} ${a.target_id || '?'} if ${cond}`
    case 'piping': return `pipe ${a.source || '?'} → ${a.field_path || '?'} if ${cond}`
    default: return cond
  }
}

export function validateRule(rule: LogicRule, targets: LogicTargets): { errors: RuleIssue[] } {
  const errors: RuleIssue[] = []
  const a = (rule.action ?? {}) as Record<string, unknown>
  if (!rule.condition || !rule.condition.trim()) errors.push({ field: 'condition', message: 'Condition required', level: 'error' })
  if (rule.type === 'skip' || rule.type === 'branch') {
    const t = a.skip_to
    if (typeof t !== 'string' || !t) errors.push({ field: 'skip_to', message: 'Choose a target page', level: 'error' })
    else if (!targets.pageIds.includes(t)) errors.push({ field: 'skip_to', message: `Unknown page id: ${t}`, level: 'warning' })
  } else if (rule.type === 'visibility') {
    const t = a.target_id
    if (typeof t !== 'string' || !t) errors.push({ field: 'target_id', message: 'Choose a target element', level: 'error' })
    else if (!targets.elementKeys.includes(t)) errors.push({ field: 'target_id', message: `Unknown element: ${t}`, level: 'warning' })
    if (typeof a.show !== 'boolean') errors.push({ field: 'show', message: 'Show must be true or false', level: 'error' })
  } else if (rule.type === 'piping') {
    errors.push({ field: 'type', message: 'Piping editing arrives in ED-D2b', level: 'warning' })
  }
  return { errors }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ruleOps.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/ruleOps.ts editor/src/logic/ruleOps.test.ts
git commit -m "feat(editor): ED-D2a rule ops (newRule/summarizeRule/validateRule)"
```

---

## Task 4: `RuleEditor` component

**Files:**
- Create: `editor/src/logic/RuleEditor.tsx`, `editor/src/logic/RuleEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/RuleEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RuleEditor } from './RuleEditor'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'

const targets = { pageIds: ['p1', 'p2'], elementKeys: ['it_a', 'it_b'] }
const cat = { questionIds: ['q_x'], scoreIds: [] }
const ev = makeFakeEvaluator({})

function setup(rule: LogicRule, onChange = vi.fn()) {
  render(<RuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev} onChange={onChange} onDelete={vi.fn()} />)
  return onChange
}

describe('RuleEditor', () => {
  it('shows skip target dropdown for a skip rule', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    expect((screen.getByLabelText('Target page') as HTMLSelectElement).value).toBe('p1')
  })
  it('shows visibility target + show toggle for a visibility rule', () => {
    setup({ type: 'visibility', condition: 'q_x == 1', action: { target_id: 'it_a', show: false } })
    expect((screen.getByLabelText('Target element') as HTMLSelectElement).value).toBe('it_a')
    expect((screen.getByLabelText('Show when condition is true') as HTMLInputElement).checked).toBe(false)
  })
  it('changing type resets the action but keeps the condition', () => {
    const onChange = setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    fireEvent.change(screen.getByLabelText('Rule type'), { target: { value: 'visibility' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'visibility', condition: 'q_x == 1', action: { target_id: '', show: false } })
  })
  it('editing the skip target emits the updated rule', () => {
    const onChange = setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    fireEvent.change(screen.getByLabelText('Target page'), { target: { value: 'p2' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p2' } })
  })
  it('shows an error for a missing target', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: '' } })
    expect(screen.getByText(/choose a target page/i)).toBeInTheDocument()
  })
  it('keeps an out-of-catalogue target value selectable', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p_missing' } })
    expect((screen.getByLabelText('Target page') as HTMLSelectElement).value).toBe('p_missing')
    expect(screen.getByText(/unknown page id/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/RuleEditor.test.tsx`
Expected: FAIL — `Cannot find module './RuleEditor'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/RuleEditor.tsx`:

```tsx
import type { LogicRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { IdCatalogue } from './ids'
import type { LogicEvaluator } from './types'
import { newRule, validateRule } from './ruleOps'
import { ExpressionInput } from './ExpressionInput'

const TYPES: LogicRule['type'][] = ['skip', 'branch', 'visibility', 'piping']

function TargetSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  const opts = value && !options.includes(value) ? [value, ...options] : options
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 block w-full rounded border border-slate-300 px-1 py-0.5 text-sm">
      <option value="">— choose —</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function RuleEditor({ rule, targets, catalogue, evaluator, onChange, onDelete }: {
  rule: LogicRule
  targets: LogicTargets
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
  onChange: (rule: LogicRule) => void
  onDelete: () => void
}) {
  const a = (rule.action ?? {}) as Record<string, unknown>
  const issues = validateRule(rule, targets).errors
  const setAction = (patch: Record<string, unknown>) => onChange({ ...rule, action: { ...rule.action, ...patch } })
  const changeType = (type: LogicRule['type']) =>
    onChange({ ...newRule(type), condition: rule.condition, ...(rule.id ? { id: rule.id } : {}) })

  return (
    <div className="space-y-2 rounded border border-slate-200 p-2">
      <div className="flex items-center gap-2">
        <select aria-label="Rule type" value={rule.type} onChange={(e) => changeType(e.target.value as LogicRule['type'])}
          className="rounded border border-slate-300 px-1 py-0.5 text-sm">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" aria-label="Delete rule" onClick={onDelete}
          className="ml-auto rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
      </div>

      <div className="text-xs font-medium text-slate-500">Condition</div>
      <ExpressionInput value={rule.condition} onChange={(v) => onChange({ ...rule, condition: v })}
        catalogue={catalogue} evaluator={evaluator} />

      {(rule.type === 'skip' || rule.type === 'branch') && (
        <div>
          <div className="text-xs font-medium text-slate-500">Go to page</div>
          <TargetSelect label="Target page" value={String(a.skip_to ?? '')} options={targets.pageIds}
            onChange={(v) => setAction({ skip_to: v })} />
          <p className="mt-0.5 text-[11px] text-slate-400">Navigation — runs in the deployed viewer (not shown in preview).</p>
        </div>
      )}

      {rule.type === 'visibility' && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500">Target element</div>
          <TargetSelect label="Target element" value={String(a.target_id ?? '')} options={targets.elementKeys}
            onChange={(v) => setAction({ target_id: v })} />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" aria-label="Show when condition is true" checked={a.show === true}
              onChange={(e) => setAction({ show: e.target.checked })} />
            Show when condition is true (unchecked = hide)
          </label>
        </div>
      )}

      {rule.type === 'piping' && <p className="text-xs text-amber-600">Piping editing arrives in ED-D2b.</p>}

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

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/RuleEditor.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/RuleEditor.tsx editor/src/logic/RuleEditor.test.tsx
git commit -m "feat(editor): ED-D2a RuleEditor (skip/branch/visibility, type-aware fields + validation)"
```

---

## Task 5: `LogicPanel` + Inspector mount

**Files:**
- Create: `editor/src/logic/LogicPanel.tsx`, `editor/src/logic/LogicPanel.test.tsx`
- Modify: `editor/src/inspector/Inspector.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/LogicPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('./useEvaluator', async () => {
  const real = await import('./evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { LogicPanel } from './LogicPanel'
import { Inspector } from '../inspector/Inspector'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
  pages: [{ id: 'p1', elements: [{ id: 'it_a', question: {}, option: {} }] }, { id: 'p2', elements: [] }],
} as unknown as Questionnaire

describe('LogicPanel', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('adds a rule via + Add rule', () => {
    render(<LogicPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    expect(useEditorStore.getState().model!.logic?.length).toBe(1)
  })

  it('deletes a rule', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, logic: [{ type: 'skip', condition: 'q==1', action: { skip_to: 'p2' } }] }))
    render(<LogicPanel />)
    fireEvent.click(screen.getByRole('button', { name: /edit rule 1/i })) // open the rule editor
    fireEvent.click(screen.getByRole('button', { name: /delete rule/i }))
    expect(useEditorStore.getState().model!.logic).toBeUndefined()
  })

  it('shows an attention count for invalid rules', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, logic: [{ type: 'skip', condition: '', action: { skip_to: '' } }] }))
    render(<LogicPanel />)
    expect(screen.getByText(/need.* attention/i)).toBeInTheDocument()
  })
})

describe('Inspector mounts LogicPanel at the questionnaire root', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('shows Logic rules when nothing is selected (root)', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    expect(screen.getByText(/logic rules/i)).toBeInTheDocument()
  })
  it('does not show Logic rules when a page is selected', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    expect(screen.queryByText(/logic rules/i)).not.toBeInTheDocument()
  })
})
```

> Note: the delete test opens the rule editor by clicking the rule summary row, then clicks "Delete rule". If the summary-row accessible name differs, click the summary text (`screen.getByText(/skip/)`); the assertion that matters is `logic` becomes `undefined` after delete. Adjust the row-open click to match the implemented summary button.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/LogicPanel.test.tsx`
Expected: FAIL — `Cannot find module './LogicPanel'`.

- [ ] **Step 3: Implement `LogicPanel`**

Create `editor/src/logic/LogicPanel.tsx`:

```tsx
import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { updateLogic } from '../model/tree'
import type { LogicRule } from '../model/types'
import { collectLogicTargets } from './targets'
import { collectIdCatalogue } from './ids'
import { useEvaluator } from './useEvaluator'
import { newRule, summarizeRule, validateRule } from './ruleOps'
import { RuleEditor } from './RuleEditor'

export function LogicPanel() {
  const { model, pool, applyEdit } = useEditorStore()
  const evaluator = useEvaluator()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (!model) return null
  const rules = (model.logic ?? []) as LogicRule[]
  const targets = collectLogicTargets(model)
  const catalogue = collectIdCatalogue(model, pool)
  const attention = rules.filter((r) => validateRule(r, targets).errors.some((e) => e.level === 'error')).length

  const write = (next: LogicRule[]) => applyEdit((m) => updateLogic(m, next))
  const add = () => { const next = [...rules, newRule('skip')]; write(next); setOpenIdx(next.length - 1) }
  const edit = (i: number, rule: LogicRule) => write(rules.map((r, j) => (j === i ? rule : r)))
  const del = (i: number) => { write(rules.filter((_, j) => j !== i)); setOpenIdx(null) }

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Logic rules</h4>
        {attention > 0 && <span className="text-[11px] text-red-600">{attention} need{attention === 1 ? 's' : ''} attention</span>}
        <button type="button" onClick={add}
          className="ml-auto rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">+ Add rule</button>
      </div>
      {rules.length === 0 && <p className="text-[11px] text-slate-400">No logic rules yet.</p>}
      <ul className="space-y-1">
        {rules.map((r, i) => (
          <li key={i}>
            <button type="button" aria-label={`Edit rule ${i + 1}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="block w-full truncate rounded px-1 py-0.5 text-left font-mono text-xs hover:bg-slate-50">
              {summarizeRule(r)}
            </button>
            {openIdx === i && (
              <div className="mt-1">
                <RuleEditor rule={r} targets={targets} catalogue={catalogue} evaluator={evaluator}
                  onChange={(rule) => edit(i, rule)} onDelete={() => del(i)} />
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
import { LogicPanel } from '../logic/LogicPanel'
```

In the `kind === 'questionnaire'` branch, add `<LogicPanel />` just before the branch's closing `</div>` (after the Language `TextField`):

```tsx
        <TextField label="Language" value={m.language ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { language: v }))} />
        <LogicPanel />
      </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/LogicPanel.test.tsx`
Expected: PASS (LogicPanel add/delete/attention + Inspector mount present/absent). If the delete-test's row-open click needs adjusting to the implemented `aria-label="Edit rule 1"`, do so (it's already provided above).

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/LogicPanel.tsx editor/src/logic/LogicPanel.test.tsx editor/src/inspector/Inspector.tsx
git commit -m "feat(editor): ED-D2a LogicPanel (CRUD) mounted in the questionnaire-root Inspector"
```

---

## Task 6: Preview executes visibility rules

**Files:**
- Modify: `editor/src/logic/visibility.ts`, `editor/src/preview/PreviewPane.tsx`
- Create: `editor/src/logic/visibilityRules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/visibilityRules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { makeBindings, isElementShown, filterPageVisible } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

const ev = makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const hideRule: LogicRule = { type: 'visibility', condition: "q == 'yes'", action: { target_id: 'it_x', show: false } }

describe('isElementShown with visibility rules', () => {
  it('hides the target when a hide-rule condition holds', () => {
    expect(isElementShown({ id: 'it_x' }, ev, binds({ q: 'yes' }), [hideRule])).toBe(false)
  })
  it('shows the target when the rule condition is false (falls through to default)', () => {
    expect(isElementShown({ id: 'it_x' }, ev, binds({ q: 'no' }), [hideRule])).toBe(true)
  })
  it('a visibility rule takes precedence over show_if', () => {
    // show_if would show it (q==yes true), but the hide-rule wins
    const el = { id: 'it_x', show_if: "q == 'yes'" }
    expect(isElementShown(el, ev, binds({ q: 'yes' }), [hideRule])).toBe(false)
  })
  it('ignores rules targeting a different element', () => {
    expect(isElementShown({ id: 'it_other' }, ev, binds({ q: 'yes' }), [hideRule])).toBe(true)
  })
  it('malformed rule condition is skipped (element falls through to visible)', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(isElementShown({ id: 'it_x' }, evBad, binds({ q: 'yes' }), [hideRule])).toBe(true)
  })
  it('default rules=[] preserves D1 behaviour', () => {
    expect(isElementShown({ id: 'it_x', show_if: "q == 'yes'" }, ev, binds({ q: 'no' }))).toBe(false)
  })
})

describe('filterPageVisible threads rules', () => {
  it('drops a page element hidden by a visibility rule', () => {
    const page = { id: 'p1', elements: [{ id: 'it_x' }, { id: 'it_y' }] } as unknown as RuntimePage
    const out = filterPageVisible(page, ev, binds({ q: 'yes' }), [hideRule])
    expect(out.elements.map((e) => (e as { id: string }).id)).toEqual(['it_y'])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/visibilityRules.test.ts`
Expected: FAIL — `isElementShown`/`filterPageVisible` don't accept a 4th `rules` arg (TS error or wrong result).

- [ ] **Step 3: Extend `visibility.ts`**

Replace the body of `editor/src/logic/visibility.ts` with (add the `LogicRule` import + the `rules` param; keep `makeBindings` + `isSectionEl` unchanged):

```ts
import type { RuntimeElement, RuntimePage } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator, ScoreResolver } from './types'
import type { LogicRule } from '../model/types'

/** Answers-first bindings with a score fall-through (port of web-viewer makeBindings). */
export function makeBindings(answers: Record<string, unknown>, resolver: ScoreResolver): Bindings {
  return {
    var(id) {
      if (id in answers) return answers[id]
      const s = resolver.score(id)
      return s ?? null
    },
    score: (id) => resolver.score(id) ?? null,
  }
}

function isSectionEl(el: unknown): el is { elements: RuntimeElement[] } {
  return !!el && typeof el === 'object' && Array.isArray((el as { elements?: unknown }).elements)
}

/** Viewer precedence: a matching valid `visibility` rule whose condition holds decides
 *  (`show`), else the element's `show_if`, else visible. Malformed conditions are skipped
 *  (false-safe to shown), matching the web-viewer + ED-D1. */
export function isElementShown(el: unknown, ev: LogicEvaluator, bindings: Bindings, rules: LogicRule[] = []): boolean {
  const id = (el as { id?: unknown }).id
  if (typeof id === 'string') {
    for (const r of rules) {
      if (r.type !== 'visibility') continue
      if ((r.action as { target_id?: unknown }).target_id !== id) continue
      const cond = r.condition
      if (typeof cond === 'string' && cond.length > 0 && ev.check(cond) === null && ev.condition(cond, bindings)) {
        return (r.action as { show?: unknown }).show !== false
      }
    }
  }
  const expr = (el as { show_if?: unknown }).show_if
  if (typeof expr !== 'string' || expr.length === 0) return true
  if (ev.check(expr) !== null) return true // malformed -> shown
  return ev.condition(expr, bindings)
}

/** New page with hidden page-elements and hidden section children pruned. */
export function filterPageVisible(page: RuntimePage, ev: LogicEvaluator, bindings: Bindings, rules: LogicRule[] = []): RuntimePage {
  const elements = page.elements
    .filter((el) => isElementShown(el, ev, bindings, rules))
    .map((el) => (isSectionEl(el)
      ? { ...el, elements: el.elements.filter((c) => isElementShown(c, ev, bindings, rules)) }
      : el))
  return { ...page, elements } as RuntimePage
}
```

- [ ] **Step 4: Wire rules into `PreviewPane`**

In `editor/src/preview/PreviewPane.tsx`, change the `visiblePages` line (currently `filterPageVisible(p, evaluator, bindings)`) to thread the model's logic rules:

```tsx
  const visiblePages = evaluator ? pages.map((p) => filterPageVisible(p, evaluator, bindings, model.logic ?? [])) : pages
```

(`model` is non-null after the early return; `model.logic` is `LogicRule[] | undefined` per Task 1, so `model.logic ?? []` typechecks. `filterPageVisible` only acts on `type:visibility` rules, so passing all rules is fine.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/visibilityRules.test.ts src/logic/visibility.test.ts src/preview/PreviewVisibility.test.tsx`
Expected: PASS — the new rule tests + the D1 visibility + D1 preview tests all green (back-compat preserved).

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/visibility.ts editor/src/logic/visibilityRules.test.ts editor/src/preview/PreviewPane.tsx
git commit -m "feat(editor): ED-D2a preview executes visibility rules (rule → show_if → default)"
```

---

## Task 7: Playwright smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/logic-rule.spec.ts`

Reuse the D1 bundle fixture `editor/src/__fixtures__/show_if_demo.json` (two items `it_control` [choice yes/no] + `it_dependent` [text], pinned prompt refs, `entities` map). Mirror `editor/tests/e2e/show-if.spec.ts` for the stubbed `**/v1/entities/**` route + bundle load.

- [ ] **Step 1: Write the smoke spec**

Create `editor/tests/e2e/logic-rule.spec.ts`. It must: load the bundle (stub the entity endpoint), confirm the Inspector shows "Logic rules" at the root (nothing selected on load), click "+ Add rule", set the rule type to `visibility`, choose target element `it_dependent`, leave Show unchecked (= hide), type the condition `it_control == 'yes'`, open the preview, assert the dependent prompt ("Bonus question revealed!") is VISIBLE before answering, click "Yes", assert it is now HIDDEN, and screenshot to `tests/e2e/screenshots/ed-d2a-logic-rule.png`.

```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a visibility rule hides an element in the preview when its condition holds', async ({ page }) => {
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Logic panel is in the questionnaire-root Inspector (nothing selected on load).
  await expect(page.getByText(/logic rules/i)).toBeVisible()
  await page.getByRole('button', { name: /add rule/i }).click()
  await page.getByLabel('Rule type').selectOption('visibility')
  await page.getByLabel('Target element').selectOption('it_dependent')
  // Show is unchecked by default → hide-when-true.
  await page.getByLabel('Expression').fill("it_control == 'yes'")

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Scope').selectOption('all')
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()

  await preview.getByText('Yes').click()
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toHaveCount(0)

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d2a-logic-rule.png', fullPage: true })
})
```

> Use `page.getByLabel(...)` / `page.getByRole(...)` (Playwright lacks `getByLabelText`/`getByDisplayValue`). The rule editor must be open after "+ Add rule" (LogicPanel sets `openIdx` to the new rule) so `Rule type` / `Target element` / `Expression` are visible. If the new rule doesn't auto-open, click its summary row first.

- [ ] **Step 2: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- logic-rule`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-d2a-logic-rule.png`. (If chromium isn't installed: `npx playwright install chromium` first. If it cannot run here, commit the spec anyway — CI/local runs it — and report the exact failure; do NOT weaken the assertions.)

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/logic-rule.spec.ts
git commit -m "test(editor): ED-D2a Playwright visibility-rule smoke + screenshot"
```

---

## Task 8: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-D2a follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-D2a Follow-ups

Known limitations and open items carried out of ED-D2a (navigation & visibility logic rules).

## (uu) Skip/branch are author + validate only (no preview navigation)

The editor preview renders a page / all pages with throwaway answers; it has no page-to-page
navigation runtime, so `skip` and `branch` rules cannot be demonstrated in preview. They are
authored + semantically validated and labelled "runs in the deployed viewer". A mini
navigation preview is a possible later refinement.

## (vv) Piping + randomization are ED-D2b

Piping rule authoring (source + field_path picker + same-page piping preview) and the
randomization checkboxes (`Page/Section/Block.randomize`, `flow.randomize_pages`) are ED-D2b.
ED-D2a renders a piping rule's summary + a "editing arrives in D2b" note but does not author it.
Option-order randomization is not in Schema 2 v26.0602 (out of scope entirely).

## (ww) Branch has no explicit else-target

Schema `branch` uses `action.skip_to` for the true path; the false path falls through to the
next step (the viewer's `nextStepIndex` model). There is no second target field. The editor
authors `skip_to` only; the implicit else-to-next is documented, not configured.

## (xx) Logic-rule conditions are expression-first (no per-clause builder)

Rule conditions use the shared `ExpressionInput` (+ insert-condition helper). A structured
multi-clause AND/OR builder is deferred (same stance as ED-D1).

## (yy) Questionnaire-global panels not yet tabbed

Logic lives as a section in the questionnaire-root Inspector. When ED-D3 (validation) and
ED-D4 (scoring) add their own global panels, consolidate them into tabs.
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass (D1 178 + the new D2a suites).

- [ ] **Step 3: Production build smoke (no regressions)**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: succeeds (renderer + evaluator prebuild, tsc, vite build), emits the wasm asset as in D1.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-D2a FOLLOWUPS"
```

---

## Done criteria (mirror of spec §6)

1. `logic[]` typed + edited via `updateLogic`; round-trips Schema-2-valid. — Task 1.
2. Logic panel (questionnaire-root Inspector) does CRUD on skip/branch/visibility with condition `ExpressionInput` + type-specific target dropdowns + per-type semantic validation. — Tasks 3, 4, 5.
3. Preview executes visibility rules live (rule → show_if → default). — Task 6.
4. Skip/branch authored + validated, labelled "runs in the deployed viewer". — Tasks 4, 8.
5. All suites green; screenshot delivered. — Tasks 7, 8.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_d2a` memory + MEMORY.md line + HANDOFF update (the established post-merge ritual).
```
