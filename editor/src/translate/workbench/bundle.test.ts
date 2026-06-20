import { describe, it, expect } from 'vitest'
import { buildBundle, type BundleItem } from './bundle'

const items: BundleItem[] = [
  { id: 'pr_a', version: 'v26.0606', kind: 'prompt', body: { id: 'pr_a', content: { en: { text: 'Hi' }, fr: { status: 'draft', text: 'Salut' } } } },
  { id: 'opt_a', version: 'v26.0606', kind: 'option', body: { id: 'opt_a', content: { fr: { status: 'draft', label: 'Accord', options: [{ index: 1, text: 'Oui' }] } } } },
  { id: 'pr_empty', version: 'v26.0606', kind: 'prompt', body: { id: 'pr_empty', content: { en: { text: 'Bye' } } } }, // no fr → skipped
]

describe('buildBundle', () => {
  it('builds a target-locale contribution bundle, dropping status and empty entries', () => {
    const b = buildBundle('fr', items, '2026-06-19T00:00:00.000Z')
    expect(b.target).toBe('fr')
    expect(b.generated_at).toBe('2026-06-19T00:00:00.000Z')
    expect(b.entries).toEqual([
      { id: 'pr_a', version: 'v26.0606', type: 'prompt', content: { fr: { text: 'Salut' } } },
      { id: 'opt_a', version: 'v26.0606', type: 'option', content: { fr: { label: 'Accord', options: [{ index: 1, text: 'Oui' }] } } },
    ])
  })

  it('drops "Option N" placeholder entries from a partially-translated options array', () => {
    // Choice 1 was translated to 'Oui'; choice 2 still has the renumberChoices placeholder 'Option 2'
    const b = buildBundle('fr', [
      {
        id: 'opt_partial', version: 'v26.0606', kind: 'option',
        body: { id: 'opt_partial', content: { fr: { status: 'draft', label: 'Accord', options: [{ index: 1, text: 'Oui' }, { index: 2, text: 'Option 2' }] } } },
      },
    ], '2026-06-20T00:00:00.000Z')
    expect(b.entries).toEqual([
      { id: 'opt_partial', version: 'v26.0606', type: 'option', content: { fr: { label: 'Accord', options: [{ index: 1, text: 'Oui' }] } } },
    ])
  })

  it('skips an entity entirely when every choice is a placeholder AND label is empty', () => {
    // All choices are 'Option N' placeholders and label is absent — nothing meaningful remains
    const b = buildBundle('fr', [
      {
        id: 'opt_all_placeholder', version: 'v26.0606', kind: 'option',
        body: { id: 'opt_all_placeholder', content: { fr: { status: 'draft', options: [{ index: 1, text: 'Option 1' }, { index: 2, text: 'Option 2' }] } } },
      },
    ], '2026-06-20T00:00:00.000Z')
    expect(b.entries).toEqual([])
  })

  it('keeps a fully-translated multi-choice option intact', () => {
    const b = buildBundle('fr', [
      {
        id: 'opt_full', version: 'v26.0606', kind: 'option',
        body: { id: 'opt_full', content: { fr: { status: 'draft', label: 'Accord', options: [{ index: 1, text: 'Tout à fait d\'accord' }, { index: 2, text: 'Plutôt d\'accord' }] } } },
      },
    ], '2026-06-20T00:00:00.000Z')
    expect(b.entries).toEqual([
      { id: 'opt_full', version: 'v26.0606', type: 'option', content: { fr: { label: 'Accord', options: [{ index: 1, text: 'Tout à fait d\'accord' }, { index: 2, text: 'Plutôt d\'accord' }] } } },
    ])
  })
})
