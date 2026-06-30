# Web viewer live mouse capture (SP2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a real `?deployment=` run whose deployment has `channels.mouse` enabled, the player samples the participant's mouse as Schema-4b `{t,x,y,button_state}` records, uploads them once at finish to the SP3 `/recordings` endpoint, and brackets the capture with `bdm:recording_started`/`bdm:recording_ended` events.

**Architecture:** A new `MouseCapture` (throttled DOM listeners → samples); the submission queue gains a `'recordings'` kind so it POSTs to `/v1/sessions/{id}/recordings` with existing retry/keepalive; `events.ts` gains recording-lifecycle builders; `App.tsx`/`bootstrap.ts` start capture when `mint.channels.mouse` is on and flush it at finish.

**Tech Stack:** Vite + React + TypeScript, Vitest + jsdom (the player's existing test stack). Component `web-viewer/`.

## Global Constraints

- All changes under `web-viewer/`. Do NOT modify viewer-service/, library/, questionnaire-harvester/, or other components.
- No schema change: Schema 4a already has `bdm:recording_started`/`bdm:recording_ended` + `bdm:Recording` + extensions `bdm:recording_modality`/`bdm:sample_rate`/`bdm:recording_scope`/`bdm:recording_url`.
- Sample shape is exactly Schema-4b: `{ t: number≥0 (seconds from capture start), x: integer, y: integer (clientX/Y), button_state: 'up'|'left_down'|'right_down'|'middle_down' }`.
- Sample rate configurable, DEFAULT 6 Hz (a mousemove sampled at most every 1000/6 ms); every mousedown/mouseup is captured immediately regardless of throttle. Source: `?mouse_hz=<n>` URL param → fallback 6.
- Capture runs ONLY on a real `?deployment=` mint with `channels.mouse === true` and NOT ephemeral; never on fixture/preview.
- Upload once at finish via `queue.enqueue('recordings', {channel:'mouse', samples})`; `recording_ended.recording_url = ${vsBaseUrl}/v1/deployments/${deploymentId}/recordings`.
- Tests: `cd web-viewer && npm test` (Vitest). Build check: `npm run build`. Renderer-lib build unaffected.
- Branch: `work/web-viewer-mouse-capture`. Finish by merging to master + push (no PRs); `git fetch` + ff/rebase before push (shared checkout). Stage explicit paths only.

---

### Task 1: `MouseCapture` (`src/app/mouseCapture.ts`)

**Files:**
- Create: `web-viewer/src/app/mouseCapture.ts`
- Test: `web-viewer/src/app/mouseCapture.test.ts`

**Interfaces:**
- Produces:
  - `type ButtonState = 'up'|'left_down'|'right_down'|'middle_down'`
  - `type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }`
  - `class MouseCapture { constructor(opts?: { sampleRateHz?: number; maxSamples?: number; now?: () => number; target?: EventTarget }); start(): void; stop(): MouseSample[]; get sampleRateHz(): number }`

- [ ] **Step 1: Write the failing test** — `src/app/mouseCapture.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { MouseCapture } from './mouseCapture'

// a controllable clock (ms)
function clock(start = 0) { let t = start; return { now: () => t, advance: (ms: number) => { t += ms } } }
const move = (x: number, y: number) => new MouseEvent('mousemove', { clientX: x, clientY: y })
const down = (x: number, y: number, button = 0) => new MouseEvent('mousedown', { clientX: x, clientY: y, button })
const up = (x: number, y: number, button = 0) => new MouseEvent('mouseup', { clientX: x, clientY: y, button })

describe('MouseCapture', () => {
  it('throttles mousemove to ~the sample rate', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 6, now: c.now, target }) // min interval ~167ms
    cap.start()
    target.dispatchEvent(move(10, 10))        // t=0 -> sampled (first)
    c.advance(50); target.dispatchEvent(move(11, 11))  // +50ms -> throttled out
    c.advance(50); target.dispatchEvent(move(12, 12))  // +100ms -> throttled out
    c.advance(100); target.dispatchEvent(move(13, 13)) // +200ms total since last -> sampled
    const s = cap.stop()
    expect(s.map((r) => [r.x, r.y])).toEqual([[10, 10], [13, 13]])
    expect(s[0]!.t).toBe(0)
    expect(s[1]!.t).toBeCloseTo(0.2, 5)
  })

  it('captures button transitions immediately and flips button_state', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 6, now: c.now, target })
    cap.start()
    c.advance(10); target.dispatchEvent(down(5, 5))   // immediate, left_down
    c.advance(10); target.dispatchEvent(up(5, 5))     // immediate, up
    const s = cap.stop()
    expect(s.map((r) => r.button_state)).toEqual(['left_down', 'up'])
    expect(s.every((r) => Number.isInteger(r.x) && Number.isInteger(r.y))).toBe(true)
  })

  it('rounds coords and matches the Schema-4b shape', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ now: c.now, target })   // default 6 Hz
    cap.start()
    target.dispatchEvent(move(1.6, 2.4))
    const s = cap.stop()
    expect(Object.keys(s[0]!).sort()).toEqual(['button_state', 't', 'x', 'y'])
    expect(s[0]).toEqual({ t: 0, x: 2, y: 2, button_state: 'up' })
  })

  it('caps at maxSamples', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 1000, maxSamples: 3, now: c.now, target })
    cap.start()
    for (let i = 0; i < 10; i++) { c.advance(5); target.dispatchEvent(move(i, i)) }
    expect(cap.stop()).toHaveLength(3)
  })

  it('stop() detaches and is idempotent', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ now: c.now, target })
    cap.start()
    target.dispatchEvent(move(1, 1))
    const first = cap.stop()
    target.dispatchEvent(move(2, 2))           // after stop -> ignored (detached)
    expect(cap.stop()).toEqual(first)          // idempotent, no new samples
  })

  it('exposes the configured sample rate', () => {
    expect(new MouseCapture({ sampleRateHz: 12 }).sampleRateHz).toBe(12)
    expect(new MouseCapture().sampleRateHz).toBe(6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/app/mouseCapture.test.ts`
Expected: FAIL — cannot find `./mouseCapture`.

- [ ] **Step 3: Write `src/app/mouseCapture.ts`**

```ts
export type ButtonState = 'up' | 'left_down' | 'right_down' | 'middle_down'
export type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }

const DOWN_BY_BUTTON: Record<number, ButtonState> = { 0: 'left_down', 1: 'middle_down', 2: 'right_down' }

/** Captures the participant's mouse as Schema-4b samples. mousemove is throttled to `sampleRateHz`;
 *  mousedown/up are always captured. `now()`/`target` are injected for tests. */
export class MouseCapture {
  private readonly hz: number
  private readonly maxSamples: number
  private readonly now: () => number
  private readonly target: EventTarget
  private rows: MouseSample[] = []
  private t0 = 0
  private lastAt = -Infinity
  private button: ButtonState = 'up'
  private active = false

  constructor(opts: { sampleRateHz?: number; maxSamples?: number; now?: () => number; target?: EventTarget } = {}) {
    this.hz = opts.sampleRateHz ?? 6
    this.maxSamples = opts.maxSamples ?? 50_000
    this.now = opts.now ?? (() => performance.now())
    this.target = opts.target ?? window
  }

  get sampleRateHz(): number { return this.hz }

  private onMove = (e: Event) => {
    const me = e as MouseEvent
    if (this.now() - this.lastAt < 1000 / this.hz) return
    this.push(me.clientX, me.clientY)
  }
  private onDown = (e: Event) => {
    const me = e as MouseEvent
    this.button = DOWN_BY_BUTTON[me.button] ?? 'left_down'
    this.push(me.clientX, me.clientY)
  }
  private onUp = (e: Event) => {
    const me = e as MouseEvent
    this.button = 'up'
    this.push(me.clientX, me.clientY)
  }

  private push(x: number, y: number): void {
    if (!this.active || this.rows.length >= this.maxSamples) return
    const t = this.now()
    this.lastAt = t
    this.rows.push({ t: (t - this.t0) / 1000, x: Math.round(x), y: Math.round(y), button_state: this.button })
  }

  start(): void {
    if (this.active) return
    this.active = true
    this.t0 = this.now()
    this.lastAt = -Infinity
    this.target.addEventListener('mousemove', this.onMove, true)
    this.target.addEventListener('mousedown', this.onDown, true)
    this.target.addEventListener('mouseup', this.onUp, true)
  }

  stop(): MouseSample[] {
    if (this.active) {
      this.active = false
      this.target.removeEventListener('mousemove', this.onMove, true)
      this.target.removeEventListener('mousedown', this.onDown, true)
      this.target.removeEventListener('mouseup', this.onUp, true)
    }
    return this.rows
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/app/mouseCapture.test.ts`
Expected: PASS (6 cases).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/mouseCapture.ts web-viewer/src/app/mouseCapture.test.ts
git commit -m "feat(web-viewer): MouseCapture (throttled Schema-4b mouse sampler)"
```

---

### Task 2: `recordings` submission kind (`src/app/transport.ts`)

**Files:**
- Modify: `web-viewer/src/app/transport.ts`
- Test: `web-viewer/src/app/transport.test.ts` (add a case)

**Interfaces:**
- Produces: `SubmissionKind` now `'responses' | 'events' | 'recordings'`. `enqueue('recordings', payload)` POSTs to `${vs}/v1/sessions/${id}/recordings`.

- [ ] **Step 1: Add the failing test** — append to `src/app/transport.test.ts`

```ts
it('POSTs a recordings submission to the /recordings endpoint', async () => {
  const calls: string[] = []
  const fetchImpl = (async (url: string) => { calls.push(String(url)); return new Response('{}', { status: 202 }) }) as unknown as typeof fetch
  const q = new SubmissionQueue({ vsBaseUrl: 'http://vs', sessionId: 'sid', token: 'tok', fetchImpl })
  q.enqueue('recordings', { channel: 'mouse', samples: [] })
  await q.idle()
  expect(calls).toEqual(['http://vs/v1/sessions/sid/recordings'])
})
```

(If `SubmissionQueue` is not already imported at the top of `transport.test.ts`, it is — the file tests the queue; reuse the existing import.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/app/transport.test.ts`
Expected: FAIL — TS error: `'recordings'` not assignable to `SubmissionKind`.

- [ ] **Step 3: Edit `src/app/transport.ts`**

Change line 1:
```ts
export type SubmissionKind = 'responses' | 'events' | 'recordings'
```
(No other change — `url(kind)` already builds `${vsBaseUrl}/v1/sessions/${sessionId}/${kind}`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/app/transport.test.ts`
Expected: PASS (existing + the new case).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/transport.ts web-viewer/src/app/transport.test.ts
git commit -m "feat(web-viewer): add 'recordings' submission kind"
```

---

### Task 3: recording-lifecycle event builders (`src/app/events.ts`)

**Files:**
- Modify: `web-viewer/src/app/events.ts`
- Test: `web-viewer/src/app/events.test.ts` (add cases)

**Interfaces:**
- Consumes: existing `Actor`, `BdmEvent`, `ctxExt`, `engineActor`.
- Produces, on the exported `ev` object:
  - `recordingStarted(a: Actor, recordingId: string, sid: string, ext: { modality: string; sampleRate: number; scope: string }, ts: string): BdmEvent`
  - `recordingEnded(a: Actor, recordingId: string, sid: string, ext: { url: string; sampleCount: number }, ts: string): BdmEvent`

- [ ] **Step 1: Add the failing tests** — append to `src/app/events.test.ts`

```ts
import { ev, engineActor } from './events'   // (reuse the file's existing imports if present)

it('recordingStarted carries modality/sample_rate/scope on a bdm:Recording', () => {
  const e = ev.recordingStarted(engineActor('eng'), 'recording_mouse_s1', 's1',
    { modality: 'mouse', sampleRate: 6, scope: 'runtime' }, '2026-06-30T00:00:00.000Z')
  expect(e.verb).toBe('bdm:recording_started')
  expect(e.object).toEqual({ objectType: 'bdm:Recording', id: 'recording_mouse_s1' })
  expect(e.result!.extensions).toEqual({
    'bdm:recording_modality': 'mouse', 'bdm:sample_rate': 6, 'bdm:recording_scope': 'runtime' })
  expect(e.context!.extensions['bdm:session_id']).toBe('s1')
})

it('recordingEnded carries recording_url + sample_count', () => {
  const e = ev.recordingEnded(engineActor('eng'), 'recording_mouse_s1', 's1',
    { url: 'http://vs/v1/deployments/dep/recordings', sampleCount: 42 }, '2026-06-30T00:00:01.000Z')
  expect(e.verb).toBe('bdm:recording_ended')
  expect(e.result!.extensions).toEqual({
    'bdm:recording_url': 'http://vs/v1/deployments/dep/recordings', 'bdm:sample_count': 42 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/app/events.test.ts`
Expected: FAIL — `ev.recordingStarted` is not a function.

- [ ] **Step 3: Edit `src/app/events.ts`**

Inside the exported `ev = { ... }` object, add (after `consentDeclined`):
```ts
  recordingStarted: (a: Actor, recordingId: string, sid: string, ext: { modality: string; sampleRate: number; scope: string }, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:recording_started', object: { objectType: 'bdm:Recording', id: recordingId }, result: { extensions: { 'bdm:recording_modality': ext.modality, 'bdm:sample_rate': ext.sampleRate, 'bdm:recording_scope': ext.scope } }, ...ctxExt({ sessionId: sid }) }),
  recordingEnded: (a: Actor, recordingId: string, sid: string, ext: { url: string; sampleCount: number }, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:recording_ended', object: { objectType: 'bdm:Recording', id: recordingId }, result: { extensions: { 'bdm:recording_url': ext.url, 'bdm:sample_count': ext.sampleCount } }, ...ctxExt({ sessionId: sid }) }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/app/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/events.ts web-viewer/src/app/events.test.ts
git commit -m "feat(web-viewer): bdm:recording_started/ended event builders"
```

---

### Task 4: Wire capture into the player (`bootstrap.ts` + `App.tsx`)

**Files:**
- Modify: `web-viewer/src/app/bootstrap.ts`
- Modify: `web-viewer/src/app/App.tsx`
- Test: `web-viewer/src/app/App.test.tsx` (add cases)

**Interfaces:**
- Consumes: `MouseCapture` (Task 1), `ev.recordingStarted/Ended` (Task 3), `'recordings'` kind (Task 2).
- Produces: `MintOk.channels`; `Params.mouseHz`; capture started at boot + stopped/uploaded at finish.

- [ ] **Step 1: `bootstrap.ts` — add `channels` to the mint type + parse it + `mouse_hz`**

In `MintOk` (the `mintSession` success type), add `channels: Record<string, unknown> | null`:
```ts
export type MintOk = { ok: true; session_id: string; session_token: string; agent_id: string; session_index: number; runtime: Runtime; theme: Theme; ephemeral: boolean; participant_sub: string | null; consent: Record<string, string> | null; confirmation_message: Record<string, string> | null; redirect_url: string | null; channels: Record<string, unknown> | null }
```
In `mintSession`, where it builds the success object from `body`, add `channels: body.channels ?? null` to the returned object.
In `Params` (the `parseParams` return type) add `mouseHz: number | null`, and in `parseParams` add:
```ts
    mouseHz: q.get('mouse_hz') ? Number(q.get('mouse_hz')) : null,
```

- [ ] **Step 2: `App.tsx` — import + capture ref + helpers**

Add to the imports:
```ts
import { MouseCapture } from './mouseCapture'
```
Add the capture flag ref near the other refs (e.g. beside `ephemeralRef`):
```ts
  const captureMouseRef = useRef(false)
```
Add the `capture` field to the `pipeline.current` object literal in `buildPipeline` (after `cache,`):
```ts
      capture: undefined as MouseCapture | undefined,
```
Add a helper next to `startEvents`:
```ts
  function recId(sid: string) { return 'recording_mouse_' + sid }
  function maybeStartCapture() {
    const p = pipeline.current
    if (!p || !captureMouseRef.current || p.capture) return
    const cap = new MouseCapture({ sampleRateHz: params.mouseHz ?? 6 })
    cap.start()
    p.capture = cap
    p.batcher.add(ev.recordingStarted(p.engine, recId(p.identity.sessionId), p.identity.sessionId,
      { modality: 'mouse', sampleRate: cap.sampleRateHz, scope: 'runtime' }, nowIso()))
  }
```

- [ ] **Step 3: `App.tsx` — set the flag at the deployment mint + start capture at both run-start sites**

In the deployment mint path (right after `ephemeralRef.current = res.ephemeral`), add:
```ts
      captureMouseRef.current = !!(res.channels && (res.channels as Record<string, unknown>).mouse) && !res.ephemeral
```
In `buildPipeline`, inside the existing `if (!deferStart) { ...initialized...started... }` block, add `maybeStartCapture()` as the last line of that block (so the no-consent path starts capture right after `started`).
In `startEvents`, add `maybeStartCapture()` as the last line (so the consent path starts capture right after the participant consents and `started` is emitted).

- [ ] **Step 4: `App.tsx` — stop + upload at finish, and best-effort on pagehide**

In the finishing effect, immediately after the line that adds `ev.completed` (`pl.batcher.add(ev.completed(...))`), add:
```ts
      if (pl.capture) {
        const samples = pl.capture.stop()
        pl.capture = undefined
        pl.queue.enqueue('recordings', { channel: 'mouse', samples })
        pl.batcher.add(ev.recordingEnded(pl.engine, recId(pl.identity.sessionId), pl.identity.sessionId,
          { url: `${params.vsBaseUrl}/v1/deployments/${params.deploymentId}/recordings`, sampleCount: samples.length }, nowIso()))
      }
```
In the `pagehide` handler, before the existing `p.batcher.flush()`, add:
```ts
      if (p?.capture) {
        const samples = p.capture.stop()
        p.capture = undefined
        p.queue.enqueue('recordings', { channel: 'mouse', samples })
      }
```

- [ ] **Step 5: Write the App wiring tests** — add to `src/app/App.test.tsx`

Mirror the existing App tests' mint-mock pattern. Two cases: (a) `channels:{mouse:true}` → a `bdm:recording_started` statement is emitted to the captured event POST body, and on finishing a `recordings` POST is made + a `bdm:recording_ended` is emitted; (b) `channels:{mouse:false}` (or absent) → no `recording_*` events and no `/recordings` POST. Use the file's existing helpers for mounting the runner with a mocked `mintSession`/fetch; assert against the captured fetch URLs/bodies (the existing tests already intercept the VS fetches — follow that exact pattern). If the existing App tests assert on emitted events via the events POST payload, assert `verb` membership there; if they assert on fetch URLs, assert a `…/sessions/<id>/recordings` POST appears only in case (a).

```ts
// Shape of the assertions (adapt to App.test.tsx's existing harness):
// case A — channels.mouse true:
//   const urls = capturedFetchUrls()
//   expect(urls.some((u) => /\/sessions\/.+\/recordings$/.test(u))).toBe(true)
//   const verbs = capturedEventVerbs()
//   expect(verbs).toContain('bdm:recording_started')
//   expect(verbs).toContain('bdm:recording_ended')
// case B — channels.mouse false/absent:
//   expect(urls.some((u) => /\/recordings$/.test(u))).toBe(false)
//   expect(verbs).not.toContain('bdm:recording_started')
```

If the existing App test harness cannot easily simulate a full finish in jsdom, implement case (a)'s boot assertion (`bdm:recording_started` emitted + capture started) and case (b) (none), and cover the finish→upload path in the events/transport unit tests already written plus the live end-to-end verification step (the track's final integration) — note this explicitly in the test file comment rather than forcing a brittle full-finish simulation.

- [ ] **Step 6: Run the player test suite + typecheck/build**

Run: `cd web-viewer && npm test`
Expected: PASS (mouseCapture, transport, events, App, and all existing suites).
Run: `cd web-viewer && npm run build`
Expected: tsc + vite build succeed (no type errors from the `channels`/`mouseHz`/`capture` additions).

- [ ] **Step 7: Commit**

```bash
git add web-viewer/src/app/bootstrap.ts web-viewer/src/app/App.tsx web-viewer/src/app/App.test.tsx
git commit -m "feat(web-viewer): capture + upload participant mouse when channels.mouse is on"
```

---

### Task 5: Docs

**Files:**
- Modify: `web-viewer/HANDOFF.md`
- Modify: `web-viewer/FOLLOWUPS.md`

**Interfaces:** none (docs).

- [ ] **Step 1: Update `web-viewer/HANDOFF.md`**

Add a short note: when a deployment has `channels.mouse` enabled (surfaced via the mint), the player captures the participant's mouse as Schema-4b `{t,x,y,button_state}` samples (configurable rate via `?mouse_hz=`, default 6 Hz; mousedown/up always captured), uploads them once at finish to `POST /v1/sessions/{id}/recordings` (the SP3 endpoint) via the submission queue, and emits `bdm:recording_started`/`bdm:recording_ended` (the latter's `recording_url` → `/v1/deployments/{id}/recordings`). Capture is skipped on fixture/preview/ephemeral runs. Note this is SP2 — the final piece of the mouse-tracking track (SP1 bot, SP3 VS store). Em-dashes with no surrounding spaces; match the file's existing style.

- [ ] **Step 2: Update `web-viewer/FOLLOWUPS.md`**

Add deferred follow-ups: deployment-level capture config (sample rate / channel set) by extending the VS `channels` shape; keyboard channel capture; resumed sessions don't re-start capture (no re-mint); chunked mid-run upload + canonical `.jsonl.gz`; the track's live end-to-end verification (player → VS → researcher read). Match the file's existing style.

- [ ] **Step 3: Commit**

```bash
git add web-viewer/HANDOFF.md web-viewer/FOLLOWUPS.md
git commit -m "docs(web-viewer): live mouse capture (SP2) + follow-ups"
```

---

## Self-Review

**Spec coverage:**
- `MouseCapture` throttled Schema-4b sampler (default 6 Hz, button transitions immediate, maxSamples) — Task 1. ✅
- `recordings` submission kind → POST `/recordings` — Task 2. ✅
- `bdm:recording_started/ended` builders (modality/sample_rate/scope + recording_url/sample_count) — Task 3. ✅
- Mint `channels` + `?mouse_hz=` + capture only on real deployment+mouse runs; start at run-start, stop+upload at finish, best-effort pagehide; recording_url → deployment read — Task 4. ✅
- Skips fixture/preview/ephemeral — Task 4 (flag gated on `!res.ephemeral` + set only in the deployment mint path; fixture/preview never set it). ✅
- Tests Vitest+jsdom — every task. ✅
- Docs + follow-ups (incl. resumed-session gap, live e2e) — Task 5. ✅

**Placeholder scan:** Task 5 references the file's existing style without quoting it (acceptable — docs prose). Task 4 Step 5 gives the assertion shape and an explicit fallback if the jsdom harness can't simulate a full finish — concrete guidance, not a TODO. No "TBD"/stub-test placeholders.

**Type consistency:** `MouseSample`/`MouseCapture` from Task 1 used in Task 4; `SubmissionKind` includes `'recordings'` (Task 2) for the `queue.enqueue('recordings', …)` calls in Task 4; `ev.recordingStarted/Ended` signatures in Task 3 match the calls in Task 4 (`{modality,sampleRate,scope}` and `{url,sampleCount}`); `MintOk.channels` + `Params.mouseHz` (Task 4 Step 1) consumed later in Task 4. `recId(sid)` defined once and used at start + finish + pagehide. ✅
