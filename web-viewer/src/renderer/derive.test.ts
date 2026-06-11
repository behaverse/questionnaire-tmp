import { deriveWidget } from './derive'

const o = (input_data_type: string, measurement_type: string, selection?: string) =>
  ({ input_data_type, measurement_type, selection })

test.each([
  ['choice', 'nominal', 'single', 'choice.nominal.single'],
  ['choice', 'ordinal', 'single', 'choice.ordinal.single'],
  ['choice', 'interval', 'single', 'choice.interval.single'],
  ['choice', 'ratio', 'single', 'choice.ratio.single'],
  ['choice', 'nominal', 'multiple', 'choice.nominal.multiple'],
])('%s/%s/%s → %s', (i, m, s, expected) => {
  expect(deriveWidget(o(i, m, s))).toBe(expected)
})
test.each([
  ['number', 'ratio', 'number.ratio'],
  ['number', 'interval', 'number.interval'],
  ['text', 'nominal', 'text.nominal'],
  ['text', 'interval', 'text.interval'],
  ['text', 'ratio', 'text.ratio'],
])('%s/%s → %s', (i, m, expected) => {
  expect(deriveWidget(o(i, m))).toBe(expected)
})
test.each([
  ['choice', 'ordinal', 'multiple'],
  ['choice', 'ordinal', undefined],
  ['number', 'nominal', undefined],
  ['date', 'interval', undefined],
])('rejects %s/%s/%s', (i, m, s) => {
  expect(deriveWidget(o(i, m, s))).toBeNull()
})
