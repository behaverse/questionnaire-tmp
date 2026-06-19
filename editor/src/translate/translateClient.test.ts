import { describe, it, expect, vi } from 'vitest'
import { translateText } from './translateClient'

describe('translateText', () => {
  it('POSTs the fields and returns the translation', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, _init?: unknown) =>
      new Response(JSON.stringify({ translation: 'Bonjour' }), { status: 200 })
    ) as unknown as typeof fetch
    const out = await translateText('Hello', 'en', 'fr', 'prompt', { fetchImpl, endpoint: '/api/translate' })
    expect(out).toBe('Bonjour')
    const mockFn = fetchImpl as ReturnType<typeof vi.fn>
    const [url, init] = mockFn.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/translate')
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Hello', sourceLang: 'en', targetLang: 'fr', kind: 'prompt' })
  })
  it('throws on a non-OK response', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, _init?: unknown) =>
      new Response('{"error":"x"}', { status: 502 })
    ) as unknown as typeof fetch
    await expect(translateText('Hi', 'en', 'fr', undefined, { fetchImpl })).rejects.toThrow(/translate failed/i)
  })
})
