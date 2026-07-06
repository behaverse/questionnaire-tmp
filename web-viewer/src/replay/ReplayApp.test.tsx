import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import mini from '../fixtures/mini.json'
import { POLL_MS, NO_CHANGE_CAP, FAIL_CAP } from './follow'

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
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })   // flush the initial loadBundle microtask
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 1
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 2 → terminal
    expect(screen.getByRole('button', { name: /ended/i })).toBeInTheDocument()
    const before = loadBundle.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS * 3) }) // no more polls after terminal
    expect(loadBundle.mock.calls.length).toBe(before)
  })

  it('stops polling after FAIL_CAP consecutive failures, keeping the last good bundle', async () => {
    loadBundle
      .mockResolvedValueOnce(bundle(['bdm:started']))                     // initial: ok
      .mockResolvedValue({ ok: false, error: 'x' })                       // every poll thereafter: fails
    await act(async () => { render(<ReplayApp src="http://vs/replay?token=t" follow />) })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })   // flush the initial loadBundle microtask
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
    for (let i = 0; i < FAIL_CAP + 2; i++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })
    }
    expect(loadBundle.mock.calls.length).toBe(1 + FAIL_CAP)   // plateaus: interval cleared after FAIL_CAP failures
    expect(screen.queryByText(/replay unavailable/i)).not.toBeInTheDocument()   // last good bundle retained
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
    const before = loadBundle.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS * 3) }) // no more polls after fail-cap stop
    expect(loadBundle.mock.calls.length).toBe(before)
  })

  it('stops polling after NO_CHANGE_CAP polls with no new statements', async () => {
    loadBundle
      .mockResolvedValueOnce(bundle(['bdm:started']))                     // initial: ok, non-terminal
      .mockResolvedValue(bundle(['bdm:started']))                         // every poll thereafter: same length, non-terminal
    await act(async () => { render(<ReplayApp src="http://vs/replay?token=t" follow />) })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })   // flush the initial loadBundle microtask
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
    for (let i = 0; i < NO_CHANGE_CAP + 2; i++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })
    }
    // lastLen starts at -1, so the first interval poll always resets noChange to 0 (a free reference poll);
    // NO_CHANGE_CAP more stagnant polls are then needed to trip the cap: 1 initial + 1 reference + NO_CHANGE_CAP.
    expect(loadBundle.mock.calls.length).toBe(2 + NO_CHANGE_CAP)   // plateaus: interval cleared after NO_CHANGE_CAP no-change polls
    const before = loadBundle.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS * 3) }) // no more polls after no-change stop
    expect(loadBundle.mock.calls.length).toBe(before)
  })
})
