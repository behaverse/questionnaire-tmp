import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('./useEvaluator', async () => {
  const real = await import('./evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { LogicPanel } from './LogicPanel'
import { Inspector } from '../inspector/Inspector'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
  pages: [{ id: 'p1', elements: [{ id: 'it_a', question: {}, option: {} }] }, { id: 'p2', elements: [] }],
} as unknown as Questionnaire

describe('LogicPanel', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('adds a rule via + Add rule', () => {
    render(<LogicPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    expect(useEditorStore.getState().model!.logic?.length).toBe(1)
  })

  it('deletes a rule', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, logic: [{ type: 'skip', condition: 'q==1', action: { skip_to: 'p2' } }] }))
    render(<LogicPanel />)
    fireEvent.click(screen.getByRole('button', { name: /edit rule 1/i })) // open the rule editor
    fireEvent.click(screen.getByRole('button', { name: /delete rule/i }))
    expect(useEditorStore.getState().model!.logic).toBeUndefined()
  })

  it('shows an attention count for invalid rules', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, logic: [{ type: 'skip', condition: '', action: { skip_to: '' } }] }))
    render(<LogicPanel />)
    expect(screen.getByText(/need.* attention/i)).toBeInTheDocument()
  })
})

describe('Inspector mounts LogicPanel at the questionnaire root', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('shows Logic rules when nothing is selected (root)', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    expect(screen.getByText(/logic rules/i)).toBeInTheDocument()
  })
  it('does not show Logic rules when a page is selected', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    expect(screen.queryByText(/logic rules/i)).not.toBeInTheDocument()
  })
})
