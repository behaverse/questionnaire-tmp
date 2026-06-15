import { produce } from 'immer'
import type { Questionnaire, Block, Metadata } from './types'
import { getAtPath, getContainer, type NodePath, pathKey } from './path'

/** Two element-array paths are compatible; both `pages` arrays are compatible. */
// NOTE: compatibility is keyed on the container array NAME (last path segment),
// not the container's semantic kind. Any two `elements` arrays count as
// compatible, so a section-child could move to page-level elements and vice
// versa. The JSON Schema (validate step) is the backstop for structural legality.
function compatible(a: NodePath, b: NodePath): boolean {
  const lastA = a[a.length - 1]
  const lastB = b[b.length - 1]
  if (lastA === 'pages' && lastB === 'pages') return true
  if (lastA === 'blocks' && lastB === 'blocks') return true
  if (lastA === 'elements' && lastB === 'elements') return true
  return false
}

/**
 * Move the item at `from` to position `to` within the array at `containerPath`.
 * Remove-then-insert semantics: `to` is interpreted AFTER the item is removed
 * (matching dnd-kit's `arrayMove`). E.g. [A,B,C,D] reorder(0,2) -> [B,C,A,D].
 */
export function reorder(model: Questionnaire, containerPath: NodePath, from: number, to: number): Questionnaire {
  return produce(model, (draft) => {
    const arr = getAtPath(draft, containerPath) as unknown[]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
  })
}

export function deleteNode(model: Questionnaire, path: NodePath): Questionnaire {
  return produce(model, (draft) => {
    const arr = getContainer(draft, path)
    arr.splice(Number(path[path.length - 1]), 1)
  })
}

export function insertNode(model: Questionnaire, containerPath: NodePath, index: number, node: unknown): Questionnaire {
  return produce(model, (draft) => {
    let arr = getAtPath(draft, containerPath) as unknown[] | undefined
    if (arr === undefined) {
      const parent = getAtPath(draft, containerPath.slice(0, -1)) as Record<string | number, unknown>
      if (parent == null) throw new Error(`No parent for container ${pathKey(containerPath)}`)
      parent[containerPath[containerPath.length - 1]] = []
      arr = parent[containerPath[containerPath.length - 1]] as unknown[]
    }
    arr.splice(index, 0, node)
  })
}

export function moveNode(model: Questionnaire, fromPath: NodePath, toContainerPath: NodePath, toIndex: number): Questionnaire {
  const fromContainerPath = fromPath.slice(0, -1)
  if (!compatible(fromContainerPath, toContainerPath)) {
    throw new Error(`Incompatible move: ${pathKey(fromContainerPath)} -> ${pathKey(toContainerPath)}`)
  }
  return produce(model, (draft) => {
    const src = getContainer(draft, fromPath)
    const [moved] = src.splice(Number(fromPath[fromPath.length - 1]), 1)
    const dst = getAtPath(draft, toContainerPath) as unknown[]
    dst.splice(toIndex, 0, moved)
  })
}

export function updateNodeProps(model: Questionnaire, path: NodePath, patch: Record<string, unknown>): Questionnaire {
  return produce(model, (draft) => {
    const node = getAtPath(draft, path) as Record<string, unknown>
    Object.assign(node, patch)
  })
}

export function updateMetadata(model: Questionnaire, patch: Partial<Metadata>): Questionnaire {
  return produce(model, (draft) => {
    Object.assign(draft.metadata, patch)
  })
}

export function createBlock(model: Questionnaire, block: Block): Questionnaire {
  return produce(model, (draft) => {
    if (!draft.blocks) draft.blocks = []
    draft.blocks.push(block)
  })
}

export function deleteBlock(model: Questionnaire, blockId: string): Questionnaire {
  return produce(model, (draft) => {
    if (!draft.blocks) return
    draft.blocks = draft.blocks.filter((b) => b.id !== blockId)
  })
}

export function setBlockPages(model: Questionnaire, blockId: string, pageIds: string[]): Questionnaire {
  return produce(model, (draft) => {
    const block = draft.blocks?.find((b) => b.id === blockId)
    if (block) block.page_ids = pageIds
  })
}

export function unsetNodeProp(model: Questionnaire, path: NodePath, key: string): Questionnaire {
  return produce(model, (draft) => {
    const node = getAtPath(draft, path) as Record<string, unknown> | undefined
    if (node) delete node[key]
  })
}

export function repointRef(model: Questionnaire, oldRef: string, newRef: string): Questionnaire {
  return produce(model, (draft) => {
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) { node.forEach(walk); return }
      if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        if (obj.ref === oldRef) obj.ref = newRef
        for (const v of Object.values(obj)) walk(v)
      }
    }
    walk(draft)
  })
}

/** @deprecated use repointRef — kept for ED-C3b's upgradeRefAction. */
export const upgradeRef = repointRef
