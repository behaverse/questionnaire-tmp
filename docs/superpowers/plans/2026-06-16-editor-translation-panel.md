# Editor Translation Panel (ED-E2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A full-width in-editor Translation view: a source→target list of every translatable string (prompts, option labels, contexts, instructions, messages), deduped by entity, that auto-forks Library refs on edit and tracks per-row status + progress.

**Architecture:** A pure `collectTranslatable(...)` builds grouped rows from the model + pool + resolved bodies; pure body-transform helpers + a deterministic `forkedRef()` apply edits; a `TranslationPanel` renders the rows and, on edit, forks-if-ref then writes `content[target]` via the store. A topbar "Translate" toggle (`translateView` store flag) swaps the workspace for the panel.

**Tech Stack:** React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright.

**Conventions:** run editor commands from `/home/pedro/Repos/Cursor/questionnaire_apps/editor`; commit from repo root; every commit message ends with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Branch `editor-translation-panel` is checked out.

**Key existing APIs (verified):**
- `forkRefAction(ref): Promise<boolean>` (store) → copies the Library body into the pool under `newRef = `${parsed.id}@${draftVersion(parsed.version)}`` and repoints all occurrences. So the forked pool key is **deterministic** — compute it with `parseRef` (`editor/src/persistence/library.ts`) + `draftVersion` (`editor/src/pool/mint.ts`).
- Store: `pool: Record<string, EntityBody>`, `resolved: Record<string, EntityBody|null>` (preview-shared), `editingLocale`, `upsertPoolEntity(ref, body)`, `forkRefAction`.
- Option body content shape: `content[locale] = { status, label?, units?, options?: [{index, text}] }`. Ops in `editor/src/option/ops.ts`: `setChoiceText(opt,index,locale,text)`, `setLabel(opt,locale,label)`, `setUnits(opt,locale,units)`, `setStatus(opt,locale,status)`.
- Content entity body shape (prompt/context/instruction/message): `{ content: { [locale]: { status, text } }, ... }`.
- `getAtPath`, `type NodePath` from `editor/src/model/path.ts`.

---

## File Structure

- **Create** `editor/src/translate/types.ts` — `TransField`, `TransRow`, `TransGroup` types.
- **Create** `editor/src/translate/collect.ts` — `collectTranslatable(model, pool, resolved, primary, target) → TransGroup[]` (pure).
- **Create** `editor/src/translate/apply.ts` — pure `applyTranslation(body, kind, field, locale, value)` + `applyStatus(body, kind, field, locale, status)` + `forkedRef(ref)`.
- **Create** `editor/src/translate/TranslationPanel.tsx` — the view (reads store, calls a local `setTranslation` orchestrator).
- **Modify** `editor/src/state/types.ts` + `editor/src/state/store.ts` — add `translateView` + `setTranslateView`.
- **Modify** `editor/src/app/Topbar.tsx` — "Translate" toggle.
- **Modify** `editor/src/app/App.tsx` — render `<TranslationPanel>` full-width when `translateView` (else `<EditorWorkspace>`).
- **Create** `editor/tests/e2e/translation-panel.spec.ts`.
- **Modify** `editor/FOLLOWUPS.md`.

---

## Task 1: Types + `collectTranslatable`

**Files:**
- Create: `editor/src/translate/types.ts`, `editor/src/translate/collect.ts`
- Test: `editor/src/translate/collect.test.ts`

- [ ] **Step 1: Types**

Create `editor/src/translate/types.ts`:

```ts
import type { NodePath } from '../model/path'

export type TransKind = 'prompt' | 'context' | 'instruction' | 'message' | 'option'
/** which string within an entity body a row edits */
export type TransField = { t: 'text' } | { t: 'opt-label' } | { t: 'opt-units' } | { t: 'choice'; index: number }

export interface TransRow {
  id: string            // stable key: `${groupId}:${fieldKey}`
  fieldLabel: string    // e.g. "Prompt", "Label", "Units", "Choice 1"
  field: TransField
  source: string        // primary-locale text ('' if none)
  target: string        // editing-locale text ('' if none)
  status: string        // editing-locale status (draft if absent)
  done: boolean         // target non-empty
}

export interface TransGroup {
  groupId: string                 // entityRef or `inline:${pathKey}`
  entityRef: string | null        // ref to fork/write (null for inline option)
  inlinePath: NodePath | null     // path to an inline option (entityRef null)
  kind: TransKind
  title: string                   // human label, e.g. the item's prompt id or "Message"
  rows: TransRow[]
}
```

- [ ] **Step 2: Write the failing test**

Create `editor/src/translate/collect.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectTranslatable } from './collect'
import type { Questionnaire } from '../model/types'

const prompt = (id: string, en: string, fr?: string) => ({
  id, content: { en: { status: 'complete', text: en }, ...(fr ? { fr: { status: 'complete', text: fr } } : {}) },
})
const option = (id: string) => ({
  id, input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { status: 'complete', label: 'Agreement', options: [{ index: 1, text: 'no' }, { index: 2, text: 'yes' }] } },
})

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en' },
  pages: [{ id: 'p1', elements: [
    { id: 'it_1', question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_s@v1' } },
    { id: 'it_2', question: { prompt: { ref: 'pr_b@v1' } }, option: { ref: 'opt_s@v1' } }, // shares opt_s
    { ref: 'msg_x@v1' },
  ] }],
} as unknown as Questionnaire

const pool = { 'pr_a@v1': prompt('pr_a', 'How are you?', 'Comment ça va ?') }
const resolved = {
  'pr_b@v1': prompt('pr_b', 'Your age?'),
  'opt_s@v1': option('opt_s'),
  'msg_x@v1': { id: 'msg_x', type: ['intro'], content: { en: { status: 'complete', text: 'Welcome' } } },
}

describe('collectTranslatable', () => {
  const groups = collectTranslatable(model, pool, resolved, 'en', 'fr')

  it('emits one group per UNIQUE entity (shared option deduped)', () => {
    const refs = groups.map((g) => g.entityRef)
    expect(refs).toEqual(['pr_a@v1', 'opt_s@v1', 'pr_b@v1', 'msg_x@v1'])
  })
  it('marks done when the target text exists', () => {
    const a = groups.find((g) => g.entityRef === 'pr_a@v1')!
    expect(a.rows[0]).toMatchObject({ source: 'How are you?', target: 'Comment ça va ?', done: true })
    const b = groups.find((g) => g.entityRef === 'pr_b@v1')!
    expect(b.rows[0]).toMatchObject({ source: 'Your age?', target: '', done: false })
  })
  it('option group has a row per choice label + the option label', () => {
    const opt = groups.find((g) => g.entityRef === 'opt_s@v1')!
    expect(opt.rows.map((r) => r.fieldLabel)).toEqual(['Label', 'Choice 1', 'Choice 2'])
    expect(opt.rows[1]).toMatchObject({ source: 'no', target: '', done: false })
  })
})
```

- [ ] **Step 3: Run it (FAIL — module missing)**

Run: `npx vitest run src/translate/collect.test.ts` → FAIL.

- [ ] **Step 4: Implement `collect.ts`**

Create `editor/src/translate/collect.ts`:

```ts
import type { Questionnaire, EntityBody } from '../model/types'
import { pathKey, type NodePath } from '../model/path'
import type { TransGroup, TransRow, TransKind } from './types'

type Body = Record<string, unknown> & { content?: Record<string, { status?: string; text?: string; label?: string; units?: string; options?: Array<{ index: number; text?: string }> }> }

const text = (b: Body | undefined, loc: string) => String(b?.content?.[loc]?.text ?? '')
const status = (b: Body | undefined, loc: string) => String(b?.content?.[loc]?.status ?? 'draft')

export function collectTranslatable(
  model: Questionnaire,
  pool: Record<string, EntityBody>,
  resolved: Record<string, EntityBody | null>,
  primary: string,
  target: string,
): TransGroup[] {
  const groups: TransGroup[] = []
  const seen = new Set<string>()
  const bodyOf = (ref: string): Body | undefined => (pool[ref] ?? resolved[ref] ?? undefined) as Body | undefined

  const textGroup = (ref: string, kind: TransKind, title: string) => {
    if (seen.has(ref)) return
    seen.add(ref)
    const b = bodyOf(ref)
    const tgt = text(b, target)
    groups.push({
      groupId: ref, entityRef: ref, inlinePath: null, kind, title,
      rows: [{ id: `${ref}:${JSON.stringify({ t: 'text' })}`, fieldLabel: kindLabel(kind), field: { t: 'text' }, source: text(b, primary), target: tgt, status: status(b, target), done: !!tgt.trim() }],
    })
  }

  const optionGroup = (ref: string | null, inlinePath: NodePath | null, body: Body | undefined, title: string) => {
    const groupId = ref ?? `inline:${pathKey(inlinePath as NodePath)}`
    if (seen.has(groupId)) return
    seen.add(groupId)
    const rows: TransRow[] = []
    const cEn = body?.content?.[primary]
    const cTg = body?.content?.[target]
    const push = (field: TransRow['field'], fieldLabel: string, src: string, tgt: string) =>
      rows.push({ id: `${groupId}:${JSON.stringify(field)}`, fieldLabel, field, source: src, target: tgt, status: status(body, target), done: !!tgt.trim() })
    if (cEn?.label !== undefined || cTg?.label !== undefined) push({ t: 'opt-label' }, 'Label', String(cEn?.label ?? ''), String(cTg?.label ?? ''))
    if (cEn?.units !== undefined || cTg?.units !== undefined) push({ t: 'opt-units' }, 'Units', String(cEn?.units ?? ''), String(cTg?.units ?? ''))
    for (const ch of cEn?.options ?? cTg?.options ?? []) {
      const i = ch.index
      const srcTxt = String(cEn?.options?.find((o) => o.index === i)?.text ?? '')
      const tgtTxt = String(cTg?.options?.find((o) => o.index === i)?.text ?? '')
      push({ t: 'choice', index: i }, `Choice ${i}`, srcTxt, tgtTxt)
    }
    if (rows.length) groups.push({ groupId, entityRef: ref, inlinePath, kind: 'option', title, rows })
  }

  const visitElement = (el: Record<string, unknown>, path: NodePath) => {
    const q = el.question as Record<string, unknown> | undefined
    const promptRef = (q?.prompt as { ref?: string } | undefined)?.ref
    if (promptRef) textGroup(promptRef, 'prompt', promptRef)
    const ctxRef = (q?.context as { ref?: string } | undefined)?.ref
    if (ctxRef) textGroup(ctxRef, 'context', ctxRef)
    const insRef = (q?.instruction as { ref?: string } | undefined)?.ref
    if (insRef) textGroup(insRef, 'instruction', insRef)
    // message element: { ref }
    if (typeof el.ref === 'string' && el.ref.startsWith('msg_')) textGroup(el.ref, 'message', el.ref)
    // option: ref or inline
    const optKey = 'shared_option' in el ? 'shared_option' : 'option'
    const opt = el[optKey] as { ref?: string } | Body | undefined
    if (opt && typeof opt === 'object') {
      if ('ref' in opt && typeof opt.ref === 'string') optionGroup(opt.ref, null, bodyOf(opt.ref), opt.ref)
      else if ('input_data_type' in (opt as object)) optionGroup(null, [...path, optKey] as NodePath, opt as Body, 'inline option')
    }
  }

  for (let pi = 0; pi < (model.pages?.length ?? 0); pi++) {
    const page = model.pages[pi]
    page.elements?.forEach((el, ei) => {
      visitElement(el as Record<string, unknown>, ['pages', pi, 'elements', ei])
      const sec = el as { elements?: Record<string, unknown>[] }
      sec.elements?.forEach((sub, si) => visitElement(sub, ['pages', pi, 'elements', ei, 'elements', si]))
    })
  }
  return groups
}

function kindLabel(k: TransKind): string {
  return k === 'prompt' ? 'Prompt' : k === 'context' ? 'Context' : k === 'instruction' ? 'Instruction' : k === 'message' ? 'Message' : 'Option'
}
```

- [ ] **Step 5: Run the test (PASS)**

Run: `npx vitest run src/translate/collect.test.ts && npm run typecheck` → PASS; typecheck clean. (If `kindLabel` is flagged unused before the option path, it is used by `textGroup`.)

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/translate/types.ts editor/src/translate/collect.ts editor/src/translate/collect.test.ts
git commit -m "feat(editor): ED-E2 collectTranslatable — grouped translatable rows (deduped)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `apply.ts` — body transforms + forkedRef

**Files:**
- Create: `editor/src/translate/apply.ts`
- Test: `editor/src/translate/apply.test.ts`

- [ ] **Step 1: Write the failing test**

Create `editor/src/translate/apply.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { applyTranslation, applyStatus, forkedRef } from './apply'

const promptBody = { id: 'pr_a', content: { en: { status: 'complete', text: 'Hi' } } }
const optBody = { id: 'opt_s', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { status: 'complete', label: 'Agree', options: [{ index: 1, text: 'no' }] } } }

describe('applyTranslation', () => {
  it('writes content text for a content entity', () => {
    const next = applyTranslation(promptBody, 'prompt', { t: 'text' }, 'fr', 'Salut') as typeof promptBody
    expect(next.content.fr.text).toBe('Salut')
    expect(next.content.en.text).toBe('Hi') // primary untouched
  })
  it('writes an option choice label', () => {
    const next = applyTranslation(optBody, 'option', { t: 'choice', index: 1 }, 'fr', 'non') as typeof optBody
    expect(next.content.fr.options[0]).toEqual({ index: 1, text: 'non' })
  })
  it('writes the option label', () => {
    const next = applyTranslation(optBody, 'option', { t: 'opt-label' }, 'fr', 'Accord') as typeof optBody
    expect(next.content.fr.label).toBe('Accord')
  })
})
describe('applyStatus', () => {
  it('sets the locale status for a content entity', () => {
    const next = applyStatus(promptBody, 'prompt', 'fr', 'validated') as typeof promptBody
    expect(next.content.fr.status).toBe('validated')
  })
})
describe('forkedRef', () => {
  it('derives the deterministic forked pool ref', () => {
    expect(forkedRef('opt_s@v26.0606')).toBe('opt_s@v26.0606.dev1')
  })
})
```

- [ ] **Step 2: Run it (FAIL)**

Run: `npx vitest run src/translate/apply.test.ts` → FAIL.

- [ ] **Step 3: Implement `apply.ts`**

Create `editor/src/translate/apply.ts`:

```ts
import type { EntityBody } from '../model/types'
import type { TransKind, TransField } from './types'
import { setChoiceText, setLabel, setUnits, setStatus as setOptStatus, type EditableOption } from '../option/ops'
import { parseRef } from '../persistence/library'
import { draftVersion } from '../pool/mint'

type ContentBody = { content?: Record<string, { status?: string; text?: string }> } & Record<string, unknown>

function setContentText(body: ContentBody, locale: string, text: string): ContentBody {
  const entry = body.content?.[locale] ?? { status: 'draft' }
  return { ...body, content: { ...body.content, [locale]: { ...entry, status: entry.status ?? 'draft', text } } }
}
function setContentStatus(body: ContentBody, locale: string, status: string): ContentBody {
  const entry = body.content?.[locale] ?? {}
  return { ...body, content: { ...body.content, [locale]: { ...entry, status } } }
}

/** Apply a target-locale text edit to an entity body (immutable). */
export function applyTranslation(body: EntityBody, kind: TransKind, field: TransField, locale: string, value: string): EntityBody {
  if (kind === 'option') {
    const opt = body as unknown as EditableOption
    if (field.t === 'choice') return setChoiceText(opt, field.index, locale, value) as unknown as EntityBody
    if (field.t === 'opt-label') return setLabel(opt, locale, value) as unknown as EntityBody
    if (field.t === 'opt-units') return setUnits(opt, locale, value) as unknown as EntityBody
    return body
  }
  return setContentText(body as ContentBody, locale, value) as unknown as EntityBody
}

/** Apply a target-locale status edit. */
export function applyStatus(body: EntityBody, kind: TransKind, locale: string, status: string): EntityBody {
  if (kind === 'option') return setOptStatus(body as unknown as EditableOption, locale, status) as unknown as EntityBody
  return setContentStatus(body as ContentBody, locale, status) as unknown as EntityBody
}

/** The deterministic pool key that forkRefAction produces for a Library ref. */
export function forkedRef(ref: string): string | null {
  const p = parseRef(ref)
  return p ? `${p.id}@${draftVersion(p.version)}` : null
}
```

- [ ] **Step 4: Run the test (PASS) + typecheck**

Run: `npx vitest run src/translate/apply.test.ts && npm run typecheck` → PASS; clean. (If `setChoiceText` mutates vs returns — confirm it returns a new option; the existing OptionEditor relies on that.)

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/translate/apply.ts editor/src/translate/apply.test.ts
git commit -m "feat(editor): ED-E2 translation body transforms + forkedRef

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: store `translateView` flag

**Files:**
- Modify: `editor/src/state/types.ts` (if the state interface lives there) and/or `editor/src/state/store.ts`
- Test: `editor/src/state/store.test.ts` (append; create if absent)

- [ ] **Step 1: Add to the store**

In `editor/src/state/store.ts`, add to the `EditorState` interface (next to `previewOpen`): `translateView: boolean` and `setTranslateView: (v: boolean) => void`. Add to the initial state `translateView: false`. Add the action `setTranslateView: (v) => set({ translateView: v })`. Add `translateView: false` to the `loadModel` set and the `reset` set (so it clears on open/close).

- [ ] **Step 2: Write a test**

Append to `editor/src/state/store.test.ts` (reuse the file's imports; if absent create with vitest + the store import):

```ts
import { test, expect } from 'vitest'
import { useEditorStore } from './store'
import type { Questionnaire } from '../model/types'

test('translateView toggles and resets on load', () => {
  useEditorStore.getState().setTranslateView(true)
  expect(useEditorStore.getState().translateView).toBe(true)
  useEditorStore.getState().loadModel({ metadata: { id: 'q', title: 'q', language: 'en' }, pages: [] } as unknown as Questionnaire, { kind: 'new' })
  expect(useEditorStore.getState().translateView).toBe(false)
})
```

- [ ] **Step 3: Run + commit**

Run: `npx vitest run src/state/store.test.ts && npm run typecheck` → PASS.

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/state/store.ts editor/src/state/types.ts editor/src/state/store.test.ts
git commit -m "feat(editor): ED-E2 store translateView flag

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Drop `types.ts` from the add if you didn't edit it.)

---

## Task 4: `TranslationPanel`

**Files:**
- Create: `editor/src/translate/TranslationPanel.tsx`
- Test: `editor/src/translate/TranslationPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/translate/TranslationPanel.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranslationPanel } from './TranslationPanel'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en', available_languages: ['fr'] },
  pages: [{ id: 'p1', elements: [{ id: 'it_1', question: { prompt: { ref: 'pr_a@v26.0606.dev1' } }, option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } }] }],
} as unknown as Questionnaire

beforeEach(() => {
  const s = useEditorStore.getState()
  s.reset()
  s.loadModel(structuredClone(model), { kind: 'file', name: 't.json' }, { 'pr_a@v26.0606.dev1': { id: 'pr_a', content: { en: { status: 'complete', text: 'How are you?' } } } })
  s.setEditingLocale('fr')
})

describe('TranslationPanel', () => {
  it('shows the source and writes the target translation to the pool', async () => {
    render(<TranslationPanel />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
    const field = screen.getByLabelText('translate pr_a@v26.0606.dev1:{"t":"text"}')
    fireEvent.change(field, { target: { value: 'Comment ça va ?' } })
    await waitFor(() => {
      const body = useEditorStore.getState().pool['pr_a@v26.0606.dev1'] as { content: Record<string, { text?: string }> }
      expect(body.content.fr?.text).toBe('Comment ça va ?')
    })
  })

  it('shows an empty-state when the editing language is the primary', () => {
    useEditorStore.getState().setEditingLocale('en')
    render(<TranslationPanel />)
    expect(screen.getByText(/pick a non-primary editing language/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it (FAIL)**

Run: `npx vitest run src/translate/TranslationPanel.test.tsx` → FAIL.

- [ ] **Step 3: Implement `TranslationPanel.tsx`**

Create `editor/src/translate/TranslationPanel.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useEditorStore } from '../state/store'
import { collectTranslatable } from './collect'
import { applyTranslation, applyStatus, forkedRef } from './apply'
import type { TransField, TransKind, TransRow } from './types'
import type { EntityBody } from '../model/types'

const STATUSES = ['draft', 'complete', 'validated']

export function TranslationPanel() {
  const model = useEditorStore((s) => s.model)
  const pool = useEditorStore((s) => s.pool)
  const resolved = useEditorStore((s) => s.resolved)
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const [untranslatedOnly, setUntranslatedOnly] = useState(false)
  if (!model) return null
  const primary = String(model.metadata.language ?? 'en')
  const target = editingLocale && editingLocale !== primary ? editingLocale : null

  const groups = useMemo(
    () => (target ? collectTranslatable(model, pool, resolved, primary, target) : []),
    [model, pool, resolved, primary, target],
  )

  if (!target) {
    return <div className="p-8 text-sm text-slate-500">Pick a non-primary <strong>Editing language</strong> in the top bar to translate.</div>
  }

  const allRows = groups.flatMap((g) => g.rows)
  const doneCount = allRows.filter((r) => r.done).length

  // ensure a pool copy of `ref` exists (fork if needed) → returns the pool key, else null
  const ensurePool = async (ref: string): Promise<string | null> => {
    if (pool[ref]) return ref
    const fr = forkedRef(ref)
    if (fr && pool[fr]) return fr
    const ok = await useEditorStore.getState().forkRefAction(ref)
    return ok ? forkedRef(ref) : null
  }

  const writeRef = async (ref: string, kind: TransKind, mutate: (b: EntityBody) => EntityBody) => {
    const key = await ensurePool(ref)
    if (!key) return
    const body = useEditorStore.getState().pool[key]
    if (body) useEditorStore.getState().upsertPoolEntity(key, mutate(body))
  }

  const writeInline = (path: import('../model/path').NodePath, mutate: (b: EntityBody) => EntityBody) => {
    useEditorStore.getState().applyEdit((m) => {
      // path points at the inline option object; replace it
      const cloned = structuredClone(m)
      let node: Record<string, unknown> = cloned as unknown as Record<string, unknown>
      for (let i = 0; i < path.length - 1; i++) node = node[path[i] as keyof typeof node] as Record<string, unknown>
      const last = path[path.length - 1]
      node[last as keyof typeof node] = mutate(node[last as keyof typeof node] as EntityBody) as never
      return cloned
    })
  }

  const onEditText = (g: typeof groups[number], row: TransRow, value: string) => {
    const mut = (b: EntityBody) => applyTranslation(b, g.kind, row.field, target, value)
    if (g.entityRef) void writeRef(g.entityRef, g.kind, mut)
    else if (g.inlinePath) writeInline(g.inlinePath, mut)
  }
  const onEditStatus = (g: typeof groups[number], value: string) => {
    const mut = (b: EntityBody) => applyStatus(b, g.kind, target, value)
    if (g.entityRef) void writeRef(g.entityRef, g.kind, mut)
    else if (g.inlinePath) writeInline(g.inlinePath, mut)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 text-sm">
        <span className="font-semibold">Translate → {target}</span>
        <span className="text-slate-400">{doneCount} / {allRows.length} translated</span>
        <label className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <input type="checkbox" checked={untranslatedOnly} onChange={(e) => setUntranslatedOnly(e.target.checked)} /> show untranslated only
        </label>
      </div>
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-1 text-[11px] text-amber-700">
        Editing a translation makes a local editable copy of Library content (shared options are copied once).
      </div>
      <div className="flex-1 overflow-auto p-4">
        {groups.map((g) => {
          const rows = untranslatedOnly ? g.rows.filter((r) => !r.done) : g.rows
          if (!rows.length) return null
          return (
            <div key={g.groupId} className="mb-4 rounded border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                <span className="uppercase tracking-wide">{g.kind}</span><span className="font-mono">{g.title}</span>
              </div>
              {rows.map((row: TransRow) => (
                <div key={row.id} className="grid grid-cols-[7rem_1fr_1fr_auto] items-start gap-2 px-3 py-2">
                  <span className="pt-1 text-xs text-slate-400">{row.fieldLabel}</span>
                  <div className="whitespace-pre-wrap pt-1 text-sm text-slate-600">{row.source || <span className="text-slate-300">(empty)</span>}</div>
                  <textarea aria-label={`translate ${row.id}`} rows={1} defaultValue={row.target}
                            onChange={(e) => onEditText(g, row, e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                  <select aria-label={`status ${row.id}`} value={row.status} onChange={(e) => onEditStatus(g, e.target.value)}
                          className="rounded border border-slate-300 px-1 py-0.5 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )
        })}
        {!groups.length && <div className="text-sm text-slate-400">No translatable content found.</div>}
      </div>
    </div>
  )
}
```

NOTE on the test's `getByLabelText`: the row id is `` `${groupId}:${JSON.stringify(field)}` `` so the aria-label is `translate pr_a@v26.0606.dev1:{"t":"text"}`. Keep the test's label string in sync with `row.id` from Task 1. Use `defaultValue` (uncontrolled) so typing isn't lost on the async pool round-trip; the dot/progress refresh on the next render.

- [ ] **Step 4: Run + typecheck**

Run: `npx vitest run src/translate/TranslationPanel.test.tsx && npm run typecheck` → PASS; clean. If the inline-write generic import syntax `import('../model/path').NodePath` trips tsc, add a top import `import type { NodePath } from '../model/path'` and use it.

- [ ] **Step 5: Full suite**

Run: `npx vitest run` → all pass.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/translate/TranslationPanel.tsx editor/src/translate/TranslationPanel.test.tsx
git commit -m "feat(editor): ED-E2 TranslationPanel (source→target rows, auto-fork on edit)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Topbar toggle + App wiring

**Files:**
- Modify: `editor/src/app/Topbar.tsx`, `editor/src/app/App.tsx`
- Test: `editor/src/app/Topbar.test.tsx` (append)

- [ ] **Step 1: Topbar button**

In `editor/src/app/Topbar.tsx`: pull `translateView` + `setTranslateView` from the store. Add a button in the `ml-auto` group (e.g. after the Editing-language switcher / before "Check for updates"):

```tsx
        <button title="Open the side-by-side translation view" onClick={() => setTranslateView(!translateView)}
                className={`rounded border px-3 py-1 text-sm ${translateView ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-50'}`}>
          Translate
        </button>
```

- [ ] **Step 2: App renders the panel full-width when on**

In `editor/src/app/App.tsx`: import `TranslationPanel` from `../translate/TranslationPanel`; read `translateView`. In the loaded branch, replace `<EditorWorkspace />` with:

```tsx
      {useEditorStore((s) => s.translateView) ? <TranslationPanel /> : <EditorWorkspace />}
```

(Read `translateView` via the existing `useEditorStore` destructure rather than calling the hook inline if that's the file's pattern — match the file. The Topbar stays above it.)

- [ ] **Step 3: Topbar test**

Append to `editor/src/app/Topbar.test.tsx`:

```tsx
it('Translate button toggles translateView', () => {
  useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' })
  render(<Topbar onValidate={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /^translate$/i }))
  expect(useEditorStore.getState().translateView).toBe(true)
})
```

(Reuse the file's existing `base`/imports; if `base` differs, match it.)

- [ ] **Step 4: Run + typecheck + full suite**

Run: `npx vitest run src/app/Topbar.test.tsx && npm run typecheck && npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/app/Topbar.tsx editor/src/app/App.tsx editor/src/app/Topbar.test.tsx
git commit -m "feat(editor): ED-E2 Translate topbar toggle + full-width panel wiring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Playwright smoke + FOLLOWUPS + final verify

**Files:**
- Create: `editor/tests/e2e/translation-panel.spec.ts`
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Smoke spec**

Create `editor/tests/e2e/translation-panel.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('translate a prompt via the Translation panel (auto-forks the Library ref)', async ({ page }) => {
  await page.addInitScript(() => { indexedDB.deleteDatabase('behaverse-editor') })
  page.on('dialog', (d) => d.accept())
  await page.goto('/')
  await page.getByRole('button', { name: /load a sample/i }).click()
  await expect(page.getByText(/BIS\/BAS|Behavioral Approach/i).first()).toBeVisible()
  // add fr + switch editing language to fr
  await page.getByRole('button', { name: /questionnaire settings/i }).click()
  await page.getByLabel('New language code').fill('fr')
  await page.getByRole('button', { name: 'Add language' }).click()
  await page.getByLabel('Editing language').selectOption('fr')
  // open the translation panel + translate the first prompt row
  await page.getByRole('button', { name: /^translate$/i }).click()
  const firstTarget = page.locator('textarea[aria-label^="translate"]').first()
  await firstTarget.fill('Ma famille est ce qui compte le plus.')
  // progress count reflects ≥1 translated
  await expect(page.getByText(/\/ \d+ translated/)).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-e2-translate.png', fullPage: true })
})
```

(If the BIS/BAS sample already ships `fr`, the add-language step is a no-op that still leaves `fr` available — fine. If `Editing language` has no `fr` option, the add step provides it.)

- [ ] **Step 2: Run the smoke + FULL e2e**

Run: `npm run e2e -- translation-panel` then `npm run e2e` → PASS; report totals. (Per the e2e-rot lesson, the new "Translate" topbar button could clash with `/translate/i` selectors — none exist today, but re-run the full suite to be sure.)

- [ ] **Step 3: FOLLOWUPS**

Append to `editor/FOLLOWUPS.md`:

```markdown
# ED-E2 Follow-ups (translation panel)

## (ed-e2-1) Placeholder/Help text not in the panel
Option placeholder/help strings are translatable (same content map) but omitted from the
panel for now; add `setPlaceholderText`/`setHelpText` rows when needed.

## (ed-e2-2) Page/Section/Block titles
Title translations use a separate `translations[locale]` map (not the entity `content`); the
panel covers entity content only. Deferred (same as ED-E).

## (ed-e2-3) Translations are local
Translating a Library entity forks it into the local pool; the translation rides the bundle
export but is not written back to the shared Library (OD-08). A reused entity translated in
one questionnaire is not auto-shared to others until Library write exists.

## (ed-e2-4) Refs need the preview to have resolved them
The panel reads Library bodies from the shared `resolved` map (populated by the preview). If a
ref hasn't been resolved yet, its source/labels won't show until the preview has run once.
```

- [ ] **Step 4: Final typecheck + suites + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run && npm run build` → all green; build emits dist.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/translation-panel.spec.ts editor/FOLLOWUPS.md
git commit -m "test(editor): ED-E2 translation-panel smoke + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria (mirror of spec §7)
1. "Translate" topbar toggle opens a full-width source→target view, deduped by entity. — Tasks 1,4,5.
2. Typing a target persists it, auto-forking Library refs (shared options once); pool entities written directly. — Tasks 2,4.
3. Per-row status + progress count + untranslated-only filter; tree dots + preview reflect edits. — Tasks 1,4.
4. Empty-state when editing language == primary. — Task 4.
5. Suites green + a screenshot translating into fr. — Task 6.

After green: final whole-branch review → merge to master + push (NO PR) → write `project_editor_translation_panel` memory + MEMORY.md line + HANDOFF; restart the dev server (stale-HMR lesson).
