import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguagesField } from './LanguagesField'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as Questionnaire

describe('LanguagesField', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('shows the primary language as a non-removable chip', () => {
    render(<LanguagesField />)
    expect(screen.getByText('en')).toBeInTheDocument()
    expect(screen.getByText(/primary/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove en/i })).not.toBeInTheDocument()
  })
  it('adds a valid locale to available_languages', () => {
    render(<LanguagesField />)
    fireEvent.change(screen.getByLabelText('Add language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toEqual(['fr'])
  })
  it('rejects a malformed locale code', () => {
    render(<LanguagesField />)
    fireEvent.change(screen.getByLabelText('Add language'), { target: { value: 'Bad Code!' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toBeUndefined()
  })
  it('removes a language', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, metadata: { ...m.metadata, available_languages: ['fr', 'de'] } }))
    render(<LanguagesField />)
    fireEvent.click(screen.getByRole('button', { name: /remove fr/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toEqual(['de'])
  })
})
