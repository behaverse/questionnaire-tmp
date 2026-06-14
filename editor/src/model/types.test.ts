import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from './types'

test('fixture conforms to the Questionnaire structural type', () => {
  const q = phq9 as Questionnaire
  expect(q.metadata.id).toMatch(/^qst_/)
  expect(Array.isArray(q.pages)).toBe(true)
  expect(q.pages[0].elements.length).toBeGreaterThan(0)
})
