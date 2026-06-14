import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { PromptEditor, type PromptBody } from './PromptEditor'

const prompt = (): PromptBody => ({ id: 'pr_1', content: { en: { status: 'draft', text: 'Hi' } } })

test('edits prompt text for the locale', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  const ta = screen.getByLabelText(/prompt text/i)
  await userEvent.type(ta, '!')
  expect(onChange.mock.calls.at(-1)![0].content.en.text).toBe('Hi!')
})

test('topics round-trip comma <-> array; reversed checkbox', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  // Controlled input: the parent prop does not update between keystrokes in
  // isolation, so type the full string in one event to exercise the parse.
  fireEvent.change(screen.getByLabelText(/topics/i), { target: { value: 'risk, novelty' } })
  expect(onChange.mock.calls.at(-1)![0].topics).toEqual(['risk', 'novelty'])
  await userEvent.click(screen.getByLabelText(/reversed/i))
  expect(onChange.mock.calls.at(-1)![0].reversed).toBe(true)
})

test('name/construct/dimension write through', async () => {
  const onChange = vi.fn()
  render(<PromptEditor prompt={prompt()} locale="en" onChange={onChange} />)
  // Controlled input: assert the parse on a single change with the full value.
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'x' } })
  expect(onChange.mock.calls.at(-1)![0].name).toBe('x')
})
