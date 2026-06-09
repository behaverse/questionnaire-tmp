import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CataloguePage } from './CataloguePage'
import { api } from '../api/client'

vi.mock('../api/client', async (orig) => {
  const real = await orig<typeof import('../api/client')>()
  return { ...real, api: { ...real.api, listQuestionnaires: vi.fn(), facets: vi.fn() } }
})

const card = {
  id: 'qst_phq9', version: 'v26.0602', entity_type: 'questionnaire',
  title: 'PHQ-9', short_title: null, description: 'Depression.', status: 'published',
  effective_license: 'cc_by', language: 'en', available_languages: ['en'],
  item_count: 9, estimated_minutes: 5, domain: ['depression'], population: ['adults'],
  instrument_id: 'inst_phq9', variant: null,
}

const group = {
  instrument_id: 'inst_phq9', title: 'PHQ-9', form_count: 1,
  languages: ['en'], domain: ['depression'], forms: [card],
}

function setup(path = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <CataloguePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.mocked(api.facets).mockResolvedValue({ facet_type: 'domain', values: [{ value: 'depression', count: 1 }] })
})

describe('CataloguePage', () => {
  it('renders results from the API', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [group], total: 1, limit: 20, offset: 0 })
    setup()
    await waitFor(() => expect(screen.getByText('PHQ-9')).toBeInTheDocument())
    expect(screen.getAllByText('depression').length).toBeGreaterThan(0)
  })

  it('shows the empty state when there are no results', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 })
    setup()
    await waitFor(() => expect(screen.getByText(/No questionnaires match/i)).toBeInTheDocument())
  })

  it('shows an error state when the list query fails', async () => {
    vi.mocked(api.listQuestionnaires).mockRejectedValue(new Error('boom'))
    setup()
    await waitFor(() => expect(screen.getByText(/Retry/i)).toBeInTheDocument())
  })

  it('shows an invalid-filter message on a 422', async () => {
    const { ApiError } = await import('../api/client')
    vi.mocked(api.listQuestionnaires).mockRejectedValue(new ApiError(422, 'unprocessable', 'bad'))
    setup()
    await waitFor(() => expect(screen.getByText(/invalid search or filter/i)).toBeInTheDocument())
  })
})
