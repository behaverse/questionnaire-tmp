import { projectForPreview } from './project'
import type { Lookup } from './resolve'
import type { Questionnaire } from '../model/types'

const store: Record<string, Record<string, unknown>> = {
  'pr_a@v1': { id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' }, pt: { status: 'validated', text: 'Como está?' } } },
  'opt_a@v1': { id: 'opt_a', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'validated', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } } },
}
const lookup: Lookup = (ref) => store[ref] ?? null

const model = {
  '@context': 'x',
  metadata: { id: 'qst_t', title: 'T', description: 'd', language: 'en', available_languages: ['en', 'pt'] },
  style: { progress_bar: true },
  pages: [{ id: 'p1', title: 'Page 1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' }, required: true }] }],
} as unknown as Questionnaire

test('produces a Runtime with resolved content and full language maps', () => {
  const { runtime, problems } = projectForPreview(model, lookup)
  expect(problems).toEqual([])
  expect(runtime.metadata.id).toBe('qst_t')
  expect(runtime.available_locales).toEqual(['en', 'pt'])
  const item = runtime.pages[0].elements[0] as any
  expect(item.question.prompt.content.en.text).toBe('How are you?')
  expect(item.question.prompt.content.pt.text).toBe('Como está?')
  expect(item.option.options).toEqual([{ index: 1, value: 0 }, { index: 2, value: 1 }])
  expect(item.required).toBe(true)
})

test('reports unresolved refs as problems but still returns a runtime', () => {
  const { runtime, problems } = projectForPreview(model, () => null)
  expect(problems.length).toBeGreaterThan(0)
  expect(runtime.pages[0].elements.length).toBe(1)
})
