// web-viewer/src/renderer/widgets/NumberRating.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberRating } from './NumberRating'

describe('NumberRating', () => {
  it('renders a radiogroup with one button per value', () => {
    render(<NumberRating label="Agreement" min={1} max={7} step={1} value={null} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: 'Agreement' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(screen.getByRole('radio', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '7' })).toBeInTheDocument()
  })
  it('marks the selected value and emits the number on click', async () => {
    const onChange = vi.fn()
    render(<NumberRating label="Agreement" min={1} max={7} step={1} value={4} onChange={onChange} />)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: '6' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })
  it('roving tabindex: only the checked radio is tabbable', () => {
    render(<NumberRating label="A" min={1} max={5} step={1} value={3} onChange={() => {}} />)
    const tabbable = screen.getAllByRole('radio').filter((r) => r.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('tabindex', '0')
  })
  it('when nothing is selected the first radio is tabbable', () => {
    render(<NumberRating label="A" min={1} max={5} step={1} value={null} onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: '1' })).toHaveAttribute('tabindex', '0')
  })
  it('arrow keys move + select (selection follows focus), wrapping at the ends', async () => {
    const onChange = vi.fn()
    render(<NumberRating label="A" min={1} max={5} step={1} value={3} onChange={onChange} />)
    screen.getByRole('radio', { name: '3' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(4)
    screen.getByRole('radio', { name: '1' }).focus()
    await userEvent.keyboard('{ArrowLeft}')   // wraps to the last value
    expect(onChange).toHaveBeenLastCalledWith(5)
  })
})
