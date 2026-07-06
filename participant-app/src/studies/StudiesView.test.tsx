import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '@behaverse/participant-session'
import { StudiesView } from './StudiesView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

function authed(roles: string[], routes: (url: string, init?: RequestInit) => Response | null) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if (url.endsWith('/v1/auth/me')) return new Response(JSON.stringify({ id: 'u1', email: 'r@e.com', display_name: 'R', email_verified: true, roles }), { status: 200 })
    return routes(url, init) ?? new Response('{}', { status: 200 })
  }))
}

const render_ = () => render(<SessionProvider identityBaseUrl="http://id"><StudiesView /></SessionProvider>)

test('non-researcher sees a gated notice and no data calls', async () => {
  authed([], () => null)
  render_()
  expect(await screen.findByText(/researchers only/i)).toBeInTheDocument()
})

test('researcher: lists sessions and copies a replay link', async () => {
  const clip = vi.fn(async () => {})
  Object.assign(navigator, { clipboard: { writeText: clip } })
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link') && init?.method === 'POST') return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=x' }), { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /copy replay link/i }))
  await waitFor(() => expect(clip).toHaveBeenCalledWith('http://p/?replay=x'))
  expect(await screen.findByText(/copied/i)).toBeInTheDocument()
})

test('researcher: revokes replay links for a session', async () => {
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link/revoke') && init?.method === 'POST') return new Response('{"revoked_at":"x"}', { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /revoke links/i }))
  expect(await screen.findByText(/revoked/i)).toBeInTheDocument()
})

test('researcher: Watch live opens the follow URL', async () => {
  const open = vi.fn()
  vi.stubGlobal('open', open)
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'in_progress', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link') && init?.method === 'POST') return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=enc' }), { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /watch live/i }))
  await waitFor(() => expect(open).toHaveBeenCalledWith('http://p/?replay=enc&follow=1', '_blank', 'noopener'))
})
