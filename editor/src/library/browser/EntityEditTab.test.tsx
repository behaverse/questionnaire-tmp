import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EntityEditTab } from './EntityEditTab'

describe('EntityEditTab', () => {
  it('edits a prompt and emits the changed body', () => {
    const onChange = vi.fn()
    render(<EntityEditTab type="prompt" body={{ id: 'pr_a', content: { en: { status: 'draft', text: 'Hi' } } }}
                          locale="en" editable onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Prompt text', { exact: true }), { target: { value: 'Hello' } })
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)![0] as { content: Record<string, { text?: string }> }
    expect(next.content.en.text).toBe('Hello')
  })
  it('disables the editor when not editable (lock-on-complete)', () => {
    render(<EntityEditTab type="prompt" body={{ id: 'pr_a', content: { en: { status: 'complete', text: 'Hi' } } }}
                          locale="en" editable={false} onChange={() => {}} />)
    expect(screen.getByLabelText('Prompt text', { exact: true })).toBeDisabled()
  })
  it('shows a note for non-editable types', () => {
    render(<EntityEditTab type="solution" body={{ id: 'sol_a' }} locale="en" editable onChange={() => {}} />)
    expect(screen.getByText(/editing.*not supported/i)).toBeInTheDocument()
  })
  it('hides the per-locale status control inside the browser Edit tab (showStatus=false)', () => {
    render(<EntityEditTab type="prompt" body={{ id: 'pr_a', content: { en: { status: 'draft', text: 'Hi' } } }}
                          locale="en" editable onChange={() => {}} />)
    expect(screen.queryByLabelText('Prompt text status')).not.toBeInTheDocument()
  })
})
