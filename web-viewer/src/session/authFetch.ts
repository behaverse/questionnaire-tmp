export type AuthFetch = (input: string, init?: RequestInit) => Promise<Response>

function withAuth(init: RequestInit | undefined, access: string | null): RequestInit {
  if (!access) return init ?? {}
  return { ...init, headers: { ...(init?.headers as Record<string, string> | undefined), authorization: `Bearer ${access}` } }
}

/** A fetch that injects the current access token and, on 401, refreshes once
 *  (single-flight across concurrent calls) then retries the request once. */
export function makeAuthFetch(getAccess: () => string | null, doRefresh: () => Promise<string | null>): AuthFetch {
  let inFlight: Promise<string | null> | null = null

  return async function authFetch(input, init) {
    const resp = await fetch(input, withAuth(init, getAccess()))
    if (resp.status !== 401) return resp

    if (!inFlight) inFlight = doRefresh().finally(() => { inFlight = null })
    const newAccess = await inFlight
    if (!newAccess) return resp
    return fetch(input, withAuth(init, newAccess))
  }
}
