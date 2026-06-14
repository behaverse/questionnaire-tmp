import { newQuestionnaire } from './scaffold'
import { validateQuestionnaire } from './validation'

test('newQuestionnaire() produces a Schema-2-valid scaffold', () => {
  const { valid, errors } = validateQuestionnaire(newQuestionnaire())
  expect(errors).toEqual([])
  expect(valid).toBe(true)
})
