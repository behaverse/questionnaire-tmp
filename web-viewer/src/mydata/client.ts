export type MySession = {
  session_id: string; instrument_id: string; instrument_version: string; deployment_id: string
  status: string; session_index: number
  started_at: string | null; completed_at: string | null; submitted_at: string | null
}
export type SessionsResult = { ok: true; sessions: MySession[] } | { ok: false; error: 'unauthorized' | 'network' }

export async function fetchMySessions(vsBaseUrl: string, token: string): Promise<SessionsResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/me/sessions`, { headers: { authorization: `Bearer ${token}` } })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, sessions: (await resp.json()).sessions ?? [] }
  if (resp.status === 401) return { ok: false, error: 'unauthorized' }
  return { ok: false, error: 'network' }
}

export async function downloadMyData(vsBaseUrl: string, token: string): Promise<void> {
  const resp = await fetch(`${vsBaseUrl}/v1/me/responses.csv`, { headers: { authorization: `Bearer ${token}` } })
  if (!resp.ok) throw new Error(`download failed: ${resp.status}`)
  const blob = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'my_responses.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
