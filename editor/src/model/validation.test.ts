import minimal from '../__fixtures__/minimal.json'
import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import { validateQuestionnaire } from './validation'

test('real fixtures are Schema-2 valid', () => {
  for (const fx of [minimal, phq9, kitchensink]) {
    const { valid, errors } = validateQuestionnaire(fx)
    expect(errors).toEqual([])
    expect(valid).toBe(true)
  }
})

test('a missing required field is reported with a path', () => {
  const broken = { metadata: { id: 'qst_x' } } // no pages
  const { valid, errors } = validateQuestionnaire(broken)
  expect(valid).toBe(false)
  expect(errors.some((e) => /pages/.test(e.path) || /pages/.test(e.message))).toBe(true)
})
