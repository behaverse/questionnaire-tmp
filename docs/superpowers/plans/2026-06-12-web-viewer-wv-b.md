# Web Viewer WV-B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WV-B turns answers into Schema 5 `Response` rows and `bdm:` Schema 4a events, submits them to the Viewer Service (debounced/batched, with back-off), and completes the session — closing the Phase-2 gate for linear questionnaires. Spec: [2026-06-12-web-viewer-wv-b-design.md](../specs/2026-06-12-web-viewer-wv-b-design.md).

**Architecture:** Four new pure-ish modules in `web-viewer/src/app/` — `trial.ts` (TrialClock: per-step timing, response-id counter, attempt tracking), `responses.ts` (Schema 5 row builders + runtime index maps), `events.ts` (event builders + EventBatcher), `transport.ts` (SubmissionQueue with back-off + keepalive) — wired by `App.tsx` through a single `advance()` path. One **additive** VS change (mint/GET return `agent_id` + `session_index`). All builder outputs are Ajv-validated against the real Schema 5/4a JSON in tests.

**Tech Stack:** existing web-viewer stack (Vite/React19/TS/vitest/RTL; `ajv` already a devDep). Python/FastAPI for the VS change.

**Branch:** create `wv-b-web-viewer` from `master` before Task 1; merge+push at the end (no PRs).

**Conventions (every task):** run JS tests from `web-viewer/` with `npx vitest run`; NEVER run bare `tsc` (only `npm run typecheck`); VS suite is its OWN pytest invocation `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` from repo root; commit after each green task. **All durations are SECONDS** (owner ruling — see Schema 5 README).

---

## File map

| Path | Responsibility |
|---|---|
| `viewer-service/src/viewer_service/sessions.py` + `api/sessions.py` (modify) | mint + session-GET expose `agent_id`, `session_index` |
| `web-viewer/src/app/bootstrap.ts` (modify) | `MintOk` gains the two fields; new `completeSession()` |
| `web-viewer/src/app/trial.ts` (new) | `TrialClock` |
| `web-viewer/src/app/responses.ts` (new) | `buildRuntimeIndex`, `stimulusFor`, `buildItemRow`, `buildMessageRow`, `timelineIdFor` |
| `web-viewer/src/app/events.ts` (new) | event builders + `EventBatcher` |
| `web-viewer/src/app/transport.ts` (new) | `SubmissionQueue` |
| `web-viewer/src/app/steps.ts` (modify) | new `stepEntries(step)` walker (items+messages incl. matrix children, same keys as gating) |
| `web-viewer/src/app/session.ts` (modify) | `finishing` phase, `submitError`, new actions |
| `web-viewer/src/app/chrome/strings.ts` (modify) | `submitting`, `submit_failed_title`, `submit_failed_body` (en+pt) |
| `web-viewer/src/app/App.tsx` (modify) | `advance()` path, pipeline wiring, finishing screen, pagehide flush |
| `web-viewer/src/app/App.test.tsx` (modify) | integration tests; mint fixture gains the two fields |

Schema JSONs are loaded in tests via `readFileSync` (they live outside the web-viewer TS root): `web-viewer/src/app/X.test.ts` → `../../../schemas/...`.

---

### Task 1: VS additive — expose `agent_id` + `session_index`

**Files:** Modify `viewer-service/src/viewer_service/sessions.py` (the `new_session` return), `viewer-service/src/viewer_service/api/sessions.py` (the `GET /sessions/{session_id}` handler). Test: `viewer-service/tests/test_session_identity.py` (new).

- [ ] **Step 1: Read both files** plus `viewer-service/tests/conftest.py` and one existing sessions test (to copy the fixture pattern for minting a session against a registered viewer + deployment).
- [ ] **Step 2: Failing test** — adapt fixture names to what conftest provides; the assertions:

```python
def test_mint_returns_agent_identity(client_with_session_setup):
    # ... mint via POST /v1/sessions/new the way existing tests do ...
    body = resp.json()
    assert body["agent_id"].startswith("agent_")
    assert body["session_index"] == 1


def test_session_get_returns_agent_identity(client_with_session_setup):
    # mint, then GET /v1/sessions/{id} with the Bearer token
    body = resp.json()
    assert body["agent_id"].startswith("agent_")
    assert body["session_index"] == 1
```

- [ ] **Step 3: Run to verify fail.** `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_session_identity.py -q` → FAIL (KeyError).
- [ ] **Step 4: Implement.** In `sessions.py` `new_session`, the agent id is already computed (`agent_id = "agent_" + uuid...`; `session_index=1` is passed to `insert_session`) — extend the return dict: `{"session_id": ..., "session_token": ..., "agent_id": agent_id, "session_index": 1, "runtime": ..., "theme": ...}`. In `api/sessions.py`'s GET handler, add `"agent_id": session["agent_id"], "session_index": session["session_index"]` to the returned dict (the session row already stores both columns — verify the store's SELECT includes them; add to the column list if not).
- [ ] **Step 5: Full VS suite.** `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` → 120 passed.
- [ ] **Step 6: Commit.** `git add viewer-service && git commit -m "feat(viewer-service): expose agent_id + session_index on mint and session GET (WV-B additive)"`

---

### Task 2: bootstrap — identity fields + `completeSession`

**Files:** Modify `web-viewer/src/app/bootstrap.ts`, `web-viewer/src/app/bootstrap.test.ts`.

- [ ] **Step 1: Failing tests** (add to `bootstrap.test.ts`; also UPDATE the existing `ok` fixture and the mint happy-path assertion to include the new fields):

```ts
const ok = { session_id: 's1', session_token: 't1', agent_id: 'agent_ab12', session_index: 1, runtime: { metadata: {} }, theme: null }
// existing happy-path test now expects: { ok: true, ...ok }

test('completeSession posts with the bearer token and reports success', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"submitted"}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(true)
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs:9/v1/sessions/s1/complete')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer t1' })
})
test('completeSession returns false on http error and on network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(false)
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')))
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(false)
})
```

- [ ] **Step 2: Run to verify fail**, then implement in `bootstrap.ts`:

```ts
export type MintOk = {
  ok: true
  session_id: string
  session_token: string
  agent_id: string
  session_index: number
  runtime: Runtime
  theme: Theme
}
// in mintSession's success branch:
return { ok: true, session_id: body.session_id, session_token: body.session_token,
         agent_id: body.agent_id, session_index: body.session_index,
         runtime: body.runtime, theme: body.theme ?? null }

export async function completeSession(vsBaseUrl: string, sessionId: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${vsBaseUrl}/v1/sessions/${sessionId}/complete`, {
      method: 'POST', headers: { authorization: `Bearer ${token}` },
    })
    return r.ok
  } catch {
    return false
  }
}
```

- [ ] **Step 3:** `npx vitest run src/app/bootstrap.test.ts` → PASS. NOTE: `App.test.tsx`'s `mintOk` fixture also needs `agent_id: 'agent_ab12', session_index: 1` added NOW (App tests don't read them yet but will in Task 8 — add in this task to keep one fixture shape). Full suite + typecheck green.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): mint identity fields + completeSession client"`

---

### Task 3: `stepEntries` walker (steps.ts)

**Files:** Modify `web-viewer/src/app/steps.ts`, `web-viewer/src/app/steps.test.ts`.

- [ ] **Step 1: Failing tests** (append to `steps.test.ts`; reuse its existing `opt`/`item`/`message`/`section`/`runtime` fixtures):

```ts
import { stepEntries } from './steps'

test('stepEntries: items and messages with gating-identical keys; sections expanded one level', () => {
  const steps = flattenSteps(runtime())
  expect(stepEntries(steps[0]).map((e) => [e.key, e.kind])).toEqual([['msg_intro', 'message']])
  expect(stepEntries(steps[1]).map((e) => [e.key, e.kind])).toEqual([['it_1', 'item']])
  expect(stepEntries(steps[2]).map((e) => [e.key, e.kind, e.sectionKey, e.rowIndex])).toEqual([
    ['it_a', 'item', 'sec_m', 0],
    ['sec_m__r1', 'item', 'sec_m', 1],
  ])
})
test('stepEntries skips unrenderable items (deriveWidget null), matching gating', () => {
  const dateItem = { id: 'it_d', question: { prompt: { content: { en: { text: 'D' } } } }, option: { input_data_type: 'date', measurement_type: 'interval' } }
  const rt: Runtime = { provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en', pages: [{ id: 'p1', elements: [dateItem] }] }
  expect(stepEntries(flattenSteps(rt)[0])).toEqual([])
})
```

- [ ] **Step 2: Run to verify fail**, then implement in `steps.ts` (mirrors `requiredUnanswered`'s traversal exactly — same key derivation, same depth-0-only section recursion, same `deriveWidget` renderability filter; messages are included, sections themselves are not):

```ts
export type StepEntry = {
  key: string
  element: RuntimeElement
  kind: 'item' | 'message'
  sectionKey?: string
  rowIndex?: number
}

export function stepEntries(step: Step): StepEntry[] {
  const out: StepEntry[] = []
  for (const { key, element } of step.elements) {
    if (isSection(element)) {
      element.elements.forEach((c, j) => {
        const childKey = elementKey(c, sectionChildFallback(key, j))
        if (isItem(c) && deriveWidget(c.option) !== null) {
          out.push({ key: childKey, element: c, kind: 'item', sectionKey: key, rowIndex: j })
        } else if (isMessage(c)) {
          out.push({ key: childKey, element: c, kind: 'message', sectionKey: key, rowIndex: j })
        }
      })
    } else if (isItem(element)) {
      if (deriveWidget(element.option) !== null) out.push({ key, element, kind: 'item' })
    } else if (isMessage(element)) {
      out.push({ key, element, kind: 'message' })
    }
  }
  return out
}
```

(`isMessage` needs importing from `../renderer/guards` — it isn't imported in steps.ts yet.)

- [ ] **Step 3:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): stepEntries walker (submission traversal, gating-identical keys)"`

---

### Task 4: TrialClock (`trial.ts`)

**Files:** Create `web-viewer/src/app/trial.ts`, `web-viewer/src/app/trial.test.ts`.

- [ ] **Step 1: Failing tests:**

```ts
import { TrialClock } from './trial'

test('step timing: start on show, responseAt = last answer change, RT in seconds', () => {
  let t = 1_000_000
  const clock = new TrialClock(() => t)
  clock.stepShown(0)
  t += 3_215
  clock.answerChanged('it_1')
  t += 2_000
  const timing = clock.timingFor(0, 'it_1')
  expect(timing.responseTimeS).toBeCloseTo(3.215)
  expect(timing.trialStart).toBe(new Date(1_000_000).toISOString())
  expect(timing.responseAt).toBe(new Date(1_003_215).toISOString())
})
test('message timing: no answer event → responseAt = query time (the advance)', () => {
  let t = 50_000
  const clock = new TrialClock(() => t)
  clock.stepShown(2)
  t += 5_000
  const timing = clock.timingFor(2, 'msg_intro')
  expect(timing.responseTimeS).toBeCloseTo(5)
  expect(timing.responseAt).toBe(new Date(55_000).toISOString())
})
test('re-showing a step restarts its trial clock (new attempt timing)', () => {
  let t = 0
  const clock = new TrialClock(() => t)
  clock.stepShown(1); t += 1_000
  clock.stepShown(1); t += 500
  expect(clock.timingFor(1, 'k').responseTimeS).toBeCloseTo(0.5)
})
test('response ids are monotonic from 1', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.allocateResponseId()).toBe(1)
  expect(clock.allocateResponseId()).toBe(2)
})
test('attempt tracking: first submit, unchanged skip, changed → revision chain', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.attemptFor('it_1', '0')).toEqual({ kind: 'first' })
  clock.recordSubmitted('it_1', '0', 7)
  expect(clock.attemptFor('it_1', '0')).toEqual({ kind: 'unchanged' })
  expect(clock.attemptFor('it_1', '1')).toEqual({ kind: 'revision', revises: 7, revision: 2 })
  clock.recordSubmitted('it_1', '1', 9)
  expect(clock.attemptFor('it_1', '2')).toEqual({ kind: 'revision', revises: 9, revision: 3 })
})
test('message once-only tracking', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.messageSubmitted('m1')).toBe(false)
  clock.markMessageSubmitted('m1')
  expect(clock.messageSubmitted('m1')).toBe(true)
})
```

- [ ] **Step 2: Run to verify fail**, then implement:

```ts
export type TrialTiming = { trialStart: string; responseAt: string; responseTimeS: number }
export type Attempt = { kind: 'first' } | { kind: 'unchanged' } | { kind: 'revision'; revises: number; revision: number }

export class TrialClock {
  private starts = new Map<number, number>()
  private lastAnswer = new Map<string, number>()
  private submitted = new Map<string, { value: string; responseId: number; revision: number }>()
  private messages = new Set<string>()
  private nextId = 1

  constructor(private now: () => number = Date.now) {}

  stepShown(stepIndex: number): void {
    this.starts.set(stepIndex, this.now())
  }
  answerChanged(key: string): void {
    this.lastAnswer.set(key, this.now())
  }
  timingFor(stepIndex: number, key: string): TrialTiming {
    const start = this.starts.get(stepIndex) ?? this.now()
    const at = this.lastAnswer.get(key) ?? this.now()
    return {
      trialStart: new Date(start).toISOString(),
      responseAt: new Date(at).toISOString(),
      responseTimeS: Math.max(0, (at - start) / 1000),
    }
  }
  allocateResponseId(): number {
    return this.nextId++
  }
  attemptFor(key: string, serialisedValue: string): Attempt {
    const prev = this.submitted.get(key)
    if (!prev) return { kind: 'first' }
    if (prev.value === serialisedValue) return { kind: 'unchanged' }
    return { kind: 'revision', revises: prev.responseId, revision: prev.revision + 1 }
  }
  recordSubmitted(key: string, serialisedValue: string, responseId: number): void {
    const prev = this.submitted.get(key)
    this.submitted.set(key, { value: serialisedValue, responseId, revision: (prev?.revision ?? 0) + 1 })
  }
  messageSubmitted(key: string): boolean {
    return this.messages.has(key)
  }
  markMessageSubmitted(key: string): void {
    this.messages.add(key)
  }
}
```

Subtlety the message test pins: `timingFor` for a key with no recorded answer uses NOW as `responseAt` — for messages that call happens at the advance, which is exactly "time until Next" (owner F3). The re-show test pins attempt-timing restart on Back.

- [ ] **Step 3:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): TrialClock (per-step timing, response ids, attempt + message tracking)"`

---

### Task 5: Response-row builders (`responses.ts`)

**Files:** Create `web-viewer/src/app/responses.ts`, `web-viewer/src/app/responses.test.ts`.

- [ ] **Step 1: Failing tests** — every produced row is validated against the real Schema 5 (this is the load-bearing test of WV-B):

```ts
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { buildRuntimeIndex, buildItemRow, buildMessageRow, stimulusFor } from './responses'
import type { Runtime, ItemElement } from '../renderer/types'

const schema = JSON.parse(readFileSync(new URL('../../../schemas/response/schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ strict: false }); addFormats(ajv)
const validate = ajv.compile(schema)
const assertValid = (row: object) => {
  if (!validate(row)) throw new Error(JSON.stringify(validate.errors, null, 2))
}

const identity = { sessionId: '550e8400-e29b-41d4-a716-446655440000', agentId: 'agent_ab12', sessionIndex: 1, instrumentId: 'qst_mini', language: 'en' }
const opt = {
  id: 'opt_freq', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'Not at all' }, { index: 2, text: 'Several days' }] } },
}
const item: ItemElement = {
  id: 'it_1',
  question: {
    context: { id: 'ctx_a', content: { en: { text: 'Over the last 2 weeks' } } },
    instruction: { id: 'ins_b', content: { en: { text: 'Pick one' } } },
    prompt: { id: 'pr_c', content: { en: { text: 'Little interest' } } },
  },
  option: opt,
}
const runtime: Runtime = {
  provenance: {}, metadata: { id: 'qst_mini', title: 'T', language: 'en' }, locale: 'en',
  blocks: [{ id: 'blk_main', page_ids: ['p1'] }] as never,
  pages: [
    { id: 'p1', elements: [{ id: 'msg_intro', content: { en: { text: 'Welcome' } } }, item] },
    { id: 'p2', elements: [{ id: 'sec_m', shared_option: opt, elements: [{ id: 'it_a', question: { prompt: { content: { en: { text: 'Row A' } } } }, option: opt }] }] },
  ],
}
const timing = { trialStart: '2026-06-12T10:00:00.000Z', responseAt: '2026-06-12T10:00:03.215Z', responseTimeS: 3.215 }

test('stimulusFor: canonical ctx+ins+pr order, composite type, joined description', () => {
  expect(stimulusFor(item, 'it_1', 'en')).toEqual({
    stimulus_id: 'ctx_a+ins_b+pr_c',
    stimulus_type: 'composite',
    stimulus_description: 'Over the last 2 weeks Pick one Little interest',
  })
  const promptOnly = { ...item, question: { prompt: item.question.prompt } }
  expect(stimulusFor(promptOnly, 'k', 'en').stimulus_type).toBe('text')
  expect(stimulusFor(promptOnly, 'k', 'en').stimulus_id).toBe('pr_c')
  expect(stimulusFor({ id: 'msg_intro', content: { en: { text: 'Welcome' } } }, 'msg_intro', 'en')).toEqual({
    stimulus_id: 'msg_intro', stimulus_type: 'instruction', stimulus_description: 'Welcome',
  })
})
test('buildRuntimeIndex: page/trial positions; matrix rows share the section trial_index with row metadata', () => {
  const idx = buildRuntimeIndex(runtime)
  expect(idx.get('msg_intro')).toMatchObject({ pageIndex: 1, pageId: 'p1', trialIndex: '1', timelineId: 'blk_main' })
  expect(idx.get('it_1')).toMatchObject({ pageIndex: 1, trialIndex: '2' })
  expect(idx.get('it_a')).toMatchObject({ pageIndex: 2, trialIndex: '1', sectionId: 'sec_m', rowIndex: 0 })
})
test('single-choice item row is Schema-5 valid with the full field mapping', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 3, timing }, item, 0, 'en')
  assertValid(row)
  expect(row).toMatchObject({
    response_id: 3, agent_id: 'agent_ab12', session_index: 1, session_id: identity.sessionId,
    instrument_id: 'qst_mini', language: 'en', multitask_type: '', transformation_name: 'identity',
    activity_index: 1, instrument_repetition: 0, timeline_id: 'blk_main',
    block_index: 1, block_name: 'p1', block_type: 'test', trial_index: '2',
    trial_start_datetime: timing.trialStart,
    stimulus_id: 'ctx_a+ins_b+pr_c', stimulus_type: 'composite',
    option_id: 'opt_freq', option_data_type: 'choice', measurement_type: 'ordinal', option_count: 2,
    response_option_index: 1, response_numeric: 0, response_description: 'Not at all',
    response_datetime: timing.responseAt, response_time: 3.215,
  })
})
test('attempt fields ride the x_ escape hatch and stay schema-valid', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 9, timing, attempt: { revises: 3, revision: 2 } }, item, 1, 'en')
  assertValid(row)
  expect(row).toMatchObject({ x_response_revises: 3, x_response_revision: 2, response_numeric: 1 })
})
test('multi-select, number, text mappings are schema-valid', () => {
  const idx = buildRuntimeIndex(runtime)
  const multi = { ...item, option: { ...opt, measurement_type: 'nominal', selection: 'multiple' } }
  const m = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing }, multi, [0, 1], 'en')
  assertValid(m)
  expect(m).toMatchObject({ response_count: 2, response_description: 'Not at all; Several days' })
  expect(JSON.parse(m.additional_measures as string)).toEqual({ values: [0, 1], indices: [1, 2] })

  const num = { ...item, option: { id: 'opt_n', input_data_type: 'number', measurement_type: 'ratio' } }
  const n = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 2, timing }, num, 7.5, 'en')
  assertValid(n)
  expect(n).toMatchObject({ response_numeric: 7.5, option_data_type: 'number' })
  expect(n.response_option_index).toBeUndefined()

  const txt = { ...item, option: { id: 'opt_t', input_data_type: 'text', measurement_type: 'nominal' } }
  const t = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 4, timing }, txt, 'hello', 'en')
  assertValid(t)
  expect(t).toMatchObject({ response_description: 'hello' })
})
test('matrix row carries section metadata in additional_measures', () => {
  const idx = buildRuntimeIndex(runtime)
  const rowItem = (runtime.pages[1].elements[0] as { elements: ItemElement[] }).elements[0]
  const row = buildItemRow({ identity, index: idx.get('it_a')!, responseId: 5, timing }, rowItem, 1, 'en')
  assertValid(row)
  expect(JSON.parse(row.additional_measures as string)).toMatchObject({ section_id: 'sec_m', row_index: 0 })
})
test('message row: acknowledged trial with RT, no response_skipped (owner F3)', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildMessageRow({ identity, index: idx.get('msg_intro')!, responseId: 1, timing }, runtime.pages[0].elements[0], 'en', 'click')
  assertValid(row)
  expect(row).toMatchObject({
    block_type: 'instruction', stimulus_type: 'instruction', stimulus_id: 'msg_intro',
    response_description: 'acknowledged', input_action_type: 'click', response_time: 3.215,
  })
  expect(row.response_skipped).toBeUndefined()
})
test('x_summary_rt off: timing fields without response_time', () => {
  const idx = buildRuntimeIndex(runtime)
  const noRt = { ...timing, responseTimeS: null }
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing: noRt }, item, 0, 'en')
  assertValid(row)
  expect(row.response_time).toBeUndefined()
  expect(row.response_datetime).toBe(timing.responseAt)
})
```

- [ ] **Step 2: Run to verify fail**, then implement `responses.ts`:

```ts
import { deriveWidget } from '../renderer/derive'
import { isItem, isMessage, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import { mergeOptions } from '../renderer/merge'
import type { AnswerValue, ContentEntity, ItemElement, RuntimeElement, Runtime } from '../renderer/types'

export type SessionIdentity = {
  sessionId: string
  agentId: string
  sessionIndex: number
  instrumentId: string
  language: string
}
export type ElementIndex = {
  pageIndex: number
  pageId: string
  trialIndex: string
  timelineId?: string
  sectionId?: string
  rowIndex?: number
}
export type RowTiming = { trialStart: string; responseAt: string; responseTimeS: number | null }
export type RowContext = {
  identity: SessionIdentity
  index: ElementIndex
  responseId: number
  timing: RowTiming
  attempt?: { revises: number; revision: number }
}
export type Schema5Row = Record<string, unknown>

function timelineIdFor(runtime: Runtime, pageId: string): string | undefined {
  const blocks = (runtime.blocks ?? []) as { id?: string; page_ids?: string[] }[]
  return blocks.find((b) => b.page_ids?.includes(pageId))?.id
}

/** Map every submittable element key → its page/trial coordinates (same keys as steps.ts). */
export function buildRuntimeIndex(runtime: Runtime): Map<string, ElementIndex> {
  const map = new Map<string, ElementIndex>()
  runtime.pages.forEach((page, p) => {
    const timelineId = timelineIdFor(runtime, page.id)
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      const base: ElementIndex = { pageIndex: p + 1, pageId: page.id, trialIndex: String(i + 1), timelineId }
      if (isSection(el)) {
        el.elements.forEach((c, j) => {
          map.set(elementKey(c, sectionChildFallback(key, j)), { ...base, sectionId: key, rowIndex: j })
        })
      } else {
        map.set(key, base)
      }
    })
  })
  return map
}

const text = (e: ContentEntity | undefined, locale: string) => e?.content?.[locale]?.text

export function stimulusFor(el: RuntimeElement, fallbackKey: string, locale: string): {
  stimulus_id: string
  stimulus_type: string
  stimulus_description: string
} {
  if (isItem(el)) {
    const parts = [el.question.context, el.question.instruction, el.question.prompt].filter(Boolean) as ContentEntity[]
    const ids = parts.map((p) => p.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
    return {
      stimulus_id: ids.length > 0 ? ids.join('+') : fallbackKey,
      stimulus_type: el.question.context || el.question.instruction ? 'composite' : 'text',
      stimulus_description: parts.map((p) => text(p, locale)).filter(Boolean).join(' '),
    }
  }
  return {
    stimulus_id: elementKey(el, fallbackKey),
    stimulus_type: 'instruction',
    stimulus_description: (isMessage(el) ? text(el, locale) : undefined) ?? '',
  }
}

function baseRow(ctx: RowContext, blockType: string): Schema5Row {
  const { identity, index, responseId, timing } = ctx
  return {
    response_id: responseId,
    agent_id: identity.agentId,
    session_index: identity.sessionIndex,
    session_id: identity.sessionId,
    activity_index: 1,
    language: identity.language,
    instrument_id: identity.instrumentId,
    instrument_repetition: 0,
    ...(index.timelineId ? { timeline_id: index.timelineId } : {}),
    multitask_type: '',
    block_index: index.pageIndex,
    block_name: index.pageId,
    block_type: blockType,
    transformation_name: 'identity',
    trial_index: index.trialIndex,
    trial_start_datetime: timing.trialStart,
    response_datetime: timing.responseAt,
    ...(timing.responseTimeS !== null ? { response_time: timing.responseTimeS } : {}),
    ...(ctx.attempt ? { x_response_revises: ctx.attempt.revises, x_response_revision: ctx.attempt.revision } : {}),
  }
}

export function buildItemRow(ctx: RowContext, el: ItemElement, answer: AnswerValue, locale: string): Schema5Row {
  const row = { ...baseRow(ctx, 'test'), ...stimulusFor(el, ctxKeyFallback(ctx), locale) }
  const opt = el.option
  if (opt.id) row.option_id = opt.id
  row.option_data_type = opt.input_data_type
  row.measurement_type = opt.measurement_type
  const kind = deriveWidget(opt) ?? ''
  const extras: Record<string, unknown> = {}
  if (ctx.index.sectionId !== undefined) {
    extras.section_id = ctx.index.sectionId
    extras.row_index = ctx.index.rowIndex
  }
  if (kind.startsWith('choice.')) {
    row.option_count = opt.options?.length ?? 0
    const choices = safeMerge(opt, locale)
    if (kind.endsWith('.single')) {
      const c = choices.find((c) => c.value === answer)
      if (c) {
        row.response_option_index = c.index
        row.response_description = c.text
        if (typeof c.value === 'number') row.response_numeric = c.value
      }
    } else {
      const values = Array.isArray(answer) ? answer : []
      const picked = choices.filter((c) => values.includes(c.value))
      row.response_count = picked.length
      row.response_description = picked.map((c) => c.text).join('; ')
      extras.values = values
      extras.indices = picked.map((c) => c.index)
    }
  } else if (kind.startsWith('number.')) {
    if (typeof answer === 'number') row.response_numeric = answer
  } else if (typeof answer === 'string') {
    row.response_description = answer
  }
  if (Object.keys(extras).length > 0) row.additional_measures = JSON.stringify(extras)
  return row
}

export function buildMessageRow(ctx: RowContext, el: RuntimeElement, locale: string, action: 'click' | 'key'): Schema5Row {
  return {
    ...baseRow(ctx, 'instruction'),
    ...stimulusFor(el, ctxKeyFallback(ctx), locale),
    response_description: 'acknowledged',
    input_action_type: action,
  }
}

const ctxKeyFallback = (ctx: RowContext) => `${ctx.index.pageId}__el${Number(ctx.index.trialIndex) - 1}`

function safeMerge(opt: ItemElement['option'], locale: string) {
  try {
    return mergeOptions(opt, locale)
  } catch {
    return []
  }
}
```

Implementation notes: `ctxKeyFallback` regenerates the WV-A positional fallback so `stimulusFor` has a stable id even for fully-inline, id-less items; `safeMerge` keeps a missing-locale data defect from crashing row building (the response fields are simply absent — the row stays schema-valid, the event stream still shows the trial).

- [ ] **Step 3:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): Schema 5 row builders (Ajv-validated; seconds; acknowledged messages; attempt fields)"`

---

### Task 6: Event builders + EventBatcher (`events.ts`)

**Files:** Create `web-viewer/src/app/events.ts`, `web-viewer/src/app/events.test.ts`.

- [ ] **Step 1: Failing tests:**

```ts
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { EventBatcher, agentActor, engineActor, ev } from './events'

const schema = JSON.parse(readFileSync(new URL('../../../schemas/events/schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ strict: false }); addFormats(ajv)
const validate = ajv.compile(schema)

const ts = '2026-06-12T10:00:00.000Z'
const ctx = { sessionId: 's1', trialIndex: '2' }

test('builders produce schema-valid events with bdm context extensions', () => {
  const engine = engineActor('behaverse-web-viewer@v26.0611')
  const agent = agentActor('agent_ab12')
  const events = [
    ev.initialized(engine, 's1', ts),
    ev.started(engine, 's1', ts),
    ev.trialStarted(engine, 'trial_it_1', ctx, ts),
    ev.presented(engine, 'ctx_a+ins_b+pr_c', 'Little interest', ctx, ts),
    ev.selected(agent, 'opt_freq', 'Not at all', ctx, ts),
    ev.deselected(agent, 'opt_freq', 'Not at all', ctx, ts),
    ev.adjusted(agent, 'it_num', ctx, ts),
    ev.typed(agent, 'it_text', ctx, ts),
    ev.clicked(agent, 'next_button', ctx, ts),
    ev.navigated(agent, 'step_1', ctx, ts),
    ev.trialEnded(engine, 'trial_it_1', { 'bdm:response_id': 3, 'bdm:response_numeric': 0, 'bdm:response_time': 3.215 }, ctx, ts),
    ev.completed(engine, 's1', ts),
    ev.submitted(engine, 's1', ts),
  ]
  for (const e of events) {
    if (!validate(e)) throw new Error(JSON.stringify(validate.errors))
  }
  expect(events[2].context?.extensions?.['bdm:session_id']).toBe('s1')
  expect(events[2].context?.extensions?.['bdm:trial_index']).toBe('2')
  expect(events[10].result?.extensions?.['bdm:response_time']).toBeCloseTo(3.215)
})
test('batcher flushes at 20 events or 5 s, batch ids sequence, batch is schema-valid', () => {
  vi.useFakeTimers()
  const flushed: object[] = []
  const b = new EventBatcher('s1', (batch) => flushed.push(batch))
  const e = ev.started(engineActor('v@1'), 's1', ts)
  for (let i = 0; i < 20; i++) b.add(e)
  expect(flushed).toHaveLength(1)
  expect((flushed[0] as { batch_id: string }).batch_id).toBe('s1:1')
  if (!validate(flushed[0])) throw new Error(JSON.stringify(validate.errors))
  b.add(e)
  vi.advanceTimersByTime(5_000)
  expect(flushed).toHaveLength(2)
  expect((flushed[1] as { batch_id: string }).batch_id).toBe('s1:2')
  expect((flushed[1] as { events: unknown[] }).events).toHaveLength(1)
  b.flush()                       // empty buffer → no-op
  expect(flushed).toHaveLength(2)
  vi.useRealTimers()
})
```

- [ ] **Step 2: Run to verify fail**, then implement:

```ts
export type Actor = { objectType: string; id: string; name?: string }
export type BdmEvent = {
  timestamp: string
  actor: Actor
  verb: string
  object: { objectType: string; id: string; name?: string }
  result?: { extensions: Record<string, unknown> }
  context?: { extensions: Record<string, unknown> }
}
export type EventContext = { sessionId: string; trialIndex?: string }

export const engineActor = (id: string): Actor => ({ objectType: 'bdm:Engine', id })
export const agentActor = (id: string): Actor => ({ objectType: 'bdm:Agent', id })

const ctxExt = (c: EventContext) => ({
  context: { extensions: { 'bdm:session_id': c.sessionId, ...(c.trialIndex ? { 'bdm:trial_index': c.trialIndex } : {}) } },
})
const runtimeObj = (sessionId: string) => ({ objectType: 'bdm:RuntimeInstance', id: sessionId })

export const ev = {
  initialized: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:initialized', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  started: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:started', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  trialStarted: (a: Actor, trialId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:trial_started', object: { objectType: 'bdm:Trial', id: trialId }, ...ctxExt(c) }),
  presented: (a: Actor, stimulusId: string, name: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:presented', object: { objectType: 'bdm:Stimulus', id: stimulusId, ...(name ? { name } : {}) }, ...ctxExt(c) }),
  selected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:selected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...ctxExt(c) }),
  deselected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:deselected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...ctxExt(c) }),
  adjusted: (a: Actor, componentId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:adjusted', object: { objectType: 'bdm:UIComponent', id: componentId }, ...ctxExt(c) }),
  typed: (a: Actor, componentId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:typed', object: { objectType: 'bdm:UIComponent', id: componentId }, ...ctxExt(c) }),
  clicked: (a: Actor, buttonId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:clicked', object: { objectType: 'bdm:UIComponent', id: buttonId }, ...ctxExt(c) }),
  navigated: (a: Actor, screenId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:navigated', object: { objectType: 'bdm:Screen', id: screenId }, ...ctxExt(c) }),
  trialEnded: (a: Actor, trialId: string, resultExt: Record<string, unknown>, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:trial_ended', object: { objectType: 'bdm:Trial', id: trialId }, result: { extensions: resultExt }, ...ctxExt(c) }),
  completed: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:completed', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  submitted: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:submitted', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
}

export class EventBatcher {
  private buf: BdmEvent[] = []
  private seq = 1
  private timer: number | null = null

  constructor(
    private sessionId: string,
    private onFlush: (batch: { batch_id: string; events: BdmEvent[] }) => void,
    private flushIntervalMs = 5_000,
    private maxEvents = 20,
  ) {}

  add(e: BdmEvent): void {
    this.buf.push(e)
    if (this.buf.length >= this.maxEvents) {
      this.flush()
    } else if (this.timer === null) {
      this.timer = window.setTimeout(() => this.flush(), this.flushIntervalMs)
    }
  }
  flush(): void {
    if (this.timer !== null) { window.clearTimeout(this.timer); this.timer = null }
    if (this.buf.length === 0) return
    this.onFlush({ batch_id: `${this.sessionId}:${this.seq++}`, events: this.buf.splice(0) })
  }
}
```

(jsdom provides `window` in vitest; `vi.useFakeTimers()` patches it.)

- [ ] **Step 3:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): bdm event builders + 5s/20-event batcher (Ajv-validated)"`

---

### Task 7: SubmissionQueue (`transport.ts`)

**Files:** Create `web-viewer/src/app/transport.ts`, `web-viewer/src/app/transport.test.ts`.

- [ ] **Step 1: Failing tests:**

```ts
import { SubmissionQueue } from './transport'

const opts = (fetchImpl: typeof fetch) => ({ vsBaseUrl: 'http://vs:9', sessionId: 's1', token: 't1', fetchImpl })
const ok202 = () => new Response('{"enqueued":1}', { status: 202 })

test('serial delivery in order with bearer auth', async () => {
  const calls: [string, RequestInit][] = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => { calls.push([url, init]); return ok202() })
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  q.enqueue('events', { b: 2 })
  await q.idle()
  expect(calls.map(([u]) => u)).toEqual([
    'http://vs:9/v1/sessions/s1/responses',
    'http://vs:9/v1/sessions/s1/events',
  ])
  expect((calls[0][1].headers as Record<string, string>).authorization).toBe('Bearer t1')
  expect(JSON.parse(calls[0][1].body as string)).toEqual({ a: 1 })
})
test('5xx retries with exponential backoff until success', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    .mockResolvedValue(ok202())
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  await vi.advanceTimersByTimeAsync(1_000)   // first retry after 1 s
  await vi.advanceTimersByTimeAsync(2_000)   // second after 2 s
  await q.idle()
  expect(fetchMock).toHaveBeenCalledTimes(3)
  expect(q.pendingCount).toBe(0)
  vi.useRealTimers()
})
test('422 drops the payload and continues (logged, not retried)', async () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{"error":{"code":"invalid_submission"}}', { status: 422 }))
    .mockResolvedValue(ok202())
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { bad: true })
  q.enqueue('events', { good: true })
  await q.idle()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(err).toHaveBeenCalled()
  err.mockRestore()
})
test('flushKeepalive fires remaining items with keepalive and empties the queue', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }))  // stuck queue
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  await vi.advanceTimersByTimeAsync(0)
  fetchMock.mockClear()
  fetchMock.mockResolvedValue(ok202())
  q.flushKeepalive()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect((fetchMock.mock.calls[0][1] as RequestInit).keepalive).toBe(true)
  expect(q.pendingCount).toBe(0)
  vi.useRealTimers()
})
```

- [ ] **Step 2: Run to verify fail**, then implement:

```ts
export type SubmissionKind = 'responses' | 'events'
type QueueItem = { kind: SubmissionKind; payload: object }
type Options = {
  vsBaseUrl: string
  sessionId: string
  token: string
  fetchImpl?: typeof fetch
  maxBackoffMs?: number
}

export class SubmissionQueue {
  private q: QueueItem[] = []
  private inFlight = false
  private failures = 0
  private idleResolvers: (() => void)[] = []
  private fetchImpl: typeof fetch
  private maxBackoffMs: number

  constructor(private opts: Options) {
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis)
    this.maxBackoffMs = opts.maxBackoffMs ?? 30_000
  }

  get pendingCount(): number {
    return this.q.length + (this.inFlight ? 1 : 0)
  }
  enqueue(kind: SubmissionKind, payload: object): void {
    this.q.push({ kind, payload })
    void this.pump()
  }
  idle(): Promise<void> {
    if (this.pendingCount === 0) return Promise.resolve()
    return new Promise((resolve) => this.idleResolvers.push(resolve))
  }
  /** Best-effort final flush (pagehide): fire everything with keepalive, optimistically clear. */
  flushKeepalive(): void {
    for (const item of this.q.splice(0)) {
      void this.fetchImpl(this.url(item.kind), this.init(item.payload, true)).catch(() => {})
    }
    this.settleIdle()
  }

  private url(kind: SubmissionKind): string {
    return `${this.opts.vsBaseUrl}/v1/sessions/${this.opts.sessionId}/${kind}`
  }
  private init(payload: object, keepalive = false): RequestInit {
    return {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.opts.token}` },
      body: JSON.stringify(payload),
      ...(keepalive ? { keepalive: true } : {}),
    }
  }
  private settleIdle(): void {
    if (this.pendingCount > 0) return
    for (const r of this.idleResolvers.splice(0)) r()
  }
  private async pump(): Promise<void> {
    if (this.inFlight) return
    const item = this.q[0]
    if (!item) { this.settleIdle(); return }
    this.inFlight = true
    let outcome: 'done' | 'retry' = 'retry'
    try {
      const r = await this.fetchImpl(this.url(item.kind), this.init(item.payload))
      if (r.status === 422) {
        console.error('web-viewer: submission rejected by VS (dropped)', await r.text().catch(() => ''))
        outcome = 'done'
      } else if (r.ok) {
        outcome = 'done'
      }
    } catch {
      outcome = 'retry'
    }
    this.inFlight = false
    if (outcome === 'done') {
      this.q.shift()
      this.failures = 0
      this.settleIdle()
      void this.pump()
    } else {
      this.failures += 1
      const delay = Math.min(1_000 * 2 ** (this.failures - 1), this.maxBackoffMs)
      window.setTimeout(() => void this.pump(), delay)
    }
  }
}
```

- [ ] **Step 3:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): submission queue (serial, backoff, 422-drop, keepalive flush)"`

---

### Task 8: Reducer `finishing` phase + chrome strings

**Files:** Modify `web-viewer/src/app/session.ts`, `session.test.ts`, `chrome/strings.ts`.

- [ ] **Step 1: Failing tests** (append to `session.test.ts`):

```ts
test('next past the last step → finishing (not finished)', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' })
  s = reducer(s, { type: 'next' })
  expect(s.phase).toBe('finishing')
  expect(s.submitError).toBe(false)
})
test('submitted / submit_failed / submit_retry drive the finishing machine', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' }); s = reducer(s, { type: 'next' })
  expect(reducer(s, { type: 'submitted' }).phase).toBe('finished')
  const failed = reducer(s, { type: 'submit_failed' })
  expect(failed.phase).toBe('finishing')
  expect(failed.submitError).toBe(true)
  expect(reducer(failed, { type: 'submit_retry' }).submitError).toBe(false)
})
```

(The existing `next past the last step → finished` test changes its expectation to `'finishing'` — update it.)

- [ ] **Step 2: Implement** in `session.ts`: add `'finishing'` to the phase union; add `submitError: boolean` to `SessionState` (+ `submitError: false` in `initialState`); in the `next` case replace `phase: 'finished'` with `phase: 'finishing'`; add actions:

```ts
  | { type: 'submitted' }
  | { type: 'submit_failed' }
  | { type: 'submit_retry' }
// reducer cases:
case 'submitted':
  return { ...state, phase: 'finished' }
case 'submit_failed':
  return { ...state, submitError: true }
case 'submit_retry':
  return { ...state, submitError: false }
```

- [ ] **Step 3: strings.ts** — add to BOTH locales (en / pt):

```ts
    submitting: 'Submitting your responses…',
    submit_failed_title: 'Submission problem',
    submit_failed_body: 'Your answers are held in this tab but could not be submitted. Check your connection and try again.',
```
```ts
    submitting: 'A enviar as suas respostas…',
    submit_failed_title: 'Problema no envio',
    submit_failed_body: 'As suas respostas estão guardadas neste separador mas não foi possível enviá-las. Verifique a ligação e tente novamente.',
```

- [ ] **Step 4:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): finishing phase + submission strings"`

---

### Task 9: App wiring — the `advance()` path, pipeline, finishing screen

**Files:** Modify `web-viewer/src/app/App.tsx`, `web-viewer/src/app/App.test.tsx`.

This is the integration task. Read the current `App.tsx` fully first. The shape of the change:

- [ ] **Step 1: Failing integration tests** (append to `App.test.tsx`; remember `mintOk` now carries `agent_id`/`session_index` from Task 2):

```tsx
function postCalls(fetchMock: ReturnType<typeof vi.fn>, suffix: string) {
  return fetchMock.mock.calls.filter(([u]) => String(u).endsWith(suffix)).map(([, i]) => JSON.parse((i as RequestInit).body as string))
}
const respond202 = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })

test('walking the questionnaire submits message + item rows, events, then complete', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))           // past message
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))       // answer + auto-advance
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.type(screen.getByRole('spinbutton'), '8')
  await userEvent.click(screen.getByRole('button', { name: /next/i }))                  // finish
  expect(await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })).toBeInTheDocument()

  const responses = postCalls(fetchMock, '/sessions/s1/responses')
  expect(responses).toHaveLength(3)                                                      // message + 2 items
  expect(responses[0].responses[0]).toMatchObject({ stimulus_type: 'instruction', response_description: 'acknowledged', agent_id: 'agent_ab12' })
  expect(responses[1].responses[0]).toMatchObject({ response_description: 'Not at all', response_numeric: 0 })
  expect(responses[2].responses[0]).toMatchObject({ response_numeric: 8 })
  expect(responses[1].responses[0].response_time).toBeGreaterThan(0)
  expect(responses[1].responses[0].response_time).toBeLessThan(60)                       // seconds, not ms

  const events = postCalls(fetchMock, '/sessions/s1/events').flatMap((b) => b.events)
  const verbs = events.map((e: { verb: string }) => e.verb)
  expect(verbs).toContain('bdm:initialized')
  expect(verbs).toContain('bdm:trial_started')
  expect(verbs).toContain('bdm:selected')
  expect(verbs).toContain('bdm:trial_ended')
  expect(verbs).toContain('bdm:completed')
  expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/sessions/s1/complete'))).toBe(true)
})
test('back-and-change emits an attempt row with x_response_revises', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /back/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Several days/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  const rows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0])
  const itemRows = rows.filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(2)
  expect(itemRows[1]).toMatchObject({ x_response_revision: 2, x_response_revises: itemRows[0].response_id, response_description: 'Several days' })
})
test('going back without changing the answer emits nothing new', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /back/i }))
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  const itemRows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0]).filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(1)
})
test('complete failure shows retry; retry completes', async () => {
  setUrl('?deployment=dpl_1')
  let failComplete = true
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    if (String(url).endsWith('/complete')) return failComplete ? new Response('{}', { status: 500 }) : new Response('{}', { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Submission problem/i }, { timeout: 3000 })).toBeInTheDocument()
  failComplete = false
  await userEvent.click(screen.getByRole('button', { name: /try again/i }))
  expect(await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })).toBeInTheDocument()
})
test('x_summary_rt:false strips response_time from rows', async () => {
  const noRt = { ...mini, style: { x_summary_rt: false } }
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify({ ...mintOk, runtime: noRt }), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  const rows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0])
  expect(rows[0].response_time).toBeUndefined()
  expect(rows[0].response_datetime).toBeDefined()
})
```

- [ ] **Step 2: Implement in `App.tsx`.** The complete set of changes (read current code; preserve everything not mentioned — boot, theme, focus management, StrictMode guard, error screens):

```tsx
// new imports
import { completeSession } from './bootstrap'
import { buildItemRow, buildMessageRow, buildRuntimeIndex, type ElementIndex, type SessionIdentity } from './responses'
import { EventBatcher, agentActor, engineActor, ev } from './events'
import { SubmissionQueue } from './transport'
import { TrialClock } from './trial'
import { stepEntries } from './steps'
import { VIEWER_ID, VIEWER_VERSION } from './bootstrap'
import { isItem } from '../renderer/guards'
import { mergeOptions } from '../renderer/merge'

// inside App(): a pipeline ref assembled on boot_success
type Pipeline = {
  identity: SessionIdentity
  index: Map<string, ElementIndex>
  clock: TrialClock
  queue: SubmissionQueue
  batcher: EventBatcher
  engine: ReturnType<typeof engineActor>
  agent: ReturnType<typeof agentActor>
  summaryRt: boolean
}
const pipeline = useRef<Pipeline | null>(null)
const nowIso = () => new Date().toISOString()
```

In the boot effect's success branch (both mint and fixture paths — fixture uses `agent_id: 'agent_fixture'`, `session_index: 1` and a queue whose `fetchImpl` is a no-op stub returning 202 so fixture mode emits nothing over the network; simplest: `fetchImpl: async () => new Response('{}', { status: 202 })`):

```tsx
const identity = { sessionId: res.session_id, agentId: res.agent_id, sessionIndex: res.session_index,
                   instrumentId: res.runtime.metadata.id, language: res.runtime.locale ?? 'en' }
const queue = new SubmissionQueue({ vsBaseUrl: params.vsBaseUrl, sessionId: res.session_id, token: res.session_token })
const batcher = new EventBatcher(res.session_id, (batch) => queue.enqueue('events', batch))
pipeline.current = {
  identity, index: buildRuntimeIndex(res.runtime), clock: new TrialClock(), queue, batcher,
  engine: engineActor(`${VIEWER_ID}@${VIEWER_VERSION}`), agent: agentActor(res.agent_id),
  summaryRt: (res.runtime.style as Record<string, unknown> | undefined)?.x_summary_rt !== false,
}
pipeline.current.batcher.add(ev.initialized(pipeline.current.engine, res.session_id, nowIso()))
pipeline.current.batcher.add(ev.started(pipeline.current.engine, res.session_id, nowIso()))
```

Step-shown effect (extends the existing focus-management effect or a sibling effect on `[state.phase, state.stepIndex]`):

```tsx
useEffect(() => {
  const p = pipeline.current
  if (state.phase !== 'ready' || !p) return
  p.clock.stepShown(state.stepIndex)
  const step = state.steps[state.stepIndex]
  for (const entry of stepEntries(step)) {
    const c = { sessionId: p.identity.sessionId, trialIndex: p.index.get(entry.key)?.trialIndex }
    p.batcher.add(ev.trialStarted(p.engine, `trial_${entry.key}`, c, nowIso()))
    const stim = stimulusFor(entry.element, entry.key, locale)
    p.batcher.add(ev.presented(p.engine, stim.stimulus_id, stim.stimulus_description.slice(0, 120), c, nowIso()))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [state.phase, state.stepIndex])
```

(`stimulusFor` import from './responses'.)

`handleAnswer` additions (before the existing auto-advance logic):

```tsx
const p = pipeline.current
if (p) {
  p.clock.answerChanged(key)
  const entry = stepEntries(state.steps[state.stepIndex] ?? { pageId: '', elements: [] }).find((e) => e.key === key)
  if (entry && isItem(entry.element)) {
    const c = { sessionId: p.identity.sessionId, trialIndex: p.index.get(key)?.trialIndex }
    const opt = entry.element.option
    const kind = opt.input_data_type
    if (kind === 'choice') {
      const choices = (() => { try { return mergeOptions(opt, locale) } catch { return [] } })()
      const prev = state.answers[key]
      if (Array.isArray(value)) {
        const prevArr = Array.isArray(prev) ? prev : []
        const added = value.find((v) => !prevArr.includes(v))
        const removed = prevArr.find((v) => !value.includes(v))
        const cFor = (v: unknown) => choices.find((ch) => ch.value === v)
        if (added !== undefined) p.batcher.add(ev.selected(p.agent, opt.id ?? key, cFor(added)?.text ?? String(added), c, nowIso()))
        if (removed !== undefined) p.batcher.add(ev.deselected(p.agent, opt.id ?? key, cFor(removed)?.text ?? String(removed), c, nowIso()))
      } else {
        p.batcher.add(ev.selected(p.agent, opt.id ?? key, choices.find((ch) => ch.value === value)?.text ?? String(value), c, nowIso()))
      }
    }
    // number/text get one adjusted/typed event at advance-commit (see advance()), not per keystroke
  }
}
```

The **`advance()`** function replaces the three direct `dispatch({type:'next'})` call sites (NavButtons onNext → `advance('click')`, Enter handler → `advance('key')`, auto-advance timer → `advance('auto')`):

```tsx
function advance(source: 'click' | 'key' | 'auto') {
  clearAuto()
  const p = pipeline.current
  const step = state.steps[state.stepIndex]
  if (!p || !step) { dispatch({ type: 'next' }); return }
  if (requiredUnanswered(step, state.answers).length > 0) { dispatch({ type: 'next' }); return }  // reducer sets errors
  if (source !== 'auto') {
    p.batcher.add(ev.clicked(p.agent, 'next_button', { sessionId: p.identity.sessionId }, nowIso()))
  }
  for (const entry of stepEntries(step)) {
    const index = p.index.get(entry.key)
    if (!index) continue
    const timing0 = p.clock.timingFor(state.stepIndex, entry.key)
    const timing = { ...timing0, responseTimeS: p.summaryRt ? timing0.responseTimeS : null }
    const c = { sessionId: p.identity.sessionId, trialIndex: index.trialIndex }
    if (entry.kind === 'message') {
      if (p.clock.messageSubmitted(entry.key)) continue
      const responseId = p.clock.allocateResponseId()
      const row = buildMessageRow({ identity: p.identity, index, responseId, timing }, entry.element, locale, source === 'key' ? 'key' : 'click')
      p.queue.enqueue('responses', { session_id: p.identity.sessionId, responses: [row] })
      p.clock.markMessageSubmitted(entry.key)
      p.batcher.add(ev.trialEnded(p.engine, `trial_${entry.key}`, { 'bdm:response_id': responseId, 'bdm:response_description': 'acknowledged', ...(timing.responseTimeS !== null ? { 'bdm:response_time': timing.responseTimeS } : {}) }, c, nowIso()))
      continue
    }
    const el = entry.element
    if (!isItem(el)) continue
    const answer = state.answers[entry.key] ?? null
    const serialised = JSON.stringify(answer)
    const attempt = p.clock.attemptFor(entry.key, serialised)
    if (attempt.kind === 'unchanged') continue
    if (answer === null && attempt.kind === 'first') continue        // optional question never touched → no row in WV-B
    const responseId = p.clock.allocateResponseId()
    const row = buildItemRow(
      { identity: p.identity, index, responseId, timing, ...(attempt.kind === 'revision' ? { attempt: { revises: attempt.revises, revision: attempt.revision } } : {}) },
      el, answer, locale,
    )
    if (el.option.input_data_type === 'number') p.batcher.add(ev.adjusted(p.agent, entry.key, c, nowIso()))
    if (el.option.input_data_type === 'text') p.batcher.add(ev.typed(p.agent, entry.key, c, nowIso()))
    p.queue.enqueue('responses', { session_id: p.identity.sessionId, responses: [row] })
    p.clock.recordSubmitted(entry.key, serialised, responseId)
    p.batcher.add(ev.trialEnded(p.engine, `trial_${entry.key}`, {
      'bdm:response_id': responseId,
      ...(row.response_description !== undefined ? { 'bdm:response_description': row.response_description } : {}),
      ...(row.response_numeric !== undefined ? { 'bdm:response_numeric': row.response_numeric } : {}),
      ...(row.response_option_index !== undefined ? { 'bdm:response_option_index': row.response_option_index } : {}),
      ...(timing.responseTimeS !== null ? { 'bdm:response_time': timing.responseTimeS } : {}),
    }, c, nowIso()))
  }
  dispatch({ type: 'next' })
}
```

Back handler addition (in the existing onBack): `pipeline.current?.batcher.add(ev.clicked(pipeline.current.agent, 'back_button', { sessionId: pipeline.current.identity.sessionId }, nowIso()))` and `...add(ev.navigated(...agent, `step_${state.stepIndex - 1}`, ...))`.

**Finishing effect** (new):

```tsx
useEffect(() => {
  const p = pipeline.current
  if (state.phase !== 'finishing' || !p || state.submitError) return
  let cancelled = false
  async function finish() {
    p.batcher.add(ev.completed(p.engine, p.identity.sessionId, nowIso()))
    p.batcher.flush()
    const timeout = new Promise<'timeout'>((r) => window.setTimeout(() => r('timeout'), 10_000))
    const outcome = await Promise.race([p.queue.idle().then(() => 'idle' as const), timeout])
    if (cancelled) return
    if (outcome === 'timeout') { dispatch({ type: 'submit_failed' }); return }
    const ok = await completeSession(params.vsBaseUrl, p.identity.sessionId, sessionTokenRef.current ?? '')
    if (cancelled) return
    if (!ok) { dispatch({ type: 'submit_failed' }); return }
    p.batcher.add(ev.submitted(p.engine, p.identity.sessionId, nowIso()))
    p.batcher.flush()
    dispatch({ type: 'submitted' })
  }
  void finish()
  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [state.phase, state.submitError])
```

`sessionTokenRef`: the token is in `state.session.token` — use that directly instead of a ref (`state.session?.token ?? ''`); adjust the effect deps accordingly (it's stable once ready).

**Finishing screen** (new render branch BEFORE the `finished` branch):

```tsx
if (state.phase === 'finishing') {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
      <div className="max-w-md space-y-4">
        {state.submitError ? (
          <>
            <h1 className="text-2xl font-semibold">{t(locale, 'submit_failed_title')}</h1>
            <p className="text-slate-600">{t(locale, 'submit_failed_body')}</p>
            <button onClick={() => dispatch({ type: 'submit_retry' })} className="rounded-lg bg-primary px-5 py-2.5 text-white font-medium">
              {t(locale, 'retry')}
            </button>
          </>
        ) : (
          <p aria-live="polite" className="text-lg text-slate-600">{t(locale, 'submitting')}</p>
        )}
      </div>
    </main>
  )
}
```

**pagehide flush** (new effect):

```tsx
useEffect(() => {
  function onHide() {
    const p = pipeline.current
    if (!p) return
    p.batcher.flush()
    p.queue.flushKeepalive()
  }
  window.addEventListener('pagehide', onHide)
  return () => window.removeEventListener('pagehide', onHide)
}, [])
```

(`requiredUnanswered` import from './steps' is already there? — it is NOT currently imported in App.tsx; add it.)

- [ ] **Step 3: Run the new tests**, fix what reality disagrees with (likely suspects: the auto-advance timer must call `advance('auto')` — update the `handleAnswer` timer callback; StrictMode tests still pass because pipeline.current assignment is idempotent; the fixture-mode queue stub). Then FULL suite + typecheck + build green (expect ~94 tests).
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): submission pipeline wired — rows+events on advance, finishing flow, pagehide flush"`

---

### Task 10: README/FOLLOWUPS + full verification + live gate smoke

**Files:** Modify `web-viewer/README.md` (submission section), `web-viewer/FOLLOWUPS.md` (tick/adjust), no code.

- [ ] **Step 1: README** — add a "Data emitted (WV-B)" section: one Schema 5 row per attempt per item (all attempts kept — `x_response_revises`/`x_response_revision`; analysis dedupes by latest, never storage); messages as `acknowledged` instruction trials; ALL durations in seconds; event grammar summary + batching (5 s/20); the finishing flow; `style.x_summary_rt: false`.
- [ ] **Step 2: FOLLOWUPS** — mark the WV-A "no submission yet" caveat resolved; keep the in-memory-queue caveat (refresh loses unsent data until WV-E); note `flushKeepalive` is optimistic (pagehide duplicates impossible only because the page is going away — revisit with WV-E durability).
- [ ] **Step 3: Full verification:**

```bash
( cd web-viewer && npm test && npm run typecheck && npm run build )
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q     # 120
```

- [ ] **Step 4: Live gate smoke** (the Phase-2 gate, exercised literally; same stack recipe as the WV-A smoke — Postgres :55433, library migrate/import/ingest, library :8000, VS :8001 with `VS_CORS_ORIGINS=http://localhost:5173`, register `web-viewer/manifest.json`, create an `anonymous_link` deployment for a small questionnaire). Then `npm run dev` and drive a real browser through completion with the playwright-chromium script pattern (chromium is installed; run the script from `library-web/` where playwright resolves):

```js
// complete the questionnaire: click through every step answering the first choice,
// typing 1 into number inputs, 'x' into text inputs, until the thank-you heading appears
```

Then verify server-side:

```bash
curl -s "http://localhost:8001/v1/deployments/$DPL/export.csv" | head -5   # header + the rows
curl -s "http://localhost:8001/v1/deployments/$DPL/export.csv" | wc -l     # > 1
# session reached submitted:
curl -s http://localhost:8001/v1/sessions/$SID -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Success = rows present in the CSV with `response_time` in seconds and the session `status: "submitted"`. Record the outcome honestly; clean up (kill servers, `docker rm -f`, temp dirs).

- [ ] **Step 5: Commit.** `git add web-viewer/README.md web-viewer/FOLLOWUPS.md && git commit -m "docs(web-viewer): WV-B data-emission docs; gate smoke recorded"`

---

### Task 11: Merge

- [ ] **Step 1:** Re-run the Task 10 verification block; all green.
- [ ] **Step 2:** Use superpowers:finishing-a-development-branch — merge `wv-b-web-viewer` to `master` locally with `--no-ff` (`Merge wv-b-web-viewer: Web Viewer WV-B (response capture + submission)`), push, delete the branch. (No PRs — owner preference.)

---

## Self-review notes (done at planning time)

- **Spec coverage:** §1.1 trial bookkeeping → T4; row builder → T5; events+batcher → T6; transport → T7; completion flow → T8+T9; VS additive → T1; summary RT → T4/T5/T9 (`x_summary_rt`); live smoke w/ export.csv → T10. §3.2 matrix rows → T3 (walker) + T5 (additional_measures). §3.3 attempts → T4 (attemptFor) + T9 (advance loop) + tests. §4 grammar → T6 builders + T9 emission points. Owner rulings F1 (seconds: T4 `/1000`, T5 assertions, T10 smoke check), F2 (x_response_* fields: T5), F3 (acknowledged messages: T5/T9).
- **Type consistency:** `RowTiming.responseTimeS: number | null` (T5) vs `TrialClock.timingFor → responseTimeS: number` (T4) — App maps null at the summaryRt gate (T9 `{...timing0, responseTimeS: p.summaryRt ? ... : null}`); `StepEntry`/`ElementIndex`/`SessionIdentity` names match across T3/T5/T9; queue API (`enqueue/idle/pendingCount/flushKeepalive`) matches T7/T9.
- **Known judgment calls:** untouched optional questions emit NO row in WV-B (`response_skipped` rows for presented-but-unanswered need a "was it presented" definition that arrives with WV-D validation; noted in README); fixture mode stubs the queue's fetch (no network, keeps dev mode silent); `advance()` duplicates the reducer's gating check by calling the same pure function with the same inputs — intentional, keeps the reducer pure.
