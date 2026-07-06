# Design — #7-5 live-follow of an in-progress session

- **Date:** 2026-07-03
- **Track:** QA / research tooling — replay (#7), final follow-on #7-5
- **Branch:** `work/replay-live-follow`
- **Predecessor:** RP1/RP2/RP3-core + multi-select + `/studies` + revocation (all merged). This is the last
  remaining #7 follow-on.

## Problem

`GET /v1/replay?token=` returns a point-in-time snapshot of a session's replay bundle. A researcher who
wants to watch a session **as it happens** (QA, piloting) has to keep re-opening the link. There is no
"follow" mode that keeps the view current while the participant is still answering.

## Decision

**Polling, player-side, no backend change.** `build_replay_bundle` already assembles `statements` from the
session's *current* outbox event rows, so re-fetching the same bundle URL returns more statements as the
session progresses. The player re-fetches on an interval and re-`reconstruct`s (which it already does every
render). Chosen over SSE: the player flushes events only every ~5s, so the source data changes at ~5s
granularity — polling at ~4s matches that cadence with zero streaming infrastructure and reuses the existing
token-authorized endpoint. SSE/delta protocols would be over-engineering for a single-observer watch.

## Scope

**In scope:**
1. web-viewer: a `follow` player param; a polling follow mode in `ReplayApp`; a live-tail + "● LIVE"
   indicator + follow toggle in `ReplayView`; stop-on-terminal + a no-change safety cap.
2. participant-app: a per-session "Watch live" entry in `/studies` that opens the follow URL.

**Out of scope:** SSE/websockets, a delta/incremental-fetch protocol, any new backend endpoint, presence
("who else is watching"), and multi-session dashboards.

## Components

### 1. web-viewer param — [bootstrap.ts](../../../web-viewer/src/app/bootstrap.ts)

Add `follow: boolean` to `Params`, parsed from `?follow=` (truthy when `1`/`true`). `main.tsx` passes it to
`ReplayApp` (`follow={params.follow}`).

### 2. Follow poller — [ReplayApp.tsx](../../../web-viewer/src/replay/ReplayApp.tsx)

- Accept a `follow?: boolean` prop. Initial load is unchanged.
- When `follow` is true and the loaded bundle is not yet terminal, start an interval (~4000ms) that
  re-`loadBundle(src)`; on success, replace the bundle state (so `reconstruct` re-runs and the timeline
  extends). Errors during polling are non-fatal — keep the last good bundle and keep polling (a transient
  fetch failure should not kill a live watch); surface a subtle "reconnecting" hint, not the full error page.
- **Stop** polling when the bundle's statements contain a terminal verb
  (`bdm:submitted` / `bdm:completed` / `bdm:consent_declined`), or after **N consecutive polls with no new
  statements** (default N=5, i.e. ~20s idle) so an abandoned session stops polling. Clean up the interval on
  unmount and on stop.
- A small pure helper `isTerminal(statements): boolean` (exported for testing) checks for the terminal verbs.

### 3. Live-tail + indicator — [ReplayView.tsx](../../../web-viewer/src/replay/ReplayView.tsx) / [clock.ts](../../../web-viewer/src/replay/clock.ts)

- `ReplayView` accepts `live?: boolean` (following + not yet ended) and a `following`/`onToggleFollow`
  control.
- **Live-tail:** while `following` is on, pin the clock to the live edge — when a new (longer) timeline
  arrives, seek to the new `durationMs`. Implement by, on each `durationMs` increase, calling `clock.seek`
  to the end **iff** following is on. A "● LIVE" badge shows next to the controls; the follow toggle
  ("Following" / "Paused") lets the researcher stop tailing to scrub back and resume (which re-pins to the
  end). When the session ends, the badge switches to "Ended" and following stops.
- The existing play/pause/seek/speed controls are unchanged; live-tail simply drives the offset while
  following.

### 4. participant-app entry — [studies/api.ts](../../../participant-app/src/studies/api.ts) / StudiesView

- A per-session **Watch live** button next to Copy/Revoke: mint a link (reusing `mintReplayLink`), then
  `window.open(followUrl, '_blank')` where `followUrl = replay_url + (replay_url.includes('?') ? '&' : '?') +
  'follow=1'` (falls back to the bundle_url form if `replay_url` is null, appending `&follow=1`). A no-op
  with an inline note if popups are blocked.

## Data flow

`/studies` "Watch live" → mint token → open `player/?replay=<bundle_url>&follow=1` → `ReplayApp` loads the
bundle, then polls `GET /v1/replay?token=` every ~4s → each response's growing `statements` extend the
timeline → live-tail keeps the view at the latest → stop when a terminal verb appears. Same replay token
(capability) throughout; revocation still applies (a revoked token starts 401ing — the poller treats
repeated failures as "reconnecting" then, after the idle cap, stops).

## Testing strategy

- **web-viewer** (vitest):
  - `isTerminal` returns true for each terminal verb, false otherwise.
  - The follow poller (with a mocked `loadBundle`/fetch + fake timers): re-fetches on the interval and
    extends statements; stops after a terminal statement appears; stops after N no-change polls; a poll error
    keeps the last bundle and keeps polling.
  - `ReplayView`: renders the "● LIVE" badge when `live`; the follow toggle flips following; live-tail seeks
    to the new end when the timeline grows while following, and does NOT when following is paused.
- **participant-app** (vitest): the "Watch live" button mints and calls `window.open` with a `follow=1` URL
  (fallback path when `replay_url` is null appends `follow=1` to the bundle_url form).
- `npm test` + `npm run build` + `npm run build:lib` (web-viewer renderer lib).

## Risks

- **Full-bundle re-fetch each poll** (no delta) — O(n) transfer that grows with session length. Acceptable
  for a single-observer, bounded-length watch; note it. Delta/SSE is a future optimization if needed.
- **Runtime re-mint per poll** — mitigated by the VS 5-tuple runtime cache (cheap after first).
- **Live-tail vs manual scrub conflict** — resolved by the explicit follow toggle: tailing only auto-seeks
  while "Following" is on; pausing hands control to the scrubber.
- **Poll interval vs cache TTL** — 4s polling against a ~5s data cadence is fine; do not poll sub-second.

## Deliverables checklist

- [ ] `follow` param in bootstrap + `main.tsx` wiring.
- [ ] `ReplayApp` polling follow mode + `isTerminal` + stop-on-terminal + no-change cap + non-fatal poll errors.
- [ ] `ReplayView` "● LIVE"/Ended badge + follow toggle + live-tail seek-to-end while following.
- [ ] participant-app "Watch live" button (opens `follow=1` URL) + test.
- [ ] web-viewer tests (isTerminal, poller, ReplayView live-tail) + `npm test`/`build`/`build:lib` green.
- [ ] Doc: add a "Watch live" note to `web-viewer/docs/replay.md`.
- [ ] FOLLOWUPS + HANDOFF: mark #7-5 done — **#7 fully complete** (remove the live-follow item; note the
      whole replay track is done).
