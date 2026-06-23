import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerifyEmailView } from './VerifyEmailView'

beforeEach(() => { vi.restoreAllMocks(); window.history.pushState(null, '', '/verify-email') })

test('with a valid token: shows verified', async () => {
  window.history.pushState(null, '', '/verify-email?token=tok')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  render(<VerifyEmailView />)
  expect(await screen.findByText(/email verified/i)).toBeInTheDocument()
})

test('with a bad token: shows invalid/expired', async () => {
  window.history.pushState(null, '', '/verify-email?token=bad')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  render(<VerifyEmailView />)
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})

test('with no token: shows invalid', async () => {
  vi.stubGlobal('fetch', vi.fn())
  render(<VerifyEmailView />)
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})
