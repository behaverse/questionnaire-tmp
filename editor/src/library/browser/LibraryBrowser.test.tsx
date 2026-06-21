// editor/src/library/browser/LibraryBrowser.test.tsx (replace)
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryBrowser } from './LibraryBrowser'
import { clearLibrarySession } from '../../persistence/indexeddb'
import type { LibraryClient } from './client'

const client: LibraryClient = {
  listEntities: async (etype) => etype === 'prompt' ? [{ id: 'pr_a', version: 'v1', title: 'A' }] : [],
  fetchEntityBody: async () => ({ id: 'pr_a', content: { en: { status: 'draft', text: 'Hello' } } }),
}
beforeEach(async () => { await clearLibrarySession() })

describe('LibraryBrowser', () => {
  it('selecting an entity loads it into the inspector; editing emits into the session', async () => {
    render(<LibraryBrowser onExit={() => {}} client={client} />)
    await waitFor(() => expect(screen.getByText('pr_a')).toBeInTheDocument())
    fireEvent.click(screen.getByText('pr_a'))
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument()) // inspect loaded
    fireEvent.click(screen.getByRole('tab', { name: /edit/i }))
    fireEvent.change(screen.getByLabelText('Prompt text', { exact: true }), { target: { value: 'Hi there' } })
    // the edited value is now the working body (Download button appears once edited)
    await waitFor(() => expect(screen.getByRole('button', { name: /download contribution/i })).toBeInTheDocument())
  })
  it('Back calls onExit', () => {
    const onExit = vi.fn()
    render(<LibraryBrowser onExit={onExit} client={client} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onExit).toHaveBeenCalled()
  })
  it('batch translate fills untranslated fields for a target locale into the session', async () => {
    const translate = vi.fn(async () => 'TRAD')
    const c = {
      listEntities: async (etype: string) => etype === 'prompt' ? [{ id: 'pr_a', version: 'v1', title: 'A' }] : [],
      fetchEntityBody: async () => ({ id: 'pr_a', content: { en: { status: 'complete', text: 'Hello' } } }),
    }
    render(<LibraryBrowser onExit={() => {}} client={c as never} translate={translate as never} />)
    await waitFor(() => expect(screen.getByText('pr_a')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Batch target locale'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /batch translate/i }))
    await waitFor(() => expect(translate).toHaveBeenCalledWith('Hello', 'en', 'fr', 'prompt'))
    await waitFor(() => expect(screen.getByRole('button', { name: /download contribution/i })).toBeInTheDocument())
  })
})
