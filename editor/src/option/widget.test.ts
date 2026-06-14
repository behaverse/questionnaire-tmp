import { widgetLabel } from './widget'
import type { EditableOption } from './ops'

test('maps the derived widget to a human label', () => {
  expect(widgetLabel({ input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single', options: [{ index: 1, value: 0 }, { index: 2, value: 1 }], content: {} } as EditableOption)).toBe('Radio')
  expect(widgetLabel({ input_data_type: 'choice', measurement_type: 'nominal', selection: 'multiple', options: [{ index: 1, value: 0 }, { index: 2, value: 1 }], content: {} } as EditableOption)).toBe('Checkbox')
  expect(widgetLabel({ input_data_type: 'number', measurement_type: 'ratio', content: {} } as EditableOption)).toBe('Number input')
  expect(widgetLabel({ input_data_type: 'text', measurement_type: 'nominal', content: {} } as EditableOption)).toBe('Text input')
})
