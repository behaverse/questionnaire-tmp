# Editor ED-G (Usability & Onboarding Pass) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the feature-complete editor approachable — a one-click self-contained sample, a browsable latest-default Library opener, a back-to-home button, a label fix, a search-scope hint, and a fetch throttle that de-flakes ref-based previews.

**Architecture:** All editor-side except a one-time authoring script that freezes the BIS/BAS resolution bundle into a static asset. New small units: a `{questionnaire,entities}` sample asset, a concurrency helper, a questionnaire picker modal. Existing units (StartScreen, App, Topbar, ItemEditor, library client, resolver) get focused edits.

**Tech Stack:** Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright. Spec: `docs/superpowers/specs/2026-06-16-editor-ed-g-design.md`.

**Conventions (read before starting):**
- Run all editor commands from `/home/pedro/Repos/Cursor/questionnaire_apps/editor`.
- Commit from the repo root `/home/pedro/Repos/Cursor/questionnaire_apps`. Every commit message ends with a trailing line: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Branch is `editor-ed-g` (already checked out).
- `loadModel(model: Questionnaire, source: Source, pool?: Record<string, EntityBody>)` — store action; `pool` pre-populates resolved entities.
- The `{questionnaire, entities}` bundle format: `entities` is `Record<"<id>@<version>", EntityBody>`.

---

## File Structure

- **Create** `editor/scripts/build-sample.mjs` — authoring-time fetch+freeze of the BIS/BAS resolution bundle. Not part of the app build.
- **Create** `editor/src/samples/bisbas.bundle.json` — the frozen `{questionnaire, entities}` sample (committed asset).
- **Create** `editor/src/samples/sample.ts` — typed import wrapper exposing `bisbasSample: { questionnaire: Questionnaire; entities: Record<string, EntityBody> }`.
- **Create** `editor/src/persistence/concurrency.ts` — `mapLimit` + `withRetry` helpers.
- **Create** `editor/src/library/LibraryQuestionnairePicker.tsx` — questionnaire-browser modal (queries `/v1/questionnaires`).
- **Modify** `editor/src/state/types.ts` — add `{ kind: 'sample'; id: string }` to `Source`.
- **Modify** `editor/src/persistence/library.ts` — `searchQuestionnaires`; route `fetchEntityBody`/`latestVersion` through `withRetry`.
- **Modify** `editor/src/preview/resolver.ts` — bound concurrency via `mapLimit`.
- **Modify** `editor/src/app/StartScreen.tsx` — "Load a sample" + "Browse Library…" + search-scope hint; manual id+version becomes secondary.
- **Modify** `editor/src/app/App.tsx` — wire sample, browse-picker, and Home.
- **Modify** `editor/src/app/Topbar.tsx` — "← Home" button.
- **Modify** `editor/src/library/LibraryPicker.tsx` — add the search-scope hint.
- **Modify** `editor/src/canvas/ItemEditor.tsx` — label flip.

---

## Task 1: Concurrency helper (`mapLimit` + `withRetry`)

**Files:**
- Create: `editor/src/persistence/concurrency.ts`
- Test: `editor/src/persistence/concurrency.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest'
import { mapLimit, withRetry } from './concurrency'

describe('mapLimit', () => {
  it('never exceeds the concurrency limit and preserves order', async () => {
    let active = 0, peak = 0
    const work = async (n: number) => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--; return n * 2
    }
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 2, work)
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14])
    expect(peak).toBeLessThanOrEqual(2)
  })
  it('handles an empty list', async () => {
    expect(await mapLimit([], 3, async (x) => x)).toEqual([])
  })
})

describe('withRetry', () => {
  it('retries once after a failure then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    expect(await withRetry(fn, { retries: 1, backoffMs: 1 })).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
  it('rethrows after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always'))
    await expect(withRetry(fn, { retries: 1, backoffMs: 1 })).rejects.toThrow('always')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/persistence/concurrency.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `editor/src/persistence/concurrency.ts`:

```ts
/** Run `fn` over `items` with at most `limit` promises in flight; results keep input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const n = Math.max(1, limit)
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

/** Call `fn`, retrying up to `retries` times with a fixed backoff. Rethrows the last error. */
export async function withRetry<R>(fn: () => Promise<R>, opts: { retries?: number; backoffMs?: number } = {}): Promise<R> {
  const retries = opts.retries ?? 1
  const backoffMs = opts.backoffMs ?? 250
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn() }
    catch (e) { lastErr = e; if (attempt < retries) await new Promise((r) => setTimeout(r, backoffMs)) }
  }
  throw lastErr
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/persistence/concurrency.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/persistence/concurrency.ts editor/src/persistence/concurrency.test.ts
git commit -m "feat(editor): ED-G concurrency helpers (mapLimit + withRetry)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Wire throttle + retry into the resolver and Library fetches

**Files:**
- Modify: `editor/src/preview/resolver.ts`
- Modify: `editor/src/persistence/library.ts:36-62`
- Test: `editor/src/preview/resolver.test.ts` (append; create if absent)

- [ ] **Step 1: Write the failing test** (resolver bounds concurrency)

Append to `editor/src/preview/resolver.test.ts` (if the file doesn't exist, create it with this content):

```ts
import { describe, it, expect } from 'vitest'
import { resolveEntities } from './resolver'
import type { Questionnaire } from '../model/types'

describe('resolveEntities concurrency', () => {
  it('never runs more than 5 fetches at once', async () => {
    // a model referencing many prompts via a section of items
    const model = {
      metadata: { id: 'qst_t', title: 'T', language: 'en' },
      pages: [{ id: 'p1', elements: Array.from({ length: 20 }, (_, i) => ({
        id: `it_${i}`, question: { prompt: `pr_${i}@v1` },
        option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } },
      })) }],
    } as unknown as Questionnaire
    let active = 0, peak = 0
    const fetchEntity = async () => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 3))
      active--; return null
    }
    await resolveEntities(model, fetchEntity)
    expect(peak).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/preview/resolver.test.ts`
Expected: FAIL — peak exceeds 5 (current code uses unbounded `Promise.all`). (If `collectRefs` doesn't pick up the prompt refs given this shape, adjust the fixture so it has ≥10 resolvable refs — the assertion that matters is peak ≤ 5.)

- [ ] **Step 3: Implement — bound the resolver frontier**

In `editor/src/preview/resolver.ts`, import the helper and replace the unbounded `Promise.all(frontier.map(...))` with a bounded map. The full edited function:

```ts
import type { Questionnaire } from '../model/types'
import { collectRefs, type EntityBody } from './resolve'
import { mapLimit } from '../persistence/concurrency'

export type FetchEntity = (ref: string) => Promise<EntityBody | null>

const MAX_CONCURRENT = 5

export async function resolveEntities(
  model: Questionnaire,
  fetchEntity: FetchEntity,
  cache: Map<string, EntityBody | null> = new Map(),
): Promise<Map<string, EntityBody | null>> {
  let frontier = [...collectRefs(model)].filter((r) => !cache.has(r))
  while (frontier.length) {
    const bodies = await mapLimit(frontier, MAX_CONCURRENT, (ref) => fetchEntity(ref).catch(() => null))
    frontier.forEach((ref, i) => cache.set(ref, bodies[i]))
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

- [ ] **Step 4: Add retry to `fetchEntityBody` and `latestVersion`**

In `editor/src/persistence/library.ts`, add the import at the top:

```ts
import { withRetry } from './concurrency'
```

Replace the body of `fetchEntityBody` (lines ~36-49) so the network call retries once and a final failure still resolves to `null`:

```ts
export async function fetchEntityBody(ref: string, opts: FetchOpts = {}): Promise<EntityBody | null> {
  const parsed = parseRef(ref)
  if (!parsed) return null
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${parsed.type}/${parsed.id}/versions/${encodeURIComponent(parsed.version)}/definition`
  try {
    return await withRetry(async () => {
      const res = await f(url)
      if (!res.ok) throw new Error(`status ${res.status}`)
      return (await res.json()) as EntityBody
    }, { retries: 1, backoffMs: 200 })
  } catch {
    return null
  }
}
```

Replace the body of `latestVersion` (lines ~51-62) similarly:

```ts
export async function latestVersion(etype: string, id: string, opts: FetchOpts = {}): Promise<string | null> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  try {
    return await withRetry(async () => {
      const res = await f(`${base}/v1/entities/${etype}/${id}`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const d = (await res.json()) as { version?: string }
      return typeof d.version === 'string' ? d.version : null
    }, { retries: 1, backoffMs: 200 })
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/preview/resolver.test.ts src/persistence && npm run typecheck`
Expected: PASS; typecheck clean. (Existing library tests that stub a failing fetch now see two calls — if any such test asserts an exact call count of 1, update it to expect 2, since one retry is correct new behaviour. Do NOT weaken the assertion otherwise.)

- [ ] **Step 6: Full suite**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/preview/resolver.ts editor/src/persistence/library.ts editor/src/preview/resolver.test.ts
git commit -m "fix(editor): ED-G throttle entity resolution (max 5) + retry once; de-flakes ref previews

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Generate + commit the BIS/BAS self-contained sample

**Files:**
- Create: `editor/scripts/build-sample.mjs`
- Create: `editor/src/samples/bisbas.bundle.json` (generated)
- Create: `editor/src/samples/sample.ts`
- Test: `editor/src/samples/sample.test.ts`

- [ ] **Step 1: Write the generator script**

Create `editor/scripts/build-sample.mjs`:

```js
// Authoring-time only (NOT part of the app build). Freezes the BIS/BAS resolution
// bundle into a static, self-contained {questionnaire, entities} sample so the editor
// can load it offline. Re-run if BIS/BAS is republished at a new version.
//   node scripts/build-sample.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.VITE_LIBRARY_BASE_URL ?? 'https://questionnaire-library.vercel.app'
const ID = 'qst_x_bisbas'
const VERSION = 'v26.0606'
const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../src/samples/bisbas.bundle.json')

const res = await fetch(`${BASE}/v1/questionnaires/${ID}/versions/${VERSION}/resolution-bundle`)
if (!res.ok) throw new Error(`resolution-bundle fetch failed: ${res.status}`)
const { definition, entities } = await res.json()
if (!definition?.metadata) throw new Error('no questionnaire definition in resolution-bundle')
if (!entities || typeof entities !== 'object') throw new Error('no entities in resolution-bundle')
const bundle = { questionnaire: definition, entities }
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n')
console.log(`wrote ${out}: ${Object.keys(entities).length} entities, title="${definition.metadata.title}"`)
```

- [ ] **Step 2: Run the generator (requires network to the live Library)**

Run: `node scripts/build-sample.mjs`
Expected: prints `wrote …/bisbas.bundle.json: 26 entities, title="Behavioral Approach/Inhibition Systems (BIS/BAS)"` (entity count may differ slightly). Confirms `editor/src/samples/bisbas.bundle.json` now exists. If the network is unavailable here, STOP and report — the sample asset cannot be hand-faked.

- [ ] **Step 3: Create the typed import wrapper**

Create `editor/src/samples/sample.ts`:

```ts
import type { Questionnaire, EntityBody } from '../model/types'
import bundle from './bisbas.bundle.json'

export const bisbasSample = bundle as unknown as {
  questionnaire: Questionnaire
  entities: Record<string, EntityBody>
}
```

(If `resolveJsonModule` is not already enabled, add `"resolveJsonModule": true` to `editor/tsconfig.json` `compilerOptions` and to `tsconfig.test.json` if it has its own `compilerOptions`. Check first: `grep resolveJsonModule editor/tsconfig*.json` — the project already imports JSON fixtures in tests, so it is likely already enabled.)

- [ ] **Step 4: Write the sample-shape test**

Create `editor/src/samples/sample.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { bisbasSample } from './sample'
import { validateQuestionnaire } from '../model/validate'

describe('bisbasSample', () => {
  it('is a self-contained, Schema-2-valid bundle', () => {
    expect(bisbasSample.questionnaire.metadata.id).toBe('qst_x_bisbas')
    expect(Object.keys(bisbasSample.entities).length).toBeGreaterThan(0)
    const { valid, errors } = validateQuestionnaire(bisbasSample.questionnaire)
    expect(valid, JSON.stringify(errors)).toBe(true)
  })
})
```

(Confirm the validator's import path + return shape: `grep -rn "export function validateQuestionnaire" editor/src/model/`. Adjust the import/return-field names to match — earlier tasks elsewhere use `{ valid, errors }`.)

- [ ] **Step 5: Run the test**

Run: `npx vitest run src/samples/sample.test.ts`
Expected: PASS. If validation fails, the resolution-bundle definition is faithfully canonical — surface the errors; do NOT mutate the sample to force validity.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/scripts/build-sample.mjs editor/src/samples/bisbas.bundle.json editor/src/samples/sample.ts editor/src/samples/sample.test.ts editor/tsconfig.json editor/tsconfig.test.json
git commit -m "feat(editor): ED-G bundle self-contained BIS/BAS sample + generator

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(If you didn't edit the tsconfig files, drop them from the `git add`.)

---

## Task 4: `Source` gains `sample`; StartScreen "Load a sample"

**Files:**
- Modify: `editor/src/state/types.ts:4-7`
- Modify: `editor/src/app/StartScreen.tsx`
- Modify: `editor/src/app/App.tsx:45-55`
- Test: `editor/src/app/StartScreen.test.tsx` (create if absent; else append)

- [ ] **Step 1: Extend the `Source` union**

In `editor/src/state/types.ts`, add a variant:

```ts
export type Source =
  | { kind: 'new' }
  | { kind: 'file'; name: string }
  | { kind: 'library'; id: string; version: string }
  | { kind: 'sample'; id: string }
```

- [ ] **Step 2: Write the failing test**

Create/append `editor/src/app/StartScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StartScreen } from './StartScreen'

const noop = () => {}

describe('StartScreen Load a sample', () => {
  it('renders a Load a sample action and calls onLoadSample', () => {
    const onLoadSample = vi.fn()
    render(<StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={onLoadSample} onBrowseLibrary={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /load a sample/i }))
    expect(onLoadSample).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/app/StartScreen.test.tsx`
Expected: FAIL — `onLoadSample` not a prop / button absent.

- [ ] **Step 4: Implement the StartScreen action**

In `editor/src/app/StartScreen.tsx`, extend `Props` and add the button as the first action (above "New questionnaire"):

```tsx
interface Props {
  onNew: () => void
  onOpenFile: (file: File) => void
  onOpenLibrary: (id: string, version: string) => void
  onLoadSample: () => void
  onBrowseLibrary: () => void
}
```

Add inside the `<div className="grid gap-4">`, before the "New questionnaire" button:

```tsx
        <button
          onClick={onLoadSample}
          className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50"
        >
          <div className="font-medium">Load a sample</div>
          <div className="text-sm text-slate-500">Explore a ready-made questionnaire (BIS/BAS) — works offline</div>
        </button>
```

- [ ] **Step 5: Wire it in App**

In `editor/src/app/App.tsx`, add the import:

```tsx
import { bisbasSample } from '../samples/sample'
```

In the `<StartScreen ... />` element, add the prop:

```tsx
          onLoadSample={() => { loadModel(bisbasSample.questionnaire, { kind: 'sample', id: 'qst_x_bisbas' }, bisbasSample.entities); void refreshStaleness() }}
          onBrowseLibrary={() => {}}
```

(`onBrowseLibrary` is wired for real in Task 5; the empty handler here keeps the type satisfied and the build green.)

- [ ] **Step 6: Run the test + typecheck**

Run: `npx vitest run src/app/StartScreen.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/state/types.ts editor/src/app/StartScreen.tsx editor/src/app/App.tsx editor/src/app/StartScreen.test.tsx
git commit -m "feat(editor): ED-G StartScreen Load-a-sample (offline BIS/BAS)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Browse-from-Library picker (latest-default) + search-scope hint

**Files:**
- Modify: `editor/src/persistence/library.ts` (add `searchQuestionnaires`)
- Create: `editor/src/library/LibraryQuestionnairePicker.tsx`
- Modify: `editor/src/app/App.tsx`
- Modify: `editor/src/app/StartScreen.tsx` (Browse button + demote manual inputs + hint)
- Modify: `editor/src/library/LibraryPicker.tsx` (search-scope hint)
- Test: `editor/src/library/LibraryQuestionnairePicker.test.tsx`

- [ ] **Step 1: Add `searchQuestionnaires` to the library client**

In `editor/src/persistence/library.ts`, append (the `/v1/questionnaires` list is instrument-grouped; flatten `items[].forms[]`, each form already carries the latest `version`):

```ts
export interface QuestionnaireResult { id: string; version: string; title: string | null; instrument_id: string | null }

export async function searchQuestionnaires(q: string, opts: FetchOpts = {}): Promise<QuestionnaireResult[]> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/questionnaires?q=${encodeURIComponent(q)}&limit=20`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library questionnaire search failed (${res.status})`)
  const data = (await res.json()) as { items?: Array<{ instrument_id?: string; forms?: Array<{ id: string; version: string; title?: string | null }> }> }
  const out: QuestionnaireResult[] = []
  for (const group of data.items ?? []) {
    for (const form of group.forms ?? []) {
      out.push({ id: form.id, version: form.version, title: form.title ?? null, instrument_id: group.instrument_id ?? null })
    }
  }
  return out
}
```

- [ ] **Step 2: Write the failing picker test**

Create `editor/src/library/LibraryQuestionnairePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryQuestionnairePicker } from './LibraryQuestionnairePicker'

describe('LibraryQuestionnairePicker', () => {
  it('searches and picks a questionnaire at its latest version', async () => {
    const search = vi.fn().mockResolvedValue([
      { id: 'qst_x_bisbas', version: 'v26.0606', title: 'BIS/BAS', instrument_id: 'inst_bisbas' },
    ])
    const onPick = vi.fn()
    render(<LibraryQuestionnairePicker onPick={onPick} onClose={() => {}} search={search} />)
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'bis' } })
    await waitFor(() => expect(search).toHaveBeenCalledWith('bis'))
    fireEvent.click(await screen.findByRole('button', { name: /qst_x_bisbas/i }))
    expect(onPick).toHaveBeenCalledWith('qst_x_bisbas', 'v26.0606')
  })

  it('shows the search-scope hint', () => {
    render(<LibraryQuestionnairePicker onPick={() => {}} onClose={() => {}} search={async () => []} />)
    expect(screen.getByText(/searches title & description/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/library/LibraryQuestionnairePicker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the picker** (mirrors `LibraryPicker`'s debounce + error pattern)

Create `editor/src/library/LibraryQuestionnairePicker.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { searchQuestionnaires as realSearch, type QuestionnaireResult } from '../persistence/library'

export function LibraryQuestionnairePicker({ onPick, onClose, search = realSearch }: {
  onPick: (id: string, version: string) => void
  onClose: () => void
  search?: (q: string) => Promise<QuestionnaireResult[]>
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<QuestionnaireResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!q) { setItems([]); return }
    clearTimeout(tRef.current)
    tRef.current = setTimeout(() => {
      search(q).then((r) => { setItems(r); setError(null) }).catch(() => setError('Library unavailable'))
    }, 300)
    return () => clearTimeout(tRef.current)
  }, [q, search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <strong className="text-sm">Open a questionnaire from the Library</strong>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="p-3">
          <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questionnaires…"
                 className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <div className="mt-1 text-xs text-slate-400">Searches title &amp; description.</div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-72 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => onPick(it.id, it.version)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-slate-50">
                  <span className="font-mono">{it.id}</span>
                  {it.title && <span className="truncate text-slate-500">{it.title}</span>}
                  <span className="ml-auto text-xs text-slate-400">{it.version}</span>
                </button>
              </li>
            ))}
            {q && items.length === 0 && !error && <li className="px-2 py-1 text-sm text-slate-400">No results.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run the picker test**

Run: `npx vitest run src/library/LibraryQuestionnairePicker.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Wire Browse into StartScreen + App**

In `editor/src/app/StartScreen.tsx`, inside the "Open from Library" box, add a Browse button above the manual inputs and demote the manual row with a label. Replace the existing `<div className="rounded-lg border border-slate-300 p-4">` block's inner content with:

```tsx
          <div className="font-medium">Open from Library</div>
          <button onClick={onBrowseLibrary}
                  className="mt-2 rounded bg-slate-800 px-3 py-1 text-sm text-white">Browse Library…</button>
          <div className="mt-3 text-xs text-slate-400">Or open by exact id + version:</div>
          <div className="mt-1 flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="qst_phq9"
                   className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Questionnaire id" />
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v26.0609"
                   className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Version" />
            <button onClick={() => onOpenLibrary(id, version)} disabled={!id || !version}
                    className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40">Open</button>
          </div>
```

In `editor/src/app/App.tsx`: add a local state + render the picker. Add near the other `useState`:

```tsx
  const [browsing, setBrowsing] = useState(false)
```

Add the import:

```tsx
import { LibraryQuestionnairePicker } from '../library/LibraryQuestionnairePicker'
import { latestVersion } from '../persistence/library'
```

Replace the placeholder `onBrowseLibrary={() => {}}` (from Task 4) with:

```tsx
          onBrowseLibrary={() => setBrowsing(true)}
```

In the `!model` branch, render the picker when browsing (inside the `<>...</>`, after `<StartScreen .../>`):

```tsx
        {browsing && (
          <LibraryQuestionnairePicker
            onClose={() => setBrowsing(false)}
            onPick={async (id, version) => {
              setBrowsing(false)
              try {
                setError(null)
                const v = version || (await latestVersion('questionnaire', id)) || version
                loadModel(await fetchFromLibrary(id, v), { kind: 'library', id, version: v })
                void refreshStaleness()
              } catch (e) { setError(String(e)) }
            }}
          />
        )}
```

(The picker already returns the latest `version` from the catalogue, so `latestVersion` is only a fallback. `fetchFromLibrary` and `refreshStaleness` are already imported/used in App.)

- [ ] **Step 7: Add the search-scope hint to the existing entity `LibraryPicker`**

In `editor/src/library/LibraryPicker.tsx`, immediately after the `<input aria-label="Search" ... />` (around line 49), add:

```tsx
          <div className="mt-1 text-xs text-slate-400">Searches title &amp; description.</div>
```

- [ ] **Step 8: Run tests + typecheck + full suite**

Run: `npx vitest run src/library src/app && npm run typecheck && npx vitest run`
Expected: PASS; typecheck clean; whole suite green.

- [ ] **Step 9: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/persistence/library.ts editor/src/library/LibraryQuestionnairePicker.tsx editor/src/library/LibraryQuestionnairePicker.test.tsx editor/src/app/StartScreen.tsx editor/src/app/App.tsx editor/src/library/LibraryPicker.tsx
git commit -m "feat(editor): ED-G browse-from-Library picker (latest-default) + search-scope hint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Back-to-home button

**Files:**
- Modify: `editor/src/app/Topbar.tsx`
- Test: `editor/src/app/Topbar.test.tsx` (append)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/app/Topbar.test.tsx`:

```tsx
import { describe as describe2, it as it2, expect as expect2, vi as vi2, beforeEach as beforeEach2 } from 'vitest'
import { render as render2, screen as screen2, fireEvent as fireEvent2 } from '@testing-library/react'
import { Topbar as Topbar2 } from './Topbar'
import { useEditorStore as store2 } from '../state/store'
import type { Questionnaire as Q2 } from '../model/types'

const base2 = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as Q2

describe2('Topbar Home', () => {
  beforeEach2(() => { store2.getState().loadModel(structuredClone(base2), { kind: 'new' }) })
  it2('returns to the start screen (clears the model) after confirm', () => {
    vi2.spyOn(window, 'confirm').mockReturnValue(true)
    render2(<Topbar2 onValidate={() => {}} />)
    fireEvent2.click(screen2.getByRole('button', { name: /home/i }))
    expect2(store2.getState().model).toBeNull()
    ;(window.confirm as unknown as { mockRestore: () => void }).mockRestore()
  })
})
```

(If `Topbar.test.tsx` already imports these names, reuse the existing imports instead of the aliased `…2` names — the aliases avoid duplicate-identifier errors when appending to a file that already imports `render`, `screen`, etc. Prefer reusing existing imports if clean.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/app/Topbar.test.tsx`
Expected: FAIL — no Home button.

- [ ] **Step 3: Implement**

In `editor/src/app/Topbar.tsx`, pull `reset` and `dirty` from the store and add the leftmost button. Update the destructure on line 6:

```tsx
  const { model, dirty, validation, previewOpen, togglePreview } = useEditorStore()
  const reset = useEditorStore((s) => s.reset)
```

Add as the first child inside `<header ...>`, before the title `<span>`:

```tsx
      <button
        onClick={() => { if (!dirty || confirm('Leave this questionnaire? Your draft is autosaved and will be here when you return.')) reset() }}
        className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">← Home</button>
```

- [ ] **Step 4: Run the test + typecheck**

Run: `npx vitest run src/app/Topbar.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/app/Topbar.tsx editor/src/app/Topbar.test.tsx
git commit -m "feat(editor): ED-G back-to-home button (dirty-guarded; keeps autosave)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Label flip — "Option (Response)"

**Files:**
- Modify: `editor/src/canvas/ItemEditor.tsx:108`
- Test: `editor/src/canvas/ItemEditor.test.tsx` (append a focused assertion)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/canvas/ItemEditor.test.tsx` (reuse the file's existing render helper/fixture — it already mounts an item with a question + option). Add inside the existing top-level `describe` (or as a standalone `it`):

```tsx
it('labels the option section "Option (Response)"', () => {
  // uses the same loadModel fixture the file already sets up in beforeEach
  // (an inline item with a question). Render the editor for it:
  renderItemEditor() // <-- use whatever the file's existing helper is; if there is none, copy the render setup from a sibling test in this file
  expect(screen.getByText('Option (Response)')).toBeInTheDocument()
  expect(screen.queryByText('Response (Option)')).toBeNull()
})
```

If the file has no reusable render helper, copy the exact `render(<ItemEditor .../>)` invocation from an existing passing test in the same file (do not invent props).

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/canvas/ItemEditor.test.tsx`
Expected: FAIL — the label is still "Response (Option)".

- [ ] **Step 3: Implement**

In `editor/src/canvas/ItemEditor.tsx:108`, change:

```tsx
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Option (Response)</span>
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/canvas/ItemEditor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/canvas/ItemEditor.tsx editor/src/canvas/ItemEditor.test.tsx
git commit -m "fix(editor): ED-G label Option (Response) — Option is the primary concept

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Playwright smoke + full e2e re-run

**Files:**
- Create: `editor/tests/e2e/onboarding.spec.ts`

- [ ] **Step 1: Write the smoke spec**

Create `editor/tests/e2e/onboarding.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('load sample renders offline + back-to-home returns to start', async ({ page }) => {
  // start clean: no autosaved draft
  await page.addInitScript(() => { indexedDB.deleteDatabase('qv-editor') })
  await page.goto('/')
  await page.getByRole('button', { name: /load a sample/i }).click()
  // the BIS/BAS title appears in the topbar
  await expect(page.getByText(/BIS\/BAS|Behavioral Approach/i).first()).toBeVisible()
  // open the in-app preview and assert NO placeholder banner (self-contained bundle resolves offline)
  await page.getByRole('button', { name: '▢ Preview' }).click()
  await expect(page.getByText(/referenced entities not loaded/i)).toHaveCount(0)
  await expect(page.locator('h2.qv-prompt').first()).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-g-sample.png', fullPage: true })
  // back to home
  page.on('dialog', (d) => d.accept())
  await page.getByRole('button', { name: /home/i }).click()
  await expect(page.getByRole('button', { name: /load a sample/i })).toBeVisible()
})
```

(The IndexedDB database name may differ — verify with `grep -rn "openDB\|indexedDB.open\|databaseName\|'qv" editor/src/persistence/indexeddb.ts` and use the real name. If clearing it via `addInitScript` is unreliable, instead assert the test tolerates a pre-existing draft by clicking "← Home" first when a model is present.)

- [ ] **Step 2: Run the smoke**

Run: `npm run e2e -- onboarding`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-g-sample.png`. (Run `npx playwright install chromium` first if needed. If it can't run here, commit the spec + report the exact failure; do NOT weaken assertions.)

- [ ] **Step 3: Re-run the FULL e2e suite**

Run: `npm run e2e`
Expected: report totals. The Topbar gained a "← Home" button — if a pre-existing spec's `getByRole('button', { name: /home/i })` or a broad `/.../ ` selector now matches ambiguously, scope it (per the ED-E/ED-F e2e-rot lesson). Fix any such breakage in the spec selectors; do not weaken assertions.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/
git commit -m "test(editor): ED-G onboarding smoke (load sample offline + home) + e2e fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-G follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-G Follow-ups

Known limitations and open items carried out of ED-G (usability/onboarding pass).

## (ed-g-1) Server-side search indexes title + description only

The Library full-text index (`library/src/library/store/index.py`) covers each entity's
title + description, NOT its id or item/prompt body text. The pickers now say so. Extending
the index to body text (so authors can find a prompt by its wording) is a Library schema +
reseed change, deferred.

## (ed-g-2) The sample is a frozen snapshot

`src/samples/bisbas.bundle.json` is generated once from the live Library
(`scripts/build-sample.mjs`). If BIS/BAS is republished at a newer version, re-run the script
to refresh the asset. It is intentionally self-contained (no runtime network) so the sample
works offline.

## (ed-g-3) Back-to-home keeps the autosaved draft

"← Home" returns to the StartScreen but does not clear IndexedDB, so a browser reload still
resumes the last draft. A dedicated "discard draft" / draft manager is deferred.

## (ed-g-4) Browse picker is a flat latest-only list

The questionnaire browser lists the latest published version of each form (from the grouped
catalogue). Choosing an older version still uses the manual id+version fallback. A per-form
version dropdown is deferred.
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 3: Production build smoke**

Run: `npm run build`
Expected: succeeds; emits `dist/index.html` + `dist/preview.html` + the wasm asset, and the sample JSON is bundled (no missing-module error).

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-G FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria (mirror of spec §5)

1. Home screen offers one-click **Load a sample** → BIS/BAS renders fully offline (no placeholder banner). — Tasks 3, 4, 8.
2. Library open is **browsable** + **latest-default**; no required version typing on the primary path. — Task 5.
3. **← Home** returns to the StartScreen (draft kept). — Task 6.
4. Item label reads **Option (Response)**. — Task 7.
5. Both Library search fields show the **title & description** hint. — Task 5.
6. Ref-based previews resolve **reliably** (throttle + retry). — Tasks 1, 2.
7. All suites green; full e2e re-run green; sample-loaded screenshot delivered. — Tasks 8, 9.

After the branch is green: final whole-branch review → merge to master locally + push (NO PR — owner preference) → write `project_editor_ed_g` memory + MEMORY.md line + HANDOFF update.
```
