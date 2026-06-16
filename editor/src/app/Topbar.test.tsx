import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Topbar } from './Topbar'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as Questionnaire

describe('Topbar Open preview', () => {
  beforeEach(() => { useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never); sessionStorage.clear() })

  it('writes the bundle to sessionStorage and opens preview.html', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<Topbar onValidate={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /open preview/i }))
    const raw = sessionStorage.getItem('qv-preview-bundle')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).questionnaire.metadata.id).toBe('qst_x')
    expect(openSpy).toHaveBeenCalledWith('/preview.html', '_blank')
    openSpy.mockRestore()
  })
})
