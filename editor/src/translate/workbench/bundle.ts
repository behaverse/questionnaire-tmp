import type { TransKind } from '../types'

export interface BundleItem { id: string; version: string; kind: TransKind; body: Record<string, unknown> }
export interface ContributionEntry { id: string; version: string; type: TransKind; content: Record<string, unknown> }
export interface ContributionBundle { target: string; generated_at: string; entries: ContributionEntry[] }

function stripStatus(entry: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!entry || typeof entry !== 'object') return null
  const rest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'status') continue
    if (typeof v === 'string' && v.trim() === '') continue // drop empty strings
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
