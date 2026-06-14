import { buildRef, bodySnippet } from './picker'

test('buildRef joins id@version', () => {
  expect(buildRef('pr_a', 'v26.0609')).toBe('pr_a@v26.0609')
})

test('bodySnippet prefers locale text, then label, then a fallback', () => {
  expect(bodySnippet({ id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' } } }, 'en')).toBe('How are you?')
  expect(bodySnippet({ id: 'opt_a', content: { en: { status: 'validated', label: 'Agreement' } } }, 'en')).toBe('Agreement')
  expect(bodySnippet({ id: 'pr_b', content: { pt: { status: 'validated', text: 'Olá' } } }, 'en')).toBe('Olá') // falls back to any locale
  expect(bodySnippet({ id: 'msg_x' }, 'en')).toBe('msg_x') // no content → id
  expect(bodySnippet(null, 'en')).toBe('')
})
