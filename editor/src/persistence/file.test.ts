import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { readQuestionnaireFile, downloadFilename } from './file'

test('readQuestionnaireFile parses a File', async () => {
  const file = new File([JSON.stringify(phq9)], 'phq9.json', { type: 'application/json' })
  const model = await readQuestionnaireFile(file)
  expect(model.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
})

test('downloadFilename derives from metadata id', () => {
  expect(downloadFilename(phq9 as Questionnaire)).toBe('qst_phq9.json')
})

import { bundleData, bundleFilename } from './file'

test('bundleData wraps questionnaire + entities; filename has .bundle.json', () => {
  const model = { metadata: { id: 'qst_t' }, pages: [] } as unknown as import('../model/types').Questionnaire
  const pool = { 'pr_x@v26.0609.dev1': { id: 'pr_x' } }
  expect(bundleData(model, pool)).toEqual({ questionnaire: model, entities: pool })
  expect(bundleFilename(model)).toBe('qst_t.bundle.json')
})
