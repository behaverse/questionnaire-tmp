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
    fireEvent.click(screen.getByRole('button', { name: /export/i }))      // open the Export ▾ menu
    fireEvent.click(screen.getByRole('menuitem', { name: /open preview/i }))
    const raw = sessionStorage.getItem('qv-preview-bundle')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).questionnaire.metadata.id).toBe('qst_x')
    expect(openSpy).toHaveBeenCalledWith('/preview.html', '_blank')
    openSpy.mockRestore()
  })
})

describe('Topbar Home button', () => {
  beforeEach(() => { useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never) })

  it('Home button returns to the start screen (clears the model) after confirm', () => {
    useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Topbar onValidate={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /home/i }))
    expect(useEditorStore.getState().model).toBeNull()
    confirmSpy.mockRestore()
  })
})

describe('Topbar Translate toggle', () => {
  it('Translate button toggles translateView', () => {
    useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never)
    render(<Topbar onValidate={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /^translate$/i }))
    expect(useEditorStore.getState().translateView).toBe(true)
  })
})

describe('Topbar Inspector toggle', () => {
  it('Inspector button toggles inspectorOpen (default on)', () => {
    useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never)
    expect(useEditorStore.getState().inspectorOpen).toBe(true)
    render(<Topbar onValidate={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /^inspector$/i }))
    expect(useEditorStore.getState().inspectorOpen).toBe(false)
  })
})
