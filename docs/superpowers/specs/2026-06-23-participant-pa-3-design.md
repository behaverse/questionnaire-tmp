# PA-3 — Change password (logged-in) (design)

**Date:** 2026-06-23
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `identity-service/` (modify — first PA slice to extend Identity) + `web-viewer/` (modify).
**Decision basis:** owner review 2026-06-23 — PA-3 scoped to **change-password only**; email verification +
password reset + a real mailer are **deferred** to a later "email" slice (they dead-end without delivery —
the mailer is a `NullMailer` stub). Third Participant App slice; follows PA-2
([[project_participant_pa_2]]). See [[project_participant_app_plan]].

---

## 0. Context

Identity already has the full auth surface EXCEPT a **change-password** endpoint (confirmed: `api/auth.py`
has register/login/refresh/logout/me/verify-email/request-password-reset/reset-password — no
change-password). A logged-in participant therefore cannot change their password without the
email-reset flow, which is itself unusable locally (`mailer.py` is a `NullMailer` that records the token
to an in-memory list and sends nothing — `api/auth.py` `_mailer = NullMailer()`).

Existing patterns PA-3 mirrors:
- `api/auth.py`: routes wrap service calls in `_handle()` which maps `auth.AuthError` → `HTTPException`
  (`status_code=e.status, detail={"code": e.code, "message": e.message}`). `GET /v1/auth/me` authenticates
  via `claims=Depends(require_access)` (`api/deps.py` — verifies the Bearer access JWT against the
  service's own JWKS; returns claims with `sub`/`aud`/`roles`).
- `service/auth.py`: `AuthError` subclasses (code/status/message); `passwords.verify_password(plain,
  hashed)` + `passwords.hash_password(plain)` (Argon2id); `ustore.by_id(conn, user_id)` (row has
  `password_hash`) + `ustore.set_password(conn, user_id, hash)` (used by `reset_password`).
- web-viewer `src/session/client.ts`: typed Identity calls (login/refresh/logout/fetchMe/register) +
  `authFetch` (`makeAuthFetch`: Bearer + single-flight refresh-on-401). `AccountView.tsx` authed
  `Profile` card shows email/display_name/roles + an "email not verified" amber note + Log out.

---

## 1. Scope (locked)

**In scope:** a new Identity `POST /v1/auth/change-password` (Bearer; old+new password); a
`changePassword` web-viewer client call (via `authFetch`); a **"Change password"** section in the
`AccountView` authed profile.

**Out of scope (deferred to the "email" slice):** email verification UI, forgot/reset-password UI, a
real SMTP mailer; revoke-other-sessions-on-change; display-name editing; any change to the
participant-flow VS/Library (Identity is consumed by them only as a token verifier — an additive
endpoint doesn't affect them).

---

## 2. Decisions

- **New endpoint `POST /v1/auth/change-password`** — Bearer access token (authenticated user =
  `claims["sub"]`, via `require_access`, exactly like `/me`); body `{old_password, new_password}` with
  `new_password` min 8 (Pydantic). Verifies `old_password` against the stored Argon2 hash; on success
  sets the new hash → `204`.
- **Wrong current password → `403 {code:"wrong_password"}`** — a NEW `WrongPassword(AuthError)`
  (status 403). Deliberately **not 401**: the web-viewer calls this via `authFetch`, whose 401 handler
  silently refreshes + retries; a 401 for a wrong password would be misread as an expired token. 403
  keeps the two cases distinct (401 = expired/invalid access token; 403 = wrong current password; 422 =
  new password too short).
- **No session revocation.** The change updates only the password hash; current + other sessions keep
  working. (Password *reset* — the compromise-recovery path — revokes all; that lands with the email
  slice.) "Log out other devices on change" is a logged follow-up.
- **Client uses `authFetch`** so an access token that expires mid-form auto-refreshes + retries, while a
  403 (wrong password) is surfaced to the caller unchanged.

---

## 3. Architecture & units

### Identity (`identity-service/`)
- **`models.py`** — `class ChangePasswordIn(BaseModel): old_password: str; new_password: str =
  Field(min_length=8)`.
- **`service/auth.py`** — `class WrongPassword(AuthError): code="wrong_password"; status=403;
  message="Current password is incorrect."` and
  `change_password(conn, *, user_id, old_password, new_password) -> None`: `user = ustore.by_id(conn,
  user_id)`; if `user is None or not passwords.verify_password(old_password, user["password_hash"])`
  raise `WrongPassword()`; else `ustore.set_password(conn, user_id, passwords.hash_password(new_password))`.
- **`api/auth.py`** — `@router.post("/v1/auth/change-password", status_code=204)` with
  `body: ChangePasswordIn, claims=Depends(require_access), conn=Depends(get_conn)`; calls
  `auth.change_password(conn, user_id=claims["sub"], old_password=…, new_password=…)` inside `_handle` +
  `conn.commit()` (so `WrongPassword` → 403 via the existing mapper). Import `ChangePasswordIn` +
  `require_access` (deps already exports it).

### Web Viewer (`web-viewer/`)
- **`src/session/client.ts`** — `changePassword(authFetch: AuthFetch, identityBaseUrl: string,
  oldPassword: string, newPassword: string) -> Promise<{ok:true} | {ok:false, error:'wrong_password' |
  'invalid' | 'network'}>`: `authFetch(`${identityBaseUrl}/v1/auth/change-password`, {method:'POST',
  headers JSON, body {old_password, new_password}})`; `204`→ok, `403`→wrong_password, `422`→invalid,
  else/thrown→network. (`AuthFetch` injects the Bearer + refreshes on 401.)
- **`src/account/AccountView.tsx`** — extend the authed `Profile` with a **"Change password"** section
  (current password + new password inputs, a submit button) below the profile `dl`, above Log out.
  Submit: validate `new.length >= 8` before the call (else inline "at least 8 characters"); call
  `changePassword(session.authFetch, params.identityBaseUrl, current, next)`; on ok → clear the fields +
  show "Password updated."; map `wrong_password`→"Current password is incorrect.",
  `invalid`→length message, `network`→"Network error — try again." `session.authFetch` +
  `parseParams(...).identityBaseUrl` are already available in the view.

---

## 4. Data flow

Signed-in participant → Account (`/account`, authed profile) → enters current + new password → submit →
`changePassword` POSTs via `authFetch` (Bearer auto-attached; refresh-on-401 if the access token
expired) → Identity verifies the old password, sets the new hash → `204` → "Password updated."; the
participant stays logged in (no revocation). A subsequent login uses the new password; the old one no
longer works.

---

## 5. Error handling

- Wrong current password → 403 `wrong_password` → "Current password is incorrect." (NOT auto-retried by
  authFetch).
- New password < 8 → client rejects before the call; server also enforces (422 → "at least 8 characters").
- Expired access token → authFetch refreshes + retries transparently; only a true auth failure (refresh
  also fails) surfaces — the session goes anon and the profile yields to the login view.
- Network/other → "Network error — try again."

---

## 6. Testing

- **Identity** (its own pytest, `DOCKER_CONFIG=/tmp/lib_docker`): with a valid Bearer + correct old
  password → 204 and the user can log in with the NEW password and NOT the old; wrong old password →
  403 `wrong_password`; new password < 8 → 422; missing/invalid Bearer → 401. (Use the existing test
  client + token-mint helpers.)
- **Web Viewer** (vitest + `vi.stubGlobal('fetch', …)` + the `<SessionProvider>` render-helper):
  `changePassword` maps 204→ok, 403→wrong_password, 422→invalid, thrown→network, and posts
  `{old_password,new_password}` to `/v1/auth/change-password`. AccountView (authed, via a stored-token
  boot): the change-password form is shown; a successful submit shows "Password updated." and posts to
  the endpoint; a 403 shows "Current password is incorrect."; a < 8 new password shows the validation
  message and does NOT post.
- Both full suites pass + web-viewer clean build.

---

## 7. Deliverable gate

- A signed-in participant changes their password from the Account page and stays logged in; the new
  password works on the next login and the old one is rejected. Wrong current password and a too-short
  new password are surfaced clearly. No mailer/email work; no VS/Library change; both suites + build green.

---

## 8. References

- `identity-service/src/identity_service/{api/auth.py,api/deps.py (require_access),service/auth.py (AuthError/login/reset_password),models.py,passwords.py,store/users.py (by_id/set_password)}`.
- `web-viewer/src/session/{client.ts,authFetch.ts,SessionProvider.tsx}`, `src/account/AccountView.tsx`, `src/app/bootstrap.ts` (parseParams).
- [[project_participant_pa_2]] (AccountView + session client), [[project_identity_id_a]] (token/password model), [[project_participant_app_plan]].
