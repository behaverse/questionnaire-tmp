import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FacetSidebar } from './FacetSidebar'

describe('FacetSidebar', () => {
  it('renders facet groups and calls onToggle when a value is clicked', async () => {
    const onToggle = vi.fn()
    render(
      <FacetSidebar
        groups={[{ key: 'domain', title: 'Domain', values: [{ value: 'depression', count: 3 }] }]}
        selected={{ domain: undefined, population: undefined, instrument: undefined, language: undefined, license: undefined }}
        onToggle={onToggle}
        onClear={() => {}}
      />,
    )
    expect(screen.getByText('Domain')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/depression/))
    expect(onToggle).toHaveBeenCalledWith('domain', 'depression')
  })
})
