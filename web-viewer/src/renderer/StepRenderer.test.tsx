import { render, screen, within, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StepRenderer } from './StepRenderer'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
}
const row = (id: string, text: string) => ({ id, question: { prompt: { content: { en: { text } } } }, option: opt })
const matrixSection = { id: 'sec_m', title: 'How often…', shared_option: opt, elements: [row('it_a', 'Row A'), row('it_b', 'Row B')] }
const message = { id: 'msg_1', content: { en: { text: 'Welcome to the study' } } }

test('dispatches message / item / section; unknown shape → unsupported card', () => {
  render(
    <StepRenderer
      elements={[
        { key: 'msg_1', element: message },
        { key: 'it_1', element: row('it_1', 'Standalone') },
        { key: 'mystery', element: { bogus: true } },
      ]}
      locale="en" answers={{}} onAnswer={vi.fn()} requiredErrors={[]} strings={{ required: 'req', unsupported: 'unsupported' }}
    />,
  )
  expect(screen.getByText('Welcome to the study')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Standalone' })).toBeInTheDocument()
  expect(screen.getByText(/unsupported/)).toBeInTheDocument()
})
test('matrix: table with choice-text column headers and one radio row per item', async () => {
  const onAnswer = vi.fn()
  const { container } = render(
    <StepRenderer elements={[{ key: 'sec_m', element: matrixSection }]} locale="en" answers={{}} onAnswer={onAnswer} requiredErrors={[]} strings={{ required: 'req', unsupported: 'u' }} />,
  )
  const table = screen.getByRole('table')
  // deviation: corner cell is <td> (axe-clean) so only choice headers are columnheaders
  expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['No', 'Yes'])
  expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['Row A', 'Row B'])
  const rowA = within(table).getAllByRole('row')[1]
  fireEvent.click(within(rowA).getAllByRole('radio')[1])
  expect(onAnswer).toHaveBeenCalledWith('it_a', 1)
  expect(await axe(container)).toHaveNoViolations()
})
test('matrix required errors mark the failing rows', () => {
  render(
    <StepRenderer elements={[{ key: 'sec_m', element: matrixSection }]} locale="en" answers={{ it_a: 0 }} onAnswer={vi.fn()} requiredErrors={['it_b']} strings={{ required: 'Answer all rows', unsupported: 'u' }} />,
  )
  expect(screen.getByText('Answer all rows')).toBeInTheDocument()
})
test('plain section (no shared_option) renders a titled group of items', () => {
  const plain = { id: 'sec_p', title: 'About you', elements: [row('it_c', 'Row C')] }
  render(<StepRenderer elements={[{ key: 'sec_p', element: plain }]} locale="en" answers={{}} onAnswer={vi.fn()} requiredErrors={[]} strings={{ required: 'r', unsupported: 'u' }} />)
  expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Row C' })).toBeInTheDocument()
})
