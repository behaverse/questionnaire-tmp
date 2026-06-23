import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentScreen } from './ConsentScreen'

test('renders the consent text and fires Accept / Decline', async () => {
  const onAccept = vi.fn(); const onDecline = vi.fn()
  render(<ConsentScreen text={'Please **consent** to take part.'} onAccept={onAccept} onDecline={onDecline} locale="en" />)
  expect(screen.getByText(/consent/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /i agree/i }))
  expect(onAccept).toHaveBeenCalledOnce()
  await userEvent.click(screen.getByRole('button', { name: /do not agree/i }))
  expect(onDecline).toHaveBeenCalledOnce()
})
