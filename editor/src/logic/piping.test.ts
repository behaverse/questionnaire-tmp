import { describe, it, expect } from 'vitest'
import { pipedText, applyPiping } from './piping'
import { makeBindings } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

const ev = makeFakeEvaluator({ 'true': true, "named == 'x'": (b) => b.var('named') === 'x' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const path = 'pages.p1.elements.0.prompt'
const rule: LogicRule = { type: 'piping', condition: 'true', action: { source: 'q_name', field_path: path } }

describe('pipedText', () => {
  it('returns the source answer when a piping rule fires', () => {
    expect(pipedText(path, 'Hi NAME', [rule], ev, binds({ q_name: 'Sam' }))).toBe('Sam')
  })
  it('joins array source values with ", "', () => {
    expect(pipedText(path, 'orig', [rule], ev, binds({ q_name: ['a', 'b'] }))).toBe('a, b')
  })
  it('returns original when no rule matches the field path', () => {
    expect(pipedText('pages.p1.elements.9.prompt', 'orig', [rule], ev, binds({ q_name: 'Sam' }))).toBe('orig')
  })
  it('returns original when the source value is nullish', () => {
    expect(pipedText(path, 'orig', [rule], ev, binds({}))).toBe('orig')
  })
  it('returns original when the condition is false', () => {
    const r2: LogicRule = { type: 'piping', condition: "named == 'x'", action: { source: 'q_name', field_path: path } }
    expect(pipedText(path, 'orig', [r2], ev, binds({ named: 'y', q_name: 'Sam' }))).toBe('orig')
  })
  it('returns original when the condition is malformed (false-safe)', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(pipedText(path, 'orig', [rule], evBad, binds({ q_name: 'Sam' }))).toBe('orig')
  })
})

describe('applyPiping', () => {
  const page = { id: 'p1', elements: [
    { id: 'it_0', question: { prompt: { content: { en: { status: 'complete', text: 'Hello' } } } } },
    { id: 'it_1', question: { prompt: { content: { en: { status: 'complete', text: 'Other' } } } } },
  ] } as unknown as RuntimePage

  it('rewrites the matched element prompt for the active locale; leaves others', () => {
    const out = applyPiping(page, [rule], ev, binds({ q_name: 'Sam' }), 'en')
    const e0 = out.elements[0] as { question: { prompt: { content: { en: { text: string } } } } }
    const e1 = out.elements[1] as { question: { prompt: { content: { en: { text: string } } } } }
    expect(e0.question.prompt.content.en.text).toBe('Sam')
    expect(e1.question.prompt.content.en.text).toBe('Other')
  })
  it('does not mutate the input page', () => {
    applyPiping(page, [rule], ev, binds({ q_name: 'Sam' }), 'en')
    expect((page.elements[0] as { question: { prompt: { content: { en: { text: string } } } } }).question.prompt.content.en.text).toBe('Hello')
  })
  it('returns elements unchanged when nothing pipes', () => {
    const out = applyPiping(page, [], ev, binds({}), 'en')
    expect(out.elements[0]).toBe(page.elements[0])
  })
})
