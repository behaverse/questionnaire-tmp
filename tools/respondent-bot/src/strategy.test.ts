import { describe, expect, it } from 'vitest'
import { makeRng } from './profile'
import { decide, thinkTime, type ItemView } from './strategy'
import type { Profile } from './profile'

const base: Profile = { choice_strategy: 'random', timing: { think_ms_min: 100, think_ms_max: 300 }, pointer: 'minimal', text: 'hi' }
const p = (s: Profile['choice_strategy'], extra: Partial<Profile> = {}): Profile => ({ ...base, choice_strategy: s, ...extra })
const choice = (n: number): ItemView => ({ kind: 'choice', id: 'it', nOptions: n })
const number = (min: number, max: number, step = 1): ItemView => ({ kind: 'number', id: 'it', min, max, step })

describe('decide — determinism', () => {
  it('same seed + profile ⇒ same decision', () => {
    const d1 = decide(choice(5), p('random'), makeRng(7))
    const d2 = decide(choice(5), p('random'), makeRng(7))
    expect(d1).toEqual(d2)
  })
})

describe('decide — choice strategies on a 5-point scale', () => {
  it('midpoint picks the centre', () => {
    expect(decide(choice(5), p('midpoint'), makeRng(1))).toEqual({ kind: 'choice', index: 2 })
  })
  it('straight_line always picks index 0 regardless of seed', () => {
    for (const s of [1, 2, 99]) expect(decide(choice(5), p('straight_line'), makeRng(s))).toEqual({ kind: 'choice', index: 0 })
  })
  it('extreme picks an endpoint', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const d = decide(choice(5), p('extreme'), makeRng(s))
      expect(d.kind === 'choice' && (d.index === 0 || d.index === 4)).toBe(true)
    }
  })
  it('acquiescence skews to the high end (above the midpoint)', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      const d = decide(choice(5), p('acquiescence'), makeRng(s))
      expect(d.kind === 'choice' && d.index >= 3).toBe(true)
    }
  })
  it('random stays in range', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const d = decide(choice(5), p('random'), makeRng(s))
      expect(d.kind === 'choice' && d.index >= 0 && d.index <= 4).toBe(true)
    }
  })
})

describe('decide — number scales', () => {
  it('midpoint of 0..100 (step 1) is 50', () => {
    expect(decide(number(0, 100), p('midpoint'), makeRng(1))).toEqual({ kind: 'number', value: 50 })
  })
  it('extreme of 1..7 is an endpoint', () => {
    const d = decide(number(1, 7), p('extreme'), makeRng(2))
    expect(d.kind === 'number' && (d.value === 1 || d.value === 7)).toBe(true)
  })
  it('snaps to the step grid', () => {
    const d = decide(number(0, 10, 2), p('random'), makeRng(3))
    expect(d.kind === 'number' && d.value % 2 === 0).toBe(true)
  })
})

describe('decide — text + fixed', () => {
  it('text uses the profile text', () => {
    expect(decide({ kind: 'text', id: 'q' }, p('random', { text: 'canned' }), makeRng(1))).toEqual({ kind: 'text', text: 'canned' })
  })
  it('fixed honours a per-id choice index', () => {
    expect(decide(choice(5), p('fixed', { fixed: { it: 4 } }), makeRng(1))).toEqual({ kind: 'choice', index: 4 })
  })
  it('fixed falls back to random for an unmapped id', () => {
    const d = decide(choice(5), p('fixed', { fixed: { other: 1 } }), makeRng(1))
    expect(d.kind === 'choice' && d.index >= 0 && d.index <= 4).toBe(true)
  })
  it('fixed text overrides the profile text by id', () => {
    expect(decide({ kind: 'text', id: 'q' }, p('fixed', { fixed: { q: 'mapped' }, text: 'default' }), makeRng(1))).toEqual({ kind: 'text', text: 'mapped' })
  })
})

describe('thinkTime', () => {
  it('stays within the profile window', () => {
    for (const s of [1, 2, 3]) {
      const t = thinkTime(base, makeRng(s))
      expect(t).toBeGreaterThanOrEqual(100)
      expect(t).toBeLessThanOrEqual(300)
    }
  })
})
