import { flattenSteps, requiredUnanswered, isSingleChoiceItem } from './steps'
import type { Runtime, SectionElement } from '../renderer/types'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }],
  content: { en: { options: [{ index: 1, text: 'A' }] } },
}
const item = (id?: string, required = false) =>
  ({ ...(id ? { id } : {}), question: { prompt: { content: { en: { text: 'P' } } } }, option: opt, required })
const message = { id: 'msg_intro', content: { en: { text: 'Welcome' } } }
const section = { id: 'sec_m', shared_option: opt, elements: [item('it_a', true), item(undefined, true)] }

const runtime = (style: Record<string, unknown> = {}): Runtime => ({
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en', style,
  pages: [
    { id: 'page_1', elements: [message, item('it_1', true)] },
    { id: 'page_2', elements: [section, item(undefined)] },
  ],
})

test('focus mode (default): one step per element; sections stay whole; page_id retained', () => {
  const steps = flattenSteps(runtime())
  expect(steps.map((s) => s.pageId)).toEqual(['page_1', 'page_1', 'page_2', 'page_2'])
  expect(steps.map((s) => s.elements.length)).toEqual([1, 1, 1, 1])
  expect(steps[1].elements[0].key).toBe('it_1')
  expect(steps[2].elements[0].key).toBe('sec_m')
  expect(steps[3].elements[0].key).toBe('page_2__el1')
})
test('classic mode: one step per page', () => {
  const steps = flattenSteps(runtime({ x_presentation: 'classic' }))
  expect(steps).toHaveLength(2)
  expect(steps[0].elements.map((e) => e.key)).toEqual(['msg_intro', 'it_1'])
})
test('requiredUnanswered: items + matrix rows individually; messages never block', () => {
  const steps = flattenSteps(runtime())
  expect(requiredUnanswered(steps[0], {})).toEqual([])
  expect(requiredUnanswered(steps[1], {})).toEqual(['it_1'])
  expect(requiredUnanswered(steps[1], { it_1: 0 })).toEqual([])
  expect(requiredUnanswered(steps[2], { it_a: 0 })).toEqual(['sec_m__r1'])
  expect(requiredUnanswered(steps[1], { it_1: '' })).toEqual(['it_1'])
  expect(requiredUnanswered(steps[1], { it_1: [] })).toEqual(['it_1'])
})
test('isSingleChoiceItem: true for choice.*.single item steps only', () => {
  const steps = flattenSteps(runtime())
  expect(isSingleChoiceItem(steps[1])).toBe(true)
  expect(isSingleChoiceItem(steps[0])).toBe(false)
  expect(isSingleChoiceItem(steps[2])).toBe(false)
})

// I2 — renderability-aware gating
test('required item with unsupported widget (date) does not gate Next', () => {
  const unsupportedOpt = {
    input_data_type: 'date', measurement_type: 'ratio', selection: 'single',
    options: [{ index: 1, value: 0 }],
    content: { en: { options: [{ index: 1, text: 'A' }] } },
  }
  const rt: Runtime = {
    provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en', style: {},
    pages: [{ id: 'p1', elements: [
      { id: 'it_unsup', required: true,
        question: { prompt: { content: { en: { text: 'Date?' } } } },
        option: unsupportedOpt },
    ] }],
  }
  const steps = flattenSteps(rt)
  expect(requiredUnanswered(steps[0], {})).toEqual([])
})
test('required item inside a nested section (depth>0) does not gate Next', () => {
  const innerSection: SectionElement = {
    id: 'sec_inner', shared_option: opt, elements: [item('inner_it', true)],
  }
  const outerSection: SectionElement = {
    id: 'sec_outer', shared_option: opt, elements: [innerSection],
  }
  const rt: Runtime = {
    provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en', style: {},
    pages: [{ id: 'p1', elements: [outerSection] }],
  }
  const steps = flattenSteps(rt)
  expect(requiredUnanswered(steps[0], {})).toEqual([])
})
