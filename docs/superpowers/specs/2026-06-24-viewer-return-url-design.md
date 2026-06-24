# Viewer return-URL on finish ("Done" / never-a-dead-end) — design

**Date:** 2026-06-24
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `web-viewer/` only (the runner). No service / Identity / schema changes.
**Roadmap item:** #3 (the keystone) of `docs/participant-app-roadmap.md`. Owner picked this first.

---

## 0. Context

The runner is a full-screen, shell-less surface entered via `?deployment=` / `?invite=` / `?fixture=`
(`main.tsx` → `runQuestionnaire`). Its terminal screens — **finished** (`App.tsx:520`), **declined**
(`App.tsx:487`), **completed/already-completed** (`App.tsx:547`) — offer **no way back**: the only
forward motion is the deployment's own `redirect_url` (PA-4, finished screen only, auto after 3 s).
A participant who finishes (or declines, or revisits a completed link) is **stranded** — the owner hit
exactly this ("stuck at the Thank-you screen"). Launch params are parsed by `parseParams` in
`bootstrap.ts` (`Params = {deploymentId, locale, vsBaseUrl, fixture, theme, identityBaseUrl, invite}`).

This slice adds a launch-time **return URL** so whoever opens the player (the participant app,
library-web, or any embedder) can bring the participant back when they're done. It's deliberately
**web-viewer-only** and auth-free, so it is safe to build before the separate-origins project split.

---

## 1. Scope (locked)

**In scope:** a `?return_url=` launch param (validated http(s)); a manual **"Done"** button on the
**finished**, **declined**, and **completed** screens that navigates to it; the runner is never a
dead-end.

**Out of scope:** auto-redirect for `return_url` (manual only — owner decision); an origin allowlist
(deferred; can layer later); any change to the deployment `redirect_url` behavior (unchanged); the
participant-app wiring that *sets* `return_url` (that's roadmap #2/#4); library-web (#5); auth/token
handoff (the separate-origins concern, #1).

---

## 2. Decisions (owner, 2026-06-24)

- **`return_url` is a launch param**, parsed in `parseParams` → `Params.returnUrl: string | null`.
- **Validated, manual only.** `return_url` is accepted **only if it parses as a well-formed `http:`/
  `https:` URL** (anything else — `javascript:`, `data:`, relative, garbage — is treated as absent).
  It is surfaced **only as a user-clicked "Done" button** — **no silent auto-redirect** (open-redirect
  posture: the user initiates the navigation).
- **Complementary to `redirect_url`, not competing.** The deployment's `redirect_url` keeps its
  existing role (the researcher's study-protocol auto-redirect, 3 s, finished screen). `return_url` is
  the participant's manual "back to where I came from." Both may be present; they don't interact.
- **Never a dead-end.** The "Done" button appears on **finished / declined / completed** whenever a
  valid `return_url` is present. With no `return_url`, those screens keep their current copy (the
  honest "you can close this window" / thank-you), unchanged.

---

## 3. Architecture & units (web-viewer only)

### `bootstrap.ts`
- A pure helper **`safeReturnUrl(raw: string | null): string | null`** — returns `raw` iff
  `new URL(raw)` succeeds **and** its `protocol` is `http:` or `https:`; else `null`. (Wrapped in
  try/catch — `new URL` throws on invalid input.)
- `Params` gains **`returnUrl: string | null`**; `parseParams` sets it to
  `safeReturnUrl(qs.get('return_url'))`.

### `chrome/strings.ts`
- Add **`done`** to both `en` and `pt` (e.g. en `'Done'`, pt `'Concluído'`).

### `App.tsx`
- Read `const returnUrl = params.returnUrl` (already have `params`).
- A tiny local presentational element (inline, or a 3-line helper) — a styled **link button**
  `<a href={returnUrl}>` rendered when `returnUrl` is non-null — added to the three terminal branches:
  - **finished** (`:520`) — below the redirect line / score summary.
  - **declined** (`:487`) — below `declined_body`.
  - **completed** (`:547`) — below `completed_body`.
- Use an `<a href>` (not a JS handler) so it's a real, inspectable navigation target; style it with the
  existing button classes (e.g. `rounded-lg bg-primary px-5 py-2.5 text-white font-medium`) and mark it
  `qv-focusable` for keyboard/focus parity with other primary actions.

No state-machine, mint, events, or service changes. `return_url` never touches the session/outbox.

---

## 4. Data flow

launch `…?deployment=…&return_url=https%3A%2F%2Fapp.example%2Fdone`
→ `parseParams` validates → `Params.returnUrl`
→ run as normal (return_url is inert during the run)
→ terminal screen (finished/declined/completed) renders a **"Done"** `<a href=returnUrl>`
→ participant clicks → browser navigates to the launcher. (No auto-redirect; no event.)

---

## 5. Error handling

- `return_url` absent / empty / non-http(s) / unparseable → `safeReturnUrl` returns `null` → no Done
  button; the screens render exactly as today (no regression, never a crash).
- A present-but-unreachable `return_url` is the browser's problem once clicked (same as any link); the
  player has already done its job by surfacing it.
- `return_url` and `redirect_url` both present → both render (auto study-redirect **and** a manual Done
  link); independent, no precedence logic.

---

## 6. Testing

- **`bootstrap.test.ts`** — `safeReturnUrl`: accepts `http://…` and `https://…` (returned verbatim);
  returns `null` for `null`, `''`, `'javascript:alert(1)'`, `'/relative'`, `'ftp://x'`, `'not a url'`.
  `parseParams('?return_url=https://app.example/x')` → `returnUrl === 'https://app.example/x'`;
  `parseParams('?return_url=javascript:alert(1)')` → `returnUrl === null`.
- **`App.test.tsx`** — with `?return_url=https://app.example/done`: completing a run shows the **finished**
  screen with a **"Done"** link whose `href === 'https://app.example/done'`; the **completed** screen
  (revisit an already-completed session) shows the Done link; the **declined** screen (decline a consent
  deployment) shows the Done link. Without `return_url`, none of the three screens render a Done link
  (the existing finished/declined/completed tests stay green).
- web-viewer full suite + clean build.

---

## 7. Deliverable gate

Launching the player with `?return_url=<http(s) url>` shows a **"Done"** button on the finished,
declined, and already-completed screens that navigates back to that URL; an invalid/absent `return_url`
leaves the screens unchanged; the deployment `redirect_url` behavior is untouched. Web-viewer suite +
build green. No service/schema/Identity change.

---

## 8. References

- `web-viewer/src/app/bootstrap.ts` (`Params`, `parseParams`), `src/app/App.tsx` (the three terminal
  branches `:487`/`:520`/`:547`), `src/app/chrome/strings.ts`, `src/app/bootstrap.test.ts`,
  `src/app/App.test.tsx`.
- `docs/participant-app-roadmap.md` (#3 keystone; complements PA-4's `redirect_url`,
  [[project_participant_pa_4]]).
