import { describe, it, expect, vi } from 'vitest'
import { mapLimit, withRetry } from './concurrency'

describe('mapLimit', () => {
  it('never exceeds the concurrency limit and preserves order', async () => {
    let active = 0, peak = 0
    const work = async (n: number) => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--; return n * 2
    }
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 2, work)
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14])
    expect(peak).toBeLessThanOrEqual(2)
  })
  it('handles an empty list', async () => {
    expect(await mapLimit([], 3, async (x) => x)).toEqual([])
  })
})

describe('withRetry', () => {
  it('retries once after a failure then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    expect(await withRetry(fn, { retries: 1, backoffMs: 1 })).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
  it('rethrows after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always'))
    await expect(withRetry(fn, { retries: 1, backoffMs: 1 })).rejects.toThrow('always')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
