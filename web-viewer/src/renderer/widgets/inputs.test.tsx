import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { CheckboxGroup } from './CheckboxGroup'
import { NumberInput } from './NumberInput'
import { TextInput } from './TextInput'

const choices = [
  { index: 1, value: 'a', text: 'Alpha' },
  { index: 2, value: 'b', text: 'Beta' },
]

test('CheckboxGroup toggles values into an array', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<CheckboxGroup label="L" choices={choices} value={null} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))
  expect(onChange).toHaveBeenCalledWith(['a'])
  rerender(<CheckboxGroup label="L" choices={choices} value={['a']} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Beta/ }))
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  rerender(<CheckboxGroup label="L" choices={choices} value={['a', 'b']} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))
  expect(onChange).toHaveBeenLastCalledWith(['b'])
})
test('NumberInput honours min/max/step and reports number or null', async () => {
  const onChange = vi.fn()
  function Harness() {
    const [val, setVal] = React.useState<number | null>(null)
    return <NumberInput label="Hours" min={0} max={24} step={1} value={val} onChange={(v) => { setVal(v); onChange(v) }} />
  }
  render(<Harness />)
  const input = screen.getByRole('spinbutton', { name: 'Hours' })
  expect(input).toHaveAttribute('min', '0')
  expect(input).toHaveAttribute('max', '24')
  await userEvent.type(input, '7')
  expect(onChange).toHaveBeenLastCalledWith(7)
  await userEvent.clear(input)
  expect(onChange).toHaveBeenLastCalledWith(null)
})
test('TextInput reports text and shows placeholder', async () => {
  const onChange = vi.fn()
  // Stateful harness so the controlled input reflects typed chars
  function Harness() {
    const [val, setVal] = React.useState('')
    return <TextInput label="Name" placeholder="Type here…" value={val} onChange={(v) => { setVal(v); onChange(v) }} />
  }
  render(<Harness />)
  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveAttribute('placeholder', 'Type here…')
  await userEvent.type(input, 'hi')
  expect(onChange).toHaveBeenLastCalledWith('hi')
})
test('no axe violations', async () => {
  const { container } = render(
    <>
      <CheckboxGroup label="C" choices={choices} value={['a']} onChange={vi.fn()} />
      <NumberInput label="N" value={3} onChange={vi.fn()} />
      <TextInput label="T" value="x" onChange={vi.fn()} />
    </>,
  )
  expect(await axe(container)).toHaveNoViolations()
})
