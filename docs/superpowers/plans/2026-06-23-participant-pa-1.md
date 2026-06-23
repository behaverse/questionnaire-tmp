# PA-1 — Participant session foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the participant web app a shared, persistent session so login survives page refreshes and return visits, with a working logout — rewired through the runner, my-data, and catalogue pages.

**Architecture:** A new `web-viewer/src/session/` module: `storage` (localStorage refresh token) + `client` (typed Identity calls) + `authFetch` (Bearer-injecting fetch with single-flight refresh-on-401) + `SessionProvider`/`useSession` (React context). Existing pages are rewired to consume the session instead of holding ad-hoc in-memory tokens. Identity service is unchanged.

**Tech Stack:** React 19 / TypeScript / Vite / vitest (`vi.stubGlobal('fetch', …)`), `@testing-library/react`. Browser `localStorage`.

## Global Constraints

- **Refresh token in `localStorage`** under the single key `behaverse.participant.refresh`. The **access token is held in memory only** (never persisted).
- Identity (cross-origin, no cookies) — exact contracts:
  - `POST {id}/v1/auth/login` body `{email,password,audience:"questionnaire-apps"}` → `{access_token,refresh_token,expires_in,token_type}`; `401` on bad creds.
  - `POST {id}/v1/auth/refresh` body `{refresh_token}` → same shape (**rotates** the refresh token); `401` on reuse/expired.
  - `POST {id}/v1/auth/logout` body `{refresh_token}` → `204` (best-effort; ignore failures).
  - `GET {id}/v1/auth/me` with `Authorization: Bearer <access>` → `{id,email,display_name,email_verified,roles}`.
- The audience constant is `"questionnaire-apps"`.
- **Silent refresh** triggers: app boot (if a stored refresh token exists) and on any `401` from `authFetch`. **Single-flight** — concurrent 401s share one refresh. No proactive timer.
- **Logout = this session only** (`POST /logout {refresh_token}`); clear localStorage + memory even if the network call fails.
- Browsing stays public; login is shown only where needed (authenticated deployment in the runner; my-data when anon). When authed, a minimal "Signed in as <email> · Log out" strip appears on the catalogue + my-data.
- Rewire, don't rewrite. No `identity-service/` change. Out of scope: register UI, full nav shell, account screens, httpOnly cookies, multi-tab sync.
- Run a single test: `cd web-viewer && npm test -- <path-substr>`. Full suite + build: `cd web-viewer && npm test && npm run build`. The branch already carries the pre-PA-1 UI redesign as its baseline.
- Spec: `docs/superpowers/specs/2026-06-23-participant-pa-1-design.md`.

---

### Task 1: `session/storage.ts` — localStorage refresh-token wrapper

**Files:**
- Create: `web-viewer/src/session/storage.ts`
- Create: `web-viewer/src/session/storage.test.ts`

**Interfaces:**
- Produces: `loadRefreshToken(): string | null`, `saveRefreshToken(t: string): void`, `clearRefreshToken(): void`.

- [ ] **Step 1: Write the failing test** (`storage.test.ts`)

```typescript
import { test, expect, beforeEach } from 'vitest'
import { loadRefreshToken, saveRefreshToken, clearRefreshToken } from './storage'

beforeEach(() => localStorage.clear())

test('save then load round-trips the token', () => {
  saveRefreshToken('rt-123')
  expect(loadRefreshToken()).toBe('rt-123')
})

test('load returns null when nothing stored', () => {
  expect(loadRefreshToken()).toBeNull()
})

test('clear removes the token', () => {
  saveRefreshToken('rt-123')
  clearRefreshToken()
  expect(loadRefreshToken()).toBeNull()
})

test('tolerates localStorage throwing (private mode)', () => {
  const orig = Storage.prototype.getItem
  Storage.prototype.getItem = () => { throw new Error('blocked') }
  expect(loadRefreshToken()).toBeNull()
  Storage.prototype.getItem = orig
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/storage`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `session/storage.ts`**

```typescript
const KEY = 'behaverse.participant.refresh'

export function loadRefreshToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveRefreshToken(t: string): void {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* private mode: session works, just won't persist */
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/storage`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/storage.ts web-viewer/src/session/storage.test.ts
git commit -m "feat(web-viewer): session/storage — localStorage refresh-token wrapper"
```

---

### Task 2: `session/client.ts` — typed Identity calls

**Files:**
- Create: `web-viewer/src/session/client.ts`
- Create: `web-viewer/src/session/client.test.ts`

**Interfaces:**
- Produces: types `User`, `Tokens`, `LoginResult`, `RefreshResult`; `login(identityBaseUrl,email,password)`, `refresh(identityBaseUrl,refreshToken)`, `logout(identityBaseUrl,refreshToken)`, `fetchMe(identityBaseUrl,access)`.

- [ ] **Step 1: Write the failing test** (`client.test.ts`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { login, refresh, logout, fetchMe } from './client'

beforeEach(() => vi.restoreAllMocks())

function stub(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

test('login posts credentials + audience and returns tokens', async () => {
  const f = stub(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' })
  vi.stubGlobal('fetch', f)
  const r = await login('http://id', 'a@e.com', 'pw')
  expect(r).toEqual({ ok: true, tokens: { access: 'AT', refresh: 'RT', expiresIn: 900 } })
  const [url, init] = f.mock.calls[0]
  expect(url).toBe('http://id/v1/auth/login')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'pw', audience: 'questionnaire-apps' })
})

test('login maps 401 to invalid_credentials', async () => {
  vi.stubGlobal('fetch', stub(401, { error: { code: 'bad' } }))
  expect(await login('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'invalid_credentials' })
})

test('login maps a thrown fetch to network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await login('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'network' })
})

test('refresh posts the refresh token and returns the rotated tokens', async () => {
  const f = stub(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 900, token_type: 'Bearer' })
  vi.stubGlobal('fetch', f)
  const r = await refresh('http://id', 'RT')
  expect(r).toEqual({ ok: true, tokens: { access: 'AT2', refresh: 'RT2', expiresIn: 900 } })
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ refresh_token: 'RT' })
})

test('refresh maps 401 to expired', async () => {
  vi.stubGlobal('fetch', stub(401, { error: { code: 'refresh_reuse' } }))
  expect(await refresh('http://id', 'RT')).toEqual({ ok: false, error: 'expired' })
})

test('logout posts the refresh token (best-effort, never throws)', async () => {
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  await logout('http://id', 'RT')
  expect(f.mock.calls[0][0]).toBe('http://id/v1/auth/logout')
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ refresh_token: 'RT' })
})

test('logout swallows a network error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  await expect(logout('http://id', 'RT')).resolves.toBeUndefined()
})

test('fetchMe sends Bearer and parses the user', async () => {
  const user = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }
  const f = stub(200, user)
  vi.stubGlobal('fetch', f)
  const r = await fetchMe('http://id', 'AT')
  expect(r).toEqual({ ok: true, user })
  expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer AT' })
})

test('fetchMe returns ok:false on 401', async () => {
  vi.stubGlobal('fetch', stub(401, {}))
  expect(await fetchMe('http://id', 'AT')).toEqual({ ok: false })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `session/client.ts`**

```typescript
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/client.ts web-viewer/src/session/client.test.ts
git commit -m "feat(web-viewer): session/client — typed Identity login/refresh/logout/me"
```

---

### Task 3: `session/authFetch.ts` — Bearer fetch with single-flight refresh

**Files:**
- Create: `web-viewer/src/session/authFetch.ts`
- Create: `web-viewer/src/session/authFetch.test.ts`

**Interfaces:**
- Produces: `type AuthFetch = (input: string, init?: RequestInit) => Promise<Response>`; `makeAuthFetch(getAccess: () => string | null, doRefresh: () => Promise<string | null>): AuthFetch`.

- [ ] **Step 1: Write the failing test** (`authFetch.test.ts`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { makeAuthFetch } from './authFetch'

beforeEach(() => vi.restoreAllMocks())

test('injects the Bearer access token', async () => {
  const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => 'AT', async () => 'AT')
  await af('http://vs/x')
  expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer AT' })
})

test('on 401 refreshes once and retries with the new token', async () => {
  let access = 'OLD'
  const f = vi.fn(async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>).authorization
    return new Response('{}', { status: auth === 'Bearer NEW' ? 200 : 401 })
  })
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => access, async () => { access = 'NEW'; return 'NEW' })
  const resp = await af('http://vs/x')
  expect(resp.status).toBe(200)
  expect(f).toHaveBeenCalledTimes(2)
})

test('two concurrent 401s trigger exactly one refresh (single-flight)', async () => {
  let access = 'OLD'
  const f = vi.fn(async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>).authorization
    return new Response('{}', { status: auth === 'Bearer NEW' ? 200 : 401 })
  })
  vi.stubGlobal('fetch', f)
  const doRefresh = vi.fn(async () => { access = 'NEW'; return 'NEW' })
  const af = makeAuthFetch(() => access, doRefresh)
  const [a, b] = await Promise.all([af('http://vs/a'), af('http://vs/b')])
  expect(a.status).toBe(200); expect(b.status).toBe(200)
  expect(doRefresh).toHaveBeenCalledTimes(1)
})

test('returns the 401 when refresh fails', async () => {
  const f = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
  vi.stubGlobal('fetch', f)
  const af = makeAuthFetch(() => 'OLD', async () => null)
  const resp = await af('http://vs/x')
  expect(resp.status).toBe(401)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/authFetch`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `session/authFetch.ts`**

```typescript
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/authFetch`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/authFetch.ts web-viewer/src/session/authFetch.test.ts
git commit -m "feat(web-viewer): session/authFetch — Bearer fetch + single-flight refresh-on-401"
```

---

### Task 4: `session/SessionProvider.tsx` — the session context

**Files:**
- Create: `web-viewer/src/session/SessionProvider.tsx`
- Create: `web-viewer/src/session/SessionProvider.test.tsx`

**Interfaces:**
- Consumes: `storage` (T1), `client` (T2), `makeAuthFetch` (T3).
- Produces: `type SessionStatus = 'loading'|'authed'|'anon'`; `type Session = { status, user: User|null, accessToken: string|null, login(email,password): Promise<{ok:true}|{ok:false,error:'invalid_credentials'|'network'}>, logout(): Promise<void>, authFetch: AuthFetch }`; `<SessionProvider identityBaseUrl={…}>`; `useSession(): Session`.

- [ ] **Step 1: Write the failing test** (`SessionProvider.test.tsx`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider, useSession } from './SessionProvider'
import { saveRefreshToken, loadRefreshToken } from './storage'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }
const TOKENS = (n: string) => ({ access_token: `AT${n}`, refresh_token: `RT${n}`, expires_in: 900, token_type: 'Bearer' })

function Probe() {
  const s = useSession()
  return (
    <div>
      <span data-testid="status">{s.status}</span>
      <span data-testid="email">{s.user?.email ?? ''}</span>
      <button onClick={() => void s.login('a@e.com', 'pw')}>do-login</button>
      <button onClick={() => void s.logout()}>do-logout</button>
    </div>
  )
}

function routeFetch(handlers: Record<string, (init?: RequestInit) => Response>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const key = Object.keys(handlers).find((k) => (url as string).endsWith(k))
    return key ? handlers[key](init) : new Response('{}', { status: 404 })
  }))
}

test('boot with no stored token settles to anon', async () => {
  routeFetch({})
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
})

test('boot with a stored refresh token restores the session (come back later)', async () => {
  saveRefreshToken('RT0')
  routeFetch({
    '/v1/auth/refresh': () => new Response(JSON.stringify(TOKENS('1')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  expect(screen.getByTestId('email').textContent).toBe('a@e.com')
  expect(loadRefreshToken()).toBe('RT1') // rotated token persisted
})

test('login authenticates and persists the refresh token', async () => {
  routeFetch({
    '/v1/auth/login': () => new Response(JSON.stringify(TOKENS('9')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  await userEvent.click(screen.getByText('do-login'))
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  expect(loadRefreshToken()).toBe('RT9')
})

test('a fresh provider with the same localStorage stays logged in (reload)', async () => {
  saveRefreshToken('RT0')
  routeFetch({
    '/v1/auth/refresh': () => new Response(JSON.stringify(TOKENS('1')), { status: 200 }),
    '/v1/auth/me': () => new Response(JSON.stringify(ME), { status: 200 }),
  })
  const { unmount } = render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  unmount()
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
})

test('logout revokes, clears storage, and goes anon', async () => {
  saveRefreshToken('RT0')
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(url as string)
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify(TOKENS('1')), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/auth/logout')) return new Response(null, { status: 204 })
    return new Response('{}', { status: 404 })
  }))
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authed'))
  await userEvent.click(screen.getByText('do-logout'))
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  expect(calls.some((u) => u.endsWith('/v1/auth/logout'))).toBe(true)
  expect(loadRefreshToken()).toBeNull()
})

test('boot refresh failure clears storage and goes anon', async () => {
  saveRefreshToken('RT-bad')
  routeFetch({ '/v1/auth/refresh': () => new Response(JSON.stringify({ error: { code: 'refresh_reuse' } }), { status: 401 }) })
  render(<SessionProvider identityBaseUrl="http://id"><Probe /></SessionProvider>)
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('anon'))
  expect(loadRefreshToken()).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/SessionProvider`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `session/SessionProvider.tsx`**

```tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadRefreshToken, saveRefreshToken, clearRefreshToken } from './storage'
import * as client from './client'
import type { User } from './client'
import { makeAuthFetch, type AuthFetch } from './authFetch'

export type SessionStatus = 'loading' | 'authed' | 'anon'
export type Session = {
  status: SessionStatus
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: 'invalid_credentials' | 'network' }>
  logout: () => Promise<void>
  authFetch: AuthFetch
}

const Ctx = createContext<Session | null>(null)
export function useSession(): Session {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSession must be used within <SessionProvider>')
  return s
}

export function SessionProvider({ identityBaseUrl, children }: { identityBaseUrl: string; children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const accessRef = useRef<string | null>(null)
  const booted = useRef(false)

  function setAccess(t: string | null) { accessRef.current = t; setAccessToken(t) }

  async function adopt(tokens: client.Tokens): Promise<boolean> {
    saveRefreshToken(tokens.refresh)
    setAccess(tokens.access)
    const me = await client.fetchMe(identityBaseUrl, tokens.access)
    if (!me.ok) return false
    setUser(me.user)
    return true
  }

  function reset() {
    clearRefreshToken(); setAccess(null); setUser(null); setStatus('anon')
  }

  // Single-flight refresh used by authFetch and boot.
  async function doRefresh(): Promise<string | null> {
    const rt = loadRefreshToken()
    if (!rt) { reset(); return null }
    const r = await client.refresh(identityBaseUrl, rt)
    if (!r.ok) { reset(); return null }
    saveRefreshToken(r.tokens.refresh)
    setAccess(r.tokens.access)
    return r.tokens.access
  }

  const authFetchRef = useRef<AuthFetch>(makeAuthFetch(() => accessRef.current, doRefresh))

  useEffect(() => {
    if (booted.current) return // StrictMode double-invoke guard
    booted.current = true
    void (async () => {
      const rt = loadRefreshToken()
      if (!rt) { setStatus('anon'); return }
      const r = await client.refresh(identityBaseUrl, rt)
      if (r.ok && (await adopt(r.tokens))) setStatus('authed')
      else reset()
    })()
  }, [identityBaseUrl])

  async function login(email: string, password: string) {
    const r = await client.login(identityBaseUrl, email, password)
    if (!r.ok) return r
    if (await adopt(r.tokens)) { setStatus('authed'); return { ok: true as const } }
    reset(); return { ok: false as const, error: 'network' as const }
  }

  async function logout() {
    const rt = loadRefreshToken()
    if (rt) await client.logout(identityBaseUrl, rt)
    reset()
  }

  const value: Session = { status, user, accessToken, login, logout, authFetch: authFetchRef.current }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/SessionProvider`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/SessionProvider.tsx web-viewer/src/session/SessionProvider.test.tsx
git commit -m "feat(web-viewer): SessionProvider — persistent login, refresh, logout context"
```

---

### Task 5: Wrap entries + rewire my-data + catalogue strip

**Files:**
- Create: `web-viewer/src/session/SessionStrip.tsx`
- Modify: `web-viewer/src/main.tsx`, `web-viewer/src/mydata/main.tsx`
- Modify: `web-viewer/src/mydata/client.ts`, `web-viewer/src/mydata/MyDataApp.tsx`, `web-viewer/src/mydata/MyDataApp.test.tsx`
- Modify: `web-viewer/src/home/HomeApp.tsx`

**Interfaces:**
- Consumes: `SessionProvider`, `useSession`, `AuthFetch` (T4).
- Produces: `<SessionStrip/>`; `fetchMySessions(vsBaseUrl, authFetch)`, `downloadMyData(vsBaseUrl, authFetch)` (signature change: token → authFetch).

- [ ] **Step 1: Write the failing test** — update `mydata/MyDataApp.test.tsx` to drive login through the provider. Replace the file's body with:

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '../session/SessionProvider'
import { MyDataApp } from './MyDataApp'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function stubFlow(sessions: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

function renderApp() {
  return render(<SessionProvider identityBaseUrl="http://id"><MyDataApp /></SessionProvider>)
}

test('logs in then lists the participant sessions', async () => {
  stubFlow([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v26.0101', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  renderApp()
  await userEvent.type(await screen.findByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/qst_x/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
})

test('shows an empty state when there are no sessions', async () => {
  stubFlow([])
  renderApp()
  await userEvent.type(await screen.findByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/no completed questionnaires yet/i)).toBeInTheDocument()
})

test('restores the session on boot and shows a Log out control', async () => {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions: [] }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  renderApp()
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- mydata/MyDataApp`
Expected: FAIL (MyDataApp not wrapped/rewired; no Log out control).

- [ ] **Step 3: Create `session/SessionStrip.tsx`** (shared minimal logged-in strip)

```tsx
import { useSession } from './SessionProvider'

export function SessionStrip() {
  const s = useSession()
  if (s.status !== 'authed' || !s.user) return null
  return (
    <div className="mb-6 flex items-center justify-end gap-3 text-sm text-zinc-500">
      <span>Signed in as <span className="font-medium text-zinc-700">{s.user.email}</span></span>
      <button
        onClick={() => void s.logout()}
        className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800"
      >
        Log out
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Change `mydata/client.ts` to take an `AuthFetch`**

Replace the two function signatures + bodies (keep the `MySession`/`SessionsResult` types):

```typescript
import type { AuthFetch } from '../session/authFetch'

export async function fetchMySessions(vsBaseUrl: string, authFetch: AuthFetch): Promise<SessionsResult> {
  let resp: Response
  try {
    resp = await authFetch(`${vsBaseUrl}/v1/me/sessions`)
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, sessions: (await resp.json()).sessions ?? [] }
  if (resp.status === 401) return { ok: false, error: 'unauthorized' }
  return { ok: false, error: 'network' }
}

export async function downloadMyData(vsBaseUrl: string, authFetch: AuthFetch): Promise<void> {
  const resp = await authFetch(`${vsBaseUrl}/v1/me/responses.csv`)
  if (!resp.ok) throw new Error(`download failed: ${resp.status}`)
  const blob = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl; a.download = 'my_responses.csv'
    document.body.appendChild(a); a.click(); a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
```

- [ ] **Step 5: Rewire `mydata/MyDataApp.tsx` onto the session.** Replace its top imports + the component's auth/state with the session. Keep the existing card/skeleton/empty-state JSX (`SessionRow`, `Skeleton`, `StatusBadge`, `fmtDate`). New control flow:

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { LoginView } from '../app/chrome/LoginView'
import { useSession } from '../session/SessionProvider'
import { SessionStrip } from '../session/SessionStrip'
import { fetchMySessions, downloadMyData, type MySession } from './client'

// ... keep StatusBadge, fmtDate, SessionRow, Skeleton exactly as they are ...

export function MyDataApp() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (session.status !== 'authed') return
    void (async () => {
      const list = await fetchMySessions(params.vsBaseUrl, session.authFetch)
      setLoaded(true)
      if (list.ok) setSessions(list.sessions)
    })()
  }, [session.status, params.vsBaseUrl, session.authFetch])

  async function handleLogin(email: string, password: string) {
    setBusy(true); setLoginErr(null)
    const res = await session.login(email, password)
    setBusy(false)
    if (!res.ok) setLoginErr(res.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again')
  }

  if (session.status === 'loading') return null
  if (session.status === 'anon') return <LoginView onSubmit={handleLogin} error={loginErr} busy={busy} />

  async function handleDownload() {
    setDownloading(true)
    try { await downloadMyData(params.vsBaseUrl, session.authFetch) }
    catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-theme text-zinc-900 antialiased">
      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
        <SessionStrip />
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">My data</h1>
          <p className="mt-2 text-base text-zinc-500">The questionnaires you've completed. Download a copy of your responses anytime.</p>
        </header>
        {!loaded ? (
          <ul className="space-y-4"><Skeleton /><Skeleton /></ul>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
            <p className="text-base font-medium text-zinc-700">No completed questionnaires yet.</p>
          </div>
        ) : (
          <ul className="space-y-4">{sessions.map((s) => <SessionRow key={s.session_id} s={s} />)}</ul>
        )}
        {loaded && sessions.length > 0 ? (
          <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">Export your responses</div>
              <div className="mt-0.5 text-sm text-zinc-500">A CSV of every answer you've submitted.</div>
            </div>
            <button onClick={() => void handleDownload()} disabled={downloading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
              {downloading ? 'Preparing…' : 'Download my data (CSV)'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Wrap the entries in `SessionProvider`.** `mydata/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client'
import { MyDataApp } from './MyDataApp'
import { SessionProvider } from '../session/SessionProvider'
import { parseParams } from '../app/bootstrap'
import '../index.css'

const { identityBaseUrl } = parseParams(window.location.search)
createRoot(document.getElementById('mydata-root')!).render(
  <SessionProvider identityBaseUrl={identityBaseUrl}><MyDataApp /></SessionProvider>,
)
```

And `src/main.tsx` — wrap the existing App/HomeApp switch:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { HomeApp } from './home/HomeApp'
import { parseParams } from './app/bootstrap'
import { SessionProvider } from './session/SessionProvider'

const params = parseParams(window.location.search)
const runQuestionnaire = Boolean(params.deploymentId || params.invite || params.fixture)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider identityBaseUrl={params.identityBaseUrl}>
      {runQuestionnaire ? <App /> : <HomeApp />}
    </SessionProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
```

- [ ] **Step 7: Add the strip to `home/HomeApp.tsx`.** Import `SessionStrip` and render it as the first child inside the inner container `<div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">`:

```tsx
import { SessionStrip } from '../session/SessionStrip'
// ...first child inside the inner container:
        <SessionStrip />
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- "mydata/MyDataApp" "home/HomeApp"`
Expected: all pass (3 MyDataApp + the existing HomeApp tests).

- [ ] **Step 9: Commit**

```bash
git add web-viewer/src/session/SessionStrip.tsx web-viewer/src/main.tsx web-viewer/src/mydata web-viewer/src/home/HomeApp.tsx
git commit -m "feat(web-viewer): rewire my-data + catalogue onto the session; SessionStrip logout"
```

---

### Task 6: Rewire the runner (`App.tsx`) onto the session

**Files:**
- Modify: `web-viewer/src/app/App.tsx`
- Delete: `web-viewer/src/app/auth.ts`, `web-viewer/src/app/auth.test.ts`
- Test: `web-viewer/src/app/App.test.tsx` (existing authed-boot test — confirm/adjust)

**Interfaces:**
- Consumes: `useSession` (T4).

- [ ] **Step 1: Wrap every `App` render in a provider + clear storage.** `App.test.tsx` renders `<App />` in many tests; once `App` calls `useSession()`, an unwrapped render throws `useSession must be used within <SessionProvider>`. So introduce a shared helper and use it everywhere:

```tsx
import { SessionProvider } from '../session/SessionProvider'
function renderApp() {
  return render(<SessionProvider identityBaseUrl="http://id"><App /></SessionProvider>)
}
```

Replace **all** `render(<App />)` calls with `renderApp()`. Add `localStorage.clear()` to the file's `beforeEach` (so anonymous tests boot to `anon` — with no stored token the provider makes no auth calls, so those tests' stubs are unchanged and behavior is identical to today).

For the **authenticated-boot** test specifically (sets `?deployment=dpl_auth`, expects a `/log in/i` button, logs in, asserts two `/v1/sessions/new` calls): if its login stub returns only `{ access_token }`, extend it to `{ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }` and add a `/v1/auth/me` → `{ id:'u', email:'a@e.com', display_name:'', email_verified:false, roles:[] }` branch (the session calls `me` after login).

- [ ] **Step 2: Run it to confirm it currently fails after the provider wrap** (App still uses its own token, not the session)

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/App`
Expected: the authed-boot test FAILS (App not yet reading the session) — confirming the rewire is needed.

- [ ] **Step 3: Rewire `App.tsx`.** Make four minimal edits:

(a) Replace the auth import (remove `loginParticipant`), add the session hook:

```tsx
// remove:  import { loginParticipant } from './auth'
import { useSession } from '../session/SessionProvider'
```

(b) Inside the component, add the hook and drop `accessTokenRef`:

```tsx
  const session = useSession()
  // delete:  const accessTokenRef = useRef<string | undefined>(undefined)
```

(c) Gate boot on the session settling, and mint with the session token. Replace the existing boot `useEffect` (the one guarded by `bootStarted`) with:

```tsx
  useEffect(() => {
    if (session.status === 'loading') return
    if (bootStarted.current) return
    bootStarted.current = true
    void runBoot()
  }, [session.status])
```

and in `runBoot`, change the mint call's token argument from `accessTokenRef.current` to `session.accessToken ?? undefined`:

```tsx
    const [evaluator, res] = await Promise.all([evaluatorPromise, mintSession(params.vsBaseUrl, params.deploymentId, params.locale, session.accessToken ?? undefined, params.invite ?? undefined)])
```

(d) Replace `handleLogin` to use the session (it re-boots after login, which re-mints with the now-set `session.accessToken`):

```tsx
  async function handleLogin(email: string, password: string) {
    setLoginBusy(true); setLoginErr(null)
    const res = await session.login(email, password)
    setLoginBusy(false)
    if (!res.ok) { setLoginErr(res.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again'); return }
    setNeedLogin(false)
    bootStarted.current = false
    void runBoot()
  }
```

Leave `needLogin`/`loginErr`/`loginBusy` state and the `if (needLogin) return <LoginView … />` render as-is.

- [ ] **Step 4: Delete the now-unused `auth.ts` + `auth.test.ts`**

```bash
git rm web-viewer/src/app/auth.ts web-viewer/src/app/auth.test.ts
```

(Confirm no other importer: `grep -rn "from './auth'\|from '../app/auth'\|loginParticipant" web-viewer/src` returns nothing.)

- [ ] **Step 5: Run the runner tests**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/App`
Expected: all App tests pass, including the authed-boot flow (now via the session).

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/app/App.tsx web-viewer/src/app/App.test.tsx
git rm --cached web-viewer/src/app/auth.ts web-viewer/src/app/auth.test.ts 2>/dev/null; true
git commit -m "feat(web-viewer): rewire runner onto the shared session; drop ad-hoc auth.ts"
```

---

### Task 7: Full-suite gate + docs

**Files:**
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build (entries `index`, `home`, `mydata`). If a pre-existing test broke because it rendered `<App/>`/`<MyDataApp/>` without a provider, wrap it in `<SessionProvider identityBaseUrl="http://id">…</SessionProvider>` and add `/v1/auth/me` + token-shaped `/v1/auth/login`|`/v1/auth/refresh` branches to its fetch stub. If a failure is unrelated/genuine, STOP and report BLOCKED with output. Capture totals.

- [ ] **Step 2: Update `web-viewer/README.md`** — document the session layer: `src/session/` (storage/client/authFetch/SessionProvider), persistent login via a localStorage refresh token, silent refresh on boot + on 401, logout (revoke + clear), and that the runner/my-data/catalogue consume `useSession()`. Note `VITE_IDENTITY_BASE_URL` already drives the identity base url.

- [ ] **Step 3: Update `web-viewer/FOLLOWUPS.md`** — record PA-1 deferrals: register UI + full nav shell + account/profile/password/verify screens (PA-2/PA-3); httpOnly-cookie hardening; multi-tab storage-event sync; proactive pre-expiry refresh; "log out everywhere"; the runner's mint still uses the raw access token (not authFetch) so a token that expires exactly at mint shows the login screen rather than silently refreshing.

- [ ] **Step 4: Commit**

```bash
git add web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs(web-viewer): document the session layer; record PA-1 followups; PA-1 complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 localStorage refresh + in-memory access → T1 (storage), T4 (provider holds access in memory). ✓
- §2 silent refresh on boot + 401, single-flight → T4 boot effect + `doRefresh`; T3 authFetch single-flight. ✓
- §2 logout this-session (revoke + local clear even on failure) → T2 `logout` best-effort + T4 `logout`/`reset`. ✓
- §2 browse public + minimal strip on catalogue + my-data → T5 `SessionStrip` on HomeApp + MyDataApp. ✓
- §2 rewire not rewrite (runner + my-data) → T5 (my-data), T6 (runner). ✓
- §3 units storage/client/authFetch/provider → T1–T4. ✓
- §4 wrap entries + LoginView reuse → T5 (main.tsx, mydata/main.tsx), T5/T6 keep LoginView props. ✓
- §5 data flow (return visit, expiry, logout) → T4 reload test, T3 401-retry, T4 logout test. ✓
- §6 error handling (reuse/expired→anon, boot network fail→anon, logout fail→clear, single-flight, localStorage throw) → T4 boot-fail test, T1 throw test, T3 single-flight test, T2 logout-swallow test. ✓
- §7 tests enumerated → covered across T1–T6; full gate in T7. ✓
- §8 deliverable (reload stays logged in; logout works; runner+my-data via session; no identity change; suite+build green) → T4 reload test + T7 gate. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit. The App.tsx rewire (T6) names the 4 exact edits with code; T6 Step 1 directs the implementer to the precise existing test to keep green.

**3. Type consistency:** `Tokens{access,refresh,expiresIn}` (T2) consumed by T4 (`adopt`/`doRefresh`). `User` (T2) used by T4 + SessionStrip (T5). `Session{status,user,accessToken,login,logout,authFetch}` (T4) consumed by MyDataApp/SessionStrip (T5) + App (T6). `makeAuthFetch(getAccess,doRefresh)` (T3) used by T4. `AuthFetch` (T3) is the new param type of `fetchMySessions`/`downloadMyData` (T5). `login` returns `{ok:true}|{ok:false,error:'invalid_credentials'|'network'}` (T4) — consumed identically by MyDataApp (T5) + App handleLogin (T6). Storage key `behaverse.participant.refresh` identical in T1 + the T5 boot-restore test. Consistent.

Note for execution: T5 and T6 both add a `SessionProvider` wrapper to tests that render `<MyDataApp/>` / `<App/>`; T7 Step 1 sweeps any remaining un-wrapped render in the full suite (e.g. App.test.tsx anonymous/other tests) and wraps them — additive provider wrapping doesn't change anonymous behavior (no stored token → `anon`, access `null`, mint without auth, exactly as today).
