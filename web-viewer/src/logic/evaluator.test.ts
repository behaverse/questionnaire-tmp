import { makeFakeEvaluator, wasmAdapter } from './evaluator'

test('makeFakeEvaluator drives condition from a table and delegates helpers', () => {
  const ev = makeFakeEvaluator({ 'a == 1': true, 'a == 2': false })
  expect(ev.condition('a == 1', { var: () => 1, score: () => null })).toBe(true)
  expect(ev.condition('a == 2', { var: () => 1, score: () => null })).toBe(false)
  expect(ev.condition('unlisted', { var: () => null, score: () => null })).toBe(false)
  expect(ev.reversedValue(1, 0, 6)).toBe(5)
  expect(ev.compareSolution('equals', 3, 3)).toBe(true)
  expect(ev.check('anything')).toBeNull()
})
test('makeFakeEvaluator supports a function table for binding-dependent results', () => {
  const ev = makeFakeEvaluator({ 'a == 1': (b) => b.var('a') === 1 })
  expect(ev.condition('a == 1', { var: () => 1, score: () => null })).toBe(true)
  expect(ev.condition('a == 1', { var: () => 2, score: () => null })).toBe(false)
})
test('wasmAdapter maps the WASM exports onto the port (calls + result mapping)', () => {
  const calls: unknown[][] = []
  const exports = {
    evaluate_condition: (expr: string, b: unknown) => { calls.push(['cond', expr, b]); return expr === 'yes' },
    reversed: (v: number, mn: number, mx: number) => { calls.push(['rev', v, mn, mx]); return mx + mn - v },
    compare: (cmp: string, r: unknown, e: unknown) => { calls.push(['cmp', cmp, r, e]); return r === e },
    check_expression: (expr: string) => (expr === 'bad' ? 'parse error at 0: x' : undefined),
  }
  const ev = wasmAdapter(exports as never)
  const bindings = { var: () => 1, score: () => null }
  expect(ev.condition('yes', bindings)).toBe(true)
  expect(ev.condition('no', bindings)).toBe(false)
  expect(ev.reversedValue(1, 0, 6)).toBe(5)
  expect(ev.compareSolution('equals', 2, 2)).toBe(true)
  expect(ev.check('bad')).toBe('parse error at 0: x')
  expect(ev.check('ok')).toBeNull()
  expect(calls[0]).toEqual(['cond', 'yes', bindings])
})
