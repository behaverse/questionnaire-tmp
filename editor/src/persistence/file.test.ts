import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { readQuestionnaireFile, downloadFilename, bundleData, bundleFilename } from './file'
import { describe, it, expect } from 'vitest'
import { parseBundle } from './file'

test('readQuestionnaireFile parses a File', async () => {
  const file = new File([JSON.stringify(phq9)], 'phq9.json', { type: 'application/json' })
  const model = await readQuestionnaireFile(file)
  expect(model.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
})

test('downloadFilename derives from metadata id', () => {
  expect(downloadFilename(phq9 as Questionnaire)).toBe('qst_phq9.json')
})

test('bundleData wraps questionnaire + entities; filename has .bundle.json', () => {
  const model = { metadata: { id: 'qst_t' }, pages: [] } as unknown as import('../model/types').Questionnaire
  const pool = { 'pr_x@v26.0609.dev1': { id: 'pr_x' } }
  expect(bundleData(model, pool)).toEqual({ questionnaire: model, entities: pool })
  expect(bundleFilename(model)).toBe('qst_t.bundle.json')
})

describe('parseBundle', () => {
  const q = { metadata: { id: 'qst_x', language: 'en' }, pages: [] } as unknown as Questionnaire
  it('parses a valid bundle', () => {
    const text = JSON.stringify(bundleData(q, { 'pr_x@v1': { id: 'pr_x' } }))
    expect(parseBundle(text)).toEqual({ questionnaire: q, entities: { 'pr_x@v1': { id: 'pr_x' } } })
  })
  it('throws on a non-bundle (missing questionnaire/entities)', () => {
    expect(() => parseBundle(JSON.stringify({ foo: 1 }))).toThrow(/not a valid questionnaire bundle/i)
    expect(() => parseBundle('{ bad json')).toThrow()
  })
})
