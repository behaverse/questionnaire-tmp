import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextField } from './fields'

describe('TextField', () => {
  it('renders a sentence-case label (no uppercase transform) and edits', () => {
    const fn = vi.fn()
    render(<TextField label="Page title" value="x" onChange={fn} />)
    const label = screen.getByText('Page title')
    expect(label.className).not.toContain('uppercase')
    expect(label.className).toContain('text-ed-muted')
    fireEvent.change(screen.getByDisplayValue('x'), { target: { value: 'y' } })
    expect(fn).toHaveBeenCalledWith('y')
  })
})
