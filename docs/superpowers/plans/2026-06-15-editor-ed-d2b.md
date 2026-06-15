# Editor ED-D2b (Piping + Randomization) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add piping authoring (a `source` question dropdown + a `field_path` prompt-target picker emitting the canonical `pages.{id}.elements.{idx}.prompt`) with live same-page piping in the inline preview, plus the randomization checkboxes (`Page`/`Section`/`Block.randomize`, `flow.randomize_pages`) — completing ED-D2.

**Architecture:** Two pure helpers — `pipingTargets.ts` (`collectPipingTargets` → prompt-bearing items) and `piping.ts` (`pipedText` + `applyPiping`, a faithful port of the web-viewer's app-layer prompt rewrite). The D2a `RuleEditor`/`LogicPanel`/`validateRule` gain a piping branch; `PreviewPane` pipes the FULL pages (stable indices) then filters visibility. Randomization is plain booleans edited via `updateNodeProps`/`unsetNodeProp` + a new `updateFlow` helper, surfaced as `CheckboxField`s in the Inspector.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind · Zustand · Immer · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/logic/pipingTargets.ts` — `PipingTarget`, `collectPipingTargets(model)` (pure).
- `editor/src/logic/piping.ts` — `pipedText`, `applyPiping` (pure).
- Test files alongside each.

**Modify:**
- `editor/src/logic/ruleOps.ts` — `validateRule` gains a 3rd `pipingPaths` arg + a real piping branch.
- `editor/src/logic/RuleEditor.tsx` — piping branch (source dropdown + field_path label-picker) + new `pipingTargets` prop; thread `pipingPaths` into `validateRule`.
- `editor/src/logic/LogicPanel.tsx` — compute + pass `pipingTargets`; pass `pipingPaths` to `validateRule`.
- `editor/src/model/tree.ts` — add `updateFlow`.
- `editor/src/inspector/fields.tsx` — add `CheckboxField`.
- `editor/src/inspector/Inspector.tsx` — randomize checkboxes (page/section/block/root).
- `editor/src/preview/PreviewPane.tsx` — pipe-then-filter.
- `editor/FOLLOWUPS.md` — ED-D2b follow-ups.

---

## Task 1: `collectPipingTargets`

**Files:**
- Create: `editor/src/logic/pipingTargets.ts`, `editor/src/logic/pipingTargets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/pipingTargets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectPipingTargets } from './pipingTargets'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  pages: [
    { id: 'p1', title: 'Page 1', elements: [
      { id: 'it_inline', question: {}, option: {} },   // inline item
      { ref: 'it_saved@v26.0601' },                     // saved item ref
      { ref: 'msg_intro@v26.0601' },                    // message → excluded
      { id: 'sec1', elements: [{ id: 'it_child', question: {} }] }, // section → excluded (not a top-level prompt)
    ] },
  ],
} as unknown as Questionnaire

describe('collectPipingTargets', () => {
  it('emits one target per top-level item (inline + saved-item-ref), with canonical paths', () => {
    const t = collectPipingTargets(model)
    expect(t.map((x) => x.fieldPath)).toEqual([
      'pages.p1.elements.0.prompt',
      'pages.p1.elements.1.prompt',
    ])
  })
  it('labels with page + element id (or index)', () => {
    const t = collectPipingTargets(model)
    expect(t[0].label).toContain('Page 1')
    expect(t[0].label).toContain('it_inline')
  })
  it('excludes messages and sections', () => {
    const paths = collectPipingTargets(model).map((x) => x.fieldPath)
    expect(paths).not.toContain('pages.p1.elements.2.prompt') // message
    expect(paths).not.toContain('pages.p1.elements.3.prompt') // section
  })
  it('is null-safe', () => {
    expect(collectPipingTargets({ metadata: { id: 'x' } } as unknown as Questionnaire)).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/pipingTargets.test.ts`
Expected: FAIL — `Cannot find module './pipingTargets'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/pipingTargets.ts`:

```ts
import type { Questionnaire } from '../model/types'

export interface PipingTarget { fieldPath: string; label: string }

/** True for a top-level item element: an inline item (has `question`) or a saved-item ref
 *  (`ref` starting `it_`). Messages (`msg_`) and sections (`elements`) are not prompt targets. */
function isItemElement(el: unknown): boolean {
  if (!el || typeof el !== 'object') return false
  if ('question' in el) return true
  const ref = (el as { ref?: unknown }).ref
  return typeof ref === 'string' && ref.startsWith('it_')
}

/** Piping targets: one question-prompt path per top-level item, in the canonical
 *  `pages.{pageId}.elements.{index}.prompt` format the Web Viewer matches against. */
export function collectPipingTargets(model: Questionnaire): PipingTarget[] {
  const out: PipingTarget[] = []
  for (const page of (model.pages ?? [])) {
    (page.elements ?? []).forEach((el, i) => {
      if (!isItemElement(el)) return
      const id = (el as { id?: unknown }).id
      out.push({
        fieldPath: `pages.${page.id}.elements.${i}.prompt`,
        label: `${page.title ?? page.id} › ${typeof id === 'string' ? id : '#' + i}`,
      })
    })
  }
  return out
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/pipingTargets.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/pipingTargets.ts editor/src/logic/pipingTargets.test.ts
git commit -m "feat(editor): ED-D2b piping target catalogue (prompt-bearing items)"
```

---

## Task 2: `pipedText` + `applyPiping`

**Files:**
- Create: `editor/src/logic/piping.ts`, `editor/src/logic/piping.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/logic/piping.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pipedText, applyPiping } from './piping'
import { makeBindings } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

const ev = makeFakeEvaluator({ 'true': true, "named == 'x'": (b) => b.var('named') === 'x' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const path = 'pages.p1.elements.0.prompt'
const rule: LogicRule = { type: 'piping', condition: 'true', action: { source: 'q_name', field_path: path } }

describe('pipedText', () => {
  it('returns the source answer when a piping rule fires', () => {
    expect(pipedText(path, 'Hi NAME', [rule], ev, binds({ q_name: 'Sam' }))).toBe('Sam')
  })
  it('joins array source values with ", "', () => {
    expect(pipedText(path, 'orig', [rule], ev, binds({ q_name: ['a', 'b'] }))).toBe('a, b')
  })
  it('returns original when no rule matches the field path', () => {
    expect(pipedText('pages.p1.elements.9.prompt', 'orig', [rule], ev, binds({ q_name: 'Sam' }))).toBe('orig')
  })
  it('returns original when the source value is nullish', () => {
    expect(pipedText(path, 'orig', [rule], ev, binds({}))).toBe('orig')
  })
  it('returns original when the condition is false', () => {
    const r2: LogicRule = { type: 'piping', condition: "named == 'x'", action: { source: 'q_name', field_path: path } }
    expect(pipedText(path, 'orig', [r2], ev, binds({ named: 'y', q_name: 'Sam' }))).toBe('orig')
  })
  it('returns original when the condition is malformed (false-safe)', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(pipedText(path, 'orig', [rule], evBad, binds({ q_name: 'Sam' }))).toBe('orig')
  })
})

describe('applyPiping', () => {
  const page = { id: 'p1', elements: [
    { id: 'it_0', question: { prompt: { content: { en: { status: 'complete', text: 'Hello' } } } } },
    { id: 'it_1', question: { prompt: { content: { en: { status: 'complete', text: 'Other' } } } } },
  ] } as unknown as RuntimePage

  it('rewrites the matched element prompt for the active locale; leaves others', () => {
    const out = applyPiping(page, [rule], ev, binds({ q_name: 'Sam' }), 'en')
    const e0 = out.elements[0] as { question: { prompt: { content: { en: { text: string } } } } }
    const e1 = out.elements[1] as { question: { prompt: { content: { en: { text: string } } } } }
    expect(e0.question.prompt.content.en.text).toBe('Sam')
    expect(e1.question.prompt.content.en.text).toBe('Other')
  })
  it('does not mutate the input page', () => {
    applyPiping(page, [rule], ev, binds({ q_name: 'Sam' }), 'en')
    expect((page.elements[0] as { question: { prompt: { content: { en: { text: string } } } } }).question.prompt.content.en.text).toBe('Hello')
  })
  it('returns elements unchanged when nothing pipes', () => {
    const out = applyPiping(page, [], ev, binds({}), 'en')
    expect(out.elements[0]).toBe(page.elements[0])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/piping.test.ts`
Expected: FAIL — `Cannot find module './piping'`.

- [ ] **Step 3: Implement**

Create `editor/src/logic/piping.ts`:

```ts
import type { RuntimePage } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator } from './types'
import type { LogicRule } from '../model/types'

/** Port of web-viewer `pipedText`: the text to render for `fieldPath`, applying the first
 *  firing piping rule. The `ev.check` guard is the editor's addition (it doesn't pre-compile
 *  rules) — a malformed condition is skipped (false-safe to original). */
export function pipedText(fieldPath: string, original: string, rules: LogicRule[], ev: LogicEvaluator, bindings: Bindings): string {
  for (const r of rules) {
    if (r.type !== 'piping') continue
    const a = r.action as { field_path?: unknown; source?: unknown }
    if (a.field_path !== fieldPath) continue
    const cond = r.condition
    if (typeof cond !== 'string' || cond.length === 0 || ev.check(cond) !== null) continue
    if (!ev.condition(cond, bindings)) continue
    const v = bindings.var(String(a.source ?? ''))
    if (v === null || v === undefined) return original
    return Array.isArray(v) ? v.join(', ') : String(v)
  }
  return original
}

/** New page with each top-level item's `question.prompt.content[locale].text` rewritten by a
 *  firing piping rule. `i` is the element position in the page passed in — call on the FULL
 *  (unfiltered) page so `i` matches the authored `field_path` index. Mirrors the viewer App. */
export function applyPiping(page: RuntimePage, rules: LogicRule[], ev: LogicEvaluator, bindings: Bindings, locale: string): RuntimePage {
  const elements = page.elements.map((el, i) => {
    const q = (el as { question?: { prompt?: { content?: Record<string, { text?: unknown }> } } }).question
    const content = q?.prompt?.content
    const orig = content?.[locale]?.text
    if (typeof orig !== 'string') return el
    const piped = pipedText(`pages.${page.id}.elements.${i}.prompt`, orig, rules, ev, bindings)
    if (piped === orig) return el
    return {
      ...(el as object),
      question: { ...q, prompt: { ...q!.prompt, content: { ...content, [locale]: { ...content![locale], text: piped } } } },
    }
  })
  return { ...page, elements } as RuntimePage
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/piping.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/piping.ts editor/src/logic/piping.test.ts
git commit -m "feat(editor): ED-D2b pipedText + applyPiping (port of viewer prompt-rewrite)"
```

---

## Task 3: `validateRule` piping branch (3rd arg)

**Files:**
- Modify: `editor/src/logic/ruleOps.ts`
- Test: `editor/src/logic/ruleOps.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/logic/ruleOps.test.ts`:

```ts
describe('validateRule — piping (D2b)', () => {
  const targets = { pageIds: ['p1'], elementKeys: ['it_a'] }
  const paths = ['pages.p1.elements.0.prompt']

  it('flags empty source and empty field_path as errors', () => {
    const e = validateRule({ type: 'piping', condition: 'true', action: { source: '', field_path: '' } }, targets, paths).errors
    expect(e.some((x) => x.field === 'source' && x.level === 'error')).toBe(true)
    expect(e.some((x) => x.field === 'field_path' && x.level === 'error')).toBe(true)
  })
  it('warns on an unknown field_path target', () => {
    const e = validateRule({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p9.elements.0.prompt' } }, targets, paths).errors
    expect(e.some((x) => x.field === 'field_path' && x.level === 'warning')).toBe(true)
  })
  it('a fully-valid piping rule has no errors, and no source-unknown warning', () => {
    const e = validateRule({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p1.elements.0.prompt' } }, targets, paths).errors
    expect(e).toEqual([])
  })
  it('back-compat: 2-arg calls still work for non-piping rules', () => {
    expect(validateRule({ type: 'skip', condition: 'q==1', action: { skip_to: 'p1' } }, targets).errors).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ruleOps.test.ts`
Expected: FAIL — the piping branch still pushes the "arrives in ED-D2b" warning, so a valid piping rule is not error-free / source+field_path errors absent.

- [ ] **Step 3: Update `validateRule`**

In `editor/src/logic/ruleOps.ts`, change the signature and replace the `piping` branch:

```ts
export function validateRule(rule: LogicRule, targets: LogicTargets, pipingPaths: string[] = []): { errors: RuleIssue[] } {
```

Replace the existing piping branch:

```ts
  } else if (rule.type === 'piping') {
    errors.push({ field: 'type', message: 'Piping editing arrives in ED-D2b', level: 'warning' })
  }
```

with:

```ts
  } else if (rule.type === 'piping') {
    const src = a.source
    if (typeof src !== 'string' || !src) errors.push({ field: 'source', message: 'Choose a source question', level: 'error' })
    const fp = a.field_path
    if (typeof fp !== 'string' || !fp) errors.push({ field: 'field_path', message: 'Choose a target prompt', level: 'error' })
    else if (!pipingPaths.includes(fp)) errors.push({ field: 'field_path', message: `Unknown target: ${fp}`, level: 'warning' })
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/ruleOps.test.ts`
Expected: PASS (the prior ruleOps tests + the new piping describe).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/ruleOps.ts editor/src/logic/ruleOps.test.ts
git commit -m "feat(editor): ED-D2b validateRule piping branch (source/field_path, 3rd-arg pipingPaths)"
```

---

## Task 4: `RuleEditor` piping fields + `LogicPanel` threading

**Files:**
- Modify: `editor/src/logic/RuleEditor.tsx`, `editor/src/logic/LogicPanel.tsx`
- Test: `editor/src/logic/RuleEditor.test.tsx` (append)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/logic/RuleEditor.test.tsx` (the file's existing imports already include `render, screen, fireEvent, vi`, `RuleEditor`, `makeFakeEvaluator`, `LogicRule`, plus `targets`/`cat`/`ev`/`setup`; add a `pipingTargets` const and pass it):

```ts
const pipingTargets = [{ fieldPath: 'pages.p1.elements.0.prompt', label: 'Page 1 › it_a' }]

describe('RuleEditor — piping (D2b)', () => {
  function setupPiping(rule: LogicRule, onChange = vi.fn()) {
    render(<RuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev}
      pipingTargets={pipingTargets} onChange={onChange} onDelete={vi.fn()} />)
    return onChange
  }
  it('renders a source dropdown and a field_path picker for a piping rule', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p1.elements.0.prompt' } })
    expect((screen.getByLabelText('Source question') as HTMLSelectElement).value).toBe('q_x')
    expect((screen.getByLabelText('Target prompt') as HTMLSelectElement).value).toBe('pages.p1.elements.0.prompt')
  })
  it('the field_path picker shows the human label', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p1.elements.0.prompt' } })
    expect(screen.getByText('Page 1 › it_a')).toBeInTheDocument()
  })
  it('editing the source emits the updated rule', () => {
    const onChange = setupPiping({ type: 'piping', condition: 'true', action: { source: '', field_path: '' } })
    fireEvent.change(screen.getByLabelText('Source question'), { target: { value: 'q_x' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: '' } })
  })
  it('flags a missing target', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: '' } })
    expect(screen.getByText(/choose a target prompt/i)).toBeInTheDocument()
  })
})
```

> The shared `setup` in this file currently renders `RuleEditor` without a `pipingTargets` prop. After Step 3 makes `pipingTargets` a required prop, update the existing `setup` helper to pass `pipingTargets={[]}` so the prior (skip/branch/visibility) tests still compile + pass. Make that edit as part of Step 3.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/RuleEditor.test.tsx`
Expected: FAIL — `Source question` / `Target prompt` not found (piping branch still shows the "arrives in D2b" note); and/or a TS error on the missing `pipingTargets` prop.

- [ ] **Step 3: Update `RuleEditor`**

In `editor/src/logic/RuleEditor.tsx`:

(a) Add the `PipingTarget` import and the prop:

```tsx
import type { PipingTarget } from './pipingTargets'
```

Change the props type + destructure to add `pipingTargets`:

```tsx
export function RuleEditor({ rule, targets, catalogue, evaluator, pipingTargets, onChange, onDelete }: {
  rule: LogicRule
  targets: LogicTargets
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
  pipingTargets: PipingTarget[]
  onChange: (rule: LogicRule) => void
  onDelete: () => void
}) {
```

(b) Thread `pipingPaths` into `validateRule`:

```tsx
  const issues = validateRule(rule, targets, pipingTargets.map((t) => t.fieldPath)).errors
```

(c) Add a label-aware select helper next to `TargetSelect`:

```tsx
function LabeledSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  const opts = value && !options.some((o) => o.value === value) ? [{ value, label: value }, ...options] : options
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 block w-full rounded border border-slate-300 px-1 py-0.5 text-sm">
      <option value="">— choose —</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
```

(d) Replace the piping branch:

```tsx
      {rule.type === 'piping' && <p className="text-xs text-amber-600">Piping editing arrives in ED-D2b.</p>}
```

with:

```tsx
      {rule.type === 'piping' && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500">Source question (answer to insert)</div>
          <TargetSelect label="Source question" value={String(a.source ?? '')} options={catalogue.questionIds}
            onChange={(v) => setAction({ source: v })} />
          <div className="text-xs font-medium text-slate-500">Target prompt</div>
          <LabeledSelect label="Target prompt" value={String(a.field_path ?? '')}
            options={pipingTargets.map((t) => ({ value: t.fieldPath, label: t.label }))}
            onChange={(v) => setAction({ field_path: v })} />
        </div>
      )}
```

- [ ] **Step 4: Update `LogicPanel` to pass `pipingTargets` + `pipingPaths`**

In `editor/src/logic/LogicPanel.tsx`:

Add the import:

```tsx
import { collectPipingTargets } from './pipingTargets'
```

After `const targets = collectLogicTargets(model)` add:

```tsx
  const pipingTargets = collectPipingTargets(model)
  const pipingPaths = pipingTargets.map((t) => t.fieldPath)
```

Change the attention count to thread `pipingPaths`:

```tsx
  const attention = rules.filter((r) => validateRule(r, targets, pipingPaths).errors.some((e) => e.level === 'error')).length
```

Pass `pipingTargets` to `RuleEditor`:

```tsx
                <RuleEditor rule={r} targets={targets} catalogue={catalogue} evaluator={evaluator}
                  pipingTargets={pipingTargets} onChange={(rule) => edit(i, rule)} onDelete={() => del(i)} />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/logic/RuleEditor.test.tsx src/logic/LogicPanel.test.tsx`
Expected: PASS — the new piping tests + the existing RuleEditor (skip/branch/visibility, now passing `pipingTargets={[]}` via the updated `setup`) + LogicPanel tests.

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/logic/RuleEditor.tsx editor/src/logic/RuleEditor.test.tsx editor/src/logic/LogicPanel.tsx
git commit -m "feat(editor): ED-D2b piping authoring (source dropdown + field_path picker)"
```

---

## Task 5: Preview pipes live (pipe-then-filter)

**Files:**
- Modify: `editor/src/preview/PreviewPane.tsx`
- Create: `editor/src/preview/PreviewPiping.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/preview/PreviewPiping.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Real fake-evaluator so piping condition + bindings run.
vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ 'true': true }) }
})

import { PreviewPane } from './PreviewPane'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  logic: [{ type: 'piping', condition: 'true', action: { source: 'it_src', field_path: 'pages.p1.elements.1.prompt' } }],
  pages: [{ id: 'p1', elements: [
    { id: 'it_src',
      question: { prompt: { content: { en: { status: 'complete', text: 'Your name?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'Sam' }], content: { en: { options: [{ index: 0, text: 'Sam' }] } } } },
    { id: 'it_tgt',
      question: { prompt: { content: { en: { status: 'complete', text: 'PROMPT_PLACEHOLDER' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane piping', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(model), { kind: 'new' } as never))

  it('rewrites the target prompt with the source answer once the source is answered', async () => {
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getByText('Your name?')).toBeInTheDocument())
    expect(screen.getByText('PROMPT_PLACEHOLDER')).toBeInTheDocument() // not yet piped (source unanswered)
    fireEvent.click(screen.getByText('Sam'))
    await waitFor(() => expect(screen.queryByText('PROMPT_PLACEHOLDER')).not.toBeInTheDocument())
    expect(screen.getAllByText('Sam').length).toBeGreaterThan(0) // target prompt now shows the piped value
  })
})
```

> Note: the source + target items are on the same page; the preview defaults to the selected/first page so both render. If the renderer's choice label differs, adjust the click target (`screen.getByText('Sam')`) to match; the assertion that matters is `PROMPT_PLACEHOLDER` disappears after answering and the piped value appears. Both items have explicit `id`s so projection indices match the rule's `field_path`.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/PreviewPiping.test.tsx`
Expected: FAIL — `PROMPT_PLACEHOLDER` is still present after answering (no piping wired into the preview yet).

- [ ] **Step 3: Wire pipe-then-filter into `PreviewPane`**

In `editor/src/preview/PreviewPane.tsx`:

Add to the visibility import:

```tsx
import { makeBindings, filterPageVisible } from '../logic/visibility'
import { applyPiping } from '../logic/piping'
```

Replace the existing `visiblePages` line (currently `const visiblePages = evaluator ? pages.map((p) => filterPageVisible(p, evaluator, bindings, model.logic ?? [])) : pages`) with pipe-then-filter:

```tsx
  const pipedPages = evaluator ? pages.map((p) => applyPiping(p, model.logic ?? [], evaluator, bindings, locale)) : pages
  const visiblePages = evaluator ? pipedPages.map((p) => filterPageVisible(p, evaluator, bindings, model.logic ?? [])) : pipedPages
```

(`locale` is already in scope in PreviewPane — it's the preview language state. The JSX still renders `visiblePages`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/PreviewPiping.test.tsx`
Expected: PASS — `PROMPT_PLACEHOLDER` replaced by `Sam` after answering.

- [ ] **Step 5: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass (incl. the D1 `PreviewVisibility` + D2a `visibilityRules` tests — pipe-then-filter doesn't change visibility behaviour when there are no piping rules).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/preview/PreviewPane.tsx editor/src/preview/PreviewPiping.test.tsx
git commit -m "feat(editor): ED-D2b preview pipes prompts live (pipe-then-filter, stable indices)"
```

---

## Task 6: Randomization — `updateFlow` + `CheckboxField` + Inspector

**Files:**
- Modify: `editor/src/model/tree.ts`, `editor/src/inspector/fields.tsx`, `editor/src/inspector/Inspector.tsx`
- Test: `editor/src/model/tree.test.ts` (append), `editor/src/inspector/Inspector.test.tsx` (append)

- [ ] **Step 1: Write the failing tests**

Append to `editor/src/model/tree.test.ts`:

```ts
import { updateFlow } from './tree'

describe('updateFlow', () => {
  const base = { metadata: { id: 'qst_x', language: 'en' }, pages: [] } as unknown as import('./types').Questionnaire
  it('sets flow.randomize_pages and does not mutate input', () => {
    const out = updateFlow(base, { randomize_pages: true })
    expect((out.flow as { randomize_pages: boolean }).randomize_pages).toBe(true)
    expect(base.flow).toBeUndefined()
  })
  it('clears a key set to undefined and drops an emptied flow', () => {
    const set = updateFlow(base, { randomize_pages: true })
    const cleared = updateFlow(set, { randomize_pages: undefined })
    expect('flow' in cleared).toBe(false)
  })
  it('preserves other flow keys', () => {
    const out = updateFlow({ ...base, flow: { other: 1 } } as unknown as import('./types').Questionnaire, { randomize_pages: true })
    expect(out.flow).toEqual({ other: 1, randomize_pages: true })
  })
})
```

Append to `editor/src/inspector/Inspector.test.tsx` (it already mocks `useEvaluator` and imports `render/screen/fireEvent`, `Inspector`, `useEditorStore`, a base `Questionnaire`; reuse those):

```ts
describe('Inspector randomization (D2b)', () => {
  const base = {
    metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
    pages: [{ id: 'p1', title: 'P1', elements: [] }],
    blocks: [{ id: 'b1', title: 'B1', page_ids: ['p1'] }],
  } as unknown as Questionnaire

  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('page: toggling Randomize element order sets then unsets the flag', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    fireEvent.click(screen.getByLabelText(/randomize element order/i))
    expect((useEditorStore.getState().model!.pages[0] as { randomize?: boolean }).randomize).toBe(true)
    fireEvent.click(screen.getByLabelText(/randomize element order/i))
    expect('randomize' in (useEditorStore.getState().model!.pages[0] as object)).toBe(false)
  })

  it('questionnaire root: Randomize page order writes flow.randomize_pages', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    fireEvent.click(screen.getByLabelText(/randomize page order/i))
    expect((useEditorStore.getState().model!.flow as { randomize_pages?: boolean }).randomize_pages).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts src/inspector/Inspector.test.tsx`
Expected: FAIL — `updateFlow` not exported; the randomize checkboxes don't exist.

- [ ] **Step 3: Add `updateFlow`**

In `editor/src/model/tree.ts`, add (near `updateLogic`):

```ts
export function updateFlow(model: Questionnaire, patch: Record<string, unknown>): Questionnaire {
  return produce(model, (draft) => {
    const flow = { ...((draft.flow as Record<string, unknown>) ?? {}), ...patch }
    for (const k of Object.keys(flow)) if (flow[k] === undefined) delete flow[k]
    if (Object.keys(flow).length === 0) delete draft.flow
    else draft.flow = flow
  })
}
```

- [ ] **Step 4: Add `CheckboxField`**

In `editor/src/inspector/fields.tsx`, add:

```tsx
export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
```

- [ ] **Step 5: Wire the checkboxes into the Inspector**

In `editor/src/inspector/Inspector.tsx`:

(a) Extend imports:

```tsx
import { updateMetadata, updateNodeProps, setBlockPages, deleteBlock, updateFlow, unsetNodeProp } from '../model/tree'
import { TextField, CheckboxField } from './fields'
```

(b) **Questionnaire root branch** — after `<LogicPanel />`, add:

```tsx
        <CheckboxField label="Randomize page order" checked={(model.flow as { randomize_pages?: boolean })?.randomize_pages === true}
          onChange={(v) => applyEdit((mm) => updateFlow(mm, { randomize_pages: v ? true : undefined }))} />
```

(c) **Page/section branch** — replace the placeholder line `<p className="text-xs text-slate-400">style / flow panels arrive with full coverage in later stages.</p>` with a randomize checkbox (keep the `ShowIfEditor` line after it):

```tsx
        <CheckboxField label="Randomize element order"
          checked={(node as { randomize?: boolean }).randomize === true}
          onChange={(v) => applyEdit((mm) => v ? updateNodeProps(mm, sel!, { randomize: true }) : unsetNodeProp(mm, sel!, 'randomize'))} />
```

(d) **Block branch** — before the `<ShowIfEditor ... />` line, add:

```tsx
        <CheckboxField label="Randomize page order in block"
          checked={(node as { randomize?: boolean }).randomize === true}
          onChange={(v) => applyEdit((mm) => v ? updateNodeProps(mm, sel!, { randomize: true }) : unsetNodeProp(mm, sel!, 'randomize'))} />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts src/inspector/Inspector.test.tsx`
Expected: PASS (the new `updateFlow` + randomization tests + the existing ones).

- [ ] **Step 7: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 8: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/model/tree.ts editor/src/model/tree.test.ts editor/src/inspector/fields.tsx editor/src/inspector/Inspector.tsx editor/src/inspector/Inspector.test.tsx
git commit -m "feat(editor): ED-D2b randomization checkboxes (Page/Section/Block + flow.randomize_pages)"
```

---

## Task 7: Playwright smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/piping.spec.ts`

Reuse the D1/D2a bundle fixture `editor/src/__fixtures__/show_if_demo.json` (`it_control` [choice yes/no] + `it_dependent` [text prompt "Bonus question revealed!"], pinned prompt refs, `entities` map). Mirror `editor/tests/e2e/logic-rule.spec.ts` for the `**/v1/entities/**` stub + bundle load.

- [ ] **Step 1: Write the smoke spec**

Create `editor/tests/e2e/piping.spec.ts`. It must: load the bundle (stub the entity endpoint), in the questionnaire-root Logic panel click "+ Add rule", set type to `piping`, choose Source question `it_control`, choose Target prompt = the `it_dependent` prompt target (the option whose label references `it_dependent`), set the condition to `true`, open the preview, answer the control ("Yes"), and assert the dependent prompt now shows the piped control answer (`yes`). Also toggle a randomize checkbox and screenshot to `tests/e2e/screenshots/ed-d2b-piping.png`.

```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a piping rule inserts the source answer into a target prompt in the preview', async ({ page }) => {
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

  await page.getByRole('button', { name: /add rule/i }).click()
  await page.getByLabel('Rule type').selectOption('piping')
  await page.getByLabel('Source question').selectOption('it_control')
  // Target prompt picker stores the field path; select the it_dependent prompt option by its path value.
  await page.getByLabel('Target prompt').selectOption('pages.page_1.elements.1.prompt')
  await page.getByLabel('Expression').fill('true')

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Scope').selectOption('all')
  await preview.getByText('Yes').click()
  // The dependent prompt text becomes the piped control answer ("yes").
  await expect(preview.locator('h2.qv-prompt', { hasText: 'yes' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d2b-piping.png', fullPage: true })
})
```

> The fixture's page id is `page_1` and the dependent item is at element index 1 (control is index 0), so the target path is `pages.page_1.elements.1.prompt`. VERIFY this against the actual fixture before finalizing — open `editor/src/__fixtures__/show_if_demo.json` and confirm the page `id` and that `it_dependent` is the 2nd element; adjust the `selectOption` path + the index if they differ. The Target-prompt `<option>` values are field paths (the picker shows labels but stores paths), so `selectOption('<path>')` selects by value. Use `page.getByLabel`/`getByRole` only.

- [ ] **Step 2: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- piping`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-d2b-piping.png`. (Install chromium first if needed. If it can't run here, commit the spec + report the exact failure; do NOT weaken assertions.)

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/piping.spec.ts
git commit -m "test(editor): ED-D2b Playwright piping smoke + screenshot"
```

---

## Task 8: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-D2b follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-D2b Follow-ups

Known limitations and open items carried out of ED-D2b (piping + randomization). ED-D2 COMPLETE.

## (aaa) Piping targets are question prompts only

The field_path picker offers only top-level item question prompts
(`pages.{pageId}.elements.{idx}.prompt`) — the only target the Web Viewer currently applies
(its App layer builds exactly that path). Option labels, message text, section titles, and
section-child prompts are NOT wired in the viewer, so authoring them would silently not fire;
they are deferred until the viewer applies them.

## (bbb) Randomization is author-only (no preview shuffle)

`Page/Section/Block.randomize` + `flow.randomize_pages` are authored as checkboxes but the
preview does not shuffle (it has no seeded navigation runtime; the seed strategy is a
deployment concern). The preview ignores the flags (does not crash). Option-order
randomization is not in Schema 2 v26.0602 (out of scope entirely).

## (ccc) Piping preview is single-locale + same-render

`applyPiping` rewrites the active preview locale's prompt text (mirroring the viewer's App).
Cross-page piping previews only in "Whole questionnaire" scope (the source must be answerable);
in "Selected page" scope only same-page sources resolve. Both match the runtime.

## (ddd) ED-D2 is COMPLETE

ED-D2 (logic rules) is COMPLETE: D2a (skip/branch/visibility + live visibility preview) +
D2b (piping + live piping preview + randomization). The next editor stages are ED-D3
(validation builders) and ED-D4 (scoring builders), then ED-E (translation), ED-F
(preview-deploy + export).
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 3: Production build smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: succeeds (renderer + evaluator prebuild, tsc, vite build), emits the wasm asset.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-D2b FOLLOWUPS (ED-D2 complete)"
```

---

## Done criteria (mirror of spec §6)

1. Piping authored via source dropdown + field_path picker (no manual typing), emitting canonical `pages.{id}.elements.{idx}.prompt`; `validateRule` enforces presence + unknown-target warning. — Tasks 1, 3, 4.
2. Preview pipes live (source answer, array-joined) after the source is answered; pipe-then-filter (stable indices); malformed → original. — Tasks 2, 5.
3. Randomization checkboxes author cleanly (unset removes the key) + round-trip Schema-2-valid; author-only. — Task 6.
4. All suites green; screenshot delivered. — Tasks 7, 8.
5. ED-D2 COMPLETE. — Task 8.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_d2b` memory + MEMORY.md line + HANDOFF update.
```
