import { describe, expect, it } from 'vitest'
import { runOnce, type Driver } from './driver'
import { makeRng, type Profile } from './profile'
import type { Decision, ItemView } from './strategy'

const profile: Profile = { choice_strategy: 'midpoint', timing: { think_ms_min: 0, think_ms_max: 0 }, pointer: 'minimal', text: 'x' }

/** A scripted driver: a list of steps, each a list of ItemViews; finishes after the last. */
class FakeDriver implements Driver {
  applied: Array<{ item: ItemView; decision: Decision }> = []
  private i = 0
  constructor(private steps: ItemView[][]) {}
  async consentIfPresent() { return false }
  async atFinish() { return this.i >= this.steps.length }
  async readItems() { return this.steps[this.i] ?? [] }
  async apply(item: ItemView, decision: Decision) { this.applied.push({ item, decision }) }
  async next() { this.i += 1; return true }
}

describe('runOnce', () => {
  const sleep = async () => {}
  it('answers every item on every step and stops at finish', async () => {
    const d = new FakeDriver([[{ kind: 'choice', id: 'a', nOptions: 5 }], [], [{ kind: 'text', id: 'b' }]])
    const r = await runOnce(d, profile, { rng: makeRng(1), sleep })
    expect(r.finished).toBe(true)
    expect(r.steps).toBe(3)
    expect(d.applied.map((x) => x.item.id)).toEqual(['a', 'b']) // the empty (message) step answers nothing
    expect(d.applied[0]?.decision).toEqual({ kind: 'choice', index: 2 })
  })
  it('respects maxSteps when finish never arrives', async () => {
    const never: Driver = { consentIfPresent: async () => false, atFinish: async () => false, readItems: async () => [], apply: async () => {}, next: async () => true }
    const r = await runOnce(never, profile, { rng: makeRng(1), sleep, maxSteps: 4 })
    expect(r).toEqual({ steps: 4, finished: false })
  })
})
