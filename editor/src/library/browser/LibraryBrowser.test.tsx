// editor/src/library/browser/LibraryBrowser.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryBrowser } from './LibraryBrowser'
import type { LibraryClient } from './client'

const client: LibraryClient = {
  listEntities: async (etype) => etype === 'prompt' ? [{ id: 'pr_a', version: 'v1', title: 'A' }] : [],
  fetchEntityBody: async () => ({ id: 'pr_a', content: { en: { text: 'Hello' } } }),
}

describe('LibraryBrowser', () => {
  it('selecting a list entity shows it in the inspector', async () => {
    render(<LibraryBrowser onExit={() => {}} client={client} />)
    await waitFor(() => expect(screen.getByText('pr_a')).toBeInTheDocument())
    expect(screen.getByText(/select an entity/i)).toBeInTheDocument() // nothing selected yet
    fireEvent.click(screen.getByText('pr_a'))
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument()) // inspector loaded
  })
  it('Back calls onExit', () => {
    const onExit = vi.fn()
    render(<LibraryBrowser onExit={onExit} client={client} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onExit).toHaveBeenCalled()
  })
})
