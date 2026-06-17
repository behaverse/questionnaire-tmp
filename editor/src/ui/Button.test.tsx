import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Check } from 'lucide-react'
import { Button, IconButton } from './Button'

describe('Button', () => {
  it('renders its label and fires onClick', () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(fn).toHaveBeenCalledOnce()
  })
  it('primary variant uses the accent background', () => {
    render(<Button variant="primary">Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' }).className).toContain('bg-ed-accent')
  })
  it('renders a decorative icon hidden from a11y, name comes from text', () => {
    render(<Button icon={Check}>Validate</Button>)
    const btn = screen.getByRole('button', { name: 'Validate' })
    expect(btn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('IconButton', () => {
  it('exposes the label as its accessible name', () => {
    render(<IconButton icon={Check} label="Confirm" />)
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })
})
