import { describe, it, expect } from 'vitest'
import { itemView, flattenElements } from './walk'
import type { ItemElement, SectionElement } from '@behaverse/questionnaire-renderer'

const choiceItem: ItemElement = {
  id: 'it_q1',
  required: true,
  question: { prompt: { content: { en: { text: 'I plan tasks.' }, fr: { text: 'Je planifie.' } } } },
  option: {
    id: 'opt_agree', input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
    options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
    content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
  },
}

describe('itemView', () => {
  it('resolves prompt + choices + widget for the active locale', () => {
    const v = itemView(choiceItem, 'en', 'q1')
    expect(v.id).toBe('it_q1')
    expect(v.prompt).toBe('I plan tasks.')
    expect(v.required).toBe(true)
    expect(v.widget).toBe('choice.nominal.single')
    expect(v.choices).toEqual([
      { index: 0, value: 1, text: 'No' },
      { index: 1, value: 2, text: 'Yes' },
    ])
    expect(v.choicesError).toBeUndefined()
  })

  it('captures choicesError instead of throwing when the locale texts are missing', () => {
    const v = itemView(choiceItem, 'de', 'q1')
    expect(v.choices).toEqual([])
    expect(v.choicesError).toMatch(/de/)
  })

  it('falls back to the provided id when the item has none', () => {
    const v = itemView({ ...choiceItem, id: undefined }, 'en', 'q7')
    expect(v.id).toBe('q7')
  })
})

describe('flattenElements', () => {
  it('recurses sections, tags section titles, and applies shared_option to optionless items', () => {
    const sharedOpt = choiceItem.option
    const section: SectionElement = {
      title: 'Part A',
      shared_option: sharedOpt,
      elements: [
        { id: 'it_a', question: { prompt: { content: { en: { text: 'A?' } } } } } as unknown as ItemElement,
      ],
    }
    const flat = flattenElements([section])
    expect(flat).toHaveLength(1)
    expect(flat[0].sectionTitle).toBe('Part A')
    expect(flat[0].item?.option).toBe(sharedOpt)
  })
})
