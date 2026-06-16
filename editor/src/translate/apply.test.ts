import { describe, it, expect } from 'vitest'
import { applyTranslation, applyStatus, forkedRef } from './apply'

const promptBody = { id: 'pr_a', content: { en: { status: 'complete', text: 'Hi' } } }
const optBody = { id: 'opt_s', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { status: 'complete', label: 'Agree', options: [{ index: 1, text: 'no' }] } } }

type AnyContent = { content: Record<string, { status?: string; text?: string; label?: string; options?: Array<{ index: number; text?: string }> }> }

describe('applyTranslation', () => {
  it('writes content text for a content entity', () => {
    const next = applyTranslation(promptBody, 'prompt', { t: 'text' }, 'fr', 'Salut') as AnyContent
    expect(next.content.fr.text).toBe('Salut')
    expect(next.content.en.text).toBe('Hi') // primary untouched
  })
  it('writes an option choice label', () => {
    const next = applyTranslation(optBody, 'option', { t: 'choice', index: 1 }, 'fr', 'non') as AnyContent
    expect(next.content.fr.options![0]).toEqual({ index: 1, text: 'non' })
  })
  it('writes the option label', () => {
    const next = applyTranslation(optBody, 'option', { t: 'opt-label' }, 'fr', 'Accord') as AnyContent
    expect(next.content.fr.label).toBe('Accord')
  })
})
describe('applyStatus', () => {
  it('sets the locale status for a content entity', () => {
    const next = applyStatus(promptBody, 'prompt', 'fr', 'validated') as AnyContent
    expect(next.content.fr.status).toBe('validated')
  })
})
describe('forkedRef', () => {
  it('derives the deterministic forked pool ref', () => {
    expect(forkedRef('opt_s@v26.0606')).toBe('opt_s@v26.0606.dev1')
  })
})
