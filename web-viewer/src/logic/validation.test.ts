import { validateStep } from './validation'
import { makeFakeEvaluator } from './evaluator'
import type { Programs } from './compile'
import type { Step } from '../app/steps'

const numItem = (id: string, validation?: unknown) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } },
     option: { input_data_type: 'number', measurement_type: 'ratio' }, ...(validation ? { validation } : {}) })
const txtItem = (id: string, validation?: unknown) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } },
     option: { input_data_type: 'text', measurement_type: 'nominal' }, ...(validation ? { validation } : {}) })
const step = (els: unknown[]): Step => ({ pageId: 'p1', elements: els.map((e) => ({ key: (e as { id: string }).id, element: e as never })) })
const noPrograms: Programs = { showIf: new Map(), rules: [], crossValidation: [] }

test('range validation: out-of-range fails with its message', () => {
  const s = step([numItem('it_age', { range: [0, 120], range_message: 'age 0–120' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_age: 200 }, () => null, 'en')).toEqual([{ key: 'it_age', message: 'age 0–120' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_age: 30 }, () => null, 'en')).toEqual([])
})
test('length validation on text', () => {
  const s = step([txtItem('it_code', { length: [3, 5], length_message: '3–5 chars' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_code: 'ab' }, () => null, 'en')).toEqual([{ key: 'it_code', message: '3–5 chars' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_code: 'abcd' }, () => null, 'en')).toEqual([])
})
test('format (regex) validation', () => {
  const s = step([txtItem('it_year', { format: '^\\d{4}$', format_message: '4 digits' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_year: 'xx' }, () => null, 'en')).toEqual([{ key: 'it_year', message: '4 digits' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_year: '1990' }, () => null, 'en')).toEqual([])
})
test('empty optional answer skips per-question validation', () => {
  const s = step([numItem('it_age', { range: [0, 120] })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), {}, () => null, 'en')).toEqual([])
})
test('cross-question rule: condition true ⇒ error on each target', () => {
  const programs: Programs = { showIf: new Map(), rules: [],
    crossValidation: [{ id: 'v', condition: 'mismatch', message: 'fix it', targets: ['it_a', 'it_b'] }] }
  const ev = makeFakeEvaluator({ mismatch: true })
  expect(validateStep(step([]), programs, ev, {}, () => null, 'en'))
    .toEqual([{ key: 'it_a', message: 'fix it' }, { key: 'it_b', message: 'fix it' }])
})
