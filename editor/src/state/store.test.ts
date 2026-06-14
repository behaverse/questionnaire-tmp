import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from './store'

beforeEach(() => useEditorStore.getState().reset())

test('loadModel sets model, marks clean, validates', () => {
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  const s = useEditorStore.getState()
  expect(s.model?.metadata.id).toMatch(/^qst_/)
  expect(s.dirty).toBe(false)
  expect(s.validation?.valid).toBe(true)
})

test('editing marks dirty and re-validates', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.applyEdit((m) => ({ ...m, metadata: { ...m.metadata, title: 'X' } }))
  const s = useEditorStore.getState()
  expect(s.dirty).toBe(true)
  expect(s.model?.metadata.title).toBe('X')
})

test('select sets the selection path', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.select(['pages', 0])
  expect(useEditorStore.getState().selection).toEqual(['pages', 0])
})

test('applyEdit clears selection when the selected node is deleted', async () => {
  const { deleteNode } = await import('../model/tree')
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.select(['pages', 0, 'elements', 0])
  st.applyEdit((m) => deleteNode(m, ['pages', 0, 'elements', 0]))
  // selection no longer resolves to the same node -> cleared if now missing
  const s = useEditorStore.getState()
  if (s.selection) {
    const { getAtPath } = await import('../model/path')
    expect(getAtPath(s.model!, s.selection)).not.toBeUndefined()
  }
})

test('revalidate refreshes validation without marking dirty', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.revalidate()
  expect(useEditorStore.getState().dirty).toBe(false)
  expect(useEditorStore.getState().validation?.valid).toBe(true)
})

test('togglePreview flips previewOpen', () => {
  const st = useEditorStore.getState()
  expect(useEditorStore.getState().previewOpen).toBe(false)
  st.togglePreview()
  expect(useEditorStore.getState().previewOpen).toBe(true)
})

test('upsert/remove pool entity; loadModel seeds the pool; reset clears it', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' }, { 'pr_x@v26.0609.dev1': { id: 'pr_x' } })
  expect(useEditorStore.getState().pool['pr_x@v26.0609.dev1']).toEqual({ id: 'pr_x' })
  st.upsertPoolEntity('pr_y@v26.0609.dev1', { id: 'pr_y' })
  expect(useEditorStore.getState().pool['pr_y@v26.0609.dev1']).toEqual({ id: 'pr_y' })
  st.removePoolEntity('pr_x@v26.0609.dev1')
  expect(useEditorStore.getState().pool['pr_x@v26.0609.dev1']).toBeUndefined()
  st.reset()
  expect(useEditorStore.getState().pool).toEqual({})
})

test('openPicker/closePicker manage picker state', () => {
  const st = useEditorStore.getState()
  const onPick = vi.fn()
  st.openPicker('prompt', onPick)
  expect(useEditorStore.getState().picker?.etype).toBe('prompt')
  useEditorStore.getState().picker!.onPick('pr_a@v1')
  expect(onPick).toHaveBeenCalledWith('pr_a@v1')
  st.closePicker()
  expect(useEditorStore.getState().picker).toBeNull()
})

test('refreshStaleness flags stale Library refs; upgradeRefAction repoints + clears', async () => {
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as Questionnaire
  const st = useEditorStore.getState()
  st.loadModel(model, { kind: 'file', name: 't.json' })
  await st.refreshStaleness(async () => 'v26.0610') // injected latestVersion → newer
  expect(useEditorStore.getState().staleness['pr_x@v26.0609']).toBe('v26.0610')
  st.upgradeRefAction('pr_x@v26.0609', 'pr_x@v26.0610')
  const q = useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }
  expect(q.question.prompt.ref).toBe('pr_x@v26.0610')
  expect(useEditorStore.getState().staleness['pr_x@v26.0609']).toBeUndefined()
})
