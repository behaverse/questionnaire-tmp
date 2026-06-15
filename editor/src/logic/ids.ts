import type { Questionnaire } from '../model/types'
import type { EntityBody } from '../preview/resolve'

export interface IdCatalogue { questionIds: string[]; scoreIds: string[] }

/** Generous: every string `id` in the model tree (minus the metadata id and page-level ids) +
 *  pool bodies, plus declared scores[].id. Used for autocomplete + soft unknown-ref warnings. */
export function collectIdCatalogue(model: Questionnaire, pool: Record<string, EntityBody>): IdCatalogue {
  const ids = new Set<string>()
  const metaId = (model as { metadata?: { id?: unknown } }).metadata?.id
  const walk = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (node && typeof node === 'object') {
      const rec = node as Record<string, unknown>
      if (typeof rec.id === 'string' && rec.id !== metaId) ids.add(rec.id)
      for (const k of Object.keys(rec)) if (k !== 'metadata') walk(rec[k])
    }
  }
  // Walk elements within pages (not the page objects themselves to exclude page ids)
  const pages = (model as { pages?: { elements?: unknown }[] }).pages ?? []
  for (const page of pages) {
    if (page.elements !== undefined) walk(page.elements)
  }
  // Walk blocks if present
  const blocks = (model as { blocks?: { elements?: unknown }[] }).blocks ?? []
  for (const block of blocks) {
    if (block.elements !== undefined) walk(block.elements)
  }
  Object.values(pool).forEach(walk)
  const scoreIds = (((model as { scores?: { id?: unknown }[] }).scores) ?? [])
    .map((s) => s.id).filter((x): x is string => typeof x === 'string')
  return { questionIds: [...ids], scoreIds }
}
