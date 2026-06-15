import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async (_orig) => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { ShowIfEditor } from './ShowIfEditor'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  pages: [{ id: 'p1', elements: [{ id: 'q_a' }] }],
} as unknown as Questionnaire

describe('ShowIfEditor', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('Set writes show_if onto the node', () => {
    render(<ShowIfEditor path={['pages', 0, 'elements', 0]} />)
    fireEvent.change(screen.getByLabelText('Expression'), { target: { value: "q_x == 'y'" } })
    fireEvent.click(screen.getByRole('button', { name: /^set$/i }))
    const node = useEditorStore.getState().model!.pages[0].elements[0] as { show_if?: string }
    expect(node.show_if).toBe("q_x == 'y'")
  })

  it('Clear removes show_if', () => {
    useEditorStore.getState().applyEdit((m) => {
      ;(m.pages[0].elements[0] as { show_if?: string }).show_if = "q_x == 'y'"
      return m
    })
    render(<ShowIfEditor path={['pages', 0, 'elements', 0]} />)
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    const node = useEditorStore.getState().model!.pages[0].elements[0] as { show_if?: string }
    expect(node.show_if).toBeUndefined()
  })
})
