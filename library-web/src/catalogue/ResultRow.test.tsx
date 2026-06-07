import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResultRow } from './ResultRow'
import type { CatalogueCard } from '../api/types'

const card: CatalogueCard = {
  id: 'qst_phq9', version: 'v26.0602', entity_type: 'questionnaire',
  title: 'Patient Health Questionnaire-9', short_title: 'PHQ-9',
  description: 'Self-report depression severity.', status: 'published',
  effective_license: 'cc_by', language: 'en', available_languages: ['en', 'pt'],
  item_count: 9, estimated_minutes: 5, domain: ['depression'], population: ['adults'],
}

describe('ResultRow', () => {
  it('renders title, item count, language and license, linking to the detail route', () => {
    render(<MemoryRouter><ResultRow card={card} /></MemoryRouter>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/q/qst_phq9')
    expect(screen.getByText(/Patient Health Questionnaire-9/)).toBeInTheDocument()
    expect(screen.getByText('qst_phq9')).toBeInTheDocument() // id shown to disambiguate same-titled variants
    expect(screen.getByText(/9 items/)).toBeInTheDocument()
    expect(screen.getByText(/CC BY/)).toBeInTheDocument()
    expect(screen.getAllByText(/depression/)).toHaveLength(2) // description text + Domain value
  })

  it('labels the meta groups (Languages / License / Domain) so tags are self-explanatory', () => {
    render(<MemoryRouter><ResultRow card={card} /></MemoryRouter>)
    expect(screen.getByText('Languages')).toBeInTheDocument()
    expect(screen.getByText('English, Portuguese')).toBeInTheDocument() // available_languages mapped + joined
    expect(screen.getByText('License')).toBeInTheDocument()
    expect(screen.getByText('Domain')).toBeInTheDocument()
  })
})
