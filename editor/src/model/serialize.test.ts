import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import { parseQuestionnaire, serializeQuestionnaire } from './serialize'

test('parse then serialize round-trips deep-equal (refs intact)', () => {
  for (const fx of [phq9, kitchensink]) {
    const text = JSON.stringify(fx)
    const model = parseQuestionnaire(text)
    const out = serializeQuestionnaire(model)
    expect(JSON.parse(out)).toEqual(fx)
  }
})

test('parse rejects invalid JSON', () => {
  expect(() => parseQuestionnaire('{not json')).toThrow()
})
