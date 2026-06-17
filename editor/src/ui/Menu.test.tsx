import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Download } from 'lucide-react'
import { Menu } from './Menu'

describe('Menu', () => {
  it('opens on click and fires an item, then closes', () => {
    const a = vi.fn()
    render(<Menu label="Export" icon={Download} items={[{ label: 'Export JSON', onClick: a }, { label: 'Export bundle', onClick: () => {} }]} />)
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Export JSON' }))
    expect(a).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })
  it('closes on Escape', () => {
    render(<Menu label="Export" items={[{ label: 'X', onClick: () => {} }]} />)
    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
