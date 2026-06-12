import { mintSession, parseParams, completeSession } from './bootstrap'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('parseParams reads deployment/locale/viewer_url/fixture', () => {
  expect(parseParams('?deployment=dpl_1&locale=pt&viewer_url=http://vs:9&fixture=mini')).toEqual({
    deploymentId: 'dpl_1', locale: 'pt', vsBaseUrl: 'http://vs:9', fixture: 'mini',
  })
  expect(parseParams('')).toEqual({ deploymentId: null, locale: null, vsBaseUrl: 'http://localhost:8001', fixture: null })
})

const ok = { session_id: 's1', session_token: 't1', agent_id: 'agent_ab12', session_index: 1, runtime: { metadata: {} }, theme: null }

test('mintSession posts viewer identity and returns the bundle', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await mintSession('http://vs:9', 'dpl_1', 'pt')
  expect(res).toEqual({ ok: true, ...ok })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs:9/v1/sessions/new')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({
    deployment_id: 'dpl_1', viewer_id: 'behaverse-web-viewer', viewer_version: 'v26.0612', locale: 'pt',
  })
})
test.each([
  [404, 'invalid_link'], [409, 'not_open'], [410, 'closed'], [422, 'failed'], [500, 'failed'],
])('HTTP %i → %s', async (status, kind) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { code: 'x', message: 'm' } }), { status })))
  const res = await mintSession('http://vs:9', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind, code: 'x' })
})
test('network failure → failed/network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
  expect(await mintSession('http://vs:9', 'dpl_1', null)).toEqual({ ok: false, kind: 'failed', code: 'network' })
})
test('completeSession posts with the bearer token and reports success', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"submitted"}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(true)
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs:9/v1/sessions/s1/complete')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer t1' })
})
test('completeSession returns false on http error and on network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(false)
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')))
  expect(await completeSession('http://vs:9', 's1', 't1')).toBe(false)
})
