import { isElementVisible, stepHasVisibleElement, visibleEntries } from './visibility'
import { collectPrograms } from './compile'
import { makeFakeEvaluator } from './evaluator'
import { flattenSteps } from '../app/steps'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const item = (id: string, show_if?: string) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, ...(show_if ? { show_if } : {}) })
const rt = (): Runtime => ({
  provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
  pages: [{ id: 'p1', elements: [item('it_a'), item('it_b', 'it_a == 0')] }],
  logic: [{ id: 'r_hide', type: 'visibility', condition: 'it_a == 9', action: { target_id: 'it_a', show: false } }],
} as never)

function ctx(answers: Record<string, unknown>, table: Record<string, boolean>) {
  const ev = makeFakeEvaluator(table)
  return { ev, programs: collectPrograms(rt(), ev), bindings: { var: (id: string) => answers[id] ?? null, score: () => null } }
}

test('show_if absent → visible; show_if true → visible; false → hidden', () => {
  const c = ctx({ it_a: 0 }, { 'it_a == 0': true, 'it_a == 9': false })
  expect(isElementVisible('it_a', c.programs, c.ev, c.bindings)).toBe(true)
  expect(isElementVisible('it_b', c.programs, c.ev, c.bindings)).toBe(true)
  const c2 = ctx({ it_a: 1 }, { 'it_a == 0': false, 'it_a == 9': false })
  expect(isElementVisible('it_b', c2.programs, c2.ev, c2.bindings)).toBe(false)
})
test('visibility rule show:false hides its target even when show_if would pass', () => {
  const c = ctx({ it_a: 9 }, { 'it_a == 0': false, 'it_a == 9': true })
  expect(isElementVisible('it_a', c.programs, c.ev, c.bindings)).toBe(false)
})
test('stepHasVisibleElement + visibleEntries reflect visibility', () => {
  const steps = flattenSteps(rt())
  const stepB = steps[1]
  const c = ctx({ it_a: 1 }, { 'it_a == 0': false, 'it_a == 9': false })
  expect(stepHasVisibleElement(stepB, c.programs, c.ev, c.bindings)).toBe(false)
  expect(visibleEntries(stepB, c.programs, c.ev, c.bindings)).toEqual([])
})
