import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemsBlock } from './ItemsBlock'
import type { RenderModel } from '../definition/renderModel'

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Page one',
    blocks: [
      { kind: 'message', text: 'Welcome', unresolved: false },
      { kind: 'item', number: 1, stem: 'How are you?', required: true, options: [{ index: 1, text: 'Bad' }, { index: 2, text: 'Good' }], unresolved: false },
      { kind: 'section', id: 's', sharedOptions: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }], items: [
        { kind: 'item', number: 2, stem: 'Item A', required: false, options: [], unresolved: false },
        { kind: 'item', number: 3, stem: '', required: false, options: [], unresolved: true },
      ] },
    ],
  }],
}

describe('ItemsBlock', () => {
  it('renders messages, items with their options, and a required marker', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('How are you?')).toBeInTheDocument()
    expect(screen.getByText('Bad')).toBeInTheDocument()
    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getAllByText('required').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a fallback for unresolved items', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText(/content unavailable/i)).toBeInTheDocument()
  })

  it('renders a matrix section scale once', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })
})
