import { describe, expect, it } from 'vitest'
import { makeRng, resolveProfile, PRESETS } from './profile'

describe('makeRng', () => {
  it('is deterministic for a seed', () => {
    const a = makeRng(42); const b = makeRng(42)
    const seqA = [a(), a(), a()]; const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true)
  })
  it('differs across seeds', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)())
  })
})

describe('resolveProfile', () => {
  it('returns a built-in preset', () => {
    expect(resolveProfile('acquiescence').choice_strategy).toBe('acquiescence')
  })
  it('throws on an unknown name, listing the known ones', () => {
    expect(() => resolveProfile('nope')).toThrow(/unknown profile.*random/)
  })
  it('every preset has timing + text', () => {
    for (const p of Object.values(PRESETS)) {
      expect(p.timing.think_ms_max).toBeGreaterThanOrEqual(p.timing.think_ms_min)
      expect(typeof p.text).toBe('string')
    }
  })
})
