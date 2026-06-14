import minimal from '../__fixtures__/minimal.json'
import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import type { Questionnaire } from './types'
import { parseQuestionnaire, serializeQuestionnaire } from './serialize'
import { validateQuestionnaire } from './validation'
import { reorder, deleteNode } from './tree'

test('no-op round-trip is identical and valid', () => {
  for (const fx of [minimal, phq9, kitchensink]) {
    const model = parseQuestionnaire(JSON.stringify(fx))
    expect(validateQuestionnaire(model).valid).toBe(true)
    const out = JSON.parse(serializeQuestionnaire(model))
    expect(out).toEqual(fx)
  }
})

test('restructure (reorder a page elements + delete one) stays Schema-2 valid', () => {
  const model = parseQuestionnaire(JSON.stringify(kitchensink)) as Questionnaire
  const page0 = model.pages[0]
  let next = model
  if (page0.elements.length >= 2) next = reorder(model, ['pages', 0, 'elements'], 0, 1)
  if (next.pages.length > 1) next = deleteNode(next, ['pages', next.pages.length - 1])
  const { valid, errors } = validateQuestionnaire(next)
  expect(errors).toEqual([])
  expect(valid).toBe(true)
})
