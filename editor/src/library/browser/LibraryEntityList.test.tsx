// editor/src/library/browser/LibraryEntityList.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryEntityList } from './LibraryEntityList'
import type { LibraryClient } from './client'

const client: LibraryClient = {
  listEntities: async (etype) => etype === 'prompt'
    ? [{ id: 'pr_mood', version: 'v1', title: 'Mood' }, { id: 'pr_sleep', version: 'v1', title: 'Sleep' }]
    : [],
  fetchEntityBody: async () => null,
}

function Harness({ client, onSelect }: { client: never; onSelect: () => void }) {
  const [etype, setEtype] = useState('prompt')
  return <LibraryEntityList client={client} etype={etype} onEtype={setEtype} selectedRef={null} onSelect={onSelect} />
}

describe('LibraryEntityList', () => {
  it('lists entities for the selected type, filters by search, and selects', async () => {
    const onSelect = vi.fn()
    render(<Harness client={client as never} onSelect={onSelect} />)
    await waitFor(() => expect(screen.getByText('pr_mood')).toBeInTheDocument())
    expect(screen.getByText('pr_sleep')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search entities'), { target: { value: 'sleep' } })
    expect(screen.queryByText('pr_mood')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('pr_sleep'))
    expect(onSelect).toHaveBeenCalledWith('pr_sleep@v1')
  })
})
