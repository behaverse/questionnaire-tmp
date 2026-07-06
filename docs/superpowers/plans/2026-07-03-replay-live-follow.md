# Live-follow of an in-progress session — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A researcher can watch a session live: the player polls `GET /v1/replay?token=` and keeps the view at the latest event, stopping when the session ends.

**Architecture:** Polling, player-side, no backend change. `ReplayApp` re-fetches the bundle every ~4s while following; the growing `statements` extend the timeline (re-`reconstruct` on render); `ReplayView` pins the clock to the live edge while "Following". Entry is a `/studies` "Watch live" button opening `?replay=<url>&follow=1`.

**Tech Stack:** React 19 + TS + Vitest/@testing-library (web-viewer + participant-app). Renderer ships as a shared lib.

## Global Constraints

- **Em-dashes, no spaces** in new code/prose (`word—word`). Legacy status docs use spaced em-dashes — match theirs.
- **No backend change** — reuse `GET /v1/replay?token=`.
- **Non-fatal polling:** a failed poll keeps the last good bundle and keeps polling (a transient error must not kill a live watch).
- **Live-tail only while following:** the auto-seek-to-end happens only when "Following" is on; pausing hands control to the scrubber. Existing play/seek/speed controls stay.
- **Renderer lib:** after web-viewer changes run `npm test`, `npm run build`, AND `npm run build:lib`.
- File-scoped JS test runs: `npx vitest run <path>` (`npm test -- <file>` does not filter here).
- **No PRs:** finish by merging `work/replay-live-follow` → master + push; fetch + ff/rebase first (shared checkout).

## File Structure

- `web-viewer/src/replay/ReplayView.tsx` — **modify.** Optional `follow` prop: "● LIVE"/"Paused"/"Ended" badge-toggle + live-tail effect.
- `web-viewer/src/replay/ReplayView.test.tsx` — **modify.**
- `web-viewer/src/replay/follow.ts` — **create.** `isTerminal`, `POLL_MS`, `NO_CHANGE_CAP`.
- `web-viewer/src/replay/follow.test.ts` — **create.**
- `web-viewer/src/replay/ReplayApp.tsx` — **modify.** `follow` prop + poller + pass `follow` to `ReplayView`.
- `web-viewer/src/replay/ReplayApp.test.tsx` — **create.** Poller behavior (fake timers).
- `web-viewer/src/app/bootstrap.ts` — **modify.** `follow` param.
- `web-viewer/src/main.tsx` — **modify.** Pass `follow` to `ReplayApp`.
- `participant-app/src/studies/StudiesView.tsx` — **modify.** "Watch live" button.
- `participant-app/src/studies/StudiesView.test.tsx` — **modify.**
- `web-viewer/docs/replay.md`, `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md` — **modify.** Docs/status (#7 fully complete).

---

### Task 1: ReplayView — live-tail + LIVE/Paused/Ended badge

**Files:**
- Modify: `web-viewer/src/replay/ReplayView.tsx`
- Test: `web-viewer/src/replay/ReplayView.test.tsx`

**Interfaces:**
- Produces: `ReplayView` accepts an optional `follow?: { following: boolean; ended: boolean; onToggle: () => void }`. When present, it renders a badge-button (`● LIVE` when following, `Paused` when not, `Ended` when `ended`) and, while `following && !ended`, seeks the clock to `timeline.durationMs` whenever the timeline grows. When `follow` is undefined, behavior is unchanged.

- [ ] **Step 1: Write the failing test**

In `web-viewer/src/replay/ReplayView.test.tsx`, add (reuse the file's existing `ev`/`reconstruct`/`runtime` helpers):

```tsx
it('shows a LIVE badge and live-tails the clock to the end while following', () => {
  const stmts = [ev(1, 'bdm:trial_started', 'trial_it_1'), ev(3, 'bdm:trial_ended', 'trial_it_1', { 'bdm:response_option_index': 2 })]
  const { rerender } = render(<ReplayView runtime={runtime} timeline={reconstruct(stmts)} cursorAt={() => null}
    follow={{ following: true, ended: false, onToggle: () => {} }} />)
  expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
  // a longer timeline arrives → the clock live-tails to the new end (total == max)
  const longer = [...stmts, ev(9, 'bdm:submitted')]
  rerender(<ReplayView runtime={runtime} timeline={reconstruct(longer)} cursorAt={() => null}
    follow={{ following: true, ended: false, onToggle: () => {} }} />)
  const scrubber = screen.getByRole('slider', { name: /timeline/i }) as HTMLInputElement
  expect(Number(scrubber.value)).toBe(reconstruct(longer).durationMs)  // pinned to the live edge
})

it('shows Ended and stops tailing when ended', () => {
  render(<ReplayView runtime={runtime} timeline={reconstruct([ev(1, 'bdm:trial_started', 'trial_it_1')])} cursorAt={() => null}
    follow={{ following: true, ended: true, onToggle: () => {} }} />)
  expect(screen.getByRole('button', { name: /ended/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web-viewer && npx vitest run src/replay/ReplayView.test.tsx`
Expected: FAIL — no `follow` prop / no LIVE badge.

- [ ] **Step 3: Implement**

In `web-viewer/src/replay/ReplayView.tsx`: change the React import to include `useEffect`
(`import { useEffect, useMemo } from 'react'`). Change the signature + add the live-tail effect:

```tsx
export function ReplayView({ runtime, timeline, cursorAt, follow }: {
  runtime: Runtime; timeline: Timeline; cursorAt: (absMs: number) => { x: number; y: number } | null
  follow?: { following: boolean; ended: boolean; onToggle: () => void }
}) {
  const steps = useMemo(() => flattenSteps(runtime), [runtime])
  const locale = runtime.locale ?? 'en'
  const clock = useReplayClock(timeline.durationMs)
  // live-tail: while following (and not ended), keep the view pinned to the latest event
  useEffect(() => {
    if (follow?.following && !follow.ended) clock.seek(timeline.durationMs)
  }, [follow?.following, follow?.ended, timeline.durationMs, clock.seek])
```

(the rest of the body is unchanged). In the `replay-controls` div, add the badge-button after the `speed`
label:

```tsx
        {follow && (
          <button aria-label="follow" onClick={follow.onToggle} disabled={follow.ended}
            style={{ color: follow.ended ? '#71717a' : follow.following ? '#e11d48' : '#a1a1aa', fontWeight: 600 }}>
            {follow.ended ? 'Ended' : follow.following ? '● LIVE' : 'Paused'}
          </button>
        )}
```

- [ ] **Step 4: Run + builds**

Run: `cd web-viewer && npx vitest run src/replay/ReplayView.test.tsx && npm run build && npm run build:lib`
Expected: PASS; both builds clean. (The existing ReplayView tests — single/multi-select, controls, cursor — must still pass; run `npx vitest run src/replay/ReplayView.test.tsx` shows the whole file.)

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/replay/ReplayView.tsx web-viewer/src/replay/ReplayView.test.tsx
git commit -m "feat(web-viewer): replay live-tail + LIVE/Paused/Ended follow badge

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: follow helpers + ReplayApp poller + param wiring

**Files:**
- Create: `web-viewer/src/replay/follow.ts`, `web-viewer/src/replay/follow.test.ts`
- Modify: `web-viewer/src/replay/ReplayApp.tsx`
- Create: `web-viewer/src/replay/ReplayApp.test.tsx`
- Modify: `web-viewer/src/app/bootstrap.ts`, `web-viewer/src/main.tsx`

**Interfaces:**
- Consumes: `ReplayView`'s `follow` prop (Task 1).
- Produces: `isTerminal(statements)`, `POLL_MS`, `NO_CHANGE_CAP`; `ReplayApp` accepts `follow?: boolean`; `Params.follow: boolean`.

- [ ] **Step 1: Write the failing helper test**

Create `web-viewer/src/replay/follow.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isTerminal } from './follow'

describe('isTerminal', () => {
  it('is true when a terminal verb is present', () => {
    for (const v of ['bdm:submitted', 'bdm:completed', 'bdm:consent_declined']) {
      expect(isTerminal([{ verb: 'bdm:started' }, { verb: v }] as any)).toBe(true)
    }
  })
  it('is false for a non-terminal stream', () => {
    expect(isTerminal([{ verb: 'bdm:started' }, { verb: 'bdm:trial_started' }] as any)).toBe(false)
    expect(isTerminal([] as any)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web-viewer && npx vitest run src/replay/follow.test.ts`
Expected: FAIL — `./follow` does not exist.

- [ ] **Step 3: Implement `follow.ts`**

Create `web-viewer/src/replay/follow.ts`:

```ts
import type { BdmEvent } from '../app/events'

export const POLL_MS = 4000
export const NO_CHANGE_CAP = 5   // stop after ~20s with no new statements (abandoned session)

const TERMINAL = new Set(['bdm:submitted', 'bdm:completed', 'bdm:consent_declined'])

export function isTerminal(statements: BdmEvent[]): boolean {
  return statements.some((s) => typeof s.verb === 'string' && TERMINAL.has(s.verb))
}
```

- [ ] **Step 4: Run green**

Run: `cd web-viewer && npx vitest run src/replay/follow.test.ts` → PASS.

- [ ] **Step 5: Write the failing poller test**

Create `web-viewer/src/replay/ReplayApp.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import mini from '../fixtures/mini.json'
import { POLL_MS } from './follow'

const { loadBundle } = vi.hoisted(() => ({ loadBundle: vi.fn() }))   // vi.hoisted: avoids the TDZ trap with vi.mock
vi.mock('./load', () => ({ loadBundle }))
import { ReplayApp } from './ReplayApp'

const bundle = (verbs: string[]) => ({ ok: true, bundle: { runtime: mini, statements: verbs.map((verb, i) => ({
  timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(), actor: { objectType: 'x', id: 'e' }, verb,
  object: { objectType: 'x', id: 's' } })), mouse: [] } })

beforeEach(() => { vi.useFakeTimers(); loadBundle.mockReset() })
afterEach(() => { vi.useRealTimers() })

describe('ReplayApp follow mode', () => {
  it('polls, extends, and stops on a terminal statement', async () => {
    loadBundle
      .mockResolvedValueOnce(bundle(['bdm:started']))                     // initial
      .mockResolvedValueOnce(bundle(['bdm:started', 'bdm:trial_started'])) // poll 1: grew
      .mockResolvedValueOnce(bundle(['bdm:started', 'bdm:trial_started', 'bdm:submitted'])) // poll 2: terminal
    await act(async () => { render(<ReplayApp src="http://vs/replay?token=t" follow />) })
    expect(await screen.findByRole('button', { name: /live/i })).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 1
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 2 → terminal
    expect(await screen.findByRole('button', { name: /ended/i })).toBeInTheDocument()
    const before = loadBundle.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS * 3) }) // no more polls after terminal
    expect(loadBundle.mock.calls.length).toBe(before)
  })
})
```

- [ ] **Step 6: Run to verify failure**

Run: `cd web-viewer && npx vitest run src/replay/ReplayApp.test.tsx`
Expected: FAIL — `ReplayApp` has no `follow` prop / no poller / no badge.

- [ ] **Step 7: Implement the poller in `ReplayApp.tsx`**

Rewrite `web-viewer/src/replay/ReplayApp.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { applyTheme } from '../app/theme'
import { getTheme, resolveThemeId } from '../theme/registry'
import { reconstruct } from './reconstruct'
import { buildCursor, findRecordingStartMs } from './cursor'
import { loadBundle, type ReplayBundle } from './load'
import { ReplayView } from './ReplayView'
import { isTerminal, POLL_MS, NO_CHANGE_CAP } from './follow'

type Phase = { kind: 'loading' } | { kind: 'error'; error: string } | { kind: 'ready'; bundle: ReplayBundle }

export function ReplayApp({ src, themeParam, follow = false }: { src: string; themeParam?: string | null; follow?: boolean }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [following, setFollowing] = useState(true)

  useEffect(() => {
    let live = true
    applyTheme(getTheme(resolveThemeId({ themeParam: themeParam ?? null })))
    loadBundle(src).then((r) => { if (live) setPhase(r.ok ? { kind: 'ready', bundle: r.bundle } : { kind: 'error', error: r.error }) })
    return () => { live = false }
  }, [src, themeParam])

  const ready = phase.kind === 'ready'
  useEffect(() => {
    if (!follow || !ready) return
    let cancelled = false
    let noChange = 0
    let lastLen = -1
    const id = setInterval(async () => {
      const r = await loadBundle(src)
      if (cancelled || !r.ok) return                       // transient error: keep last, keep polling
      setPhase((p) => (p.kind === 'ready' ? { kind: 'ready', bundle: r.bundle } : p))
      if (isTerminal(r.bundle.statements)) { clearInterval(id); return }   // session ended
      noChange = r.bundle.statements.length > lastLen ? 0 : noChange + 1
      lastLen = r.bundle.statements.length
      if (noChange >= NO_CHANGE_CAP) clearInterval(id)     // abandoned: stop polling
    }, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [follow, ready, src])

  if (phase.kind === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Loading replay…</div>
  if (phase.kind === 'error') return <div style={{ padding: 40, textAlign: 'center' }}><h1>Replay unavailable</h1><p>{phase.error}</p></div>

  const { runtime, statements, mouse } = phase.bundle
  const ended = isTerminal(statements)
  const timeline = reconstruct(statements)
  const recStart = findRecordingStartMs(statements) ?? timeline.startMs
  const cursorAt = buildCursor(mouse ?? [], recStart)
  return <ReplayView runtime={runtime} timeline={timeline} cursorAt={cursorAt}
    follow={follow ? { following, ended, onToggle: () => setFollowing((f) => !f) } : undefined} />
}
```

- [ ] **Step 8: Wire the `follow` param**

In `web-viewer/src/app/bootstrap.ts`: add `follow: boolean` to the `Params` type, and in `parseParams`
add (next to `replay`):

```ts
    follow: q.get('follow') === '1' || q.get('follow') === 'true',
```

In `web-viewer/src/main.tsx`, change the ReplayApp mount to pass `follow`:

```tsx
      ? <ReplayApp src={params.replay} themeParam={params.theme} follow={params.follow} />
```

- [ ] **Step 9: Run poller test + full suite + builds**

Run: `cd web-viewer && npx vitest run src/replay/ReplayApp.test.tsx` (PASS), then `npm test && npm run build && npm run build:lib` (full suite green; both builds clean).

- [ ] **Step 10: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/replay/follow.ts web-viewer/src/replay/follow.test.ts web-viewer/src/replay/ReplayApp.tsx web-viewer/src/replay/ReplayApp.test.tsx web-viewer/src/app/bootstrap.ts web-viewer/src/main.tsx
git commit -m "feat(web-viewer): replay follow-mode poller + follow param

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: participant-app — "Watch live" button

**Files:**
- Modify: `participant-app/src/studies/StudiesView.tsx`
- Test: `participant-app/src/studies/StudiesView.test.tsx`

**Interfaces:**
- Consumes: `mintReplayLink` (existing). Opens the follow URL.

- [ ] **Step 1: Write the failing test**

In `participant-app/src/studies/StudiesView.test.tsx`, extend the researcher route mock to serve the
replay-link mint, then add:

```tsx
test('researcher: Watch live opens the follow URL', async () => {
  const open = vi.fn()
  vi.stubGlobal('open', open)
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'in_progress', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link') && init?.method === 'POST') return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=enc' }), { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /watch live/i }))
  await waitFor(() => expect(open).toHaveBeenCalledWith('http://p/?replay=enc&follow=1', '_blank', 'noopener'))
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd participant-app && npx vitest run src/studies/StudiesView.test.tsx`
Expected: FAIL — no "Watch live" button.

- [ ] **Step 3: Implement**

In `participant-app/src/studies/StudiesView.tsx`, add a handler next to `copyLink`/`revokeLinks`:

```tsx
  async function watchLive(sid: string) {
    try {
      const link = await mintReplayLink(vsBaseUrl, session.authFetch, selected, sid)
      if (!link.replay_url) { setCopied((c) => ({ ...c, [sid]: 'Set WEB_VIEWER_BASE_URL to watch live' })); return }
      const url = link.replay_url + (link.replay_url.includes('?') ? '&' : '?') + 'follow=1'
      window.open(url, '_blank', 'noopener')
      setCopied((c) => ({ ...c, [sid]: 'Opened live view' }))
    } catch {
      setCopied((c) => ({ ...c, [sid]: 'Could not open live view' }))
    }
  }
```

and a button in the per-session action group (after "Revoke links"):

```tsx
                  <button onClick={() => void watchLive(s.session_id)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                    Watch live
                  </button>
```

- [ ] **Step 4: Run green + full suite + build**

Run: `cd participant-app && npx vitest run src/studies/StudiesView.test.tsx` (PASS), then `npm test && npm run build`.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add participant-app/src/studies/StudiesView.tsx participant-app/src/studies/StudiesView.test.tsx
git commit -m "feat(participant-app): Watch live button in /studies (opens follow URL)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Docs + status (docs-only; controller merges)

**Files:**
- Modify: `web-viewer/docs/replay.md`, `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md`

- [ ] **Step 1: Doc "Watch live"**

In `web-viewer/docs/replay.md` (no-space em-dashes), add a short note: launching a replay link with
`&follow=1` (the `/studies` "Watch live" button) polls the session every ~4s and keeps the view at the
latest event, stopping when the session ends. Point at the poll cadence matching the player's ~5s event
flush.

- [ ] **Step 2: Mark #7-5 done — #7 complete**

Match each legacy file's spaced-em-dash strike-through idiom, dated 2026-07-03:
- `web-viewer/FOLLOWUPS.md` + `viewer-service/FOLLOWUPS.md` — strike the "incremental live-follow" RP3 bullet done.
- `HANDOFF.md` — the #7 "Remaining (RP3 follow-ons)" list is now empty; update that line to note **#7 replay
  (RP1/RP2/RP3 + all follow-ons) is fully complete** (or remove the "Remaining" clause). Keep edits surgical.

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/docs/replay.md web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md HANDOFF.md
git commit -m "docs: replay live-follow done (#7-5); #7 replay track fully complete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 (controller): final review + merge

- [ ] Full green: `( cd web-viewer && npm test && npm run build && npm run build:lib )`; `( cd participant-app && npm test && npm run build )`.
- [ ] `git fetch origin && git switch master && git merge --ff-only origin/master && git merge --no-ff work/replay-live-follow && git push origin master` (rebase on reject; never force-push).

---

## Self-Review

**1. Spec coverage:**
- `follow` param + `ReplayApp` poller (stop-on-terminal, no-change cap, non-fatal errors) → Task 2. ✅
- `ReplayView` live-tail + LIVE/Paused/Ended badge → Task 1. ✅
- `/studies` "Watch live" (opens `follow=1`, null-`replay_url` note) → Task 3. ✅
- Tests: `isTerminal`, poller (fake timers), ReplayView live-tail → Tasks 1-2; Watch-live → Task 3. ✅
- Doc + FOLLOWUPS + HANDOFF (#7 complete) → Task 4. ✅

**2. Placeholder scan:** No TBD/vague. All code complete; poller stop-conditions explicit.

**3. Type/name consistency:** `follow` prop shape `{ following, ended, onToggle }` is produced by `ReplayApp` (Task 2) and consumed by `ReplayView` (Task 1 defines it) — Task 1 lands the prop first so Task 2's `ReplayApp` typechecks against it. `isTerminal`/`POLL_MS`/`NO_CHANGE_CAP` from `follow.ts` used by `ReplayApp` + tests. `Params.follow` (bootstrap) → `main.tsx` → `ReplayApp.follow`. `mintReplayLink` return `{token, bundle_url, replay_url}` matches the Watch-live handler. Live-tail effect depends on `timeline.durationMs` growth (from the poller's extended statements).
