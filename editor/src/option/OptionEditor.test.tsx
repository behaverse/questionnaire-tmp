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

test('single-select choice does not show min/max selected', () => {
  render(<OptionEditor option={choice()} locale="en" onChange={() => {}} />)
  expect(screen.queryByLabelText(/min selected/i)).toBeNull()
})

test('multi-select choice shows min/max selected and edits them', async () => {
  const multi: EditableOption = {
    input_data_type: 'choice', measurement_type: 'nominal', selection: 'multiple',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'draft', options: [{ index: 1, text: 'A' }, { index: 2, text: 'B' }] } },
  }
  const onChange = vi.fn()
  render(<OptionEditor option={multi} locale="en" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText(/max selected/i), '2')
  expect(onChange.mock.calls.at(-1)![0].max_selected).toBe(2)
})
