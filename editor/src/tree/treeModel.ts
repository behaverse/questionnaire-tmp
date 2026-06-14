import type { Questionnaire } from '../model/types'
import { nodeKind, pathKey, type NodeKind, type NodePath } from '../model/path'

export interface TreeRow {
  key: string
  path: NodePath
  kind: NodeKind | 'block'
  depth: number
  label: string
}

function elementLabel(el: Record<string, unknown>): string {
  if (typeof el.ref === 'string') return el.ref
  if ('elements' in el) return (el.title as string) ?? 'Section'
  const q = el.question as Record<string, unknown> | undefined
  const promptRef = (q?.prompt as Record<string, unknown> | undefined)?.ref
  return typeof promptRef === 'string' ? `inline · ${promptRef}` : 'inline item'
}

export function buildTreeRows(q: Questionnaire): TreeRow[] {
  const rows: TreeRow[] = []
  const pageIndexById = new Map(q.pages.map((p, i) => [p.id, i] as const))
  const grouped = new Set<string>()

  const emitPage = (pi: number, depth: number) => {
    const page = q.pages[pi]
    rows.push({ key: pathKey(['pages', pi]), path: ['pages', pi], kind: 'page', depth, label: page.title ?? page.id })
    page.elements.forEach((el, ei) => {
      const path: NodePath = ['pages', pi, 'elements', ei]
      const kind = nodeKind(q, path)
      rows.push({ key: pathKey(path), path, kind, depth: depth + 1, label: elementLabel(el as Record<string, unknown>) })
      if (kind === 'section') {
        const sec = el as { elements?: Record<string, unknown>[] }
        sec.elements?.forEach((sub, si) => {
          const subPath: NodePath = ['pages', pi, 'elements', ei, 'elements', si]
          rows.push({ key: pathKey(subPath), path: subPath, kind: nodeKind(q, subPath), depth: depth + 2, label: elementLabel(sub) })
        })
      }
    })
  }

  const blocks = q.blocks ?? []
  blocks.forEach((block, bi) => {
    rows.push({ key: pathKey(['blocks', bi]), path: ['blocks', bi], kind: 'block', depth: 0, label: block.title ?? block.id })
    block.page_ids.forEach((pid) => {
      if (grouped.has(pid)) return
      const pi = pageIndexById.get(pid)
      if (pi === undefined) return
      grouped.add(pid)
      emitPage(pi, 1)
    })
  })

  q.pages.forEach((p, pi) => {
    if (grouped.has(p.id)) return
    emitPage(pi, 0)
  })

  return rows
}
