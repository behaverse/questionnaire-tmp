import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MetadataHeader } from './MetadataHeader'
import type { DefMetadata } from '../api/types'

const meta: DefMetadata = {
  id: 'qst_phq9', title: 'PHQ-9', version: 'v26.0602', language: 'en',
  available_languages: ['en', 'pt'], license: 'cc_by',
}

describe('MetadataHeader', () => {
  it('shows the title, a download button, and a language switcher when multilingual', () => {
    render(
      <MemoryRouter>
        <MetadataHeader meta={meta} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /PHQ-9/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download json/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
  })

  it('fires onDownload when the button is clicked', async () => {
    const onDownload = vi.fn()
    render(
      <MemoryRouter>
        <MetadataHeader meta={meta} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={onDownload} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /download json/i }))
    expect(onDownload).toHaveBeenCalled()
  })
})
