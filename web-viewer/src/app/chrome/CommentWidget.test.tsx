import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommentWidget } from './CommentWidget'

const open = () => {
  render(<CommentWidget locale="en" onSubmit={async () => true} />)
  fireEvent.click(screen.getByRole('button', { name: /comment on this question/i }))
  return screen.getByRole('dialog')
}

describe('CommentWidget focus management', () => {
  it('wraps Tab from the last focusable back to the first (focus trap)', () => {
    const dialog = open()
    const textarea = screen.getByRole('textbox')
    const cancel = screen.getByRole('button', { name: /cancel/i })
    cancel.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })          // from last → wrap to first
    expect(textarea).toHaveFocus()
  })

  it('wraps Shift+Tab from the first focusable to the last', () => {
    const dialog = open()
    const textarea = screen.getByRole('textbox')
    const cancel = screen.getByRole('button', { name: /cancel/i })
    textarea.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(cancel).toHaveFocus()
  })

  it('Escape closes and restores focus to the trigger', () => {
    const dialog = open()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: /comment on this question/i })).toHaveFocus()
  })
})
