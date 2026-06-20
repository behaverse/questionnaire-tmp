// editor/src/translate/workbench/TranslationWorkbench.test.tsx
import 'fake-indexeddb/auto' // the workbench autosaves its session to IndexedDB
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranslationWorkbench } from './TranslationWorkbench'
import { clearWorkbench } from '../../persistence/indexeddb'
import type { WbClient } from './load'

const client: WbClient = {
  listEntities: async () => [{ id: 'pr_a', version: 'v26.0606' }],
  fetchEntityBody: async () => ({ id: 'pr_a', content: { en: { status: 'complete', text: 'How are you?' } } }),
}
const translate = vi.fn(async () => 'Comment ça va ?')

// the workbench autosaves its session to IndexedDB + restores it on mount — clear between tests
beforeEach(async () => { await clearWorkbench() })

describe('TranslationWorkbench', () => {
  it('loads untranslated entities and auto-translates a field to draft', async () => {
    render(<TranslationWorkbench onExit={() => {}} client={client} translate={translate as never} />)
    // default type=prompt, source=en; set target then load
    fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(screen.getByText('How are you?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^auto$/i }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: /target pr_a/ })).toHaveValue('Comment ça va ?'))
    expect(translate).toHaveBeenCalledWith('How are you?', 'en', 'fr', 'prompt')
  })

  it('marks an entity complete via the per-entity status select', async () => {
    render(<TranslationWorkbench onExit={() => {}} client={client} translate={translate as never} />)
    fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(screen.getByText('How are you?')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('status pr_a'), { target: { value: 'complete' } })
    await waitFor(() => expect((screen.getByLabelText('status pr_a') as HTMLSelectElement).value).toBe('complete'))
  })

  it('filters entities with the search box', async () => {
    render(<TranslationWorkbench onExit={() => {}} client={client} translate={translate as never} />)
    fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(screen.getByText('How are you?')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search Library translations'), { target: { value: 'zzz-nomatch' } })
    await waitFor(() => expect(screen.getByText(/no entities match/i)).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search Library translations'), { target: { value: 'how are' } })
    await waitFor(() => expect(screen.getByText('How are you?')).toBeInTheDocument())
  })

  it('shows an empty-state when nothing is untranslated', async () => {
    const done: WbClient = {
      listEntities: async () => [{ id: 'pr_b', version: 'v1' }],
      fetchEntityBody: async () => ({ id: 'pr_b', content: { en: { text: 'Hi' }, fr: { text: 'Salut' } } }),
    }
    render(<TranslationWorkbench onExit={() => {}} client={done} translate={translate as never} />)
    fireEvent.change(screen.getByLabelText('Target language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(screen.getByText(/nothing untranslated/i)).toBeInTheDocument())
  })
})
