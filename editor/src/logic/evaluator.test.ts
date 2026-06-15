import { describe, it, expect } from 'vitest'
import { wasmAdapter, makeFakeEvaluator, type WasmExports } from './evaluator'

const exports: WasmExports = {
  evaluate_condition: (expr) => expr === 'yes',
  reversed: (v, min, max) => max + min - v,
  compare: (_cmp, r, e) => JSON.stringify(r) === JSON.stringify(e),
  check_expression: (expr) => (expr === 'bad' ? 'parse error at 0: x' : undefined),
}

describe('wasmAdapter', () => {
  const ev = wasmAdapter(exports)
  it('condition delegates to evaluate_condition', () => {
    expect(ev.condition('yes', { var: () => null, score: () => null })).toBe(true)
    expect(ev.condition('no', { var: () => null, score: () => null })).toBe(false)
  })
  it('condition returns false when the export throws', () => {
    const ev2 = wasmAdapter({ ...exports, evaluate_condition: () => { throw new Error('boom') } })
    expect(ev2.condition('x', { var: () => null, score: () => null })).toBe(false)
  })
  it('check maps undefined -> null and passes through messages', () => {
    expect(ev.check('ok')).toBeNull()
    expect(ev.check('bad')).toBe('parse error at 0: x')
  })
})

describe('makeFakeEvaluator', () => {
  it('uses the table for condition and check returns null', () => {
    const ev = makeFakeEvaluator({ 'a == 1': true })
    expect(ev.condition('a == 1', { var: () => null, score: () => null })).toBe(true)
    expect(ev.condition('other', { var: () => null, score: () => null })).toBe(false)
    expect(ev.check('anything')).toBeNull()
  })
})
