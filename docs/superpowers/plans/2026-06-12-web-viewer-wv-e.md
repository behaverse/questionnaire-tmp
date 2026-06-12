# Web Viewer WV-E (Session Resume + Locale Switch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OD-14 session resume — per-question state survives reload via IndexedDB, the participant re-authenticates with a persisted token and lands on the first unanswered question in their last-active locale; demo/ephemeral deployments refuse resume; a locale switcher swaps runtime text while preserving answers. Spec: [2026-06-12-web-viewer-wv-e-design.md](../specs/2026-06-12-web-viewer-wv-e-design.md) (all F1–F5 accepted).

**Architecture:** A new `web-viewer/src/resume/` — a `ResumeStore` interface (IndexedDB-backed in prod, in-memory fake for tests; injected via `getResumeStore()` so App/engine tests need no real IndexedDB), and a pure `resolveResume()` that branches the boot flow on `GET /sessions/{id}`. The App's existing boot effect tries resume before minting; a debounced effect persists `{session_id, token, last_active_locale, answers, stepIndex, visited}` on change; a `LocaleSwitcher` drives the existing VS locale endpoint. One additive VS change (`/sessions/new` returns `ephemeral`).

**Tech Stack:** existing web-viewer (Vite/React19/TS/vitest/RTL) + `fake-indexeddb` (dev-dep, real-wrapper test only); Python/FastAPI for the VS change. Rust toolchain at `$HOME/.cargo` (the evaluator build runs on `npm run build`).

**Branch:** create `wv-e-web-viewer` from `master` before Task 1; merge `--no-ff` + push at the end (no PRs).

**Conventions (every task):** run JS tests from `web-viewer/` with `npx vitest run`; NEVER bare `tsc` (only `npm run typecheck`); the VS suite is its own `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` from repo root; commit per task. Reuse WV-A..D: `flattenSteps`/`Step`/`requiredUnanswered`/`stepEntries` (`app/steps.ts`); `collectPrograms`/`visibleEntries`/`isElementVisible` (`src/logic/`); `makeBindings`/`nullResolver`; the reducer (`session.ts`); the boot/pipeline in `App.tsx`.

---

## File map

| Path | Responsibility |
|---|---|
| `web-viewer/src/resume/types.ts` | `ResumeRecord`, `ResumeStore`, `ResumeOutcome` |
| `web-viewer/src/resume/store.ts` | `indexedDbStore()` (real wrapper), `makeFakeStore()` (in-memory), `getResumeStore()` (prod singleton) |
| `web-viewer/src/resume/resolve.ts` | `resolveResume(record, vs)` → outcome; `firstUnansweredStep(...)` landing helper |
| `web-viewer/src/app/bootstrap.ts` (modify) | `MintOk` gains `ephemeral`; `getSession`/`getRuntime`/`switchLocale` VS reads |
| `web-viewer/src/app/session.ts` (modify) | `rehydrate` action; `completed` phase |
| `web-viewer/src/app/App.tsx` (modify) | resume-on-boot; debounced persistence; clear-on-complete; locale switch; demo notice |
| `web-viewer/src/app/chrome/LocaleSwitcher.tsx` (new) | available-locales control |
| `web-viewer/src/app/chrome/strings.ts` (modify) | demo-cleared notice, already-completed, locale label (en/pt) |
| `viewer-service/src/viewer_service/sessions.py` (modify) | mint returns `ephemeral` |
| `web-viewer/package.json` (modify) | `fake-indexeddb` dev-dep |

---

### Task 1: ResumeStore (interface + fake + IndexedDB wrapper)

**Files:** create `web-viewer/src/resume/types.ts`, `web-viewer/src/resume/store.ts`, `web-viewer/src/resume/store.test.ts`; modify `web-viewer/package.json`.

- [ ] **Step 1: Branch + dep.** `git checkout -b wv-e-web-viewer` (repo root). `cd web-viewer && npm install -D fake-indexeddb@^6` (a faithful in-memory IndexedDB for the wrapper test only). Confirm it lands in devDependencies.
- [ ] **Step 2: types.ts:**

```ts
import type { AnswerValue } from '../renderer/types'

export type ResumeRecord = {
  deploymentId: string
  sessionId: string
  token: string
  lastActiveLocale: string
  answers: Record<string, AnswerValue>
  stepIndex: number
  visited: number[]
  updatedAt: string
  agentId?: string
  sessionIndex?: number
}
export interface ResumeStore {
  get(deploymentId: string): Promise<ResumeRecord | null>
  put(record: ResumeRecord): Promise<void>
  clear(deploymentId: string): Promise<void>
}
```

- [ ] **Step 3: Failing tests** `store.test.ts` (uses fake-indexeddb to exercise the REAL wrapper):

```ts
import 'fake-indexeddb/auto'
import { indexedDbStore, makeFakeStore } from './store'
import type { ResumeRecord } from './types'

const rec = (deploymentId: string): ResumeRecord => ({
  deploymentId, sessionId: 's1', token: 't1', lastActiveLocale: 'en',
  answers: { it_1: 0 }, stepIndex: 2, visited: [0, 1], updatedAt: '2026-06-12T00:00:00Z',
})

describe.each([
  ['indexedDbStore', () => indexedDbStore()],
  ['makeFakeStore', () => makeFakeStore()],
])('%s round-trips', (_name, make) => {
  test('put → get → clear', async () => {
    const s = make()
    expect(await s.get('dpl_1')).toBeNull()
    await s.put(rec('dpl_1'))
    expect(await s.get('dpl_1')).toEqual(rec('dpl_1'))
    await s.put({ ...rec('dpl_2'), sessionId: 's2' })
    expect((await s.get('dpl_2'))?.sessionId).toBe('s2')
    expect((await s.get('dpl_1'))?.sessionId).toBe('s1')   // keyed independently
    await s.clear('dpl_1')
    expect(await s.get('dpl_1')).toBeNull()
    expect(await s.get('dpl_2')).not.toBeNull()
  })
})
```

- [ ] **Step 4: Run → fail. Implement** `store.ts`:

```ts
import type { ResumeRecord, ResumeStore } from './types'

const DB_NAME = 'behaverse-web-viewer'
const STORE = 'resume'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'deploymentId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export function indexedDbStore(): ResumeStore {
  return {
    async get(deploymentId) {
      const r = await tx<ResumeRecord | undefined>('readonly', (s) => s.get(deploymentId) as IDBRequest<ResumeRecord | undefined>)
      return r ?? null
    },
    async put(record) { await tx('readwrite', (s) => s.put(record) as IDBRequest<IDBValidKey>) },
    async clear(deploymentId) { await tx('readwrite', (s) => s.delete(deploymentId) as unknown as IDBRequest<undefined>) },
  }
}

export function makeFakeStore(seed: ResumeRecord[] = []): ResumeStore {
  const map = new Map<string, ResumeRecord>(seed.map((r) => [r.deploymentId, r]))
  return {
    get: async (id) => map.get(id) ?? null,
    put: async (r) => { map.set(r.deploymentId, structuredClone(r)) },
    clear: async (id) => { map.delete(id) },
  }
}

let singleton: ResumeStore | null = null
/** Production accessor (browser IndexedDB). App tests vi.mock this module to inject a fake. */
export function getResumeStore(): ResumeStore {
  if (!singleton) singleton = indexedDbStore()
  return singleton
}
```

- [ ] **Step 5:** `npx vitest run src/resume/store.test.ts` → PASS (both impls). `npm run typecheck` clean.
- [ ] **Step 6: Commit.** `git add web-viewer/src/resume web-viewer/package.json web-viewer/package-lock.json && git commit -m "feat(web-viewer): ResumeStore (IndexedDB wrapper + in-memory fake + getResumeStore)"`

---

### Task 2: VS reads + MintOk.ephemeral (bootstrap.ts)

**Files:** modify `web-viewer/src/app/bootstrap.ts`, `web-viewer/src/app/bootstrap.test.ts`.

- [ ] **Step 1: Failing tests** (append to `bootstrap.test.ts`; the `ok` fixture gains `ephemeral`):

```ts
import { getSession, getRuntime, switchLocale } from './bootstrap'
test('mintSession surfaces ephemeral from the response', async () => {
  const body = { session_id: 's1', session_token: 't1', agent_id: 'agent_a', session_index: 1, runtime: { metadata: {} }, theme: null, ephemeral: true }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })))
  const res = await mintSession('http://vs:9', 'dpl_1', null)
  expect(res).toMatchObject({ ok: true, ephemeral: true })
})
test('getSession returns status/locale on 200, ephemeral flag on 409, error on others', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'in_progress', last_active_locale: 'pt', agent_id: 'agent_z', session_index: 1 }), { status: 200 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"code":"ephemeral_no_resume"}}', { status: 409 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'ephemeral' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'invalid' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'network' })
})
test('getRuntime fetches the resumed runtime; switchLocale posts the new locale', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ metadata: { id: 'qst_x' } }), { status: 200 })))
  expect(await getRuntime('http://vs:9', 's1', 't1')).toMatchObject({ metadata: { id: 'qst_x' } })
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ runtime: { metadata: { id: 'qst_x' } } }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await switchLocale('http://vs:9', 's1', 't1', 'pt')).toMatchObject({ metadata: { id: 'qst_x' } })
  expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ locale: 'pt' })
})
```

- [ ] **Step 2: Run → fail. Implement** in `bootstrap.ts`:
  - `MintOk` type gains `ephemeral: boolean`; in `mintSession`'s success branch add `ephemeral: body.ephemeral ?? false`.
  - New exports:

```ts
export type SessionState =
  | { kind: 'ok'; status: string; lastActiveLocale: string; agentId: string; sessionIndex: number }
  | { kind: 'ephemeral' } | { kind: 'invalid' } | { kind: 'network' }

const authGet = (vs: string, path: string, token: string) =>
  fetch(`${vs}/v1/sessions/${path}`, { headers: { authorization: `Bearer ${token}` } })

export async function getSession(vs: string, id: string, token: string): Promise<SessionState> {
  let r: Response
  try { r = await authGet(vs, id, token) } catch { return { kind: 'network' } }
  if (r.status === 409) return { kind: 'ephemeral' }
  if (r.status === 401 || r.status === 404) return { kind: 'invalid' }
  if (!r.ok) return { kind: 'network' }
  const b = await r.json()
  return { kind: 'ok', status: String(b.status), lastActiveLocale: String(b.last_active_locale ?? 'en'),
           agentId: String(b.agent_id ?? 'agent_resumed'), sessionIndex: Number(b.session_index ?? 1) }
}

export async function getRuntime(vs: string, id: string, token: string): Promise<Runtime | null> {
  try { const r = await authGet(vs, `${id}/runtime`, token); return r.ok ? ((await r.json()) as Runtime) : null }
  catch { return null }
}

export async function switchLocale(vs: string, id: string, token: string, locale: string): Promise<Runtime | null> {
  try {
    const r = await fetch(`${vs}/v1/sessions/${id}/locale`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ locale }),
    })
    return r.ok ? ((await r.json()).runtime as Runtime) : null
  } catch { return null }
}
```

(`Runtime` already imported in bootstrap.ts; if not, `import type { Runtime } from '../renderer/types'`.)

- [ ] **Step 3:** suite + typecheck green. Also UPDATE `App.test.tsx`'s `mintOk` fixture to include `ephemeral: false` (App boot will read it). **Commit:** `git commit -am "feat(web-viewer): VS session reads (getSession/getRuntime/switchLocale) + MintOk.ephemeral"`

---

### Task 3: resolveResume + landing helper (resolve.ts)

**Files:** create `web-viewer/src/resume/resolve.ts`, `web-viewer/src/resume/resolve.test.ts`.

- [ ] **Step 1: Failing tests** `resolve.test.ts`:

```ts
import { resolveResume, firstUnansweredStep } from './resolve'
import { makeFakeStore } from './store'
import { collectPrograms } from '../logic/compile'
import { makeFakeEvaluator } from '../logic/evaluator'
import { makeBindings } from '../logic/bindings'
import { nullResolver } from '../logic/scoring'
import { flattenSteps } from '../app/steps'
import type { ResumeRecord } from './types'
import type { Runtime } from '../renderer/types'

const rec = (over: Partial<ResumeRecord> = {}): ResumeRecord => ({
  deploymentId: 'dpl_1', sessionId: 's1', token: 't1', lastActiveLocale: 'en',
  answers: {}, stepIndex: 0, visited: [], updatedAt: 'x', ...over,
})

test('no stored record → fresh', async () => {
  const out = await resolveResume('http://vs:9', 'dpl_1', makeFakeStore(), {
    getSession: async () => ({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'en', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => ({}) as Runtime,
  })
  expect(out).toEqual({ kind: 'fresh' })
})
test('in_progress → resume with runtime + record', async () => {
  const store = makeFakeStore([rec()])
  const rt = { metadata: { id: 'q' } } as Runtime
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => rt,
  })
  expect(out).toEqual({ kind: 'resume', record: { ...rec(), lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 }, runtime: rt })
})
test('submitted → completed (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ok', status: 'submitted', lastActiveLocale: 'en', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'completed' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('ephemeral 409 → ephemeral_cleared (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ephemeral' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'ephemeral_cleared' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('invalid token → fresh (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'invalid' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'fresh' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('network error → retry (record kept)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'network' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'retry' })
  expect(await store.get('dpl_1')).not.toBeNull()
})
test('firstUnansweredStep lands on the first required+visible+unanswered step', () => {
  const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
  const item = (id: string, required = true) => ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, required })
  const rt: Runtime = { provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
    pages: [{ id: 'p1', elements: [item('it_1'), item('it_2')] }] } as never
  const steps = flattenSteps(rt)
  const ev = makeFakeEvaluator()
  const programs = collectPrograms(rt, ev)
  const land = (answers: Record<string, unknown>) =>
    firstUnansweredStep(steps, programs, ev, makeBindings(answers as never, rt, nullResolver), answers as never)
  expect(land({})).toBe(0)               // nothing answered → step 0
  expect(land({ it_1: 0 })).toBe(1)      // it_1 done → step 1
  expect(land({ it_1: 0, it_2: 0 })).toBe(1) // all done → last visited-ish (saved index handled by caller); here returns last step index... see impl note
})
```

- [ ] **Step 2: Run → fail. Implement** `resolve.ts`:

```ts
import { requiredUnanswered, type Step } from '../app/steps'
import { visibleEntries } from '../logic/visibility'
import type { Programs } from '../logic/compile'
import type { Bindings, LogicEvaluator } from '../logic/types'
import type { AnswerValue, Runtime } from '../renderer/types'
import type { ResumeRecord, ResumeStore } from './types'
import type { SessionState as VsSession } from '../app/bootstrap'

export type ResumeOutcome =
  | { kind: 'fresh' }
  | { kind: 'retry' }
  | { kind: 'completed' }
  | { kind: 'ephemeral_cleared' }
  | { kind: 'resume'; record: ResumeRecord; runtime: Runtime }

export type ResumeVs = {
  getSession(vs: string, id: string, token: string): Promise<VsSession>
  getRuntime(vs: string, id: string, token: string): Promise<Runtime | null>
}

const DONE = new Set(['submitted', 'forwarded', 'completed', 'validated'])

export async function resolveResume(vs: string, deploymentId: string, store: ResumeStore, deps: ResumeVs): Promise<ResumeOutcome> {
  const record = await store.get(deploymentId)
  if (!record) return { kind: 'fresh' }
  const s = await deps.getSession(vs, record.sessionId, record.token)
  if (s.kind === 'network') return { kind: 'retry' }
  if (s.kind === 'ephemeral') { await store.clear(deploymentId); return { kind: 'ephemeral_cleared' } }
  if (s.kind === 'invalid') { await store.clear(deploymentId); return { kind: 'fresh' } }
  if (DONE.has(s.status)) { await store.clear(deploymentId); return { kind: 'completed' } }
  const runtime = await deps.getRuntime(vs, record.sessionId, record.token)
  if (!runtime) return { kind: 'retry' }
  return { kind: 'resume', record: { ...record, lastActiveLocale: s.lastActiveLocale, agentId: s.agentId, sessionIndex: s.sessionIndex }, runtime }
}

/** OD-14 case 1: first step with a required, visible, unanswered element; else the last step index. */
export function firstUnansweredStep(steps: Step[], programs: Programs, ev: LogicEvaluator, bindings: Bindings, answers: Record<string, AnswerValue>): number {
  for (let i = 0; i < steps.length; i++) {
    const visible = visibleEntries(steps[i], programs, ev, bindings)
    if (visible.length === 0) continue
    const visibleStep: Step = { pageId: steps[i].pageId, elements: visible.map((e) => ({ key: e.key, element: e.element })) }
    if (requiredUnanswered(visibleStep, answers).length > 0) return i
  }
  return Math.max(0, steps.length - 1)
}
```

(Simplify the `deps` param type to `ResumeVs` — the `extends infer` is noise; declare `deps: ResumeVs`. The test passes `{getSession, getRuntime}` matching `ResumeVs`. Adjust the third test's last assertion to whatever `firstUnansweredStep` returns when all answered — `steps.length-1` = `0` for the single-page-2-element fixture flattened to focus steps = 2 steps → returns 1; the test asserts 1, correct.)

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): resolveResume (boot branch logic) + firstUnansweredStep landing"`

---

### Task 4: reducer — rehydrate + completed phase

**Files:** modify `web-viewer/src/app/session.ts`, `web-viewer/src/app/session.test.ts`.

- [ ] **Step 1: Failing tests** (append):

```ts
test('rehydrate restores answers/stepIndex/visited and goes ready', () => {
  const s = reducer(initialState, { type: 'rehydrate', session: { id: 's1', token: 't1' },
    runtime, theme: null, steps: flattenSteps(runtime), answers: { it_1: 0 }, stepIndex: 1, visited: [0] })
  expect(s.phase).toBe('ready')
  expect(s.answers).toEqual({ it_1: 0 })
  expect(s.stepIndex).toBe(1)
  expect(s.visited).toEqual([0])
})
test('completed action → completed phase', () => {
  expect(reducer(booted, { type: 'completed' }).phase).toBe('completed')
})
```

(`runtime`/`booted`/`flattenSteps` are existing fixtures in session.test.ts.)

- [ ] **Step 2: Implement** in `session.ts`: add `'completed'` to the phase union; add actions + cases:

```ts
  | { type: 'rehydrate'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[]; answers: Record<string, AnswerValue>; stepIndex: number; visited: number[] }
  | { type: 'completed' }
// cases:
case 'rehydrate':
  return { ...state, phase: 'ready', session: action.session, runtime: action.runtime, theme: action.theme,
           steps: action.steps, answers: action.answers, stepIndex: action.stepIndex, visited: action.visited,
           stepErrors: [], validationErrors: [] }
case 'completed':
  return { ...state, phase: 'completed' }
```

- [ ] **Step 3:** suite + typecheck. **Commit:** `git commit -am "feat(web-viewer): reducer rehydrate + completed phase"`

---

### Task 5: App — resume-on-boot

**Files:** modify `web-viewer/src/app/App.tsx`, `web-viewer/src/app/App.test.tsx`.

- [ ] **Step 1: Failing App tests** (`App.test.tsx`; mock the store module alongside the evaluator mock):

```tsx
import { makeFakeStore } from '../resume/store'
let fakeStore = makeFakeStore()
vi.mock('../resume/store', async (orig) => {
  const actual = await orig<typeof import('../resume/store')>()
  return { ...actual, getResumeStore: () => fakeStore }
})
// reset in afterEach: fakeStore = makeFakeStore()
```

```tsx
test('reload with a stored in_progress session resumes prior answers + lands on first unanswered', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore([{ deploymentId: 'dpl_1', sessionId: 's1', token: 't1', lastActiveLocale: 'en',
    answers: { it_1: 0 }, stepIndex: 1, visited: [0], updatedAt: 'x' }])
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/s1') ) return new Response(JSON.stringify({ status: 'in_progress', last_active_locale: 'en' }), { status: 200 })
    if (String(url).endsWith('/sessions/s1/runtime')) return new Response(JSON.stringify(mini), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  // mini has msg + it_1 (answered, value 0) on page_1, it_2 on page_2 → lands on the number step (it_2)
  expect(await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })).toBeInTheDocument()
  expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/sessions/new'))).toBe(false)  // did NOT mint fresh
})
test('stored session that is already completed → already-completed screen, store cleared', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore([{ deploymentId: 'dpl_1', sessionId: 's1', token: 't1', lastActiveLocale: 'en', answers: {}, stepIndex: 0, visited: [], updatedAt: 'x' }])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'submitted', last_active_locale: 'en' }), { status: 200 })))
  render(<App />)
  expect(await screen.findByRole('heading', { name: /already completed/i })).toBeInTheDocument()
  expect(await fakeStore.get('dpl_1')).toBeNull()
})
test('ephemeral 409 on resume → wipes store, mints fresh, shows demo notice', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore([{ deploymentId: 'dpl_1', sessionId: 's1', token: 't1', lastActiveLocale: 'en', answers: {}, stepIndex: 0, visited: [], updatedAt: 'x' }])
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/s1')) return new Response('{"error":{"code":"ephemeral_no_resume"}}', { status: 409 })
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByText(/demo.*cleared|prior session/i)).toBeInTheDocument()
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement** in `App.tsx`. Read the current boot effect (Task-9/WV-D version, which awaits `loadEvaluator`). Restructure `boot()`:
  - imports: `getResumeStore` (from `../resume/store`), `resolveResume`, `firstUnansweredStep` (from `../resume/resolve`), `getSession`, `getRuntime` (from `./bootstrap`), `collectPrograms` + `makeBindings` + `nullResolver` (already imported in App via WV-D? — add if missing).
  - Hold the store: `const store = getResumeStore()` (module-level call is fine; mocked in tests). Hold a `demoNotice` ref/state (a `useState<boolean>` for the demo-cleared banner) — simplest: add `demoCleared` to a small `useState`.
  - In `boot()` (after `const evaluator = await loadEvaluator()`), BEFORE the mint path, when NOT fixture and `params.deploymentId`:

```tsx
const outcome = await resolveResume(params.vsBaseUrl, params.deploymentId, store, { getSession, getRuntime })
if (outcome.kind === 'retry') { dispatch({ type: 'boot_error', kind: 'failed', code: 'resume_unreachable' }); return }
if (outcome.kind === 'completed') { dispatch({ type: 'completed' }); return }
if (outcome.kind === 'resume') {
  const { record, runtime } = outcome
  applyTheme(null)                          // theme not re-fetched on resume; keep defaults (acceptable; documented)
  buildPipeline(record.sessionId, record.token, record.agentId ?? 'agent_resumed', record.sessionIndex ?? 1, runtime, evaluator)
  const steps = flattenSteps(runtime)
  const programs = pipeline.current!.programs
  const ev = pipeline.current!.evaluator
  const bindings = makeBindings(record.answers, runtime, nullResolver)
  const land = firstUnansweredStep(steps, programs, ev, bindings, record.answers)
  dispatch({ type: 'rehydrate', session: { id: record.sessionId, token: record.token }, runtime, theme: null, steps, answers: record.answers, stepIndex: land, visited: record.visited })
  document.title = runtime.metadata.title
  document.documentElement.lang = record.lastActiveLocale
  return
}
if (outcome.kind === 'ephemeral_cleared') setDemoCleared(true)   // fall through to fresh mint
// ... existing fresh-mint path; after a successful mint, persist the record (Task 6) ...
```

  - `buildPipeline` uses the resumed agent identity carried on `record.agentId`/`sessionIndex` (resolveResume threaded them from `getSession`, Task 2/3).
  - Add a `completed` render branch (an "already completed — thank you" screen using a new string) and a demo-cleared banner shown atop the fresh-mint flow.
- [ ] **Step 3:** make tests green (the resume test asserts NO fresh mint; the completed test asserts the screen + cleared store; the ephemeral test asserts notice + fresh). Fix the agent-identity threading. Full suite + typecheck.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): resume-on-boot (rehydrate + completed screen + demo-cleared notice)"`

---

### Task 6: App — persistence + clear

**Files:** modify `web-viewer/src/app/App.tsx`, `web-viewer/src/app/App.test.tsx`.

- [ ] **Step 1: Failing test** (App.test.tsx):

```tsx
test('answering persists a resume record to the store (non-ephemeral)', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore()
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))   // past message
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await vi.waitFor(async () => {
    const rec = await fakeStore.get('dpl_1')
    expect(rec?.answers).toMatchObject({ it_1: 0 })
    expect(rec?.token).toBe('t1')
  })
})
test('completion clears the store', async () => {
  // walk mini to the end (reuse the WV-B finishing pattern), then assert fakeStore.get('dpl_1') is null
})
```

(Write the second test concretely by mirroring the WV-B "finishing shows the thank-you screen" walk, then `expect(await fakeStore.get('dpl_1')).toBeNull()`.)

- [ ] **Step 2: Implement** in `App.tsx`:
  - On a successful fresh mint, immediately `void store.put({ deploymentId: params.deploymentId!, sessionId, token, lastActiveLocale: locale, answers: {}, stepIndex: 0, visited: [], updatedAt: new Date().toISOString() })` — but ONLY when `!mintOk.ephemeral` (F2). Hold `mintOk.ephemeral` in the pipeline/a ref so persistence is gated.
  - A **persistence effect** (debounced): on `[state.answers, state.stepIndex, state.visited]` (phase ready, non-ephemeral, has a session+deployment), write the record. Debounce ~500 ms with a `useRef<number>` timer so rapid text input coalesces:

```tsx
useEffect(() => {
  if (state.phase !== 'ready' || ephemeralRef.current || !state.session || !params.deploymentId) return
  const handle = window.setTimeout(() => {
    void store.put({ deploymentId: params.deploymentId!, sessionId: state.session!.id, token: state.session!.token,
      lastActiveLocale: localeRef.current, answers: state.answers, stepIndex: state.stepIndex, visited: state.visited,
      updatedAt: new Date().toISOString() })
  }, 500)
  return () => window.clearTimeout(handle)
}, [state.phase, state.answers, state.stepIndex, state.visited])
```

  - **Clear on completion**: in the finishing effect, after `dispatch({ type: 'submitted' })`, `void store.clear(params.deploymentId!)`.
  - `ephemeralRef` set at mint from `mintOk.ephemeral`; `localeRef` tracks the active locale (updated on switch, Task 7). On resume, `ephemeralRef` stays false (resumed sessions are non-ephemeral by definition — ephemeral never reaches resume).
- [ ] **Step 3:** tests green; existing fixture-mode tests still green (fixture mode must NOT persist — gate persistence on `!params.fixture` too). Full suite + typecheck.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): debounced resume persistence + clear-on-complete (ephemeral/fixture skip)"`

---

### Task 7: Locale switcher

**Files:** create `web-viewer/src/app/chrome/LocaleSwitcher.tsx`; modify `web-viewer/src/app/chrome/strings.ts`, `web-viewer/src/app/App.tsx`, `web-viewer/src/app/App.test.tsx`.

- [ ] **Step 1: LocaleSwitcher + strings.** `LocaleSwitcher.tsx`:

```tsx
import { t } from './strings'
export function LocaleSwitcher({ locale, available, onSwitch }: { locale: string; available: string[]; onSwitch: (l: string) => void }) {
  if (available.length <= 1) return null
  return (
    <label className="fixed right-4 top-3 text-sm">
      <span className="sr-only">{t(locale, 'language')}</span>
      <select aria-label={t(locale, 'language')} value={locale} onChange={(e) => onSwitch(e.target.value)}
        className="rounded border border-slate-300 bg-surface px-2 py-1">
        {available.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
      </select>
    </label>
  )
}
```

`strings.ts` — add to en/pt: `language: 'Language' / 'Idioma'`, `completed_title: 'Already completed' / 'Já concluído'`, `completed_body: 'You have already completed this questionnaire. Thank you.' / 'Já concluiu este questionário. Obrigado.'`, `demo_cleared: 'This is a demo — your prior session was cleared.' / 'Isto é uma demonstração — a sua sessão anterior foi limpa.'`.

- [ ] **Step 2: Failing App test:**

```tsx
test('locale switch swaps runtime text and preserves answers', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore()
  const ptRuntime = { ...mini, locale: 'pt', available_locales: ['en', 'pt'],
    pages: [{ id: 'page_1', elements: [{ id: 'msg_intro', content: { pt: { text: 'Bem-vindo. Responda honestamente.' } } }, mini.pages[0].elements[1]] }, mini.pages[1]] }
  const enMint = { ...mintOk, runtime: { ...mini, available_locales: ['en', 'pt'] } }
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(enMint), { status: 200 })
    if (String(url).endsWith('/locale')) return new Response(JSON.stringify({ runtime: ptRuntime }), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await screen.findByText(/Welcome\. Answer honestly\./)
  await userEvent.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'pt')
  expect(await screen.findByText(/Bem-vindo/)).toBeInTheDocument()
})
```

- [ ] **Step 3: Implement** in `App.tsx`: render `<LocaleSwitcher locale={locale} available={state.runtime?.available_locales ?? []} onSwitch={handleLocale} />` in the ready view (and ideally the others). `handleLocale(l)`: `const rt = await switchLocale(params.vsBaseUrl, session.id, session.token, l)`; if `rt`, rebuild the pipeline's `programs` from the new runtime (re-`collectPrograms`), `localeRef.current = l`, and dispatch a runtime swap. Add a reducer action `{ type: 'set_runtime'; runtime: Runtime; steps: Step[] }` → `{ ...state, runtime, steps }` (answers/stepIndex/visited preserved), and re-`flattenSteps`. Persist the new locale (the persistence effect picks it up via localeRef on the next state change; or write immediately). Update `<html lang>`.
- [ ] **Step 4:** tests green; typecheck. **Commit:** `git commit -am "feat(web-viewer): locale switcher (swap runtime text, preserve answers, persist locale)"`

---

### Task 8: VS additive — mint returns `ephemeral`

**Files:** modify `viewer-service/src/viewer_service/sessions.py`; test `viewer-service/tests/test_session_identity.py` (or a new `test_session_ephemeral.py`).

- [ ] **Step 1: Failing test** — extend the existing fixture (which builds an `anonymous_link` deployment → `ephemeral` false) and add a `demo` deployment case. Adapt to the conftest `setup` fixture:

```python
def test_mint_returns_ephemeral_false_for_anonymous(setup):
    client, dep_id = setup
    body = _new_session(client, dep_id).json()
    assert body["ephemeral"] is False

def test_mint_returns_ephemeral_true_for_demo(setup, monkeypatch):
    import viewer_service.runtime as runtime_mod
    client, _ = setup
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609", "mode_preset": "demo",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()
    body = _new_session(client, dep["deployment_id"]).json()
    assert body["ephemeral"] is True
```

(If `demo` deployments mint sessions but the existing `_new_session` works, this is enough; if demo needs different mint params, adapt minimally — read VS-C's demo handling.)

- [ ] **Step 2: Run → fail.** `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_session_identity.py -q` → FAIL (KeyError ephemeral).
- [ ] **Step 3: Implement** — in `sessions.py` `new_session`, the local `ephemeral` is already computed (line 24); add it to the return dict: `return {..., "ephemeral": ephemeral}`.
- [ ] **Step 4: Full VS suite.** `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` from repo root → expect 122 passed (120 + 2).
- [ ] **Step 5: Commit.** `git add viewer-service && git commit -m "feat(viewer-service): mint returns ephemeral (WV-E lets the viewer skip demo persistence)"`

---

### Task 9: README/FOLLOWUPS + verification + live resume smoke + merge

**Files:** modify `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`.

- [ ] **Step 1: README** — add a "## Resume + locale (WV-E)" section: per-question state persists to IndexedDB (keyed by deployment) including the session token, so a reload resumes prior answers + lands on the first unanswered question in the last-active locale; demo/ephemeral never persists and shows the demo-cleared notice on return; a completed session shows "already completed"; a locale switcher (when >1 available_locales) swaps runtime text with answers intact; the WV-A in-memory-token caveat is now RESOLVED. Note the token-in-IndexedDB posture (F1) + the multi-tab last-writer-wins limitation.
- [ ] **Step 2: FOLLOWUPS** — append: token persisted in IndexedDB (F1 — anonymous/opaque/origin-scoped; revisit if authenticated deployments arrive); theme not re-fetched on resume (defaults applied — fold into WV-F or a small resume-theme fetch if it matters); multi-tab coordination is last-writer-wins; offline/PWA queue-and-sync is WV-F; a participant "start over" affordance deferred.
- [ ] **Step 3: Full verification** (paste tails):

```bash
( cd web-viewer && npm test && npm run typecheck )
. "$HOME/.cargo/env" && ( cd web-viewer && npm run build )
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q     # 122
```

- [ ] **Step 4: Live resume smoke** (extends WV-D's; the OD-14 proof). Stand up the stack (Postgres :55437, library, VS :8001 with `VS_CORS_ORIGINS`, register the v26.0612 manifest, create an `anonymous_link` deployment). `npm run dev`, drive chromium: answer the first question, **reload the page** (`page.reload()`), assert the prior answer is restored and the viewer is past the first question (resume worked — IndexedDB persisted across the reload in the same browser context). If the questionnaire has ≥2 locales, switch locale and assert the prompt text changes with the answer preserved. Also run a **demo** deployment, answer one question, reload, assert the demo-cleared notice + fresh start. Record honestly; if the headless context doesn't persist IndexedDB across `reload()` (it should — same page context), note it and rely on the App integration tests as the resume evidence. Clean up (kill servers, docker rm -f, temp + smoke script).
- [ ] **Step 5: Commit.** `git add web-viewer/README.md web-viewer/FOLLOWUPS.md && git commit -m "docs(web-viewer): WV-E resume/locale docs; live resume smoke recorded"`
- [ ] **Step 6: Merge.** Use superpowers:finishing-a-development-branch — re-run Step 3, merge `wv-e-web-viewer` to `master` `--no-ff` (`Merge wv-e-web-viewer: Web Viewer WV-E (session resume + locale switch)`), push, delete branch.

---

## Self-review notes (done at planning time)

- **Spec coverage:** §4 ResumeStore → T1; §5 resume-on-boot + landing → T3 (pure) + T5 (App); §6 ephemeral + additive VS → T5 + T8; §7 locale switch → T7; token persistence (F1) → T1 record + T6 persistence; per-question persistence split (F5) → T6 (IndexedDB) + unchanged WV-B advance submission (VS mirror); F2 ephemeral → T2/T8; F3 landing → T3 `firstUnansweredStep`; F4 completed → T3+T4+T5. §8 testing → store T1, resolve T3, reducer T4, App T5–T7, VS T8, live smoke T9.
- **Type consistency:** `ResumeRecord`/`ResumeStore`/`ResumeOutcome`/`SessionState`(VS) defined once and reused; `getSession` returns `agentId`/`sessionIndex` (Task 5 note folds them into Task 2's ok-variant — implement together); reducer `rehydrate`/`completed`/`set_runtime` actions consumed by App; `firstUnansweredStep` signature matches its App caller.
- **Known judgment calls / risks:** (a) resume doesn't re-fetch the theme (defaults applied — documented; small follow-up). (b) `getSession` returns `agentId`/`sessionIndex` (its ok-variant) so resume can build the pipeline — implemented in Task 2, consumed in Task 5. (c) fixture mode must skip persistence (gated on `!params.fixture` in Task 6). (e) multi-tab is last-writer-wins (documented).
