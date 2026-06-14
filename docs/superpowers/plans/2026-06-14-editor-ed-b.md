# Editor ED-B (Inline WYSIWYG Preview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live split-pane WYSIWYG preview to the editor that renders the in-progress questionnaire using the Web Viewer's renderer library (OD-03), fed by a thin TS "resolve-and-shape" projection.

**Architecture:** Two-step pipeline. (1) Async, cached **entity resolution** — fetch every `{ref}`'s body (transitively) from the Library, keyed by `ref@version`. (2) Pure **`projectForPreview(model, lookup)`** — inline ref bodies (port of the canonical denormaliser's `resolve_refs`) + assemble the renderer's `Runtime` shape (full content maps kept; no locale-trim/scoring/manifest passes). A `PreviewPane` hosts the library's `StepRenderer` with throwaway answer state, a language picker, a device-frame picker, and a page/whole scope toggle. Static structural only — no logic/scoring/validation (those are ED-D).

**Tech Stack:** Vite 6 · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright. New: the Web Viewer renderer library (`web-viewer/dist-lib`, `@behaverse/questionnaire-renderer`) consumed via a Vite alias + tsconfig path.

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-b-design.md](../specs/2026-06-14-editor-ed-b-design.md)

**Pinned facts (verified during planning):**
- Renderer library public surface (`web-viewer/src/renderer/index.ts`, built to `web-viewer/dist-lib/renderer.js` + `renderer.css` + `lib.d.ts` via `cd web-viewer && npm run build:lib`): `StepRenderer` (props `{elements:{key,element}[], locale, answers, onAnswer, requiredErrors:string[], errorMessages?, strings:{required,unsupported}, keyHints?}`), `elementKey`, `pageElementFallback`, `sectionChildFallback`, `mergeOptions`, `deriveWidget`, `isItem/isMessage/isSection`, and types `Runtime`, `RuntimeElement`, `AnswerValue`, etc. The renderer does option-merge + widget derivation + locale selection + section rendering itself.
- The package name is `questionnaire-web-viewer`; its `exports` map exposes `./renderer` → `dist-lib/renderer.js` (+ `lib.d.ts`) and `./renderer/style.css` → `dist-lib/renderer.css`. We consume `dist-lib` directly via a Vite alias `@behaverse/questionnaire-renderer` (no npm install of the sibling).
- Canonical `resolve_refs` rules (port faithfully — `questionnaire-runtime-denormaliser/src/denormaliser/resolve.py`, tests `tests/test_resolve.py`): a node `{ref:"id@ver", ...siblings}` is replaced by the entity body with siblings overriding body keys and `ref` dropped; recurse into the resolved body (transitive); arrays recurse; an unresolved ref records a problem and leaves the node intact (incl. the `ref` key) so processing continues; non-ref dicts pass through.
- **Every** question references its prompt via `{ref}` (Schema 2 `QuestionInline.prompt` is a `PromptRef`) — there is no inline-prompt-content form. So previewing real content always requires resolution; tests inject a fake fetcher and the Playwright smoke stubs `/v1/entities/**`.
- ED-A is on `master`; ED-B is built on branch `editor-ed-b`. Editor store (`editor/src/state/store.ts`): `useEditorStore` with `{model, selection, ...}` + `applyEdit`, `select`, etc. Library client lives at `editor/src/persistence/library.ts` (has `FetchOpts {baseUrl?, fetchImpl?}`, `DEFAULT_BASE`). Run tests: `cd editor && npx vitest run <path>`.

---

## Task 1: Wire the renderer library (alias + types + ensure-built)

**Files:**
- Create: `editor/scripts/ensure-renderer.mjs`
- Modify: `editor/vite.config.ts`, `editor/tsconfig.json`, `editor/package.json`
- Test: `editor/src/preview/renderer-import.test.tsx`

- [ ] **Step 1: Write the ensure-renderer script**

`editor/scripts/ensure-renderer.mjs`:
```js
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const lib = fileURLToPath(new URL('../../web-viewer/dist-lib/renderer.js', import.meta.url))
if (!existsSync(lib)) {
  const cwd = fileURLToPath(new URL('../../web-viewer/', import.meta.url))
  console.log('[editor] building renderer library (web-viewer dist-lib)…')
  execSync('npm run build:lib', { cwd, stdio: 'inherit' })
}
```

- [ ] **Step 2: Add pre-hooks to package.json**

In `editor/package.json` scripts, add (keep existing scripts):
```json
"predev": "node scripts/ensure-renderer.mjs",
"pretest": "node scripts/ensure-renderer.mjs",
"prebuild": "node scripts/ensure-renderer.mjs",
"pretypecheck": "node scripts/ensure-renderer.mjs"
```

- [ ] **Step 3: Add the Vite alias + fs.allow**

In `editor/vite.config.ts`, add `resolve.alias` and `server.fs.allow` (the alias must apply to vitest too, which shares this config). Replace the file with:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const distLib = resolve(__dirname, '../web-viewer/dist-lib')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@behaverse/questionnaire-renderer/style.css': resolve(distLib, 'renderer.css'),
      '@behaverse/questionnaire-renderer': resolve(distLib, 'renderer.js'),
    },
  },
  server: { fs: { allow: [resolve(__dirname, '..')] } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
```

- [ ] **Step 4: Add the tsconfig path for types**

In `editor/tsconfig.json` `compilerOptions`, add `baseUrl` + `paths` (so `import ... from '@behaverse/questionnaire-renderer'` type-checks against the built `lib.d.ts`):
```json
"baseUrl": ".",
"paths": { "@behaverse/questionnaire-renderer": ["../web-viewer/dist-lib/lib.d.ts"] }
```

- [ ] **Step 5: Write a smoke import test**

`editor/src/preview/renderer-import.test.tsx`:
```tsx
import { StepRenderer, elementKey } from '@behaverse/questionnaire-renderer'

test('the renderer library is importable via the alias', () => {
  expect(typeof StepRenderer).toBe('function')
  expect(elementKey({ id: 'x' } as never, 'fallback')).toBe('x')
  expect(elementKey({} as never, 'fallback')).toBe('fallback')
})
```

- [ ] **Step 6: Run it**

Run: `cd editor && node scripts/ensure-renderer.mjs && npx vitest run src/preview/renderer-import.test.tsx`
Expected: PASS (the ensure script builds dist-lib if missing; the import resolves).

- [ ] **Step 7: Typecheck + commit**

Run: `cd editor && npm run typecheck` → clean.
```bash
git add editor/scripts editor/vite.config.ts editor/tsconfig.json editor/package.json editor/src/preview/renderer-import.test.tsx
git commit -m "build(editor): wire the Web Viewer renderer library via alias + ensure-built"
```

---

## Task 2: Ref resolver (pure) — port of `resolve_refs`

**Files:**
- Create: `editor/src/preview/resolve.ts`
- Test: `editor/src/preview/resolve.test.ts`

- [ ] **Step 1: Write the failing tests (ported verbatim from the denormaliser's `test_resolve.py`)**

`editor/src/preview/resolve.test.ts`:
```ts
import { resolveDocument, collectRefs, type Lookup } from './resolve'

const lookupFrom = (store: Record<string, Record<string, unknown>>): Lookup => (ref) => store[ref] ?? null

test('inlines a simple ref', () => {
  const store = { 'pr_x@v26.0602': { id: 'pr_x', content: { en: { status: 'validated', text: 'Hi' } } } }
  const { resolved, problems } = resolveDocument({ prompt: { ref: 'pr_x@v26.0602' } }, lookupFrom(store))
  expect(resolved).toEqual({ prompt: { id: 'pr_x', content: { en: { status: 'validated', text: 'Hi' } } } })
  expect(problems).toEqual([])
})

test('sibling keys win over the entity body; ref dropped; nested ref resolved', () => {
  const store = {
    'it_x@v26.0602': { id: 'it_x', required: false, question: { prompt: { ref: 'pr_x@v26.0602' } } },
    'pr_x@v26.0602': { id: 'pr_x', content: { en: { status: 'validated', text: 'Q' } } },
  }
  const { resolved } = resolveDocument({ ref: 'it_x@v26.0602', required: true }, lookupFrom(store))
  const r = resolved as Record<string, any>
  expect(r.required).toBe(true)
  expect('ref' in r).toBe(false)
  expect(r.question.prompt.content.en.text).toBe('Q')
})

test('unresolved ref records a problem and keeps the node intact', () => {
  const { resolved, problems } = resolveDocument({ prompt: { ref: 'pr_missing@v26.0602' } }, lookupFrom({}))
  expect(problems).toEqual([{ kind: 'unresolved_ref', where: 'pr_missing@v26.0602' }])
  expect((resolved as any).prompt.ref).toBe('pr_missing@v26.0602')
})

test('collects all unresolved refs', () => {
  const { problems } = resolveDocument({ a: { ref: 'pr_1@v26.0602' }, b: [{ ref: 'pr_2@v26.0602' }] }, lookupFrom({}))
  expect(new Set(problems.map((p) => p.where))).toEqual(new Set(['pr_1@v26.0602', 'pr_2@v26.0602']))
})

test('non-ref dicts pass through unchanged', () => {
  const doc = { option: { input_data_type: 'choice', options: [{ index: 1, value: 0 }] } }
  expect(resolveDocument(doc, lookupFrom({})).resolved).toEqual(doc)
})

test('collectRefs gathers nested + array refs', () => {
  const refs = collectRefs({ a: { ref: 'pr_1@v1' }, b: [{ ref: 'pr_2@v1' }, { c: { ref: 'opt_3@v1' } }] })
  expect(refs).toEqual(new Set(['pr_1@v1', 'pr_2@v1', 'opt_3@v1']))
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/preview/resolve.test.ts`
Expected: FAIL — cannot resolve `./resolve`.

- [ ] **Step 3: Write the module**

`editor/src/preview/resolve.ts`:
```ts
export type EntityBody = Record<string, unknown>
export type Lookup = (ref: string) => EntityBody | null
export interface RefProblem { kind: 'unresolved_ref'; where: string }

function isRef(v: unknown): v is string { return typeof v === 'string' && v.includes('@') }

function walk(node: unknown, lookup: Lookup, problems: RefProblem[]): unknown {
  if (Array.isArray(node)) return node.map((x) => walk(x, lookup, problems))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (isRef(obj.ref)) {
      const body = lookup(obj.ref)
      if (body == null) {
        problems.push({ kind: 'unresolved_ref', where: obj.ref })
        // keep node intact (incl. ref) so later processing continues
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v, lookup, problems)]))
      }
      const merged: Record<string, unknown> = { ...body }
      for (const [k, v] of Object.entries(obj)) if (k !== 'ref') merged[k] = v
      return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, walk(v, lookup, problems)]))
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v, lookup, problems)]))
  }
  return node
}

export function resolveDocument(node: unknown, lookup: Lookup): { resolved: unknown; problems: RefProblem[] } {
  const problems: RefProblem[] = []
  const resolved = walk(node, lookup, problems)
  return { resolved, problems }
}

export function collectRefs(node: unknown, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) { for (const x of node) collectRefs(x, acc); return acc }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (isRef(obj.ref)) acc.add(obj.ref)
    for (const v of Object.values(obj)) collectRefs(v, acc)
  }
  return acc
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd editor && npx vitest run src/preview/resolve.test.ts`
Expected: PASS (all 6).

- [ ] **Step 5: Commit**

```bash
git add editor/src/preview/resolve.ts editor/src/preview/resolve.test.ts
git commit -m "feat(editor): pure ref resolver (port of denormaliser resolve_refs)"
```

---

## Task 3: Async entity resolution + Library entity client

**Files:**
- Modify: `editor/src/persistence/library.ts`
- Create: `editor/src/preview/resolver.ts`
- Test: `editor/src/persistence/library.test.ts` (append), `editor/src/preview/resolver.test.ts`

- [ ] **Step 1: Write the failing library-client test (append)**

Append to `editor/src/persistence/library.test.ts`:
```ts
import { parseRef, fetchEntityBody } from './library'

test('parseRef maps prefix → entity type', () => {
  expect(parseRef('pr_aiss_q_2@v26.0602')).toEqual({ type: 'prompt', id: 'pr_aiss_q_2', version: 'v26.0602' })
  expect(parseRef('opt_agreement_7@v1')).toEqual({ type: 'option', id: 'opt_agreement_7', version: 'v1' })
  expect(parseRef('msg_welcome@v1')?.type).toBe('message')
  expect(parseRef('no_at_sign')).toBeNull()
})

test('fetchEntityBody requests the typed entity endpoint and returns the body', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x' }) } as Response }) as unknown as typeof fetch
  const body = await fetchEntityBody('pr_x@v26.0602', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(body).toEqual({ id: 'pr_x' })
  expect(calls[0]).toContain('/v1/entities/prompt/pr_x')
  expect(calls[0]).toContain('version=v26.0602')
})

test('fetchEntityBody returns null on a non-OK response or network error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: boom })).toBeNull()
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `cd editor && npx vitest run src/persistence/library.test.ts`
Expected: FAIL — `parseRef`/`fetchEntityBody` not exported.

- [ ] **Step 3: Extend the library client**

Append to `editor/src/persistence/library.ts`:
```ts
import type { EntityBody } from '../preview/resolve'

const PREFIX_TYPE: Record<string, string> = {
  pr: 'prompt', opt: 'option', it: 'item', q: 'question', msg: 'message',
  ctx: 'context', ins: 'instruction', ph: 'placeholder', help: 'help', rx: 'regex', sol: 'solution',
}

export function parseRef(ref: string): { type: string; id: string; version: string } | null {
  const at = ref.indexOf('@')
  if (at < 0) return null
  const id = ref.slice(0, at)
  const version = ref.slice(at + 1)
  const prefix = id.split('_')[0]
  const type = PREFIX_TYPE[prefix]
  if (!type || !id || !version) return null
  return { type, id, version }
}

export async function fetchEntityBody(ref: string, opts: FetchOpts = {}): Promise<EntityBody | null> {
  const parsed = parseRef(ref)
  if (!parsed) return null
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${parsed.type}/${parsed.id}?version=${encodeURIComponent(parsed.version)}`
  try {
    const res = await f(url)
    if (!res.ok) return null
    return (await res.json()) as EntityBody
  } catch {
    return null
  }
}
```
(`FetchOpts` and `DEFAULT_BASE` already exist in this file from ED-A.)

- [ ] **Step 4: Run, verify PASS**

Run: `cd editor && npx vitest run src/persistence/library.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing resolver test**

`editor/src/preview/resolver.test.ts`:
```ts
import { resolveEntities, type FetchEntity } from './resolver'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t' },
  pages: [{ id: 'p1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' } }] }],
} as unknown as Questionnaire

test('resolves all refs transitively and caches (no refetch)', async () => {
  const bodies: Record<string, Record<string, unknown>> = {
    'pr_a@v1': { id: 'pr_a', content: {} },
    // opt_a body itself references a placeholder -> transitive
    'opt_a@v1': { id: 'opt_a', placeholder: { ref: 'ph_a@v1' } },
    'ph_a@v1': { id: 'ph_a', content: {} },
  }
  const calls: string[] = []
  const fetchEntity: FetchEntity = async (ref) => { calls.push(ref); return bodies[ref] ?? null }
  const map = await resolveEntities(model, fetchEntity)
  expect(map.get('pr_a@v1')).toEqual({ id: 'pr_a', content: {} })
  expect(map.get('ph_a@v1')).toEqual({ id: 'ph_a', content: {} }) // transitive discovered
  // second pass reuses the cache → no new fetches
  const before = calls.length
  await resolveEntities(model, fetchEntity, map)
  expect(calls.length).toBe(before)
})

test('records null for an unresolvable ref without throwing', async () => {
  const fetchEntity: FetchEntity = async () => null
  const map = await resolveEntities(model, fetchEntity)
  expect(map.get('pr_a@v1')).toBeNull()
})
```

- [ ] **Step 6: Run, verify it fails**

Run: `cd editor && npx vitest run src/preview/resolver.test.ts`
Expected: FAIL — cannot resolve `./resolver`.

- [ ] **Step 7: Write the resolver**

`editor/src/preview/resolver.ts`:
```ts
import type { Questionnaire } from '../model/types'
import { collectRefs, type EntityBody } from './resolve'

export type FetchEntity = (ref: string) => Promise<EntityBody | null>

/** Resolve every ref in the model (transitively, following refs inside fetched
 *  bodies), memoised in `cache` keyed by `ref@version`. Never throws; an
 *  unresolvable ref is cached as null. */
export async function resolveEntities(
  model: Questionnaire,
  fetchEntity: FetchEntity,
  cache: Map<string, EntityBody | null> = new Map(),
): Promise<Map<string, EntityBody | null>> {
  let frontier = [...collectRefs(model)].filter((r) => !cache.has(r))
  while (frontier.length) {
    await Promise.all(frontier.map(async (ref) => { cache.set(ref, await fetchEntity(ref)) }))
    const next = new Set<string>()
    for (const ref of frontier) {
      const body = cache.get(ref)
      if (body) collectRefs(body, next)
    }
    frontier = [...next].filter((r) => !cache.has(r))
  }
  return cache
}
```

- [ ] **Step 8: Run, verify PASS**

Run: `cd editor && npx vitest run src/preview/resolver.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add editor/src/persistence/library.ts editor/src/persistence/library.test.ts editor/src/preview/resolver.ts editor/src/preview/resolver.test.ts
git commit -m "feat(editor): Library entity-body client + transitive cached resolution"
```

---

## Task 4: `projectForPreview` — shape into the renderer Runtime

**Files:**
- Create: `editor/src/preview/project.ts`
- Test: `editor/src/preview/project.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/preview/project.test.ts`:
```ts
import { projectForPreview } from './project'
import type { Lookup } from './resolve'
import type { Questionnaire } from '../model/types'

const store: Record<string, Record<string, unknown>> = {
  'pr_a@v1': { id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' }, pt: { status: 'validated', text: 'Como está?' } } },
  'opt_a@v1': { id: 'opt_a', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'validated', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } } },
}
const lookup: Lookup = (ref) => store[ref] ?? null

const model = {
  '@context': 'x',
  metadata: { id: 'qst_t', title: 'T', description: 'd', language: 'en', available_languages: ['en', 'pt'] },
  style: { progress_bar: true },
  pages: [{ id: 'p1', title: 'Page 1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' }, required: true }] }],
} as unknown as Questionnaire

test('produces a Runtime with resolved content and full language maps', () => {
  const { runtime, problems } = projectForPreview(model, lookup)
  expect(problems).toEqual([])
  expect(runtime.metadata.id).toBe('qst_t')
  expect(runtime.available_locales).toEqual(['en', 'pt'])
  const item = runtime.pages[0].elements[0] as any
  expect(item.question.prompt.content.en.text).toBe('How are you?')
  expect(item.question.prompt.content.pt.text).toBe('Como está?') // full map kept (no locale-trim)
  expect(item.option.options).toEqual([{ index: 1, value: 0 }, { index: 2, value: 1 }])
  expect(item.required).toBe(true) // sibling preserved
})

test('reports unresolved refs as problems but still returns a runtime', () => {
  const { runtime, problems } = projectForPreview(model, () => null)
  expect(problems.length).toBeGreaterThan(0)
  expect(runtime.pages[0].elements.length).toBe(1) // element kept (placeholder render)
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `cd editor && npx vitest run src/preview/project.test.ts`
Expected: FAIL — cannot resolve `./project`.

- [ ] **Step 3: Write the module**

`editor/src/preview/project.ts`:
```ts
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'
import { resolveDocument, type Lookup, type RefProblem } from './resolve'

export function projectForPreview(model: Questionnaire, lookup: Lookup): { runtime: Runtime; problems: RefProblem[] } {
  const { resolved, problems } = resolveDocument(model, lookup)
  const r = resolved as Record<string, unknown>
  const meta = (r.metadata ?? {}) as Record<string, unknown>
  const language = String(meta.language ?? 'en')
  const runtime: Runtime = {
    provenance: { preview: true },
    metadata: {
      id: String(meta.id ?? 'qst_preview'),
      title: String(meta.title ?? ''),
      description: meta.description as string | undefined,
      language,
    },
    locale: language,
    available_locales: (meta.available_languages as string[] | undefined) ?? [language],
    style: r.style as Record<string, unknown> | undefined,
    flow: r.flow as Record<string, unknown> | undefined,
    blocks: r.blocks as Runtime['blocks'],
    pages: (r.pages as Runtime['pages']) ?? [],
  }
  return { runtime, problems }
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd editor && npx vitest run src/preview/project.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/preview/project.ts editor/src/preview/project.test.ts
git commit -m "feat(editor): projectForPreview — resolve + shape into renderer Runtime"
```

---

## Task 5: Device frames + page flatten helper

**Files:**
- Create: `editor/src/preview/frames.ts`, `editor/src/preview/flatten.ts`
- Test: `editor/src/preview/flatten.test.ts`

- [ ] **Step 1: Write the failing flatten test**

`editor/src/preview/flatten.test.ts`:
```ts
import { flattenPage } from './flatten'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

test('flattenPage yields {key, element} pairs with ids or positional fallbacks', () => {
  const page = { id: 'p1', elements: [{ id: 'it_1', question: {}, option: {} }, { question: {}, option: {} }] } as unknown as RuntimePage
  const rows = flattenPage(page)
  expect(rows[0].key).toBe('it_1')
  expect(rows[1].key).toBe('p1__el1')
  expect(rows.length).toBe(2)
})
```

- [ ] **Step 2: Run, verify it fails**

Run: `cd editor && npx vitest run src/preview/flatten.test.ts`
Expected: FAIL — cannot resolve `./flatten`.

- [ ] **Step 3: Write the modules**

`editor/src/preview/frames.ts`:
```ts
export const FRAMES = { mobile: 390, tablet: 768, desktop: null } as const
export type FrameKey = keyof typeof FRAMES
export const FRAME_LABELS: Record<FrameKey, string> = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
```

`editor/src/preview/flatten.ts`:
```ts
import { elementKey, pageElementFallback } from '@behaverse/questionnaire-renderer'
import type { RuntimeElement, RuntimePage } from '@behaverse/questionnaire-renderer'

/** Page-level elements as the {key, element}[] StepRenderer wants. StepRenderer
 *  renders Sections (and their children) internally, so only flatten one level. */
export function flattenPage(page: RuntimePage): { key: string; element: RuntimeElement }[] {
  return page.elements.map((element, i) => ({ key: elementKey(element, pageElementFallback(page.id, i)), element }))
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd editor && npx vitest run src/preview/flatten.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/preview/frames.ts editor/src/preview/flatten.ts editor/src/preview/flatten.test.ts
git commit -m "feat(editor): device frames + page flatten helper"
```

---

## Task 6: PreviewPane + store toggle + topbar + workspace split

**Files:**
- Modify: `editor/src/state/store.ts`, `editor/src/state/store.test.ts` (append), `editor/src/app/Topbar.tsx`, `editor/src/app/EditorWorkspace.tsx`
- Create: `editor/src/preview/PreviewPane.tsx`, `editor/src/preview/PreviewPane.test.tsx`

- [ ] **Step 1: Add a preview toggle to the store + test**

Append to `editor/src/state/store.test.ts`:
```ts
test('togglePreview flips previewOpen', () => {
  const st = useEditorStore.getState()
  expect(useEditorStore.getState().previewOpen).toBe(false)
  st.togglePreview()
  expect(useEditorStore.getState().previewOpen).toBe(true)
})
```
In `editor/src/state/store.ts`: add `previewOpen: boolean` to the interface + initial state `previewOpen: false`, add `togglePreview: () => void` to the interface and implement `togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),`, and include `previewOpen: false` in the `reset()` set.

Run: `cd editor && npx vitest run src/state/store.test.ts` → PASS.

- [ ] **Step 2: Write the failing PreviewPane test**

`editor/src/preview/PreviewPane.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewPane } from './PreviewPane'
import type { FetchEntity } from './resolver'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const bodies: Record<string, Record<string, unknown>> = {
  'pr_a@v1': { id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' }, pt: { status: 'validated', text: 'Como está?' } } },
  'opt_a@v1': { id: 'opt_a', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'validated', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] },
               pt: { status: 'validated', options: [{ index: 1, text: 'Não' }, { index: 2, text: 'Sim' }] } } },
}
const fetchEntity: FetchEntity = async (ref) => bodies[ref] ?? null

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en', available_languages: ['en', 'pt'] },
  pages: [{ id: 'p1', title: 'Page 1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' } }] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

test('renders resolved prompt text via the real renderer', async () => {
  render(<PreviewPane fetchEntity={fetchEntity} />)
  expect(await screen.findByText('How are you?')).toBeInTheDocument()
})

test('language picker switches the rendered locale', async () => {
  render(<PreviewPane fetchEntity={fetchEntity} />)
  await screen.findByText('How are you?')
  await userEvent.selectOptions(screen.getByLabelText(/language/i), 'pt')
  await waitFor(() => expect(screen.getByText('Como está?')).toBeInTheDocument())
})
```

- [ ] **Step 3: Run, verify it fails**

Run: `cd editor && npx vitest run src/preview/PreviewPane.test.tsx`
Expected: FAIL — cannot resolve `./PreviewPane`.

- [ ] **Step 4: Write PreviewPane**

`editor/src/preview/PreviewPane.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { StepRenderer, type RendererStrings, type AnswerValue } from '@behaverse/questionnaire-renderer'
import '@behaverse/questionnaire-renderer/style.css'
import { useEditorStore } from '../state/store'
import { resolveEntities, type FetchEntity } from './resolver'
import { fetchEntityBody } from '../persistence/library'
import { projectForPreview } from './project'
import { flattenPage } from './flatten'
import { FRAMES, FRAME_LABELS, type FrameKey } from './frames'
import type { EntityBody } from './resolve'

const STRINGS: RendererStrings = { required: 'Required', unsupported: 'Unsupported element' }

export function PreviewPane({ fetchEntity = fetchEntityBody as FetchEntity }: { fetchEntity?: FetchEntity }) {
  const { model, selection } = useEditorStore()
  const [entityMap, setEntityMap] = useState<Map<string, EntityBody | null>>(new Map())
  const [resolving, setResolving] = useState(false)
  const [locale, setLocale] = useState<string>('en')
  const [device, setDevice] = useState<FrameKey>('desktop')
  const [scope, setScope] = useState<'page' | 'all'>('page')
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const cacheRef = useRef(new Map<string, EntityBody | null>())

  // resolve refs (debounced) on model change
  useEffect(() => {
    if (!model) return
    let ignore = false
    setResolving(true)
    const t = setTimeout(() => {
      resolveEntities(model, fetchEntity, cacheRef.current).then((m) => {
        if (ignore) return
        setEntityMap(new Map(m))
        setResolving(false)
      })
    }, 300)
    return () => { ignore = true; clearTimeout(t) }
  }, [model, fetchEntity])

  // default the locale to the questionnaire's language once
  useEffect(() => { if (model?.metadata.language) setLocale(String(model.metadata.language)) }, [model?.metadata.language])

  const { runtime, problems } = useMemo(() => {
    if (!model) return { runtime: null, problems: [] }
    return projectForPreview(model, (ref) => entityMap.get(ref) ?? null)
  }, [model, entityMap])

  if (!model || !runtime) return <div className="p-6 text-slate-400">Nothing to preview.</div>

  const locales = runtime.available_locales ?? [runtime.metadata.language]
  const selectedPageId = (() => {
    if (selection && selection[0] === 'pages' && typeof selection[1] === 'number') return runtime.pages[selection[1] as number]?.id
    return runtime.pages[0]?.id
  })()
  const pages = scope === 'all' ? runtime.pages : runtime.pages.filter((p) => p.id === selectedPageId)
  const width = FRAMES[device]
  const onAnswer = (key: string, value: AnswerValue) => setAnswers((a) => ({ ...a, [key]: value }))

  return (
    <section aria-label="Preview" className="flex h-full flex-col overflow-hidden border-l border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-sm">
        <label className="flex items-center gap-1">Language
          <select aria-label="Preview language" value={locale} onChange={(e) => setLocale(e.target.value)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {locales.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Device
          <select aria-label="Preview device" value={device} onChange={(e) => setDevice(e.target.value as FrameKey)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {(Object.keys(FRAMES) as FrameKey[]).map((k) => <option key={k} value={k}>{FRAME_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Scope
          <select aria-label="Preview scope" value={scope} onChange={(e) => setScope(e.target.value as 'page' | 'all')}
                  className="rounded border border-slate-300 px-1 py-0.5">
            <option value="page">Selected page</option>
            <option value="all">Whole questionnaire</option>
          </select>
        </label>
        {resolving && <span className="text-xs text-slate-400">resolving…</span>}
      </div>
      {problems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          {problems.length} referenced {problems.length === 1 ? 'entity' : 'entities'} not loaded (showing placeholders).
        </div>
      )}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="qv-theme mx-auto bg-white shadow-sm" style={{ width: width ?? '100%', maxWidth: '100%' }}>
          <div className="p-6">
            {pages.map((page) => (
              <div key={page.id} className="mb-8">
                {scope === 'all' && page.title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{page.title}</h2>}
                <StepRenderer elements={flattenPage(page)} locale={locale} answers={answers} onAnswer={onAnswer}
                              requiredErrors={[]} strings={STRINGS} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the PreviewPane test, verify PASS**

Run: `cd editor && npx vitest run src/preview/PreviewPane.test.tsx`
Expected: PASS (renders "How are you?"; switches to "Como está?").

- [ ] **Step 6: Enable the Topbar Preview toggle**

In `editor/src/app/Topbar.tsx`, replace the disabled Preview button with a wired toggle. Read `previewOpen` + `togglePreview` from the store and render:
```tsx
<button onClick={togglePreview}
        className={`rounded border px-3 py-1 text-sm ${previewOpen ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-50'}`}>
  ▢ Preview
</button>
```
(Destructure `previewOpen` and `togglePreview` from `useEditorStore()` alongside the existing `{ model, dirty, validation }`.)

- [ ] **Step 7: Split the workspace when preview is open**

Rewrite `editor/src/app/EditorWorkspace.tsx`:
```tsx
import { useEditorStore } from '../state/store'
import { StructureTree } from '../tree/StructureTree'
import { Canvas } from '../canvas/Canvas'
import { Inspector } from '../inspector/Inspector'
import { PreviewPane } from '../preview/PreviewPane'

export function EditorWorkspace() {
  const previewOpen = useEditorStore((s) => s.previewOpen)
  const center = previewOpen ? 'grid-cols-[260px_1fr_1fr_320px]' : 'grid-cols-[260px_1fr_320px]'
  return (
    <div className={`grid flex-1 overflow-hidden ${center}`}>
      <StructureTree />
      <Canvas />
      {previewOpen && <PreviewPane />}
      <Inspector />
    </div>
  )
}
```

- [ ] **Step 8: Run the app/preview suite + build**

Run: `cd editor && npx vitest run src/preview/ src/app/ src/state/ && npm run typecheck && npm run build`
Expected: all PASS + clean build.

- [ ] **Step 9: Commit**

```bash
git add editor/src/state/store.ts editor/src/state/store.test.ts editor/src/app/Topbar.tsx editor/src/app/EditorWorkspace.tsx editor/src/preview/PreviewPane.tsx editor/src/preview/PreviewPane.test.tsx
git commit -m "feat(editor): PreviewPane (live WYSIWYG via renderer lib) + preview toggle + split layout"
```

---

## Task 7: Playwright smoke + screenshot

**Files:**
- Create: `editor/src/__fixtures__/preview_bundle.json`
- Modify: `editor/tests/e2e/smoke.spec.ts` (add a preview test)

- [ ] **Step 1: Create a self-contained preview bundle fixture**

`editor/src/__fixtures__/preview_bundle.json` — a tiny valid questionnaire plus the entity bodies its refs resolve to (the smoke stubs `/v1/entities/**` from `entities`):
```json
{
  "questionnaire": {
    "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
    "metadata": { "id": "qst_preview_demo", "title": "Preview Demo", "description": "ED-B smoke", "version": "v26.0609", "language": "en", "available_languages": ["en"] },
    "pages": [ { "id": "p1", "title": "Page 1", "elements": [ { "question": { "prompt": { "ref": "pr_demo@v26.0609" } }, "option": { "ref": "opt_yesno@v26.0609" }, "required": true } ] } ]
  },
  "entities": {
    "prompt/pr_demo": { "id": "pr_demo", "content": { "en": { "status": "validated", "text": "Do you enjoy building editors?" } } },
    "option/opt_yesno": { "id": "opt_yesno", "input_data_type": "choice", "measurement_type": "nominal", "selection": "single",
      "options": [ { "index": 1, "value": 0 }, { "index": 2, "value": 1 } ],
      "content": { "en": { "status": "validated", "options": [ { "index": 1, "text": "No" }, { "index": 2, "text": "Yes" } ] } } }
  }
}
```

- [ ] **Step 2: Add the preview smoke test**

Append to `editor/tests/e2e/smoke.spec.ts`:
```ts
import bundle from '../../src/__fixtures__/preview_bundle.json'

test('toggle preview → renders resolved content via the renderer', async ({ page }) => {
  // stub the Library entity endpoint from the bundle's entities map
  await page.route('**/v1/entities/**', async (route) => {
    const url = new URL(route.request().url())
    // path: /v1/entities/{type}/{id}
    const m = url.pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const key = m ? `${m[1]}/${m[2]}` : ''
    const body = (bundle.entities as Record<string, unknown>)[key]
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')
  // write the bundle's questionnaire to a temp file and open it
  const qJson = JSON.stringify(bundle.questionnaire)
  await page.setInputFiles('input[type=file]', { name: 'preview_demo.json', mimeType: 'application/json', buffer: Buffer.from(qJson) })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.getByText('Do you enjoy building editors?')).toBeVisible()
  await expect(preview.getByText('Yes')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-b-preview.png', fullPage: true })
})
```

- [ ] **Step 3: Run the smoke**

Run: `cd editor && npm run build && npx playwright test`
Expected: both smoke tests PASS; screenshot at `editor/tests/e2e/screenshots/ed-b-preview.png`.
(If `Buffer` is undefined in the Playwright TS context, add `import { Buffer } from 'node:buffer'` at the top of the spec.)

- [ ] **Step 4: Show the owner the screenshot**

Present `editor/tests/e2e/screenshots/ed-b-preview.png` for visual reaction.

- [ ] **Step 5: Commit**

```bash
git add editor/src/__fixtures__/preview_bundle.json editor/tests/e2e/smoke.spec.ts
git commit -m "test(editor): Playwright preview smoke + ED-B screenshot"
```

---

## Task 8: README + FOLLOWUPS

**Files:**
- Modify: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: Update README**

In `editor/README.md`: add an "ED-B — Inline preview" section noting the split-pane preview, that it uses the Web Viewer renderer library (built via the `ensure-renderer` prepare step from `web-viewer/dist-lib`), the language/device/scope pickers, and that it is **static structural** (logic/scoring/validation come in ED-D). Update the does/doesn't list (does: live WYSIWYG preview; doesn't yet: live logic/branching/scoring in preview).

- [ ] **Step 2: Update FOLLOWUPS**

Append to `editor/FOLLOWUPS.md`:
- (g) **Verify the Library entity-body endpoint** — `fetchEntityBody` assumes `GET /v1/entities/{type}/{id}?version=` returns the entity body. Confirm against the live API (path + whether version is a query/path/ignored); adjust `parseRef`/`fetchEntityBody` if needed.
- (h) Preview resolution is per-`ref@version` cached in-memory for the session; not persisted. Large questionnaires re-resolve on first preview after reload.
- (i) `show_if`/logic/scoring/validation are **ignored** in the preview (rendered unconditionally) until ED-D wires the evaluator + logic engine into the preview.
- (j) The renderer library is consumed from `web-viewer/dist-lib` via a Vite alias; at the repo split this becomes the published `@behaverse/questionnaire-renderer` npm package.

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-B README + FOLLOWUPS"
```

---

## Final verification

Run the whole suite + build + e2e:
```bash
cd editor && npm test && npm run typecheck && npm run build && npx playwright test
```
All green. ED-B success criterion: with a questionnaire open, toggling Preview shows a live, themed, device-framable WYSIWYG render in any available language via the real Web Viewer renderer; edits reflect live; unresolved refs degrade to placeholders.

---

## Self-review notes (author)

**Spec coverage:** resolve-and-shape pure module (Tasks 2,4) ✓; entity resolution inline/Library/cache/transitive (Task 3) ✓; renderer-lib embed via alias + ensure-built (Task 1) ✓; PreviewPane split + language + device + scope + throwaway answers + live debounced re-projection + placeholder banner (Task 6) ✓; topbar toggle enabled + workspace split (Task 6) ✓; shared denormaliser vectors for the resolve step (Task 2 — the five `test_resolve.py` cases ported) ✓; Playwright smoke + screenshot (Task 7) ✓; README/FOLLOWUPS incl. the §9 endpoint-verification flag (Task 8) ✓.

**Deferred per spec (intentional, no task):** live logic/show_if/branching, scoring, validation evaluation (ED-D); Open-in-viewer/deployment/PDF (ED-F); response capture; locale-trim/manifest/scorer-pin/score-strip passes.

**Type consistency:** `EntityBody`/`Lookup`/`RefProblem` (resolve.ts) used identically in resolver.ts/project.ts; `FetchEntity` (resolver.ts) used in PreviewPane + tests; `Runtime`/`RuntimeElement`/`RuntimePage`/`AnswerValue`/`RendererStrings`/`StepRenderer`/`elementKey`/`pageElementFallback` imported from `@behaverse/questionnaire-renderer` consistently; `projectForPreview(model, lookup) => {runtime, problems}` signature consistent across Task 4 + Task 6; store additions `previewOpen`/`togglePreview` consistent across store + Topbar + EditorWorkspace.

**Build-order note:** Task 1 must run first (the alias + dist-lib must exist before any `@behaverse/questionnaire-renderer` import compiles). Tasks 2–5 are pure and independent; Task 6 composes them; Tasks 7–8 finish.
