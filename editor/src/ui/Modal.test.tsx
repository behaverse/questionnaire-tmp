import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal a11y', () => {
  it('exposes role=dialog with an accessible name from label', () => {
    render(<Modal label="My dialog" onClose={() => {}}><button>ok</button></Modal>)
    expect(screen.getByRole('dialog', { name: 'My dialog' })).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<Modal label="d" onClose={onClose}><button>ok</button></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn()
    render(<Modal label="d" onClose={onClose}><button>ok</button></Modal>)
    const dialog = screen.getByRole('dialog')
    fireEvent.mouseDown(dialog)                  // inside the panel — no close
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(dialog.parentElement!)   // backdrop — closes
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('traps Tab focus within the dialog (wraps last → first)', () => {
    render(<Modal label="d" onClose={() => {}}><button>first</button><button>last</button></Modal>)
    screen.getByText('last').focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByText('first'))
  })

  it('restores focus to the previously-focused element on unmount', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { unmount } = render(<Modal label="d" onClose={() => {}}><button>ok</button></Modal>)
    unmount()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
