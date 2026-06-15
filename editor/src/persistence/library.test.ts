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

import { parseRef, fetchEntityBody, searchEntities } from './library'

test('parseRef maps prefix → entity type', () => {
  expect(parseRef('pr_aiss_q_2@v26.0602')).toEqual({ type: 'prompt', id: 'pr_aiss_q_2', version: 'v26.0602' })
  expect(parseRef('opt_agreement_7@v1')).toEqual({ type: 'option', id: 'opt_agreement_7', version: 'v1' })
  expect(parseRef('msg_welcome@v1')?.type).toBe('message')
  expect(parseRef('no_at_sign')).toBeNull()
})

test('fetchEntityBody requests the versioned definition endpoint', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x', content: {} }) } as Response }) as unknown as typeof fetch
  const body = await fetchEntityBody('pr_x@v26.0602', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(body).toEqual({ id: 'pr_x', content: {} })
  expect(calls[0]).toBe('http://lib/v1/entities/prompt/pr_x/versions/v26.0602/definition')
})

test('fetchEntityBody returns null on non-OK / error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
})

test('fetchEntityBody returns null on a network error', async () => {
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await fetchEntityBody('pr_x@v1', { baseUrl: 'http://lib', fetchImpl: boom })).toBeNull()
})

test('searchEntities queries /v1/entities/{etype} and returns items', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ items: [{ id: 'pr_a', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }) } as Response }) as unknown as typeof fetch
  const { items, total } = await searchEntities('prompt', 'mood', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(total).toBe(1)
  expect(items[0].id).toBe('pr_a')
  expect(calls[0]).toContain('/v1/entities/prompt?')
  expect(calls[0]).toContain('q=mood')
})

import { latestVersion } from './library'

test('latestVersion returns the latest entity version', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => { calls.push(url); return { ok: true, json: async () => ({ id: 'pr_x', version: 'v26.0610', entity_type: 'prompt', status: 'published' }) } as Response }) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: fakeFetch })).toBe('v26.0610')
  expect(calls[0]).toBe('http://lib/v1/entities/prompt/pr_x')
})

test('latestVersion returns null on 404 / error', async () => {
  const miss = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: miss })).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await latestVersion('prompt', 'pr_x', { baseUrl: 'http://lib', fetchImpl: boom })).toBeNull()
})

describe('parseRef scorer prefix', () => {
  it('resolves a scr_ ref to the scorer type', () => {
    expect(parseRef('scr_phq9@v26.0602')).toEqual({ type: 'scorer', id: 'scr_phq9', version: 'v26.0602' })
  })
  it('still resolves a prompt ref', () => {
    expect(parseRef('pr_x@v26.0601')).toEqual({ type: 'prompt', id: 'pr_x', version: 'v26.0601' })
  })
})
