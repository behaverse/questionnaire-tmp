import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CatalogueView, returnUrlFor } from './CatalogueView'

beforeEach(() => { vi.restoreAllMocks(); window.history.replaceState(null, '', '/') })

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

test('returnUrlFor builds an absolute /?done=<id> URL', () => {
  const u = new URL(returnUrlFor('dep_1'))
  expect(u.pathname).toBe('/')
  expect(u.searchParams.get('done')).toBe('dep_1')
})

test('the Start link carries a return_url back to the catalogue', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  render(<CatalogueView />)
  await screen.findByText('Wellbeing survey')
  const href = screen.getByRole('link', { name: /start/i }).getAttribute('href')!
  const returnUrl = new URLSearchParams(href.split('?')[1]).get('return_url')!
  expect(new URL(returnUrl).searchParams.get('done')).toBe('d1')
})

test('shows a dismissable all-done banner naming the finished questionnaire when ?done is present', async () => {
  window.history.replaceState(null, '', '/?done=d1')
  stub([{ deployment_id: 'd1', title: 'PHQ-9', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  render(<CatalogueView />)
  const banner = await screen.findByRole('status')
  expect(banner).toHaveTextContent(/all done/i)
  expect(banner).toHaveTextContent('PHQ-9')
  await userEvent.click(within(banner).getByRole('button', { name: /dismiss/i }))
  expect(screen.queryByRole('status')).toBeNull()
})

test('no all-done banner without ?done', async () => {
  stub([{ deployment_id: 'd1', title: 'X', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  render(<CatalogueView />)
  await screen.findByText('X')
  expect(screen.queryByRole('status')).toBeNull()
})
