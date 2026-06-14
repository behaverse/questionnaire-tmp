import phq9 from '../__fixtures__/phq9.json'
import { fetchFromLibrary } from './library'

test('fetchFromLibrary requests the unresolved definition and parses it', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => {
    calls.push(url)
    return { ok: true, json: async () => phq9, text: async () => JSON.stringify(phq9) } as Response
  }) as unknown as typeof fetch
  const model = await fetchFromLibrary('qst_phq9', 'v26.0609', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(model.metadata.id).toBe('qst_phq9')
  expect(calls[0]).toContain('/v1/questionnaires/qst_phq9/versions/v26.0609/definition')
  expect(calls[0]).toContain('resolved=false')
})

test('fetchFromLibrary strips a trailing slash on the base url', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => {
    calls.push(url)
    return { ok: true, json: async () => ({ metadata: { id: 'qst_x' } }), text: async () => '' } as Response
  }) as unknown as typeof fetch
  await fetchFromLibrary('qst_x', 'v1', { baseUrl: 'http://lib/', fetchImpl: fakeFetch })
  expect(calls[0]).toBe('http://lib/v1/questionnaires/qst_x/versions/v1/definition?resolved=false')
  expect(calls[0]).not.toContain('//v1')
})

test('fetchFromLibrary throws on 404', async () => {
  const fakeFetch = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  await expect(fetchFromLibrary('qst_missing', 'v1', { baseUrl: 'http://lib', fetchImpl: fakeFetch })).rejects.toThrow()
})

import { parseRef, fetchEntityBody } from './library'

test('parseRef maps prefix → entity type', () => {
  expect(parseRef('pr_aiss_q_2@v26.0602')).toEqual({ type: 'prompt', id: 'pr_aiss_q_2', version: 'v26.0602' })
  expect(parseRef('opt_agreement_7@v1')).toEqual({ type: 'option', id: 'opt_agreement_7', version: 'v1' })
  expect(parseRef('msg_welcome@v1')?.type).toBe('message')
  expect(parseRef('no_at_sign')).toBeNull()
})

test('fetchEntityBody requests the typed entity endpoint and returns the body', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x' }) } as Response }) as unknown as typeof fetch
  const body = await fetchEntityBody('pr_x@v26.0602', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(body).toEqual({ id: 'pr_x' })
  expect(calls[0]).toContain('/v1/entities/prompt/pr_x')
  expect(calls[0]).toContain('version=v26.0602')
})

test('fetchEntityBody returns null on a non-OK response or network error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: boom })).toBeNull()
})
