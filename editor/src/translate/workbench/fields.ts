import type { TransKind, TransField } from '../types'

export interface WbField { field: TransField; label: string; value: string }

interface ContentEntry {
  status?: string
  text?: string
  label?: string
  units?: string
  options?: { index: number; text?: string }[]
}
type ContentMap = Record<string, ContentEntry>

function contentOf(body: Record<string, unknown>): ContentMap {
  return (body.content ?? {}) as ContentMap
}

// union of choice indices across the structural options and every locale's content options
function choiceIndices(body: Record<string, unknown>): number[] {
  const set = new Set<number>()
  for (const o of (body.options as { index: number }[] | undefined) ?? []) set.add(o.index)
  for (const entry of Object.values(contentOf(body))) {
    for (const o of entry.options ?? []) set.add(o.index)
  }
  return [...set].sort((a, b) => a - b)
}

function hasUnits(body: Record<string, unknown>): boolean {
  return Object.values(contentOf(body)).some((e) => e.units !== undefined && e.units !== '')
}

const TEXT_LABEL: Record<string, string> = { prompt: 'Text', context: 'Text', instruction: 'Text', message: 'Text' }

export function entityFields(body: Record<string, unknown>, kind: TransKind, locale: string): WbField[] {
  const c = contentOf(body)[locale] ?? {}
  if (kind === 'option') {
    const rows: WbField[] = [{ field: { t: 'opt-label' }, label: 'Label', value: c.label ?? '' }]
    if (hasUnits(body)) rows.push({ field: { t: 'opt-units' }, label: 'Units', value: c.units ?? '' })
    for (const idx of choiceIndices(body)) {
      rows.push({ field: { t: 'choice', index: idx }, label: `Choice ${idx}`, value: c.options?.find((o) => o.index === idx)?.text ?? '' })
    }
    return rows
  }
  return [{ field: { t: 'text' }, label: TEXT_LABEL[kind] ?? 'Text', value: c.text ?? '' }]
}

export function isUntranslated(body: Record<string, unknown>, kind: TransKind, source: string, target: string): boolean {
  const src = entityFields(body, kind, source)
  const tgt = entityFields(body, kind, target)
  return src.some((f, i) => f.value.trim() !== '' && !(tgt[i]?.value.trim()))
}
