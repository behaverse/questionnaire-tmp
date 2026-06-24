import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordView } from './ResetPasswordView'

beforeEach(() => { vi.restoreAllMocks(); window.history.pushState(null, '', '/reset-password') })

test('no token: requesting a reset shows the generic accepted message + posts the email', async () => {
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'accepted' }), { status: 202 }))
  vi.stubGlobal('fetch', f)
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
  expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/request-password-reset'))).toBe(true)
})

test('with token: setting a new password succeeds', async () => {
  window.history.pushState(null, '', '/reset-password?token=tok')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword9')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/password reset/i)).toBeInTheDocument()
})

test('with token: an invalid/expired token shows the error', async () => {
  window.history.pushState(null, '', '/reset-password?token=bad')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword9')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})

test('with token: a short new password is rejected before any request', async () => {
  window.history.pushState(null, '', '/reset-password?token=tok')
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/reset-password'))).toBe(false)
})
