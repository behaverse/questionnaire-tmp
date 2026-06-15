import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import type { Questionnaire, Page } from './types'
import { reorder, deleteNode, moveNode, insertNode, updateNodeProps, updateMetadata,
         createBlock, deleteBlock, setBlockPages } from './tree'
import { getAtPath } from './path'

const base = () => JSON.parse(JSON.stringify(phq9)) as Questionnaire
// kitchensink has multiple pages (phq9 is single-page); used where ≥2 items are needed.
const multiPage = () => JSON.parse(JSON.stringify(kitchensink)) as Questionnaire

test('reorder swaps two pages without mutating input', () => {
  const q = multiPage()
  const firstId = q.pages[0].id
  const next = reorder(q, ['pages'], 0, 1)
  expect(next.pages[1].id).toBe(firstId)
  expect(q.pages[0].id).toBe(firstId) // input untouched
})

test('deleteNode removes an element', () => {
  const q = base()
  const before = q.pages[0].elements.length
  const next = deleteNode(q, ['pages', 0, 'elements', 0])
  expect(next.pages[0].elements.length).toBe(before - 1)
})

test('moveNode moves an element across pages', () => {
  const q = multiPage()
  if (q.pages.length < 2) return
  const moved = q.pages[0].elements[0]
  const next = moveNode(q, ['pages', 0, 'elements', 0], ['pages', 1, 'elements'], 0)
  expect(next.pages[1].elements[0]).toEqual(moved)
})

test('moveNode rejects incompatible containers', () => {
  const q = base()
  expect(() => moveNode(q, ['pages', 0, 'elements', 0], ['pages'], 0)).toThrow()
})

test('insertNode adds a new empty page', () => {
  const q = base()
  const before = q.pages.length
  const newPage: Page = { id: 'page_new', elements: [{ ref: 'msg_placeholder@v26.0609' }] }
  const next = insertNode(q, ['pages'], before, newPage)
  expect(next.pages.length).toBe(before + 1)
  expect(next.pages[before].id).toBe('page_new')
})

test('updateNodeProps patches a page title', () => {
  const q = base()
  const next = updateNodeProps(q, ['pages', 0], { title: 'Renamed' })
  expect((getAtPath(next, ['pages', 0]) as Page).title).toBe('Renamed')
})

test('updateMetadata patches metadata', () => {
  const q = base()
  const next = updateMetadata(q, { title: 'New Title' })
  expect(next.metadata.title).toBe('New Title')
})

test('block lifecycle: create, set pages, delete', () => {
  const q = base()
  const withBlock = createBlock(q, { id: 'blk_1', title: 'Part 1', page_ids: [] })
  expect(withBlock.blocks?.[0].id).toBe('blk_1')
  const assigned = setBlockPages(withBlock, 'blk_1', [q.pages[0].id])
  expect(assigned.blocks?.[0].page_ids).toEqual([q.pages[0].id])
  const removed = deleteBlock(assigned, 'blk_1')
  expect(removed.blocks?.length ?? 0).toBe(0)
})

test('insertNode creates a missing top-level container (blocks) on the root', () => {
  const q = base()
  delete q.blocks
  const next = insertNode(q, ['blocks'], 0, { id: 'blk_x', page_ids: [q.pages[0].id] })
  expect(next.blocks?.length).toBe(1)
  expect(next.blocks?.[0].id).toBe('blk_x')
})

test('insertNode creates a missing nested container on its real parent (not the root)', () => {
  const q = base()
  // give page 0 a section that has no `elements` array yet
  q.pages[0].elements.unshift({ id: 'sec_empty', title: 'S' } as never)
  const next = insertNode(q, ['pages', 0, 'elements', 0, 'elements'], 0, { ref: 'msg_x@v26.0609' })
  const sec = next.pages[0].elements[0] as { elements?: unknown[] }
  expect(sec.elements?.length).toBe(1)
  // root must NOT have grown a stray `elements` key
  expect((next as Record<string, unknown>).elements).toBeUndefined()
})

test('reorder moves an item forward with arrayMove semantics', () => {
  const q = JSON.parse(JSON.stringify(kitchensink)) as Questionnaire
  const ids = q.pages.map((p) => p.id)
  const next = reorder(q, ['pages'], 0, 2)
  // [0,1,2,3] -> [1,2,0,3]
  expect(next.pages.map((p) => p.id)).toEqual([ids[1], ids[2], ids[0], ids[3]])
})

import { unsetNodeProp } from './tree'
test('unsetNodeProp deletes a key from the node at path (immutably)', () => {
  const q = base()
  // give page 0 a marker key, then remove it
  let next = updateNodeProps(q, ['pages', 0], { x_marker: true })
  expect((next.pages[0] as Record<string, unknown>).x_marker).toBe(true)
  next = unsetNodeProp(next, ['pages', 0], 'x_marker')
  expect('x_marker' in (next.pages[0] as object)).toBe(false)
  expect((q.pages[0] as Record<string, unknown>).x_marker).toBeUndefined() // original untouched
})

import { upgradeRef } from './tree'
test('upgradeRef repoints every occurrence of a ref, immutably', () => {
  const q = {
    metadata: { id: 'qst_t', version: 'v26.0609' },
    pages: [{ id: 'p1', elements: [
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: { ref: 'opt_a@v1' } },
      { ref: 'it_x@v26.0609' },
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} }, // same ref twice
    ] }],
  } as unknown as import('./types').Questionnaire
  const next = upgradeRef(q, 'pr_x@v26.0609', 'pr_x@v26.0610')
  const els = next.pages[0].elements as Array<Record<string, any>>
  expect(els[0].question.prompt.ref).toBe('pr_x@v26.0610')
  expect(els[2].question.prompt.ref).toBe('pr_x@v26.0610')
  expect(els[0].option.ref).toBe('opt_a@v1') // untouched
  expect((q.pages[0].elements[0] as any).question.prompt.ref).toBe('pr_x@v26.0609') // original immutable
})

import { repointRef, upgradeRef as upgradeAlias } from './tree'
test('repointRef replaces all occurrences; upgradeRef is an alias of it', () => {
  const q = {
    metadata: { id: 'qst_t', version: 'v26.0609' },
    pages: [{ id: 'p1', elements: [
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} },
      { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} },
    ] }],
  } as unknown as import('./types').Questionnaire
  const a = repointRef(q, 'pr_x@v26.0609', 'pr_x@v26.0609.dev1')
  expect((a.pages[0].elements[0] as any).question.prompt.ref).toBe('pr_x@v26.0609.dev1')
  expect((a.pages[0].elements[1] as any).question.prompt.ref).toBe('pr_x@v26.0609.dev1')
  expect(upgradeAlias).toBe(repointRef) // same function reference
})
