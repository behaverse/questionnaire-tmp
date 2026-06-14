import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { buildTreeRows } from './treeModel'

const q = phq9 as Questionnaire

test('builds rows for pages and their elements', () => {
  const rows = buildTreeRows(q)
  const pageRows = rows.filter((r) => r.kind === 'page')
  expect(pageRows.length).toBe(q.pages.length)
  const elementRows = rows.filter((r) => r.kind === 'item' || r.kind === 'message' || r.kind === 'section')
  expect(elementRows.length).toBeGreaterThan(0)
  for (const r of rows) { expect(r.key).toBeTruthy(); expect(Array.isArray(r.path)).toBe(true) }
})

test('renders blocks as group headers over their member pages', () => {
  const withBlocks = JSON.parse(JSON.stringify(q)) as Questionnaire
  withBlocks.pages = [
    { id: 'page_a', title: 'A', elements: [{ ref: 'msg_x@v1' }] },
    { id: 'page_b', title: 'B', elements: [{ ref: 'msg_y@v1' }] },
  ]
  withBlocks.blocks = [{ id: 'blk_1', title: 'Part 1', page_ids: ['page_a'] }]
  const rows = buildTreeRows(withBlocks)
  const blockRow = rows.find((r) => r.kind === 'block')
  expect(blockRow?.label).toBe('Part 1')
  // page_a appears under the block (depth 1); page_b ungrouped (depth 0)
  const pageA = rows.find((r) => r.label === 'A')
  const pageB = rows.find((r) => r.label === 'B')
  expect(pageA?.depth).toBe(1)
  expect(pageB?.depth).toBe(0)
})
