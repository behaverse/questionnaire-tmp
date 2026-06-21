import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranslationPanel } from './TranslationPanel'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

vi.mock('./translateClient', () => ({ translateText: vi.fn(async () => 'Comment ça va ?') }))

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en', available_languages: ['fr'] },
  pages: [{ id: 'p1', elements: [{ id: 'it_1', question: { prompt: { ref: 'pr_a@v26.0606.dev1' } }, option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } }] }],
} as unknown as Questionnaire

beforeEach(() => {
  const s = useEditorStore.getState()
  s.reset()
  s.loadModel(structuredClone(model), { kind: 'file', name: 't.json' }, { 'pr_a@v26.0606.dev1': { id: 'pr_a', content: { en: { status: 'complete', text: 'How are you?' } } } })
  s.setEditingLocale('fr')
})

describe('TranslationPanel', () => {
  it('auto-translates a row: fills the target and marks it draft', async () => {
    // editingLocale is 'fr' (file beforeEach); the prompt source is "How are you?"
    render(<TranslationPanel />)
    // click the row's Auto button
    const autoBtn = screen.getAllByRole('button', { name: /^auto$/i })[0]
    fireEvent.click(autoBtn)
    await waitFor(() => {
      const body = useEditorStore.getState().pool['pr_a@v26.0606.dev1'] as { content: Record<string, { text?: string; status?: string }> }
      expect(body.content.fr?.text).toBe('Comment ça va ?')
      expect(body.content.fr?.status).toBe('draft')
    })
  })

  it('shows the source and writes the target translation to the pool', async () => {
    render(<TranslationPanel />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
    const field = screen.getByLabelText('translate pr_a@v26.0606.dev1:{"t":"text"}')
    fireEvent.change(field, { target: { value: 'Comment ça va ?' } })
    await waitFor(() => {
      const body = useEditorStore.getState().pool['pr_a@v26.0606.dev1'] as { content: Record<string, { text?: string }> }
      expect(body.content.fr?.text).toBe('Comment ça va ?')
    })
  })

  it('disables the bulk auto-translate button while a bulk run is in progress', async () => {
    const { translateText } = await import('./translateClient')
    let resolve!: (v: string) => void
    ;(translateText as ReturnType<typeof vi.fn>).mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    render(<TranslationPanel />)
    const btn = screen.getByRole('button', { name: /auto-translate untranslated/i })
    fireEvent.click(btn)
    // button should be disabled while the bulk run is in flight
    expect(btn).toBeDisabled()
    resolve('done')
    await waitFor(() => expect(btn).not.toBeDisabled())
  })

  it('shows an empty-state when the editing language is the primary', () => {
    useEditorStore.getState().setEditingLocale('en')
    render(<TranslationPanel />)
    expect(screen.getByText(/translate this questionnaire/i)).toBeInTheDocument()
  })

  it('empty-state lets you pick an existing target language', () => {
    useEditorStore.getState().setEditingLocale('en')
    render(<TranslationPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'fr' })) // existing available language
    expect(useEditorStore.getState().editingLocale).toBe('fr')
  })

  it('empty-state adds a new language and starts translating into it', () => {
    useEditorStore.getState().setEditingLocale('en')
    render(<TranslationPanel />)
    fireEvent.change(screen.getByLabelText('New language code'), { target: { value: 'de' } })
    fireEvent.click(screen.getByRole('button', { name: /add & translate/i }))
    expect(useEditorStore.getState().editingLocale).toBe('de')
    expect((useEditorStore.getState().model!.metadata.available_languages as string[])).toContain('de')
  })
})
