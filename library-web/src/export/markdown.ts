import type { RenderModel, ItemBlock, MessageBlock, SectionBlock } from '../definition/renderModel'
import type { DefMetadata } from '../api/types'

const HEADER: { key: keyof DefMetadata; label: string }[] = [
  { key: 'id', label: 'id' },
  { key: 'version', label: 'version' },
  { key: 'license', label: 'license' },
]

function headerBlock(meta: DefMetadata): string {
  const lines: string[] = []
  for (const { key, label } of HEADER) {
    const v = meta[key]
    if (typeof v === 'string' && v.trim()) lines.push(`> ${label}: ${v}`)
  }
  const authors = meta.authors?.map((a) => a.name).filter(Boolean).join(', ')
  if (authors) lines.push(`> authors: ${authors}`)
  const citation = meta.publication?.citation
  if (typeof citation === 'string' && citation.trim()) lines.push(`> citation: ${citation}`)
  return lines.join('\n')
}

function optionLines(item: ItemBlock): string {
  const w = item.widget
  if (w && w.startsWith('choice')) {
    if (item.options.length === 0) return '   - _(choices unavailable in this language)_'
    return item.options.map((o) => `   - ${o.text}`).join('\n')
  }
  if (w && w.startsWith('number')) return '   - [ number ]'
  if (w && w.startsWith('text')) return '   - ____________________ (free text)'
  return '   - _(unsupported input)_'
}

function renderItem(item: ItemBlock, parts: string[]): void {
  parts.push(`**${item.number}.** ${item.stem}`)
  parts.push(optionLines(item))
}

export function toMarkdown(model: RenderModel, meta: DefMetadata): string {
  const parts: string[] = [`# ${meta.title || meta.id || 'Questionnaire'}`]
  const header = headerBlock(meta)
  if (header) parts.push(header)
  if (meta.description) parts.push(meta.description)

  for (const page of model.pages) {
    parts.push('---')
    if (page.title) parts.push(`## ${page.title}`)
    for (const block of page.blocks) {
      if (block.kind === 'message') {
        const text = (block as MessageBlock).text
        if (text) parts.push(`> ${text}`)
      } else if (block.kind === 'section') {
        const sec = block as SectionBlock
        if (sec.id) parts.push(`### ${sec.id}`)
        for (const it of sec.items) renderItem(it, parts)
      } else {
        renderItem(block as ItemBlock, parts)
      }
    }
  }
  return parts.join('\n\n') + '\n'
}
