import { render, screen } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { App } from './App'
import { useEditorStore } from '../state/store'

beforeEach(() => useEditorStore.getState().reset())

test('boots to the start screen when no draft exists', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: /questionnaire editor/i })).toBeInTheDocument()
})
