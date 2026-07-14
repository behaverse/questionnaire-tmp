import type { AuthFetch } from './authFetch'

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

/** Mint a single-use SSO handoff code (the portal, signed in, calls this to launch the player on
 *  another origin without a re-login). */
export async function mintHandoff(identityBaseUrl: string, access: string): Promise<{ ok: true; code: string } | { ok: false }> {
  try {
    const resp = await fetch(`${identityBaseUrl}/v1/auth/handoff`, {
      method: 'POST', headers: { ...JSON_HEADERS, authorization: `Bearer ${access}` },
    })
    if (!resp.ok) return { ok: false }
    const body = await resp.json()
    return { ok: true, code: body.handoff_code as string }
  } catch {
    return { ok: false }
  }
}

/** Exchange a handoff code (single-use) for this origin's own token pair. */
export async function exchangeHandoff(identityBaseUrl: string, code: string): Promise<{ ok: true; tokens: Tokens } | { ok: false }> {
  try {
    const resp = await fetch(`${identityBaseUrl}/v1/auth/handoff/exchange`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ handoff_code: code }),
    })
    if (!resp.ok) return { ok: false }
    return { ok: true, tokens: tokensOf(await resp.json()) }
  } catch {
    return { ok: false }
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
): Promise<{ ok: true } | { ok: false; error: 'invalid' | 'network' }> {
  // Registration is enumeration-resistant: the server returns a uniform 2xx whether or not the email
  // already exists (never a 409 "email in use"). The caller then logs in with the same credentials —
  // an existing email + wrong password simply fails login with a generic message.
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
  if (resp.status === 422) return { ok: false, error: 'invalid' }
  return { ok: false, error: 'network' }
}

export async function changePassword(
  authFetch: AuthFetch, identityBaseUrl: string, oldPassword: string, newPassword: string,
): Promise<{ ok: true } | { ok: false; error: 'wrong_password' | 'invalid' | 'network' }> {
  let resp: Response
  try {
    resp = await authFetch(`${identityBaseUrl}/v1/auth/change-password`, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true }
  if (resp.status === 403) return { ok: false, error: 'wrong_password' }
  if (resp.status === 422) return { ok: false, error: 'invalid' }
  return { ok: false, error: 'network' }
}

export async function verifyEmail(
  identityBaseUrl: string, token: string,
): Promise<{ ok: true } | { ok: false; error: 'invalid' | 'network' }> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/verify-email`, {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ token }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true }
  if (resp.status === 400) return { ok: false, error: 'invalid' }
  return { ok: false, error: 'network' }
}

export async function requestPasswordReset(
  identityBaseUrl: string, email: string,
): Promise<{ ok: true } | { ok: false; error: 'network' }> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/request-password-reset`, {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  return resp.ok ? { ok: true } : { ok: false, error: 'network' }
}

export async function resetPassword(
  identityBaseUrl: string, token: string, newPassword: string,
): Promise<{ ok: true } | { ok: false; error: 'invalid_token' | 'weak_password' | 'network' }> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/reset-password`, {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ token, new_password: newPassword }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true }
  if (resp.status === 400) return { ok: false, error: 'invalid_token' }
  if (resp.status === 422) return { ok: false, error: 'weak_password' }
  return { ok: false, error: 'network' }
}
