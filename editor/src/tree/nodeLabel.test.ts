// editor/src/tree/nodeLabel.test.ts
import { describe, it, expect } from 'vitest'
import { resolveNodeLabel } from './nodeLabel'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en' },
  pages: [{ id: 'page_main', title: 'Main', elements: [
    { option: { ref: 'opt_a@v26.0606' }, question: { prompt: { ref: 'pr_q1@v26.0606' } } }, // 0: item
    { ref: 'msg_m1@v26.0606' },                                                              // 1: message
    { id: 'sec_1', title: 'Section one', elements: [] },                                      // 2: section
  ] }],
} as unknown as Questionnaire

const pool = { 'pr_q1@v26.0606': { id: 'pr_q1', content: { en: { text: 'How are you?' }, fr: { text: 'Ça va?' } } } } as never
const resolved = { 'msg_m1@v26.0606': { id: 'msg_m1', content: { en: { text: 'Welcome' } } } } as never

describe('resolveNodeLabel', () => {
  it('resolves an item prompt from the pool in the active locale', () => {
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 0], pool, resolved, 'en'))
      .toEqual({ text: 'How are you?', id: 'pr_q1', ref: 'pr_q1@v26.0606' })
  })
  it('falls back across locales when the active locale is missing', () => {
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 0], pool, resolved, 'de').text).toBe('How are you?')
  })
  it('resolves a message from the resolved map', () => {
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 1], pool, {} as never, 'en').text).toBe(null)
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 1], pool, resolved, 'en').text).toBe('Welcome')
  })
  it('returns text=null + the id when a ref is unresolved (offline)', () => {
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 0], {} as never, {} as never, 'en'))
      .toEqual({ text: null, id: 'pr_q1', ref: 'pr_q1@v26.0606' })
  })
  it('uses titles for section/page nodes (no ref)', () => {
    expect(resolveNodeLabel(model, ['pages', 0, 'elements', 2], pool, resolved, 'en')).toEqual({ text: 'Section one', id: 'sec_1', ref: null })
    expect(resolveNodeLabel(model, ['pages', 0], pool, resolved, 'en')).toEqual({ text: 'Main', id: 'page_main', ref: null })
  })
})
