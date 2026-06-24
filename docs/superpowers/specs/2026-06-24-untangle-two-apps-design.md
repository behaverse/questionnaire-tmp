# Untangle the participant app from the web-viewer (two apps) — design

**Date:** 2026-06-24
**Status:** approved (brainstorm complete) — ready for implementation (staged)
**Components:** new `participant-session/` (shared) + new `participant-app/` (portal) + `web-viewer/`
(now player-only). No service/schema change. `web-viewer/renderer` lib (editor dep) preserved.
**Roadmap item:** #1. Owner decisions (2026-06-24): **two fully separate apps/origins**; **re-login on
the player now, SSO handoff later**; **shared session as a lib package**.

---

## 0. Context

`web-viewer/` is one Vite app doing two jobs (`main.tsx`: `?deployment/invite/fixture` → runner `App`,
else portal `ParticipantApp`). Portal code = `src/{shell,account,home,mydata}`; player code =
`src/{app,renderer,logic,resume,scoring,theme}` + `app/chrome`. **`src/session`** (SessionProvider +
Identity client) is used by **both**: the portal (login/account/my-data) and the player (`App.tsx:189`
mint with `session.accessToken`; `:217` `session.login` for authenticated deployments). The repo has
**no workspaces**; cross-package sharing is by relative path alias (editor → `../web-viewer/dist-lib`).
The keystone (`return_url`) + pick→run→return already make the portal→player→portal boundary a clean
URL handoff.

**Consequence of two origins (owner-accepted):** the player's `SessionProvider` reads its *own*
origin's localStorage, so a participant logged into the portal is **not** auto-authed on the player.
Anonymous/invite/demo deployments need no auth → seamless. **Authenticated** deployments **re-prompt
login on the player** (the runner's existing `LoginView`). The seamless SSO/redirect handoff is a
deferred follow-up (#1-SSO), explicitly out of scope here.

---

## 1. Scope (locked)

**In scope:**
1. **`participant-session/`** — a shared package holding the current `web-viewer/src/session/*`
   (SessionProvider, useSession, client, authFetch, storage). A composite TS project; both apps
   consume it via tsconfig `references` + a vite/vitest `resolve.alias` to its source (no built-lib
   prebuild — it's plain TS+React).
2. **`participant-app/`** — a new Vite/React app = the portal: its own `index.html` + `main.tsx`
   (portal only) + the moved `shell/`, `account/`, `home/`, `mydata/` (+ their tests). It launches the
   player at **`VITE_PLAYER_BASE_URL`** (default `http://localhost:5173` for dev) carrying
   `return_url` back to itself. Consumes `participant-session`.
3. **`web-viewer/`** — stripped to the **player**: `main.tsx` always renders `App` (no
   `ParticipantApp`); the portal dirs + their tests are removed; its `session` import now points at
   `participant-session`. `renderer`/`scoring` libs + their build unchanged (editor unaffected).
4. **Deploy:** a `vercel.json` (or equivalent) per app so they build/deploy independently to two
   origins; dev runs both (`participant-app` on a new port, e.g. 5174; player on 5173).

**Out of scope:** the SSO/redirect auth handoff (deferred — authenticated deployments re-login on the
player for now); any runner/portal behavior change beyond the move + the launch URL; library-web (#5);
service/schema changes; consolidating the three packages' node_modules into workspaces.

---

## 2. Decisions

- **Shared session = composite TS project, source-aliased** (not a built lib). The renderer is a built
  lib only because it needs a wasm/css build; session is plain TS+React, so source aliasing +
  `tsc -b` project references is simpler and avoids a prebuild step and rootDir errors.
- **The player keeps its own `LoginView`/`session.login`** (PA-1) — it is the re-login path for
  authenticated deployments cross-origin. No new auth code this slice.
- **Launch is URL-config'd, dev-friendly.** `participant-app` builds the player URL from
  `VITE_PLAYER_BASE_URL` (default `http://localhost:5173`); the player builds `return_url` back to the
  portal. Both fall back to localhost in dev; same-origin still works if both are served together.
- **`web-viewer` stays the package name** (its renderer/scoring exports are consumed by the editor by
  that path) — only its app role narrows to "player". The portal is the *new* package.
- **Move tests with their code.** `shell|account|home|mydata` tests → `participant-app`; `session`
  tests → `participant-session`; the player keeps `app|renderer|logic|resume|scoring|theme` tests.

---

## 3. Architecture & units

```
participant-session/        # shared lib (composite TS project)
  src/{SessionProvider.tsx, client.ts, authFetch.ts, storage.ts, index.ts}
  package.json, tsconfig.json (composite)

participant-app/            # NEW portal app  (origin A, dev :5174)
  index.html, src/main.tsx (portal only)
  src/{shell,account,home,mydata}/...  (moved from web-viewer)
  vite.config.ts (alias participant-session src), tsconfig (refs participant-session), vitest setup
  launches player: ${VITE_PLAYER_BASE_URL}/?deployment=…&return_url=${portalOrigin}/?done=…

web-viewer/                 # player only  (origin B, dev :5173)
  index.html, src/main.tsx  → always <App/>
  src/{app,renderer,logic,resume,scoring,theme}/...  (unchanged player)
  session import → participant-session (alias + ref); renderer/scoring lib build unchanged
```

`returnUrlFor` (currently in `web-viewer` CatalogueView) moves to `participant-app` and targets the
**portal** origin; the player launch helper targets `VITE_PLAYER_BASE_URL`.

---

## 4. Data flow (unchanged loop, now cross-origin)

portal(A) catalogue → Start → `B/?deployment=X&return_url=A/?done=X` → player(B) runs (re-login on B
if `authenticated`) → Done → `A/?done=X` → portal banner. Anonymous/invite/demo never prompt; only
`authenticated` shows the player's login.

---

## 5. Error handling / risk

- **Build-graph risk** is the main one — three toolchains. Mitigated by **staging** (below): each
  stage ends green (tests + build) before the next.
- `participant-session` tsc rootDir issues avoided via composite project + `references` (idiomatic for
  the existing `tsc -b`).
- The editor's `web-viewer/dist-lib` renderer/scoring path must keep working — Stage 3 must not touch
  the renderer/scoring lib build; verify `web-viewer` `build:lib` after stripping.
- Authenticated-deployment cross-origin = re-login (documented, not a bug). Anonymous/invite/demo
  verified seamless.

---

## 6. Staging (each stage: green gate + commit)

1. **Extract `participant-session/`** + rewire `web-viewer` to consume it (alias + ref + move session
   tests). Gate: `web-viewer` `npm test` + `npm run build` + `build:lib` green; no behavior change.
2. **Create `participant-app/`** (portal): scaffold the app, move `shell|account|home|mydata` (+tests),
   portal `main.tsx`/`index.html`, wire `participant-session`, add the player-launch URL
   (`VITE_PLAYER_BASE_URL`) in the catalogue. Gate: `participant-app` `npm test` + `npm run build`
   green.
3. **Strip `web-viewer` to player-only**: remove the moved portal dirs + `ParticipantApp`, make
   `main.tsx` always render `App`, drop the now-moved tests. Gate: `web-viewer` `npm test` +
   `npm run build` + `build:lib` green; editor still resolves the renderer lib.
4. **Deploy + docs + smoke**: per-app `vercel.json`; READMEs; `docs/testing-participant-flow.md`
   updated for two servers; a manual two-origin smoke (anon seamless; authenticated re-login). Gate:
   both apps build; docs land.

---

## 7. Deliverable gate

Two independent apps: `participant-app` (portal) and `web-viewer` (player), each building/testing on
its own, sharing auth via `participant-session`. The catalogue launches the player on its configured
origin and the participant returns to the portal. Anonymous/invite/demo are seamless cross-origin;
authenticated re-prompts login on the player (SSO deferred). The editor's renderer/scoring libs still
build. No service/schema change.

---

## 8. References

- `web-viewer/src/{session,shell,account,home,mydata,app,main.tsx}`, `web-viewer/vite.config.ts`,
  `web-viewer/package.json` (exports for renderer/scoring), `editor/vite.config.ts` +
  `editor/tsconfig.json` (the renderer-lib alias precedent), root `vercel.json`.
- Builds on [[project_pick_run_return]] / [[project_viewer_return_url]]; roadmap
  `docs/participant-app-roadmap.md` (#1). Deferred: #1-SSO (cross-origin auth handoff).
