import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogueView } from './CatalogueView'

beforeEach(() => { vi.restoreAllMocks() })

function stub(items: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('renders a card per catalogue item with a Start link into the runner', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: 'A short check-in.', questionnaire_ref: 'qst_x@v1', auth: 'none' }])
  render(<CatalogueView />)
  expect(await screen.findByText('Wellbeing survey')).toBeInTheDocument()
  expect(screen.getByText('A short check-in.')).toBeInTheDocument()
  const start = screen.getByRole('link', { name: /start/i })
  expect(start.getAttribute('href')).toContain('index.html?')
  expect(start.getAttribute('href')).toContain('deployment=d1')
})

test('shows an empty state when the catalogue is empty', async () => {
  stub([])
  render(<CatalogueView />)
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})
