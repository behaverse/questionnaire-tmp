# Editor ED-C3b (OD-06 Newer-Version Notification + Upgrade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flag Library-pinned refs whose entity has a newer published version and let the author upgrade each one explicitly (never silently — OD-06).

**Architecture:** Pure staleness helpers + a CalVer `isNewer`; a `latestVersion` Library client read; a pure `upgradeRef` (replace-all) tree op; a store `staleness` slice populated on load + manual refresh; a reusable `UpgradeBadge` wired into the read-only Library-ref chips (ItemEditor / MessagePane / Canvas list) + a topbar "⬆ N updates" badge.

**Tech Stack:** Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright (editor only).

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-c3b-design.md](../specs/2026-06-14-editor-ed-c3b-design.md)

**Pinned facts (verified):**
- Library `GET /v1/entities/{etype}/{eid}` → `EntitySummary` whose `version` is the **latest published** (`entities.py get_entity` returns `max(published, key=version)`; `404` if none). No version arg.
- Editor `persistence/library.ts`: `parseRef(ref) → {type, id, version}` (prefix map), `FetchOpts {baseUrl?, fetchImpl?}`, `DEFAULT_BASE`, `searchEntities`, `fetchEntityBody`. `preview/resolve.ts` exports `collectRefs(node, acc?) → Set<string>`. `model/types.ts` exports `EntityBody`. `model/tree.ts` already imports `produce`/`getAtPath`/`NodePath`/`Questionnaire`.
- Editor store: `{model, pool, applyEdit, reset, …}`. `App.tsx` load paths: boot `loadDraft().then(d => loadModel(d.model, d.source, d.entities))`, and start-screen `onNew`/`onOpenFile`/`onOpenLibrary` each call `loadModel(...)`.
- `ItemEditor.tsx` read-only Library chips: prompt chip (`{promptRef && (… {poolPrompt ? <PromptEditor> : <chip with font-mono {promptRef} + "fork to edit (ED-C4)">})}`), context chip (`{ctxRef && (poolCtx ? <ContextEditor> : <chip {ctxRef}>)}`), instruction chip (same with `insRef`), and the option-ref note (`Referenced option {option.ref} — pick/fork in ED-C3/C4`). `MessagePane.tsx` has a read-only chip for non-pool message refs. The Canvas element-list renders each element as a chip (ref shown for refs).
- `Topbar.tsx`: reads `{model, dirty, validation, previewOpen, togglePreview}` + `pool`; has Validate/Preview/Export/Export-bundle buttons in an `ml-auto` group.
- Run tests: `cd editor && npx vitest run <path>` (git from repo root).

---

## Task 1: Pure staleness helpers (`library/staleness.ts`)

**Files:**
- Create: `editor/src/library/staleness.ts`, `editor/src/library/staleness.test.ts`

- [ ] **Step 1: Write the failing tests**

`editor/src/library/staleness.test.ts`:
```ts
import { collectLibraryRefs, isNewer, staleSet } from './staleness'
import type { Questionnaire } from '../model/types'

test('collectLibraryRefs returns refs not in the pool', () => {
  const model = {
    metadata: { id: 'qst_t', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { question: { prompt: { ref: 'pr_lib@v26.0609' } }, option: { ref: 'opt_lib@v26.0609' } },
      { question: { prompt: { ref: 'pr_draft@v26.0609.dev1' } }, option: {} },
    ] }],
  } as unknown as Questionnaire
  const pool = { 'pr_draft@v26.0609.dev1': { id: 'pr_draft' } }
  const refs = collectLibraryRefs(model, pool)
  expect(refs.sort()).toEqual(['opt_lib@v26.0609', 'pr_lib@v26.0609']) // pool draft excluded
})

test('isNewer compares CalVer; pinned draft never stale; malformed false', () => {
  expect(isNewer('v26.0610', 'v26.0609')).toBe(true)
  expect(isNewer('v26.0609', 'v26.0609')).toBe(false)
  expect(isNewer('v27.0101', 'v26.1231')).toBe(true)
  expect(isNewer('v26.0608', 'v26.0609')).toBe(false)
  expect(isNewer('v26.0610', 'v26.0609.dev1')).toBe(false) // pinned is a draft
  expect(isNewer('garbage', 'v26.0609')).toBe(false)
})

test('staleSet keeps only refs with a strictly-newer latest', () => {
  const refs = ['pr_a@v26.0609', 'pr_b@v26.0609', 'pr_c@v26.0609']
  const latestByKey = { 'pr_a@v26.0609': 'v26.0610', 'pr_b@v26.0609': 'v26.0609', 'pr_c@v26.0609': null }
  expect(staleSet(refs, latestByKey)).toEqual({ 'pr_a@v26.0609': 'v26.0610' })
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/library/staleness.test.ts` → FAIL.

- [ ] **Step 3: Write `editor/src/library/staleness.ts`**

```ts
import type { Questionnaire, EntityBody } from '../model/types'
import { collectRefs } from '../preview/resolve'

/** Refs in the model that are NOT pool drafts (pool keys) — i.e. Library pins. */
export function collectLibraryRefs(model: Questionnaire, pool: Record<string, EntityBody>): string[] {
  return [...collectRefs(model)].filter((ref) => !(ref in pool))
}

const VER = /^v(\d{2})\.(\d{4})(\.dev\d+)?$/

/** True iff `latest` is a strictly-newer published CalVer than `pinned`. A `.devN`
 *  pinned ref (a draft, not a Library pin) is never stale; malformed → false. */
export function isNewer(latest: string, pinned: string): boolean {
  const l = VER.exec(latest)
  const p = VER.exec(pinned)
  if (!l || !p) return false
  if (p[3]) return false // pinned is a draft
  const ly = +l[1], lm = +l[2], py = +p[1], pm = +p[2]
  return ly > py || (ly === py && lm > pm)
}

/** From the refs + a `ref → latestVersion|null` map, keep only the stale ones
 *  as `{ "<id>@<pinnedVer>": "<latestVer>" }`. */
export function staleSet(refs: string[], latestByKey: Record<string, string | null>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const ref of refs) {
    const at = ref.lastIndexOf('@')
    if (at < 0) continue
    const pinned = ref.slice(at + 1)
    const latest = latestByKey[ref]
    if (latest && isNewer(latest, pinned)) out[ref] = latest
  }
  return out
}
```

- [ ] **Step 4: Run → PASS; commit**

Run: `cd editor && npx vitest run src/library/staleness.test.ts` → PASS.
```bash
git add editor/src/library/staleness.ts editor/src/library/staleness.test.ts
git commit -m "feat(editor): pure staleness helpers (collectLibraryRefs, isNewer, staleSet)"
```

---

## Task 2: `latestVersion` client + `upgradeRef` tree op

**Files:**
- Modify: `editor/src/persistence/library.ts`, `editor/src/model/tree.ts`
- Test: `editor/src/persistence/library.test.ts` (append), `editor/src/model/tree.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `editor/src/persistence/library.test.ts`:
```ts
import { latestVersion } from './library'

test('latestVersion returns the latest entity version', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x', version: 'v26.0610', entity_type: 'prompt', status: 'published' }) } as Response }) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: fakeFetch })).toBe('v26.0610')
  expect(calls[0]).toBe('http://lib/v1/entities/prompt/pr_x')
})

test('latestVersion returns null on 404 / error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: boom })).toBeNull()
})
```

Append to `editor/src/model/tree.test.ts`:
```ts
import { upgradeRef } from './tree'
test('upgradeRef repoints every occurrence of a ref, immutably', () => {
  const q = {
    metadata: { id: 'qst_t', version: 'v26.0609' },
    pages: [{ id: 'p1', elements: [
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: { ref: 'opt_a@v1' } },
      { ref: 'it_x@v26.0609' },
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} }, // same ref twice
    ] }],
  } as unknown as import('./types').Questionnaire
  const next = upgradeRef(q, 'pr_x@v26.0609', 'pr_x@v26.0610')
  const els = next.pages[0].elements as Array<Record<string, any>>
  expect(els[0].question.prompt.ref).toBe('pr_x@v26.0610')
  expect(els[2].question.prompt.ref).toBe('pr_x@v26.0610')
  expect(els[0].option.ref).toBe('opt_a@v1') // untouched
  expect((q.pages[0].elements[0] as any).question.prompt.ref).toBe('pr_x@v26.0609') // original immutable
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/persistence/library.test.ts src/model/tree.test.ts` → FAIL.

- [ ] **Step 3: Add `latestVersion` to `library.ts`**

```ts
export async function latestVersion(etype: string, id: string, opts: FetchOpts = {}): Promise<string | null> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  try {
    const res = await f(`${base}/v1/entities/${etype}/${id}`)
    if (!res.ok) return null
    const d = (await res.json()) as { version?: string }
    return typeof d.version === 'string' ? d.version : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Add `upgradeRef` to `tree.ts`**

```ts
export function upgradeRef(model: Questionnaire, oldRef: string, newRef: string): Questionnaire {
  return produce(model, (draft) => {
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) { node.forEach(walk); return }
      if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        if (obj.ref === oldRef) obj.ref = newRef
        for (const v of Object.values(obj)) walk(v)
      }
    }
    walk(draft)
  })
}
```

- [ ] **Step 5: Run → PASS; commit**

Run: `cd editor && npx vitest run src/persistence/library.test.ts src/model/tree.test.ts` → PASS.
```bash
git add editor/src/persistence/library.ts editor/src/persistence/library.test.ts editor/src/model/tree.ts editor/src/model/tree.test.ts
git commit -m "feat(editor): latestVersion client + upgradeRef tree op"
```

---

## Task 3: Store staleness slice + App refresh-on-load

**Files:**
- Modify: `editor/src/state/store.ts`, `editor/src/state/store.test.ts` (append), `editor/src/app/App.tsx`

- [ ] **Step 1: Write the failing store test**

Append to `editor/src/state/store.test.ts`:
```ts
test('refreshStaleness flags stale Library refs; upgradeRefAction repoints + clears', async () => {
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as Questionnaire
  const st = useEditorStore.getState()
  st.loadModel(model, { kind: 'file', name: 't.json' })
  await st.refreshStaleness(async () => 'v26.0610') // injected latestVersion → newer
  expect(useEditorStore.getState().staleness['pr_x@v26.0609']).toBe('v26.0610')
  st.upgradeRefAction('pr_x@v26.0609', 'pr_x@v26.0610')
  const q = useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }
  expect(q.question.prompt.ref).toBe('pr_x@v26.0610')
  expect(useEditorStore.getState().staleness['pr_x@v26.0609']).toBeUndefined()
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/state/store.test.ts` → FAIL.

- [ ] **Step 3: Add the staleness slice to `store.ts`**

- Imports: `import { collectLibraryRefs, staleSet } from '../library/staleness'`, `import { upgradeRef } from '../model/tree'`, `import { latestVersion as realLatestVersion, parseRef } from '../persistence/library'`.
- Type a `LatestFn`: `type LatestFn = (etype: string, id: string) => Promise<string | null>`.
- `EditorState` additions: `staleness: Record<string, string>`, `refreshStaleness: (latestFn?: LatestFn) => Promise<void>`, `upgradeRefAction: (oldRef: string, newRef: string) => void`.
- Init `staleness: {}`; add `staleness: {}` to `reset()`.
- Implement:
```ts
  refreshStaleness: async (latestFn) => {
    const { model, pool } = get()
    if (!model) return
    const fetchLatest = latestFn ?? ((t: string, i: string) => realLatestVersion(t, i))
    const refs = collectLibraryRefs(model, pool)
    const byEntity = new Map<string, { type: string; id: string }>()
    for (const ref of refs) { const p = parseRef(ref); if (p) byEntity.set(`${p.type}/${p.id}`, { type: p.type, id: p.id }) }
    const entries = await Promise.all([...byEntity.entries()].map(async ([key, e]) => [key, await fetchLatest(e.type, e.id)] as const))
    const latestByEntity = Object.fromEntries(entries)
    const latestByKey: Record<string, string | null> = {}
    for (const ref of refs) { const p = parseRef(ref); latestByKey[ref] = p ? (latestByEntity[`${p.type}/${p.id}`] ?? null) : null }
    set({ staleness: staleSet(refs, latestByKey) })
  },
  upgradeRefAction: (oldRef, newRef) => {
    get().applyEdit((m) => upgradeRef(m, oldRef, newRef))
    set((s) => { const st = { ...s.staleness }; delete st[oldRef]; return { staleness: st } })
  },
```

- [ ] **Step 4: Run → PASS**

Run: `cd editor && npx vitest run src/state/store.test.ts` → PASS.

- [ ] **Step 5: App — refresh on load**

In `editor/src/app/App.tsx`, call `refreshStaleness()` after each model load (fire-and-forget; uses the real client). Add a helper at the top of `App()`:
```tsx
const refreshStaleness = useEditorStore((s) => s.refreshStaleness)
```
Then, after each `loadModel(...)` call (boot restore + the three start-screen handlers), follow with `void refreshStaleness()`. E.g. boot:
```tsx
loadDraft().then((d) => { if (d) { loadModel(d.model, d.source, d.entities); void refreshStaleness() } }).finally(() => setBooting(false))
```
and each start-screen handler, e.g.:
```tsx
onNew={() => { loadModel(newQuestionnaire(), { kind: 'new' }); void refreshStaleness() }}
onOpenFile={async (f) => { try { setError(null); loadModel(await readQuestionnaireFile(f), { kind: 'file', name: f.name }); void refreshStaleness() } catch (e) { setError(String(e)) } }}
onOpenLibrary={async (id, version) => { try { setError(null); loadModel(await fetchFromLibrary(id, version), { kind: 'library', id, version }); void refreshStaleness() } catch (e) { setError(String(e)) } }}
```
(A new questionnaire has no Library refs, so its refresh is a quick no-op — harmless + keeps the call uniform.)

- [ ] **Step 6: Run app tests + build + commit**

Run: `cd editor && npx vitest run src/state/ src/app/ && npm run typecheck && npm run build` → green.
```bash
git add editor/src/state/store.ts editor/src/state/store.test.ts editor/src/app/App.tsx
git commit -m "feat(editor): staleness store slice + refresh-on-load + upgrade action"
```

---

## Task 4: UpgradeBadge + wire into chips + topbar

**Files:**
- Create: `editor/src/library/UpgradeBadge.tsx`, `editor/src/library/UpgradeBadge.test.tsx`
- Modify: `editor/src/canvas/ItemEditor.tsx`, `editor/src/canvas/MessagePane.tsx`, `editor/src/canvas/Canvas.tsx`, `editor/src/app/Topbar.tsx`

- [ ] **Step 1: Write the failing UpgradeBadge test**

`editor/src/library/UpgradeBadge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEditorStore } from '../state/store'
import { UpgradeBadge } from './UpgradeBadge'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} }] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

test('renders nothing when the ref is not stale', () => {
  const { container } = render(<UpgradeBadge refStr="pr_x@v26.0609" />)
  expect(container).toBeEmptyDOMElement()
})

test('shows the newer version + Upgrade repoints the ref', async () => {
  useEditorStore.setState({ staleness: { 'pr_x@v26.0609': 'v26.0610' } })
  render(<UpgradeBadge refStr="pr_x@v26.0609" />)
  expect(screen.getByText(/newer: v26\.0610/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /upgrade/i }))
  const q = useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }
  expect(q.question.prompt.ref).toBe('pr_x@v26.0610')
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/library/UpgradeBadge.tsx`**

```tsx
import { useEditorStore } from '../state/store'

export function UpgradeBadge({ refStr }: { refStr: string }) {
  const latest = useEditorStore((s) => s.staleness[refStr])
  const upgradeRefAction = useEditorStore((s) => s.upgradeRefAction)
  if (!latest) return null
  const id = refStr.slice(0, refStr.lastIndexOf('@'))
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
      newer: {latest}
      <button onClick={() => upgradeRefAction(refStr, `${id}@${latest}`)} className="font-medium underline">Upgrade</button>
    </span>
  )
}
```
Run: `cd editor && npx vitest run src/library/UpgradeBadge.test.tsx` → PASS.

- [ ] **Step 3: Wire UpgradeBadge into the read-only chips**

Import `UpgradeBadge` in `ItemEditor.tsx`, `MessagePane.tsx`, `Canvas.tsx`. Drop `<UpgradeBadge refStr={ref} />` into each read-only Library-ref chip:
- **ItemEditor** — in the prompt chip (the `else` branch beside `fork to edit (ED-C4)`): after `<span className="font-mono">{promptRef}</span>` add `<UpgradeBadge refStr={promptRef} />`. Same for the context chip (`{ctxRef}`), instruction chip (`{insRef}`), and the option-ref note (where `option.ref` is shown — add `<UpgradeBadge refStr={(option as {ref:string}).ref} />`).
- **MessagePane** — in the read-only message chip (non-pool ref): after the `{ref}` span add `<UpgradeBadge refStr={ref} />`.
- **Canvas element list** — each element chip that shows a `ref` (saved-item / message refs): render `<UpgradeBadge refStr={el.ref} />` beside the ref label when the element has a string `ref`.
(Read each current file; place the badge adjacent to the ref text. The badge self-hides when the ref isn't stale, so it's safe to add unconditionally next to any ref chip.)

- [ ] **Step 4: Topbar — updates badge + Check for updates**

In `editor/src/app/Topbar.tsx`: read `const staleness = useEditorStore((s) => s.staleness)` and `const refreshStaleness = useEditorStore((s) => s.refreshStaleness)`. In the `ml-auto` button group, before Validate, add:
```tsx
{Object.keys(staleness).length > 0 && (
  <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">⬆ {Object.keys(staleness).length} update{Object.keys(staleness).length > 1 ? 's' : ''}</span>
)}
<button onClick={() => void refreshStaleness()} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Check for updates</button>
```

- [ ] **Step 5: Append a chip-wiring test (ItemEditor stale prompt shows badge)**

Append to `editor/src/canvas/ItemEditor.test.tsx`:
```tsx
test('a stale Library prompt ref shows the upgrade badge in the chip', () => {
  const ref = 'pr_lib@v26.0609'
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as import('../model/types').Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.setState({ staleness: { [ref]: 'v26.0610' } })
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  expect(screen.getByText(/newer: v26\.0610/i)).toBeInTheDocument()
})
```

- [ ] **Step 6: Run + build + commit**

Run: `cd editor && npx vitest run src/library/ src/canvas/ src/app/ && npm run typecheck && npm run build` → green.
```bash
git add editor/src/library/UpgradeBadge.tsx editor/src/library/UpgradeBadge.test.tsx editor/src/canvas/ItemEditor.tsx editor/src/canvas/ItemEditor.test.tsx editor/src/canvas/MessagePane.tsx editor/src/canvas/Canvas.tsx editor/src/app/Topbar.tsx
git commit -m "feat(editor): UpgradeBadge on Library-ref chips + topbar updates badge"
```

---

## Task 5: Playwright smoke + screenshot

**Files:**
- Modify: `editor/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Append the smoke test**

```ts
test('stale Library ref shows Upgrade → upgrading repoints it', async ({ page }) => {
  // entity body (for preview/pick) + latest-version (newer than what we'll pin)
  await page.route('**/v1/entities/prompt?*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 'pr_stale', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }) })
  })
  await page.route('**/v1/entities/prompt/pr_stale/versions/*/definition', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'pr_stale', content: { en: { status: 'validated', text: 'Stale prompt' } } }) })
  })
  // latest-version endpoint (no version segment) → newer
  await page.route('**/v1/entities/prompt/pr_stale', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'pr_stale', version: 'v26.0610', entity_type: 'prompt', status: 'published' }) })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  // pick the (v26.0609) prompt → it will be flagged stale (latest v26.0610)
  await page.getByRole('button', { name: /pick prompt/i }).click()
  await page.getByLabel(/search/i).fill('stale')
  await page.getByText('pr_stale').click()
  await page.getByRole('button', { name: /insert/i }).click()
  // trigger the staleness check
  await page.getByRole('button', { name: /check for updates/i }).click()
  await expect(page.getByText(/newer: v26\.0610/i)).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c3b-upgrade.png', fullPage: true })
  await page.getByRole('button', { name: /upgrade/i }).click()
  // after upgrade the badge for the old ref is gone
  await expect(page.getByText(/newer: v26\.0610/i)).toHaveCount(0)
})
```
(The picked ref pins `v26.0609`; the latest endpoint returns `v26.0610`, so "Check for updates" flags it. Use `page.getByLabel` not getByLabelText. If a selector is ambiguous, scope it.)

- [ ] **Step 2: Run**

Run: `cd editor && npm run build && npx playwright test` → all smokes pass; screenshot at `editor/tests/e2e/screenshots/ed-c3b-upgrade.png`.

- [ ] **Step 3: Show owner the screenshot, then commit**

```bash
git add editor/tests/e2e/smoke.spec.ts
git commit -m "test(editor): Playwright stale-ref upgrade smoke + ED-C3b screenshot"
```

---

## Task 6: README + FOLLOWUPS

**Files:**
- Modify: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: README** — add an "ED-C3b — newer-version upgrade (OD-06)" section: on load (and via the topbar "Check for updates"), the editor checks each Library-pinned ref's latest published version and flags stale ones with a per-chip "newer: vX [Upgrade]" affordance + a topbar "⬆ N updates" badge; Upgrade re-points the ref (all occurrences) explicitly — never silent. Update the does/doesn't list.

- [ ] **Step 2: FOLLOWUPS** — append:
  - (ff) Staleness checks run on load + manual "Check for updates" (not per-edit, to avoid hammering the Library); offline/unavailable → nothing flagged (no false positives).
  - (gg) **No content diff** between pinned and latest — only the version + one-click upgrade (OD-06's "diff" is deferred).
  - (hh) No **transitive** staleness — refs *inside* a Library entity's body (e.g. a saved Item's nested prompt) aren't checked; the Library owns its entities' internal pinning.
  - (ii) Live Library redeploy (FOLLOWUPS bb) also gates the `latestVersion` lookup against the live API.

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-C3b README + FOLLOWUPS"
```

---

## Final verification

```bash
cd editor && npm test && npm run typecheck && npm run build && npx playwright test
```
All green. ED-C3b success: stale Library-pinned refs are flagged (per-chip + topbar) and upgradeable with one explicit click that re-points all occurrences + re-resolves the preview; never silent; manual re-check works.

---

## Self-review notes (author)

**Spec coverage:** staleness helpers + isNewer CalVer + staleSet (Task 1) ✓; latestVersion client + upgradeRef replace-all (Task 2) ✓; store staleness slice + refreshStaleness (cached per entity) + upgradeRefAction (Task 3) ✓; refresh on load + manual (Task 3 App + Task 4 topbar) ✓; per-chip UpgradeBadge across ItemEditor/MessagePane/Canvas (Task 4) ✓; topbar count badge (Task 4) ✓; never-silent explicit upgrade (UpgradeBadge button) ✓; Playwright smoke (Task 5) ✓; README/FOLLOWUPS incl. no-diff + no-transitive + redeploy notes (Task 6) ✓.

**Deferred per spec (no task, intentional):** content diff view; auto-upgrade (forbidden); fork (C4); per-edit polling; transitive staleness; translation.

**Type consistency:** `collectLibraryRefs`/`isNewer`/`staleSet` (staleness.ts) used in store; `latestVersion(etype,id,opts)` (library.ts) used by store's `realLatestVersion` + injectable `LatestFn`; `upgradeRef(model,oldRef,newRef)` (tree.ts) used by `upgradeRefAction`; store `staleness`/`refreshStaleness(latestFn?)`/`upgradeRefAction(oldRef,newRef)` consistent across store/App/Topbar/UpgradeBadge; `UpgradeBadge refStr` prop consistent across all chip insertions; `parseRef` reused for etype/id.

**Build-order:** Task 1 (pure) → Task 2 (client+tree op) → Task 3 (store uses both) → Task 4 (UI uses store) → 5/6. Each independently green.
