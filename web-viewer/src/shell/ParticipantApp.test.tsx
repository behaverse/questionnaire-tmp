import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from '../session/SessionProvider'
import { ParticipantApp } from './ParticipantApp'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

function stubAnon() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items: [] }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

function renderAt(path: string) {
  window.history.pushState(null, '', path)
  return render(<SessionProvider identityBaseUrl="http://id"><ParticipantApp /></SessionProvider>)
}

test('/ renders the catalogue', async () => {
  stubAnon(); renderAt('/')
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})

test('/account renders the account form', async () => {
  stubAnon(); renderAt('/account')
  expect(await screen.findByRole('button', { name: /create account/i })).toBeInTheDocument()
})

test('/my-data while anon shows the login prompt', async () => {
  stubAnon(); renderAt('/my-data')
  // NavShell also renders a "Log in" link; verify at least one content-level link points to /account
  const links = await screen.findAllByRole('link', { name: /^log in$/i })
  expect(links.some((l) => l.getAttribute('href') === '/account')).toBe(true)
})

test('unknown path falls back to the catalogue', async () => {
  stubAnon(); renderAt('/nope')
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})
