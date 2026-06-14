import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoiceRows } from './ChoiceRows'
import type { EditableOption } from './ops'

const opt = (): EditableOption => ({
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { status: 'draft', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
})

test('renders a row per choice with value + text', () => {
  render(<ChoiceRows option={opt()} locale="en" onChange={() => {}} />)
  expect(screen.getByDisplayValue('No')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Yes')).toBeInTheDocument()
})

test('Add choice calls onChange with an extra row', async () => {
  const onChange = vi.fn()
  render(<ChoiceRows option={opt()} locale="en" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: /add choice/i }))
  expect(onChange).toHaveBeenCalled()
  expect(onChange.mock.calls[0][0].options).toHaveLength(3)
})

test('editing a choice text calls onChange with the new text', async () => {
  const onChange = vi.fn()
  render(<ChoiceRows option={opt()} locale="en" onChange={onChange} />)
  const first = screen.getByDisplayValue('No')
  // Component is controlled by the parent; in this isolated test the prop never
  // updates between keystrokes, so type a single char and assert the FIRST call.
  await userEvent.type(first, '!')
  expect(onChange).toHaveBeenCalled()
  const arg = onChange.mock.calls[0][0]
  expect(arg.content.en.options[0].text).toBe('No!')
})

test('Remove drops the row', async () => {
  const onChange = vi.fn()
  render(<ChoiceRows option={opt()} locale="en" onChange={onChange} />)
  await userEvent.click(screen.getAllByRole('button', { name: /remove choice/i })[0])
  expect(onChange.mock.calls.at(-1)![0].options).toHaveLength(1)
})

test('value input reflects the model after a reorder (controlled, not stale)', () => {
  const before: EditableOption = {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'draft', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
  }
  const { rerender } = render(<ChoiceRows option={before} locale="en" onChange={() => {}} />)
  // value at index 1 is 0
  expect((screen.getByLabelText('Value for choice 1') as HTMLInputElement).value).toBe('0')
  // simulate a reorder result: positions swapped, renumbered → index1 now value 1
  const after: EditableOption = {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 1 }, { index: 2, value: 0 }],
    content: { en: { status: 'draft', options: [{ index: 1, text: 'Yes' }, { index: 2, text: 'No' }] } },
  }
  rerender(<ChoiceRows option={after} locale="en" onChange={() => {}} />)
  expect((screen.getByLabelText('Value for choice 1') as HTMLInputElement).value).toBe('1')
  expect((screen.getByLabelText('Value for choice 2') as HTMLInputElement).value).toBe('0')
})
