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
