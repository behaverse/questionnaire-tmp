// editor/src/export/markdown.test.ts
import { describe, it, expect } from 'vitest'
import { toMarkdown } from './markdown'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_demo', title: 'Demo Scale', version: 'v26.0625', license: 'CC-BY-4.0', description: 'Rate each item.' },
  pages: [],
} as unknown as Questionnaire

const runtime: Runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_demo', title: 'Demo Scale', description: 'Rate each item.', language: 'en' },
  locale: 'en',
  pages: [
    {
      id: 'p1', title: 'Section One',
      elements: [
        { content: { en: { text: 'Please answer honestly.' } } },
        {
          id: 'it_q1', required: true,
          question: { prompt: { content: { en: { text: 'I plan tasks.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
          },
        },
        {
          id: 'it_q2',
          question: { prompt: { content: { en: { text: 'Your age?' } } } },
          option: { input_data_type: 'number', measurement_type: 'ratio', min: 0, max: 120 },
        },
      ],
    },
    {
      id: 'p2', title: 'Section Two',
      elements: [
        {
          id: 'it_q3',
          question: { prompt: { content: { en: { text: 'Final question.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }],
            content: { en: { options: [{ index: 0, text: 'OK' }] } },
          },
        },
      ],
    },
  ],
}

describe('toMarkdown', () => {
  const md = toMarkdown(runtime, model, 'en')

  it('emits a title and a metadata header block', () => {
    expect(md).toContain('# Demo Scale')
    expect(md).toContain('id: qst_demo')
    expect(md).toContain('version: v26.0625')
    expect(md).toContain('license: CC-BY-4.0')
    expect(md).toContain('Rate each item.')
    expect(md).not.toContain('instrument:')
    expect(md).not.toContain('citation:')
  })

  it('renders a page heading, a message, and numbered questions with options', () => {
    expect(md).toContain('## Section One')
    expect(md).toContain('> Please answer honestly.')
    expect(md).toContain('**1.** I plan tasks.')
    expect(md).toContain('- No')
    expect(md).toContain('- Yes')
    expect(md).toContain('**2.** Your age?')
    expect(md).toContain('[ number 0–120 ]')
    expect(md).toContain('## Section Two')
    expect(md).toContain('**3.** Final question.')
    expect(md).toContain('- OK')
  })

  it('renders unsupported input widget as italic placeholder', () => {
    const nullWidgetRuntime: Runtime = {
      provenance: { preview: true },
      metadata: { id: 'qst_null', title: 'Null Widget Test', language: 'en' },
      locale: 'en',
      pages: [
        {
          id: 'p1', title: 'Test Page',
          elements: [
            {
              id: 'it_q1',
              question: { prompt: { content: { en: { text: 'Unsupported question.' } } } },
              option: {
                input_data_type: 'choice', measurement_type: 'ordinal', selection: 'multiple',
                options: [{ index: 0, value: 1 }],
                content: { en: { options: [{ index: 0, text: 'Option' }] } },
              },
            },
          ],
        },
      ],
    }
    const nullWidgetMd = toMarkdown(nullWidgetRuntime, model, 'en')
    expect(nullWidgetMd).toContain('_(unsupported input)_')
  })
})

describe('toMarkdown — choice item with no option texts in active locale', () => {
  // Option has structural options[] but content[en] has no `options` key → mergeOptions throws RenderError
  // → itemView sets choicesError and leaves choices:[] → optionLines should emit the fallback line
  const missingLocaleRuntime: Runtime = {
    provenance: { preview: true },
    metadata: { id: 'qst_missing', title: 'Missing Locale Test', language: 'en' },
    locale: 'en',
    pages: [
      {
        id: 'p1', title: 'Page',
        elements: [
          {
            id: 'it_q1',
            question: { prompt: { content: { en: { text: 'Pick one.' } } } },
            option: {
              input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
              options: [{ index: 0, value: 1 }],
              content: { en: {} }, // no `options` key under en → mergeOptions throws RenderError
            },
          },
        ],
      },
    ],
  }

  it('renders the unavailable-choices placeholder when option texts are missing in the export locale', () => {
    const md = toMarkdown(missingLocaleRuntime, model, 'en')
    expect(md).toContain('_(choices unavailable in this language)_')
  })
})
