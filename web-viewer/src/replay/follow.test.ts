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
