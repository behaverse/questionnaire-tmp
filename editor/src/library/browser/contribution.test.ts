// editor/src/library/browser/contribution.test.ts
import { describe, it, expect } from 'vitest'
import { buildContribution, contributionFilename } from './contribution'

describe('buildContribution', () => {
  it('wraps edited entities as full-body contribution entries', () => {
    const c = buildContribution([
      { id: 'pr_a', version: 'v26.0606', type: 'prompt', body: { id: 'pr_a', construct: 'mood', content: { en: { text: 'Hi' }, fr: { text: 'Salut' } } } },
    ], '2026-06-21T00:00:00.000Z')
    expect(c).toEqual({
      schema: 'questionnaire-contribution/v1',
      generated_at: '2026-06-21T00:00:00.000Z',
      entries: [{ id: 'pr_a', source_version: 'v26.0606', type: 'prompt', body: { id: 'pr_a', construct: 'mood', content: { en: { text: 'Hi' }, fr: { text: 'Salut' } } } }],
    })
  })
  it('names the file by timestamp', () => {
    expect(contributionFilename('2026-06-21T00:00:00.000Z')).toBe('library-contribution.2026-06-21T00:00:00.000Z.json')
  })
})
