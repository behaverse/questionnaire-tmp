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

  it('renders an item instruction when present', () => {
    const m: RenderModel = {
      pages: [{ id: 'p', blocks: [
        { kind: 'item', number: 1, stem: 'Stem', instruction: 'Pick one option', required: false, options: [], unresolved: false },
      ] }],
    }
    render(<ItemsBlock model={m} />)
    expect(screen.getByText('Pick one option')).toBeInTheDocument()
  })

  it('flags content shown in a fallback language with the language code + explanation', () => {
    const m: RenderModel = {
      pages: [{ id: 'p', blocks: [
        { kind: 'message', text: 'Please answer the following.', unresolved: false, fallbackLang: 'en' },
        { kind: 'item', number: 1, stem: 'Combien de fois…', required: false,
          instruction: 'Choose one', instructionFallbackLang: 'en', options: [], unresolved: false },
      ] }],
    }
    render(<ItemsBlock model={m} />)
    // a small language-code marker is shown for both the untranslated message and instruction
    const tags = screen.getAllByText('en')
    expect(tags.length).toBe(2)
    expect(tags[0]).toHaveAttribute('title', expect.stringMatching(/no translation in the selected language/i))
  })
})
