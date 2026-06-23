import { test, expect, vi, beforeEach } from 'vitest'
import { fetchMySessions, downloadMyData } from './client'
import type { AuthFetch } from '../session/authFetch'

beforeEach(() => { vi.restoreAllMocks() })

test('fetchMySessions sends the bearer token and returns sessions', async () => {
  const sessions = [{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v1', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }]
  const authFetch: AuthFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sessions }), { status: 200 }))
  const res = await fetchMySessions('http://vs', authFetch)
  expect(res).toEqual({ ok: true, sessions })
  expect(authFetch).toHaveBeenCalledWith('http://vs/v1/me/sessions')
})

test('fetchMySessions maps 401 to unauthorized', async () => {
  const authFetch: AuthFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
  expect(await fetchMySessions('http://vs', authFetch)).toEqual({ ok: false, error: 'unauthorized' })
})

test('downloadMyData fetches with authFetch and creates an object URL', async () => {
  const authFetch: AuthFetch = vi.fn().mockResolvedValue(new Response('id\nr1\n', { status: 200 }))
  const createObjectURL = vi.fn().mockReturnValue('blob:x')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
  await downloadMyData('http://vs', authFetch)
  expect(authFetch).toHaveBeenCalledWith('http://vs/v1/me/responses.csv')
  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
})
