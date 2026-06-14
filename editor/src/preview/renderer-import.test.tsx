import { StepRenderer, elementKey } from '@behaverse/questionnaire-renderer'

test('the renderer library is importable via the alias', () => {
  expect(typeof StepRenderer).toBe('function')
  expect(elementKey({ id: 'x' } as never, 'fallback')).toBe('x')
  expect(elementKey({} as never, 'fallback')).toBe('fallback')
})
