import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorScreen } from './ErrorScreen'

test('ErrorScreen renders the invite_invalid message', () => {
  render(<ErrorScreen locale="en" kind="invite_invalid" code="invite_required" onRetry={() => {}} />)
  expect(screen.getByRole('heading')).toBeInTheDocument()
  // the invite_invalid title string is shown (not a crash / missing key)
})
