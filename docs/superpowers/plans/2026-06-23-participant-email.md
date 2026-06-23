# Email slice — verify-email + password-reset + mailer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Identity's verify-email + password-reset usable — a config-driven mailer that sends real links, plus the web-viewer verify-email and forgot/reset-password UIs.

**Architecture:** Identity gains a `make_mailer(settings)` factory (`SmtpMailer` when `SMTP_HOST` set, else a `ConsoleMailer`; `NullMailer` for tests) + a `WEB_VIEWER_BASE_URL` config; register/reset emails carry `{base}/verify-email?token=` / `/reset-password?token=` links. The web-viewer adds three client calls and two public views (`ResetPasswordView`, `VerifyEmailView`) wired as routes, plus a "Forgot password?" link.

**Tech Stack:** Python 3.12 / FastAPI / smtplib / testcontainers (identity-service); React 19 / TS / Vite / vitest (web-viewer).

## Global Constraints

- **Mailer config-selected:** `make_mailer(settings)` → `SmtpMailer` when `settings.smtp_host` is truthy, else `ConsoleMailer` (logs the message incl. the link). `NullMailer` stays for tests. The two handlers (`register`, `request_reset`) use `make_mailer(get_settings())`.
- **New Identity config:** `web_viewer_base_url` (env `WEB_VIEWER_BASE_URL`, default `http://localhost:5173`); `smtp_host` (`SMTP_HOST`, default None), `smtp_port` (`SMTP_PORT`, default 587), `smtp_username` (`SMTP_USERNAME`), `smtp_password` (`SMTP_PASSWORD`), `smtp_from` (`SMTP_FROM`, default `no-reply@behaverse.local`).
- **Email links:** register → `f"{base}/verify-email?token={raw}"`; reset → `f"{base}/reset-password?token={raw}"`. Body is a short message wrapping the link.
- **No-enumeration preserved:** `request_password_reset` still returns 202 always; a mailer exception there is caught + logged (never surfaced). (`register`'s send stays inside its transaction — a failure rolls back the registration; `ConsoleMailer` never fails.)
- web-viewer client error maps: `verifyEmail` 204→ok/400→invalid/else→network; `requestPasswordReset` 202→ok/else→network; `resetPassword` 204→ok/400→invalid_token/422→weak_password/else→network.
- `ResetPasswordView` (route `/reset-password`): no `?token` → request form; with `?token` → set-new form (validate ≥8 before call). `VerifyEmailView` (route `/verify-email?token=`): auto-verify on mount. Both read `?token` from `window.location.search`, render under `NavShell`, and reuse `account/ui.ts` `inputCls`/`primaryBtn`.
- **Resend-verification out of scope.** No gating on `email_verified`.
- Identity tests: own pytest, testcontainers → `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest <path> -q`. web-viewer: `cd web-viewer && npm test -- <substr>` / `npm test && npm run build`. web-viewer tests wrap views in `<SessionProvider identityBaseUrl="http://id">` where they use the session, `beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })`, and route via `window.history.pushState`.
- Spec: `docs/superpowers/specs/2026-06-23-participant-email-design.md`.

---

### Task 1: Identity config + mailer (SmtpMailer / ConsoleMailer / make_mailer)

**Files:**
- Modify: `identity-service/src/identity_service/config.py`
- Modify: `identity-service/src/identity_service/mailer.py`
- Create: `identity-service/tests/test_mailer.py`

**Interfaces:**
- Produces: `Settings.web_viewer_base_url` + `smtp_*`; `mailer.ConsoleMailer`, `mailer.SmtpMailer`, `mailer.make_mailer(settings) -> Mailer`.

- [ ] **Step 1: Write the failing test** (`tests/test_mailer.py`)

```python
import logging
from identity_service.config import Settings
from identity_service.mailer import ConsoleMailer, SmtpMailer, make_mailer

BASE = dict(database_url="x", issuer="x")


def _settings(**over):
    return Settings(**BASE, **over)


def test_make_mailer_returns_console_when_no_smtp_host():
    assert isinstance(make_mailer(_settings()), ConsoleMailer)


def test_make_mailer_returns_smtp_when_host_set():
    m = make_mailer(_settings(smtp_host="smtp.example.com", smtp_port=2525, smtp_from="x@e.com"))
    assert isinstance(m, SmtpMailer)


def test_console_mailer_logs_the_body(caplog):
    with caplog.at_level(logging.INFO, logger="identity.mailer"):
        ConsoleMailer().send("a@e.com", "Subj", "hello https://x/verify-email?token=abc")
    assert "a@e.com" in caplog.text and "verify-email?token=abc" in caplog.text


def test_smtp_mailer_builds_and_sends_message(monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, host, port): sent["addr"] = (host, port)
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def starttls(self): sent["tls"] = True
        def login(self, u, p): sent["login"] = (u, p)
        def send_message(self, msg): sent["msg"] = msg

    import identity_service.mailer as m
    monkeypatch.setattr(m.smtplib, "SMTP", FakeSMTP)
    SmtpMailer("smtp.x", 2525, "u", "p", "from@e.com").send("to@e.com", "Subj", "Body")
    assert sent["addr"] == ("smtp.x", 2525) and sent["login"] == ("u", "p")
    assert sent["msg"]["To"] == "to@e.com" and sent["msg"]["From"] == "from@e.com" and sent["msg"]["Subject"] == "Subj"
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_mailer.py -q`
Expected: FAIL (ConsoleMailer/SmtpMailer/make_mailer not defined; Settings has no smtp fields).

- [ ] **Step 3: Add the config fields** — in `config.py`, add to the `Settings` dataclass (after `cors_origins`):

```python
    web_viewer_base_url: str = "http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@behaverse.local"
```

and in `get_settings()` add to the `Settings(...)` call:

```python
        web_viewer_base_url=os.environ.get("WEB_VIEWER_BASE_URL", "http://localhost:5173"),
        smtp_host=os.environ.get("SMTP_HOST") or None,
        smtp_port=int(os.environ.get("SMTP_PORT", "587")),
        smtp_username=os.environ.get("SMTP_USERNAME") or None,
        smtp_password=os.environ.get("SMTP_PASSWORD") or None,
        smtp_from=os.environ.get("SMTP_FROM", "no-reply@behaverse.local"),
```

- [ ] **Step 4: Add the mailers + factory** — append to `mailer.py` (keep the existing `Mailer` Protocol + `NullMailer`):

```python
import logging
import smtplib
from email.message import EmailMessage
from .config import Settings

_log = logging.getLogger("identity.mailer")


class ConsoleMailer:
    """Logs the email (incl. any link) instead of sending — zero-setup local dev."""

    def send(self, to: str, subject: str, body: str) -> None:
        _log.info("EMAIL to=%s subject=%s body=%s", to, subject, body)


class SmtpMailer:
    def __init__(self, host: str, port: int, username: str | None, password: str | None, sender: str) -> None:
        self._host, self._port = host, port
        self._username, self._password, self._sender = username, password, sender

    def send(self, to: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["From"], msg["To"], msg["Subject"] = self._sender, to, subject
        msg.set_content(body)
        with smtplib.SMTP(self._host, self._port) as s:
            s.starttls()
            if self._username and self._password:
                s.login(self._username, self._password)
            s.send_message(msg)


def make_mailer(settings: Settings) -> Mailer:
    if settings.smtp_host:
        return SmtpMailer(settings.smtp_host, settings.smtp_port, settings.smtp_username,
                          settings.smtp_password, settings.smtp_from)
    return ConsoleMailer()
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_mailer.py -q`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/config.py identity-service/src/identity_service/mailer.py identity-service/tests/test_mailer.py
git commit -m "feat(identity): config-selected mailer (Smtp/Console/make_mailer) + web_viewer_base_url + smtp config"
```

---

### Task 2: Identity emails carry links + wire make_mailer

**Files:**
- Modify: `identity-service/src/identity_service/service/auth.py`
- Modify: `identity-service/src/identity_service/api/auth.py`
- Create: `identity-service/tests/test_email_links.py`

**Interfaces:**
- Consumes: `Settings.web_viewer_base_url` (T1), `make_mailer` (T1), `NullMailer`.

- [ ] **Step 1: Write the failing test** (`tests/test_email_links.py`)

```python
import psycopg
from identity_service.config import get_settings
from identity_service.mailer import NullMailer
from identity_service.service import auth
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore

AUD = "questionnaire-apps"


def _settings():
    return get_settings()  # web_viewer_base_url default http://localhost:5173


def _bootstrap(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    cstore.create(conn, AUD, "QA")
    conn.commit()


def test_register_email_contains_verify_link(conn):
    _bootstrap(conn); s = _settings(); m = NullMailer()
    auth.register(conn, s, m, email="a@e.com", password="password1", display_name="A", audience=AUD)
    body = m.sent[0][2]
    assert f"{s.web_viewer_base_url}/verify-email?token=" in body
    raw = body.split("token=", 1)[1].strip()
    auth.verify_email(conn, token=raw)  # the linked token still verifies


def test_request_reset_email_contains_reset_link(conn):
    _bootstrap(conn); s = _settings()
    auth.register(conn, s, NullMailer(), email="b@e.com", password="password1", display_name="B", audience=AUD)
    m = NullMailer()
    auth.request_password_reset(conn, s, m, email="b@e.com")
    body = m.sent[0][2]
    assert f"{s.web_viewer_base_url}/reset-password?token=" in body
    raw = body.split("token=", 1)[1].strip()
    auth.reset_password(conn, token=raw, new_password="newpassword9")  # the linked token still resets


def test_request_reset_swallows_a_failing_mailer(conn):
    _bootstrap(conn); s = _settings()
    auth.register(conn, s, NullMailer(), email="c@e.com", password="password1", display_name="C", audience=AUD)

    class Boom:
        def send(self, *a): raise RuntimeError("smtp down")

    auth.request_password_reset(conn, s, Boom(), email="c@e.com")  # must NOT raise
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_email_links.py -q`
Expected: FAIL (body has `"verify token: <raw>"`, no link; Boom propagates).

- [ ] **Step 3: Build links in `service/auth.py`** — add a module logger near the top (after the imports): `import logging` and `_log = logging.getLogger("identity.service.auth")`. In `register`, replace the verify mail line:

```python
    link = f"{settings.web_viewer_base_url}/verify-email?token={raw}"
    mailer.send(email, "Verify your email", f"Verify your email: {link}")
```

In `request_password_reset`, replace the reset mail line with a link + swallow:

```python
    link = f"{settings.web_viewer_base_url}/reset-password?token={raw}"
    try:
        mailer.send(email, "Reset your password", f"Reset your password: {link}")
    except Exception:                                   # keep 202 + no enumeration even if SMTP fails
        _log.warning("reset email send failed", exc_info=True)
```

- [ ] **Step 4: Wire `make_mailer` into `api/auth.py`** — replace the `from ..mailer import NullMailer` import with `from ..mailer import make_mailer`, delete the module-level `_mailer = NullMailer()` line, and use a freshly-built mailer in the two handlers:

In `register`'s `go()`: `out = auth.register(conn, s, make_mailer(s), email=body.email, password=body.password, display_name=body.display_name, audience=body.audience)`.

In `request_reset`: set `s = get_settings()` then `auth.request_password_reset(conn, s, make_mailer(s), email=body.email)`.

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest tests/test_email_links.py -q`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/service/auth.py identity-service/src/identity_service/api/auth.py identity-service/tests/test_email_links.py
git commit -m "feat(identity): verify/reset emails carry web-viewer links; wire make_mailer; reset send is best-effort"
```

---

### Task 3: web-viewer client — verifyEmail / requestPasswordReset / resetPassword

**Files:**
- Modify: `web-viewer/src/session/client.ts`
- Modify: `web-viewer/src/session/client.test.ts`

**Interfaces:**
- Produces: `verifyEmail(identityBaseUrl, token)`, `requestPasswordReset(identityBaseUrl, email)`, `resetPassword(identityBaseUrl, token, newPassword)`.

- [ ] **Step 1: Add the failing tests** — append to `client.test.ts` (add the three names to its `./client` import):

```typescript
test('verifyEmail maps 204→ok, 400→invalid, thrown→network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  expect(await verifyEmail('http://id', 't')).toEqual({ ok: true })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  expect(await verifyEmail('http://id', 't')).toEqual({ ok: false, error: 'invalid' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')))
  expect(await verifyEmail('http://id', 't')).toEqual({ ok: false, error: 'network' })
})

test('verifyEmail posts the token', async () => {
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  await verifyEmail('http://id', 'tok')
  expect(f.mock.calls[0][0]).toBe('http://id/v1/auth/verify-email')
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ token: 'tok' })
})

test('requestPasswordReset maps 202→ok, thrown→network and posts the email', async () => {
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'accepted' }), { status: 202 }))
  vi.stubGlobal('fetch', f)
  expect(await requestPasswordReset('http://id', 'a@e.com')).toEqual({ ok: true })
  expect(f.mock.calls[0][0]).toBe('http://id/v1/auth/request-password-reset')
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ email: 'a@e.com' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')))
  expect(await requestPasswordReset('http://id', 'a@e.com')).toEqual({ ok: false, error: 'network' })
})

test('resetPassword maps 204→ok, 400→invalid_token, 422→weak_password, thrown→network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  expect(await resetPassword('http://id', 'tok', 'newpassword9')).toEqual({ ok: true })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  expect(await resetPassword('http://id', 'tok', 'newpassword9')).toEqual({ ok: false, error: 'invalid_token' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })))
  expect(await resetPassword('http://id', 'tok', 'short')).toEqual({ ok: false, error: 'weak_password' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')))
  expect(await resetPassword('http://id', 'tok', 'newpassword9')).toEqual({ ok: false, error: 'network' })
})

test('resetPassword posts token + new_password', async () => {
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  await resetPassword('http://id', 'tok', 'newpassword9')
  expect(f.mock.calls[0][0]).toBe('http://id/v1/auth/reset-password')
  expect(JSON.parse((f.mock.calls[0][1] as RequestInit).body as string)).toEqual({ token: 'tok', new_password: 'newpassword9' })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: FAIL (the three functions aren't exported).

- [ ] **Step 3: Add the three functions to `client.ts`** — append after `changePassword` (reuse `JSON_HEADERS`):

```typescript
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
```

Add the three names to the test's import: `import { login, refresh, logout, fetchMe, register, changePassword, verifyEmail, requestPasswordReset, resetPassword } from './client'`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- session/client`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/session/client.ts web-viewer/src/session/client.test.ts
git commit -m "feat(web-viewer): session/client verifyEmail/requestPasswordReset/resetPassword"
```

---

### Task 4: `account/ui.ts` + `ResetPasswordView`

**Files:**
- Create: `web-viewer/src/account/ui.ts`
- Modify: `web-viewer/src/account/AccountView.tsx` (import the shared styles)
- Create: `web-viewer/src/account/ResetPasswordView.tsx`
- Create: `web-viewer/src/account/ResetPasswordView.test.tsx`

**Interfaces:**
- Consumes: `requestPasswordReset`/`resetPassword` (T3), `Link` (`src/shell/router`), `parseParams`.
- Produces: `inputCls`/`primaryBtn` (from `account/ui.ts`); `ResetPasswordView`.

- [ ] **Step 1: Write the failing test** (`ResetPasswordView.test.tsx`)

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordView } from './ResetPasswordView'

beforeEach(() => { vi.restoreAllMocks(); window.history.pushState(null, '', '/reset-password') })

test('no token: requesting a reset shows the generic accepted message + posts the email', async () => {
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'accepted' }), { status: 202 }))
  vi.stubGlobal('fetch', f)
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
  expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/request-password-reset'))).toBe(true)
})

test('with token: setting a new password succeeds', async () => {
  window.history.pushState(null, '', '/reset-password?token=tok')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword9')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/password reset/i)).toBeInTheDocument()
})

test('with token: an invalid/expired token shows the error', async () => {
  window.history.pushState(null, '', '/reset-password?token=bad')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'newpassword9')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})

test('with token: a short new password is rejected before any request', async () => {
  window.history.pushState(null, '', '/reset-password?token=tok')
  const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', f)
  render(<ResetPasswordView />)
  await userEvent.type(screen.getByLabelText(/new password/i), 'short')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
  expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  expect(f.mock.calls.some((c) => (c[0] as string).endsWith('/v1/auth/reset-password'))).toBe(false)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/ResetPasswordView`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `account/ui.ts`** (move the shared styles out of AccountView):

```typescript
export const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
export const primaryBtn =
  'w-full rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60'
export const cardCls =
  'mx-auto max-w-sm space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm'
```

In `AccountView.tsx`, delete the local `const inputCls = …` and `const primaryBtn = …` definitions and add `import { inputCls, primaryBtn } from './ui'` (near the other imports).

- [ ] **Step 4: Create `account/ResetPasswordView.tsx`**

```tsx
import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { Link } from '../shell/router'
import { requestPasswordReset, resetPassword } from '../session/client'
import { inputCls, primaryBtn, cardCls } from './ui'

export function ResetPasswordView() {
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const token = new URLSearchParams(window.location.search).get('token')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function requestSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null); setBusy(true)
    const r = await requestPasswordReset(identityBaseUrl, email)
    setBusy(false)
    if (r.ok) setMsg("If an account exists for that email, we've sent a reset link.")
    else setErr('Network error — try again.')
  }

  async function resetSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null)
    if (pw.length < 8) { setErr('New password must be at least 8 characters.'); return }
    setBusy(true)
    const r = await resetPassword(identityBaseUrl, token as string, pw)
    setBusy(false)
    if (r.ok) { setMsg('Password reset. You can now sign in.'); setPw(''); return }
    setErr(r.error === 'invalid_token' ? 'This reset link is invalid or expired.'
      : r.error === 'weak_password' ? 'New password must be at least 8 characters.'
      : 'Network error — try again.')
  }

  if (!token) {
    return (
      <form onSubmit={requestSubmit} className={cardCls}>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-zinc-500">Enter your email and we'll send a reset link.</p>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="rp-email">Email</label>
          <input id="rp-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
        </div>
        {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
        {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p> : null}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Sending…' : 'Send reset link'}</button>
        <Link to="/account" className="block text-center text-sm text-zinc-500 underline">Back to sign in</Link>
      </form>
    )
  }
  return (
    <form onSubmit={resetSubmit} className={cardCls}>
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="rp-new">New password</label>
        <input id="rp-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required className={inputCls} />
      </div>
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg} <Link to="/account" className="underline">Sign in</Link></p> : null}
      <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Saving…' : 'Reset password'}</button>
    </form>
  )
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- "account/ResetPasswordView" "account/AccountView"`
Expected: ResetPasswordView 4 pass; AccountView still green (styles import unchanged behavior).

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/account/ui.ts web-viewer/src/account/AccountView.tsx web-viewer/src/account/ResetPasswordView.tsx web-viewer/src/account/ResetPasswordView.test.tsx
git commit -m "feat(web-viewer): ResetPasswordView (request + set modes) + shared account/ui styles"
```

---

### Task 5: `VerifyEmailView`

**Files:**
- Create: `web-viewer/src/account/VerifyEmailView.tsx`
- Create: `web-viewer/src/account/VerifyEmailView.test.tsx`

**Interfaces:**
- Consumes: `verifyEmail` (T3), `Link`, `parseParams`, `cardCls` (T4).

- [ ] **Step 1: Write the failing test** (`VerifyEmailView.test.tsx`)

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerifyEmailView } from './VerifyEmailView'

beforeEach(() => { vi.restoreAllMocks(); window.history.pushState(null, '', '/verify-email') })

test('with a valid token: shows verified', async () => {
  window.history.pushState(null, '', '/verify-email?token=tok')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  render(<VerifyEmailView />)
  expect(await screen.findByText(/email verified/i)).toBeInTheDocument()
})

test('with a bad token: shows invalid/expired', async () => {
  window.history.pushState(null, '', '/verify-email?token=bad')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })))
  render(<VerifyEmailView />)
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})

test('with no token: shows invalid', async () => {
  vi.stubGlobal('fetch', vi.fn())
  render(<VerifyEmailView />)
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/VerifyEmailView`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `account/VerifyEmailView.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { Link } from '../shell/router'
import { verifyEmail } from '../session/client'
import { cardCls } from './ui'

export function VerifyEmailView() {
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const token = new URLSearchParams(window.location.search).get('token')
  const [state, setState] = useState<'verifying' | 'ok' | 'invalid'>(token ? 'verifying' : 'invalid')

  useEffect(() => {
    if (!token) return
    void (async () => {
      const r = await verifyEmail(identityBaseUrl, token)
      setState(r.ok ? 'ok' : 'invalid')
    })()
  }, [identityBaseUrl, token])

  return (
    <div className={cardCls + ' text-center'}>
      {state === 'verifying' ? (
        <p className="text-sm text-zinc-500">Verifying your email…</p>
      ) : state === 'ok' ? (
        <>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Email verified.</p>
          <Link to="/account" className="block text-center text-sm text-zinc-500 underline">Sign in</Link>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">This link is invalid or expired.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- account/VerifyEmailView`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/account/VerifyEmailView.tsx web-viewer/src/account/VerifyEmailView.test.tsx
git commit -m "feat(web-viewer): VerifyEmailView (auto-verify ?token on mount)"
```

---

### Task 6: Wire routes + "Forgot password?" link

**Files:**
- Modify: `web-viewer/src/shell/ParticipantApp.tsx`
- Modify: `web-viewer/src/shell/ParticipantApp.test.tsx`
- Modify: `web-viewer/src/account/AccountView.tsx`
- Modify: `web-viewer/src/account/AccountView.test.tsx`

**Interfaces:**
- Consumes: `ResetPasswordView` (T4), `VerifyEmailView` (T5), `Link`.

- [ ] **Step 1: Add the failing tests** — append to `ParticipantApp.test.tsx` (it has `stubAnon()` + `renderAt(path)`):

```typescript
test('/reset-password renders the reset request form', async () => {
  stubAnon(); renderAt('/reset-password')
  expect(await screen.findByRole('button', { name: /send reset link/i })).toBeInTheDocument()
})

test('/verify-email renders the verifier', async () => {
  window.history.pushState(null, '', '/verify-email?token=bad')
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if ((url as string).endsWith('/v1/auth/refresh')) return new Response('{}', { status: 401 })
    if ((url as string).endsWith('/v1/auth/verify-email')) return new Response('{}', { status: 400 })
    return new Response('{}', { status: 200 })
  }))
  render(<SessionProvider identityBaseUrl="http://id"><ParticipantApp /></SessionProvider>)
  expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument()
})
```

(If `render`/`SessionProvider` aren't already imported in that file, add them — they are used by the existing `renderAt`.)

And append to `AccountView.test.tsx` a forgot-link test:

```typescript
test('the login tab shows a Forgot password? link to /reset-password', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    new Response('{}', { status: (url as string).endsWith('/v1/auth/refresh') ? 401 : 200 })))
  renderView()
  const link = await screen.findByRole('link', { name: /forgot password/i })
  expect(link.getAttribute('href')).toBe('/reset-password')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- "shell/ParticipantApp" "account/AccountView"`
Expected: FAIL (routes not wired; no forgot link).

- [ ] **Step 3: Wire the routes in `ParticipantApp.tsx`** — add the imports + extend the switch:

```tsx
import { ResetPasswordView } from '../account/ResetPasswordView'
import { VerifyEmailView } from '../account/VerifyEmailView'
// ...
  const view =
    route === '/my-data' ? <MyDataView />
    : route === '/account' ? <AccountView />
    : route === '/reset-password' ? <ResetPasswordView />
    : route === '/verify-email' ? <VerifyEmailView />
    : <CatalogueView />
```

- [ ] **Step 4: Add the "Forgot password?" link in `AccountView.tsx`** — add `import { Link } from '../shell/router'` (near the other imports), and render the link after the submit button, login mode only:

```tsx
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
      {mode === 'login' ? (
        <Link to="/reset-password" className="block text-center text-sm text-zinc-500 underline">Forgot password?</Link>
      ) : null}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- "shell/ParticipantApp" "account/AccountView"`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/shell/ParticipantApp.tsx web-viewer/src/shell/ParticipantApp.test.tsx web-viewer/src/account/AccountView.tsx web-viewer/src/account/AccountView.test.tsx
git commit -m "feat(web-viewer): route /reset-password + /verify-email; AccountView Forgot-password link"
```

---

### Task 7: Full-suite gate + docs

**Files:**
- Modify: `identity-service/README.md`, `identity-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`, `docs/testing-participant-flow.md`

- [ ] **Step 1: Run the full Identity suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/identity-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest -q`
Expected: all pass (existing + the new mailer/email-link tests). If an unrelated/genuine failure → STOP + report BLOCKED. Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build. If a real failure → STOP + report BLOCKED. Capture totals.

- [ ] **Step 3: Update `identity-service/README.md` + `FOLLOWUPS.md`** — README: document the mailer (`make_mailer` → `SmtpMailer` when `SMTP_HOST` set, else `ConsoleMailer` logging the link; `NullMailer` in tests), the new env vars (`WEB_VIEWER_BASE_URL`, `SMTP_HOST/PORT/USERNAME/PASSWORD/FROM`), and that verify/reset emails now contain `{WEB_VIEWER_BASE_URL}/verify-email?token=` / `/reset-password?token=` links. FOLLOWUPS: remove/strike the "NullMailer / no SMTP" item (now resolved); add "resend-verification endpoint" + "email-change" + "HTML email templates / deliverability" as deferred.

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md` + `docs/testing-participant-flow.md`** — web-viewer README: routes `/reset-password` (request + set) + `/verify-email` (auto), the "Forgot password?" link, and the `verifyEmail`/`requestPasswordReset`/`resetPassword` client calls. web-viewer FOLLOWUPS: mark the email-verification/reset deferral DONE; note resend-verification still deferred. testing-participant-flow.md: add a "Forgot / reset password" + "Verify email" walkthrough — with the console mailer (default), the verify/reset **link is printed to the Identity service console**; copy it into the browser. (Set `SMTP_HOST` to use Mailpit/real SMTP instead.)

- [ ] **Step 5: Commit**

```bash
git add identity-service/README.md identity-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md docs/testing-participant-flow.md
git commit -m "docs: document the mailer + verify/reset flows; update testing guide; email slice complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 mailer config-selected (Smtp/Console/Null) → T1. ✓
- §2 web_viewer_base_url + smtp config → T1. ✓
- §2 emails carry links → T2. ✓
- §2 no-enumeration + swallow reset send failure → T2 (try/except + 202) + test. ✓
- §3 client verifyEmail/requestPasswordReset/resetPassword → T3. ✓
- §3 ResetPasswordView (request + set modes) → T4. ✓
- §3 VerifyEmailView (auto) → T5. ✓
- §3 AccountView forgot link + ParticipantApp routes → T6. ✓
- §6 testing (identity make_mailer/console/links/swallow; web-viewer clients + views + routes) → T1–T6; full gate T7. ✓
- §7 deliverable (console link → verify/reset works; SMTP when set) → T7 docs + the flow. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit. The Identity link tests parse the token via `body.split("token=", 1)[1]` — matches the `…?token={raw}` format the service builds. The web-viewer tests assert exact request bodies + status→error maps.

**3. Type consistency:** `make_mailer(settings)` (T1) consumed by `api/auth.py` (T2). `web_viewer_base_url` (T1) used by `service/auth.py` (T2). `verifyEmail`/`requestPasswordReset`/`resetPassword` signatures + error unions (T3) consumed by `VerifyEmailView` (T5) and `ResetPasswordView` (T4) with matching strings (`invalid_token`/`weak_password`/`network`). `inputCls`/`primaryBtn`/`cardCls` from `account/ui.ts` (T4) consumed by AccountView (T4), ResetPasswordView (T4), VerifyEmailView (T5). Routes `/reset-password`/`/verify-email` (T6) match the links built in `service/auth.py` (T2) and the views' `?token` reads. Body keys `token`/`new_password`/`email` identical across client (T3), endpoints, and tests. Consistent.

One execution note: Task 4 moves `inputCls`/`primaryBtn` out of `AccountView.tsx` into `account/ui.ts`; `AccountView`'s `ChangePasswordForm` + `Profile` + the form all reference those names, so the import must land in the same commit (Task 4 Step 3) — they resolve unchanged. Task 6 then adds `Link` to AccountView; no conflict.
