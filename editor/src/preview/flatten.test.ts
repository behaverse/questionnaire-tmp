import { flattenPage } from './flatten'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

test('flattenPage yields {key, element} pairs with ids or positional fallbacks', () => {
  const page = { id: 'p1', elements: [{ id: 'it_1', question: {}, option: {} }, { question: {}, option: {} }] } as unknown as RuntimePage
  const rows = flattenPage(page)
  expect(rows[0].key).toBe('it_1')
  expect(rows[1].key).toBe('p1__el1')
  expect(rows.length).toBe(2)
})
