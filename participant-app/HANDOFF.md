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
- **Studies** (`/studies`, `src/studies/`) — the first researcher-facing UI. Pick a deployment
  (`GET /v1/deployments`), list its sessions (`GET /v1/deployments/{id}/sessions`), then per session
  **Copy replay link**, **Revoke links**, and **Watch live** (mints a replay link and opens the
  player at `replay_url&follow=1`). `StudiesView.tsx` gates on the `researcher` role in
  `session.user.roles`, and `NavShell` only shows the nav item to researchers — the VS's
  `require_researcher` is the real gate.
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
npm test             # vitest (18 test files, 102 tests)
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

**Owner feature requests (2026-06-26, from root `my_comments.md`)**
- **#9 Search for questions — shipped in the Library catalogue (`library-web`), not here.**
  **DONE (2026-06-26)** in `library/` + `library-web/`: the Library now full-text indexes entity
  **content** and exposes `GET /v1/questions/search` (prompts, with text snippet); `library-web`'s
  catalogue has a Questionnaires/Questions toggle. **If** the participant portal should also offer
  question search, add a search UI here calling the same Library endpoint (this app currently hits
  the VS `/v1/catalogue`, which has no search). Requires a live re-ingest to populate the content
  index (see `library/HANDOFF_content_search_index.md` §4).
- ~~**#4 Score-progression-over-time dashboard.**~~ **DONE (2026-06-29)** — My Data groups sessions by
  questionnaire (`src/mydata/progression.ts` `groupByInstrument`) and draws a dependency-free SVG line
  chart per named score (`src/mydata/ScoreSparkline.tsx`, with a `<table>` fallback) for any
  questionnaire with ≥2 scored attempts. Data: the player persists a display-ready projection
  (`x_score_display`) at completion; the VS stores it in `session.score_display` and returns it from
  `GET /v1/me/sessions`. **No backfill**—only sessions completed after this shipped carry scores.
  Instrument titles are still `instrument_id` (a human-title lookup is a separate item).
- ~~**#3 xAPI surfacing.**~~ **DONE (2026-06-30)** — My Data has a **"Download my activity (xAPI)"**
  button (`downloadMyEvents` → `GET /v1/me/events`) that saves `my_xapi.json`, the caller's
  `bdm:`-profile event statements flattened from the retained outbox. No new storage/capture/schema
  (events were already stored). Surfaced as-is; a researcher event export and an optional standard-ADL
  xAPI remap are follow-ups.

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
