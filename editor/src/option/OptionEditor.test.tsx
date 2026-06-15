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

test('text option shows input mask + placeholder fields', () => {
  const text: EditableOption = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'Name' } } }
  render(<OptionEditor option={text} locale="en" onChange={() => {}} />)
  expect(screen.getByLabelText('Input mask (RegEx)')).toBeInTheDocument()
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

import { describe, it, expect, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'

const numOpt = { input_data_type: 'number', measurement_type: 'ratio', content: { en: { status: 'draft' } } } as unknown as EditableOption
const textOpt = { input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft' } } } as unknown as EditableOption
const choiceOpt = { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single', options: [{ index: 1, value: null }, { index: 2, value: null }], content: { en: { status: 'draft', options: [{ index: 1, text: 'a' }, { index: 2, text: 'b' }] } } } as unknown as EditableOption

describe('OptionEditor validation section', () => {
  it('number type shows range inputs + range message, not length/format', () => {
    render(<OptionEditor option={numOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Min value')).toBeInTheDocument()
    expect(screen.getByLabelText('Max value')).toBeInTheDocument()
    expect(screen.getByLabelText('Range message')).toBeInTheDocument()
    expect(screen.queryByLabelText('Min length')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Format (regex)')).not.toBeInTheDocument()
  })
  it('text type shows length + format + their messages', () => {
    render(<OptionEditor option={textOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Min length')).toBeInTheDocument()
    expect(screen.getByLabelText('Max length')).toBeInTheDocument()
    expect(screen.getByLabelText('Length message')).toBeInTheDocument()
    expect(screen.getByLabelText('Format (regex)')).toBeInTheDocument()
    expect(screen.getByLabelText('Format message')).toBeInTheDocument()
  })
  it('choice type shows no validation inputs', () => {
    render(<OptionEditor option={choiceOpt} locale="en" onChange={() => {}} />)
    expect(screen.queryByLabelText('Min value')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Min length')).not.toBeInTheDocument()
  })
  it('editing Max value writes the range tuple', () => {
    const onChange = vi.fn()
    render(<OptionEditor option={numOpt} locale="en" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Max value'), { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ validation: { range: [null, 10] } }))
  })
  it('still renders the input mask field for text (relabeled)', () => {
    render(<OptionEditor option={textOpt} locale="en" onChange={() => {}} />)
    expect(screen.getByLabelText('Input mask (RegEx)')).toBeInTheDocument()
  })
})
