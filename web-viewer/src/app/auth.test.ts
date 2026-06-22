import { test, expect, vi } from 'vitest'
import { loginParticipant } from './auth'

test('loginParticipant posts credentials with the questionnaire-apps audience', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await loginParticipant('http://id:8', 'a@e.com', 'pw')
  expect(res).toEqual({ ok: true, accessToken: 'AT' })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://id:8/v1/auth/login')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'pw', audience: 'questionnaire-apps' })
})

test('loginParticipant maps 401 to invalid_credentials', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect(await loginParticipant('http://id', 'a@e.com', 'bad')).toEqual({ ok: false, error: 'invalid_credentials' })
})

test('loginParticipant maps network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await loginParticipant('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'network' })
})
