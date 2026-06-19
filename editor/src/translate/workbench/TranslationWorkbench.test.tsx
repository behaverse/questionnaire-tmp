// editor/src/translate/workbench/TranslationWorkbench.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranslationWorkbench } from './TranslationWorkbench'
import type { WbClient } from './load'

const client: WbClient = {
  listEntities: async () => [{ id: 'pr_a', version: 'v26.0606' }],
  fetchEntityBody: async () => ({ id: 'pr_a', content: { en: { status: 'complete', text: 'How are you?' } } }),
}
const translate = vi.fn(async () => 'Comment ça va ?')

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
