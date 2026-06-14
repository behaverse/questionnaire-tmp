import { buildNewItem } from './newItem'

test('mints a prompt ref + empty prompt body + inline item with a default choice option', () => {
  const { promptRef, promptBody, item } = buildNewItem(new Set(['pr_new_1']), 'v26.0609.dev1', 'en')
  expect(promptRef).toBe('pr_new_2@v26.0609.dev1') // pr_new_1 taken
  expect(promptBody).toEqual({ id: 'pr_new_2', content: { en: { status: 'draft', text: '' } } })
  expect(item.question.prompt.ref).toBe('pr_new_2@v26.0609.dev1')
  expect(item.option.input_data_type).toBe('choice')
  expect(item.option.options).toHaveLength(2)
  expect(item.option.content.en.options).toHaveLength(2)
})
