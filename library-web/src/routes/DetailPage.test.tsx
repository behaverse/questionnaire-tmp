import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DetailPage } from './DetailPage'
import { api, ApiError } from '../api/client'
import type { ResolvedDefinition } from '../api/types'

vi.mock('../api/client', async (orig) => {
  const real = await orig<typeof import('../api/client')>()
  return { ...real, api: { ...real.api, resolvedDefinition: vi.fn(), versions: vi.fn() } }
})

const def: ResolvedDefinition = {
  metadata: { id: 'qst_phq9', title: 'PHQ-9', version: 'v26.0602', language: 'en', available_languages: ['en'] },
  pages: [{ id: 'p', title: 'Items', elements: [
    { question: { prompt: { ref: 'pr_1@v', content: { en: { text: 'Little interest?' } } } }, option: { content: { en: { options: [{ index: 1, text: 'Not at all' }] } } } },
  ] }],
}

function setup(path = '/q/qst_phq9') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/q/:id" element={<DetailPage />} />
          <Route path="/q/:id/:version" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.mocked(api.versions).mockResolvedValue([{ id: 'qst_phq9', version: 'v26.0602', status: 'published', severity: null, date: '2026-06-02' }])
})

describe('DetailPage', () => {
  it('renders metadata + items from the resolved definition', async () => {
    vi.mocked(api.resolvedDefinition).mockResolvedValue(def)
    setup()
    await waitFor(() => expect(screen.getByRole('heading', { name: /PHQ-9/ })).toBeInTheDocument())
    expect(screen.getByText('Little interest?')).toBeInTheDocument()
    expect(screen.getByText('Not at all')).toBeInTheDocument()
  })

  it('shows a withdrawn notice on 410', async () => {
    vi.mocked(api.resolvedDefinition).mockRejectedValue(new ApiError(410, 'gone', 'withdrawn'))
    setup()
    await waitFor(() => expect(screen.getByText(/withdrawn/i)).toBeInTheDocument())
  })

  it('shows not-found on 404', async () => {
    vi.mocked(api.resolvedDefinition).mockRejectedValue(new ApiError(404, 'not_found', 'nope'))
    setup()
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument())
  })

  it('shows not-found when the id is unknown (versions 404)', async () => {
    vi.mocked(api.versions).mockRejectedValue(new ApiError(404, 'not_found', 'nope'))
    vi.mocked(api.resolvedDefinition).mockRejectedValue(new ApiError(404, 'not_found', 'nope'))
    setup()
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument())
  })
})
