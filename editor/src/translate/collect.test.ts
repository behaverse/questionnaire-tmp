import { describe, it, expect } from 'vitest'
import { collectTranslatable } from './collect'
import type { Questionnaire } from '../model/types'

const prompt = (id: string, en: string, fr?: string) => ({
  id, content: { en: { status: 'complete', text: en }, ...(fr ? { fr: { status: 'complete', text: fr } } : {}) },
})
const option = (id: string) => ({
  id, input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { status: 'complete', label: 'Agreement', options: [{ index: 1, text: 'no' }, { index: 2, text: 'yes' }] } },
})

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en' },
  pages: [{ id: 'p1', elements: [
    { id: 'it_1', question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_s@v1' } },
    { id: 'it_2', question: { prompt: { ref: 'pr_b@v1' } }, option: { ref: 'opt_s@v1' } }, // shares opt_s
    { ref: 'msg_x@v1' },
  ] }],
} as unknown as Questionnaire

const pool = { 'pr_a@v1': prompt('pr_a', 'How are you?', 'Comment ça va ?') }
const resolved = {
  'pr_b@v1': prompt('pr_b', 'Your age?'),
  'opt_s@v1': option('opt_s'),
  'msg_x@v1': { id: 'msg_x', type: ['intro'], content: { en: { status: 'complete', text: 'Welcome' } } },
}

describe('collectTranslatable', () => {
  const groups = collectTranslatable(model, pool, resolved, 'en', 'fr')

  it('emits one group per UNIQUE entity (shared option deduped)', () => {
    const refs = groups.map((g) => g.entityRef)
    expect(refs).toEqual(['pr_a@v1', 'opt_s@v1', 'pr_b@v1', 'msg_x@v1'])
  })
  it('marks done when the target text exists', () => {
    const a = groups.find((g) => g.entityRef === 'pr_a@v1')!
    expect(a.rows[0]).toMatchObject({ source: 'How are you?', target: 'Comment ça va ?', done: true })
    const b = groups.find((g) => g.entityRef === 'pr_b@v1')!
    expect(b.rows[0]).toMatchObject({ source: 'Your age?', target: '', done: false })
  })
  it('option group has a row per choice label + the option label', () => {
    const opt = groups.find((g) => g.entityRef === 'opt_s@v1')!
    expect(opt.rows.map((r) => r.fieldLabel)).toEqual(['Label', 'Choice 1', 'Choice 2'])
    expect(opt.rows[1]).toMatchObject({ source: 'no', target: '', done: false })
  })
})
