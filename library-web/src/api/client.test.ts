import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, rawDefinitionUrl, resolvedDefinitionUrl } from './client'

beforeEach(() => { vi.restoreAllMocks() })

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'x',
    json: async () => body,
  } as Response)
}

describe('api client', () => {
  it('builds query params and returns json', async () => {
    const f = mockFetch(200, { items: [], total: 0, limit: 20, offset: 0 })
    vi.stubGlobal('fetch', f)
    const res = await api.listQuestionnaires({ q: 'phq', domain: 'depression' })
    expect(res.total).toBe(0)
    const calledUrl = (f.mock.calls[0][0] as URL).toString()
    expect(calledUrl).toContain('/v1/questionnaires')
    expect(calledUrl).toContain('q=phq')
    expect(calledUrl).toContain('domain=depression')
  })

  it('throws ApiError carrying the envelope code on non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetch(410, { error: { code: 'gone', message: 'withdrawn' } }))
    await expect(api.resolvedDefinition('qst_x', 'v26.0601')).rejects.toMatchObject({
      status: 410, code: 'gone',
    })
  })

  it('rawDefinitionUrl points at the unresolved definition', () => {
    expect(rawDefinitionUrl('qst_x', 'v26.0601')).toContain('/v1/questionnaires/qst_x/versions/v26.0601/definition')
  })

  it('resolvedDefinitionUrl requests the content-inlined (self-contained) definition', () => {
    const url = resolvedDefinitionUrl('qst_x', 'v26.0601')
    expect(url).toContain('/v1/questionnaires/qst_x/versions/v26.0601/definition')
    expect(url).toContain('resolved=true')
  })

  it('listQuestionnaires returns instrument groups', async () => {
    const group = { instrument_id: 'inst_asrs', title: 'ASRS-v1.1', form_count: 2, languages: ['en'], domain: ['adhd'], forms: [] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [group], total: 1, limit: 20, offset: 0 }) } as Response))
    const res = await api.listQuestionnaires({})
    expect(res.items[0].form_count).toBe(2)
    expect(res.items[0].instrument_id).toBe('inst_asrs')
  })

  it('resolves relative paths same-origin when VITE_API_BASE_URL is empty', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { api: sameOrigin } = await import('./client')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [], total: 0, limit: 20, offset: 0 }) } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await sameOrigin.listQuestionnaires({})
    const calledUrl = (fetchMock.mock.calls[0][0] as URL).toString()
    expect(calledUrl).toBe(`${window.location.origin}/v1/questionnaires`)
    vi.unstubAllEnvs(); vi.resetModules()
  })
})
