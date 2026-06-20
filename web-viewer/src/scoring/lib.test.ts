import { describe, it, expect } from 'vitest'
import * as scoring from './lib'

describe('scoring lib entry', () => {
  it('exposes the engine functions the editor consumes', () => {
    expect(typeof scoring.compileScorers).toBe('function')
    expect(typeof scoring.makeScoreCache).toBe('function')
    expect(typeof scoring.fetchScorerWasm).toBe('function')
  })
})
