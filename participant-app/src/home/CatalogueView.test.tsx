import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider, saveRefreshToken } from '@behaverse/participant-session'
import { CatalogueView, returnUrlFor } from './CatalogueView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); window.history.replaceState(null, '', '/') })

// the catalogue lives under a session provider; anon by default (plain Start links)
function renderCat() {
  return render(<SessionProvider identityBaseUrl="http://id"><CatalogueView /></SessionProvider>)
}

function stub(items: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('renders a card per catalogue item with a Start link into the runner', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: 'A short check-in.', questionnaire_ref: 'qst_x@v1', auth: 'none' }])
  renderCat()
  expect(await screen.findByText('Wellbeing survey')).toBeInTheDocument()
  expect(screen.getByText('A short check-in.')).toBeInTheDocument()
  const start = screen.getByRole('link', { name: /start/i })
  // launches the player on its own origin (default dev base) carrying the deployment
  expect(start.getAttribute('href')).toContain('localhost:5173')
  expect(start.getAttribute('href')).toContain('deployment=d1')
})

test('shows an empty state when the catalogue is empty', async () => {
  stub([])
  renderCat()
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})

test('returnUrlFor builds an absolute /?done=<id> URL', () => {
  const u = new URL(returnUrlFor('dep_1'))
  expect(u.pathname).toBe('/')
  expect(u.searchParams.get('done')).toBe('dep_1')
})

test('the Start link carries a return_url back to the catalogue', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  renderCat()
  await screen.findByText('Wellbeing survey')
  const href = screen.getByRole('link', { name: /start/i }).getAttribute('href')!
  const returnUrl = new URLSearchParams(href.split('?')[1]).get('return_url')!
  expect(new URL(returnUrl).searchParams.get('done')).toBe('d1')
})

test('shows a dismissable all-done banner naming the finished questionnaire when ?done is present', async () => {
  window.history.replaceState(null, '', '/?done=d1')
  stub([{ deployment_id: 'd1', title: 'PHQ-9', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  renderCat()
  const banner = await screen.findByRole('status')
  expect(banner).toHaveTextContent(/all done/i)
  expect(banner).toHaveTextContent('PHQ-9')
  await userEvent.click(within(banner).getByRole('button', { name: /dismiss/i }))
  expect(screen.queryByRole('status')).toBeNull()
  expect(window.location.search).not.toContain('done') // dismiss also strips the marker from the URL
})

test('no all-done banner without ?done', async () => {
  stub([{ deployment_id: 'd1', title: 'X', description: '', questionnaire_ref: 'q@v1', auth: 'none' }])
  renderCat()
  await screen.findByText('X')
  expect(screen.queryByRole('status')).toBeNull()
})

test('an authenticated card, while signed in, starts via an SSO handoff (a button, not a bare link)', async () => {
  saveRefreshToken('RT0') // boot the session to authed
  const f = vi.fn(async (url: string) => {
    if (url.endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if (url.endsWith('/v1/auth/me')) return new Response(JSON.stringify({ id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: true, roles: ['researcher'] }), { status: 200 })
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd9', title: 'Secure survey', description: '', questionnaire_ref: 'q@v1', auth: 'identity' }] }), { status: 200 })
    if (url.endsWith('/v1/auth/handoff')) return new Response(JSON.stringify({ handoff_code: 'HC9', expires_in: 60 }), { status: 200 })
    return new Response('{}', { status: 200 })
  })
  vi.stubGlobal('fetch', f)
  renderCat()
  // an identity card renders Start as a button (which mints a handoff), not a plain link
  const start = await screen.findByRole('button', { name: /start/i })
  expect(screen.queryByRole('link', { name: /start/i })).toBeNull()
  await userEvent.click(start)
  await waitFor(() => expect(f.mock.calls.some(([u]) => String(u).endsWith('/v1/auth/handoff'))).toBe(true))
})

test('an authenticated card while signed OUT stays a plain link (player will prompt login)', async () => {
  stub([{ deployment_id: 'd9', title: 'Secure survey', description: '', questionnaire_ref: 'q@v1', auth: 'identity' }])
  renderCat() // anon
  await screen.findByText('Secure survey')
  expect(screen.getByRole('link', { name: /start/i })).toBeInTheDocument()
})
