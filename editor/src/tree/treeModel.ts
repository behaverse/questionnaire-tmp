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
  q.pages.forEach((page, pi) => {
    rows.push({ key: pathKey(['pages', pi]), path: ['pages', pi], kind: 'page', depth: 0, label: page.title ?? page.id })
    page.elements.forEach((el, ei) => {
      const path: NodePath = ['pages', pi, 'elements', ei]
      const kind = nodeKind(q, path)
      rows.push({ key: pathKey(path), path, kind, depth: 1, label: elementLabel(el as Record<string, unknown>) })
      if (kind === 'section') {
        const sec = el as { elements?: Record<string, unknown>[] }
        sec.elements?.forEach((sub, si) => {
          const subPath: NodePath = ['pages', pi, 'elements', ei, 'elements', si]
          rows.push({ key: pathKey(subPath), path: subPath, kind: nodeKind(q, subPath), depth: 2, label: elementLabel(sub) })
        })
      }
    })
  })
  return rows
}
