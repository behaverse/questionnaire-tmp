import { test, expect, vi, beforeEach } from 'vitest'
import { makeAuthFetch } from './authFetch'

beforeEach(() => vi.restoreAllMocks())

test('injects the Bearer access token', async () => {
  const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => 'AT', async () => 'AT')
  await af('http://vs/x')
  expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer AT' })
})

test('on 401 refreshes once and retries with the new token', async () => {
  let access = 'OLD'
  const f = vi.fn(async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>).authorization
    return new Response('{}', { status: auth === 'Bearer NEW' ? 200 : 401 })
  })
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => access, async () => { access = 'NEW'; return 'NEW' })
  const resp = await af('http://vs/x')
  expect(resp.status).toBe(200)
  expect(f).toHaveBeenCalledTimes(2)
})

test('two concurrent 401s trigger exactly one refresh (single-flight)', async () => {
  let access = 'OLD'
  const f = vi.fn(async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>).authorization
    return new Response('{}', { status: auth === 'Bearer NEW' ? 200 : 401 })
  })
  vi.stubGlobal('fetch', f)
  const doRefresh = vi.fn(async () => { access = 'NEW'; return 'NEW' })
  const af = makeAuthFetch(() => access, doRefresh)
  const [a, b] = await Promise.all([af('http://vs/a'), af('http://vs/b')])
  expect(a.status).toBe(200); expect(b.status).toBe(200)
  expect(doRefresh).toHaveBeenCalledTimes(1)
})

test('returns the 401 when refresh fails', async () => {
  const f = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => 'OLD', async () => null)
  const resp = await af('http://vs/x')
  expect(resp.status).toBe(401)
})
