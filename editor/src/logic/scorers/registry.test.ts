import { describe, it, expect } from 'vitest'
import { scorerImpl, isKnownScorer, PHQ9_SHA256 } from './registry'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

describe('scorer registry', () => {
  it('resolves the bundled PHQ-9 impl by bare id (ignoring the version)', () => {
    const impl = scorerImpl('scr_phq9@v26.0602')
    expect(impl).toEqual({ kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA256 })
    expect(isKnownScorer('scr_phq9@v99.9999')).toBe(true)
  })
  it('returns null for an unknown scorer', () => {
    expect(scorerImpl('scr_other@v26.0602')).toBeNull()
    expect(isKnownScorer('scr_other@v26.0602')).toBe(false)
  })
  it('the bundled phq9.wasm matches the registry sha256 (drift guard)', () => {
    // pretest runs ensure-scorers.mjs, so the bundled wasm exists.
    const wasm = resolve(__dirname, '../../../public/scorers/phq9.wasm')
    const sha = createHash('sha256').update(readFileSync(wasm)).digest('hex')
    expect(sha).toBe(PHQ9_SHA256)
  })
})
