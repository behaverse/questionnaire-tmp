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

test('saveDraft persists the pool; loadDraft returns it (empty for legacy)', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'new' }, { 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  const d = await loadDraft()
  expect(d?.entities).toEqual({ 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  await saveDraft(phq9 as Questionnaire, { kind: 'new' }) // no pool arg
  expect((await loadDraft())?.entities).toEqual({})
})
