import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FacetSidebar } from './FacetSidebar'
import type { FacetGroup } from './FacetSidebar'
import type { FacetKey } from './useCatalogueParams'

const noSelection: Record<FacetKey, string | undefined> = {
  domain: undefined,
  population: undefined,
  instrument: undefined,
  language: undefined,
  license: undefined,
}

const groups: FacetGroup[] = [
  { key: 'domain', title: 'Domain', values: [{ value: 'adhd', count: 4 }, { value: 'mood', count: 2 }] },
  { key: 'license', title: 'License', values: [{ value: 'unknown', count: 10 }] },
]

describe('FacetSidebar', () => {
  it('renders facet groups and calls onToggle when a value is clicked', async () => {
    const onToggle = vi.fn()
    render(
      <FacetSidebar
        groups={[{ key: 'domain', title: 'Domain', values: [{ value: 'depression', count: 3 }] }]}
        selected={noSelection}
        onToggle={onToggle}
        onClear={() => {}}
      />,
    )
    expect(screen.getByText('Domain')).toBeInTheDocument()
    // collapsed by default — expand before interacting with values
    await userEvent.click(screen.getByRole('button', { name: /Domain/ }))
    await userEvent.click(screen.getByLabelText(/depression/))
    expect(onToggle).toHaveBeenCalledWith('domain', 'depression')
  })

  it('renders a category header but hides its checkboxes by default; clicking reveals them', async () => {
    render(
      <FacetSidebar groups={groups} selected={noSelection} onToggle={() => {}} onClear={() => {}} />,
    )
    const domainHeader = screen.getByRole('button', { name: /Domain/ })
    expect(domainHeader).toBeInTheDocument()
    // checkboxes hidden by default
    expect(screen.queryByText('adhd')).toBeNull()
    await userEvent.click(domainHeader)
    expect(screen.getByText('adhd')).toBeInTheDocument()
    expect(screen.getByText('mood')).toBeInTheDocument()
  })

  it('auto-expands a category that has a selected value', () => {
    render(
      <FacetSidebar
        groups={groups}
        selected={{ ...noSelection, domain: 'adhd' }}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    )
    // domain has a selection → visible without a click
    expect(screen.getByText('adhd')).toBeInTheDocument()
    expect(screen.getByText('mood')).toBeInTheDocument()
    // license has no selection → still collapsed
    expect(screen.queryByText(/unknown|Unknown/)).toBeNull()
  })

  it('reflects open/closed state via aria-expanded on the header button', async () => {
    render(
      <FacetSidebar groups={groups} selected={noSelection} onToggle={() => {}} onClear={() => {}} />,
    )
    const domainHeader = screen.getByRole('button', { name: /Domain/ })
    expect(domainHeader).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(domainHeader)
    expect(domainHeader).toHaveAttribute('aria-expanded', 'true')
  })
})
