// editor/src/export/surveyjs.test.ts
import { describe, it, expect } from 'vitest'
import { toSurveyJS } from './surveyjs'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_demo', title: 'Demo Scale', language: 'en' },
  pages: [],
  scores: [{ id: 'total', scorer: 'scr_demo@v1', path: '/scores/total/value', name: 'Demo total' }],
  logic: [{ type: 'branch', condition: 'total >= 10', action: {} }],
} as unknown as Questionnaire

const runtime: Runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_demo', title: 'Demo Scale', language: 'en' },
  locale: 'en',
  pages: [
    {
      id: 'p1', title: 'Page One',
      elements: [
        {
          id: 'it_q1', required: true, show_if: 'true',
          question: { prompt: { content: { en: { text: 'I plan tasks.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
          },
        },
        {
          id: 'it_q2', show_if: 'it_q1 == 2',
          question: { prompt: { content: { en: { text: 'Ordinal item.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'Low' }, { index: 1, text: 'High' }] } },
          },
        },
        {
          id: 'it_q3', show_if: 'length(it_name) > 0',
          question: { prompt: { content: { en: { text: 'Complex-logic item.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }],
            content: { en: { options: [{ index: 0, text: 'Only' }] } },
          },
        },
      ],
    },
  ],
}

describe('toSurveyJS', () => {
  const { json, dropped } = toSurveyJS(runtime, model, 'en')
  const page0 = (json.pages as any[])[0]
  const els = page0.elements as any[]

  it('produces a valid SurveyJS shell with a page of elements', () => {
    expect(json.title).toBe('Demo Scale')
    expect(Array.isArray(json.pages)).toBe(true)
    expect(els.length).toBe(3)
  })

  it('maps single nominal → radiogroup with value/text choices and isRequired', () => {
    const q1 = els.find((e) => e.name === 'it_q1')
    expect(q1.type).toBe('radiogroup')
    expect(q1.isRequired).toBe(true)
    expect(q1.choices).toEqual([{ value: 1, text: 'No' }, { value: 2, text: 'Yes' }])
    expect(q1.visibleIf).toBeUndefined() // show_if 'true' → omitted
  })

  it('maps single ordinal → rating and translates a simple equality show_if', () => {
    const q2 = els.find((e) => e.name === 'it_q2')
    expect(q2.type).toBe('rating')
    expect(q2.rateValues).toEqual([{ value: 1, text: 'Low' }, { value: 2, text: 'High' }])
    expect(q2.visibleIf).toBe('{it_q1} = 2')
  })

  it('drops complex logic and scoring with descriptive messages', () => {
    const q3 = els.find((e) => e.name === 'it_q3')
    expect(q3.visibleIf).toBeUndefined()
    expect(dropped.some((d) => /it_q3/.test(d) && /visibility|show_if/i.test(d))).toBe(true)
    expect(dropped.some((d) => /Demo total|scoring/i.test(d))).toBe(true)
    expect(dropped.some((d) => /branch/i.test(d))).toBe(true)
  })
})
