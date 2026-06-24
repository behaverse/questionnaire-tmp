import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider, useSession } from '@behaverse/participant-session'
import { saveRefreshToken, loadRefreshToken } from '@behaverse/participant-session'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }
const TOKENS = (n: string) => ({ access_token: `AT${n}`, refresh_token: `RT${n}`, expires_in: 900, token_type: 'Bearer' })

function Probe() {
  const s = useSession()
  return (
    <div>
      <span data-testid="status">{s.status}</span>
      <span data-testid="email">{s.user?.email ?? ''}</span>
      <button onClick={() => void s.login('a@e.com', 'pw')}>do-login</button>
      <button onClick={() => void s.logout()}>do-logout</button>
    </div>
  )
}

function routeFetch(handlers: Record<string, (init?: RequestInit) => Response>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const key = Object.keys(handlers).find((k) => (url as string).endsWith(k))
    return key ? handlers[key](init) : new Response('{}', { status: 404 })
  }))
}

test('boot with no stored token settles to anon', async () => {
  routeFetch({})
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
})

test('boot with a stored refresh token restores the session (come back later)', async () => {
  saveRefreshToken('RT0')
  routeFetch({
    '/v1/auth/refresh': () => new Response(JSON.stringify(TOKENS('1')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  expect(screen.getByTestId('email').textContent).toBe('a@e.com')
  expect(loadRefreshToken()).toBe('RT1') // rotated token persisted
})

test('login authenticates and persists the refresh token', async () => {
  routeFetch({
    '/v1/auth/login': () => new Response(JSON.stringify(TOKENS('9')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  await userEvent.click(screen.getByText('do-login'))
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  expect(loadRefreshToken()).toBe('RT9')
})

test('a fresh provider with the same localStorage stays logged in (reload)', async () => {
  saveRefreshToken('RT0')
  routeFetch({
    '/v1/auth/refresh': () => new Response(JSON.stringify(TOKENS('1')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  const { unmount } = render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  unmount()
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
})

test('logout revokes, clears storage, and goes anon', async () => {
  saveRefreshToken('RT0')
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(url as string)
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify(TOKENS('1')), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/auth/logout')) return new Response(null, { status: 204 })
    return new Response('{}', { status: 404 })
  }))
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  await userEvent.click(screen.getByText('do-logout'))
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  expect(calls.some((u) => u.endsWith('/v1/auth/logout'))).toBe(true)
  expect(loadRefreshToken()).toBeNull()
})

test('boot refresh failure clears storage and goes anon', async () => {
  saveRefreshToken('RT-bad')
  routeFetch({ '/v1/auth/refresh': () => new Response(JSON.stringify({ error: { code: 'refresh_reuse' } }), { status: 401 }) })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  expect(loadRefreshToken()).toBeNull()
})

test('boot with a handoff code (no stored token) exchanges it and stores the session', async () => {
  routeFetch({
    '/v1/auth/handoff/exchange': () => new Response(JSON.stringify(TOKENS('9')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  render(<SessionProvider identityBaseUrl="http://id" handoffCode="HC1"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  expect(screen.getByTestId('email').textContent).toBe('a@e.com')
  expect(loadRefreshToken()).toBe('RT9') // stored so reloads stay signed in
})

test('a failed handoff exchange settles to anon (player falls back to login)', async () => {
  routeFetch({ '/v1/auth/handoff/exchange': () => new Response('{}', { status: 401 }) })
  render(<SessionProvider identityBaseUrl="http://id" handoffCode="bad"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
})
