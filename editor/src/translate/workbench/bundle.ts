import type { TransKind } from '../types'

export interface BundleItem { id: string; version: string; kind: TransKind; body: Record<string, unknown> }
export interface ContributionEntry { id: string; version: string; type: TransKind; content: Record<string, unknown> }
export interface ContributionBundle { target: string; generated_at: string; entries: ContributionEntry[] }

const OPTION_PLACEHOLDER_RE = /^Option \d+$/

function cleanOptionsArray(arr: unknown): unknown[] | null {
  if (!Array.isArray(arr)) return null
  const cleaned = arr.filter((item) => {
    if (item === null || typeof item !== 'object') return true
    const text = (item as Record<string, unknown>).text
    if (typeof text !== 'string') return true
    if (text.trim() === '') return false
    if (OPTION_PLACEHOLDER_RE.test(text)) return false
    return true
  })
  return cleaned.length ? cleaned : null
}

function stripStatus(entry: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!entry || typeof entry !== 'object') return null
  const rest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'status') continue
    if (typeof v === 'string' && v.trim() === '') continue // drop empty strings
    if (k === 'options' && Array.isArray(v)) {
      const cleaned = cleanOptionsArray(v)
      if (cleaned) rest[k] = cleaned
      continue
    }
    rest[k] = v
  }
  return Object.keys(rest).length ? rest : null
}

export function buildBundle(target: string, items: BundleItem[], generatedAt: string): ContributionBundle {
  const entries: ContributionEntry[] = []
  for (const it of items) {
    const content = (it.body.content ?? {}) as Record<string, Record<string, unknown>>
    const tgt = stripStatus(content[target])
    if (!tgt) continue
    entries.push({ id: it.id, version: it.version, type: it.kind, content: { [target]: tgt } })
  }
  return { target, generated_at: generatedAt, entries }
}
