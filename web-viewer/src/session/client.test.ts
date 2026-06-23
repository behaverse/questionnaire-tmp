import { test, expect, vi, beforeEach } from 'vitest'
import { login, refresh, logout, fetchMe, register } from './client'

beforeEach(() => vi.restoreAllMocks())

function stub(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

test('login posts credentials + audience and returns tokens', async () => {
  const f = stub(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' })
  vi.stubGlobal('fetch', f)
  const r = await login('http://id', 'a@e.com', 'pw')
  expect(r).toEqual({ ok: true, tokens: { access: 'AT', refresh: 'RT', expiresIn: 900 } })
  const [url, init] = f.mock.calls[0]
  expect(url).toBe('http://id/v1/auth/login')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'pw', audience: 'questionnaire-apps' })
})

test('login maps 401 to invalid_credentials', async () => {
  vi.stubGlobal('fetch', stub(401, { error: { code: 'bad' } }))
  expect(await login('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'invalid_credentials' })
})

test('login maps a thrown fetch to network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await login('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'network' })
})

test('refresh posts the refresh token and returns the rotated tokens', async () => {
  const f = stub(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 900, token_type: 'Bearer' })
  vi.stubGlobal('fetch', f)
  const r = await refresh('http://id', 'RT')
  expect(r).toEqual({ ok: true, tokens: { access: 'AT2', refresh: 'RT2', expiresIn: 900 } })
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ refresh_token: 'RT' })
})

test('refresh maps 401 to expired', async () => {
  vi.stubGlobal('fetch', stub(401, { error: { code: 'refresh_reuse' } }))
  expect(await refresh('http://id', 'RT')).toEqual({ ok: false, error: 'expired' })
})

test('logout posts the refresh token (best-effort, never throws)', async () => {
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  await logout('http://id', 'RT')
  expect(f.mock.calls[0][0]).toBe('http://id/v1/auth/logout')
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ refresh_token: 'RT' })
})

test('logout swallows a network error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  await expect(logout('http://id', 'RT')).resolves.toBeUndefined()
})

test('fetchMe sends Bearer and parses the user', async () => {
  const user = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }
  const f = stub(200, user)
  vi.stubGlobal('fetch', f)
  const r = await fetchMe('http://id', 'AT')
  expect(r).toEqual({ ok: true, user })
  expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer AT' })
})

test('fetchMe returns ok:false on 401', async () => {
  vi.stubGlobal('fetch', stub(401, {}))
  expect(await fetchMe('http://id', 'AT')).toEqual({ ok: false })
})

test('register posts the profile fields with audience and returns ok on 201', async () => {
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'u1' }), { status: 201 }))
  vi.stubGlobal('fetch', f)
  const r = await register('http://id', 'a@e.com', 'password1', 'Al')
  expect(r).toEqual({ ok: true })
  const [url, init] = f.mock.calls[0]
  expect(url).toBe('http://id/v1/auth/register')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'password1', display_name: 'Al', audience: 'questionnaire-apps' })
})

test('register maps 409 to email_in_use', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 409 })))
  expect(await register('http://id', 'a@e.com', 'password1', '')).toEqual({ ok: false, error: 'email_in_use' })
})

test('register maps 422 to invalid', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })))
  expect(await register('http://id', 'a@e.com', 'short', '')).toEqual({ ok: false, error: 'invalid' })
})

test('register maps a thrown fetch to network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await register('http://id', 'a@e.com', 'password1', '')).toEqual({ ok: false, error: 'network' })
})
