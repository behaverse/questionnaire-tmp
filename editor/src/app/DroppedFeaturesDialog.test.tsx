// editor/src/app/DroppedFeaturesDialog.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DroppedFeaturesDialog } from './DroppedFeaturesDialog'

describe('DroppedFeaturesDialog', () => {
  it('lists each dropped feature', () => {
    render(<DroppedFeaturesDialog items={['Scoring "Demo total" (no SurveyJS equivalent)', 'Logic rule (branch) — not exported']} onClose={vi.fn()} />)
    expect(screen.getByText(/Scoring "Demo total"/)).toBeInTheDocument()
    expect(screen.getByText(/Logic rule \(branch\)/)).toBeInTheDocument()
  })
})
