# PA-1 — Participant session foundation (design)

**Date:** 2026-06-23
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `web-viewer/` (modify; new `src/session/` module). Identity service FROZEN (consumed only).
**Decision basis:** owner review 2026-06-23 — consolidate the fragmented participant front-end into one
app with a persistent session; **PA-1 first** (session + logout). See [[project_participant_app_plan]].
First slice of the Participant App track; follows the PP-A..D participant flow.

---

## 0. Context

The participant front-end holds the Identity access token **in memory only** (`App.tsx`
`accessTokenRef`; `MyDataApp.tsx` `useState`), and `loginParticipant` (`src/app/auth.ts`) **throws away
the refresh token**. Result: a page refresh logs you out, "come back later" needs re-login, and there
is **no logout**. Identity already supports the full lifecycle:
- `POST /v1/auth/login` → `{access_token, refresh_token, expires_in, token_type:"Bearer"}` (body
  `{email, password, audience:"questionnaire-apps"}`; 401 on bad creds).
- `POST /v1/auth/refresh` (body `{refresh_token}`) → same shape, **rotates** the refresh token (new one
  each call); reuse/expired → `401 {code:"refresh_reuse"|...}` and the token family is revoked.
- `POST /v1/auth/logout` (body `{refresh_token, all_sessions?:bool}`) → `204`; missing token still 204.
- `GET /v1/auth/me` (Bearer access token) → `{id, email, display_name, email_verified, roles}`.
- Access TTL 900s (15 min); refresh TTL 2,592,000s (30 days). **No cookies** — all body/Bearer JSON.

Identity is reached **cross-origin** with no cookie support, so the refresh token must persist in
**localStorage** (owner decision 2026-06-23). The only browser storage used today is IndexedDB for
resume (`src/resume/store.ts`); PA-1 introduces a single localStorage key for the refresh token.

PA-1 builds a shared session layer and rewires the existing pages onto it. Account creation, the full
nav shell, and account-management screens are **PA-2+**.

---

## 1. Scope (locked)

**In scope:** a `src/session/` module (storage + Identity client + `SessionProvider` context +
`authFetch`); persistent login (silent refresh on boot + on 401); logout (server revoke + local clear);
rewiring the runner, my-data, and catalogue pages onto the session; a **minimal** "signed in as … ·
Log out" strip on the catalogue + my-data (the only new UI).

**Out of scope:** register UI, the polished nav shell, account/profile/password/verify screens, consent
(all PA-2+); httpOnly-cookie hardening; multi-tab storage-event sync; proactive pre-expiry refresh
timer; any `identity-service/` change.

---

## 2. Decisions

- **Refresh token in localStorage**, single key `behaverse.participant.refresh`. Access token stays
  in memory (never persisted). Mitigations: 15-min access tokens + rotating refresh + family-revoke on
  reuse. (XSS-readable — accepted for a research participant app; httpOnly-cookie hardening deferred.)
- **Silent refresh** on two triggers: app boot (if a stored refresh token exists) and on any `401` from
  an authed request. No proactive timer (YAGNI). Refresh is **single-flight** — one shared in-flight
  promise so concurrent 401s trigger exactly one refresh.
- **Logout = this session only** (`all_sessions:false`): revoke the current refresh token server-side,
  then clear localStorage + memory. Local clear happens even if the network call fails. ("Log out
  everywhere" deferred to account management.)
- **Browsing stays public.** The catalogue renders for anon users; login is triggered only where
  needed (an `authenticated` deployment in the runner; the my-data page). When `authed`, a minimal
  logout strip appears.
- **Rewire, don't rewrite.** The runner + my-data keep their flows; they consume the session's access
  token + `authFetch` instead of their own ad-hoc token state.

---

## 3. Architecture & units (`web-viewer/src/session/`)

- **`storage.ts`** — `loadRefreshToken(): string | null`, `saveRefreshToken(t: string): void`,
  `clearRefreshToken(): void` over `localStorage[behaverse.participant.refresh]`. The ONLY module that
  touches storage. (Guards against `localStorage` throwing in private-mode/SSR.)
- **`client.ts`** — typed Identity calls (no React):
  - `login(identityBaseUrl, email, password) -> {ok:true, access, refresh, expiresIn} | {ok:false, error:'invalid_credentials'|'network'}` (tokens only; the provider loads `user` via `fetchMe` afterward)
  - `refresh(identityBaseUrl, refreshToken) -> {ok:true, access, refresh, expiresIn} | {ok:false, error:'expired'|'network'}`
  - `logout(identityBaseUrl, refreshToken) -> void` (best-effort; swallows errors)
  - `fetchMe(identityBaseUrl, access) -> {ok:true, user} | {ok:false}` where `user = {id, email, display_name, email_verified, roles}`.
  - `audience` is the constant `"questionnaire-apps"`. (Folds in today's `loginParticipant`, keeping
    the refresh token instead of discarding it.)
- **`SessionProvider.tsx`** — context value
  `{ status: 'loading'|'authed'|'anon', user: User|null, login(email,password): Promise<LoginOutcome>, logout(): Promise<void>, authFetch }`.
  - boot effect: stored refresh? → `refresh()` → `fetchMe()` → `authed`; else/failure → clear → `anon`.
  - `login()` → on success persist refresh, hold access in memory, then `fetchMe()` to load `user` → `authed`.
  - `logout()` → `client.logout(storedRefresh)` then clear → `anon`.
  - exposes `useSession()` hook.
- **`authFetch.ts`** — `makeAuthFetch(getAccess, doRefresh)` → `authFetch(url, init)` that adds
  `Authorization: Bearer <access>`, and on `401` runs the **single-flight** `doRefresh()` then retries
  once; if refresh fails, surfaces the 401 and the provider transitions to `anon`. Provided via context
  so pages call `session.authFetch`.

Each unit is small and independently testable: storage (no network), client (fetch-stub), provider
(boot/login/logout/refresh state), authFetch (single-flight + retry).

---

## 4. Integration (rewiring existing pages)

- **`main.tsx` / `mydata/main.tsx`** — wrap each rendered app in `<SessionProvider>` (reads
  `identityBaseUrl`/`vsBaseUrl` from `parseParams`). The root App-vs-Home switch is unchanged.
- **Runner `App.tsx`** — remove `accessTokenRef` + the inline `loginParticipant` handler; read the
  access token from `useSession()` for `mintSession`. An `authenticated` deployment that returns
  `401 auth_required` and an `anon` session → render the shared `LoginView` driven by `session.login`;
  on success, re-mint. Anonymous / invite / fixture paths unchanged. Response submission still uses the
  VS `session_token` from the mint (untouched).
- **`mydata/MyDataApp.tsx`** — drop local token state; if `session.status==='anon'` show `LoginView`
  (via `session.login`); list + CSV download go through `session.authFetch`.
- **`home/HomeApp.tsx`** — unchanged catalogue, plus a minimal strip: when `authed`, show
  `Signed in as <email> · Log out` (calls `session.logout`); when anon, nothing. (Full shell = PA-2.)

`LoginView` (`src/app/chrome/LoginView.tsx`) is reused as-is (props `{onSubmit, error, busy}`).

---

## 5. Data flow

**Return visit:** open app → boot reads localStorage → `refresh()` (rotates) → `fetchMe()` →
`authed` + `user` → catalogue/my-data show data, no re-login. **Access expiry:** next `authFetch` →
`401` → single-flight `refresh()` → retry → succeeds. **Logout:** revoke + clear → `anon`.

---

## 6. Error handling

- Refresh `401` (reuse/expired) → clear storage, `anon`; if on a protected view, show `LoginView`.
- Boot-refresh network failure → `anon` (never hard-fail the app shell).
- Logout network failure → still clear locally → `anon`.
- Concurrent 401s → single in-flight refresh promise (no stampede).
- `localStorage` unavailable (private mode) → treat as no stored token; login works for the session,
  just doesn't persist.

---

## 7. Testing (vitest + `vi.stubGlobal('fetch', …)`, existing pattern)

- **storage:** save/load/clear round-trip; load with nothing → null; tolerates a throwing localStorage.
- **client:** login posts `{email,password,audience}` and returns tokens; 401 → `invalid_credentials`;
  refresh posts `{refresh_token}` and returns the rotated token; refresh 401 → `expired`; logout posts
  `{refresh_token}`; `fetchMe` sends Bearer and parses the user.
- **SessionProvider:** boot with a stored refresh → `authed` + user (simulates "come back later"); boot
  with none → `anon`; login → `authed` and refresh token persisted; **simulated reload** (new provider,
  same localStorage) → `authed` without re-login; logout → `anon` + revoke called + storage cleared;
  refresh-failure on boot → `anon`.
- **authFetch:** injects Bearer; on 401 refreshes once + retries; two concurrent 401s → exactly one
  refresh call (single-flight); refresh failure → surfaces 401 + provider goes `anon`.
- **Integration:** the existing runner authed-boot test and the my-data login test still pass through
  the session (updated to the provider). Full `web-viewer` suite green + clean `npm run build`.

---

## 8. Deliverable gate

- Log in once, refresh the page (or reopen later) → still logged in (the keystone fix), verified by the
  reload test. **Log out** works (server revoke + local clear). The runner's authenticated-deployment
  flow and my-data both run through the shared session. No `identity-service/` change; full suite +
  build green.

---

## 9. References

- `web-viewer/src/app/{auth.ts,App.tsx,bootstrap.ts,chrome/LoginView.tsx}`, `src/mydata/{MyDataApp.tsx,client.ts}`, `src/home/HomeApp.tsx`, `src/main.tsx`, `src/resume/store.ts` (storage pattern).
- Identity: `identity-service/src/identity_service/api/auth.py` + `service/auth.py` (login/refresh/logout/me).
- [[project_participant_app_plan]] (the PA track), [[project_participant_pp_a]] (current auth-at-mint flow), [[project_identity_id_a]] (token contract).
