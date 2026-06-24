# Participant App — fixes & roadmap

Captured 2026-06-24 from owner feedback after trying the running app. This is the running
to-do/roadmap for the participant-facing experience; each item becomes its own brainstorm → spec →
plan → build slice when picked up.

## The unifying idea

The friction the owner hit comes from **one package (`web-viewer/`) doing two jobs**: the **portal**
(catalogue / account / my-data, under a nav shell) and the **runner/player** (the full-screen,
shell-less questionnaire viewer). The clean architecture the items below point to:

- **The viewer is a reusable, embeddable questionnaire "player"** — launched with a questionnaire/
  deployment **and a return URL**; it sends the participant back on finish/decline.
- **The participant app** is a separate project that **launches the player** (and gets the user back)
  — its job is discover → pick → launch → return → see-your-data + account.
- **library-web** is a second consumer that launches the player so anyone can **try** a Library
  questionnaire.

The **return-URL / redirect-on-finish** mechanism is the keystone: it removes the dead-end, makes the
pick→run→return journey cohesive, and is what lets the two projects be cleanly separated and reused.

## Items

0. **✅ #1-SSO DONE (2026-06-24, merge `f1e5370b`). Cross-origin auth handoff.** Authenticated
   deployments no longer re-prompt login on the player. Owner chose a **one-time handoff code**:
   Identity `POST /v1/auth/handoff` (Bearer) mints a single-use, 60 s code (hash-at-rest,
   `handoff_codes` table) bound to user+client; `POST /v1/auth/handoff/exchange` (public) consumes it
   once → fresh token pair. The portal mints it at launch for `identity` cards (signed in) → `&handoff=`;
   the player's `SessionProvider` exchanges it on boot (else falls back to its login). Identity 61 +
   participant-app 86 + web-viewer 253 tests; opus review APPROVE (all 10 security properties verified).
   **Followup:** a shared TTL reaper for the token tables (handoff/email/refresh) — unbounded growth.

1. **✅ DONE (2026-06-24, merge `c83641ad`). Untangle the participant app from the web-viewer.** Split
   into three packages: **`participant-session/`** (shared SessionProvider + Identity client, single
   source of truth, source-aliased — no build step), **`participant-app/`** (the portal: catalogue/
   account/my-data, dev :5174, launches the player at `VITE_PLAYER_BASE_URL` with a `return_url`), and
   **`web-viewer/`** (player only, dev :5173). Anonymous/invite/demo seamless cross-origin;
   **authenticated deployments re-prompt login on the player** (SSO deferred — see #1-SSO). Editor's
   renderer/scoring lib untouched. participant-app 79 + web-viewer 247 tests; both builds + build:lib
   green; live two-origin CORS verified. **#1-SSO (deferred):** a seamless cross-origin auth handoff so
   authenticated deployments don't re-login on the player.

2. **✅ PARTLY DONE (2026-06-24, merge `fbd4f16f`, with #4). Redesign the participant user journey.**
   Done so far: the pick→run→**return** loop is closed (Start passes a `return_url`; the catalogue
   greets the returning participant with a dismissable "All done — pick another" banner); a **clearer
   signed-in state** (avatar initial + always-visible email in the nav). Still open under the bigger
   #1: running the runner *inside* the shell (today it's still a full-page hand-off), and a richer
   post-completion view. *(Remaining work folds into #1.)*

3. **✅ DONE (2026-06-24, merge `0a1bc2f3`). Viewer return-URL on finish (keystone).** The player
   accepts a launch-time **`?return_url=`** (embedder-controlled), validated as a well-formed http(s)
   URL (`safeReturnUrl`, open-redirect guard), surfaced as a manual **"Done"** button on the finished /
   declined / already-completed screens — so the runner is never a dead-end. Manual only (no
   auto-redirect); the per-deployment `redirect_url` (PA-4) is untouched and complementary. web-viewer
   only; 321 tests + clean build. **NB (followup):** a *permanent* submission failure still strands the
   participant on the `finishing` + Retry screen with no Done escape — see #8.

4. **✅ DONE (2026-06-24, merge `fbd4f16f`, with #2). Participant app: pick a questionnaire and run it.**
   The catalogue → **Start** (now launches the player with `return_url`) → run → **Done** → back to the
   catalogue with the "All done — pick another" banner. The select→run→return flow is cohesive
   (still a full-page hand-off under the hood — embedding-in-shell is #1).

5. **✅ DONE (2026-06-24, merge `1efaa0e1`). library-web "Try it" per questionnaire.** A **Try it**
   link on the Library DetailPage launches the player in **render-only preview** (no data captured) and
   returns to the Library on Done. Backed by a **public `GET /v1/preview/runtime`** in VS (builds a
   runtime from a bare `questionnaire_ref` via a synthesized pseudo-deployment — no deployment/session/
   auth/storage; reuses the runtime cache) + a player `?preview=<ref>` no-capture boot path. Locale =
   the questionnaire's own default, so #7's locale-500 is sidestepped here. VS 198 + web-viewer 249 +
   library-web 62 tests.

## Also-open (carried from earlier testing) — ALL DONE 2026-06-24 (merge `86d4e510`)

6. **✅ DONE. Richer demo questionnaire.** `qst_wellbeing@v26.0601` (6-item "Wellbeing check-in",
   EN-only, self-contained) in `library/fixtures/demo/` (outside tests/fixtures). Seed:
   `library ingest library/fixtures/demo --release v26.0601`. Live: in the Library + library-web Try-it
   + a participant-catalogue deployment.
7. **✅ DONE. VS unsupported-locale 500 → 422.** The resume-runtime (`GET /sessions/{id}/runtime`) +
   locale-switch endpoints now map `PreflightError → 422 preflight_failed` (shared `_preflight_422`,
   already used by `new_session`) — no more 500. (Deploy-create validation against the questionnaire's
   locales remains a deeper optional follow-up; the 422 fully removes the dead-end.)
8. **✅ DONE. Runner failure escapes.** `resume_unreachable` now offers a **"Start fresh"** button
   (clears the saved IndexedDB session + re-mints); a permanent submit failure shows the `return_url`
   **Done** link. The runner is never a dead-end on the failure paths either.

## Recommended sequence

1. **#3 viewer return-URL on finish** (keystone; also kills the Thank-you dead-end).
2. **#2/#4 journey redesign + pick→run→return** (built on #3).
3. **#1 untangle into two projects** (clean once the player↔portal boundary is the return-URL handoff).
4. **#5 library-web "Try" links** (+ the VS preview-mint it needs).
5. Slot in **#6/#7/#8** opportunistically (small).

## Decisions (owner, 2026-06-24)

- **Project-split shape:** **two fully separate apps/origins** (owner's choice). The player and the
  participant app are independent deployments on different origins. Consequence for #1/#3: the player
  **cannot** rely on a shared-localStorage session for authenticated deployments — it needs the
  participant's auth handed over via a **redirect handoff** (NOT a token in the URL). The launch-time
  `return_url` (#3) is the return half of that handoff. (Item #1 / return-URL itself is independent of
  auth and is safe to build first.)
- **library-web preview auth:** (still open) — recommendation: an **anonymous ephemeral "preview"
  mint** in viewer-service (no account, no stored data).
- **First slice:** **#3 (viewer return-URL on finish)** — owner's choice; independent of the split.
