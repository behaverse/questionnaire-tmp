import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '../session/SessionProvider'
import { AccountView } from './AccountView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function renderView() {
  return render(<SessionProvider identityBaseUrl="http://id"><AccountView /></SessionProvider>)
}

test('register then auto-login lands on the profile', async () => {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(url as string)
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/register')) return new Response(JSON.stringify({ id: 'u1' }), { status: 201 })
    if ((url as string).endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /^sign up$/i }))
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument()
  expect(calls.some((u) => u.endsWith('/v1/auth/register'))).toBe(true)
  expect(calls.some((u) => u.endsWith('/v1/auth/login'))).toBe(true)
})

test('register with an existing email shows the email-in-use message', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/register')) return new Response('{}', { status: 409 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /^sign up$/i }))
  expect(await screen.findByText(/already registered/i)).toBeInTheDocument()
})

test('a short password is rejected before any request', async () => {
  const f = vi.fn(async (url: string) => new Response('{}', { status: (url as string).endsWith('/v1/auth/refresh') ? 401 : 200 }))
  vi.stubGlobal('fetch', f)
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /^sign up$/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/register'))).toBe(false)
})

test('login works from the login tab', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.type(await screen.findByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /^log in$/i }))
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
})

function authedFetch(extra?: (url: string) => Response | null) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    const e = extra?.(url as string)
    if (e) return e
    return new Response('{}', { status: 200 })
  }))
}

test('authed: change-password succeeds and shows confirmation', async () => {
  authedFetch((url) => url.endsWith('/v1/auth/change-password') ? new Response(null, { status: 204 }) : null)
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'password1')
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword2')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/password updated/i)).toBeInTheDocument()
})

test('authed: wrong current password shows the error', async () => {
  authedFetch((url) => url.endsWith('/v1/auth/change-password') ? new Response('{}', { status: 403 }) : null)
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'wrongpass')
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword2')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument()
})

test('authed: a short new password is rejected before any request', async () => {
  const calls: string[] = []
  authedFetch((url) => { if (url.endsWith('/v1/auth/change-password')) calls.push(url); return null })
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'password1')
  await userEvent.type(screen.getByLabelText(/new password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(calls.length).toBe(0)
})
