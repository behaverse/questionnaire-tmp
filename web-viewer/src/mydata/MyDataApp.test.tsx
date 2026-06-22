import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyDataApp } from './MyDataApp'

beforeEach(() => { vi.restoreAllMocks() })

function stubFlow(sessions: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 })
    if (url.endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('logs in then lists the participant sessions', async () => {
  stubFlow([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v26.0101', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  render(<MyDataApp />)
  expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/qst_x/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
})

test('shows an empty state when there are no sessions', async () => {
  stubFlow([])
  render(<MyDataApp />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/no completed questionnaires yet/i)).toBeInTheDocument()
})
