# Participant App (portal) — Handoff

**Path:** `participant-app/` · **Stack:** Vite + React 19 + TypeScript · **Status:** ✅ built + LIVE (https://portal-henna-seven-32.vercel.app) · **Suggested branch:** `work/participant-app`

> The participant **portal**: sign in / register, browse the public catalogue, pick a questionnaire and
> launch it in the **player** (`web-viewer/`), then come back. It does NOT run questionnaires itself.
> A separate app/origin from the player; the two talk via URLs (a launch URL + a `return_url`), not
> shared memory. For deep detail see [README.md](README.md). No `FOLLOWUPS.md` for this component.

## What it is
- **Catalogue** (`/`, `src/home/`) — public list from `GET /v1/catalogue` (Viewer Service). Each **Start**
  launches the player at `VITE_PLAYER_BASE_URL` with a `return_url`; on return (`/?done=<id>`) a
  dismissable "all done — pick another" banner shows.
- **Account** (`/account`, `src/account/`) — register (auto-login), sign in, profile, change password;
  plus emailed-link views `ResetPasswordView` / `VerifyEmailView` (`/reset-password`, `/verify-email`).
- **My data** (`/my-data`, `src/mydata/`) — participant's own sessions + CSV download via `/v1/me/*`.
- **Shell** (`src/shell/`) — tiny hash/path router + `NavShell` (avatar + email when signed in) →
  `ParticipantApp`. Session is the shared `@behaverse/participant-session` package (`src/session/`),
  source-aliased from `../participant-session/src` in `vite.config.ts` (no build step).
- **SSO handoff** — for `authenticated` catalogue cards, Start mints a one-time Identity handoff code
  (`POST /v1/auth/handoff`) and passes `&handoff=` so the player doesn't re-login. Config in
  `src/params.ts` (query `?viewer_url/identity_url/player_url=` win over `VITE_*` env over localhost).

## Run & test
```bash
cd participant-app && npm install
npm run dev          # http://localhost:5174
npm test             # vitest (16 test files)
npm run build        # tsc -b && tsc -p tsconfig.test.json && vite build
```
Needs the backends running: **Identity :8100 + Viewer Service :8001 + Library :8000**. Both the
**portal (5174) AND player (5173) origins must be in the Identity and VS CORS allow-lists** — the portal
makes the login + catalogue + my-data calls. See [../docs/testing-participant-flow.md](../docs/testing-participant-flow.md).
The build aliases the sibling `../participant-session/src`, so **deploys must root the build at the repo**
(e.g. `cd participant-app && npm install && npm run build`, output `participant-app/dist`, SPA rewrite
`/(.*) → /index.html`).

## What's left to do
The participant-experience roadmap (#1–#8 + #1-SSO) is **COMPLETE** ([../docs/participant-app-roadmap.md](../docs/participant-app-roadmap.md));
what remains is polish.

**Now**
- **Prod env wiring is manual.** Each deploy must set `VITE_PLAYER_BASE_URL` / `VITE_VS_BASE_URL` /
  `VITE_IDENTITY_BASE_URL` to the live origins and add this origin to Identity + VS CORS. There is **no
  turn-key `vercel.json`** (deferred follow-up, README "Deploy" note) — adding one is a clean small task.

**Next (optional polish, verify against code first)**
- **Runner still a full-page hand-off.** Start navigates away to the player; embedding the runner inside
  the shell + a richer post-completion view was the open tail of roadmap #1/#2 (folded, not built).
- **Accessibility / journey polish.** Nav, banners, and account forms are functional; no a11y audit done.
- **Consent surface.** Consent is shown by the player (PA-4), not the portal; nothing to do here unless a
  pre-launch consent preview is wanted.

**Deferred / blocked**
- **Phase-5 Participant Platform** (study protocols, scheduling, researcher dashboards) is a separate
  **system-level track**, not portal work — see the root [HANDOFF.md](../HANDOFF.md). Do not build it here.

## Conventions & gotchas
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the harvester agent shares this checkout.
- The portal and player are **two separate origins**; never assume shared memory/cookies — pass state via
  the launch URL (`return_url`, `handoff`) and `src/params.ts` overrides.
- `@behaverse/participant-session` is **source-aliased, not built** — changes to `../participant-session`
  take effect live but the sibling must exist at build time (see Deploy note).
- Keep one React copy: `dedupe: ['react','react-dom']` in `vite.config.ts` (the aliased package pulls React).

## References
- [README.md](README.md) — full component docs (env table, two-app model, deploy note).
- [../docs/participant-app-roadmap.md](../docs/participant-app-roadmap.md) — the (now complete) #1–#8 + SSO roadmap.
- [../docs/testing-participant-flow.md](../docs/testing-participant-flow.md) — local run + CORS setup.
- Siblings: [../web-viewer/](../web-viewer/) (player), [../participant-session/](../participant-session/) (shared auth), [../viewer-service/](../viewer-service/) (catalogue + my-data), [../identity-service/](../identity-service/) (login + SSO handoff).
- Root [HANDOFF.md](../HANDOFF.md) — system-wide context + Phase-5 Platform track.
