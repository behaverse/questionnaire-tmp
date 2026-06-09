import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CatalogueGroup } from './CatalogueGroup'
import type { InstrumentGroup, CatalogueCard } from '../api/types'

const form = (id: string): CatalogueCard => ({
  id, version: 'v26.0606', entity_type: 'questionnaire', title: 'ASRS-v1.1', short_title: null,
  description: null, status: 'published', effective_license: 'unknown', language: 'en',
  available_languages: ['en'], item_count: 6, estimated_minutes: null, domain: ['adhd'],
  population: [], instrument_id: 'inst_asrs', variant: 'base',
})

describe('CatalogueGroup', () => {
  it('renders a single-form group as a plain row (no expander)', () => {
    const g: InstrumentGroup = { instrument_id: null, title: 'ASRS-v1.1', form_count: 1, languages: ['en'], domain: ['adhd'], forms: [form('qst_x_asrs')] }
    render(<MemoryRouter><CatalogueGroup group={g} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /ASRS-v1.1/ })).toHaveAttribute('href', '/q/qst_x_asrs')
    expect(screen.queryByRole('button', { name: /variants/i })).toBeNull()
  })

  it('collapses a multi-form group and expands to its forms on click', async () => {
    const g: InstrumentGroup = { instrument_id: 'inst_asrs', title: 'ASRS-v1.1', form_count: 2, languages: ['en'], domain: ['adhd'], forms: [form('qst_x_asrs'), form('qst_asrs_a')] }
    render(<MemoryRouter><CatalogueGroup group={g} /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: /2 variants/i })
    expect(screen.queryByText('qst_asrs_a')).toBeNull() // collapsed
    await userEvent.click(toggle)
    expect(screen.getByText('qst_x_asrs')).toBeInTheDocument()
    expect(screen.getByText('qst_asrs_a')).toBeInTheDocument()
  })
})
