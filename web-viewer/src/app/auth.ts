export type LoginResult = { ok: true; accessToken: string } | { ok: false; error: 'invalid_credentials' | 'network' }

const AUDIENCE = 'questionnaire-apps'

export async function loginParticipant(identityBaseUrl: string, email: string, password: string): Promise<LoginResult> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, audience: AUDIENCE }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, accessToken: body.access_token }
  }
  if (resp.status === 401) return { ok: false, error: 'invalid_credentials' }
  return { ok: false, error: 'network' }
}
