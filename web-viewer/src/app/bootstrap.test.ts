import { mintSession, parseParams, completeSession, getSession, getRuntime, switchLocale } from './bootstrap'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('parseParams reads deployment/locale/viewer_url/fixture/theme', () => {
  expect(parseParams('?deployment=dpl_1&locale=pt&viewer_url=http://vs:9&fixture=mini&theme=sage')).toEqual({
    deploymentId: 'dpl_1', locale: 'pt', vsBaseUrl: 'http://vs:9', fixture: 'mini', theme: 'sage',
    identityBaseUrl: 'http://localhost:8100', invite: null,
  })
  expect(parseParams('')).toEqual({ deploymentId: null, locale: null, vsBaseUrl: 'http://localhost:8001', fixture: null, theme: null, identityBaseUrl: 'http://localhost:8100', invite: null })
})

const ok = { session_id: 's1', session_token: 't1', agent_id: 'agent_ab12', session_index: 1, runtime: { metadata: {} }, theme: null, ephemeral: false, participant_sub: null }

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
test('mintSession surfaces ephemeral from the response', async () => {
  const body = { session_id: 's1', session_token: 't1', agent_id: 'agent_a', session_index: 1, runtime: { metadata: {} }, theme: null, ephemeral: true }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })))
  const res = await mintSession('http://vs:9', 'dpl_1', null)
  expect(res).toMatchObject({ ok: true, ephemeral: true })
})
test('getSession returns status/locale/agent on 200, ephemeral on 409, invalid on 404, network on throw', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'in_progress', last_active_locale: 'pt', agent_id: 'agent_z', session_index: 1 }), { status: 200 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":{"code":"ephemeral_no_resume"}}', { status: 409 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'ephemeral' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'invalid' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')))
  expect(await getSession('http://vs:9', 's1', 't1')).toEqual({ kind: 'network' })
})
test('getRuntime fetches the resumed runtime; switchLocale posts the new locale', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ metadata: { id: 'qst_x' } }), { status: 200 })))
  expect(await getRuntime('http://vs:9', 's1', 't1')).toMatchObject({ metadata: { id: 'qst_x' } })
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ runtime: { metadata: { id: 'qst_x' } } }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await switchLocale('http://vs:9', 's1', 't1', 'pt')).toMatchObject({ metadata: { id: 'qst_x' } })
  expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ locale: 'pt' })
})

test('parseParams reads identity_url', () => {
  expect(parseParams('?deployment=d&identity_url=http://id:7').identityBaseUrl).toBe('http://id:7')
})

test('mintSession sends Authorization when a token is given', async () => {
  const ok = { session_id: 's', session_token: 't', agent_id: 'alice', session_index: 1,
               runtime: {}, theme: null, ephemeral: false, participant_sub: 'alice' }
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await mintSession('http://vs', 'dpl_1', null, 'tok-123')
  expect(res).toMatchObject({ ok: true, participant_sub: 'alice' })
  const [, init] = fetchMock.mock.calls[0]
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer tok-123' })
})

test('mintSession maps 401 auth_required to kind auth_required', async () => {
  const body = { error: { code: 'auth_required', message: 'login' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 401 })))
  const res = await mintSession('http://vs', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind: 'auth_required', code: 'auth_required' })
})

test('parseParams reads invite', () => {
  expect(parseParams('?deployment=d&invite=abc.def').invite).toBe('abc.def')
})

test('mintSession sends invite in the body when given', async () => {
  const ok = { session_id: 's', session_token: 't', agent_id: 'P-1', session_index: 1,
               runtime: {}, theme: null, ephemeral: false, participant_sub: 'invite:P-1' }
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)
  await mintSession('http://vs', 'dpl_1', null, undefined, 'tok.sig')
  const [, init] = fetchMock.mock.calls[0]
  expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({ invite: 'tok.sig' })
})

test('mintSession maps 401 invite_required to kind invite_invalid', async () => {
  const body = { error: { code: 'invite_required', message: 'bad invite' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 401 })))
  const res = await mintSession('http://vs', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind: 'invite_invalid', code: 'invite_required' })
})
