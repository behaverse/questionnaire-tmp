import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from './types'
import { getAtPath, getContainer, nodeKind, pathKey } from './path'

const q = phq9 as Questionnaire

test('getAtPath resolves a page and an element', () => {
  expect(getAtPath(q, ['pages', 0])).toBe(q.pages[0])
  expect(getAtPath(q, ['pages', 0, 'elements', 0])).toBe(q.pages[0].elements[0])
})

test('getContainer returns the parent array for an item path', () => {
  expect(getContainer(q, ['pages', 0, 'elements', 0])).toBe(q.pages[0].elements)
  expect(getContainer(q, ['pages', 0])).toBe(q.pages)
})

test('nodeKind classifies nodes', () => {
  expect(nodeKind(q, ['pages', 0])).toBe('page')
  const el = q.pages[0].elements[0] as Record<string, unknown>
  const expected = 'elements' in el ? 'section' : el.ref ? (String(el.ref).startsWith('msg_') ? 'message' : 'item') : 'item'
  expect(nodeKind(q, ['pages', 0, 'elements', 0])).toBe(expected)
})

test('pathKey is stable for a given path', () => {
  expect(pathKey(['pages', 0, 'elements', 1])).toBe('pages.0.elements.1')
})
