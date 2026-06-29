import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders a range input bound to min/max/step and shows end labels', () => {
    render(<Slider label="How happy" min={0} max={100} step={1} value={null} onChange={() => {}} />)
    const range = screen.getByRole('slider', { name: 'How happy' }) as HTMLInputElement
    expect(range).toHaveAttribute('type', 'range')
    expect(range.min).toBe('0'); expect(range.max).toBe('100'); expect(range.step).toBe('1')
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
  it('emits the numeric value on change and shows a readout', () => {
    const onChange = vi.fn()
    render(<Slider label="How happy" min={0} max={100} step={1} value={42} onChange={onChange} />)
    const range = screen.getByRole('slider', { name: 'How happy' })
    expect(screen.getByText('42')).toBeInTheDocument()
    fireEvent.change(range, { target: { value: '55' } })
    expect(onChange).toHaveBeenCalledWith(55)
  })
  it('announces "Not selected" (not the midpoint) while unanswered, and the value once set', () => {
    const { rerender } = render(<Slider label="How happy" min={0} max={100} step={1} value={null} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Not selected')
    rerender(<Slider label="How happy" min={0} max={100} step={1} value={42} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '42')
  })
})
