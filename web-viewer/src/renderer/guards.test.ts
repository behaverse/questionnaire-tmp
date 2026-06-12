import { isItem, isSection, isMessage } from './guards'

const item = { question: { prompt: { content: { en: { text: 'P' } } } }, option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single' } }
const section = { id: 'sec_1', elements: [item] }
const message = { id: 'msg_1', content: { en: { text: 'Welcome' } } }

test('isItem matches question+option shape only', () => {
  expect(isItem(item)).toBe(true)
  expect(isItem(section)).toBe(false)
  expect(isItem(message)).toBe(false)
})
test('isSection matches elements-array shape (and items/messages are not sections)', () => {
  expect(isSection(section)).toBe(true)
  expect(isSection(item)).toBe(false)
})
test('isMessage matches content-bearing non-item non-section', () => {
  expect(isMessage(message)).toBe(true)
  expect(isMessage(item)).toBe(false)
  expect(isMessage(section)).toBe(false)
})
