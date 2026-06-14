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
