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

  it('records the fallback language on content shown in a different language than requested', () => {
    const model = buildRenderModel(def, 'pt')
    // the welcome message exists only in en/pt; requesting pt shows pt -> no fallback flag
    expect((model.pages[0].blocks[0] as any).fallbackLang).toBeUndefined()
    // the section's first item stem exists only in en; requesting pt falls back to en -> flagged
    const section = model.pages[0].blocks[2] as any
    expect(section.items[0].stemFallbackLang).toBe('en')
    // item 1 stem has pt -> no fallback
    expect((model.pages[0].blocks[1] as any).stemFallbackLang).toBeUndefined()
  })

  it('flags an English-only message when a non-English language is selected', () => {
    const enOnly: ResolvedDefinition = {
      metadata: { id: 'q', title: 'Q', version: 'v', language: 'en', available_languages: ['en', 'fr'] },
      pages: [{ elements: [{ content: { en: { text: 'Please answer the following.' } } }] }],
    }
    const m = buildRenderModel(enOnly, 'fr')
    expect((m.pages[0].blocks[0] as any)).toMatchObject({
      kind: 'message', text: 'Please answer the following.', fallbackLang: 'en',
    })
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

  it('derives an item widget from the option triple and carries show_if', () => {
    const d = {
      metadata: { id: 'q', title: 'T', version: 'v1', language: 'en' },
      pages: [{ elements: [
        {
          id: 'it_a', required: true, show_if: 'it_b == 2',
          question: { prompt: { content: { en: { text: 'Q?' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }],
            content: { en: { options: [{ index: 0, text: 'Yes' }] } },
          },
        },
      ] }],
    }
    const m = buildRenderModel(d as never, 'en')
    const item = m.pages[0].blocks[0] as { widget: string | null; showIf?: string }
    expect(item.widget).toBe('choice.nominal.single')
    expect(item.showIf).toBe('it_b == 2')
  })
})
