import { test, expect, vi, beforeEach } from 'vitest'
import { fetchMySessions, downloadMyData } from './client'

beforeEach(() => { vi.restoreAllMocks() })

test('fetchMySessions sends the bearer token and returns sessions', async () => {
  const sessions = [{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v1', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }]
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sessions }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await fetchMySessions('http://vs', 'TOK')
  expect(res).toEqual({ ok: true, sessions })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/me/sessions')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer TOK' })
})

test('fetchMySessions maps 401 to unauthorized', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect(await fetchMySessions('http://vs', 'TOK')).toEqual({ ok: false, error: 'unauthorized' })
})

test('downloadMyData fetches with the bearer token and creates an object URL', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('id\nr1\n', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const createObjectURL = vi.fn().mockReturnValue('blob:x')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
  await downloadMyData('http://vs', 'TOK')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/me/responses.csv')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer TOK' })
  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
})
