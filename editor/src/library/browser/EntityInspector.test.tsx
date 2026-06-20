// editor/src/library/browser/EntityInspector.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EntityInspector } from './EntityInspector'
import type { LibraryClient } from './client'

const client: LibraryClient = {
  listEntities: async () => [],
  fetchEntityBody: async (ref) => ref.startsWith('opt_')
    ? { id: 'opt_a', measurement_type: 'ordinal', content: { en: { label: 'Agreement', options: [{ index: 1, text: 'Yes' }] }, fr: { label: 'Accord', options: [{ index: 1, text: 'Oui' }] } } }
    : { id: 'pr_a', construct: 'mood', content: { en: { text: 'How are you?' } } },
}

describe('EntityInspector', () => {
  it('prompts the user to pick an entity when none is selected', () => {
    render(<EntityInspector refStr={null} client={client} />)
    expect(screen.getByText(/select an entity/i)).toBeInTheDocument()
  })
  it('shows the fetched entity: id, structural fields, and content per locale', async () => {
    render(<EntityInspector refStr="opt_a@v26.0606" client={client} />)
    await waitFor(() => expect(screen.getByText('opt_a@v26.0606')).toBeInTheDocument())
    expect(screen.getByText(/ordinal/)).toBeInTheDocument()   // structural field
    expect(screen.getByText('Agreement')).toBeInTheDocument() // en content
    expect(screen.getByText('Accord')).toBeInTheDocument()    // fr content
    expect(screen.getByText('Oui')).toBeInTheDocument()       // choice text
  })
})
