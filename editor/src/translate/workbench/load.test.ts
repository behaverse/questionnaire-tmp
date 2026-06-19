import { describe, it, expect } from 'vitest'
import { loadUntranslated, type WbClient } from './load'

const bodies: Record<string, Record<string, unknown>> = {
  'pr_a@v1': { id: 'pr_a', content: { en: { text: 'Hi' } } },               // untranslated (no fr)
  'pr_b@v1': { id: 'pr_b', content: { en: { text: 'Hi' }, fr: { text: 'Salut' } } }, // done
  'pr_c@v1': { id: 'pr_c', content: { en: { text: 'Yo' } } },               // untranslated
}

const client: WbClient = {
  listEntities: async () => [
    { id: 'pr_a', version: 'v1' }, { id: 'pr_b', version: 'v1' }, { id: 'pr_c', version: 'v1' },
  ],
  fetchEntityBody: async (ref) => bodies[ref] ?? null,
}

describe('loadUntranslated', () => {
  it('returns only entities missing the target translation', async () => {
    const r = await loadUntranslated('prompt', 'en', 'fr', client)
    expect(r.items.map((i) => i.id).sort()).toEqual(['pr_a', 'pr_c'])
    expect(r.scanned).toBe(3)
    expect(r.capped).toBe(false)
  })
  it('caps the scan and flags truncation', async () => {
    const r = await loadUntranslated('prompt', 'en', 'fr', client, 2)
    expect(r.scanned).toBe(2)
    expect(r.capped).toBe(true)
  })
})
