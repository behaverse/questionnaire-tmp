# Web viewer replay (#7, RP1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An embedded `?replay=<src>` mode in the player that loads a replay bundle `{runtime, statements, mouse?}`, reconstructs the run, and plays it back through the existing renderer with scrub/play-pause/speed and a mouse-cursor overlay.

**Architecture:** Pure engine — `reconstruct(statements) → Timeline` (runtime-agnostic) + `cursor` interpolation + a clock. A `ReplayView` renders the reconstructed step read-only through the existing `StepRenderer` (no renderer change; `pointer-events:none` + no-op `onAnswer`) with a controls bar + cursor overlay. `main.tsx` mounts a standalone `ReplayApp` (no session) when `?replay=` is present.

**Tech Stack:** Vite + React + TypeScript, Vitest + jsdom + @testing-library/react (the player's stack). Component `web-viewer/`.

## Global Constraints

- All changes under `web-viewer/`. Do NOT modify viewer-service/, library/, questionnaire-harvester/, or other components. No renderer modification (reuse `StepRenderer` as-is).
- Replay bundle: `{ runtime: Runtime; statements: BdmEvent[]; mouse?: MouseSample[] }`. Reuse existing types: `Runtime` (`../renderer/types`), `BdmEvent` (`../app/events`), `MouseSample` (`../app/mouseCapture`).
- `reconstruct.ts` and `cursor.ts` are PURE (no React, no DOM); the only time source is `Date.parse(timestamp)` on fixed statement strings (allowed — not `Date.now()`).
- Event → position/answer mapping (verified): position from `bdm:trial_started` object id `trial_<key>` (strip the `trial_` prefix); answers from `bdm:trial_ended` `result.extensions` — `bdm:response_option_index` (structural index), `bdm:response_numeric` (the option value / number), `bdm:response_description` (text). Later `trial_ended` for a key overrides an earlier one (revision).
- Read-only render: pass reconstructed `answers` + a no-op `onAnswer` + `requiredErrors: []` to `StepRenderer`, wrapped in `pointer-events:none`.
- Tests: `cd web-viewer && npm test` (Vitest). Build check: `npm run build` (tsc+vite) — REQUIRED (vitest does not typecheck).
- Branch: `work/web-viewer-replay`. Finish by merging to master + push (no PRs); `git fetch` + ff/rebase before push. Stage explicit paths only.

---

### Task 1: `reconstruct.ts` (pure engine)

**Files:**
- Create: `web-viewer/src/replay/reconstruct.ts`
- Test: `web-viewer/src/replay/reconstruct.test.ts`

**Interfaces:**
- Produces:
  - `type RecAnswer = { optionIndex?: number; numeric?: number; description?: string }`
  - `type ReplayState = { elementKey: string | null; answers: Record<string, RecAnswer> }`
  - `type TimelineEvent = { absMs: number; verb: string; elementKey: string | null }`
  - `type Timeline = { startMs: number; endMs: number; durationMs: number; events: TimelineEvent[]; stateAt(absMs: number): ReplayState }`
  - `reconstruct(statements: BdmEvent[]): Timeline`

- [ ] **Step 1: Write the failing test** — `src/replay/reconstruct.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { reconstruct } from './reconstruct'
import type { BdmEvent } from '../app/events'

const ev = (secs: number, verb: string, id?: string, ext?: Record<string, unknown>): BdmEvent => ({
  timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, secs)).toISOString(),
  actor: { objectType: 'bdm:Engine', id: 'e' },
  verb,
  object: id ? { objectType: 'bdm:Trial', id } : { objectType: 'bdm:RuntimeInstance', id: 's' },
  ...(ext ? { result: { extensions: ext } } : {}),
})

const STREAM: BdmEvent[] = [
  ev(0, 'bdm:started'),
  ev(1, 'bdm:trial_started', 'trial_it_1'),
  ev(3, 'bdm:trial_ended', 'trial_it_1', { 'bdm:response_option_index': 2, 'bdm:response_numeric': 1, 'bdm:response_description': 'Several days' }),
  ev(4, 'bdm:trial_started', 'trial_it_2'),
  ev(6, 'bdm:trial_ended', 'trial_it_2', { 'bdm:response_numeric': 7 }),
  ev(8, 'bdm:submitted'),
]

describe('reconstruct', () => {
  it('computes the timeline bounds', () => {
    const t = reconstruct(STREAM)
    expect(t.durationMs).toBe(8000)
    expect(t.endMs - t.startMs).toBe(8000)
    expect(t.events).toHaveLength(6)
  })
  it('tracks the current element over time', () => {
    const t = reconstruct(STREAM)
    expect(t.stateAt(t.startMs + 0).elementKey).toBe(null)     // before first trial
    expect(t.stateAt(t.startMs + 2000).elementKey).toBe('it_1')
    expect(t.stateAt(t.startMs + 5000).elementKey).toBe('it_2')
  })
  it('fills answers once each trial_ended passes', () => {
    const t = reconstruct(STREAM)
    expect(t.stateAt(t.startMs + 2000).answers).toEqual({})    // it_1 not yet ended
    expect(t.stateAt(t.startMs + 3500).answers).toEqual({ it_1: { optionIndex: 2, numeric: 1, description: 'Several days' } })
    expect(t.stateAt(t.startMs + 7000).answers.it_2).toEqual({ numeric: 7 })
  })
  it('a later trial_ended overrides an earlier one (revision)', () => {
    const t = reconstruct([
      ev(1, 'bdm:trial_started', 'trial_q'),
      ev(2, 'bdm:trial_ended', 'trial_q', { 'bdm:response_numeric': 1 }),
      ev(3, 'bdm:trial_ended', 'trial_q', { 'bdm:response_numeric': 3 }),
    ])
    expect(t.stateAt(t.endMs).answers.q).toEqual({ numeric: 3 })
  })
  it('is order-independent (sorts by timestamp)', () => {
    const t = reconstruct([...STREAM].reverse())
    expect(t.stateAt(t.startMs + 5000).elementKey).toBe('it_2')
  })
  it('empty stream → zero-length timeline', () => {
    const t = reconstruct([])
    expect(t.durationMs).toBe(0)
    expect(t.stateAt(0)).toEqual({ elementKey: null, answers: {} })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/replay/reconstruct.test.ts`
Expected: FAIL — cannot find `./reconstruct`.

- [ ] **Step 3: Write `src/replay/reconstruct.ts`**

```ts
import type { BdmEvent } from '../app/events'

export type RecAnswer = { optionIndex?: number; numeric?: number; description?: string }
export type ReplayState = { elementKey: string | null; answers: Record<string, RecAnswer> }
export type TimelineEvent = { absMs: number; verb: string; elementKey: string | null }
export type Timeline = {
  startMs: number
  endMs: number
  durationMs: number
  events: TimelineEvent[]
  stateAt(absMs: number): ReplayState
}

const TRIAL_PREFIX = 'trial_'
type Internal = TimelineEvent & { ext: Record<string, unknown> }

function keyOf(e: BdmEvent): string | null {
  const id = e.object?.id
  return typeof id === 'string' && id.startsWith(TRIAL_PREFIX) ? id.slice(TRIAL_PREFIX.length) : null
}

export function reconstruct(statements: BdmEvent[]): Timeline {
  const rows: Internal[] = statements
    .map((s) => ({ absMs: Date.parse(s.timestamp), verb: s.verb, elementKey: keyOf(s), ext: (s.result?.extensions ?? {}) as Record<string, unknown> }))
    .sort((a, b) => a.absMs - b.absMs)
  const startMs = rows.length ? rows[0]!.absMs : 0
  const endMs = rows.length ? rows[rows.length - 1]!.absMs : 0
  const events: TimelineEvent[] = rows.map((r) => ({ absMs: r.absMs, verb: r.verb, elementKey: r.elementKey }))

  function stateAt(absMs: number): ReplayState {
    let elementKey: string | null = null
    const answers: Record<string, RecAnswer> = {}
    for (const r of rows) {
      if (r.absMs > absMs) break
      if (r.verb === 'bdm:trial_started' && r.elementKey) elementKey = r.elementKey
      if (r.verb === 'bdm:trial_ended' && r.elementKey) {
        const a: RecAnswer = {}
        const oi = r.ext['bdm:response_option_index']
        const n = r.ext['bdm:response_numeric']
        const d = r.ext['bdm:response_description']
        if (typeof oi === 'number') a.optionIndex = oi
        if (typeof n === 'number') a.numeric = n
        if (typeof d === 'string') a.description = d
        answers[r.elementKey] = a
      }
    }
    return { elementKey, answers }
  }

  return { startMs, endMs, durationMs: endMs - startMs, events, stateAt }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/replay/reconstruct.test.ts`
Expected: PASS (6 cases).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/replay/reconstruct.ts web-viewer/src/replay/reconstruct.test.ts
git commit -m "feat(web-viewer): replay reconstruct engine (statements -> timeline)"
```

---

### Task 2: `cursor.ts` (pure)

**Files:**
- Create: `web-viewer/src/replay/cursor.ts`
- Test: `web-viewer/src/replay/cursor.test.ts`

**Interfaces:**
- Consumes: `MouseSample` (`../app/mouseCapture`), `BdmEvent` (`../app/events`).
- Produces:
  - `findRecordingStartMs(statements: BdmEvent[]): number | null` — the `bdm:recording_started` timestamp in ms, or null.
  - `buildCursor(mouse: MouseSample[], recordingStartMs: number): (absMs: number) => { x: number; y: number } | null`

- [ ] **Step 1: Write the failing test** — `src/replay/cursor.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { buildCursor, findRecordingStartMs } from './cursor'
import type { MouseSample } from '../app/mouseCapture'
import type { BdmEvent } from '../app/events'

const samples: MouseSample[] = [
  { t: 0, x: 0, y: 0, button_state: 'up' },
  { t: 1, x: 100, y: 50, button_state: 'up' },
]

describe('buildCursor', () => {
  it('interpolates between samples relative to recordingStartMs', () => {
    const at = buildCursor(samples, 1000)
    expect(at(1000)).toEqual({ x: 0, y: 0 })       // t=0
    expect(at(1500)).toEqual({ x: 50, y: 25 })     // halfway
    expect(at(2000)).toEqual({ x: 100, y: 50 })    // t=1
  })
  it('returns null before the first and after the last sample', () => {
    const at = buildCursor(samples, 1000)
    expect(at(999)).toBeNull()
    expect(at(2001)).toBeNull()
  })
  it('empty samples → always null', () => {
    expect(buildCursor([], 0)(123)).toBeNull()
  })
})

describe('findRecordingStartMs', () => {
  it('returns the recording_started timestamp in ms', () => {
    const st: BdmEvent[] = [
      { timestamp: '2026-01-01T00:00:01.000Z', actor: { objectType: 'bdm:Engine', id: 'e' }, verb: 'bdm:started', object: { objectType: 'x', id: 's' } },
      { timestamp: '2026-01-01T00:00:02.000Z', actor: { objectType: 'bdm:Engine', id: 'e' }, verb: 'bdm:recording_started', object: { objectType: 'bdm:Recording', id: 'r' } },
    ]
    expect(findRecordingStartMs(st)).toBe(Date.parse('2026-01-01T00:00:02.000Z'))
  })
  it('returns null when absent', () => {
    expect(findRecordingStartMs([])).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/replay/cursor.test.ts`
Expected: FAIL — cannot find `./cursor`.

- [ ] **Step 3: Write `src/replay/cursor.ts`**

```ts
import type { MouseSample } from '../app/mouseCapture'
import type { BdmEvent } from '../app/events'

export function findRecordingStartMs(statements: BdmEvent[]): number | null {
  const s = statements.find((e) => e.verb === 'bdm:recording_started')
  return s ? Date.parse(s.timestamp) : null
}

export function buildCursor(mouse: MouseSample[], recordingStartMs: number): (absMs: number) => { x: number; y: number } | null {
  if (!mouse.length) return () => null
  const pts = mouse.map((m) => ({ absMs: recordingStartMs + m.t * 1000, x: m.x, y: m.y }))
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  return (absMs: number) => {
    if (absMs < first.absMs || absMs > last.absMs) return null
    let i = 0
    while (i < pts.length - 1 && pts[i + 1]!.absMs <= absMs) i++
    const a = pts[i]!
    const b = pts[Math.min(i + 1, pts.length - 1)]!
    if (b.absMs === a.absMs) return { x: a.x, y: a.y }
    const f = (absMs - a.absMs) / (b.absMs - a.absMs)
    return { x: Math.round(a.x + (b.x - a.x) * f), y: Math.round(a.y + (b.y - a.y) * f) }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/replay/cursor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/replay/cursor.ts web-viewer/src/replay/cursor.test.ts
git commit -m "feat(web-viewer): replay cursor interpolation + recording-start alignment"
```

---

### Task 3: playback clock (`clock.ts`)

**Files:**
- Create: `web-viewer/src/replay/clock.ts`
- Test: `web-viewer/src/replay/clock.test.ts`

**Interfaces:**
- Produces:
  - `advanceClock(offsetMs: number, dtMs: number, speed: number, durationMs: number): { offsetMs: number; done: boolean }` — pure; clamps to `[0, durationMs]`; `done` when it reaches the end.
  - `useReplayClock(durationMs: number): { offsetMs: number; playing: boolean; speed: number; play(): void; pause(): void; seek(v: number): void; setSpeed(s: number): void }` — a hook driving `offsetMs` via `requestAnimationFrame` while playing; auto-pauses at the end.

- [ ] **Step 1: Write the failing test** — `src/replay/clock.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { advanceClock, useReplayClock } from './clock'

describe('advanceClock', () => {
  it('advances by dt*speed and clamps at duration', () => {
    expect(advanceClock(0, 100, 1, 1000)).toEqual({ offsetMs: 100, done: false })
    expect(advanceClock(0, 100, 2, 1000)).toEqual({ offsetMs: 200, done: false })
    expect(advanceClock(950, 100, 1, 1000)).toEqual({ offsetMs: 1000, done: true })
  })
  it('never goes below 0', () => {
    expect(advanceClock(0, -50, 1, 1000).offsetMs).toBe(0)
  })
})

describe('useReplayClock', () => {
  it('seek clamps to [0, duration]; setSpeed + play/pause update state', () => {
    const { result } = renderHook(() => useReplayClock(1000))
    expect(result.current.offsetMs).toBe(0)
    act(() => result.current.seek(1500))
    expect(result.current.offsetMs).toBe(1000)
    act(() => result.current.seek(-10))
    expect(result.current.offsetMs).toBe(0)
    act(() => { result.current.setSpeed(2); result.current.play() })
    expect(result.current.speed).toBe(2)
    expect(result.current.playing).toBe(true)
    act(() => result.current.pause())
    expect(result.current.playing).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/replay/clock.test.ts`
Expected: FAIL — cannot find `./clock`.

- [ ] **Step 3: Write `src/replay/clock.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export function advanceClock(offsetMs: number, dtMs: number, speed: number, durationMs: number): { offsetMs: number; done: boolean } {
  const next = Math.max(0, Math.min(durationMs, offsetMs + dtMs * speed))
  return { offsetMs: next, done: next >= durationMs }
}

export function useReplayClock(durationMs: number) {
  const [offsetMs, setOffsetMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const last = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) { last.current = null; return }
    let raf = 0
    const step = (t: number) => {
      const prev = last.current
      last.current = t
      if (prev != null) {
        setOffsetMs((o) => {
          const { offsetMs: n, done } = advanceClock(o, t - prev, speed, durationMs)
          if (done) setPlaying(false)
          return n
        })
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, durationMs])

  const seek = useCallback((v: number) => setOffsetMs(Math.max(0, Math.min(durationMs, v))), [durationMs])
  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  return { offsetMs, playing, speed, play, pause, seek, setSpeed }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/replay/clock.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/replay/clock.ts web-viewer/src/replay/clock.test.ts
git commit -m "feat(web-viewer): replay playback clock (advance + useReplayClock)"
```

---

### Task 4: `ReplayView` (render read-only step + controls + cursor)

**Files:**
- Create: `web-viewer/src/replay/ReplayView.tsx`
- Test: `web-viewer/src/replay/ReplayView.test.tsx`

**Interfaces:**
- Consumes: `reconstruct`/`Timeline` (Task 1), `buildCursor` (Task 2), `useReplayClock` (Task 3), `StepRenderer` (`../renderer`), `flattenSteps` (`../app/steps`), `AnswerValue`/`Runtime` (`../renderer/types`).
- Produces: `ReplayView({ runtime, timeline, cursorAt }: { runtime: Runtime; timeline: Timeline; cursorAt: (absMs: number) => { x: number; y: number } | null })`.

- [ ] **Step 1: Write the failing test** — `src/replay/ReplayView.test.tsx`

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReplayView } from './ReplayView'
import { reconstruct } from './reconstruct'
import type { Runtime } from '../renderer/types'
import mini from '../fixtures/mini.json'
import type { BdmEvent } from '../app/events'

const runtime = mini as unknown as Runtime
const ev = (secs: number, verb: string, id?: string, ext?: Record<string, unknown>): BdmEvent => ({
  timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, secs)).toISOString(),
  actor: { objectType: 'bdm:Engine', id: 'e' }, verb,
  object: id ? { objectType: 'bdm:Trial', id } : { objectType: 'x', id: 's' },
  ...(ext ? { result: { extensions: ext } } : {}),
})

// mini it_1 is a choice; option index 2 → text "Several days"
const stream: BdmEvent[] = [
  ev(1, 'bdm:trial_started', 'trial_it_1'),
  ev(3, 'bdm:trial_ended', 'trial_it_1', { 'bdm:response_option_index': 2, 'bdm:response_numeric': 1, 'bdm:response_description': 'Several days' }),
  ev(5, 'bdm:submitted'),
]

describe('ReplayView', () => {
  it('renders the current step and shows the reconstructed answer after scrubbing past it', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => null} />)
    // scrub to the end so it_1's answer is committed
    const scrubber = screen.getByRole('slider', { name: /timeline/i })
    fireEvent.change(scrubber, { target: { value: String(reconstruct(stream).durationMs) } })
    // the chosen option is rendered as checked (radiogroup for the mini item)
    const chosen = screen.getByRole('radio', { name: /Several days/i }) as HTMLInputElement
    expect(chosen.checked).toBe(true)
  })
  it('has play/pause + speed controls', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => null} />)
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /speed/i })).toBeInTheDocument()
  })
  it('renders a cursor dot when cursorAt returns a point', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => ({ x: 10, y: 20 })} />)
    expect(document.getElementById('replay-cursor')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/replay/ReplayView.test.tsx`
Expected: FAIL — cannot find `./ReplayView`.

- [ ] **Step 3: Write `src/replay/ReplayView.tsx`**

```tsx
import { useMemo } from 'react'
import { StepRenderer } from '../renderer'
import type { AnswerValue, Runtime } from '../renderer/types'
import { flattenSteps, type Step } from '../app/steps'
import { useReplayClock } from './clock'
import type { RecAnswer, Timeline } from './reconstruct'

const SPEEDS = [0.5, 1, 2, 4]
const NOOP = () => {}
const fmt = (ms: number) => `${Math.floor(ms / 1000)}s`

/** Map a reconstructed answer to the renderer's AnswerValue using the element definition. */
function toAnswerValue(el: Step['elements'][number]['element'], a: RecAnswer): AnswerValue | undefined {
  const opt = (el as { option?: { input_data_type?: string; options?: { index: number; value: unknown }[] } }).option
  if (!opt) return undefined
  if (opt.input_data_type === 'choice' && a.optionIndex != null) {
    const found = (opt.options ?? []).find((o) => o.index === a.optionIndex)
    if (found) return found.value as AnswerValue
  }
  if (a.numeric != null) return a.numeric as AnswerValue
  if (a.description != null) return a.description as AnswerValue
  return undefined
}

export function ReplayView({ runtime, timeline, cursorAt }: { runtime: Runtime; timeline: Timeline; cursorAt: (absMs: number) => { x: number; y: number } | null }) {
  const steps = useMemo(() => flattenSteps(runtime), [runtime])
  const locale = runtime.locale ?? 'en'
  const clock = useReplayClock(timeline.durationMs)
  const absMs = timeline.startMs + clock.offsetMs
  const state = timeline.stateAt(absMs)

  // find the step containing the current element (fallback: first step)
  const stepIdx = Math.max(0, steps.findIndex((s) => s.elements.some((e) => e.key === state.elementKey)))
  const step = steps[stepIdx] ?? steps[0]
  const answers: Record<string, AnswerValue> = {}
  if (step) for (const e of step.elements) {
    const a = state.answers[e.key]
    if (a) { const v = toAnswerValue(e.element, a); if (v !== undefined) answers[e.key] = v }
  }
  const cursor = cursorAt(absMs)

  return (
    <div className="replay" style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ pointerEvents: 'none' }} aria-label="replay surface">
          {step && <StepRenderer elements={step.elements} locale={locale} answers={answers} onAnswer={NOOP}
            requiredErrors={[]} strings={{ required: '', unsupported: 'unsupported' }} />}
        </div>
        {cursor && <div id="replay-cursor" style={{ position: 'fixed', left: cursor.x, top: cursor.y, width: 22, height: 22, margin: '-11px 0 0 -11px', border: '3px solid #e11d48', borderRadius: '50%', background: 'rgba(225,29,72,0.25)', pointerEvents: 'none', zIndex: 60 }} />}
      </div>

      <div className="replay-controls" style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => (clock.playing ? clock.pause() : clock.play())}>{clock.playing ? 'Pause' : 'Play'}</button>
        <input type="range" aria-label="timeline" min={0} max={timeline.durationMs} value={clock.offsetMs}
          onChange={(e) => clock.seek(Number(e.target.value))} style={{ flex: 1 }} />
        <span>{fmt(clock.offsetMs)} / {fmt(timeline.durationMs)}</span>
        <label>speed <select aria-label="speed" value={clock.speed} onChange={(e) => clock.setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select></label>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/replay/ReplayView.test.tsx`
Expected: PASS (3 cases).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/replay/ReplayView.tsx web-viewer/src/replay/ReplayView.test.tsx
git commit -m "feat(web-viewer): ReplayView (read-only render + controls + cursor overlay)"
```

---

### Task 5: bundle loader + shell + `?replay=` wiring

**Files:**
- Create: `web-viewer/src/replay/load.ts`
- Create: `web-viewer/src/replay/ReplayApp.tsx`
- Modify: `web-viewer/src/app/bootstrap.ts` (add `replay` to `Params`)
- Modify: `web-viewer/src/main.tsx` (mount `ReplayApp` when `?replay=`)
- Test: `web-viewer/src/replay/load.test.ts`

**Interfaces:**
- Produces:
  - `type ReplayBundle = { runtime: Runtime; statements: BdmEvent[]; mouse?: MouseSample[] }`
  - `loadBundle(src: string, fetchImpl?: typeof fetch): Promise<{ ok: true; bundle: ReplayBundle } | { ok: false; error: string }>`
  - `ReplayApp({ src }: { src: string })` — loads + applies theme + renders `ReplayView` or an error/loading screen.
  - `Params.replay: string | null`.

- [ ] **Step 1: Write the failing test** — `src/replay/load.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { loadBundle } from './load'

const okBundle = { runtime: { metadata: { id: 'q' }, locale: 'en', pages: [] }, statements: [], mouse: [] }
const fetchOk = (async () => new Response(JSON.stringify(okBundle), { status: 200 })) as unknown as typeof fetch
const fetch404 = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch
const fetchBadJson = (async () => new Response('{not json', { status: 200 })) as unknown as typeof fetch
const fetchNoRuntime = (async () => new Response(JSON.stringify({ statements: [] }), { status: 200 })) as unknown as typeof fetch

describe('loadBundle', () => {
  it('loads a valid bundle', async () => {
    const r = await loadBundle('x.json', fetchOk)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.bundle.runtime.metadata.id).toBe('q')
  })
  it('errors on a non-OK response', async () => {
    expect((await loadBundle('x.json', fetch404)).ok).toBe(false)
  })
  it('errors on invalid JSON', async () => {
    expect((await loadBundle('x.json', fetchBadJson)).ok).toBe(false)
  })
  it('errors when runtime or statements is missing', async () => {
    expect((await loadBundle('x.json', fetchNoRuntime)).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/replay/load.test.ts`
Expected: FAIL — cannot find `./load`.

- [ ] **Step 3: Write `src/replay/load.ts`**

```ts
import type { Runtime } from '../renderer/types'
import type { BdmEvent } from '../app/events'
import type { MouseSample } from '../app/mouseCapture'

export type ReplayBundle = { runtime: Runtime; statements: BdmEvent[]; mouse?: MouseSample[] }
export type LoadResult = { ok: true; bundle: ReplayBundle } | { ok: false; error: string }

export async function loadBundle(src: string, fetchImpl: typeof fetch = fetch.bind(globalThis)): Promise<LoadResult> {
  let resp: Response
  try { resp = await fetchImpl(src) } catch { return { ok: false, error: 'could not fetch the replay source' } }
  if (!resp.ok) return { ok: false, error: `replay source returned ${resp.status}` }
  let body: unknown
  try { body = await resp.json() } catch { return { ok: false, error: 'replay source is not valid JSON' } }
  const b = body as Partial<ReplayBundle>
  if (!b || typeof b.runtime !== 'object' || !b.runtime || !Array.isArray(b.statements)) {
    return { ok: false, error: 'not a replay bundle (needs runtime + statements)' }
  }
  return { ok: true, bundle: { runtime: b.runtime as Runtime, statements: b.statements as BdmEvent[], mouse: Array.isArray(b.mouse) ? (b.mouse as MouseSample[]) : undefined } }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/replay/load.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/replay/ReplayApp.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { applyTheme } from '../app/theme'
import { getTheme, resolveThemeId } from '../theme/registry'
import { reconstruct } from './reconstruct'
import { buildCursor, findRecordingStartMs } from './cursor'
import { loadBundle, type ReplayBundle } from './load'
import { ReplayView } from './ReplayView'

type Phase = { kind: 'loading' } | { kind: 'error'; error: string } | { kind: 'ready'; bundle: ReplayBundle }

export function ReplayApp({ src, themeParam }: { src: string; themeParam?: string | null }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  useEffect(() => {
    let live = true
    applyTheme(getTheme(resolveThemeId({ themeParam: themeParam ?? null })))
    loadBundle(src).then((r) => { if (live) setPhase(r.ok ? { kind: 'ready', bundle: r.bundle } : { kind: 'error', error: r.error }) })
    return () => { live = false }
  }, [src, themeParam])

  if (phase.kind === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Loading replay…</div>
  if (phase.kind === 'error') return <div style={{ padding: 40, textAlign: 'center' }}><h1>Replay unavailable</h1><p>{phase.error}</p></div>

  const { runtime, statements, mouse } = phase.bundle
  const timeline = reconstruct(statements)
  const recStart = findRecordingStartMs(statements) ?? timeline.startMs
  const cursorAt = buildCursor(mouse ?? [], recStart)
  return <ReplayView runtime={runtime} timeline={timeline} cursorAt={cursorAt} />
}
```

Verify the exact import path/signatures of `getTheme`/`resolveThemeId` against `src/app/App.tsx` (it imports them for theme resolution). If the helper names differ, match App.tsx's usage; the goal is "apply the default theme (or `?theme=`)". If `resolveThemeId`/`getTheme` are not exported from `../theme/registry`, use whatever App.tsx imports for the same purpose.

- [ ] **Step 6: Add `replay` to `Params` + parse it — `src/app/bootstrap.ts`**

In the `Params` type add `replay: string | null`, and in `parseParams` add:
```ts
    replay: q.get('replay'),
```

- [ ] **Step 7: Mount `ReplayApp` when `?replay=` is present — `src/main.tsx`**

Replace the `createRoot(...).render(...)` block so replay bypasses the session shell:
```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {params.replay
      ? <ReplayApp src={params.replay} themeParam={params.theme} />
      : (
        <SessionProvider identityBaseUrl={params.identityBaseUrl} handoffCode={params.handoff ?? undefined}>
          <App />
        </SessionProvider>
      )}
  </StrictMode>,
)
```
Add the import at the top: `import { ReplayApp } from './replay/ReplayApp'`.

- [ ] **Step 8: Full suite + build**

Run: `cd web-viewer && npm test`
Expected: PASS (replay reconstruct/cursor/clock/ReplayView/load + all existing suites).
Run: `cd web-viewer && npm run build`
Expected: tsc + vite build succeed.

- [ ] **Step 9: Commit**

```bash
git add web-viewer/src/replay/load.ts web-viewer/src/replay/load.test.ts web-viewer/src/replay/ReplayApp.tsx web-viewer/src/app/bootstrap.ts web-viewer/src/main.tsx
git commit -m "feat(web-viewer): replay bundle loader + ReplayApp shell + ?replay= wiring"
```

---

### Task 6: Docs

**Files:**
- Modify: `web-viewer/HANDOFF.md`
- Modify: `web-viewer/FOLLOWUPS.md`

**Interfaces:** none (docs).

- [ ] **Step 1: Update `web-viewer/HANDOFF.md`**

Add a short note: `?replay=<src>` mounts an embedded replay mode (`ReplayApp`) that loads a replay bundle `{runtime, statements, mouse?}` (e.g. the respondent-bot's `trace.json` paired with a runtime), reconstructs the run (`src/replay/reconstruct.ts`), and plays it back read-only through `StepRenderer` with a timeline scrubber, play/pause, speed (0.5/1/2/4×), and a mouse-cursor overlay (`src/replay/cursor.ts`). Pure engine + `ReplayView`. This is #7 RP1 (offline, file-based); live researcher-gated loading is RP2 (VS reads) + RP3 (live loader). Match the file's existing em-dash style.

- [ ] **Step 2: Update `web-viewer/FOLLOWUPS.md`**

Mark #7 replay RP1 done and record: RP2 (`viewer-service` researcher reads — `GET /v1/deployments/{id}/events` + per-session reads); RP3 (live `?replay=<deployment>/<session>` loader building a bundle from the reads + runtime); live `selected`/`deselected` pre-commit highlighting; revision-diff UI; export replay as video. Match the file's existing style.

- [ ] **Step 3: Commit**

```bash
git add web-viewer/HANDOFF.md web-viewer/FOLLOWUPS.md
git commit -m "docs(web-viewer): replay RP1 + RP2/RP3 follow-ups"
```

---

## Self-Review

**Spec coverage:**
- Embedded `?replay=` mode — Task 5 (main.tsx + ReplayApp). ✅
- Bundle `{runtime, statements, mouse?}` load + validation — Task 5 (load.ts). ✅
- Pure reconstruct (position + answers + revisions + duration) — Task 1. ✅
- Cursor interpolation + recording-start alignment — Task 2. ✅
- Playback clock (play/pause/speed/scrub, auto-pause at end) — Task 3. ✅
- Read-only render via StepRenderer (pointer-events:none, no-op onAnswer) + controls + cursor overlay + option-index→value mapping — Task 4. ✅
- Error/edge (bad src, missing runtime/statements, no mouse, unknown element, empty) — load.ts (Task 5) + ReplayApp error screen + ReplayView fallback to first step. ✅
- Tests Vitest+jsdom for each unit; build gate — every task + Task 5 Step 8. ✅
- Docs + RP2/RP3 follow-ups — Task 6. ✅

**Placeholder scan:** Task 5 Step 5 notes to verify the exact `getTheme`/`resolveThemeId` import against App.tsx (a real, concrete verification instruction, not a TODO — the intent "apply default/`?theme=`" is explicit). No stub tests.

**Type consistency:** `Timeline`/`ReplayState`/`RecAnswer` from Task 1 consumed by Task 4 (`ReplayView`) and Task 5 (`ReplayApp`); `buildCursor`/`findRecordingStartMs` (Task 2) used in Task 5; `useReplayClock` (Task 3) used in Task 4; `ReplayBundle` (Task 5 load) matches what `ReplayApp` destructures (`runtime`/`statements`/`mouse`); `Params.replay` (Task 5 Step 6) read in `main.tsx` (Step 7). `ReplayView` prop shape `{runtime, timeline, cursorAt}` identical in its definition (Task 4), its test, and the `ReplayApp` call (Task 5). ✅
