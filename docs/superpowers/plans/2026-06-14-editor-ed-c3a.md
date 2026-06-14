# Editor ED-C3a (Library Body Endpoint + Pick-from-Library) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an author pick an existing entity from the Library and insert a hard-pinned `@vYY.MMDD` ref — backed by a new Library entity-body endpoint that also fixes ED-B's broken Library-ref preview.

**Architecture:** A small additive `library/` endpoint serving `content_json` per entity version; an editor Library client (repointed `fetchEntityBody` + new `searchEntities`); a modal `LibraryPicker` (search → body snippet → insert) opened via a store slice from per-slot "Pick" buttons in ItemEditor and "+ Pick item"/"+ Pick message" in the Canvas. Picked refs are read-only + preview live through the fixed resolver.

**Tech Stack:** library — Python · FastAPI · Postgres (testcontainers, `DOCKER_CONFIG=/tmp/lib_docker`). editor — Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright.

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-c3a-design.md](../specs/2026-06-14-editor-ed-c3a-design.md)

**Pinned facts (verified):**
- Library `entities.py` has `/v1/entities/{etype}` (list+`q`, `Paginated`<`EntitySummary`>), `/entities/{etype}/{eid}` and `…/versions/{version}` (metadata only). `EntitySummary = {id, version, entity_type, title, status, effective_license}`. `ENTITY_TYPES` includes prompt/option/context/instruction/message/item/etc. (prefix map in `entity_types.py`). The questionnaire `/definition` handler (`questionnaires.py:48`) does `SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s` → 404 missing / 410 withdrawn / else body — **mirror this**. Withdrawn JSON uses `JSONResponse(status_code=410, content={"error":{...}})`.
- Library integration tests: `library/tests/integration/test_api_entities.py` — a `client` fixture ingests `tests/fixtures/content` and returns a `TestClient`; pattern: `client.get("/v1/entities/option").json()["items"][0]` then GET its version route. Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q` (testcontainers Postgres; the DOCKER_CONFIG override is required — see HANDOFF).
- Editor `persistence/library.ts`: `parseRef(ref) → {type, id, version}` (prefix map matches Library `ENTITY_TYPES`), `fetchEntityBody(ref, opts)` currently `GET {base}/v1/entities/{type}/{id}?version=` (BROKEN — returns metadata), `FetchOpts {baseUrl?, fetchImpl?}`, `DEFAULT_BASE`. `EntityBody` from `model/types`. `FetchEntity` from `preview/resolver`.
- Editor store: `pool`/`upsertPoolEntity`/`removePoolEntity`/`applyEdit`/`select`/`reset`; `model/tree.ts` `updateNodeProps`/`insertNode`/`unsetNodeProp`. `ItemEditor` has prompt/context/instruction slots (+ "+ Add" buttons) + the Option editor; `Canvas` element-list view has `elementsPath`/`addItem`/`addMessage` + buttons (page/section).
- Run editor tests: `cd editor && npx vitest run <path>`. Git from repo root.

---

## Task 1: Library entity-body endpoint

**Files:**
- Modify: `library/src/library/api/entities.py`
- Test: `library/tests/integration/test_api_entities.py` (append)

- [ ] **Step 1: Write the failing integration test**

Append to `library/tests/integration/test_api_entities.py`:
```python
def test_entity_definition_returns_body(client):
    """GET /v1/entities/{etype}/{eid}/versions/{version}/definition returns content_json."""
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/{opt['version']}/definition")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == opt["id"]
    assert body["input_data_type"]  # an Option body carries its structural fields

def test_entity_definition_404_unknown(client):
    assert client.get("/v1/entities/option/opt_nope/versions/v26.0601/definition").status_code == 404
    assert client.get("/v1/entities/notatype/x/versions/v26.0601/definition").status_code == 404
```

- [ ] **Step 2: Run → fail**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_entities.py -q -k definition`
Expected: FAIL (404 — route doesn't exist).

- [ ] **Step 3: Add the handler to `entities.py`**

Add the import for `JSONResponse` (top of file: `from fastapi.responses import JSONResponse`) and this route (after `get_entity_version`):
```python
@router.get("/entities/{etype}/{eid}/versions/{version}/definition")
def entity_definition(etype: str, eid: str, version: str, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    row = conn.execute(
        "SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s",
        (eid, version)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")
    status, content_json, withdrawn_at = row
    if status == "withdrawn" or content_json is None:
        return JSONResponse(status_code=410, content={
            "error": {"code": "gone", "message": "withdrawn",
                      "withdrawn_at": withdrawn_at.isoformat() if withdrawn_at else None}})
    return content_json
```

- [ ] **Step 4: Run → PASS**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_entities.py -q`
Expected: PASS (new + existing entity tests).

- [ ] **Step 5: Commit**

```bash
git add library/src/library/api/entities.py library/tests/integration/test_api_entities.py
git commit -m "feat(library): per-entity body endpoint (/v1/entities/{etype}/{eid}/versions/{version}/definition)"
```

---

## Task 2: Editor Library client — fix `fetchEntityBody`, add `searchEntities`

**Files:**
- Modify: `editor/src/persistence/library.ts`, `editor/src/persistence/library.test.ts`

- [ ] **Step 1: Update the failing tests**

In `editor/src/persistence/library.test.ts`, REPLACE the existing `fetchEntityBody` URL assertions to the new versioned definition path, and ADD a `searchEntities` test:
```ts
test('fetchEntityBody requests the versioned definition endpoint', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x', content: {} }) } as Response }) as unknown as typeof fetch
  const body = await fetchEntityBody('pr_x@v26.0602', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(body).toEqual({ id: 'pr_x', content: {} })
  expect(calls[0]).toBe('http://lib/v1/entities/prompt/pr_x/versions/v26.0602/definition')
})

test('fetchEntityBody returns null on non-OK / error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
})

test('searchEntities queries /v1/entities/{etype} and returns items', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ items: [{ id: 'pr_a', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }) } as Response }) as unknown as typeof fetch
  const { items, total } = await searchEntities('prompt', 'mood', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(total).toBe(1)
  expect(items[0].id).toBe('pr_a')
  expect(calls[0]).toContain('/v1/entities/prompt?')
  expect(calls[0]).toContain('q=mood')
})
```
(Update the import line to include `searchEntities`. Remove the OLD fetchEntityBody URL test that asserted `?version=`/`resolved=false` if present.)

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/persistence/library.test.ts` → FAIL.

- [ ] **Step 3: Edit `library.ts`**

Replace the body of `fetchEntityBody` to use the versioned definition path:
```ts
export async function fetchEntityBody(ref: string, opts: FetchOpts = {}): Promise<EntityBody | null> {
  const parsed = parseRef(ref)
  if (!parsed) return null
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${parsed.type}/${parsed.id}/versions/${encodeURIComponent(parsed.version)}/definition`
  try {
    const res = await f(url)
    if (!res.ok) return null
    return (await res.json()) as EntityBody
  } catch {
    return null
  }
}
```
Add `searchEntities`:
```ts
export interface EntitySearchResult { id: string; version: string; title: string | null; entity_type: string }

export async function searchEntities(etype: string, q: string, opts: FetchOpts = {}): Promise<{ items: EntitySearchResult[]; total: number }> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${etype}?q=${encodeURIComponent(q)}&limit=20`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library search failed (${res.status}) for ${etype}`)
  const data = (await res.json()) as { items?: EntitySearchResult[]; total?: number }
  return { items: data.items ?? [], total: data.total ?? 0 }
}
```

- [ ] **Step 4: Run → PASS + full suite (ensure ED-B resolver tests still green)**

Run: `cd editor && npx vitest run src/persistence/library.test.ts && npm test` → PASS (ED-B PreviewPane/resolver tests inject fetchers so they're unaffected).

- [ ] **Step 5: Commit**

```bash
git add editor/src/persistence/library.ts editor/src/persistence/library.test.ts
git commit -m "fix(editor): fetchEntityBody uses versioned /definition; add searchEntities client"
```

---

## Task 3: Picker pure helpers (`library/picker.ts`)

**Files:**
- Create: `editor/src/library/picker.ts`, `editor/src/library/picker.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/library/picker.test.ts`:
```ts
import { buildRef, bodySnippet } from './picker'

test('buildRef joins id@version', () => {
  expect(buildRef('pr_a', 'v26.0609')).toBe('pr_a@v26.0609')
})

test('bodySnippet prefers locale text, then label, then a fallback', () => {
  expect(bodySnippet({ id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' } } }, 'en')).toBe('How are you?')
  expect(bodySnippet({ id: 'opt_a', content: { en: { status: 'validated', label: 'Agreement' } } }, 'en')).toBe('Agreement')
  expect(bodySnippet({ id: 'pr_b', content: { pt: { status: 'validated', text: 'Olá' } } }, 'en')).toBe('Olá') // falls back to any locale
  expect(bodySnippet({ id: 'msg_x' }, 'en')).toBe('msg_x') // no content → id
  expect(bodySnippet(null, 'en')).toBe('')
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/library/picker.ts`**

```ts
export function buildRef(id: string, version: string): string {
  return `${id}@${version}`
}

export function bodySnippet(body: Record<string, unknown> | null, locale: string): string {
  if (!body) return ''
  const content = body.content as Record<string, { text?: string; label?: string }> | undefined
  const entry = content?.[locale] ?? (content ? Object.values(content)[0] : undefined)
  return entry?.text ?? entry?.label ?? String(body.id ?? '')
}
```
Run: `cd editor && npx vitest run src/library/picker.test.ts` → PASS.

- [ ] **Step 3: Commit**

```bash
git add editor/src/library/picker.ts editor/src/library/picker.test.ts
git commit -m "feat(editor): picker pure helpers (buildRef, bodySnippet)"
```

---

## Task 4: Store picker slice + LibraryPicker modal + PickerHost

**Files:**
- Modify: `editor/src/state/store.ts`, `editor/src/state/store.test.ts` (append)
- Create: `editor/src/library/LibraryPicker.tsx`, `editor/src/library/LibraryPicker.test.tsx`
- Modify: `editor/src/app/App.tsx`

- [ ] **Step 1: Store picker slice + test**

Append to `editor/src/state/store.test.ts`:
```ts
test('openPicker/closePicker manage picker state', () => {
  const st = useEditorStore.getState()
  const onPick = vi.fn()
  st.openPicker('prompt', onPick)
  expect(useEditorStore.getState().picker?.etype).toBe('prompt')
  useEditorStore.getState().picker!.onPick('pr_a@v1')
  expect(onPick).toHaveBeenCalledWith('pr_a@v1')
  st.closePicker()
  expect(useEditorStore.getState().picker).toBeNull()
})
```
In `editor/src/state/store.ts`: add to `EditorState` `picker: { etype: string; onPick: (ref: string) => void } | null` and `openPicker: (etype: string, onPick: (ref: string) => void) => void`, `closePicker: () => void`. Init `picker: null`; implement `openPicker: (etype, onPick) => set({ picker: { etype, onPick } })`, `closePicker: () => set({ picker: null })`; add `picker: null` to `reset()`.

Run: `cd editor && npx vitest run src/state/store.test.ts` → PASS.

- [ ] **Step 2: Write the failing LibraryPicker test**

`editor/src/library/LibraryPicker.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryPicker } from './LibraryPicker'

const client = {
  searchEntities: async () => ({ items: [{ id: 'pr_mood', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }),
  fetchEntityBody: async () => ({ id: 'pr_mood', content: { en: { status: 'validated', text: 'How is your mood?' } } }),
}

test('search → select shows snippet → insert pins the ref', async () => {
  const onPick = vi.fn()
  render(<LibraryPicker etype="prompt" locale="en" onPick={onPick} onClose={() => {}} client={client} />)
  await userEvent.type(screen.getByLabelText(/search/i), 'mood')
  await waitFor(() => expect(screen.getByText('pr_mood')).toBeInTheDocument())
  await userEvent.click(screen.getByText('pr_mood'))
  await waitFor(() => expect(screen.getByText('How is your mood?')).toBeInTheDocument())
  await userEvent.click(screen.getByRole('button', { name: /insert/i }))
  expect(onPick).toHaveBeenCalledWith('pr_mood@v26.0609')
})
```

- [ ] **Step 3: Write `editor/src/library/LibraryPicker.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { searchEntities as realSearch, fetchEntityBody as realFetchBody, type EntitySearchResult } from '../persistence/library'
import { buildRef, bodySnippet } from './picker'
import type { EntityBody } from '../model/types'

export interface PickerClient {
  searchEntities: (etype: string, q: string) => Promise<{ items: EntitySearchResult[]; total: number }>
  fetchEntityBody: (ref: string) => Promise<EntityBody | null>
}
const defaultClient: PickerClient = {
  searchEntities: (etype, q) => realSearch(etype, q),
  fetchEntityBody: (ref) => realFetchBody(ref),
}

export function LibraryPicker({ etype, locale, onPick, onClose, client = defaultClient }: {
  etype: string; locale: string; onPick: (ref: string) => void; onClose: () => void; client?: PickerClient
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<EntitySearchResult[]>([])
  const [selected, setSelected] = useState<EntitySearchResult | null>(null)
  const [snippet, setSnippet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const tRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!q) { setItems([]); return }
    clearTimeout(tRef.current)
    tRef.current = setTimeout(() => {
      client.searchEntities(etype, q).then((r) => { setItems(r.items); setError(null) })
        .catch(() => setError('Library unavailable'))
    }, 300)
    return () => clearTimeout(tRef.current)
  }, [q, etype, client])

  const select = (it: EntitySearchResult) => {
    setSelected(it); setSnippet('')
    client.fetchEntityBody(buildRef(it.id, it.version)).then((b) => setSnippet(bodySnippet(b, locale))).catch(() => setSnippet(''))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <strong className="text-sm">Pick {etype} from Library</strong>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="p-3">
          <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${etype}s…`}
                 className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-60 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => select(it)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${selected?.id === it.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                  <span className="font-mono">{it.id}</span>
                  {it.title && <span className="truncate text-slate-500">{it.title}</span>}
                  <span className="ml-auto text-xs text-slate-400">{it.version}</span>
                </button>
              </li>
            ))}
            {q && items.length === 0 && !error && <li className="px-2 py-1 text-sm text-slate-400">No results.</li>}
          </ul>
          {selected && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Preview ({locale})</div>
              <div className="mt-1">{snippet || <span className="text-slate-400">…</span>}</div>
              <button onClick={() => onPick(buildRef(selected.id, selected.version))}
                      className="mt-2 rounded bg-slate-800 px-3 py-1 text-sm text-white">Insert {selected.id}@{selected.version}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```
Run: `cd editor && npx vitest run src/library/LibraryPicker.test.tsx` → PASS.

- [ ] **Step 4: Render the picker host in App**

In `editor/src/app/App.tsx`, render the modal once when `picker` is set (inside the workspace branch, after `<EditorWorkspace />`):
```tsx
import { LibraryPicker } from '../library/LibraryPicker'
// …in the loaded-model return, after <EditorWorkspace />:
{(() => {
  const picker = useEditorStore((s) => s.picker)   // NOTE: call hooks at top level — see below
  return null
})()}
```
**Correction (hooks rule):** don't call the hook in an IIFE. Instead, near the top of `App()` add `const picker = useEditorStore((s) => s.picker)` and `const closePicker = useEditorStore((s) => s.closePicker)`, and in the loaded-model JSX (after `<EditorWorkspace />`) render:
```tsx
{picker && model && (
  <LibraryPicker etype={picker.etype} locale={String(model.metadata.language ?? 'en')}
                 onPick={(ref) => { picker.onPick(ref); closePicker() }} onClose={closePicker} />
)}
```

- [ ] **Step 5: Run app tests + build + commit**

Run: `cd editor && npx vitest run src/state/ src/library/ src/app/ && npm run typecheck && npm run build` → green.
```bash
git add editor/src/state/store.ts editor/src/state/store.test.ts editor/src/library/LibraryPicker.tsx editor/src/library/LibraryPicker.test.tsx editor/src/app/App.tsx
git commit -m "feat(editor): LibraryPicker modal + store picker slice + app host"
```

---

## Task 5: Pick wiring — ItemEditor slots + Canvas pick item/message

**Files:**
- Modify: `editor/src/canvas/ItemEditor.tsx`, `editor/src/canvas/Canvas.tsx`
- Test: `editor/src/canvas/ItemEditor.test.tsx` (append), `editor/src/canvas/Canvas.test.tsx` (append)

- [ ] **Step 1: Write the failing ItemEditor test**

Append to `editor/src/canvas/ItemEditor.test.tsx`:
```tsx
test('Pick prompt opens the picker; the onPick sets a Library ref', async () => {
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
  await userEvent.click(screen.getByRole('button', { name: /pick prompt/i }))
  // the picker opened with etype 'prompt'; simulate the pick
  expect(useEditorStore.getState().picker?.etype).toBe('prompt')
  useEditorStore.getState().picker!.onPick('pr_lib@v26.0609')
  const q = (useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }).question
  expect(q.prompt.ref).toBe('pr_lib@v26.0609')
})
```

- [ ] **Step 2: Run → fail, then wire ItemEditor**

In `editor/src/canvas/ItemEditor.tsx`: destructure `openPicker` from the store (`const { model, applyEdit, pool, upsertPoolEntity, removePoolEntity, openPicker } = useEditorStore()`). Add pick handlers + "Pick from Library" buttons for each slot. Helpers:
```tsx
const pickInto = (slotKey: 'prompt' | 'context' | 'instruction', etype: string) => {
  const prev = (question?.[slotKey] as { ref?: string } | undefined)?.ref
  openPicker(etype, (ref) => {
    applyEdit((m) => updateNodeProps(m, questionPath, { [slotKey]: { ref } }))
    if (prev && pool[prev]) removePoolEntity(prev) // drop the orphaned pool draft we replaced
  })
}
const pickOption = () => {
  const prev = typeof option === 'object' && option && 'ref' in option ? (option as { ref: string }).ref : undefined
  openPicker('option', (ref) => {
    applyEdit((m) => updateNodeProps(m, path, { [optionKey]: { ref } }))
    if (prev && pool[prev]) removePoolEntity(prev)
  })
}
```
Add the buttons: in the Question/prompt area a `Pick prompt` button (always, when `question` exists); in the Context section header a `Pick context` button (beside "+ Add context"); in the Instruction section a `Pick instruction` button; near the Option editor header a `Pick option` button. Example for prompt (place beside the existing prompt block, inside `{promptRef && ...}` or in the `{question && ...}` area):
```tsx
{question && <button onClick={() => pickInto('prompt', 'prompt')} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">Pick prompt</button>}
```
For context/instruction, add beside their existing "+ Add" buttons:
```tsx
<button onClick={() => pickInto('context', 'context')} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">Pick context</button>
```
```tsx
<button onClick={() => pickInto('instruction', 'instruction')} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">Pick instruction</button>
```
For the Option, beside the "Response (Option)" label:
```tsx
<button onClick={pickOption} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">Pick option</button>
```
(Place these so they read cleanly; gate the prompt/option picks on the item being a question-bearing item. `questionPath`, `option`, `optionKey`, `question` are already computed in ItemEditor from C2a/C2b.)

Run: `cd editor && npx vitest run src/canvas/ItemEditor.test.tsx` → PASS.

- [ ] **Step 3: Write the failing Canvas test**

Append to `editor/src/canvas/Canvas.test.tsx`:
```tsx
test('Pick item opens the item picker; onPick inserts a saved-item ref', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /pick item/i }))
  expect(useEditorStore.getState().picker?.etype).toBe('item')
  useEditorStore.getState().picker!.onPick('it_lib@v26.0609')
  const els = useEditorStore.getState().model!.pages[0].elements
  expect(els.length).toBe(before + 1)
  expect((els[before] as { ref: string }).ref).toBe('it_lib@v26.0609')
})
```

- [ ] **Step 4: Run → fail, then wire Canvas**

In `editor/src/canvas/Canvas.tsx`: destructure `openPicker` from the store. Add actions + buttons (page/section only, beside the existing add/pick group):
```tsx
const pickItem = () => openPicker('item', (ref) => { const i = (getAtPath(model, elementsPath) as unknown[] | undefined)?.length ?? elements.length; applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref })); select([...elementsPath, elements.length]) })
const pickMessage = () => openPicker('message', (ref) => { applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref })); select([...elementsPath, elements.length]) })
```
Buttons (gated `kind === 'page' || 'section'`):
```tsx
<button onClick={pickItem} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Pick item</button>
<button onClick={pickMessage} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Pick message</button>
```
(Keep the button group right-aligned; the implementer adjusts `ml-auto` so all buttons show.)

Run: `cd editor && npx vitest run src/canvas/Canvas.test.tsx` → PASS.

- [ ] **Step 5: Run + build + commit**

Run: `cd editor && npx vitest run src/canvas/ && npm run typecheck && npm run build` → green.
```bash
git add editor/src/canvas/ItemEditor.tsx editor/src/canvas/ItemEditor.test.tsx editor/src/canvas/Canvas.tsx editor/src/canvas/Canvas.test.tsx
git commit -m "feat(editor): pick-from-Library wiring in ItemEditor slots + Canvas item/message"
```

---

## Task 6: Playwright smoke + screenshot

**Files:**
- Modify: `editor/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Append the smoke test (stub the Library list + body)**

```ts
test('pick a prompt from the Library into a new item', async ({ page }) => {
  // stub Library search (list) + entity body
  await page.route('**/v1/entities/prompt?*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'pr_lib_mood', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }) })
  })
  await page.route('**/v1/entities/prompt/pr_lib_mood/versions/v26.0609/definition', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'pr_lib_mood', content: { en: { status: 'validated', text: 'Library: how is your mood?' } } }) })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()        // a new item is selected
  await page.getByRole('button', { name: /pick prompt/i }).click()     // open the picker
  await page.getByLabel(/search/i).fill('mood')
  await page.getByText('pr_lib_mood').click()
  await expect(page.getByText('Library: how is your mood?')).toBeVisible()  // snippet
  await page.getByRole('button', { name: /insert/i }).click()

  // preview shows the picked Library prompt
  await page.getByRole('button', { name: /preview/i }).click()
  await expect(page.getByRole('region', { name: /preview/i }).locator('h2.qv-prompt', { hasText: 'Library: how is your mood?' })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c3a-pick-library.png', fullPage: true })
})
```
(Note the preview also resolves the picked ref via the same stubbed `…/definition` route. Use `page.getByLabel` not getByLabelText.)

- [ ] **Step 2: Run**

Run: `cd editor && npm run build && npx playwright test` → all smokes pass; screenshot at `editor/tests/e2e/screenshots/ed-c3a-pick-library.png`. (If a strict-mode selector is ambiguous, scope it; report.)

- [ ] **Step 3: Show owner the screenshot, then commit**

```bash
git add editor/tests/e2e/smoke.spec.ts
git commit -m "test(editor): Playwright pick-from-Library smoke + ED-C3a screenshot"
```

---

## Task 7: README + FOLLOWUPS

**Files:**
- Modify: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: README** — add an "ED-C3a — pick from Library" section: a modal Library picker (search by type + a content snippet) opens from per-slot "Pick from Library" buttons (prompt/option/context/instruction) and the page "+ Pick item"/"+ Pick message"; selecting inserts a hard-pinned `@vYY.MMDD` ref (latest version) that previews live and is read-only (fork in ED-C4). Note the new Library endpoint dependency. Update the does/doesn't list.

- [ ] **Step 2: FOLLOWUPS** — append:
  - (aa) **RESOLVED**: ED-B FOLLOWUPS (g) — the Library entity-body endpoint now exists (`/v1/entities/{etype}/{eid}/versions/{version}/definition`) and `fetchEntityBody` uses it; Library-pinned refs preview correctly.
  - (bb) **Deploy needed:** the live Vercel Library must be redeployed to expose the new entity-body endpoint before pick-from-Library works against the live API (editor tests + the Playwright smoke stub it).
  - (cc) C3a pins the **latest** version at pick time; explicit version selection + newer-version detection/upgrade is **ED-C3b** (OD-06).
  - (dd) Picked refs are **read-only** in the editor (fork = ED-C4); the picker has no facets/instrument-grouping (focused picker, not the library-web catalogue).

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-C3a README + FOLLOWUPS"
```

---

## Final verification

```bash
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q          # library endpoint + existing
cd editor && npm test && npm run typecheck && npm run build && npx playwright test
```
All green. ED-C3a success: the Library serves entity bodies; ED-B previews Library refs correctly; an author can pick a Library entity into a slot and insert a hard-pinned ref that previews live + round-trips valid.

---

## Self-review notes (author)

**Spec coverage:** Library body endpoint + test (Task 1) ✓; fetchEntityBody fix (Task 2) ✓; searchEntities client (Task 2) ✓; picker pure helpers (Task 3) ✓; LibraryPicker modal + store slice + app host (Task 4) ✓; pick wiring ItemEditor slots + Canvas item/message (Task 5) ✓; hard-pin latest ref insertion (Tasks 4–5) ✓; read-only picked refs + live preview via fixed resolver (inherited C2b read-only rendering + Task 2 fix) ✓; Playwright smoke (Task 6) ✓; README/FOLLOWUPS incl. ED-B (g) resolution + deploy note (Task 7) ✓.

**Deferred per spec (no task, intentional):** newer-version notification/upgrade + version selection (ED-C3b); editing/forking picked refs (ED-C4); translation (ED-E); live Vercel redeploy; full catalogue browse.

**Type consistency:** `EntitySearchResult` (library.ts) used in searchEntities + LibraryPicker + PickerClient; `fetchEntityBody`/`searchEntities` signatures consistent; `buildRef`/`bodySnippet` (picker.ts) used in LibraryPicker; store `picker`/`openPicker`/`closePicker` consistent across store/App/ItemEditor/Canvas; `PickerClient` injected (default real) for RTL. `parseRef` reused (type from prefix) for fetchEntityBody.

**Build-order:** Task 1 (library) independent; Task 2 (client) → Task 3 (helpers) → Task 4 (picker+store+host) → Task 5 (wiring uses openPicker) → 6/7. Each independently green. Note Task 1 needs Docker/testcontainers (DOCKER_CONFIG=/tmp/lib_docker); the editor tasks don't.
