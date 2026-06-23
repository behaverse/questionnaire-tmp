# PA-2 — Register + nav shell + consolidated SPA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the three web-viewer HTML entries into one Participant App SPA with a path router, a persistent nav shell, and an account surface (register auto-logs-in; profile when signed in).

**Architecture:** A new `src/shell/` (custom path router + NavShell + ParticipantApp) and `src/account/` (AccountView). `index.html`/`main.tsx` keeps `SessionProvider` at the root and renders the runner `<App/>` (when `deployment`/`invite`/`fixture` present) or `<ParticipantApp/>` (nav shell + router → Catalogue/MyData/Account). `home.html`/`mydata.html` and their mains are removed; HomeApp/MyDataApp become shell-chromed views.

**Tech Stack:** React 19 / TypeScript / Vite / vitest (`vi.stubGlobal('fetch', …)`) / `@testing-library/react`. No new dependency (custom router via `history` + `useSyncExternalStore`).

## Global Constraints

- **Single SPA, clean path URLs.** Routes: `/` Catalogue, `/my-data` MyData, `/account` Account; unknown → Catalogue. The runner is still selected by `deployment`/`invite`/`fixture` query params in `main.tsx` and rendered full-screen WITHOUT the shell (unchanged).
- **No router dependency** — custom `src/shell/router.tsx`. `navigate(path)` preserves the `viewer_url` + `identity_url` query params (only those two) across client navigations.
- **Register auto-logs-in.** Identity `POST /v1/auth/register` body `{email, password, display_name, audience:"questionnaire-apps"}` → `201` (returns a profile, NOT tokens) → then `session.login(email,password)`. `409`→`email_in_use`, `422`→`invalid` (password < 8), thrown→`network`. Audience constant `"questionnaire-apps"`.
- **NavShell owns the page chrome** (background + a `max-w-2xl` `<main>` container + the header). Views render only their inner content. The old `src/session/SessionStrip.tsx` is removed (the shell replaces it).
- Styling: Tailwind + the zinc palette / `--qv-*` tokens the existing pages use (`bg-zinc-50`, `text-zinc-900`, `border-zinc-200/80`, `font-theme`). Match it.
- `home.html`, `mydata.html`, `src/home/main.tsx`, `src/mydata/main.tsx` deleted; `vite.config.ts` input → `{ main }` (prod) / `{ main, gallery }` (dev). `gallery.html` stays.
- Run a single test: `cd web-viewer && npm test -- <substr>`. Full suite + build: `cd web-viewer && npm test && npm run build`. Tests use `beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })` and wrap session-consuming components in `<SessionProvider identityBaseUrl="http://id">`.
- No `identity-service/` change; no runner (`App.tsx`) change. Out of scope: change-password, email verification, password reset, prod SPA-fallback config.
- Spec: `docs/superpowers/specs/2026-06-23-participant-pa-2-design.md`.

---

### Task 1: `shell/router.tsx` — minimal path router

**Files:**
- Create: `web-viewer/src/shell/router.tsx`
- Create: `web-viewer/src/shell/router.test.tsx`

**Interfaces:**
- Produces: `useRoute(): string`, `navigate(path: string): void`, `<Link to={…} className={…}>…</Link>`.

- [ ] **Step 1: Write the failing test** (`router.test.tsx`)

```tsx
import { test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRoute, navigate, Link } from './router'

beforeEach(() => { window.history.pushState(null, '', '/') })

function Probe() {
  const route = useRoute()
  return (
    <div>
      <span data-testid="route">{route}</span>
      <Link to="/my-data">go-mydata</Link>
    </div>
  )
}

test('useRoute reflects navigate and preserves viewer_url/identity_url', () => {
  window.history.pushState(null, '', '/?viewer_url=http://vs&identity_url=http://id&other=x')
  render(<Probe />)
  navigate('/account')
  expect(screen.getByTestId('route').textContent).toBe('/account')
  expect(window.location.search).toContain('viewer_url=http%3A%2F%2Fvs')
  expect(window.location.search).toContain('identity_url=http%3A%2F%2Fid')
  expect(window.location.search).not.toContain('other=')
})

test('Link click navigates without a full reload', async () => {
  render(<Probe />)
  await userEvent.click(screen.getByText('go-mydata'))
  expect(screen.getByTestId('route').textContent).toBe('/my-data')
})

test('popstate updates the route', () => {
  render(<Probe />)
  navigate('/account')
  window.history.pushState(null, '', '/my-data')
  window.dispatchEvent(new PopStateEvent('popstate'))
  expect(screen.getByTestId('route').textContent).toBe('/my-data')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/router`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `shell/router.tsx`**

```tsx
import { useSyncExternalStore, type ReactNode, type MouseEvent } from 'react'

const listeners = new Set<() => void>()
function notify() { listeners.forEach((l) => l()) }

function preservedSearch(): string {
  const cur = new URLSearchParams(window.location.search)
  const q = new URLSearchParams()
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function navigate(path: string): void {
  window.history.pushState(null, '', path + preservedSearch())
  notify()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => { listeners.delete(cb); window.removeEventListener('popstate', cb) }
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/')
}

export function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} className={className} onClick={onClick}>{children}</a>
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/router`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/shell/router.tsx web-viewer/src/shell/router.test.tsx
git commit -m "feat(web-viewer): shell/router — minimal path router (navigate/useRoute/Link)"
```

---

### Task 2: `session/client.ts` — `register`

**Files:**
- Modify: `web-viewer/src/session/client.ts`
- Modify: `web-viewer/src/session/client.test.ts`

**Interfaces:**
- Produces: `register(identityBaseUrl, email, password, displayName) -> Promise<{ok:true}|{ok:false, error:'email_in_use'|'invalid'|'network'}>`.

- [ ] **Step 1: Add the failing tests** — append to `client.test.ts` (it already imports from `./client`; add `register` to the import):

```typescript
test('register posts the profile fields with audience and returns ok on 201', async () => {
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'u1' }), { status: 201 }))
  vi.stubGlobal('fetch', f)
  const r = await register('http://id', 'a@e.com', 'password1', 'Al')
  expect(r).toEqual({ ok: true })
  const [url, init] = f.mock.calls[0]
  expect(url).toBe('http://id/v1/auth/register')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'password1', display_name: 'Al', audience: 'questionnaire-apps' })
})

test('register maps 409 to email_in_use', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 409 })))
  expect(await register('http://id', 'a@e.com', 'password1', '')).toEqual({ ok: false, error: 'email_in_use' })
})

test('register maps 422 to invalid', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })))
  expect(await register('http://id', 'a@e.com', 'short', '')).toEqual({ ok: false, error: 'invalid' })
})

test('register maps a thrown fetch to network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await register('http://id', 'a@e.com', 'password1', '')).toEqual({ ok: false, error: 'network' })
})
```

Update the import line at the top of `client.test.ts` to include `register`:

```typescript
import { login, refresh, logout, fetchMe, register } from './client'
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: FAIL (`register` not exported).

- [ ] **Step 3: Add `register` to `client.ts`** (after `fetchMe`; reuse the existing `AUDIENCE`/`JSON_HEADERS` constants):

```typescript
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: all pass (9 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/client.ts web-viewer/src/session/client.test.ts
git commit -m "feat(web-viewer): session/client register() — POST /v1/auth/register"
```

---

### Task 3: `shell/NavShell.tsx` — persistent header + page chrome

**Files:**
- Create: `web-viewer/src/shell/NavShell.tsx`
- Create: `web-viewer/src/shell/NavShell.test.tsx`

**Interfaces:**
- Consumes: `useSession` (`src/session/SessionProvider`), `useRoute`/`Link` (Task 1).
- Produces: `<NavShell>{children}</NavShell>` — header + `max-w-2xl` main container.

- [ ] **Step 1: Write the failing test** (`NavShell.test.tsx`)

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '../session/SessionProvider'
import { NavShell } from './NavShell'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); window.history.pushState(null, '', '/') })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function authedFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/auth/logout')) return new Response(null, { status: 204 })
    return new Response('{}', { status: 200 })
  }))
}

function renderShell() {
  return render(<SessionProvider identityBaseUrl="http://id"><NavShell><div>BODY</div></NavShell></SessionProvider>)
}

test('renders the three nav links and the children', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderShell()
  expect(screen.getByRole('link', { name: /questionnaires/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /my data/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /account/i })).toBeInTheDocument()
  expect(screen.getByText('BODY')).toBeInTheDocument()
})

test('anon shows a Log in link, not a Log out button', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderShell()
  await waitFor(() => expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument())
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
})

test('authed shows the email and a working Log out', async () => {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  authedFetch()
  renderShell()
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
  const logout = screen.getByRole('button', { name: /log out/i })
  await userEvent.click(logout)
  await waitFor(() => expect(screen.queryByText(/a@e.com/)).not.toBeInTheDocument())
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/NavShell`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `shell/NavShell.tsx`**

```tsx
import type { ReactNode } from 'react'
import { useSession } from '../session/SessionProvider'
import { useRoute, Link } from './router'

const NAV = [
  { to: '/', label: 'Questionnaires' },
  { to: '/my-data', label: 'My data' },
  { to: '/account', label: 'Account' },
]

export function NavShell({ children }: { children: ReactNode }) {
  const session = useSession()
  const route = useRoute()
  return (
    <div className="min-h-screen bg-zinc-50 font-theme text-zinc-900 antialiased">
      <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-1">
            <span className="mr-2 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden /> Behaverse
            </span>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                  (route === n.to ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800')
                }>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="text-sm">
            {session.status === 'authed' && session.user ? (
              <span className="flex items-center gap-3 text-zinc-500">
                <span className="hidden sm:inline">{session.user.email}</span>
                <button onClick={() => void session.logout()}
                  className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800">
                  Log out
                </button>
              </span>
            ) : session.status === 'anon' ? (
              <Link to="/account" className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800">Log in</Link>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10 sm:py-14">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/NavShell`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/shell/NavShell.tsx web-viewer/src/shell/NavShell.test.tsx
git commit -m "feat(web-viewer): shell/NavShell — header nav + session area + page chrome"
```

---

### Task 4: `account/AccountView.tsx` — login | register (auto-login) + profile

**Files:**
- Create: `web-viewer/src/account/AccountView.tsx`
- Create: `web-viewer/src/account/AccountView.test.tsx`

**Interfaces:**
- Consumes: `useSession` (login/logout/status/user), `register` (Task 2), `parseParams`.

- [ ] **Step 1: Write the failing test** (`AccountView.test.tsx`)

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '../session/SessionProvider'
import { AccountView } from './AccountView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function renderView() {
  return render(<SessionProvider identityBaseUrl="http://id"><AccountView /></SessionProvider>)
}

test('register then auto-login lands on the profile', async () => {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(url as string)
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/register')) return new Response(JSON.stringify({ id: 'u1' }), { status: 201 })
    if ((url as string).endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /sign up|create account|register/i }))
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument()
  expect(calls.some((u) => u.endsWith('/v1/auth/register'))).toBe(true)
  expect(calls.some((u) => u.endsWith('/v1/auth/login'))).toBe(true)
})

test('register with an existing email shows the email-in-use message', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/register')) return new Response('{}', { status: 409 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /sign up|create account|register/i }))
  expect(await screen.findByText(/already registered/i)).toBeInTheDocument()
})

test('a short password is rejected before any request', async () => {
  const f = vi.fn(async (url: string) => new Response('{}', { status: (url as string).endsWith('/v1/auth/refresh') ? 401 : 200 }))
  vi.stubGlobal('fetch', f)
  renderView()
  await userEvent.click(await screen.findByRole('button', { name: /create account/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /sign up|create account|register/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/register'))).toBe(false)
})

test('login works from the login tab', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  renderView()
  await userEvent.type(await screen.findByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password1')
  await userEvent.click(screen.getByRole('button', { name: /^log in$/i }))
  expect(await screen.findByText(/a@e.com/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/AccountView`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `account/AccountView.tsx`**

```tsx
import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { useSession } from '../session/SessionProvider'
import { register } from '../session/client'

const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
const primaryBtn =
  'w-full rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60'

function Profile() {
  const s = useSession()
  if (!s.user) return null
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Email</dt><dd className="font-medium text-zinc-800">{s.user.email}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Name</dt><dd className="font-medium text-zinc-800">{s.user.display_name || '—'}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Roles</dt><dd className="font-medium text-zinc-800">{s.user.roles.join(', ') || '—'}</dd></div>
      </dl>
      {!s.user.email_verified ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Your email isn't verified yet.</p>
      ) : null}
      <button onClick={() => void s.logout()} className={primaryBtn}>Log out</button>
    </div>
  )
}

export function AccountView() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session.status === 'loading') return null
  if (session.status === 'authed') return <Profile />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (mode === 'register') {
      if (password.length < 8) { setErr('Password must be at least 8 characters.'); return }
      setBusy(true)
      const r = await register(params.identityBaseUrl, email, password, displayName)
      if (!r.ok) {
        setBusy(false)
        setErr(r.error === 'email_in_use' ? 'That email is already registered — log in instead.'
          : r.error === 'invalid' ? 'Password must be at least 8 characters.'
          : 'Network error — try again.')
        return
      }
    } else {
      setBusy(true)
    }
    const li = await session.login(email, password)
    setBusy(false)
    if (!li.ok) setErr(li.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again')
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
      <div className="flex rounded-full bg-zinc-100 p-1 text-sm font-medium">
        <button type="button" onClick={() => { setMode('login'); setErr(null) }}
          className={'flex-1 rounded-full px-4 py-1.5 transition ' + (mode === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>Log in</button>
        <button type="button" onClick={() => { setMode('register'); setErr(null) }}
          className={'flex-1 rounded-full px-4 py-1.5 transition ' + (mode === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>Create account</button>
      </div>

      {mode === 'register' ? (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-name">Name</label>
          <input id="acc-name" type="text" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-email">Email</label>
        <input id="acc-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-password">Password</label>
        <input id="acc-password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
      </div>

      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/AccountView`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/account/AccountView.tsx web-viewer/src/account/AccountView.test.tsx
git commit -m "feat(web-viewer): AccountView — login/register (auto-login) + profile"
```

---

### Task 5: Convert HomeApp → CatalogueView and MyDataApp → MyDataView

**Files:**
- Rename: `web-viewer/src/home/HomeApp.tsx` → `web-viewer/src/home/CatalogueView.tsx`; `web-viewer/src/home/HomeApp.test.tsx` → `web-viewer/src/home/CatalogueView.test.tsx`
- Rename: `web-viewer/src/mydata/MyDataApp.tsx` → `web-viewer/src/mydata/MyDataView.tsx`; `web-viewer/src/mydata/MyDataApp.test.tsx` → `web-viewer/src/mydata/MyDataView.test.tsx`

**Interfaces:**
- Consumes: `Link` (Task 1), `useSession`.
- Produces: `CatalogueView` (no session use, no outer chrome), `MyDataView` (no outer chrome; anon → a Link to `/account`).

- [ ] **Step 1: Rename the four files (preserve history)**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer
git mv src/home/HomeApp.tsx src/home/CatalogueView.tsx
git mv src/home/HomeApp.test.tsx src/home/CatalogueView.test.tsx
git mv src/mydata/MyDataApp.tsx src/mydata/MyDataView.tsx
git mv src/mydata/MyDataApp.test.tsx src/mydata/MyDataView.test.tsx
```

- [ ] **Step 2: Rewrite `src/home/CatalogueView.tsx`** — drop the `SessionStrip` import + the outer `min-h-screen`/container divs (the NavShell provides them); export `CatalogueView`. Keep `carry`, `Card`, `Skeleton`, the fetch effect.

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { fetchCatalogue, type CatalogueItem } from './client'

function carry(base: string, extra: Record<string, string>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) q.set(k, v)
  const cur = new URLSearchParams(window.location.search)
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}

function Card({ item }: { item: CatalogueItem }) {
  return (
    <li className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900">{item.title}</h2>
          {item.description ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.description}</p> : null}
        </div>
        <a href={carry('index.html', { deployment: item.deployment_id })}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:self-auto">
          Start
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </li>
  )
}

function Skeleton() {
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex animate-pulse items-center justify-between gap-4">
        <div className="w-full space-y-3">
          <div className="h-4 w-2/5 rounded bg-zinc-200" />
          <div className="h-3 w-3/4 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-24 shrink-0 rounded-full bg-zinc-200" />
      </div>
    </li>
  )
}

export function CatalogueView() {
  const params = parseParams(window.location.search)
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetchCatalogue(params.vsBaseUrl)
      if (res.ok) setItems(res.items)
      setLoaded(true)
    })()
  }, [params.vsBaseUrl])

  if (!loaded) return <ul className="space-y-4"><Skeleton /><Skeleton /></ul>
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
        <p className="text-base font-medium text-zinc-700">No questionnaires available right now.</p>
      </div>
    )
  }
  return <ul className="space-y-4">{items.map((it) => <Card key={it.deployment_id} item={it} />)}</ul>
}
```

- [ ] **Step 3: Update `src/home/CatalogueView.test.tsx`** — rename the import + render `CatalogueView` directly (it no longer uses the session, so no provider needed); drop the `/v1/auth/refresh` stub line:

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogueView } from './CatalogueView'

beforeEach(() => { vi.restoreAllMocks() })

function stub(items: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('renders a card per catalogue item with a Start link into the runner', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: 'A short check-in.', questionnaire_ref: 'qst_x@v1', auth: 'none' }])
  render(<CatalogueView />)
  expect(await screen.findByText('Wellbeing survey')).toBeInTheDocument()
  expect(screen.getByText('A short check-in.')).toBeInTheDocument()
  const start = screen.getByRole('link', { name: /start/i })
  expect(start.getAttribute('href')).toContain('index.html?')
  expect(start.getAttribute('href')).toContain('deployment=d1')
})

test('shows an empty state when the catalogue is empty', async () => {
  stub([])
  render(<CatalogueView />)
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})
```

- [ ] **Step 4: Rewrite `src/mydata/MyDataView.tsx`** — export `MyDataView`; remove the `SessionStrip` + `LoginView` imports and the outer `min-h-screen`/container divs; the `anon` branch becomes a Link to `/account`. Keep `StatusBadge`, `fmtDate`, `SessionRow`, `Skeleton`, the sessions effect, and the download panel.

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { useSession } from '../session/SessionProvider'
import { Link } from '../shell/router'
import { fetchMySessions, downloadMyData, type MySession } from './client'

function StatusBadge({ status }: { status: string }) {
  const done = status === 'submitted' || status === 'completed' || status === 'forwarded' || status === 'validated'
  return (
    <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + (done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
      <span className={'h-1.5 w-1.5 rounded-full ' + (done ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden />
      {status}
    </span>
  )
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function SessionRow({ s }: { s: MySession }) {
  const when = fmtDate(s.submitted_at ?? s.completed_at ?? s.started_at)
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900">
            {s.instrument_id}<span className="ml-2 align-middle text-xs font-normal text-zinc-400">{s.instrument_version}</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Attempt {s.session_index}{when ? <span className="text-zinc-400"> · {when}</span> : null}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
    </li>
  )
}

function Skeleton() {
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex animate-pulse items-start justify-between gap-3">
        <div className="w-full space-y-3"><div className="h-4 w-1/3 rounded bg-zinc-200" /><div className="h-3 w-1/2 rounded bg-zinc-100" /></div>
        <div className="h-6 w-20 shrink-0 rounded-full bg-zinc-100" />
      </div>
    </li>
  )
}

export function MyDataView() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loaded, setLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (session.status !== 'authed') return
    void (async () => {
      const list = await fetchMySessions(params.vsBaseUrl, session.authFetch)
      setLoaded(true)
      if (list.ok) setSessions(list.sessions)
    })()
  }, [session.status, params.vsBaseUrl, session.authFetch])

  if (session.status === 'loading') return null
  if (session.status === 'anon') {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
        <p className="text-base font-medium text-zinc-700">Log in to view your data.</p>
        <Link to="/account" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700">Log in</Link>
      </div>
    )
  }

  async function handleDownload() {
    setDownloading(true)
    try { await downloadMyData(params.vsBaseUrl, session.authFetch) }
    catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <>
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
    </>
  )
}
```

- [ ] **Step 5: Update `src/mydata/MyDataView.test.tsx`** — import `MyDataView`; the login flow is gone (login lives in AccountView), so replace the two login tests with authed-boot tests that render the session list + the anon→login-prompt:

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SessionProvider } from '../session/SessionProvider'
import { MyDataView } from './MyDataView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

const ME = { id: 'u1', email: 'a@e.com', display_name: 'Al', email_verified: false, roles: ['researcher'] }

function authed(sessions: unknown[]) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    if ((url as string).endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

function renderView() {
  return render(<SessionProvider identityBaseUrl="http://id"><MyDataView /></SessionProvider>)
}

test('authed: lists the participant sessions + a download button', async () => {
  authed([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v26.0101', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  renderView()
  expect(await screen.findByText(/qst_x/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
})

test('authed: empty state when no sessions', async () => {
  authed([])
  renderView()
  expect(await screen.findByText(/no completed questionnaires yet/i)).toBeInTheDocument()
})

test('anon: shows a Log in prompt linking to /account', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  renderView()
  const link = await screen.findByRole('link', { name: /log in/i })
  expect(link.getAttribute('href')).toBe('/account')
})
```

- [ ] **Step 6: Run the converted view tests**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- "home/CatalogueView" "mydata/MyDataView"`
Expected: all pass (2 catalogue + 3 my-data).

- [ ] **Step 7: Commit**

```bash
git add web-viewer/src/home web-viewer/src/mydata
git commit -m "feat(web-viewer): convert HomeApp→CatalogueView, MyDataApp→MyDataView (shell-chromed)"
```

---

### Task 6: Consolidate entry — ParticipantApp + main.tsx; remove the extra entries

**Files:**
- Create: `web-viewer/src/shell/ParticipantApp.tsx`
- Modify: `web-viewer/src/main.tsx`, `web-viewer/vite.config.ts`
- Delete: `web-viewer/home.html`, `web-viewer/mydata.html`, `web-viewer/src/home/main.tsx`, `web-viewer/src/mydata/main.tsx`, `web-viewer/src/session/SessionStrip.tsx`

**Interfaces:**
- Consumes: `useRoute` (Task 1), `NavShell` (Task 3), `CatalogueView`/`MyDataView` (Task 5), `AccountView` (Task 4), `App` (runner), `SessionProvider`, `parseParams`.
- Produces: `ParticipantApp` (the shell + router); a single-entry build.

- [ ] **Step 1: Write the failing test** (`web-viewer/src/shell/ParticipantApp.test.tsx`)

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from '../session/SessionProvider'
import { ParticipantApp } from './ParticipantApp'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

function stubAnon() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items: [] }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

function renderAt(path: string) {
  window.history.pushState(null, '', path)
  return render(<SessionProvider identityBaseUrl="http://id"><ParticipantApp /></SessionProvider>)
}

test('/ renders the catalogue', async () => {
  stubAnon(); renderAt('/')
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})

test('/account renders the account form', async () => {
  stubAnon(); renderAt('/account')
  expect(await screen.findByRole('button', { name: /create account/i })).toBeInTheDocument()
})

test('/my-data while anon shows the login prompt', async () => {
  stubAnon(); renderAt('/my-data')
  expect((await screen.findByRole('link', { name: /^log in$/i })).getAttribute('href')).toBe('/account')
})

test('unknown path falls back to the catalogue', async () => {
  stubAnon(); renderAt('/nope')
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/ParticipantApp`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/shell/ParticipantApp.tsx`**

```tsx
import { useRoute } from './router'
import { NavShell } from './NavShell'
import { CatalogueView } from '../home/CatalogueView'
import { MyDataView } from '../mydata/MyDataView'
import { AccountView } from '../account/AccountView'

export function ParticipantApp() {
  const route = useRoute()
  const view = route === '/my-data' ? <MyDataView /> : route === '/account' ? <AccountView /> : <CatalogueView />
  return <NavShell>{view}</NavShell>
}
```

- [ ] **Step 4: Rewrite `src/main.tsx`** to render the runner or the ParticipantApp:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { ParticipantApp } from './shell/ParticipantApp'
import { parseParams } from './app/bootstrap'
import { SessionProvider } from './session/SessionProvider'

const params = parseParams(window.location.search)
const runQuestionnaire = Boolean(params.deploymentId || params.invite || params.fixture)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider identityBaseUrl={params.identityBaseUrl}>
      {runQuestionnaire ? <App /> : <ParticipantApp />}
    </SessionProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
```

- [ ] **Step 5: Delete the removed entries + SessionStrip, and update `vite.config.ts`**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer
git rm home.html mydata.html src/home/main.tsx src/mydata/main.tsx src/session/SessionStrip.tsx
```

In `vite.config.ts`, replace the `input` block with single-entry (keep dev `gallery`):

```typescript
          input: mode === 'production'
            ? { main: resolve(__dirname, 'index.html') }
            : { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html') },
```

Confirm nothing still imports the deleted modules: `grep -rn "SessionStrip\|home/main\|mydata/main" src` returns nothing.

- [ ] **Step 6: Run the shell tests + the full suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- shell/ParticipantApp && npm test`
Expected: ParticipantApp 4 pass; full suite green. If a leftover test references a deleted module (`SessionStrip`, the old `HomeApp`/`MyDataApp` names), that's a real break — fix the import/usage minimally within the test's own file.

- [ ] **Step 7: Commit**

```bash
git add web-viewer/src/shell/ParticipantApp.tsx web-viewer/src/shell/ParticipantApp.test.tsx web-viewer/src/main.tsx web-viewer/vite.config.ts
git commit -m "feat(web-viewer): consolidate to one SPA (ParticipantApp + router); drop home/mydata entries + SessionStrip"
```

---

### Task 7: Full-suite gate + docs

**Files:**
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`, `docs/testing-participant-flow.md`

- [ ] **Step 1: Run the full suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build emitting a **single** `dist/index.html` (no `dist/home.html` / `dist/mydata.html`). If a pre-existing test broke from the consolidation, fix it minimally within its own file. If a failure is unrelated/genuine, STOP and report BLOCKED with output. Capture totals.

- [ ] **Step 2: Update `web-viewer/README.md`** — replace the multi-entry description: the app is now one SPA (`index.html`) — `/` catalogue, `/my-data`, `/account`, with a nav shell (`src/shell/`: `router`, `NavShell`, `ParticipantApp`) and an `AccountView` (register auto-logs-in; profile when signed in); the runner is still entered via `?deployment=`/`?invite=`/`?fixture=`. Remove references to `home.html`/`mydata.html`/`SessionStrip`.

- [ ] **Step 3: Update `docs/testing-participant-flow.md`** — change the participant URLs: the catalogue/home is now **`http://localhost:5173/`** (not `/home.html`), my-data is **`http://localhost:5173/my-data`** (not `/mydata.html`), and a new account/register page at **`http://localhost:5173/account`**. Update the walkthrough so "create an account" uses the in-app **Account → Create account** form (auto-login) instead of the `curl` register, and note logging in via the same Account page. Keep the backend setup sections unchanged.

- [ ] **Step 4: Update `web-viewer/FOLLOWUPS.md`** — record PA-2 deferrals: change-password / email-verification (+ a real mailer) / password-reset UI (PA-3); prod SPA-fallback rewrite needed when the web-viewer is deployed (mirror library-web's `"/((?!api/).*)" → /index.html`); the runner has no nav shell (intentional focus mode) so returning to the catalogue after a run is via the deployment's redirect/confirmation; restore the my-data empty-state "Browse questionnaires" CTA if desired.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/README.md web-viewer/FOLLOWUPS.md docs/testing-participant-flow.md
git commit -m "docs: document the consolidated participant SPA; update testing guide URLs; PA-2 followups; PA-2 complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 single SPA / path routes / runner unchanged → Task 1 (router), Task 6 (main.tsx runner-or-ParticipantApp). ✓
- §2 no router dep + query preservation → Task 1 (`useSyncExternalStore`, `preservedSearch`). ✓
- §2 register auto-login + error mapping → Task 2 (client) + Task 4 (AccountView submit). ✓
- §2 NavShell owns chrome; SessionStrip removed → Task 3 (NavShell container) + Task 5/6 (strip + delete). ✓
- §3 units (router/NavShell/ParticipantApp/AccountView/register/views) → Tasks 1–6. ✓
- §3 remove home/mydata entries + vite input → Task 6. ✓
- §4 routing model (pushState/popstate/Link) → Task 1. ✓
- §5 error handling (weak pw pre-check, email_in_use, unknown route→catalogue, anon /my-data→/account) → Task 4 + Task 5 (MyDataView anon) + Task 6 (default route). ✓
- §6 testing enumerated → Tasks 1–6 tests; full gate Task 7. ✓
- §7 deliverable (register→auto-login→shell shows email; nav; logout; entries gone; runner from a card) → covered across Tasks 4/6 + gate. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit. (The stray no-op line in the router popstate test was removed inline.)

**3. Type consistency:** `useRoute`/`navigate`/`Link` (Task 1) consumed by NavShell (Task 3), ParticipantApp (Task 6), MyDataView (Task 5 `Link to="/account"`). `register(...)→{ok}|{ok:false,error:'email_in_use'|'invalid'|'network'}` (Task 2) consumed by AccountView (Task 4). `CatalogueView`/`MyDataView` (Task 5) + `AccountView` (Task 4) consumed by ParticipantApp (Task 6). `SessionProvider`/`useSession` (PA-1) used throughout. The catalogue Start href stays `index.html?deployment=…` (full load into the runner) in both the spec and Task 5. Consistent.
