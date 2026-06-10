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
    // language is a dropdown (scales to many languages) listing each available language
    const select = screen.getByLabelText(/language/i)
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Portuguese' })).toBeInTheDocument()
  })

  it('fires onLang with the chosen language when a different option is selected', async () => {
    const onLang = vi.fn()
    render(
      <MemoryRouter>
        <MetadataHeader meta={meta} version="v26.0602" allVersions={[]} lang="en" onLang={onLang} onDownload={() => {}} />
      </MemoryRouter>,
    )
    await userEvent.selectOptions(screen.getByLabelText(/language/i), 'pt')
    expect(onLang).toHaveBeenCalledWith('pt')
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

  it('shows the variant tag when the form has a non-base variant', () => {
    render(
      <MemoryRouter>
        <MetadataHeader meta={{ ...meta, variant: 'Part A screener' }} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Part A screener')).toBeInTheDocument()
  })
})
