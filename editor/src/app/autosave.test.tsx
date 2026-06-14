import { render, screen, waitFor } from '@testing-library/react'
import 'fake-indexeddb/auto'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { App } from './App'
import { useEditorStore } from '../state/store'
import { saveDraft, clearDraft } from '../persistence/indexeddb'

beforeEach(async () => { useEditorStore.getState().reset(); await clearDraft() })

test('a saved draft is restored on next boot', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  render(<App />)
  // App boot calls loadDraft and rehydrates the store; the topbar shows the title
  await waitFor(() => {
    expect(useEditorStore.getState().model?.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
  })
  // and the workspace (structure nav) is shown, not the start screen
  expect(await screen.findByRole('navigation', { name: /structure/i })).toBeInTheDocument()
})
