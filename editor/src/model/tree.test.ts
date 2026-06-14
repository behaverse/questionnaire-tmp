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
