import { describe, it, expect } from 'vitest'
import { collectCrossQuestionErrors } from './validation'
import { makeBindings } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { CrossQuestionValidationRule } from '../model/types'

const ev = makeFakeEvaluator({ "a == 'x'": (b) => b.var('a') === 'x' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const rule: CrossQuestionValidationRule = { id: 'val_1', condition: "a == 'x'", message: 'bad combo', targets: ['it_a', 'it_b'] }

describe('collectCrossQuestionErrors', () => {
  it('pushes one error per target when the condition holds', () => {
    const errs = collectCrossQuestionErrors([rule], ev, binds({ a: 'x' }))
    expect(errs).toEqual([{ key: 'it_a', message: 'bad combo' }, { key: 'it_b', message: 'bad combo' }])
  })
  it('pushes nothing when the condition is false', () => {
    expect(collectCrossQuestionErrors([rule], ev, binds({ a: 'y' }))).toEqual([])
  })
  it('skips a malformed condition', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(collectCrossQuestionErrors([rule], evBad, binds({ a: 'x' }))).toEqual([])
  })
  it('pushes nothing for a rule with no targets', () => {
    expect(collectCrossQuestionErrors([{ ...rule, targets: [] }], ev, binds({ a: 'x' }))).toEqual([])
  })
})
