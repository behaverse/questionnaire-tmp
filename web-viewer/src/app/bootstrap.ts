import type { Runtime } from '../renderer/types'
import type { Theme } from './theme'

export const VIEWER_ID = 'behaverse-web-viewer'
export const VIEWER_VERSION = 'v26.0611'

export type Params = { deploymentId: string | null; locale: string | null; vsBaseUrl: string; fixture: string | null }

export function parseParams(search: string): Params {
  const q = new URLSearchParams(search)
  const env = ((import.meta as unknown) as Record<string, unknown>)['env'] as Record<string, string | undefined> | undefined
  return {
    deploymentId: q.get('deployment'),
    locale: q.get('locale'),
    vsBaseUrl: q.get('viewer_url') ?? env?.['VITE_VS_BASE_URL'] ?? 'http://localhost:8001',
    fixture: q.get('fixture'),
  }
}

export type MintOk = { ok: true; session_id: string; session_token: string; runtime: Runtime; theme: Theme }
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
    return { ok: true, session_id: body.session_id, session_token: body.session_token, runtime: body.runtime, theme: body.theme ?? null }
  }
  const code = await resp.json().then((b) => b?.error?.code ?? String(resp.status)).catch(() => String(resp.status))
  return { ok: false, kind: KIND_BY_STATUS[resp.status] ?? 'failed', code }
}
