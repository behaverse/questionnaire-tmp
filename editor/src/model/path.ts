import type { Questionnaire } from './types'

export type NodePath = (string | number)[]
export type NodeKind = 'questionnaire' | 'block' | 'page' | 'section' | 'item' | 'message'

export function getAtPath(root: unknown, path: NodePath): unknown {
  let cur: unknown = root
  for (const seg of path) {
    if (cur == null) return undefined
    cur = (cur as Record<string | number, unknown>)[seg]
  }
  return cur
}

/** The array that directly contains the node at `path` (path's last seg is its index). */
export function getContainer(root: unknown, path: NodePath): unknown[] {
  const parent = getAtPath(root, path.slice(0, -1))
  if (!Array.isArray(parent)) throw new Error(`No array container for path ${pathKey(path)}`)
  return parent as unknown[]
}

export function nodeKind(root: Questionnaire, path: NodePath): NodeKind {
  if (path.length === 0) return 'questionnaire'
  if (path[0] === 'blocks') return 'block'
  if (path[0] === 'pages' && path.length === 2) return 'page'
  const node = getAtPath(root, path) as Record<string, unknown> | undefined
  if (!node) throw new Error(`No node at ${pathKey(path)}`)
  if ('elements' in node) return 'section'
  const ref = node.ref
  if (typeof ref === 'string') return ref.startsWith('msg_') ? 'message' : 'item'
  return 'item' // inline item (question+option)
}

export function pathKey(path: NodePath): string {
  return path.join('.')
}
