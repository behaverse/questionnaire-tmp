import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from './Tabs'

describe('Tabs', () => {
  it('shows the first tab by default and switches on click', () => {
    render(<Tabs tabs={[{ id: 'a', label: 'Logic', content: <p>logic body</p> }, { id: 'b', label: 'Scores', content: <p>scores body</p> }]} />)
    expect(screen.getByText('logic body')).toBeInTheDocument()
    expect(screen.queryByText('scores body')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Scores' }))
    expect(screen.getByText('scores body')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Scores' })).toHaveAttribute('aria-selected', 'true')
  })
})
