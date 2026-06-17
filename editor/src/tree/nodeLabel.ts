// editor/src/tree/nodeLabel.ts
import type { Questionnaire, EntityBody } from '../model/types'
import { getAtPath, type NodePath } from '../model/path'

type Body = { content?: Record<string, { text?: string }> }

function textFrom(body: Body | null | undefined, locale: string): string | null {
  const c = body?.content
  if (!c) return null
  const pick = c[locale]?.text ?? c.en?.text ?? Object.values(c).map((v) => v?.text).find(Boolean)
  const t = (pick ?? '').trim()
  return t || null
}

/** Human-readable label for a structure node: resolved content text + the bare entity id. */
export function resolveNodeLabel(
  model: Questionnaire,
  path: NodePath,
  pool: Record<string, EntityBody>,
  resolved: Record<string, EntityBody | null>,
  locale: string,
): { text: string | null; id: string | null; ref: string | null } {
  const el = getAtPath(model, path) as Record<string, unknown> | undefined
  if (!el) return { text: null, id: null, ref: null }

  // ref-bearing nodes: message element (el.ref) or item (question.prompt.ref)
  const q = el.question as Record<string, unknown> | undefined
  const ref = (typeof el.ref === 'string' ? el.ref
    : (q?.prompt as { ref?: string } | undefined)?.ref) ?? null
  if (ref) {
    const body = (pool[ref] ?? resolved[ref]) as Body | null | undefined
    return { text: textFrom(body, locale), id: ref.split('@')[0], ref }
  }

  // titled nodes: page / block / section
  const title = typeof el.title === 'string' && el.title.trim() ? el.title.trim() : null
  const id = typeof el.id === 'string' ? el.id : null
  return { text: title, id, ref: null }
}
