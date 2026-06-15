import {
  setInputDataType, setMeasurementType, setSelection, addChoice, removeChoice,
  reorderChoice, setChoiceValue, setChoiceText, setLabel, setUnits, setBounds,
  setInputValidation, setPlaceholderText, setHelpText, setValidation, type EditableOption,
} from './ops'
import { validateQuestionnaire } from '../model/validation'

const choice = (): EditableOption => ({
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { status: 'validated', label: 'Scale', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
})

// Wrap an option into a minimal valid questionnaire to assert round-trip validity.
function wrap(opt: EditableOption) {
  return {
    '@context': 'x',
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609' } }, option: opt }] }],
  }
}

test('addChoice appends an aligned structural + content row and renumbers', () => {
  const o = addChoice(choice(), 'en')
  expect(o.options).toHaveLength(3)
  expect(o.options!.map((r) => r.index)).toEqual([1, 2, 3])
  expect(o.content.en.options!.map((r) => r.index)).toEqual([1, 2, 3])
  expect(o.content.en.options![2].text).toBe('Option 3')
  expect(o.options![2].value).toBeNull()
})

test('removeChoice drops the row in structural + every locale and renumbers contiguously', () => {
  const base: EditableOption = { ...choice(), content: {
    en: { status: 'validated', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Maybe' }, { index: 3, text: 'Yes' }] },
    pt: { status: 'validated', options: [{ index: 1, text: 'Não' }, { index: 2, text: 'Talvez' }, { index: 3, text: 'Sim' }] },
  }, options: [{ index: 1, value: 0 }, { index: 2, value: 1 }, { index: 3, value: 2 }] }
  const o = removeChoice(base, 2) // remove index 2 (the middle)
  expect(o.options!.map((r) => r.index)).toEqual([1, 2])
  expect(o.content.en.options!.map((r) => r.text)).toEqual(['No', 'Yes'])
  expect(o.content.pt.options!.map((r) => r.text)).toEqual(['Não', 'Sim'])
})

test('reorderChoice moves a row (text follows) and renumbers', () => {
  const o = reorderChoice(choice(), 1, 2) // move pos0→pos1 (index1 after index2)
  expect(o.content.en.options!.map((r) => r.text)).toEqual(['Yes', 'No'])
  expect(o.options!.map((r) => r.index)).toEqual([1, 2])
})

test('setChoiceValue / setChoiceText address by index', () => {
  let o = setChoiceValue(choice(), 2, null)
  expect(o.options![1].value).toBeNull()
  o = setChoiceText(o, 1, 'en', 'Disagree')
  expect(o.content.en.options![0].text).toBe('Disagree')
})

test('setInputDataType choice→number prunes choice fields, keeps label', () => {
  const o = setInputDataType(choice(), 'number')
  expect(o.input_data_type).toBe('number')
  expect(o.options).toBeUndefined()
  expect(o.selection).toBeUndefined()
  expect(o.content.en.options).toBeUndefined()
  expect(o.content.en.label).toBe('Scale') // label survives
})

test('setInputDataType text→choice creates >=2 rows + single selection', () => {
  const text: EditableOption = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'Name' } } }
  const o = setInputDataType(text, 'choice')
  expect(o.selection).toBe('single')
  expect(o.options!.length).toBeGreaterThanOrEqual(2)
  expect(o.content.en.options!.length).toBe(o.options!.length)
})

test('setSelection single clears min/max_selected', () => {
  const o = setSelection({ ...choice(), selection: 'multiple', min_selected: 1, max_selected: 2 }, 'single')
  expect(o.selection).toBe('single')
  expect(o.min_selected).toBeUndefined()
  expect(o.max_selected).toBeUndefined()
})

test('numeric bounds + units, text validation + placeholder/help write canonical shapes', () => {
  let n: EditableOption = { input_data_type: 'number', measurement_type: 'ratio', content: { en: { status: 'draft' } } }
  n = setBounds(n, { min: 0, max: 168, step: 1 })
  n = setUnits(n, 'en', 'h/week')
  expect(n.min).toBe(0); expect(n.max).toBe(168); expect(n.step).toBe(1)
  expect(n.content.en.units).toBe('h/week')
  n = setPlaceholderText(n, 'en', 'e.g. 5')
  expect((n.placeholder as { content: Record<string, { text: string }> }).content.en.text).toBe('e.g. 5')
  let t: EditableOption = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft' } } }
  t = setInputValidation(t, '^(19|20)\\d{2}$')
  t = setHelpText(t, 'en', 'Four-digit year')
  expect(t.input_validation).toBe('^(19|20)\\d{2}$')
  expect((t.help as { content: Record<string, { text: string }> }).content.en.text).toBe('Four-digit year')
})

test('setMeasurementType + setLabel; empty placeholder text removes placeholder', () => {
  let o = setMeasurementType(choice(), 'nominal')
  expect(o.measurement_type).toBe('nominal')
  o = setLabel(o, 'en', 'Agreement')
  expect(o.content.en.label).toBe('Agreement')
  let n: EditableOption = setPlaceholderText({ input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft' } } }, 'en', 'hi')
  n = setPlaceholderText(n, 'en', '')
  expect(n.placeholder).toBeUndefined()
})

test('edited options round-trip Schema-2 valid', () => {
  let o = addChoice(choice(), 'en')
  o = setChoiceText(o, 3, 'en', 'Maybe')
  o = setLabel(o, 'en', 'Three-point')
  expect(validateQuestionnaire(wrap(o)).valid).toBe(true)
})

test('purity: inputs are never mutated', () => {
  const base = choice()
  const snapshot = JSON.stringify(base)
  addChoice(base, 'en'); removeChoice(base, 1); setLabel(base, 'en', 'x')
  expect(JSON.stringify(base)).toBe(snapshot)
})

const numOpt = { input_data_type: 'number', measurement_type: 'ratio', content: { en: { status: 'draft' } } } as unknown as EditableOption

describe('setValidation', () => {
  it('sets a range and does not mutate input', () => {
    const out = setValidation(numOpt, { range: [0, 10] })
    expect(out.validation).toEqual({ range: [0, 10] })
    expect(numOpt.validation).toBeUndefined()
  })
  it('merges patches', () => {
    const out = setValidation(setValidation(numOpt, { range: [0, 10] }), { range_message: 'too big' })
    expect(out.validation).toEqual({ range: [0, 10], range_message: 'too big' })
  })
  it('keeps open bounds ([n,null] / [null,n])', () => {
    expect(setValidation(numOpt, { range: [3, null] }).validation).toEqual({ range: [3, null] })
  })
  it('drops a [null,null] tuple', () => {
    const out = setValidation(setValidation(numOpt, { range: [0, 10] }), { range: [null, null] })
    expect('validation' in out).toBe(false)
  })
  it('drops empty-string messages and removes validation when empty', () => {
    const out = setValidation(setValidation(numOpt, { range_message: 'x' }), { range_message: '' })
    expect('validation' in out).toBe(false)
  })
  it('clears validation when switching input type', () => {
    const withVal = setValidation(numOpt, { range: [0, 10] })
    expect('validation' in setInputDataType(withVal, 'choice')).toBe(false)
    expect('validation' in setInputDataType(withVal, 'text')).toBe(false)
  })
})
