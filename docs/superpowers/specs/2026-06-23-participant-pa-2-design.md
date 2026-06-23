# PA-2 — Register + unified nav shell + consolidated app (design)

**Date:** 2026-06-23
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `web-viewer/` (modify; new `src/shell/` + `src/account/`). Identity service FROZEN (consumed only).
**Decision basis:** owner review 2026-06-23 — consolidate the participant front-end into one app. PA-2
follows PA-1 ([[project_participant_pa_1]]); see [[project_participant_app_plan]]. Owner decisions:
**single SPA with clean path URLs**; **register auto-logs-in**.

---

## 0. Context

After PA-1 the participant front-end is one persistent session ([[project_participant_pa_1]]:
`src/session/` — `useSession()` → `{status:'loading'|'authed'|'anon', user, accessToken, login, logout,
authFetch}`) but still **three HTML entries**: `index.html` (`main.tsx`: `SessionProvider` → runner
`<App/>` when `deployment`/`invite`/`fixture` present, else `<HomeApp/>`), `home.html`
(`src/home/main.tsx` — renders `<HomeApp/>` **without** a `SessionProvider`, so it currently **crashes**
on `SessionStrip`'s `useSession()`), `mydata.html` (`src/mydata/main.tsx` — wrapped). Navigation is
full-page via `carry()` hrefs; there is **no register UI, no nav between pages, no shell**.

Identity already supports register: `POST /v1/auth/register` body `{email, password (min 8),
display_name, audience}` → `201` returns the **profile** `{id, email, display_name, email_verified,
roles}` (NOT tokens — must login after); `409 {code:"email_in_use"}` if the email exists; `422` if the
password is < 8. New accounts get the `researcher` role. A verify email is "sent" via a mailer that, in
this stack, only logs the token (no real delivery) — so `email_verified` stays false; email
verification is out of scope here.

The web-viewer is **not deployed** (root `vercel.json` deploys only `library-web/`), so there is no prod
routing config to satisfy now; Vite dev serves `index.html` for unknown paths (SPA fallback) out of the
box.

PA-2 collapses the three entries into one SPA with a nav shell + path router and adds the account
(register/login/profile) surface.

---

## 1. Scope (locked)

**In scope:** a minimal path router; a persistent `NavShell` (header + nav + session area + logout); a
`register` client call; an `AccountView` (anon → login | register with register→auto-login; authed →
profile + logout); converting `HomeApp`→`CatalogueView` and `MyDataApp`→`MyDataView` (shell-chromed,
my-data gated to `/account` when anon); consolidating `main.tsx` into runner-or-`ParticipantApp`;
removing the `home.html`/`mydata.html` entries.

**Out of scope:** change password, email verification + a real mailer, password reset, "log out
everywhere", deep profile editing, prod SPA-fallback deploy config, any `identity-service/` change, any
runner (`App.tsx`) chrome change.

---

## 2. Decisions

- **Single SPA, clean path URLs.** One entry (`index.html`). Routes: `/` Catalogue, `/my-data` MyData,
  `/account` Account; unknown → Catalogue. The **runner** is still selected by
  `deployment`/`invite`/`fixture` params and rendered full-screen **without** the shell (unchanged).
- **No router dependency.** A ~40-line custom router (`history.pushState` + `popstate`), preserving the
  `viewer_url`/`identity_url` query params across client navigations.
- **Register auto-logs-in.** `register()` → on `201`, immediately `session.login(email, password)` →
  authed, land in the app. (`email_verified` stays false; ungated.)
- **Shell owns session chrome.** `NavShell` shows the signed-in email + Log out (or a Log in link when
  anon); the per-view `SessionStrip` usage is removed (the component may be deleted).
- **Start stays a full navigation.** A catalogue card's Start is an `<a href>` into the runner
  (`?deployment=…`) — a fresh runner boot, as today. Only catalogue/my-data/account are client-routed.
- **Remove `home.html` + `mydata.html`** (and their `main.tsx`); `gallery.html` stays (dev-only).

---

## 3. Architecture & units

### `src/shell/`
- **`router.tsx`** — `useRoute(): string` (current `location.pathname`), `navigate(path: string): void`
  (`pushState` to `path` + current search, then notify subscribers), `<Link to=… >` (anchor calling
  `navigate` + `preventDefault`); a `popstate` listener drives re-render. Query params
  `viewer_url`/`identity_url` are carried onto every `navigate`.
- **`NavShell.tsx`** — `<NavShell>{children}</NavShell>`: a header (brand; nav `<Link>`s Questionnaires
  `/` · My data `/my-data` · Account `/account`, active route highlighted; right side: when `authed`
  the user's email + a **Log out** button calling `session.logout`, when `anon` a **Log in** `<Link>` to
  `/account`) over the page background, rendering `children` (the active view).
- **`ParticipantApp.tsx`** — reads `useRoute()`; renders `<NavShell>` wrapping `CatalogueView` /
  `MyDataView` / `AccountView` per path (default Catalogue).

### `src/account/`
- **`AccountView.tsx`** — `anon`: a Login | Register toggle.
  - Login → `session.login` (existing).
  - Register → validate (email present, password ≥ 8) → `client.register(...)` → on ok
    `session.login(email,password)` → authed; map `email_in_use`/`invalid`/`network` to inline messages.
  - `authed`: a profile card — email, display name, roles, an "email not verified" note — + Log out.

### `src/session/client.ts` (extend)
- **`register(identityBaseUrl, email, password, displayName) -> {ok:true} | {ok:false, error:'email_in_use'|'invalid'|'network'}`**
  — POST `/v1/auth/register` `{email, password, display_name, audience:"questionnaire-apps"}`;
  `201`→ok, `409`→`email_in_use`, `422`→`invalid`, thrown→`network`.

### Views (convert, strip chrome)
- **`home/HomeApp.tsx` → `CatalogueView`** — the catalogue cards only (remove the outer
  `min-h-screen` container + `SessionStrip`; the shell provides them). Start `<a href>` into the runner
  unchanged.
- **`mydata/MyDataApp.tsx` → `MyDataView`** — the session list + CSV (remove outer chrome +
  `SessionStrip`); when `anon`, render "Log in to view your data" with a `<Link to="/account">`.

### Entry
- **`main.tsx`** — `SessionProvider` → `runQuestionnaire ? <App/> : <ParticipantApp/>` (runner
  unchanged). Delete `src/home/main.tsx`, `src/mydata/main.tsx`, `home.html`, `mydata.html`;
  `vite.config.ts` input drops `home`/`mydata` (keep `main`, dev `gallery`).

---

## 4. Routing model

`useRoute` returns `window.location.pathname`. `navigate(p)` → `history.pushState(null, '', p +
preservedSearch)` then fires a subscribed callback (module-level listener set) so `useRoute` consumers
re-render; a `window.addEventListener('popstate', …)` covers back/forward. `<Link>` renders an `<a
href={p}>` that calls `navigate(p)` on click (left-click, no modifier) and `preventDefault`. The runner
is NOT part of this router — it is selected at the top of `main.tsx` by query params and full-page
loads.

---

## 5. Error handling

- Register: weak password / empty email → inline validation before the call; `409 email_in_use` →
  "That email is already registered — log in instead."; `422` → "Password must be at least 8
  characters."; network → "Network error — try again." Login errors as in PA-1.
- Unknown route → Catalogue. Anon at `/my-data` → a prompt linking to `/account` (no hard redirect).
- `navigate`/`popstate` failures are inert (the view falls back to reading `location.pathname`).

---

## 6. Testing (vitest + `vi.stubGlobal('fetch', …)` + the `<SessionProvider>` render-helper pattern)

- **router:** `navigate` pushes the path + preserves `viewer_url`/`identity_url`; `useRoute` reflects
  it; `<Link>` click navigates without a full reload; `popstate` updates the route.
- **client.register:** posts `{email,password,display_name,audience}`; `409`→`email_in_use`,
  `422`→`invalid`, thrown→`network`.
- **NavShell:** renders the three nav links; shows email + Log out when authed (logout calls
  `session.logout`); shows Log in when anon; highlights the active route.
- **AccountView:** register success → auto-login → authed profile shown (one flow test asserting both
  the register POST and the follow-up login POST); register email-in-use shows the message; login works;
  authed shows the profile + Log out.
- **ParticipantApp:** path `/` → catalogue, `/my-data` → my-data (authed) / login-prompt (anon),
  `/account` → account; unknown → catalogue.
- Full `web-viewer` suite green + clean build (single entry; `dist/index.html`, no `home`/`mydata`).
  Runner (`App.tsx`) tests unchanged.

---

## 7. Deliverable gate

- One app: open `/`, browse; go to Account, **register a new account** → you're auto-logged-in and the
  shell shows your email; navigate to My data (client-side) and see your sessions; **Log out** from the
  shell. `home.html`/`mydata.html` are gone; the runner still starts from a catalogue card. Full suite +
  build green; no `identity-service/` change.

---

## 8. References

- `web-viewer/src/{main.tsx,vite.config.ts,home/HomeApp.tsx,mydata/MyDataApp.tsx,app/bootstrap.ts (parseParams), app/chrome/LoginView.tsx}`, `src/session/{SessionProvider.tsx,client.ts,SessionStrip.tsx}`.
- Identity: `identity-service/src/identity_service/{api/auth.py,service/auth.py (register, EmailInUse 409), models.py (RegisterIn min 8)}`.
- [[project_participant_pa_1]] (the session layer), [[project_participant_app_plan]] (the PA track), [[project_participant_pp_d]] (the catalogue).
