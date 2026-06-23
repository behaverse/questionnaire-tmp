# Email slice — verify-email + password-reset + a real mailer (design)

**Date:** 2026-06-23
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `identity-service/` (modify) + `web-viewer/` (modify). Builds on PA-1/2/3.
**Decision basis:** owner review 2026-06-23 — the "email slice" deferred from PA-3. Owner decisions:
**both flows** (verify-email + password-reset; resend-verification out of scope); **console-fallback
mailer** (zero-setup dev; SMTP when configured). See [[project_participant_app_plan]],
[[project_participant_pa_3]].

---

## 0. Context

Identity already has the endpoints — `POST /v1/auth/verify-email` `{token}` (204), `request-password-reset`
`{email}` (202, no enumeration), `reset-password` `{token, new_password≥8}` (204) — but they're
**unusable**: the mailer is a `NullMailer` (records, sends nothing) and the email body is a **raw token**
(`f"verify token: {raw}"`), not a link, and Identity has no web-viewer base URL to build one. `mailer.py`
already defines a `Mailer` Protocol (`send(to, subject, body) -> None`), so a real sender swaps in
cleanly. `_mailer = NullMailer()` is module-level in `api/auth.py`; both `register` and
`request_password_reset` (in `service/auth.py`) take the mailer + `settings`. App error envelope is
`{"error":{"code","message"}}` (global handler). The verify token is issued ONLY at register (no resend
endpoint).

Web Viewer: routes via `ParticipantApp` (a `useRoute()` switch) under `NavShell`; new views read
`?token` from `window.location.search` (parseParams doesn't carry it). `session/client.ts` has
login/refresh/logout/fetchMe/register/changePassword — no verify/reset calls yet. `AccountView` login
side is where a "Forgot password?" link goes.

---

## 1. Scope (locked)

**In scope:** a config-driven mailer (SMTP when configured, else a console logger; NullMailer for tests)
+ a web-viewer base URL config; register/reset emails that contain real **links**; web-viewer
`verifyEmail`/`requestPasswordReset`/`resetPassword` client calls; a `ResetPasswordView` (request +
set-new modes), a `VerifyEmailView` (auto-verify), a "Forgot password?" link, and the two new routes.

**Out of scope:** resend-verification (no endpoint today — a later nicety); email-change; gating
anything on `email_verified`; HTML email templates / deliverability tuning; a deployed prod SMTP setup.

---

## 2. Decisions

- **Mailer is config-selected.** `make_mailer(settings)` → `SmtpMailer` when `SMTP_HOST` is set, else
  `ConsoleMailer` (logs the full message incl. the link via the stdlib logger). `NullMailer` stays for
  tests. So local dev is **zero-setup** (copy the link from the Identity console) and prod/dev-catcher
  works by setting `SMTP_*`. The two handlers use `make_mailer(get_settings())` (replacing the
  module-level `_mailer`).
- **Emails carry links, built by the service** from a new `web_viewer_base_url` config
  (`WEB_VIEWER_BASE_URL`, default `http://localhost:5173`): verify →
  `{base}/verify-email?token=<raw>`, reset → `{base}/reset-password?token=<raw>`. Body is a short
  human message wrapping the link.
- **Public views.** `ResetPasswordView` + `VerifyEmailView` render for logged-out users (under
  `NavShell`, like the other views). They read `?token` from `window.location.search`.
- **ResetPasswordView is one view, two modes:** no `?token` → request-reset form (email →
  `requestPasswordReset` → always a generic "If an account exists for that email, we've sent a reset
  link." — preserving the no-enumeration property); with `?token` → set-new-password form (new ≥ 8 →
  `resetPassword` → success → a link to sign in).
- **VerifyEmailView auto-verifies** the `?token` on mount → "Email verified." / "This link is invalid
  or expired." (missing token → invalid).

---

## 3. Architecture & units

### Identity (`identity-service/`)
- **`config.py`** — add to `Settings` + `get_settings()`: `web_viewer_base_url` (`WEB_VIEWER_BASE_URL`,
  default `http://localhost:5173`); `smtp_host`/`smtp_port` (default 587)/`smtp_username`/`smtp_password`/
  `smtp_from` (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_FROM`).
- **`mailer.py`** — keep `Mailer` Protocol + `NullMailer`. Add `ConsoleMailer` (`send` logs `to/subject/
  body` via `logging.getLogger("identity.mailer").info(...)`); `SmtpMailer(host, port, username,
  password, sender)` (`send` builds an `email.message.EmailMessage`, `smtplib.SMTP(host, port)` +
  `starttls()` + `login()` if creds + `send_message`); `make_mailer(settings) -> Mailer` (`SmtpMailer`
  when `settings.smtp_host` else `ConsoleMailer`).
- **`service/auth.py`** — in `register`: build `link = f"{settings.web_viewer_base_url}/verify-email?token={raw}"`,
  `mailer.send(email, "Verify your email", f"Verify your email: {link}")`. In `request_password_reset`:
  `link = f"{settings.web_viewer_base_url}/reset-password?token={raw}"`,
  `mailer.send(email, "Reset your password", f"Reset your password: {link}")`.
- **`api/auth.py`** — remove the module-level `_mailer`; in `register` + `request_reset` use
  `make_mailer(s)` (from `..mailer`). (`s = get_settings()` is already in scope.)

### Web Viewer (`web-viewer/`)
- **`src/session/client.ts`** — add:
  - `verifyEmail(identityBaseUrl, token) -> {ok:true} | {ok:false, error:'invalid'|'network'}` (POST
    `/v1/auth/verify-email` `{token}`; 204→ok, 400→invalid, else/thrown→network).
  - `requestPasswordReset(identityBaseUrl, email) -> {ok:true} | {ok:false, error:'network'}` (POST
    `/v1/auth/request-password-reset` `{email}`; 202→ok, else/thrown→network).
  - `resetPassword(identityBaseUrl, token, newPassword) -> {ok:true} | {ok:false, error:'invalid_token'|'weak_password'|'network'}`
    (POST `/v1/auth/reset-password` `{token, new_password}`; 204→ok, 400→invalid_token, 422→weak_password,
    else/thrown→network).
- **`src/account/ResetPasswordView.tsx`** — `const token = new URLSearchParams(window.location.search).get('token')`.
  Token absent → request form (email → `requestPasswordReset` → generic accepted message; network →
  error). Token present → set-new form (validate ≥ 8 before call → `resetPassword` → ok: "Password
  reset — you can now sign in." + `<Link to="/account">`; `invalid_token`: "This reset link is invalid
  or expired."; `weak_password`: length msg; network: error).
- **`src/account/VerifyEmailView.tsx`** — read `token`; missing → invalid message; else `useEffect` →
  `verifyEmail(token)` → states: verifying / "Email verified." (+ `<Link to="/account">` to sign in) /
  "This link is invalid or expired."
- **`src/account/AccountView.tsx`** — on the login tab, a "Forgot password?" `<Link to="/reset-password">`.
- **`src/shell/ParticipantApp.tsx`** — add `route === '/reset-password' → <ResetPasswordView/>` and
  `route === '/verify-email' → <VerifyEmailView/>`.

Identity views are styled with the existing `inputCls`/`primaryBtn` + zinc palette.

---

## 4. Data flow

**Forgot password:** `/reset-password` (no token) → email form → Identity emails a link (console log
locally, or SMTP) → click `{base}/reset-password?token=…` → set-new form → `reset-password` (revokes
all sessions, per existing service behavior) → sign in. **Verify:** register emails
`{base}/verify-email?token=…` → click → `VerifyEmailView` auto-verifies → `email_verified=true`.

---

## 5. Error handling

- request-password-reset always returns the generic accepted message (no account enumeration); only a
  network failure shows an error.
- reset-password: bad/expired token → `invalid_token` message; new < 8 → caught client-side (server 422
  → `weak_password` defensive).
- verify-email: bad/expired/missing token → "invalid or expired" message.
- SmtpMailer send failure surfaces as a 5xx from the originating endpoint only if it raises; for
  request-password-reset (always 202) a send failure is logged, not surfaced (preserves no-enumeration).
  (ConsoleMailer never fails.)

---

## 6. Testing

- **Identity** (own pytest; testcontainers): `make_mailer` returns `SmtpMailer` when `smtp_host` set
  else `ConsoleMailer`; `ConsoleMailer.send` logs the body (capture via `caplog`); register's email body
  contains `{web_viewer_base_url}/verify-email?token=<raw>` and request-reset's contains
  `/reset-password?token=<raw>` (assert via an injected `NullMailer`); the existing verify/reset service
  flow still works (token parsed from the link still verifies / resets). `NullMailer` interface unchanged
  (existing tests stay green).
- **Web Viewer** (vitest + fetch stub): the 3 client calls map their statuses; `ResetPasswordView`
  request-mode (generic message, posts email) + token-mode (success, invalid_token, short-new-no-post);
  `VerifyEmailView` auto-verify success + invalid; the "Forgot password?" link; `ParticipantApp` routes
  `/reset-password` + `/verify-email`.
- Both full suites pass + web-viewer clean build.

---

## 7. Deliverable gate

- Locally (console mailer): register → the Identity console shows a verify link → opening
  `/verify-email?token=…` verifies the account; "Forgot password?" → request → the console shows a reset
  link → opening `/reset-password?token=…` sets a new password that then logs in. With `SMTP_HOST` set,
  the same emails go to SMTP/Mailpit. No resend endpoint; both suites + build green.

---

## 8. References

- `identity-service/src/identity_service/{mailer.py,config.py,service/auth.py (register/request_password_reset/reset_password/verify_email),api/auth.py,api/app.py}`; `tests/test_auth_service.py` (NullMailer.sent token-parse pattern).
- `web-viewer/src/session/client.ts`, `src/account/AccountView.tsx`, `src/shell/{ParticipantApp.tsx,router.tsx}`; `src/account/AccountView.test.tsx` + `src/shell/ParticipantApp.test.tsx` (test patterns).
- [[project_participant_pa_3]] (the deferred-email decision), [[project_participant_pa_2]] (routing + AccountView), [[project_participant_app_plan]].
