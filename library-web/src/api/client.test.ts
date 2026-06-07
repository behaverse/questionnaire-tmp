import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError, rawDefinitionUrl } from './client'

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
})
