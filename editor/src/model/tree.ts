import { produce } from 'immer'
import type { Questionnaire, Block, Metadata } from './types'
import { getAtPath, getContainer, type NodePath, pathKey } from './path'

/** Two element-array paths are compatible; both `pages` arrays are compatible. */
function compatible(a: NodePath, b: NodePath): boolean {
  const lastA = a[a.length - 1]
  const lastB = b[b.length - 1]
  if (lastA === 'pages' && lastB === 'pages') return true
  if (lastA === 'blocks' && lastB === 'blocks') return true
  if (lastA === 'elements' && lastB === 'elements') return true
  return false
}

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
      // create the container (e.g. first block)
      ;(draft as Record<string, unknown>)[containerPath[containerPath.length - 1] as string] = []
      arr = getAtPath(draft, containerPath) as unknown[]
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
