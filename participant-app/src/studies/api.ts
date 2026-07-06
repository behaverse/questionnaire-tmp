import type { AuthFetch } from '@behaverse/participant-session'

export type Deployment = { deployment_id: string; questionnaire_ref: string; mode_preset?: string; listed?: boolean; title?: string | null }
export type Session = {
  session_id: string; session_index: number; status: string
  participant_sub: string | null
  started_at: string | null; completed_at: string | null; submitted_at: string | null
}
export type ReplayLink = { token: string; bundle_url: string; replay_url: string | null }

export async function listDeployments(vsBaseUrl: string, authFetch: AuthFetch): Promise<Deployment[]> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments`)
  if (!resp.ok) throw new Error(`deployments ${resp.status}`)
  return (await resp.json()).items ?? []
}

export async function listSessions(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string): Promise<Session[]> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions`)
  if (!resp.ok) throw new Error(`sessions ${resp.status}`)
  return (await resp.json()).sessions ?? []
}

export async function mintReplayLink(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string, sessionId: string): Promise<ReplayLink> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions/${sessionId}/replay-link`, { method: 'POST' })
  if (!resp.ok) throw new Error(`replay-link ${resp.status}`)
  return await resp.json()
}

export async function revokeReplayLinks(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string, sessionId: string): Promise<void> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions/${sessionId}/replay-link/revoke`, { method: 'POST' })
  if (!resp.ok) throw new Error(`revoke ${resp.status}`)
}
