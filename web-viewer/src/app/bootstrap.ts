/// <reference types="vite/client" />
import type { Runtime } from '../renderer/types'
import type { Theme } from './theme'

export const VIEWER_ID = 'behaverse-web-viewer'
export const VIEWER_VERSION = 'v26.0612'

export type Params = { deploymentId: string | null; locale: string | null; vsBaseUrl: string; fixture: string | null; theme: string | null }

export function parseParams(search: string): Params {
  const q = new URLSearchParams(search)
  return {
    deploymentId: q.get('deployment'),
    locale: q.get('locale'),
    vsBaseUrl: q.get('viewer_url') ?? import.meta.env.VITE_VS_BASE_URL ?? 'http://localhost:8001',
    fixture: q.get('fixture'),
    theme: q.get('theme'),
  }
}

export type MintOk = { ok: true; session_id: string; session_token: string; agent_id: string; session_index: number; runtime: Runtime; theme: Theme; ephemeral: boolean }
export type MintErr = { ok: false; kind: 'invalid_link' | 'not_open' | 'closed' | 'failed'; code: string }
export type MintResult = MintOk | MintErr

const KIND_BY_STATUS: Record<number, MintErr['kind']> = { 404: 'invalid_link', 409: 'not_open', 410: 'closed' }

export async function mintSession(vsBaseUrl: string, deploymentId: string, locale: string | null): Promise<MintResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/sessions/new`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deployment_id: deploymentId, viewer_id: VIEWER_ID, viewer_version: VIEWER_VERSION,
        ...(locale ? { locale } : {}),
      }),
    })
  } catch {
    return { ok: false, kind: 'failed', code: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, session_id: body.session_id, session_token: body.session_token, agent_id: body.agent_id, session_index: body.session_index, runtime: body.runtime, theme: body.theme ?? null, ephemeral: body.ephemeral ?? false }
  }
  const code = await resp.json().then((b) => b?.error?.code ?? String(resp.status)).catch(() => String(resp.status))
  return { ok: false, kind: KIND_BY_STATUS[resp.status] ?? 'failed', code }
}

export async function completeSession(vsBaseUrl: string, sessionId: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${vsBaseUrl}/v1/sessions/${sessionId}/complete`, {
      method: 'POST', headers: { authorization: `Bearer ${token}` },
    })
    return r.ok
  } catch {
    return false
  }
}

export type SessionState =
  | { kind: 'ok'; status: string; lastActiveLocale: string; agentId: string; sessionIndex: number }
  | { kind: 'ephemeral' } | { kind: 'invalid' } | { kind: 'network' }

const authGet = (vs: string, path: string, token: string) =>
  fetch(`${vs}/v1/sessions/${path}`, { headers: { authorization: `Bearer ${token}` } })

export async function getSession(vs: string, id: string, token: string): Promise<SessionState> {
  let r: Response
  try { r = await authGet(vs, id, token) } catch { return { kind: 'network' } }
  if (r.status === 409) return { kind: 'ephemeral' }
  if (r.status === 401 || r.status === 404) return { kind: 'invalid' }
  if (!r.ok) return { kind: 'network' }
  const b = await r.json()
  return { kind: 'ok', status: String(b.status), lastActiveLocale: String(b.last_active_locale ?? 'en'),
           agentId: String(b.agent_id ?? 'agent_resumed'), sessionIndex: Number(b.session_index ?? 1) }
}

export async function getRuntime(vs: string, id: string, token: string): Promise<Runtime | null> {
  try { const r = await authGet(vs, `${id}/runtime`, token); return r.ok ? ((await r.json()) as Runtime) : null }
  catch { return null }
}

export async function switchLocale(vs: string, id: string, token: string, locale: string): Promise<Runtime | null> {
  try {
    const r = await fetch(`${vs}/v1/sessions/${id}/locale`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ locale }),
    })
    return r.ok ? ((await r.json()).runtime as Runtime) : null
  } catch { return null }
}
