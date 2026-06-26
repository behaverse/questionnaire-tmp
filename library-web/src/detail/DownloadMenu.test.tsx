import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadMenu } from './DownloadMenu'

describe('DownloadMenu', () => {
  const items = (onJson = vi.fn(), onMd = vi.fn()) => [
    { label: 'JSON', onSelect: onJson },
    { label: 'Markdown', onSelect: onMd },
  ]

  it('hides the items until the trigger is clicked', async () => {
    render(<DownloadMenu items={items()} />)
    expect(screen.queryByRole('menuitem', { name: 'JSON' })).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: /download/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'JSON' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Markdown' })).toBeInTheDocument()
  })

  it('fires the chosen item and closes the menu', async () => {
    const onJson = vi.fn()
    render(<DownloadMenu items={items(onJson)} />)
    await userEvent.click(screen.getByRole('button', { name: /download/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'JSON' }))
    expect(onJson).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menuitem', { name: 'JSON' })).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    render(<DownloadMenu items={items()} />)
    await userEvent.click(screen.getByRole('button', { name: /download/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
