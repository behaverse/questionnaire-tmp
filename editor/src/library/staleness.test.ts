import { collectLibraryRefs, isNewer, staleSet } from './staleness'
import type { Questionnaire } from '../model/types'

test('collectLibraryRefs returns refs not in the pool', () => {
  const model = {
    metadata: { id: 'qst_t', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { question: { prompt: { ref: 'pr_lib@v26.0609' } }, option: { ref: 'opt_lib@v26.0609' } },
      { question: { prompt: { ref: 'pr_draft@v26.0609.dev1' } }, option: {} },
    ] }],
  } as unknown as Questionnaire
  const pool = { 'pr_draft@v26.0609.dev1': { id: 'pr_draft' } }
  const refs = collectLibraryRefs(model, pool)
  expect(refs.sort()).toEqual(['opt_lib@v26.0609', 'pr_lib@v26.0609']) // pool draft excluded
})

test('isNewer compares CalVer; pinned draft never stale; malformed false', () => {
  expect(isNewer('v26.0610', 'v26.0609')).toBe(true)
  expect(isNewer('v26.0609', 'v26.0609')).toBe(false)
  expect(isNewer('v27.0101', 'v26.1231')).toBe(true)
  expect(isNewer('v26.0608', 'v26.0609')).toBe(false)
  expect(isNewer('v26.0610', 'v26.0609.dev1')).toBe(false) // pinned is a draft
  expect(isNewer('garbage', 'v26.0609')).toBe(false)
})

test('staleSet keeps only refs with a strictly-newer latest', () => {
  const refs = ['pr_a@v26.0609', 'pr_b@v26.0609', 'pr_c@v26.0609']
  const latestByKey = { 'pr_a@v26.0609': 'v26.0610', 'pr_b@v26.0609': 'v26.0609', 'pr_c@v26.0609': null }
  expect(staleSet(refs, latestByKey)).toEqual({ 'pr_a@v26.0609': 'v26.0610' })
})
