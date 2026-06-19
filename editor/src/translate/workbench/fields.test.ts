import { describe, it, expect } from 'vitest'
import { entityFields, isUntranslated } from './fields'

const prompt = { id: 'pr_a', content: { en: { status: 'complete', text: 'How are you?' }, fr: { status: 'draft', text: '' } } }
const option = {
  id: 'opt_a',
  options: [{ index: 1, value: 1 }, { index: 2, value: 2 }],
  content: {
    en: { status: 'complete', label: 'Agreement', units: 'pts', options: [{ index: 1, text: 'Yes' }, { index: 2, text: 'No' }] },
    fr: { status: 'draft', label: 'Accord', options: [{ index: 1, text: 'Oui' }] },
  },
}

describe('entityFields', () => {
  it('prompt → one text row', () => {
    expect(entityFields(prompt, 'prompt', 'en')).toEqual([{ field: { t: 'text' }, label: 'Text', value: 'How are you?' }])
  })
  it('option → label, units, one row per choice (stable order)', () => {
    const f = entityFields(option, 'option', 'en')
    expect(f.map((x) => x.field)).toEqual([{ t: 'opt-label' }, { t: 'opt-units' }, { t: 'choice', index: 1 }, { t: 'choice', index: 2 }])
    expect(f.map((x) => x.value)).toEqual(['Agreement', 'pts', 'Yes', 'No'])
  })
  it('reads a different locale (missing choice text → empty)', () => {
    expect(entityFields(option, 'option', 'fr').map((x) => x.value)).toEqual(['Accord', '', 'Oui', ''])
  })
})

describe('isUntranslated', () => {
  it('true when a source field has text but the target is empty', () => {
    expect(isUntranslated(prompt, 'prompt', 'en', 'fr')).toBe(true)
    expect(isUntranslated(option, 'option', 'en', 'fr')).toBe(true) // units + choice 2 missing in fr
  })
  it('false when every source field is covered in the target', () => {
    const done = { id: 'pr_b', content: { en: { text: 'Hi' }, fr: { text: 'Salut' } } }
    expect(isUntranslated(done, 'prompt', 'en', 'fr')).toBe(false)
  })
  it('false when there is no source text to translate', () => {
    const empty = { id: 'pr_c', content: { en: { text: '' } } }
    expect(isUntranslated(empty, 'prompt', 'en', 'fr')).toBe(false)
  })
})
