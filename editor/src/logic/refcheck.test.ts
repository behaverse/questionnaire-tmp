import { describe, it, expect } from 'vitest'
import { unknownRefs } from './refcheck'

const cat = { questionIds: ['q_age', 'q_consent'], scoreIds: ['phq9_total'] }

describe('unknownRefs', () => {
  it('flags identifiers not in the catalogue', () => {
    expect(unknownRefs('q_age >= 18 && q_typo == 1', cat)).toEqual(['q_typo'])
  })
  it('accepts known question + score ids', () => {
    expect(unknownRefs("q_consent == 'yes' && phq9_total > 9", cat)).toEqual([])
  })
  it('ignores built-in function names and keywords', () => {
    expect(unknownRefs("length(q_age) > 0 && contains(q_age, 'x') && true != false && q_age in [1,2]", cat)).toEqual([])
  })
  it('ignores identifiers inside string literals', () => {
    expect(unknownRefs("q_age == 'unknown_word'", cat)).toEqual([])
  })
  it('dedupes repeated unknowns and ignores numbers/null', () => {
    expect(unknownRefs('foo + foo + 3 + null', cat)).toEqual(['foo'])
  })
})
