import { nullResolver, scoredValueFor, solutionCorrect, comparatorFor } from './scoring'
import { makeFakeEvaluator } from './evaluator'

test('nullResolver returns null for every score id (deferred Scorer host)', () => {
  expect(nullResolver.score('phq9_total')).toBeNull()
})
test('scoredValueFor applies reversed_value only when the prompt is reversed and the option is bounded', () => {
  const ev = makeFakeEvaluator()
  const opt = { input_data_type: 'choice', measurement_type: 'ordinal', options: [{ index: 1, value: 0 }, { index: 2, value: 6 }] }
  expect(scoredValueFor(opt, { reversed: true }, 1, ev)).toBe(5)
  expect(scoredValueFor(opt, { reversed: false }, 1, ev)).toBe(1)
  expect(scoredValueFor(opt, { reversed: true }, 'x', ev)).toBe('x')
})
test('scoredValueFor reverses number-interval/ratio scales via option min/max (no discrete options)', () => {
  const ev = makeFakeEvaluator()
  const numOpt = { input_data_type: 'number', measurement_type: 'interval', min: 1, max: 7 } // SHS-style 1–7 scale
  expect(scoredValueFor(numOpt, { reversed: true }, 2, ev)).toBe(6)   // 1 + 7 − 2
  expect(scoredValueFor(numOpt, { reversed: false }, 2, ev)).toBe(2)
  // a truly unbounded number (no min/max, no options) is returned unchanged
  expect(scoredValueFor({ input_data_type: 'number' }, { reversed: true }, 2, ev)).toBe(2)
})
test('comparatorFor derives from the option triple', () => {
  expect(comparatorFor({ input_data_type: 'choice', selection: 'single' } as never)).toBe('equals')
  expect(comparatorFor({ input_data_type: 'choice', selection: 'multiple' } as never)).toBe('set_equals')
  expect(comparatorFor({ input_data_type: 'text' } as never)).toBe('matches_regex')
})
test('solutionCorrect compares via the derived comparator', () => {
  const ev = makeFakeEvaluator()
  const item = { option: { input_data_type: 'choice', selection: 'single' }, solution: { expected_response: 3 } }
  expect(solutionCorrect(item as never, 3, ev)).toBe(true)
  expect(solutionCorrect(item as never, 2, ev)).toBe(false)
  expect(solutionCorrect({ option: {} } as never, 1, ev)).toBeNull()
})
