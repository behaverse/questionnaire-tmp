import { test, expect, vi, beforeEach } from 'vitest'
import { fetchCatalogue } from './client'

beforeEach(() => { vi.restoreAllMocks() })

test('fetchCatalogue GETs /v1/catalogue (no auth) and returns items', async () => {
  const items = [{ deployment_id: 'd1', title: 'Survey', description: null, questionnaire_ref: 'qst_x@v1', auth: 'none' }]
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await fetchCatalogue('http://vs')
  expect(res).toEqual({ ok: true, items })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/catalogue')
  expect((init as RequestInit | undefined)?.headers).toBeUndefined()   // no auth header
})

test('fetchCatalogue maps a network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await fetchCatalogue('http://vs')).toEqual({ ok: false, error: 'network' })
})

test('fetchCatalogue defaults to [] when items is absent', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  expect(await fetchCatalogue('http://vs')).toEqual({ ok: true, items: [] })
})
