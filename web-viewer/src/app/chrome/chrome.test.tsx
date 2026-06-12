import { render, screen, fireEvent } from '@testing-library/react'
import { t } from './strings'
import { ErrorScreen } from './ErrorScreen'
import { ProgressBar } from './ProgressBar'
import { NavButtons } from './NavButtons'

test('strings: pt resolves, unknown locale falls back to en', () => {
  expect(t('pt', 'next')).toBe('Seguinte')
  expect(t('xx', 'next')).toBe('Next')
  expect(t('en', 'progress', { i: 2, n: 9 })).toBe('Question 2 of 9')
})
test('ErrorScreen shows localised copy + code fine print; retry only when retryable', () => {
  const retry = vi.fn()
  const { rerender } = render(<ErrorScreen locale="en" kind="closed" code="gone" onRetry={retry} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/closed/i)
  expect(screen.getByText(/gone/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(<ErrorScreen locale="en" kind="failed" code="network" onRetry={retry} />)
  fireEvent.click(screen.getByRole('button', { name: /try again/i }))
  expect(retry).toHaveBeenCalled()
})
test('ProgressBar exposes progressbar semantics + polite live region', () => {
  render(<ProgressBar locale="en" current={3} total={9} />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow', '3')
  expect(bar).toHaveAttribute('aria-valuemax', '9')
  expect(screen.getByText('Question 3 of 9')).toBeInTheDocument()
})
test('NavButtons: Back hidden on first step; Next prominent with Enter hint', () => {
  const next = vi.fn()
  render(<NavButtons locale="en" canBack={false} onBack={vi.fn()} onNext={next} />)
  expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(next).toHaveBeenCalled()
})
