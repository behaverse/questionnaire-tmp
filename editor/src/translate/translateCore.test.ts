import { describe, it, expect, vi } from 'vitest'
import { translateField } from './translateCore'

const gen = vi.fn(async (_p: { system: string; prompt: string }) => '  Comment ça va ?  ')

describe('translateField', () => {
  it('builds a src→tgt prompt with the text and returns the trimmed output', async () => {
    gen.mockClear()
    const out = await translateField({ text: 'How are you?', sourceLang: 'en', targetLang: 'fr', kind: 'prompt' }, gen)
    expect(out).toBe('Comment ça va ?')
    const arg = gen.mock.calls[0]![0]!
    expect(arg.prompt).toContain('How are you?')
    expect(arg.system).toMatch(/en/); expect(arg.system).toMatch(/fr/); expect(arg.system).toMatch(/prompt/)
  })
  it('returns "" for empty text without calling the model', async () => {
    gen.mockClear()
    expect(await translateField({ text: '   ', sourceLang: 'en', targetLang: 'fr' }, gen)).toBe('')
    expect(gen).not.toHaveBeenCalled()
  })
  it('returns the text unchanged when src === tgt (no model call)', async () => {
    gen.mockClear()
    expect(await translateField({ text: 'x', sourceLang: 'en', targetLang: 'en' }, gen)).toBe('x')
    expect(gen).not.toHaveBeenCalled()
  })
  it('rejects an invalid language code with a 400-tagged error', async () => {
    await expect(translateField({ text: 'x', sourceLang: 'english', targetLang: 'fr' }, gen))
      .rejects.toMatchObject({ status: 400 })
  })
})
