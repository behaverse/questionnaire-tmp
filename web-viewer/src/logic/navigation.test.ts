import { nextStepIndex, pageFirstStepIndex } from './navigation'
import { collectPrograms } from './compile'
import { makeFakeEvaluator } from './evaluator'
import { flattenSteps } from '../app/steps'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const item = (id: string, show_if?: string) => ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, ...(show_if ? { show_if } : {}) })
const rt = (): Runtime => ({
  provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [item('it_1')] },
    { id: 'p2', elements: [item('it_2', 'it_1 == 0')] },
    { id: 'p3', elements: [item('it_3')] },
  ],
  logic: [{ id: 'r_skip', type: 'skip', condition: 'it_1 == 9', action: { skip_to: 'p3' } }],
} as never)

function ctx(table: Record<string, boolean>, answers: Record<string, unknown> = {}) {
  const ev = makeFakeEvaluator(table)
  return { steps: flattenSteps(rt()), programs: collectPrograms(rt(), ev), ev,
           bindings: { var: (id: string) => answers[id] ?? null, score: () => null } }
}

test('linear advance to the next visible step', () => {
  const c = ctx({ 'it_1 == 0': true, 'it_1 == 9': false })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(1)
})
test('hidden step is skipped', () => {
  const c = ctx({ 'it_1 == 0': false, 'it_1 == 9': false })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(2)
})
test('skip rule (condition true) jumps forward to its target page', () => {
  const c = ctx({ 'it_1 == 0': false, 'it_1 == 9': true })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(2)
})
test('past the last reachable step → null (finishing)', () => {
  const c = ctx({ 'it_1 == 0': true, 'it_1 == 9': false })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 2)).toBeNull()
})
test('pageFirstStepIndex finds the first step of a page', () => {
  const c = ctx({})
  expect(pageFirstStepIndex(c.steps, 'p3')).toBe(2)
  expect(pageFirstStepIndex(c.steps, 'nope')).toBeNull()
})
