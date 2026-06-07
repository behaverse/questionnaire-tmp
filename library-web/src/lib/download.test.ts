import { describe, it, expect } from 'vitest'
import { definitionFilename } from './download'

describe('definitionFilename', () => {
  it('names the file by id and version', () => {
    expect(definitionFilename('qst_phq9', 'v26.0602')).toBe('qst_phq9@v26.0602.json')
  })
})
