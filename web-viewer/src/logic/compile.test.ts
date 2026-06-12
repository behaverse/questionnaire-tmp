import { collectPrograms } from './compile'
import { makeBindings } from './bindings'
import { makeFakeEvaluator } from './evaluator'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const runtime = (): Runtime => ({
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [
      { id: 'it_1', question: { prompt: { content: { en: { text: 'Q1' } } } }, option: opt },
      { id: 'it_2', question: { prompt: { content: { en: { text: 'Q2' } } } }, option: opt, show_if: 'it_1 == 0' },
    ] },
    { id: 'p2', elements: [{ id: 'it_3', question: { prompt: { content: { en: { text: 'Q3' } } } }, option: opt }] },
  ],
  logic: [
    { id: 'r_skip', type: 'skip', condition: 'it_1 == 0', action: { skip_to: 'p2' } },
    { id: 'r_bad', type: 'branch', condition: '1 +', action: { skip_to: 'p2' } },
  ],
  validation: [{ id: 'v_x', condition: 'is_empty(it_3)', message: 'pick one', targets: ['it_3'] }],
} as never)

test('collectPrograms compiles show_if, rules, cross-validation; drops malformed rules (fail-safe)', () => {
  // fake evaluator: check() flags '1 +' as malformed (return non-null), everything else valid
  const ev = makeFakeEvaluator()
  ;(ev as { check: (e: string) => string | null }).check = (e) => (e.trim().endsWith('+') ? 'parse error' : null)
  const programs = collectPrograms(runtime(), ev)
  expect(programs.showIf.has('it_2')).toBe(true)
  expect(programs.rules.map((r) => r.id)).toEqual(['r_skip'])
  expect(programs.crossValidation.map((v) => v.id)).toEqual(['v_x'])
})
test('makeBindings: var reads answers; falls through to score resolver for unknown ids', () => {
  const b = makeBindings({ it_1: 0 }, runtime(), { score: (id) => (id === 'sc' ? 42 : null) })
  expect(b.var('it_1')).toBe(0)
  expect(b.var('sc')).toBe(42)
  expect(b.var('nope')).toBeNull()
  expect(b.score('sc')).toBe(42)
})
