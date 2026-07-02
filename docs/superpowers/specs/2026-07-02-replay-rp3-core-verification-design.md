# Design — #7 Replay RP3 (core): verify + document the live round-trip

- **Date:** 2026-07-02
- **Track:** QA / research tooling — replay (#7), RP3 core slice
- **Branch:** `work/replay-rp3`
- **Predecessors (already on master):** RP1 (web-viewer `?replay=` renderer), RP2 (viewer-service
  replay-link mint + token-authorized `GET /v1/replay` bundle)

## Problem

RP1 (the player's `?replay=` renderer) and RP2 (the Viewer Service replay-link mint + token-authorized
bundle endpoint) both exist and are unit-tested in isolation, but **the two halves have never been
exercised together through a real browser**. [test_replay_api.py](../../../viewer-service/tests/test_replay_api.py)
proves the VS side at the FastAPI-TestClient layer; nothing proves that a browser at the player origin,
given a `?replay=<VS bundle url>`, actually fetches → reconstructs → renders the run. This is exactly the
recurring trap in [docs/operational-gotchas.md](../../operational-gotchas.md): "test the browser request,
not the API" and "don't make wrong 'it works' claims." RP3-core closes that gap.

## Scope

**In scope (only):**

1. An automated player-level browser e2e (Playwright, VS route-mocked) — the regression guard.
2. A short doc in `web-viewer/` describing the replay round-trip, the CORS requirement, and known limits.
3. One real full-stack manual verification, screenshot captured in the doc.
4. Fix the CORS gap **only if** the manual check reveals one (Vercel env / `VS_CORS_ORIGINS`, not code).

**Explicitly deferred** (separate RP3 follow-ons, tracked in the FOLLOWUPS, not "core"):

- Researcher "copy replay link" button UI.
- Researcher session-list surface (participant-app or editor).
- Dedicated `REPLAY_SIGNING_SECRET` + link revocation (currently reuses `INVITE_SIGNING_SECRET`).
- Incremental live-follow of an in-progress session (SSE/polling).

## Key decisions (settled in brainstorming)

- **E2E fidelity:** player-level browser e2e with the VS **route-mocked**, plus one **real** manual
  full-stack check captured in the doc. CI stays fast and Postgres-free; the real token URL is still
  verified for real, by hand, once. (Rejected: a full-stack Playwright test that boots VS+Postgres in CI
  — slow, and exposed to the docker-NAT flakiness the HANDOFF warns about.)
- **Test placement:** piggyback on the existing respondent-bot Playwright harness
  ([tools/respondent-bot/playwright.config.ts](../../../tools/respondent-bot/playwright.config.ts)),
  which already boots the player (`npm --prefix ../../web-viewer run dev` on :5173), uses the offline
  route-mock pattern, and screenshots. Zero new tooling. Thematically apt: the bot *produces* traces,
  replay *consumes* them. (Rejected: standing up a second Playwright install/config in `web-viewer/`.)
- **Drift guard:** reuse the existing assertion in `test_replay_api.py` that `build_replay_bundle()`
  returns exactly `{runtime, statements, mouse}`. The JS fixture mirrors that shape with a comment
  cross-referencing that test. No new cross-language fixture file (YAGNI).

## Components

### 1. Player e2e — `tools/respondent-bot/tests/e2e/replay.spec.ts`

Mirrors [smoke.spec.ts](../../../tools/respondent-bot/tests/e2e/smoke.spec.ts) / mouse.spec.ts.

- **Route-mock** a **cross-origin** `GET http://vs.mock/v1/replay?token=…` and `route.fulfill` a
  VS-shaped bundle `{runtime, statements, mouse}`. The fulfilled response **must include an
  `access-control-allow-origin` header** — so the test faithfully exercises the real cross-origin
  browser fetch (`loadBundle` does `fetch(src)` to another origin) and encodes the CORS requirement as
  a test invariant. Without ACAO the browser would block the read; the test failing in that case is the
  point.
- The bundle fixture:
  - `runtime` — a minimal but valid Schema-3 runtime with one single-select item (reuse/adapt the
    respondent-bot's existing runtime fixture, or the denormaliser's `qst_mini`), so `ReplayView` has
    something to render.
  - `statements` — an ordered `bdm:` stream for that item: at minimum `bdm:started`,
    `bdm:trial_started` (gives the item position `reconstruct` reads), `bdm:trial_ended` (carries the
    selected answer), `bdm:submitted`. Optionally `bdm:recording_started` to align the cursor clock.
  - `mouse` — a short `MouseSample[]` track (optional; include so the cursor-overlay assertion has data).
- **Navigate** to `/?replay=${encodeURIComponent('http://vs.mock/v1/replay?token=demo')}`.
- **Assertions:**
  - `ReplayView` renders — the "Replay unavailable" error node is absent, the question text is present.
  - The recorded answer from `trial_ended` is shown as selected in read-only mode (assert the selected
    option's rendered state, matching how RP1 reconstructs answers).
  - The replay controls exist (play/step — whatever `ReplayView` renders).
  - The cursor overlay (`#…` overlay element ReplayView/`cursor.ts` injects) is present when `mouse` is
    supplied.
  - Assert the mocked `/v1/replay` route was actually hit (proves the real browser fetch path, not an
    inlined import).
- **Screenshot** → `tests/e2e/screenshots/replay.png` (owner reacts to screenshots).
- Runs under the existing `cd tools/respondent-bot && npm run e2e` (already in the root HANDOFF suite).

**Boundary check:** exact overlay selector, control affordances, and the "selected option" DOM state
must be read off the current `ReplayView.tsx` / `cursor.ts` during the plan/build step, not assumed here.

### 2. Drift guard — reuse existing

No new code. `test_replay_api.py::test_mint_then_fetch_bundle` already asserts
`set(bundle) == {"runtime","statements","mouse"}` against the real `build_replay_bundle()`. The e2e
fixture's top-level shape mirrors that, with a comment pointing at that test so a future VS-side shape
change surfaces as a fixture mismatch to fix in lockstep.

### 3. Doc — `web-viewer/docs/replay.md`

Short, task-oriented:

- **Two `?replay=` modes:** file/offline (RP1 — a bundle you host, e.g. a respondent-bot `trace.json`
  paired with a runtime) and VS link (RP2 — `?replay=<VS bundle url>`).
- **Minting a link (researcher):** `POST /v1/deployments/{id}/sessions/{sid}/replay-link` →
  `{token, bundle_url, replay_url}`; open `replay_url` (needs `WEB_VIEWER_BASE_URL` set on VS).
- **CORS requirement:** the player fetches `bundle_url` **cross-origin**, so the player origin must be
  in `VS_CORS_ORIGINS` and VS must send `Access-Control-Allow-Origin`. Name this as the first thing to
  check if a live replay shows "Replay unavailable / could not fetch".
- **Known limitations:** multi-select/checkbox answers are not reconstructed in RP1
  (`trial_ended` emits `additional_measures.values`, which `reconstruct` does not yet read); the noted
  live-RadioGroup gap. Both are out of RP3-core scope.
- The manual-verification screenshot from Component 4.

### 4. Manual full-stack verification

Boot VS + Postgres locally (per viewer-service HANDOFF; `DOCKER_CONFIG=/tmp/lib_docker`), create/select a
deployment + a session that has `events` outbox rows, `POST …/replay-link` with a researcher token, open
the returned `replay_url` in the running player, and confirm the run renders + plays back. Screenshot it
into the doc. If the fetch is CORS-blocked, add the player origin to `VS_CORS_ORIGINS` (local env, and
note the prod Vercel env needs the same) and re-verify. This is the honest "it works" evidence.

## Testing strategy

- **Automated:** the new Playwright e2e (Component 1) under `tools/respondent-bot && npm run e2e`; the
  existing VS API round-trip tests remain the API-layer coverage.
- **Manual:** Component 4, once, captured in the doc.
- No change to any other suite.

## Out of scope / non-goals

- No new VS endpoints, no schema change, no player renderer changes (RP1 is complete).
- No fix for the checkbox-reconstruction or live-RadioGroup limitations (documented, deferred).
- None of the deferred RP3 follow-ons listed under Scope.

## Risks

- **Fixture realism:** if the fixture's `statements`/`runtime` don't match what a real session emits,
  the e2e could pass while real replay fails. Mitigation: mirror the VS contract shape (drift guard) +
  the one real manual check.
- **DOM-assertion brittleness:** assertions must target stable rendered state, not incidental markup —
  read the current `ReplayView.tsx` when writing them.

## Deliverables checklist

- [ ] `tools/respondent-bot/tests/e2e/replay.spec.ts` + bundle fixture; `npm run e2e` green; screenshot.
- [ ] `web-viewer/docs/replay.md`.
- [ ] Manual full-stack verification done; screenshot + any CORS finding recorded in the doc.
- [ ] FOLLOWUPS updated: mark RP3-core done in `web-viewer/FOLLOWUPS.md` + `viewer-service/FOLLOWUPS.md`;
      leave the deferred RP3 items listed.
- [ ] Root `HANDOFF.md` #7 status refreshed (RP3-core done; deferred items remain).
