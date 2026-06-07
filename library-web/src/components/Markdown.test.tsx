import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Markdown } from './Markdown'

describe('Markdown', () => {
  it('renders markdown emphasis and raw <br> line breaks', () => {
    const { container } = render(<Markdown>{'A **bold** word.<br />next line'}</Markdown>)
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(container.textContent).toContain('next line')
  })

  it('strips dangerous HTML (scripts) but keeps the surrounding text', () => {
    const { container } = render(<Markdown>{'safe <script>alert(1)</script> text'}</Markdown>)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('safe')
    expect(container.textContent).toContain('text')
  })

  it('opens links in a new tab with a safe rel', () => {
    const { container } = render(<Markdown>{'see [docs](https://example.org)'}</Markdown>)
    const a = container.querySelector('a')
    expect(a).toHaveAttribute('href', 'https://example.org')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noreferrer')
  })
})
