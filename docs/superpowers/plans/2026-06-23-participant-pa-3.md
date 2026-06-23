# PA-3 — Change password (logged-in) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in participant change their password — a new Identity `POST /v1/auth/change-password` endpoint plus a "Change password" section in the web-viewer account profile.

**Architecture:** Add `change-password` to `identity-service` (model + service + route, mirroring the existing `_handle`/`require_access`/`AuthError` patterns). Add a `changePassword` call to the web-viewer `session/client.ts` (via `authFetch`) and a change-password form in `AccountView`'s profile. Identity is consumed by VS/Library only as a token verifier — this additive endpoint doesn't affect them.

**Tech Stack:** Python 3.12 / FastAPI / psycopg3 / testcontainers (identity-service); React 19 / TS / Vite / vitest (web-viewer).

## Global Constraints

- New endpoint **`POST /v1/auth/change-password`** — Bearer access token (`claims=Depends(require_access)`; user = `claims["sub"]`, like `/v1/auth/me`), body `{old_password, new_password}` with `new_password` min 8 (Pydantic `Field(min_length=8)`) → `204`.
- Error mapping: invalid/expired access token → **401**; new password < 8 → **422**; **wrong current password → 403 `{code:"wrong_password"}`** (a NEW `WrongPassword(AuthError)`, status 403 — deliberately NOT 401, so the web-viewer's `authFetch` doesn't treat it as an expired token and refresh+retry).
- **No session revocation** on change (only the password hash is updated). "Log out other devices" is deferred.
- web-viewer `changePassword(authFetch, identityBaseUrl, oldPassword, newPassword) -> {ok:true} | {ok:false, error:'wrong_password'|'invalid'|'network'}`: POST via `authFetch` (Bearer + refresh-on-401), body `{old_password, new_password}`; `204`→ok, `403`→wrong_password, `422`→invalid, else/thrown→network.
- AccountView change-password section: validate `new.length >= 8` before the call; on ok clear fields + "Password updated."; map `wrong_password`→"Current password is incorrect.", `invalid`→length message, `network`→"Network error — try again."
- No mailer/email work; no VS/Library change; no display-name editing.
- Identity tests: own pytest, testcontainers → `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest <path> -q` (create `/tmp/lib_docker/config.json` = `{}` if missing). web-viewer: `cd web-viewer && npm test -- <substr>` / `npm test && npm run build`. Tests wrap session-consuming components in `<SessionProvider identityBaseUrl="http://id">`, `beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })`.
- Spec: `docs/superpowers/specs/2026-06-23-participant-pa-3-design.md`.

---

### Task 1: Identity `POST /v1/auth/change-password`

**Files:**
- Modify: `identity-service/src/identity_service/models.py`
- Modify: `identity-service/src/identity_service/service/auth.py`
- Modify: `identity-service/src/identity_service/api/auth.py`
- Create: `identity-service/tests/test_change_password_api.py`

**Interfaces:**
- Produces: `ChangePasswordIn` model; `auth.WrongPassword`; `auth.change_password(conn, *, user_id, old_password, new_password)`; route `POST /v1/auth/change-password`.

- [ ] **Step 1: Write the failing test** (`tests/test_change_password_api.py`)

```python
import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore

A = {"email": "a@e.com", "password": "password1", "display_name": "Ada", "audience": "questionnaire-apps"}


def _bootstrap(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        c.commit()


def _register_login(client, pg_url):
    _bootstrap(pg_url)
    client.post("/v1/auth/register", json=A)
    return client.post("/v1/auth/login", json={"email": A["email"], "password": A["password"], "audience": A["audience"]}).json()["access_token"]


def _login_status(client, password):
    return client.post("/v1/auth/login", json={"email": A["email"], "password": password, "audience": A["audience"]}).status_code


def test_change_password_succeeds_and_rotates_the_password(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "password1", "new_password": "newpassword2"})
    assert r.status_code == 204, r.text
    assert _login_status(client, "password1") == 401          # old rejected
    assert _login_status(client, "newpassword2") == 200       # new works


def test_change_password_wrong_old_returns_403(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "WRONGpass1", "new_password": "newpassword2"})
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "wrong_password"


def test_change_password_short_new_returns_422(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "password1", "new_password": "short"})
    assert r.status_code == 422


def test_change_password_without_token_returns_401(client, pg_url):
    _bootstrap(pg_url)
    r = client.post("/v1/auth/change-password", json={"old_password": "x", "new_password": "newpassword2"})
    assert r.status_code == 401
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_change_password_api.py -q`
Expected: FAIL (404 — route not registered).

- [ ] **Step 3: Add the model** — append to `models.py` (after `ResetPasswordIn`, mirroring its `Field(min_length=8)`):

```python
class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)
```

- [ ] **Step 4: Add `WrongPassword` + `change_password` to `service/auth.py`** — after the other `AuthError` subclasses add:

```python
class WrongPassword(AuthError):
    code = "wrong_password"; status = 403; message = "Current password is incorrect."
```

and after `reset_password` add:

```python
def change_password(conn, *, user_id, old_password, new_password) -> None:
    user = ustore.by_id(conn, user_id)
    if user is None or not passwords.verify_password(old_password, user["password_hash"]):
        raise WrongPassword()
    ustore.set_password(conn, user_id, passwords.hash_password(new_password))
```

- [ ] **Step 5: Add the route to `api/auth.py`** — add `ChangePasswordIn` to the `..models` import and `require_access` is already imported from `.deps`; then add the route (mirrors `reset_password` + `me`):

```python
@router.post("/v1/auth/change-password", status_code=204)
def change_password(body: ChangePasswordIn, claims=Depends(require_access), conn=Depends(get_conn)):
    def go():
        auth.change_password(conn, user_id=claims["sub"], old_password=body.old_password,
                             new_password=body.new_password)
        conn.commit()
    return _handle(go)
```

(The import line becomes: `from ..models import (RegisterIn, LoginIn, RefreshIn, LogoutIn, VerifyEmailIn, RequestResetIn, ResetPasswordIn, ChangePasswordIn)`.)

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_change_password_api.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add identity-service/src/identity_service/models.py identity-service/src/identity_service/service/auth.py identity-service/src/identity_service/api/auth.py identity-service/tests/test_change_password_api.py
git commit -m "feat(identity): POST /v1/auth/change-password (Bearer; wrong-current → 403)"
```

---

### Task 2: web-viewer `changePassword` client

**Files:**
- Modify: `web-viewer/src/session/client.ts`
- Modify: `web-viewer/src/session/client.test.ts`

**Interfaces:**
- Consumes: `AuthFetch` (`src/session/authFetch.ts`).
- Produces: `changePassword(authFetch, identityBaseUrl, oldPassword, newPassword) -> Promise<{ok:true} | {ok:false, error:'wrong_password'|'invalid'|'network'}>`.

- [ ] **Step 1: Add the failing tests** — append to `client.test.ts` (add `changePassword` to its import from `./client`):

```typescript
import type { AuthFetch } from './authFetch'

// a pass-through authFetch: the stubbed global fetch's Response status drives the mapping
const af: AuthFetch = (url, init) => fetch(url, init) as Promise<Response>

test('changePassword posts old+new via authFetch and returns ok on 204', async () => {
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  const r = await changePassword(af, 'http://id', 'oldpass12', 'newpass34')
  expect(r).toEqual({ ok: true })
  const [url, init] = f.mock.calls[0]
  expect(url).toBe('http://id/v1/auth/change-password')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ old_password: 'oldpass12', new_password: 'newpass34' })
})

test('changePassword maps 403 to wrong_password', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })))
  expect(await changePassword(af, 'http://id', 'x', 'newpass34')).toEqual({ ok: false, error: 'wrong_password' })
})

test('changePassword maps 422 to invalid', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })))
  expect(await changePassword(af, 'http://id', 'oldpass12', 'short')).toEqual({ ok: false, error: 'invalid' })
})

test('changePassword maps a thrown authFetch to network', async () => {
  const throwing: AuthFetch = () => { throw new Error('down') }
  expect(await changePassword(throwing, 'http://id', 'oldpass12', 'newpass34')).toEqual({ ok: false, error: 'network' })
})
```

Add `changePassword` to the existing import line, e.g. `import { login, refresh, logout, fetchMe, register, changePassword } from './client'`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: FAIL (`changePassword` not exported).

- [ ] **Step 3: Add `changePassword` to `client.ts`** — add the `AuthFetch` type import at the top (`import type { AuthFetch } from './authFetch'`) and append after `register`:

```typescript
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: all pass (existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/client.ts web-viewer/src/session/client.test.ts
git commit -m "feat(web-viewer): session/client changePassword() via authFetch"
```

---

### Task 3: AccountView change-password section

**Files:**
- Modify: `web-viewer/src/account/AccountView.tsx`
- Modify: `web-viewer/src/account/AccountView.test.tsx`

**Interfaces:**
- Consumes: `changePassword` (Task 2), `useSession` (`session.authFetch`), `parseParams` (`identityBaseUrl`).

- [ ] **Step 1: Add the failing tests** — append to `AccountView.test.tsx` (it already has `renderView` + the `ME` user + the fetch-stub pattern). Add a helper that boots authed and three tests:

```typescript
function authedFetch(extra?: (url: string) => Response | null) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if ((url as string).endsWith('/v1/auth/me')) return new Response(JSON.stringify(ME), { status: 200 })
    const e = extra?.(url as string)
    if (e) return e
    return new Response('{}', { status: 200 })
  }))
}

test('authed: change-password succeeds and shows confirmation', async () => {
  authedFetch((url) => url.endsWith('/v1/auth/change-password') ? new Response(null, { status: 204 }) : null)
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'password1')
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword2')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/password updated/i)).toBeInTheDocument()
})

test('authed: wrong current password shows the error', async () => {
  authedFetch((url) => url.endsWith('/v1/auth/change-password') ? new Response('{}', { status: 403 }) : null)
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'wrongpass')
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword2')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument()
})

test('authed: a short new password is rejected before any request', async () => {
  const calls: string[] = []
  authedFetch((url) => { if (url.endsWith('/v1/auth/change-password')) calls.push(url); return null })
  renderView()
  await userEvent.type(await screen.findByLabelText(/current password/i), 'password1')
  await userEvent.type(screen.getByLabelText(/new password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /update password/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(calls.length).toBe(0)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/AccountView`
Expected: FAIL (no change-password form).

- [ ] **Step 3: Add a `ChangePasswordForm` + render it in `Profile`.** In `AccountView.tsx`, add `changePassword` to the `../session/client` import (`import { register, changePassword } from '../session/client'`), and add this component above `Profile`:

```tsx
function ChangePasswordForm() {
  const s = useSession()
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null)
    if (next.length < 8) { setErr('New password must be at least 8 characters.'); return }
    setBusy(true)
    const r = await changePassword(s.authFetch, identityBaseUrl, current, next)
    setBusy(false)
    if (r.ok) { setMsg('Password updated.'); setCurrent(''); setNext(''); return }
    setErr(r.error === 'wrong_password' ? 'Current password is incorrect.'
      : r.error === 'invalid' ? 'New password must be at least 8 characters.'
      : 'Network error — try again.')
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-zinc-100 pt-4">
      <div className="text-sm font-semibold text-zinc-900">Change password</div>
      <input aria-label="Current password" type="password" autoComplete="current-password" value={current}
             onChange={(e) => setCurrent(e.target.value)} required className={inputCls} placeholder="Current password" />
      <input aria-label="New password" type="password" autoComplete="new-password" value={next}
             onChange={(e) => setNext(e.target.value)} required className={inputCls} placeholder="New password" />
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p> : null}
      <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Saving…' : 'Update password'}</button>
    </form>
  )
}
```

Then in `Profile`, render `<ChangePasswordForm />` between the amber-note block and the Log out button:

```tsx
      {!s.user.email_verified ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Your email isn't verified yet.</p>
      ) : null}
      <ChangePasswordForm />
      <button onClick={() => void s.logout()} className={primaryBtn}>Log out</button>
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/AccountView`
Expected: all pass (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/account/AccountView.tsx web-viewer/src/account/AccountView.test.tsx
git commit -m "feat(web-viewer): AccountView change-password section"
```

---

### Task 4: Full-suite gate + docs

**Files:**
- Modify: `identity-service/README.md`, `identity-service/FOLLOWUPS.md` (create if absent)
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full Identity suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest -q`
Expected: all pass (existing + the 4 new). If an unrelated/genuine failure occurs, STOP + report BLOCKED with output. Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build. Capture totals.

- [ ] **Step 3: Update `identity-service/README.md` + `FOLLOWUPS.md`** — README: document `POST /v1/auth/change-password` (Bearer; `{old_password, new_password≥8}`; 204; wrong current → 403 `wrong_password`; new < 8 → 422; no session revocation). FOLLOWUPS (create if missing, matching the repo's FOLLOWUPS style): "Revoke other sessions on password change" (currently none) and the still-stubbed `NullMailer` (verify-email / password-reset are not deliverable until a real SMTP mailer is wired).

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md`** — README: the Account page now supports changing your password when signed in (`changePassword` via `authFetch`). FOLLOWUPS: email verification + forgot/reset-password UIs are deferred to the "email" slice (blocked on a real mailer); display-name editing not yet supported.

- [ ] **Step 5: Commit**

```bash
git add identity-service/README.md identity-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs: document change-password (identity + web-viewer); PA-3 followups; PA-3 complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 new endpoint (Bearer via require_access, body, 204) → Task 1. ✓
- §2 wrong-current → 403 `wrong_password` (new AuthError; distinct from 401) → Task 1 (service + test) + Task 2 (client maps 403). ✓
- §2 no revocation → Task 1 `change_password` (only `set_password`; no revoke). ✓
- §2 client via authFetch + error map → Task 2. ✓
- §2 AccountView section (validate <8 before call; success/wrong/short messages) → Task 3. ✓
- §3 units (model/WrongPassword/service/route; client; ChangePasswordForm in Profile) → Tasks 1–3. ✓
- §6 testing (identity: 204+rotates, 403, 422, 401; web-viewer: client maps + AccountView success/wrong/short) → Tasks 1–3; full gate Task 4. ✓
- §7 deliverable (change pw + stay logged in; new works, old fails; clear errors; no mailer/VS change) → Tasks 1–4. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit. The Identity test's `_handle` detail shape (`r.json()["detail"]["code"] == "wrong_password"`) matches `api/auth.py`'s `HTTPException(detail={"code":…})`. The web-viewer test's `af` is a no-param pass-through `AuthFetch` (the stubbed `fetch`'s `Response` status drives the mapping) — no unused-parameter (`noUnusedParameters`) build break.

**3. Type consistency:** `ChangePasswordIn`/`WrongPassword`/`change_password` (Task 1) are server-side; the route returns 204/403/422/401. `changePassword(authFetch, identityBaseUrl, old, new) -> {ok}|{ok:false,error:'wrong_password'|'invalid'|'network'}` (Task 2) consumed by `ChangePasswordForm` (Task 3) with matching error strings. `AuthFetch` (existing) is the first param of `changePassword`; `session.authFetch` (existing Session type) is passed in Task 3. `JSON_HEADERS` reused in Task 2 (already in client.ts). Body keys `old_password`/`new_password` identical across the endpoint (Task 1), the client (Task 2), and both test layers. Consistent.
