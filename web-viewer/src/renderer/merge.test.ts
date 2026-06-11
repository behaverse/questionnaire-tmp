import { mergeOptions } from './merge'
import { RenderError, type OptionEntity } from './types'

const opt: OptionEntity = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'Not at all' }, { index: 2, text: 'Several days' }] } },
}

test('joins structural options with locale texts on index', () => {
  expect(mergeOptions(opt, 'en')).toEqual([
    { index: 1, value: 0, text: 'Not at all' },
    { index: 2, value: 1, text: 'Several days' },
  ])
})
test('throws RenderError when a choice has no text for the locale', () => {
  const broken = { ...opt, content: { en: { options: [{ index: 1, text: 'Only one' }] } } }
  expect(() => mergeOptions(broken, 'en')).toThrow(RenderError)
})
test('throws RenderError when the locale is absent entirely', () => {
  expect(() => mergeOptions(opt, 'pt')).toThrow(RenderError)
})
test('non-choice options merge to empty list', () => {
  expect(mergeOptions({ input_data_type: 'number', measurement_type: 'ratio' }, 'en')).toEqual([])
})
