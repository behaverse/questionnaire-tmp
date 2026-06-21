// editor/src/library/browser/EntityInspector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EntityInspector } from './EntityInspector'

const body = { id: 'pr_a', construct: 'mood', content: { en: { status: 'draft', text: 'How are you?' } } }

describe('EntityInspector', () => {
  it('placeholder when nothing is selected', () => {
    render(<EntityInspector refStr={null} body={null} loading={false} err="" onChange={() => {}} />)
    expect(screen.getByText(/select an entity/i)).toBeInTheDocument()
  })
  it('Inspect tab shows structural fields + content (read-only)', () => {
    render(<EntityInspector refStr="pr_a@v1" body={body} loading={false} err="" onChange={() => {}} />)
    expect(screen.getByText('pr_a@v1')).toBeInTheDocument()
    expect(screen.getByText(/mood/)).toBeInTheDocument()
    expect(screen.getByText('How are you?')).toBeInTheDocument()
  })
  it('Edit tab edits the body and emits onChange', () => {
    const onChange = vi.fn()
    render(<EntityInspector refStr="pr_a@v1" body={body} loading={false} err="" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText('Prompt text', { exact: true }), { target: { value: 'Hello' } })
    expect(onChange).toHaveBeenCalled()
  })
  it('marking complete locks the editor', () => {
    const onChange = vi.fn()
    render(<EntityInspector refStr="pr_a@v1" body={body} loading={false} err="" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText('Entity status', { exact: true }), { target: { value: 'complete' } })
    // onChange called with a body whose en.status is complete
    const next = onChange.mock.calls.at(-1)![0] as { content: Record<string, { status?: string }> }
    expect(next.content.en.status).toBe('complete')
  })
})
