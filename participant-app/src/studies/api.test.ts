import { test, expect, vi } from 'vitest'
import { listDeployments, listSessions, mintReplayLink } from './api'

const af = (impl: (url: string, init?: RequestInit) => Response) =>
  vi.fn(async (url: string, init?: RequestInit) => impl(url, init)) as unknown as import('@behaverse/participant-session').AuthFetch

test('listDeployments returns items', async () => {
  const authFetch = af((url) => {
    expect(url).toBe('http://vs/v1/deployments')
    return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
  })
  expect(await listDeployments('http://vs', authFetch)).toEqual([{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }])
})

test('listSessions hits the deployment sessions endpoint', async () => {
  const authFetch = af((url) => {
    expect(url).toBe('http://vs/v1/deployments/d1/sessions')
    return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
  })
  const rows = await listSessions('http://vs', authFetch, 'd1')
  expect(rows[0].session_id).toBe('s1')
})

test('mintReplayLink POSTs and returns the link', async () => {
  const authFetch = af((url, init) => {
    expect(url).toBe('http://vs/v1/deployments/d1/sessions/s1/replay-link')
    expect(init?.method).toBe('POST')
    return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=x' }), { status: 200 })
  })
  const link = await mintReplayLink('http://vs', authFetch, 'd1', 's1')
  expect(link.replay_url).toBe('http://p/?replay=x')
})

test('a non-ok response throws', async () => {
  const authFetch = af(() => new Response('nope', { status: 403 }))
  await expect(listSessions('http://vs', authFetch, 'd1')).rejects.toThrow(/403/)
})
