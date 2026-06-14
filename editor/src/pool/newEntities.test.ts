import { buildContext, buildInstruction, buildMessage } from './newEntities'

test('buildContext mints a ctx ref + empty-text body', () => {
  const { ref, body } = buildContext(new Set(), 'v26.0609.dev1', 'en')
  expect(ref).toBe('ctx_new_1@v26.0609.dev1')
  expect(body).toEqual({ id: 'ctx_new_1', content: { en: { status: 'draft', text: '' } } })
})
test('buildInstruction mints an ins ref + empty-text body (no dimension yet)', () => {
  const { ref, body } = buildInstruction(new Set(['ins_new_1']), 'v26.0609.dev1', 'en')
  expect(ref).toBe('ins_new_2@v26.0609.dev1')
  expect(body).toEqual({ id: 'ins_new_2', content: { en: { status: 'draft', text: '' } } })
})
test('buildMessage mints a msg ref + default type + empty text', () => {
  const { ref, body } = buildMessage(new Set(), 'v26.0609.dev1', 'en')
  expect(ref).toBe('msg_new_1@v26.0609.dev1')
  expect(body).toEqual({ id: 'msg_new_1', type: ['information'], content: { en: { status: 'draft', text: '' } } })
})
