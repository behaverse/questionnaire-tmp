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
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })   // flush the initial loadBundle microtask
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 1
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS) })   // poll 2 → terminal
    expect(screen.getByRole('button', { name: /ended/i })).toBeInTheDocument()
    const before = loadBundle.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS * 3) }) // no more polls after terminal
    expect(loadBundle.mock.calls.length).toBe(before)
  })
})
