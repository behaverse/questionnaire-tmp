import { describe, it, expect } from 'vitest'
import { newValidationRule, summarizeValidationRule, validateValidationRule } from './validationRuleOps'
import type { CrossQuestionValidationRule } from '../model/types'

const targets = { pageIds: ['p1'], elementKeys: ['it_a', 'it_b'] }

describe('newValidationRule', () => {
  it('picks the first free val_N id', () => {
    expect(newValidationRule([]).id).toBe('val_1')
    expect(newValidationRule([{ id: 'val_1' }, { id: 'val_3' }] as CrossQuestionValidationRule[]).id).toBe('val_2')
  })
  it('starts empty with an empty targets array', () => {
    expect(newValidationRule([])).toEqual({ id: 'val_1', condition: '', message: '', targets: [] })
  })
})

describe('summarizeValidationRule', () => {
  it('summarizes with targets', () => {
    expect(summarizeValidationRule({ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a', 'it_b'] }))
      .toBe('val_1: if a>b → it_a, it_b')
  })
  it('shows (no targets) when empty', () => {
    expect(summarizeValidationRule({ id: 'val_1', condition: 'a>b', message: 'm', targets: [] }))
      .toBe('val_1: if a>b → (no targets)')
  })
})

describe('validateValidationRule', () => {
  const rule = (o: Partial<CrossQuestionValidationRule>): CrossQuestionValidationRule => ({ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a'], ...o })
  it('a fully-valid rule has no errors', () => {
    expect(validateValidationRule(rule({}), targets, [rule({})]).errors).toEqual([])
  })
  it('flags empty / bad-pattern id', () => {
    expect(validateValidationRule(rule({ id: '' }), targets, []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
    expect(validateValidationRule(rule({ id: 'Bad Id' }), targets, []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
  })
  it('warns on a duplicate id', () => {
    const r = rule({})
    expect(validateValidationRule(r, targets, [r, rule({ message: 'other' })]).errors.some((e) => e.field === 'id' && e.level === 'warning')).toBe(true)
  })
  it('flags empty condition + empty message', () => {
    expect(validateValidationRule(rule({ condition: '' }), targets, []).errors.some((e) => e.field === 'condition' && e.level === 'error')).toBe(true)
    expect(validateValidationRule(rule({ message: '' }), targets, []).errors.some((e) => e.field === 'message' && e.level === 'error')).toBe(true)
  })
  it('warns on an unknown target and on empty targets', () => {
    expect(validateValidationRule(rule({ targets: ['it_x'] }), targets, []).errors.some((e) => e.field === 'targets' && e.level === 'warning')).toBe(true)
    expect(validateValidationRule(rule({ targets: [] }), targets, []).errors.some((e) => e.field === 'targets' && e.level === 'warning')).toBe(true)
  })
})
