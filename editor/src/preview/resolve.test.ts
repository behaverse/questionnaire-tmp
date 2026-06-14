import { resolveDocument, collectRefs, type Lookup } from './resolve'

const lookupFrom = (store: Record<string, Record<string, unknown>>): Lookup => (ref) => store[ref] ?? null

test('inlines a simple ref', () => {
  const store = { 'pr_x@v26.0602': { id: 'pr_x', content: { en: { status: 'validated', text: 'Hi' } } } }
  const { resolved, problems } = resolveDocument({ prompt: { ref: 'pr_x@v26.0602' } }, lookupFrom(store))
  expect(resolved).toEqual({ prompt: { id: 'pr_x', content: { en: { status: 'validated', text: 'Hi' } } } })
  expect(problems).toEqual([])
})

test('sibling keys win over the entity body; ref dropped; nested ref resolved', () => {
  const store = {
    'it_x@v26.0602': { id: 'it_x', required: false, question: { prompt: { ref: 'pr_x@v26.0602' } } },
    'pr_x@v26.0602': { id: 'pr_x', content: { en: { status: 'validated', text: 'Q' } } },
  }
  const { resolved } = resolveDocument({ ref: 'it_x@v26.0602', required: true }, lookupFrom(store))
  const r = resolved as Record<string, any>
  expect(r.required).toBe(true)
  expect('ref' in r).toBe(false)
  expect(r.question.prompt.content.en.text).toBe('Q')
})

test('unresolved ref records a problem and keeps the node intact', () => {
  const { resolved, problems } = resolveDocument({ prompt: { ref: 'pr_missing@v26.0602' } }, lookupFrom({}))
  expect(problems).toEqual([{ kind: 'unresolved_ref', where: 'pr_missing@v26.0602' }])
  expect((resolved as any).prompt.ref).toBe('pr_missing@v26.0602')
})

test('collects all unresolved refs', () => {
  const { problems } = resolveDocument({ a: { ref: 'pr_1@v26.0602' }, b: [{ ref: 'pr_2@v26.0602' }] }, lookupFrom({}))
  expect(new Set(problems.map((p) => p.where))).toEqual(new Set(['pr_1@v26.0602', 'pr_2@v26.0602']))
})

test('non-ref dicts pass through unchanged', () => {
  const doc = { option: { input_data_type: 'choice', options: [{ index: 1, value: 0 }] } }
  expect(resolveDocument(doc, lookupFrom({})).resolved).toEqual(doc)
})

test('collectRefs gathers nested + array refs', () => {
  const refs = collectRefs({ a: { ref: 'pr_1@v1' }, b: [{ ref: 'pr_2@v1' }, { c: { ref: 'opt_3@v1' } }] })
  expect(refs).toEqual(new Set(['pr_1@v1', 'pr_2@v1', 'opt_3@v1']))
})
