import { describe, it, expect, vi, afterEach } from 'vitest'
import { definitionFilename, downloadJson } from './download'

describe('definitionFilename', () => {
  it('names the file by id and version', () => {
    expect(definitionFilename('qst_phq9', 'v26.0602')).toBe('qst_phq9@v26.0602.json')
  })
})

describe('downloadJson', () => {
  afterEach(() => vi.restoreAllMocks())

  it('fetches the url and triggers a named blob download', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => blob } as Response))
    // jsdom lacks createObjectURL/revokeObjectURL — define + spy them
    ;(URL as unknown as { createObjectURL?: unknown }).createObjectURL ??= () => ''
    ;(URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL ??= () => {}
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:xyz')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const anchor = document.createElement('a')
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    const createEl = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    await downloadJson('http://api.example/x', 'x.json')

    expect(create).toHaveBeenCalledWith(blob)
    expect(anchor.getAttribute('download')).toBe('x.json')
    expect(click).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledWith('blob:xyz')
    createEl.mockRestore()
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response))
    await expect(downloadJson('http://api.example/x', 'x.json')).rejects.toThrow(/500/)
  })
})
