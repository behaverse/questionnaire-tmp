export type User = { id: string; email: string; display_name: string; email_verified: boolean; roles: string[] }
export type Tokens = { access: string; refresh: string; expiresIn: number }
export type LoginResult = { ok: true; tokens: Tokens } | { ok: false; error: 'invalid_credentials' | 'network' }
export type RefreshResult = { ok: true; tokens: Tokens } | { ok: false; error: 'expired' | 'network' }

const AUDIENCE = 'questionnaire-apps'
const JSON_HEADERS = { 'content-type': 'application/json' }

function tokensOf(body: { access_token: string; refresh_token: string; expires_in: number }): Tokens {
  return { access: body.access_token, refresh: body.refresh_token, expiresIn: body.expires_in }
}

export async function login(identityBaseUrl: string, email: string, password: string): Promise<LoginResult> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/login`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ email, password, audience: AUDIENCE }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, tokens: tokensOf(await resp.json()) }
  if (resp.status === 401) return { ok: false, error: 'invalid_credentials' }
  return { ok: false, error: 'network' }
}

export async function refresh(identityBaseUrl: string, refreshToken: string): Promise<RefreshResult> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/refresh`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, tokens: tokensOf(await resp.json()) }
  if (resp.status === 401) return { ok: false, error: 'expired' }
  return { ok: false, error: 'network' }
}

export async function logout(identityBaseUrl: string, refreshToken: string): Promise<void> {
  try {
    await fetch(`${identityBaseUrl}/v1/auth/logout`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    /* best-effort */
  }
}

export async function fetchMe(identityBaseUrl: string, access: string): Promise<{ ok: true; user: User } | { ok: false }> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/me`, { headers: { authorization: `Bearer ${access}` } })
  } catch {
    return { ok: false }
  }
  if (resp.ok) return { ok: true, user: await resp.json() }
  return { ok: false }
}

export async function register(
  identityBaseUrl: string, email: string, password: string, displayName: string,
): Promise<{ ok: true } | { ok: false; error: 'email_in_use' | 'invalid' | 'network' }> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/register`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ email, password, display_name: displayName, audience: AUDIENCE }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true }
  if (resp.status === 409) return { ok: false, error: 'email_in_use' }
  if (resp.status === 422) return { ok: false, error: 'invalid' }
  return { ok: false, error: 'network' }
}
