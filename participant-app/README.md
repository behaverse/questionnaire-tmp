# questionnaire-participant-app (the portal)

The **participant portal** — a React/TS SPA where a participant signs in, manages their account,
browses the catalogue of available questionnaires, picks one, and (after running it in the **player**)
returns here. It is a **separate app/origin** from the player (`web-viewer/`); the two communicate
through URLs (a launch URL + a `return_url`), not shared memory.

## What's here

- **Catalogue** (`/`) — the public list of questionnaires (`GET /v1/catalogue` on the Viewer Service).
  Each **Start** launches the player at `VITE_PLAYER_BASE_URL` carrying a `return_url` back here; on
  return (`/?done=<id>`) a friendly "all done — pick another" banner shows.
- **Account** (`/account`) — register / sign in (auto-login on register), profile, change password.
- **My data** (`/my-data`) — the participant's own sessions + CSV download (`/v1/me/*`).
- **Studies** (`/studies`) — researcher-only: pick a deployment, list its sessions, then **Copy
  replay link**, **Revoke links**, or **Watch live** (opens the player in `?follow=1`) per session.
  Nav-gated on the `researcher` role; the real gate is the Viewer Service's `require_researcher`.
- **Reset / verify** (`/reset-password`, `/verify-email`) — reached from emailed links.

Auth/session is the shared **`@behaverse/participant-session`** package (persistent login via a
localStorage refresh token, silent refresh, logout) — the same package the player uses.

## The two-app model

```
participant-app (portal, this package)        web-viewer (player)
  browse → Start ───────────────────────────►  run the questionnaire
  /?done=<id>  ◄─────────── return_url ───────  Done
```

Anonymous / invite / demo questionnaires run with no sign-in. **Authenticated** cards mint a one-time
SSO handoff code at Start and pass `&handoff=` so the player doesn't re-prompt login (#1-SSO, shipped).

## Develop

```bash
npm install
npm run dev          # http://localhost:5174
```

Env (query overrides win; else Vite env; else localhost dev defaults):

| Var | Default | Purpose |
|---|---|---|
| `VITE_PLAYER_BASE_URL` | `http://localhost:5173` | where to launch questionnaires (the player) |
| `VITE_VS_BASE_URL` | `http://localhost:8001` | Viewer Service (catalogue + my-data) |
| `VITE_IDENTITY_BASE_URL` | `http://localhost:8100` | Identity service (login/account) |

Same overrides also accepted as URL params: `?player_url=`, `?viewer_url=`, `?identity_url=`.

> The Identity and Viewer Service **CORS allow-lists must include this portal's origin** (e.g.
> `http://localhost:5174`) in addition to the player's, since the portal makes the login + catalogue +
> my-data calls. See `docs/testing-participant-flow.md`.

```bash
npm test             # vitest
npm run build        # tsc -b + vite build
```

## Deploy (note)

This app's build aliases the **sibling** `../participant-session/src` (the shared auth package), so a
deploy must run from a context where that sibling exists — i.e. **root the build at the repo**, e.g.
`buildCommand: "cd participant-app && npm install && npm run build"`, `outputDirectory:
"participant-app/dist"`, with an SPA rewrite `/(.*) → /index.html`. Set `VITE_PLAYER_BASE_URL` /
`VITE_VS_BASE_URL` / `VITE_IDENTITY_BASE_URL` to the deployed player + service origins, and add this
app's origin to the Identity and VS CORS allow-lists. (A turn-key `vercel.json` is a deferred
follow-up; the player and portal deploy as two separate origins.)
