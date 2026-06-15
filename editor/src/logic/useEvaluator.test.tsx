import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { makeFakeEvaluator } from './evaluator'

vi.mock('./evaluator', async (orig) => {
  const actual = await orig<typeof import('./evaluator')>()
  return { ...actual, loadEvaluator: vi.fn(async () => actual.makeFakeEvaluator({ ok: true })) }
})

import { useEvaluator } from './useEvaluator'

function Probe() {
  const ev = useEvaluator()
  return <div>{ev ? 'ready' : 'loading'}</div>
}

describe('useEvaluator', () => {
  beforeEach(() => vi.clearAllMocks())
  it('returns null then the loaded evaluator', async () => {
    render(<Probe />)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument())
  })
  it('exposes a usable evaluator', () => {
    const ev = makeFakeEvaluator({ ok: true })
    expect(ev.check('x')).toBeNull()
  })
})
