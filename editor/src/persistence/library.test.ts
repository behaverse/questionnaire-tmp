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

test('fetchFromLibrary throws on 404', async () => {
  const fakeFetch = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  await expect(fetchFromLibrary('qst_missing', 'v1', { baseUrl: 'http://lib', fetchImpl: fakeFetch })).rejects.toThrow()
})
