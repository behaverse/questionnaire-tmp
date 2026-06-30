import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from '@behaverse/participant-session'
import { MyDataView } from './MyDataView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function authed(sessions: unknown[]) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

function renderView() {
  return render(<SessionProvider identityBaseUrl="http://id"><MyDataView /></SessionProvider>)
}

test('authed: lists the participant sessions + a download button', async () => {
  authed([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v26.0101', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  renderView()
  expect(await screen.findByText(/qst_x/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
})

test('authed: empty state when no sessions', async () => {
  authed([])
  renderView()
  expect(await screen.findByText(/no completed questionnaires yet/i)).toBeInTheDocument()
})

test('anon: shows a Log in prompt linking to /account', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderView()
  const link = await screen.findByRole('link', { name: /log in/i })
  expect(link.getAttribute('href')).toBe('/account')
})

test('authed: shows a download-xAPI button', async () => {
  authed([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v1', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  renderView()
  expect(await screen.findByRole('button', { name: /download my activity/i })).toBeInTheDocument()
})

test('renders a score-progression chart for a questionnaire with >=2 scored attempts', async () => {
  authed([
    { session_id: 'a', instrument_id: 'qst_phq9', instrument_version: 'v1', deployment_id: 'd',
      status: 'submitted', session_index: 2, started_at: null, completed_at: null,
      submitted_at: '2026-02-01', score_display: [{ id: 'sc', name: 'PHQ-9 total', value: 8 }] },
    { session_id: 'b', instrument_id: 'qst_phq9', instrument_version: 'v1', deployment_id: 'd',
      status: 'submitted', session_index: 1, started_at: null, completed_at: null,
      submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'PHQ-9 total', value: 12 }] },
  ])
  renderView()
  expect(await screen.findByRole('img', { name: /phq-9 total over time/i })).toBeInTheDocument()
})
