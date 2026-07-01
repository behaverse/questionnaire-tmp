import { describe, expect, it } from 'vitest'
import { loadBundle } from './load'

const okBundle = { runtime: { metadata: { id: 'q' }, locale: 'en', pages: [] }, statements: [], mouse: [] }
const fetchOk = (async () => new Response(JSON.stringify(okBundle), { status: 200 })) as unknown as typeof fetch
const fetch404 = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch
const fetchBadJson = (async () => new Response('{not json', { status: 200 })) as unknown as typeof fetch
const fetchNoRuntime = (async () => new Response(JSON.stringify({ statements: [] }), { status: 200 })) as unknown as typeof fetch

describe('loadBundle', () => {
  it('loads a valid bundle', async () => {
    const r = await loadBundle('x.json', fetchOk)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.bundle.runtime.metadata.id).toBe('q')
  })
  it('errors on a non-OK response', async () => {
    expect((await loadBundle('x.json', fetch404)).ok).toBe(false)
  })
  it('errors on invalid JSON', async () => {
    expect((await loadBundle('x.json', fetchBadJson)).ok).toBe(false)
  })
  it('errors when runtime or statements is missing', async () => {
    expect((await loadBundle('x.json', fetchNoRuntime)).ok).toBe(false)
  })
})
