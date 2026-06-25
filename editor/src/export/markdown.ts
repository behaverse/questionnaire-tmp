import type { Runtime, MessageElement } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'
import { itemView, flattenElements } from './walk'

// Metadata fields rendered in the header block, in order, only when present + string-valued.
const HEADER_FIELDS: { key: string; label: string }[] = [
  { key: 'id', label: 'id' },
  { key: 'version', label: 'version' },
  { key: 'instrument_id', label: 'instrument' },
  { key: 'license', label: 'license' },
  { key: 'citation', label: 'citation' },
]

function headerBlock(meta: Record<string, unknown>): string {
  const lines: string[] = []
  for (const { key, label } of HEADER_FIELDS) {
    const v = meta[key]
    if (typeof v === 'string' && v.trim()) lines.push(`> ${label}: ${v}`)
  }
  return lines.join('\n')
}

function optionLines(widget: string | null, choices: { text: string }[], opt: { min?: number; max?: number }): string {
  if (widget && widget.startsWith('choice')) return choices.map((c) => `   - ${c.text}`).join('\n')
  if (widget && widget.startsWith('number')) {
    const range = opt.min != null && opt.max != null ? ` ${opt.min}–${opt.max}` : ''
    return `   - [ number${range} ]`
  }
  if (widget && widget.startsWith('text')) return '   - ____________________ (free text)'
  return '   - _(unsupported input)_'
}

export function toMarkdown(runtime: Runtime, model: Questionnaire, locale: string): string {
  const meta = (model.metadata ?? {}) as Record<string, unknown>
  const title = runtime.metadata.title || (meta.title as string) || (meta.id as string) || 'Questionnaire'
  const parts: string[] = [`# ${title}`]

  const header = headerBlock(meta)
  if (header) parts.push(header)

  const description = runtime.metadata.description
  if (description) parts.push(description)

  let n = 0
  for (const page of runtime.pages) {
    parts.push('---')
    if (page.title) parts.push(`## ${page.title}`)
    let lastSection: string | undefined
    for (const entry of flattenElements(page.elements)) {
      if (entry.sectionTitle && entry.sectionTitle !== lastSection) {
        parts.push(`### ${entry.sectionTitle}`)
        lastSection = entry.sectionTitle
      }
      if (entry.message) {
        const text = (entry.message as MessageElement).content?.[locale]?.text
        if (text) parts.push(`> ${text}`)
      } else if (entry.item) {
        n += 1
        const v = itemView(entry.item, locale, `q${n}`)
        parts.push(`**${n}.** ${v.prompt}`)
        parts.push(optionLines(v.widget, v.choices, v.option))
      }
    }
  }
  return parts.join('\n\n') + '\n'
}
