import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', language: 'en', available_languages: ['fr'] }, pages: [] } as unknown as Questionnaire

describe('EditingLocaleSwitcher', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('lists [primary, ...available_languages] and defaults to primary', () => {
    render(<EditingLocaleSwitcher />)
    const sel = screen.getByLabelText('Editing language') as HTMLSelectElement
    expect(sel.value).toBe('en')
    expect([...sel.options].map((o) => o.value)).toEqual(['en', 'fr'])
  })
  it('selecting a locale sets editingLocale', () => {
    render(<EditingLocaleSwitcher />)
    fireEvent.change(screen.getByLabelText('Editing language'), { target: { value: 'fr' } })
    expect(useEditorStore.getState().editingLocale).toBe('fr')
  })
})
