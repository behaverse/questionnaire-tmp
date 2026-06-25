# participant-session — Handoff

**Path:** `participant-session/` · **Stack:** TypeScript + React 19 (source-only, no build) · **Status:** ✅ built · **Suggested branch:** `work/participant-session`

> The shared participant **auth/session** layer: the single source of truth for participant login,
> consumed by **both** the portal (`participant-app`) and the player (`web-viewer`) via a source-path
> Vite/tsconfig alias `@behaverse/participant-session` (no build step).
> For deep detail see [README.md](README.md). There is no `FOLLOWUPS.md`.

## What it is
- `SessionProvider` / `useSession` ([src/SessionProvider.tsx](src/SessionProvider.tsx)) — persistent login
  via a localStorage refresh token, single-flight silent refresh on boot + on 401, `login` / `logout`,
  and the **SSO handoff boot path**: a `handoffCode` prop is exchanged once for this origin's own tokens
  when there's no stored session. Status is `loading | authed | anon`.
- `client` ([src/client.ts](src/client.ts)) — the Identity HTTP client: `login`, `refresh`, `logout`,
  `fetchMe`, `register`, `changePassword`, `verifyEmail`, `requestPasswordReset`, `resetPassword`, plus
  `mintHandoff` / `exchangeHandoff` (SSO). Audience is hard-coded `questionnaire-apps`.
- `authFetch` ([src/authFetch.ts](src/authFetch.ts)) — `makeAuthFetch(getAccess, doRefresh)`: a `fetch`
  that attaches the Bearer access token and, on 401, refreshes **once** (single-flight across concurrent
  calls) then retries.
- `storage` ([src/storage.ts](src/storage.ts)) — refresh-token persistence in localStorage
  (key `behaverse.participant.refresh`); all reads/writes are try/catch (private-mode safe).
- Fits the system as the keystone of the participant flow (PA-1 → SSO #1-SSO): portal mints a handoff,
  player exchanges it on boot, so authenticated deployments don't re-login on the player origin.

## Run & test
There is **no build step** and **no own test suite** — the package is consumed by source alias, so it's
exercised through the two host apps. Tests live in **participant-app** (`src/session/*.test.*`, its
primary auth consumer) and **web-viewer**. To exercise it:

```bash
# from the consuming app, e.g. participant-app/ or web-viewer/
npm install
npm test          # runs the suites that import the aliased source
npm run dev       # portal :5174 / player :5173
```

Consumers must wire **both** of these (see each app's `vite.config.ts` + `tsconfig.json`):
- `resolve.alias['@behaverse/participant-session'] = '../participant-session/src/index.ts'`
- `resolve.dedupe: ['react','react-dom']` — React is a **peer dependency** here; the consumer's single
  copy must be used or hooks break. `@types/react` is a devDep so a consumer's `tsc` can resolve types
  through the aliased source.

## What's left to do
This is a small, stable library; the participant auth flow it backs is complete (PA-1..PA-4 + SSO). Only
optional follow-ons remain.

**Next**
- **httpOnly-cookie hardening for the refresh token.** Today the refresh token lives in localStorage
  ([src/storage.ts](src/storage.ts)) — chosen for cross-origin portal/player with no backend change. A
  hardened path would move it to an httpOnly cookie; requires Identity-side cookie issuance + CORS/credentials
  changes, so it's a coordinated change, not local-only.
- **Surface any small API gaps the host apps need.** If a host app starts hand-rolling an Identity call,
  fold it into [src/client.ts](src/client.ts) so this stays the single source of truth.

**Deferred / blocked**
- 🔒 **Publish as a real package.** Today it's a local source-alias (`private: true`, `version 0.1.0`).
  It would become a proper published/versioned package only on the repo split (deferred; whole monorepo
  is one local repo).

## Conventions & gotchas
- **Source-alias, no build:** edits here take effect immediately in both apps via Vite — no `build:lib`.
  But changes ripple to **two** consumers; run both host test suites before merging.
- **React dedupe is mandatory** in every consumer (peer dep) — a duplicate React copy breaks `useSession`.
- **SSO codes are single-use, ~60s** — `exchangeHandoff` consumes the code; the boot effect runs once
  (StrictMode double-invoke guarded via `booted` ref).
- **CORS:** Identity must allow both the portal and player origins (auth runs from both).
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing (the harvester agent shares this checkout).

## References
- [README.md](README.md) — consumption (alias + dedupe) detail.
- Memory: `project_participant_pa_1.md` (session/ origin), `project_untangle_two_apps.md` (portal/player
  split + source-aliased session), `project_sso_handoff.md` (#1-SSO handoff path),
  `project_participant_email_slice.md` (verify/reset client methods).
- Root [HANDOFF.md](../HANDOFF.md) for system-wide context; consumers `participant-app/` and `web-viewer/`.
