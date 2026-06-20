import { describe, it, expect, vi, afterEach } from 'vitest'
import { translationsFilename, exportTranslations } from './export'
import type { BundleItem } from './bundle'

describe('translationsFilename', () => {
  it('names the file by target locale', () => {
    expect(translationsFilename('pt-BR')).toBe('translations.pt-BR.json')
  })
})

describe('exportTranslations', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('builds the bundle and triggers a download named for the target', async () => {
    const items: BundleItem[] = [
      { id: 'pr_a', version: 'v1', kind: 'prompt', body: { content: { fr: { text: 'Salut' } } } },
    ]

    // Capture Blob parts before jsdom swallows the .text() method
    let capturedParts: BlobPart[] | null = null
    const OrigBlob = Blob
    vi.stubGlobal('Blob', class extends OrigBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options)
        capturedParts = parts ?? null
      }
    })

    vi.stubGlobal('URL', {
      createObjectURL: (_b: Blob) => 'blob:x',
      revokeObjectURL: () => {},
    } as unknown as typeof URL)

    const anchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    exportTranslations('fr', items, '<iso>')

    expect(anchor.download).toBe('translations.fr.json')
    expect(anchor.click).toHaveBeenCalled()
    expect(capturedParts).not.toBeNull()
    const text = (capturedParts as unknown as BlobPart[])[0] as string
    expect(JSON.parse(text)).toMatchObject({
      target: 'fr',
      generated_at: '<iso>',
      entries: [{ id: 'pr_a', type: 'prompt', content: { fr: { text: 'Salut' } } }],
    })
  })
})
