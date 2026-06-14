import type { EntityBody } from '../model/types'

export type { EntityBody } from '../model/types'
export type Lookup = (ref: string) => EntityBody | null
export interface RefProblem { kind: 'unresolved_ref'; where: string }

function isRef(v: unknown): v is string { return typeof v === 'string' && v.includes('@') }

function walk(node: unknown, lookup: Lookup, problems: RefProblem[]): unknown {
  if (Array.isArray(node)) return node.map((x) => walk(x, lookup, problems))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (isRef(obj.ref)) {
      const body = lookup(obj.ref)
      if (body == null) {
        problems.push({ kind: 'unresolved_ref', where: obj.ref })
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v, lookup, problems)]))
      }
      const merged: Record<string, unknown> = { ...body }
      for (const [k, v] of Object.entries(obj)) if (k !== 'ref') merged[k] = v
      return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, walk(v, lookup, problems)]))
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, walk(v, lookup, problems)]))
  }
  return node
}

export function resolveDocument(node: unknown, lookup: Lookup): { resolved: unknown; problems: RefProblem[] } {
  const problems: RefProblem[] = []
  const resolved = walk(node, lookup, problems)
  return { resolved, problems }
}

export function collectRefs(node: unknown, acc: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) { for (const x of node) collectRefs(x, acc); return acc }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (isRef(obj.ref)) acc.add(obj.ref)
    for (const v of Object.values(obj)) collectRefs(v, acc)
  }
  return acc
}
