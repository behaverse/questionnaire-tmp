import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentTextEditor, type ContentMap } from './ContentTextEditor'
import { ContextEditor, type ContextBody } from './ContextEditor'
import { InstructionEditor, type InstructionBody } from './InstructionEditor'
import { MessageEditor, type MessageBody } from './MessageEditor'

test('ContentTextEditor edits the locale text', async () => {
  const onChange = vi.fn()
  const content: ContentMap = { en: { status: 'draft', text: 'Hi' } }
  render(<ContentTextEditor content={content} locale="en" label="Body" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText('Body'), '!')
  expect(onChange.mock.calls.at(-1)![0].en.text).toBe('Hi!')
})

test('ContextEditor wraps content back into the context body', async () => {
  const onChange = vi.fn()
  const ctx: ContextBody = { id: 'ctx_1', content: { en: { status: 'draft', text: 'x' } } }
  render(<ContextEditor context={ctx} locale="en" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText(/context text/i), 'y')
  expect(onChange.mock.calls.at(-1)![0].content.en.text).toBe('xy')
  expect(onChange.mock.calls.at(-1)![0].id).toBe('ctx_1')
})

test('InstructionEditor edits dimension (delete-on-empty)', () => {
  const onChange = vi.fn()
  // Controlled wrapper so the input value reflects each onChange (otherwise the
  // controlled input reverts and a follow-up fireEvent.change with the same value
  // fires no event). The delete-on-empty parse logic is what's asserted.
  function Harness() {
    const [ins, setIns] = useState<InstructionBody>({ id: 'ins_1', content: { en: { status: 'draft', text: 'r' } } })
    return <InstructionEditor instruction={ins} locale="en" onChange={(i) => { setIns(i); onChange(i) }} />
  }
  render(<Harness />)
  fireEvent.change(screen.getByLabelText(/dimension/i), { target: { value: 'agreement' } })
  expect(onChange.mock.calls.at(-1)![0].dimension).toBe('agreement')
  fireEvent.change(screen.getByLabelText(/dimension/i), { target: { value: '' } })
  expect('dimension' in onChange.mock.calls.at(-1)![0]).toBe(false)
})

test('MessageEditor edits type tags (comma <-> array) + text', () => {
  const onChange = vi.fn()
  const msg: MessageBody = { id: 'msg_1', type: ['information'], content: { en: { status: 'draft', text: 'w' } } }
  render(<MessageEditor message={msg} locale="en" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'welcome, consent' } })
  expect(onChange.mock.calls.at(-1)![0].type).toEqual(['welcome', 'consent'])
})
