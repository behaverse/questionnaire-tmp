import demo from './option_demo.json'
import { validateQuestionnaire } from '../model/validation'

test('option_demo fixture is Schema-2 valid', () => {
  const { valid, errors } = validateQuestionnaire(demo)
  expect(errors).toEqual([])
  expect(valid).toBe(true)
})
