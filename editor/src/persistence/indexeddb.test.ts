import 'fake-indexeddb/auto'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { saveDraft, loadDraft, clearDraft } from './indexeddb'

test('saveDraft then loadDraft returns the model', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  const draft = await loadDraft()
  expect(draft?.model.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
  expect(draft?.source).toEqual({ kind: 'file', name: 'phq9.json' })
})

test('clearDraft removes it', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'new' })
  await clearDraft()
  expect(await loadDraft()).toBeNull()
})
