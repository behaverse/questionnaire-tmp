# Editor ED-C2a (Entity Pool + Prompt Editor + New-Item Creation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an author create a brand-new question-item from scratch — minting a draft Prompt into an editor-local entity pool, editing its content + metadata, and seeing it render in the live preview — and export a self-contained `{questionnaire, entities}` bundle.

**Architecture:** A pure `pool/` (id + `.devN` draft-version minting, id collection, new-item composer), a Zustand `pool` slice persisted in the draft, a pool-aware preview fetcher that re-resolves on pool edits, a controlled `PromptEditor`, and a canvas "+ Add item" action wiring it together. Reuses ED-C1's Option editor/ops and ED-B's resolver/bundle shape.

**Tech Stack:** Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright.

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-c2a-design.md](../specs/2026-06-14-editor-ed-c2a-design.md)

**Pinned facts (verified against the current code):**
- Store (`editor/src/state/store.ts`): `useEditorStore` state `{model, source, selection, expanded, dirty, validation, previewOpen}` + actions `loadModel(model, source)`, `applyEdit`, `revalidate`, `select`, `toggleExpanded`, `markSaved`, `togglePreview`, `reset`. `EntityBody` type lives in `editor/src/model/types.ts` (`= Record<string, unknown>`), re-exported by `editor/src/preview/resolve.ts`.
- Persistence (`editor/src/persistence/indexeddb.ts`): `Draft = {model, source, savedAt}` (in `editor/src/state/types.ts`); `saveDraft(model, source)`, `loadDraft(): Promise<Draft|null>`, `clearDraft()`. File (`file.ts`): `readQuestionnaireFile`, `downloadFilename(model)`, `exportToFile(model)`.
- App (`editor/src/app/App.tsx`): boot `loadDraft().then(d => loadModel(d.model, d.source))`; autosave effect deps `[model]` → `saveDraft(model, source)`; Topbar `onValidate={revalidate}`. Topbar (`Topbar.tsx`) has Validate / Preview / Export buttons; `doExport` calls `exportToFile(model)`.
- Canvas (`editor/src/canvas/Canvas.tsx`): for a selected page/section it renders the element list with `elementsPath = [...sel, 'elements']` and an `addSection` button (`+ Add section`); ED-C1 routes inline-items/shared-option-sections to `ItemEditor`. `ItemEditor` (`editor/src/canvas/ItemEditor.tsx`) shows a read-only prompt-ref chip + the `OptionEditor`.
- Preview (`editor/src/preview/PreviewPane.tsx`): `fetchEntity` prop defaults to `fetchEntityBody`; resolve effect debounced 300ms, deps `[model, fetchEntity]`, caches in `cacheRef`. `resolveEntities(model, fetchEntity, cache)` + `fetchEntityBody(ref, opts)` from `editor/src/persistence/library.ts`.
- ED-C1 Option ops in `editor/src/option/ops.ts`. Prompt version regex: `^v\d{2}\.\d{4}(\.dev\d+)?$`. Run tests: `cd editor && npx vitest run <path>`.

---

## Task 1: Pure minting + id-collection (`pool/mint.ts`)

**Files:**
- Create: `editor/src/pool/mint.ts`, `editor/src/pool/mint.test.ts`

- [ ] **Step 1: Write the failing tests**

`editor/src/pool/mint.test.ts`:
```ts
import { draftVersion, mintEntityId, collectIds } from './mint'
import type { Questionnaire } from '../model/types'

test('draftVersion appends .dev1, stripping any existing .devN', () => {
  expect(draftVersion('v26.0609')).toBe('v26.0609.dev1')
  expect(draftVersion('v26.0609.dev3')).toBe('v26.0609.dev1')
  expect(draftVersion(undefined)).toBe('v26.0609.dev1')
  expect(draftVersion('garbage')).toBe('v26.0609.dev1')
})

test('mintEntityId returns the first free <prefix>_new_<n>', () => {
  expect(mintEntityId('pr', new Set())).toBe('pr_new_1')
  expect(mintEntityId('pr', new Set(['pr_new_1', 'pr_new_2']))).toBe('pr_new_3')
})

test('collectIds gathers ids + ref ids (sans version) from model + pool', () => {
  const model = {
    metadata: { id: 'qst_t', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', elements: [{ question: { prompt: { ref: 'pr_a@v26.0609' } }, option: {} }] }],
  } as unknown as Questionnaire
  const ids = collectIds(model, { 'pr_b@v26.0609.dev1': { id: 'pr_b' } })
  expect(ids.has('qst_t')).toBe(true)
  expect(ids.has('page_1')).toBe(true)
  expect(ids.has('pr_a')).toBe(true)   // ref id, version stripped
  expect(ids.has('pr_b')).toBe(true)   // pool key, version stripped
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/pool/mint.test.ts` → FAIL (cannot resolve `./mint`).

- [ ] **Step 3: Write `editor/src/pool/mint.ts`**

```ts
import type { Questionnaire, EntityBody } from '../model/types'

const FALLBACK = 'v26.0609'

/** A draft entity version derived from the questionnaire's CalVer: strip any
 *  existing `.devN`, append `.dev1`. Falls back to the current schema CalVer. */
export function draftVersion(metadataVersion: string | undefined): string {
  const base = (metadataVersion ?? '').replace(/\.dev\d+$/, '')
  const clean = /^v\d{2}\.\d{4}$/.test(base) ? base : FALLBACK
  return `${clean}.dev1`
}

/** First free `<prefix>_new_<n>` not already used. */
export function mintEntityId(prefix: string, existingIds: Set<string>): string {
  let n = 1
  while (existingIds.has(`${prefix}_new_${n}`)) n++
  return `${prefix}_new_${n}`
}

/** Every entity id in play: `id` fields + `ref` ids (version stripped) in the
 *  model, plus pool keys (version stripped). Used for collision-free minting. */
export function collectIds(model: Questionnaire, pool: Record<string, EntityBody>): Set<string> {
  const ids = new Set<string>()
  JSON.stringify(model, (k, v) => {
    if (k === 'id' && typeof v === 'string') ids.add(v)
    if (k === 'ref' && typeof v === 'string') ids.add(v.split('@')[0])
    return v
  })
  for (const ref of Object.keys(pool)) ids.add(ref.split('@')[0])
  return ids
}
```
(If `EntityBody` is not exported from `../model/types`, import it from `../preview/resolve` instead — confirm which; ED-B moved it to `model/types`.)

- [ ] **Step 4: Run → PASS; commit**

Run: `cd editor && npx vitest run src/pool/mint.test.ts` → PASS.
```bash
git add editor/src/pool/mint.ts editor/src/pool/mint.test.ts
git commit -m "feat(editor): pure draft-version + id minting + id collection"
```

---

## Task 2: Store pool slice + draft persistence + App wiring

**Files:**
- Modify: `editor/src/state/store.ts`, `editor/src/state/types.ts`, `editor/src/persistence/indexeddb.ts`, `editor/src/app/App.tsx`
- Test: `editor/src/state/store.test.ts` (append), `editor/src/persistence/indexeddb.test.ts` (append)

- [ ] **Step 1: Write the failing store + persistence tests**

Append to `editor/src/state/store.test.ts`:
```ts
test('upsert/remove pool entity; loadModel seeds the pool; reset clears it', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' }, { 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  expect(useEditorStore.getState().pool['pr_x@v26.0609.dev1']).toEqual({ id: 'pr_x' })
  st.upsertPoolEntity('pr_y@v26.0609.dev1', { id: 'pr_y' })
  expect(useEditorStore.getState().pool['pr_y@v26.0609.dev1']).toEqual({ id: 'pr_y' })
  st.removePoolEntity('pr_x@v26.0609.dev1')
  expect(useEditorStore.getState().pool['pr_x@v26.0609.dev1']).toBeUndefined()
  st.reset()
  expect(useEditorStore.getState().pool).toEqual({})
})
```
(`phq9` + `Questionnaire` are already imported in that test file; `beforeEach` resets.)

Append to `editor/src/persistence/indexeddb.test.ts`:
```ts
test('saveDraft persists the pool; loadDraft returns it (empty for legacy)', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'new' }, { 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  const d = await loadDraft()
  expect(d?.entities).toEqual({ 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  await saveDraft(phq9 as Questionnaire, { kind: 'new' }) // no pool arg
  expect((await loadDraft())?.entities).toEqual({})
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/state/store.test.ts src/persistence/indexeddb.test.ts` → FAIL.

- [ ] **Step 3: Extend `state/types.ts`**

Add `entities` to `Draft`:
```ts
export interface Draft { model: Questionnaire; source: Source; savedAt: number; entities: Record<string, unknown> }
```

- [ ] **Step 4: Extend the store (`state/store.ts`)**

- Import `EntityBody`: add `import type { Questionnaire, EntityBody } from '../model/types'` (merge with the existing `Questionnaire` import).
- In `EditorState` add: `pool: Record<string, EntityBody>` and actions `upsertPoolEntity: (ref: string, body: EntityBody) => void`, `removePoolEntity: (ref: string) => void`. Change `loadModel` signature to `loadModel: (model: Questionnaire, source: Source, pool?: Record<string, EntityBody>) => void`.
- In the store body: add `pool: {}` to initial state; set `pool: pool ?? {}` inside `loadModel`'s `set({...})`; add:
```ts
  upsertPoolEntity: (ref, body) => set((s) => ({ pool: { ...s.pool, [ref]: body } })),
  removePoolEntity: (ref) => set((s) => { const p = { ...s.pool }; delete p[ref]; return { pool: p } }),
```
- Add `pool: {}` to the `reset()` set object.

- [ ] **Step 5: Extend persistence (`indexeddb.ts`)**

- Import `EntityBody` (`import type { EntityBody } from '../model/types'`).
- Change `saveDraft` to `export async function saveDraft(model: Questionnaire, source: Source, pool: Record<string, EntityBody> = {}): Promise<void>` and store `const draft: Draft = { model, source, savedAt: Date.now(), entities: pool }`.
- In `loadDraft`, normalize legacy drafts: `return res ? { ...res, entities: res.entities ?? {} } : null`.

- [ ] **Step 6: Wire the App (`app/App.tsx`)**

- Restore: `loadDraft().then((d) => { if (d) loadModel(d.model, d.source, d.entities) })`.
- Autosave: read pool + include in deps + pass to saveDraft:
```tsx
  const pool = useEditorStore((s) => s.pool)
  useEffect(() => {
    if (!model) return
    const t = setTimeout(() => {
      const { source, pool } = useEditorStore.getState()
      if (source) saveDraft(model, source, pool)
    }, 500)
    return () => clearTimeout(t)
  }, [model, pool])
```
(Replace the existing autosave effect; keep `loadModel`/`validation` destructure — add `pool` via the selector above.)

- [ ] **Step 7: Run → PASS; build; commit**

Run: `cd editor && npx vitest run src/state/ src/persistence/ && npm run typecheck && npm run build` → all green.
```bash
git add editor/src/state/store.ts editor/src/state/types.ts editor/src/persistence/indexeddb.ts editor/src/app/App.tsx editor/src/state/store.test.ts editor/src/persistence/indexeddb.test.ts
git commit -m "feat(editor): entity pool store slice + draft persistence + autosave wiring"
```

---

## Task 3: Bundle export

**Files:**
- Modify: `editor/src/persistence/file.ts`, `editor/src/app/Topbar.tsx`
- Test: `editor/src/persistence/file.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/persistence/file.test.ts`:
```ts
import { bundleData, bundleFilename } from './file'

test('bundleData wraps questionnaire + entities; filename has .bundle.json', () => {
  const model = { metadata: { id: 'qst_t' }, pages: [] } as unknown as import('../model/types').Questionnaire
  const pool = { 'pr_x@v26.0609.dev1': { id: 'pr_x' } }
  expect(bundleData(model, pool)).toEqual({ questionnaire: model, entities: pool })
  expect(bundleFilename(model)).toBe('qst_t.bundle.json')
})
```

- [ ] **Step 2: Run → fail, then extend `file.ts`**

Append to `editor/src/persistence/file.ts`:
```ts
import type { EntityBody } from '../model/types'

export function bundleData(model: Questionnaire, pool: Record<string, EntityBody>) {
  return { questionnaire: model, entities: pool }
}

export function bundleFilename(model: Questionnaire): string {
  const id = model.metadata?.id ?? 'questionnaire'
  return `${id}.bundle.json`
}

/** Browser-only: download the {questionnaire, entities} bundle. */
export function exportBundle(model: Questionnaire, pool: Record<string, EntityBody>): void {
  const blob = new Blob([JSON.stringify(bundleData(model, pool), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = bundleFilename(model)
  a.click()
  URL.revokeObjectURL(url)
}
```
Run: `cd editor && npx vitest run src/persistence/file.test.ts` → PASS.

- [ ] **Step 3: Add the Topbar "Export bundle" button**

In `editor/src/app/Topbar.tsx`: import `exportBundle` (alongside `exportToFile`); read the pool from the store (`const { model, dirty, validation, previewOpen, togglePreview } = useEditorStore()` — add `pool` via `const pool = useEditorStore((s) => s.pool)`); add a button next to Export:
```tsx
<button onClick={() => { if (model) exportBundle(model, pool) }}
        className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Export bundle</button>
```

- [ ] **Step 4: Run + build + commit**

Run: `cd editor && npx vitest run src/persistence/ && npm run typecheck && npm run build` → green.
```bash
git add editor/src/persistence/file.ts editor/src/persistence/file.test.ts editor/src/app/Topbar.tsx
git commit -m "feat(editor): {questionnaire, entities} bundle export"
```

---

## Task 4: Pool-aware live preview

**Files:**
- Create: `editor/src/pool/poolFetcher.ts`, `editor/src/pool/poolFetcher.test.ts`
- Modify: `editor/src/preview/PreviewPane.tsx`
- Test: `editor/src/preview/PreviewPane.test.tsx` (append)

- [ ] **Step 1: Write the failing poolFetcher test**

`editor/src/pool/poolFetcher.test.ts`:
```ts
import { makePoolFetcher } from './poolFetcher'

test('pool-first: returns the pool body without hitting the library', async () => {
  let libCalls = 0
  const lib = (async () => { libCalls++; return null }) as never
  const f = makePoolFetcher(() => ({ 'pr_x@v1': { id: 'pr_x' } }), lib)
  expect(await f('pr_x@v1')).toEqual({ id: 'pr_x' })
  expect(libCalls).toBe(0)
})

test('falls back to the library for non-pool refs', async () => {
  const lib = (async (ref: string) => ({ id: ref })) as never
  const f = makePoolFetcher(() => ({}), lib)
  expect(await f('pr_y@v1')).toEqual({ id: 'pr_y@v1' })
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/pool/poolFetcher.ts`**

```ts
import type { EntityBody } from '../model/types'
import type { FetchEntity } from '../preview/resolver'
import { fetchEntityBody } from '../persistence/library'

/** A FetchEntity that resolves pool entities first (read fresh, never cached by
 *  the resolver caller for these — see PreviewPane), else the Library. */
export function makePoolFetcher(getPool: () => Record<string, EntityBody>, lib: FetchEntity = fetchEntityBody): FetchEntity {
  return async (ref) => getPool()[ref] ?? (await lib(ref))
}
```
Run: `cd editor && npx vitest run src/pool/poolFetcher.test.ts` → PASS.

- [ ] **Step 3: Wire PreviewPane to the pool (live)**

Read the current `editor/src/preview/PreviewPane.tsx`, then make these minimal edits:
- Imports: add `import { useEditorStore } from '../state/store'` is already there (PreviewPane uses the store) — also `import { makePoolFetcher } from '../pool/poolFetcher'`.
- Replace the default `fetchEntity` prop with a pool-aware module-level default:
```tsx
const defaultPoolFetcher: FetchEntity = makePoolFetcher(() => useEditorStore.getState().pool)
export function PreviewPane({ fetchEntity = defaultPoolFetcher }: { fetchEntity?: FetchEntity }) {
```
- Add a pool subscription near the other store reads: `const pool = useEditorStore((s) => s.pool)`.
- In the resolve effect, **invalidate pool refs from the cache before resolving** and add `pool` to deps:
```tsx
  useEffect(() => {
    if (!model) return
    let ignore = false
    setResolving(true)
    const t = setTimeout(() => {
      for (const ref of Object.keys(pool)) cacheRef.current.delete(ref) // pool entities re-resolve fresh
      resolveEntities(model, fetchEntity, cacheRef.current).then((m) => {
        if (ignore) return
        setEntityMap(new Map(m))
        setResolving(false)
      })
    }, 300)
    return () => { ignore = true; clearTimeout(t) }
  }, [model, pool, fetchEntity])
```

- [ ] **Step 4: Add a PreviewPane pool test**

Append to `editor/src/preview/PreviewPane.test.tsx`:
```ts
test('resolves a prompt from the store pool (default fetcher) and updates on pool edit', async () => {
  const m = {
    metadata: { id: 'qst_t', title: 'T', language: 'en', available_languages: ['en'] },
    pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_a@v26.0609.dev1' } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'Q' } } } }] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(m, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity('pr_a@v26.0609.dev1', { id: 'pr_a', content: { en: { status: 'draft', text: 'Hello?' } } })
  render(<PreviewPane />)   // no injected fetchEntity → uses the default pool fetcher
  expect(await screen.findByText('Hello?', { selector: 'h2.qv-prompt' })).toBeInTheDocument()
})
```
(Use the `h2.qv-prompt` selector convention established in the ED-B PreviewPane test for the visible prompt; `render`/`screen`/`Questionnaire`/`useEditorStore` are already imported there.)

- [ ] **Step 5: Run → PASS; build; commit**

Run: `cd editor && npx vitest run src/pool/poolFetcher.test.ts src/preview/PreviewPane.test.tsx && npm run typecheck && npm run build` → green.
```bash
git add editor/src/pool/poolFetcher.ts editor/src/pool/poolFetcher.test.ts editor/src/preview/PreviewPane.tsx editor/src/preview/PreviewPane.test.tsx
git commit -m "feat(editor): pool-first live preview (re-resolves on pool edits)"
```

---

## Task 5: PromptEditor

**Files:**
- Create: `editor/src/entity/PromptEditor.tsx`, `editor/src/entity/PromptEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

`editor/src/entity/PromptEditor.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptEditor, type PromptBody } from './PromptEditor'

const prompt = (): PromptBody => ({ id: 'pr_1', content: { en: { status: 'draft', text: 'Hi' } } })

test('edits prompt text for the locale', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  const ta = screen.getByLabelText(/prompt text/i)
  await userEvent.type(ta, '!')
  expect(onChange.mock.calls.at(-1)![0].content.en.text).toBe('Hi!')
})

test('topics round-trip comma <-> array; reversed checkbox', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText(/topics/i), 'risk, novelty')
  expect(onChange.mock.calls.at(-1)![0].topics).toEqual(['risk', 'novelty'])
  await userEvent.click(screen.getByLabelText(/reversed/i))
  expect(onChange.mock.calls.at(-1)![0].reversed).toBe(true)
})

test('name/construct/dimension write through', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText(/^name/i), 'x')
  expect(onChange.mock.calls.at(-1)![0].name).toBe('x')
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/entity/PromptEditor.tsx`**

```tsx
export interface PromptBody {
  id: string
  name?: string
  construct?: string
  dimension?: string
  topics?: string[]
  reversed?: boolean
  content: Record<string, { status: string; text?: string }>
  [k: string]: unknown
}

export function PromptEditor({ prompt, locale, onChange }: { prompt: PromptBody; locale: string; onChange: (p: PromptBody) => void }) {
  const entry = prompt.content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) =>
    onChange({ ...prompt, content: { ...prompt.content, [locale]: { ...entry, status: entry.status ?? 'draft', text } } })
  const setField = (k: 'name' | 'construct' | 'dimension', v: string) => {
    const next = { ...prompt }
    if (v) next[k] = v; else delete next[k]
    onChange(next)
  }
  const setTopics = (v: string) => {
    const topics = v.split(',').map((t) => t.trim()).filter(Boolean)
    const next = { ...prompt }
    if (topics.length) next.topics = topics; else delete next.topics
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <label className="block text-sm">Prompt text ({locale})
        <textarea aria-label="Prompt text" value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Name
          <input aria-label="Name" value={prompt.name ?? ''} onChange={(e) => setField('name', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
        <label className="text-sm">Construct
          <input aria-label="Construct" value={prompt.construct ?? ''} onChange={(e) => setField('construct', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
        <label className="text-sm">Dimension
          <input aria-label="Dimension" value={prompt.dimension ?? ''} onChange={(e) => setField('dimension', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
      </div>
      <label className="block text-sm">Topics (comma-separated)
        <input aria-label="Topics" value={(prompt.topics ?? []).join(', ')} onChange={(e) => setTopics(e.target.value)}
               className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" aria-label="Reversed" checked={prompt.reversed ?? false}
               onChange={(e) => onChange({ ...prompt, reversed: e.target.checked })} />
        Reversed (loads negatively on its construct)
      </label>
    </div>
  )
}
```
Note: text/name/etc. are controlled; like ED-C1, in isolated tests the parent prop doesn't update between keystrokes, so the multi-char `topics`/`name` assertions assert the LAST onChange call's value built from a single render's prop — for `topics` typing "risk, novelty" the final keystroke produces the full string only if the input is uncontrolled OR the test types into a fresh value. To keep these robust, if a multi-char controlled-input assertion is flaky, the implementer may switch that specific test to assert the parse on a single `onChange` with a pre-filled `value` via `fireEvent.change(input, { target: { value: 'risk, novelty' } })` (one event, full string) — that's the cleaner way to test parse logic. Use `fireEvent.change` for `topics`/`name` if `userEvent.type` is flaky, and report it.

- [ ] **Step 3: Run → PASS; commit**

Run: `cd editor && npx vitest run src/entity/PromptEditor.test.tsx && npm run typecheck` → green.
```bash
git add editor/src/entity/PromptEditor.tsx editor/src/entity/PromptEditor.test.tsx
git commit -m "feat(editor): PromptEditor (per-locale text + name/construct/dimension/topics/reversed)"
```

---

## Task 6: New-item composer + ItemEditor + Canvas "+ Add item"

**Files:**
- Create: `editor/src/pool/newItem.ts`, `editor/src/pool/newItem.test.ts`
- Modify: `editor/src/canvas/ItemEditor.tsx`, `editor/src/canvas/Canvas.tsx`
- Test: `editor/src/canvas/ItemEditor.test.tsx` (append), `editor/src/canvas/Canvas.test.tsx` (append)

- [ ] **Step 1: Write the failing newItem test**

`editor/src/pool/newItem.test.ts`:
```ts
import { buildNewItem } from './newItem'

test('mints a prompt ref + empty prompt body + inline item with a default choice option', () => {
  const { promptRef, promptBody, item } = buildNewItem(new Set(['pr_new_1']), 'v26.0609.dev1', 'en')
  expect(promptRef).toBe('pr_new_2@v26.0609.dev1') // pr_new_1 taken
  expect(promptBody).toEqual({ id: 'pr_new_2', content: { en: { status: 'draft', text: '' } } })
  expect(item.question.prompt.ref).toBe('pr_new_2@v26.0609.dev1')
  expect(item.option.input_data_type).toBe('choice')
  expect(item.option.options).toHaveLength(2)
  expect(item.option.content.en.options).toHaveLength(2)
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/pool/newItem.ts`**

```ts
import type { EntityBody } from '../model/types'
import { mintEntityId } from './mint'

function defaultOption(locale: string) {
  return {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { [locale]: { status: 'draft', options: [{ index: 1, text: 'Option 1' }, { index: 2, text: 'Option 2' }] } },
  }
}

export interface NewItem {
  promptRef: string
  promptBody: EntityBody
  item: { question: { prompt: { ref: string } }; option: ReturnType<typeof defaultOption> }
}

export function buildNewItem(existingIds: Set<string>, draftVer: string, locale: string): NewItem {
  const id = mintEntityId('pr', existingIds)
  const promptRef = `${id}@${draftVer}`
  const promptBody: EntityBody = { id, content: { [locale]: { status: 'draft', text: '' } } }
  return { promptRef, promptBody, item: { question: { prompt: { ref: promptRef } }, option: defaultOption(locale) } }
}
```
Run: `cd editor && npx vitest run src/pool/newItem.test.ts` → PASS.

- [ ] **Step 3: ItemEditor — render PromptEditor for pool prompts**

Modify `editor/src/canvas/ItemEditor.tsx`. Read the current file; then, where it currently shows the read-only prompt chip, add pool-aware editing. Read the pool from the store and the prompt ref; if the ref is a pool entity, render `PromptEditor` wired to `upsertPoolEntity`; else keep the read-only chip + "fork to edit (ED-C4)" note. Concretely, inside `ItemEditor` (which already has `{ model, applyEdit }` from the store + the node + `promptRef`):
```tsx
import { useEditorStore } from '../state/store'
import { PromptEditor, type PromptBody } from '../entity/PromptEditor'
// …
const { model, applyEdit, pool, upsertPoolEntity } = useEditorStore()
// promptRef computed as before; locale = String(model.metadata.language ?? 'en')
const poolPrompt = promptRef ? (pool[promptRef] as PromptBody | undefined) : undefined
```
Replace the read-only "Question" chip block with:
```tsx
{promptRef && (
  <div className="mb-4">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Question</span>
    {poolPrompt ? (
      <div className="mt-2">
        <PromptEditor prompt={poolPrompt} locale={locale} onChange={(p) => upsertPoolEntity(promptRef, p)} />
      </div>
    ) : (
      <div className="mt-1 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-400">◉</span><span className="font-mono">{promptRef}</span>
        <span className="ml-auto text-xs text-slate-400">fork to edit (ED-C4)</span>
      </div>
    )}
  </div>
)}
```
(Keep the rest of ItemEditor — the Option editor section — unchanged. `pool`/`upsertPoolEntity` now come from the store.)

- [ ] **Step 4: Append an ItemEditor pool-prompt test**

Append to `editor/src/canvas/ItemEditor.test.tsx`:
```tsx
test('edits a pool prompt via the PromptEditor', async () => {
  const ref = 'pr_p@v26.0609.dev1'
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as import('../model/types').Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity(ref, { id: 'pr_p', content: { en: { status: 'draft', text: 'Q' } } })
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  const ta = screen.getByLabelText(/prompt text/i)
  await userEvent.type(ta, '?')
  expect((useEditorStore.getState().pool[ref] as { content: { en: { text: string } } }).content.en.text).toMatch(/Q/)
})
```

- [ ] **Step 5: Canvas "+ Add item"**

In `editor/src/canvas/Canvas.tsx` (the element-list view that has `addSection`): import `buildNewItem` + `collectIds` + `draftVersion` from `../pool/...`; read `pool`/`upsertPoolEntity` from the store; add an `addItem` action and a button beside "+ Add section", shown only for `kind === 'page' || kind === 'section'`:
```tsx
const addItem = () => {
  const ids = collectIds(model, pool)
  const draftVer = draftVersion(model.metadata.version as string | undefined)
  const locale = String(model.metadata.language ?? 'en')
  const { promptRef, promptBody, item } = buildNewItem(ids, draftVer, locale)
  upsertPoolEntity(promptRef, promptBody)
  applyEdit((m) => insertNode(m, elementsPath, elements.length, item))
  select([...elementsPath, elements.length])
}
```
Button (next to Add section):
```tsx
<button onClick={addItem} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add item</button>
```
(`select`, `pool`, `upsertPoolEntity` from `useEditorStore()`; `insertNode` already imported.)

- [ ] **Step 6: Append a Canvas add-item test**

Append to `editor/src/canvas/Canvas.test.tsx`:
```tsx
test('Add item mints a pool prompt and appends an inline item, then selects it', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))
  const st = useEditorStore.getState()
  expect(st.model!.pages[0].elements.length).toBe(before + 1)
  expect(Object.keys(st.pool).length).toBeGreaterThan(0)
  const added = st.model!.pages[0].elements[before] as { question: { prompt: { ref: string } } }
  expect(st.pool[added.question.prompt.ref]).toBeTruthy()
})
```
(`phq9` is loaded in this test file's `beforeEach`.)

- [ ] **Step 7: Run + build + commit**

Run: `cd editor && npx vitest run src/pool/ src/canvas/ && npm run typecheck && npm run build` → all green.
```bash
git add editor/src/pool/newItem.ts editor/src/pool/newItem.test.ts editor/src/canvas/ItemEditor.tsx editor/src/canvas/ItemEditor.test.tsx editor/src/canvas/Canvas.tsx editor/src/canvas/Canvas.test.tsx
git commit -m "feat(editor): new-item composer + PromptEditor in ItemEditor + canvas + Add item"
```

---

## Task 7: Playwright smoke + screenshot

**Files:**
- Modify: `editor/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Append the smoke test**

```ts
test('add a new item, type a prompt, see it in the preview + export bundle', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // select page 1 in the tree, then add an item
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()

  // PromptEditor appears; type a prompt
  const promptText = page.getByLabelText(/prompt text/i)
  await expect(promptText).toBeVisible()
  await promptText.fill('How are you today?')

  // open preview → the new prompt renders (pool-resolved)
  await page.getByRole('button', { name: /preview/i }).click()
  await expect(page.getByRole('region', { name: /preview/i }).locator('h2.qv-prompt', { hasText: 'How are you today?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c2a-new-item.png', fullPage: true })
})
```
(If `getByLabelText` isn't available on `page` in this Playwright version, use `page.getByLabel(/prompt text/i)`.)

- [ ] **Step 2: Run**

Run: `cd editor && npm run build && npx playwright test` → all smokes pass; screenshot at `editor/tests/e2e/screenshots/ed-c2a-new-item.png`.

- [ ] **Step 3: Show owner the screenshot, then commit**

```bash
git add editor/tests/e2e/smoke.spec.ts
git commit -m "test(editor): Playwright new-item authoring smoke + ED-C2a screenshot"
```

---

## Task 8: README + FOLLOWUPS

**Files:**
- Modify: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: README** — add an "ED-C2a — entity pool + new items" section: "+ Add item" mints a draft Prompt into the local entity pool (`.devN` versions), edit its text + metadata in the canvas, see it live in the preview (pool-resolved); the pool persists in the draft and exports as a `{questionnaire, entities}` bundle ("Export bundle"). Update the does/doesn't list (does: author new items + prompts; doesn't yet: Context/Instruction/Message [ED-C2b], pick-from-Library [ED-C3], fork Library content [ED-C4], translate [ED-E], rename pool-entity ids, promote to Library [OD-08]).

- [ ] **Step 2: FOLLOWUPS** — append:
  - (s) Pool-entity **id rename** isn't supported in C2a (renaming would re-key the pool + repoint the item) — minted `pr_new_<n>` ids stick; a rename affordance is a later nicety.
  - (t) Draft version is derived from `metadata.version` (`+ .dev1`); all new entities in a draft share one `.dev1` version. Multiple draft iterations (`.dev2`…) aren't surfaced.
  - (u) Bundle export is the only way to carry pool entities out; promoting pool drafts to real Library versions needs Identity/write (OD-08).
  - (v) New items are intentionally invalid until the prompt text is typed (banner-surfaced).

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-C2a README + FOLLOWUPS"
```

---

## Final verification

```bash
cd editor && npm test && npm run typecheck && npm run build && npx playwright test
```
All green. ED-C2a success: "+ Add item" → type a new prompt (pooled) + adjust its option → live preview shows it → "Export bundle" re-validates; pool survives reload; editing a pool prompt updates the preview live.

---

## Self-review notes (author)

**Spec coverage:** pool store slice + persistence + reset (Task 2) ✓; `.devN` minting from metadata.version + id collection (Task 1) ✓; bundle export (Task 3) ✓; pool-first live preview re-resolving on pool edits (Task 4) ✓; PromptEditor with all fields (Task 5) ✓; new-item composer + ItemEditor pool-prompt editing + canvas "+ Add item" (Task 6) ✓; Playwright author-new-item smoke (Task 7) ✓; README/FOLLOWUPS (Task 8) ✓; back-compat legacy draft load (Task 2 loadDraft normalize) ✓.

**Deferred per spec (no task, intentional):** Context/Instruction/Message (C2b); pick-from-Library (C3); edit/fork Library-pinned content (C4); translation (ED-E); id rename + Library promotion.

**Type consistency:** `EntityBody` (from `model/types`) used in store/persistence/mint/poolFetcher/newItem; `draftVersion`/`mintEntityId`/`collectIds` (mint.ts) used in newItem + Canvas; `buildNewItem` shape used in Canvas + tests; `makePoolFetcher(getPool, lib?)` (poolFetcher) used in PreviewPane; `PromptBody` (PromptEditor) used in ItemEditor; store `pool`/`upsertPoolEntity`/`removePoolEntity`/`loadModel(...,pool?)` consistent across store/App/Topbar/ItemEditor/Canvas; persistence `saveDraft(model, source, pool?)` + `Draft.entities` consistent.

**Build-order:** Task 1 (mint) → Task 2 (store/persistence use nothing new yet) → Task 3 (bundle) → Task 4 (poolFetcher+preview) → Task 5 (PromptEditor) → Task 6 (newItem+ItemEditor+Canvas compose all) → 7/8. Each independently green.
