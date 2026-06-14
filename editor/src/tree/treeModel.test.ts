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
