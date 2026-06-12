// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { StepRenderer } from '../../dist-lib/renderer.js'

test('the built renderer library renders a step', () => {
  const item = { id: 'it_1', question: { prompt: { content: { en: { text: 'Hello?' } } } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'Yes' }] } } } }
  const { getByRole } = render(
    <StepRenderer elements={[{ key: 'it_1', element: item }]} locale="en" answers={{}} onAnswer={() => {}}
      requiredErrors={[]} strings={{ required: 'req', unsupported: 'unsupported' }} />,
  )
  expect(getByRole('heading', { name: 'Hello?' })).toBeTruthy()
})
