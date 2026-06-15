import { describe, it, expect } from 'vitest'
import { perQuestion, collectPerQuestionErrors } from './validation'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

describe('perQuestion', () => {
  it('skips empty values', () => {
    expect(perQuestion('k', { range: [0, 10] }, null)).toBeNull()
    expect(perQuestion('k', { range: [0, 10] }, '')).toBeNull()
  })
  it('flags numeric range under/over with the custom message', () => {
    expect(perQuestion('k', { range: [0, 10], range_message: 'oops' }, 15)).toEqual({ key: 'k', message: 'oops' })
    expect(perQuestion('k', { range: [5, null] }, 3)).toEqual({ key: 'k', message: 'Value out of range.' })
    expect(perQuestion('k', { range: [0, 10] }, 5)).toBeNull()
  })
  it('flags string length', () => {
    expect(perQuestion('k', { length: [3, null] }, 'ab')).toEqual({ key: 'k', message: 'Invalid length.' })
    expect(perQuestion('k', { length: [0, 3], length_message: 'too long' }, 'abcd')).toEqual({ key: 'k', message: 'too long' })
  })
  it('flags format mismatch; invalid regex passes', () => {
    expect(perQuestion('k', { format: '^\\d+$' }, 'abc')).toEqual({ key: 'k', message: 'Invalid format.' })
    expect(perQuestion('k', { format: '^\\d+$' }, '123')).toBeNull()
    expect(perQuestion('k', { format: '(' }, 'anything')).toBeNull() // invalid regex → pass
  })
  it('does not apply range to a string value', () => {
    expect(perQuestion('k', { range: [0, 10] }, 'hello')).toBeNull()
  })
})

describe('collectPerQuestionErrors', () => {
  const pages = [{ id: 'p1', elements: [
    { id: 'it_a', question: {}, option: { validation: { range: [0, 10] } } },
    { id: 'sec', elements: [{ id: 'it_b', question: {}, option: { validation: { length: [3, null] } } }] },
    { id: 'it_novalid', question: {}, option: {} },
  ] }] as unknown as RuntimePage[]

  it('keys page-level items by id and section children too', () => {
    const errs = collectPerQuestionErrors(pages, { it_a: 15, it_b: 'xx' })
    expect(errs.find((e) => e.key === 'it_a')?.message).toBe('Value out of range.')
    expect(errs.find((e) => e.key === 'it_b')?.message).toBe('Invalid length.')
  })
  it('ignores items without validation and valid/empty answers', () => {
    expect(collectPerQuestionErrors(pages, { it_a: 5 })).toEqual([])
  })
})
