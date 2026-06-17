import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('./useEvaluator', async () => {
  const real = await import('./evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { ValidationPanel } from './ValidationPanel'
import { Inspector } from '../inspector/Inspector'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
  pages: [{ id: 'p1', elements: [{ id: 'it_a', question: {}, option: {} }] }],
} as unknown as Questionnaire

describe('ValidationPanel', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('adds an auto-id rule via + Add rule', () => {
    render(<ValidationPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    expect(useEditorStore.getState().model!.validation?.[0]?.id).toBe('val_1')
  })
  it('deletes a rule', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, validation: [{ id: 'val_1', condition: 'a>b', message: 'm', targets: ['it_a'] }] }))
    render(<ValidationPanel />)
    fireEvent.click(screen.getByRole('button', { name: /edit validation rule 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete rule/i }))
    expect(useEditorStore.getState().model!.validation).toBeUndefined()
  })
  it('shows an attention count for invalid rules', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, validation: [{ id: '', condition: '', message: '', targets: [] }] }))
    render(<ValidationPanel />)
    expect(screen.getByText(/need.* attention/i)).toBeInTheDocument()
  })
})

describe('Inspector mounts ValidationPanel at the questionnaire root', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))
  it('shows Validation rules at root (via Validation tab)', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    fireEvent.click(screen.getByRole('tab', { name: /validation/i }))
    expect(screen.getByText(/validation rules/i)).toBeInTheDocument()
  })
  it('does not show Validation rules for a page selection', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    expect(screen.queryByText(/validation rules/i)).not.toBeInTheDocument()
  })
})
