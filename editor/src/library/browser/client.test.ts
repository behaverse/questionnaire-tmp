import { describe, it, expect } from 'vitest'
import { defaultLibraryClient, LIBRARY_TYPES } from './client'

describe('library browser client', () => {
  it('lists entities (mapped) and fetches a body via the read API', async () => {
    const calls: string[] = []
    const fetchImpl = (async (url: string) => {
      calls.push(url)
      if (url.includes('/v1/entities/prompt?')) return new Response(JSON.stringify({ items: [{ id: 'pr_a', version: 'v26.0606', title: 'Mood', entity_type: 'prompt' }], total: 1 }), { status: 200 })
      return new Response(JSON.stringify({ id: 'pr_a', content: { en: { text: 'Hi' } } }), { status: 200 })
    }) as unknown as typeof fetch
    const c = defaultLibraryClient({ baseUrl: 'http://lib', fetchImpl })
    expect(await c.listEntities('prompt')).toEqual([{ id: 'pr_a', version: 'v26.0606', title: 'Mood' }])
    expect(await c.fetchEntityBody('pr_a@v26.0606')).toEqual({ id: 'pr_a', content: { en: { text: 'Hi' } } })
  })
  it('LIBRARY_TYPES lists the 12 types, editable ones first', () => {
    expect(LIBRARY_TYPES.map((t) => t.type).slice(0, 5)).toEqual(['prompt', 'option', 'context', 'instruction', 'message'])
    expect(LIBRARY_TYPES).toHaveLength(12)
  })
})
