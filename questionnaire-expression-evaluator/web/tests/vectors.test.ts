import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const wasm = require('../pkg/questionnaire_expr_web.js')
const vectors = JSON.parse(readFileSync(new URL('../../test_vectors.json', import.meta.url), 'utf8'))

function bindings(vars: Record<string, unknown>, scores: Record<string, unknown>) {
  return {
    var: (id: string) => (id in vars ? vars[id] : id in scores ? scores[id] : null),
    score: (id: string) => (id in scores ? scores[id] : null),
  }
}

describe('conditions', () => {
  for (const c of vectors.conditions) {
    test(c.expr, () => {
      expect(wasm.evaluate_condition(c.expr, bindings(c.vars, c.scores))).toBe(c.expect)
    })
  }
})
describe('reversed_value', () => {
  for (const c of vectors.reversed_value) {
    test(`${c.value}/${c.min}/${c.max}`, () => expect(wasm.reversed(c.value, c.min, c.max)).toBe(c.expect))
  }
})
describe('compare_solution', () => {
  for (const c of vectors.compare_solution) {
    test(`${c.cmp}`, () => expect(wasm.compare(c.cmp, c.response, c.expected)).toBe(c.expect))
  }
})
test('check_expression flags a parse error', () => {
  expect(wasm.check_expression('1 +')).toMatch(/parse error/)
  expect(wasm.check_expression('a >= 10')).toBeUndefined()
})
