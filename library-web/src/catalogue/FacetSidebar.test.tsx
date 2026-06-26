import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FacetSidebar, MobileFilters } from './FacetSidebar'
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

  it('renders a value label (instrument name) instead of the raw value when provided', async () => {
    render(
      <FacetSidebar
        groups={[{ key: 'instrument', title: 'Instrument', values: [{ value: 'inst_acs', count: 2, label: 'Attentional Control Scale' }] }]}
        selected={noSelection}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Instrument/ }))
    expect(screen.getByText('Attentional Control Scale')).toBeInTheDocument()
    expect(screen.queryByText('inst_acs')).toBeNull()
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

describe('MobileFilters', () => {
  it('hides the facets behind a Filters disclosure until it is opened', async () => {
    render(<MobileFilters groups={groups} selected={noSelection} onToggle={() => {}} onClear={() => {}} />)
    const trigger = screen.getByRole('button', { name: /filters/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // the facet group headers are not rendered until the disclosure opens
    expect(screen.queryByRole('button', { name: /Domain/ })).toBeNull()
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Domain/ })).toBeInTheDocument()
  })
})
