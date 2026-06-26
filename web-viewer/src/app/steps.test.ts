import { flattenSteps, requiredUnanswered, isSingleChoiceItem, stepEntries, keySelectEnabled, backNavEnabled } from './steps'
import type { Runtime, SectionElement } from '../renderer/types'

test('keySelectEnabled / backNavEnabled default ON and honour style flags', () => {
  const rt = (style?: Record<string, unknown>) => ({ pages: [], style } as unknown as Runtime)
  // default (no style / no flag) → enabled
  expect(keySelectEnabled(rt())).toBe(true)
  expect(keySelectEnabled(rt({}))).toBe(true)
  expect(backNavEnabled(rt())).toBe(true)
  expect(keySelectEnabled(null)).toBe(true)
  expect(backNavEnabled(undefined)).toBe(true)
  // explicit false → disabled; any other value stays enabled
  expect(keySelectEnabled(rt({ x_key_select: false }))).toBe(false)
  expect(backNavEnabled(rt({ x_back_nav: false }))).toBe(false)
  expect(keySelectEnabled(rt({ x_key_select: true }))).toBe(true)
})

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
test('stepEntries: items and messages with gating-identical keys; sections expanded one level', () => {
  const steps = flattenSteps(runtime())
  expect(stepEntries(steps[0]).map((e) => [e.key, e.kind])).toEqual([['msg_intro', 'message']])
  expect(stepEntries(steps[1]).map((e) => [e.key, e.kind])).toEqual([['it_1', 'item']])
  expect(stepEntries(steps[2]).map((e) => [e.key, e.kind, e.sectionKey, e.rowIndex])).toEqual([
    ['it_a', 'item', 'sec_m', 0],
    ['sec_m__r1', 'item', 'sec_m', 1],
  ])
})
test('stepEntries skips unrenderable items (deriveWidget null), matching gating', () => {
  const dateItem = { id: 'it_d', question: { prompt: { content: { en: { text: 'D' } } } }, option: { input_data_type: 'date', measurement_type: 'interval' } }
  const rt: Runtime = { provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en', pages: [{ id: 'p1', elements: [dateItem] }] }
  expect(stepEntries(flattenSteps(rt)[0])).toEqual([])
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
