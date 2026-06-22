import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeApp } from './HomeApp'

beforeEach(() => { vi.restoreAllMocks() })

function stub(items: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('renders a card per catalogue item with a Start link into the runner', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: 'A short check-in.', questionnaire_ref: 'qst_x@v1', auth: 'none' }])
  render(<HomeApp />)
  expect(await screen.findByText('Wellbeing survey')).toBeInTheDocument()
  expect(screen.getByText('A short check-in.')).toBeInTheDocument()
  const start = screen.getByRole('link', { name: /start/i })
  expect(start.getAttribute('href')).toContain('index.html?')
  expect(start.getAttribute('href')).toContain('deployment=d1')
})

test('shows an empty state when the catalogue is empty', async () => {
  stub([])
  render(<HomeApp />)
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})

test('has a My data link', async () => {
  stub([])
  render(<HomeApp />)
  const mydata = await screen.findByRole('link', { name: /my data/i })
  expect(mydata.getAttribute('href')).toContain('mydata.html')
})
