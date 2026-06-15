import { describe, it, expect } from 'vitest'
import { newRule, summarizeRule, validateRule } from './ruleOps'

const targets = { pageIds: ['p1', 'p2'], elementKeys: ['it_a', 'it_b'] }

describe('newRule', () => {
  it('skip/branch skeleton has skip_to', () => {
    expect(newRule('skip')).toEqual({ type: 'skip', condition: '', action: { skip_to: '' } })
    expect(newRule('branch')).toEqual({ type: 'branch', condition: '', action: { skip_to: '' } })
  })
  it('visibility skeleton has target_id + show', () => {
    expect(newRule('visibility')).toEqual({ type: 'visibility', condition: '', action: { target_id: '', show: false } })
  })
  it('piping skeleton has source + field_path', () => {
    expect(newRule('piping')).toEqual({ type: 'piping', condition: '', action: { source: '', field_path: '' } })
  })
})

describe('summarizeRule', () => {
  it('summarizes per type', () => {
    expect(summarizeRule({ type: 'skip', condition: 'q == 9', action: { skip_to: 'p2' } })).toBe('skip → p2 if q == 9')
    expect(summarizeRule({ type: 'visibility', condition: 'q == 1', action: { target_id: 'it_a', show: false } })).toBe('hide it_a if q == 1')
    expect(summarizeRule({ type: 'visibility', condition: 'q == 1', action: { target_id: 'it_a', show: true } })).toBe('show it_a if q == 1')
  })
})

describe('validateRule', () => {
  it('flags empty condition', () => {
    const e = validateRule({ type: 'skip', condition: '', action: { skip_to: 'p1' } }, targets).errors
    expect(e.some((x) => x.field === 'condition' && x.level === 'error')).toBe(true)
  })
  it('skip requires a skip_to and warns on unknown page', () => {
    expect(validateRule({ type: 'skip', condition: 'q==1', action: { skip_to: '' } }, targets).errors
      .some((x) => x.field === 'skip_to' && x.level === 'error')).toBe(true)
    expect(validateRule({ type: 'skip', condition: 'q==1', action: { skip_to: 'pX' } }, targets).errors
      .some((x) => x.field === 'skip_to' && x.level === 'warning')).toBe(true)
  })
  it('visibility requires target_id + boolean show, warns on unknown element', () => {
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: '', show: false } }, targets).errors
      .some((x) => x.field === 'target_id' && x.level === 'error')).toBe(true)
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'itX', show: false } }, targets).errors
      .some((x) => x.field === 'target_id' && x.level === 'warning')).toBe(true)
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'it_a' } }, targets).errors
      .some((x) => x.field === 'show' && x.level === 'error')).toBe(true)
  })
  it('a fully-valid rule has no errors', () => {
    expect(validateRule({ type: 'visibility', condition: 'q==1', action: { target_id: 'it_a', show: false } }, targets).errors).toEqual([])
  })
  it('flags a piping rule as deferred to D2b', () => {
    expect(validateRule({ type: 'piping', condition: 'q==1', action: { source: 'it_a', field_path: 'x' } }, targets).errors
      .some((x) => x.level === 'warning')).toBe(true)
  })
})
