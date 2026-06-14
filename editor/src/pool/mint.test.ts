import { draftVersion, mintEntityId, collectIds } from './mint'
import type { Questionnaire } from '../model/types'

test('draftVersion appends .dev1, stripping any existing .devN', () => {
  expect(draftVersion('v26.0609')).toBe('v26.0609.dev1')
  expect(draftVersion('v26.0609.dev3')).toBe('v26.0609.dev1')
  expect(draftVersion(undefined)).toBe('v26.0609.dev1')
  expect(draftVersion('garbage')).toBe('v26.0609.dev1')
})

test('mintEntityId returns the first free <prefix>_new_<n>', () => {
  expect(mintEntityId('pr', new Set())).toBe('pr_new_1')
  expect(mintEntityId('pr', new Set(['pr_new_1', 'pr_new_2']))).toBe('pr_new_3')
})

test('collectIds gathers ids + ref ids (sans version) from model + pool', () => {
  const model = {
    metadata: { id: 'qst_t', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', elements: [{ question: { prompt: { ref: 'pr_a@v26.0609' } }, option: {} }] }],
  } as unknown as Questionnaire
  const ids = collectIds(model, { 'pr_b@v26.0609.dev1': { id: 'pr_b' } })
  expect(ids.has('qst_t')).toBe(true)
  expect(ids.has('page_1')).toBe(true)
  expect(ids.has('pr_a')).toBe(true)   // ref id, version stripped
  expect(ids.has('pr_b')).toBe(true)   // pool key, version stripped
})
