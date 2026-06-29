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
})
