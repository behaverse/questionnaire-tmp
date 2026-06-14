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
