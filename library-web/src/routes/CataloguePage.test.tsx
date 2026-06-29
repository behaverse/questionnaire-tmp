import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CataloguePage } from './CataloguePage'
import { api } from '../api/client'

vi.mock('../api/client', async (orig) => {
  const real = await orig<typeof import('../api/client')>()
  return { ...real, api: { ...real.api, listQuestionnaires: vi.fn(), facets: vi.fn(), searchQuestions: vi.fn() } }
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

  it('announces the result count in a live status region', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [group], total: 1, limit: 20, offset: 0 })
    setup()
    await waitFor(() => expect(screen.getByText('PHQ-9')).toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('1 result')
  })

  it('shows the empty state when there are no results', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 })
    setup()
    // appears twice: the visible EmptyState message + the sr-only live status region
    await waitFor(() => expect(screen.getAllByText(/No questionnaires match/i).length).toBeGreaterThan(0))
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
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
    // appears in both the visible ErrorState and the sr-only live status region
    await waitFor(() => expect(screen.getAllByText(/invalid search or filter/i).length).toBeGreaterThan(0))
  })

  it('switches to Questions mode and shows question hits with text', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [group], total: 1, limit: 20, offset: 0 })
    vi.mocked(api.searchQuestions).mockResolvedValue({
      items: [{ id: 'pr_q1', version: 'v26.0601', text: 'How often do you feel anxious?', language: 'en' }],
      total: 1, limit: 30, offset: 0,
    })
    setup()
    await userEvent.click(screen.getByRole('radio', { name: /^questions$/i }))
    await waitFor(() => expect(screen.getByText(/how often do you feel anxious/i)).toBeInTheDocument())
    expect(screen.getByText(/pr_q1/)).toBeInTheDocument()
    expect(api.searchQuestions).toHaveBeenCalled()
  })
})
