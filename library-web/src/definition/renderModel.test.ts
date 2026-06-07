import { describe, it, expect } from 'vitest'
import { buildRenderModel } from './renderModel'
import type { ResolvedDefinition } from '../api/types'

const def: ResolvedDefinition = {
  metadata: { id: 'qst_x', title: 'X', version: 'v26.0601', language: 'en', available_languages: ['en', 'pt'] },
  pages: [
    {
      id: 'p1', title: 'Page one',
      elements: [
        { content: { en: { text: 'Welcome' }, pt: { text: 'Bem-vindo' } } }, // message
        {
          question: { prompt: { ref: 'pr_1@v', content: { en: { text: 'How are you?' }, pt: { text: 'Como está?' } } } },
          option: {
            content: { en: { label: 'Mood', options: [{ index: 1, text: 'Bad' }, { index: 2, text: 'Good' }] } },
            options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
          },
          required: true,
        },
        {
          id: 'sec1',
          shared_option: { content: { en: { options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } } },
          elements: [
            { question: { prompt: { ref: 'pr_2@v', content: { en: { text: 'Item A' } } } } },
            { question: { prompt: { ref: 'pr_3@v', _unresolved: true } } },
          ],
        },
      ],
    },
  ],
}

describe('buildRenderModel', () => {
  it('flattens messages, items and matrix sections, numbering items continuously', () => {
    const model = buildRenderModel(def, 'en')
    expect(model.pages).toHaveLength(1)
    const blocks = model.pages[0].blocks
    expect(blocks[0]).toMatchObject({ kind: 'message', text: 'Welcome' })
    expect(blocks[1]).toMatchObject({ kind: 'item', number: 1, stem: 'How are you?', required: true })
    expect((blocks[1] as any).options.map((o: any) => o.text)).toEqual(['Bad', 'Good'])
    const section = blocks[2] as any
    expect(section.kind).toBe('section')
    expect(section.items[0]).toMatchObject({ number: 2, stem: 'Item A' })
    expect(section.sharedOptions.map((o: any) => o.text)).toEqual(['No', 'Yes'])
  })

  it('marks unresolved prompts so the UI can show a fallback', () => {
    const model = buildRenderModel(def, 'en')
    const section = model.pages[0].blocks[2] as any
    expect(section.items[1].unresolved).toBe(true)
  })

  it('falls back to the primary language text when the requested language is missing', () => {
    const model = buildRenderModel(def, 'pt')
    const item = model.pages[0].blocks[1] as any
    expect(item.stem).toBe('Como está?')           // pt present
    const section = model.pages[0].blocks[2] as any
    expect(section.items[0].stem).toBe('Item A')    // pt missing -> falls back to en
  })

  it('handles a section without a shared option, using each item\'s own option', () => {
    const d: ResolvedDefinition = {
      metadata: { id: 'q', title: 'Q', version: 'v', language: 'en' },
      pages: [{ elements: [
        { id: 'sec', elements: [
          { question: { prompt: { content: { en: { text: 'Only item' } } } },
            option: { content: { en: { options: [{ index: 1, text: 'A' }] } } } },
        ] },
      ] }],
    }
    const m = buildRenderModel(d, 'en')
    const sec = m.pages[0].blocks[0] as any
    expect(sec.kind).toBe('section')
    expect(sec.sharedOptions).toEqual([])
    expect(sec.items[0].stem).toBe('Only item')
    expect(sec.items[0].options.map((o: any) => o.text)).toEqual(['A']) // per-item option used
  })

  it('numbers items continuously across pages', () => {
    const d: ResolvedDefinition = {
      metadata: { id: 'q', title: 'Q', version: 'v', language: 'en' },
      pages: [
        { elements: [{ question: { prompt: { content: { en: { text: 'P1' } } } } }] },
        { elements: [{ question: { prompt: { content: { en: { text: 'P2' } } } } }] },
      ],
    }
    const m = buildRenderModel(d, 'en')
    expect((m.pages[0].blocks[0] as any).number).toBe(1)
    expect((m.pages[1].blocks[0] as any).number).toBe(2)
  })
})
