import { pipedText } from './piping'
import { makeFakeEvaluator } from './evaluator'
import type { Programs } from './compile'

const programs = (): Programs => ({
  showIf: new Map(),
  rules: [{ id: 'r_pipe', type: 'piping', condition: 'true', action: { field_path: 'pages.p1.elements.0.prompt', source: 'it_name' } }],
  crossValidation: [],
})
const bindings = (answers: Record<string, unknown>) => ({ var: (id: string) => answers[id] ?? null, score: () => null })

test('piping substitutes the source answer when the rule fires and the field matches', () => {
  const ev = makeFakeEvaluator({ true: true })
  const text = pipedText('pages.p1.elements.0.prompt', 'Hello there', programs(), ev, bindings({ it_name: 'Ada' }))
  expect(text).toBe('Ada')
})
test('non-matching field path → original text unchanged', () => {
  const ev = makeFakeEvaluator({ true: true })
  expect(pipedText('pages.p1.elements.9.prompt', 'orig', programs(), ev, bindings({ it_name: 'Ada' }))).toBe('orig')
})
test('rule condition false → original text', () => {
  const ev = makeFakeEvaluator({ true: false })
  expect(pipedText('pages.p1.elements.0.prompt', 'orig', programs(), ev, bindings({ it_name: 'Ada' }))).toBe('orig')
})
