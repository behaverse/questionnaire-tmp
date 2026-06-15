import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContentTextEditor } from './ContentTextEditor'

describe('ContentTextEditor status + source hint', () => {
  it('renders a status select bound to content[locale].status', () => {
    const onChange = vi.fn()
    render(<ContentTextEditor content={{ fr: { status: 'draft', text: 'Bonjour' } }} locale="fr" label="Text" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Text status'), { target: { value: 'complete' } })
    expect(onChange).toHaveBeenCalledWith({ fr: { status: 'complete', text: 'Bonjour' } })
  })
  it('shows the primary source text when translating a non-primary locale', () => {
    render(<ContentTextEditor content={{ en: { status: 'validated', text: 'Hello' } }} locale="fr" label="Text" primaryLocale="en" onChange={() => {}} />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
  })
})
