import { describe, it, expect } from 'vitest'
import { licenseLabel, languageLabel } from './labels'

describe('labels', () => {
  it('humanises known license tags', () => {
    expect(licenseLabel('cc_by')).toBe('CC BY')
    expect(licenseLabel('public_domain')).toBe('Public domain')
  })
  it('falls back to the raw tag when unknown', () => {
    expect(licenseLabel('weird_tag')).toBe('weird_tag')
  })
  it('humanises ISO language codes', () => {
    expect(languageLabel('en')).toBe('English')
    expect(languageLabel('pt')).toBe('Portuguese')
    expect(languageLabel('zz')).toBe('zz')
  })
})
