import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionEditor } from './OptionEditor'
import type { EditableOption } from './ops'

const choice = (): EditableOption => ({
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { status: 'draft', label: 'Scale', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
})

test('shows the derived widget label and choice rows for a choice option', () => {
  render(<OptionEditor option={choice()} locale="en" onChange={() => {}} />)
  expect(screen.getByText(/renders as/i)).toHaveTextContent(/Radio/)
  expect(screen.getByDisplayValue('No')).toBeInTheDocument()
})

test('switching input type to number swaps to numeric fields', async () => {
  const onChange = vi.fn()
  render(<OptionEditor option={choice()} locale="en" onChange={onChange} />)
  await userEvent.selectOptions(screen.getByLabelText(/response type/i), 'number')
  expect(onChange).toHaveBeenCalled()
  expect(onChange.mock.calls.at(-1)![0].input_data_type).toBe('number')
})

test('text option shows validation + placeholder fields', () => {
  const text: EditableOption = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'Name' } } }
  render(<OptionEditor option={text} locale="en" onChange={() => {}} />)
  expect(screen.getByLabelText(/validation regex/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/placeholder/i)).toBeInTheDocument()
})
