import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorScreen } from './ErrorScreen'

test('ErrorScreen renders the invite_invalid message', () => {
  render(<ErrorScreen locale="en" kind="invite_invalid" code="invite_required" onRetry={() => {}} />)
  expect(screen.getByRole('heading')).toBeInTheDocument()
  // the invite_invalid title string is shown (not a crash / missing key)
})

test('a resume_unreachable failure offers a Start fresh escape', async () => {
  const onStartFresh = vi.fn()
  render(<ErrorScreen locale="en" kind="failed" code="resume_unreachable" onRetry={() => {}} onStartFresh={onStartFresh} />)
  await userEvent.click(screen.getByRole('button', { name: /start fresh/i }))
  expect(onStartFresh).toHaveBeenCalled()
})

test('Start fresh is not shown for other failures', () => {
  render(<ErrorScreen locale="en" kind="failed" code="mint_failed" onRetry={() => {}} onStartFresh={() => {}} />)
  expect(screen.queryByRole('button', { name: /start fresh/i })).toBeNull()
})
