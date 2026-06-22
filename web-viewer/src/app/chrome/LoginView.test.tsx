import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from './LoginView'

test('LoginView submits the entered email and password', async () => {
  const onSubmit = vi.fn()
  render(<LoginView onSubmit={onSubmit} error={null} busy={false} />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(onSubmit).toHaveBeenCalledWith('a@e.com', 'pw')
})

test('LoginView shows an error message', () => {
  render(<LoginView onSubmit={() => {}} error="Invalid email or password" busy={false} />)
  expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
})
