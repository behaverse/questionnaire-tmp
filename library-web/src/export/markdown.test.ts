import { describe, it, expect } from 'vitest'
import { toMarkdown } from './markdown'
import type { RenderModel } from '../definition/renderModel'
import type { DefMetadata } from '../api/types'

const meta = {
  id: 'qst_demo', title: 'Demo Scale', version: 'v26.0625', license: 'CC-BY-4.0',
  description: 'Rate each item.', authors: [{ name: 'Ada L.' }],
  publication: { citation: 'Lovelace 1843' },
} as unknown as DefMetadata

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Section One',
    blocks: [
      { kind: 'message', text: 'Please answer honestly.', unresolved: false },
      { kind: 'item', number: 1, stem: 'I plan tasks.', required: true, unresolved: false,
        widget: 'choice.nominal.single',
        options: [{ index: 0, text: 'No', value: 1 }, { index: 1, text: 'Yes', value: 2 }] },
      { kind: 'item', number: 2, stem: 'Your age?', required: false, unresolved: false,
        widget: 'number.ratio', options: [] },
    ],
  }],
}

describe('toMarkdown', () => {
  const md = toMarkdown(model, meta)
  it('emits title + metadata header', () => {
    expect(md).toContain('# Demo Scale')
    expect(md).toContain('id: qst_demo')
    expect(md).toContain('version: v26.0625')
    expect(md).toContain('license: CC-BY-4.0')
    expect(md).toContain('authors: Ada L.')
    expect(md).toContain('citation: Lovelace 1843')
    expect(md).toContain('Rate each item.')
  })
  it('renders page heading, message, numbered questions + options', () => {
    expect(md).toContain('## Section One')
    expect(md).toContain('> Please answer honestly.')
    expect(md).toContain('**1.** I plan tasks.')
    expect(md).toContain('- No')
    expect(md).toContain('- Yes')
    expect(md).toContain('**2.** Your age?')
    expect(md).toContain('[ number ]')
  })

  it('renders section block with section heading', () => {
    const sectionModel: RenderModel = {
      pages: [{
        id: 'p_sec', title: 'Section Page',
        blocks: [
          { kind: 'section', id: 'partA', items: [
            { kind: 'item', number: 1, stem: 'Section question', required: true, unresolved: false,
              widget: 'choice.nominal.single',
              options: [{ index: 0, text: 'X', value: 1 }] },
          ], unresolved: false },
        ],
      }],
    }
    const sectionMeta = { id: 'qst_sec', title: 'Section Test' } as unknown as DefMetadata
    const sectionMd = toMarkdown(sectionModel, sectionMeta)
    expect(sectionMd).toContain('### partA')
    expect(sectionMd).toContain('**1.** Section question')
    expect(sectionMd).toContain('- X')
  })

  it('handles null widget with unsupported input message', () => {
    const nullWidgetModel: RenderModel = {
      pages: [{
        id: 'p_null', title: 'Null Widget Page',
        blocks: [
          { kind: 'item', number: 1, stem: 'Null widget question', required: false, unresolved: false,
            widget: null,
            options: [] },
        ],
      }],
    }
    const nullMeta = { id: 'qst_null', title: 'Null Widget Test' } as unknown as DefMetadata
    const nullMd = toMarkdown(nullWidgetModel, nullMeta)
    expect(nullMd).toContain('_(unsupported input)_')
  })

  it('handles empty choices with unavailable message', () => {
    const emptyChoicesModel: RenderModel = {
      pages: [{
        id: 'p_empty', title: 'Empty Choices Page',
        blocks: [
          { kind: 'item', number: 1, stem: 'No choices available', required: true, unresolved: false,
            widget: 'choice.nominal.single',
            options: [] },
        ],
      }],
    }
    const emptyMeta = { id: 'qst_empty', title: 'Empty Choices Test' } as unknown as DefMetadata
    const emptyMd = toMarkdown(emptyChoicesModel, emptyMeta)
    expect(emptyMd).toContain('_(choices unavailable in this language)_')
  })

  it('omits authors and citation when metadata absent', () => {
    const minimalMeta = {
      id: 'qst_min', title: 'Minimal Metadata',
    } as unknown as DefMetadata
    const minimalMd = toMarkdown(model, minimalMeta)
    expect(minimalMd).not.toContain('authors:')
    expect(minimalMd).not.toContain('citation:')
  })
})
