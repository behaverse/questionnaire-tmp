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
})
