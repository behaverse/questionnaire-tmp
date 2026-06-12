import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { RadioGroup } from './RadioGroup'

const choices = [
  { index: 1, value: 0, text: 'Not at all' },
  { index: 2, value: 1, text: 'Several days' },
]

test('renders one radio per choice inside a named group; selecting reports the value', async () => {
  const onChange = vi.fn()
  render(<RadioGroup name="it_1" label="Little interest" choices={choices} value={null} onChange={onChange} />)
  expect(screen.getByRole('radiogroup', { name: 'Little interest' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('radio', { name: /Several days/ }))
  expect(onChange).toHaveBeenCalledWith(1)
})
test('shows letter hints and selects via keyboard letter when keyHints is on', async () => {
  const onChange = vi.fn()
  render(<RadioGroup name="it_1" label="L" choices={choices} value={null} onChange={onChange} keyHints />)
  expect(screen.getByText('A')).toBeInTheDocument()
  expect(screen.getByText('B')).toBeInTheDocument()
  await userEvent.keyboard('b')
  expect(onChange).toHaveBeenCalledWith(1)
})
test('letter keys ignored without keyHints and when typing in a text input', async () => {
  const onChange = vi.fn()
  render(
    <>
      <input type="text" aria-label="other" />
      <RadioGroup name="it_1" label="L" choices={choices} value={null} onChange={onChange} keyHints />
    </>,
  )
  await userEvent.type(screen.getByLabelText('other'), 'a')
  expect(onChange).not.toHaveBeenCalled()
})
test('selected card reflects value; no axe violations', async () => {
  const { container } = render(<RadioGroup name="it_1" label="L" choices={choices} value={1} onChange={vi.fn()} />)
  expect(screen.getByRole('radio', { name: /Several days/ })).toBeChecked()
  expect(await axe(container)).toHaveNoViolations()
})
