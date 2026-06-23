import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '../session/SessionProvider'
import { NavShell } from './NavShell'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); window.history.pushState(null, '', '/') })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function authedFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/auth/logout')) return new Response(null, { status: 204 })
    return new Response('{}', { status: 200 })
  }))
}

function renderShell() {
  return render(<SessionProvider identityBaseUrl="http://id"><NavShell><div>BODY</div></NavShell></SessionProvider>)
}

test('renders the three nav links and the children', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderShell()
  expect(screen.getByRole('link', { name: /questionnaires/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /my data/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /account/i })).toBeInTheDocument()
  expect(screen.getByText('BODY')).toBeInTheDocument()
})

test('anon shows a Log in link, not a Log out button', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderShell()
  await waitFor(() => expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument())
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
})

test('authed shows the email and a working Log out', async () => {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  authedFetch()
  renderShell()
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
  const logout = screen.getByRole('button', { name: /log out/i })
  await userEvent.click(logout)
  await waitFor(() => expect(screen.queryByText(/a@e.com/)).not.toBeInTheDocument())
})
