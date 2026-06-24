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

1. **Untangle the participant app from the web-viewer (two projects).** Today `web-viewer/src/`
   mixes the portal (`shell/`, `session/`, `account/`, `home/`, `mydata/`) with the runner (`app/`,
   `renderer/`, `logic/`, `resume/`, `scoring/`, `theme/`, `chrome/`). Split into: **(A)** the viewer/
   player (the runner + renderer; already exports a renderer lib for the editor) and **(B)** the
   participant app (portal). Decision needed: same-repo two-package split sharing the Identity session
   via same-origin localStorage, vs fully separate apps. *(Large; architecture decision — see Open
   decisions.)*

2. **Redesign the participant user journey.** The portal↔runner seam is jarring (Start "leaves" the
   app; no way back). Define the end-to-end journeys + screens (see
   `docs/` description / the session notes) and make navigation consistent: a clear signed-in state,
   pick→run→**return to the app**, a post-completion confirmation *in the app*, and obvious
   navigation everywhere. *(Medium; depends on #3.)*

3. **Viewer redirect/return-URL on finish (keystone).** The player should accept a launch-time
   **`?return_url=`** (controlled by the embedder — the participant app or library-web) and, on
   finish / decline / already-completed, navigate back to it (and always offer a manual "Done / back"
   link so the runner is never a dead-end). Complements the existing per-deployment `redirect_url`
   (researcher-config) added in PA-4. *(Small–medium; do FIRST — unblocks #1, #2, #5.)*

4. **Participant app: pick a questionnaire from the list and run it.** The catalogue → **Start** →
   player(with return_url) → back to the app, landing on a "thanks / pick another" state. Make
   "select among the list and run" feel like one cohesive flow rather than jumping to a separate
   surface. *(Medium; #3 + #2.)*

5. **library-web: a "Try / Preview" link per questionnaire.** Each questionnaire card in
   `library-web/` gets a link that **launches the player** to experience that questionnaire, with a
   return_url back to the Library. Needs a way to run a Library questionnaire without a full
   researcher deployment (a "preview"/ephemeral mint in viewer-service) + the player's return-URL
   (#3). *(Medium; #3 + a VS preview-mint.)*

## Also-open (carried from earlier testing)

6. **Seed a richer, multi-question questionnaire** for the demo (today only the tiny `qst_min`
   "cold-water" sample is available, so "pick + complete" feels thin). *(Tiny; data/seed.)*
7. **VS unsupported-locale 500.** A deployment with `available_locales` the questionnaire doesn't
   fully support makes the denormaliser raise an unhandled `PreflightError` → 500 (surfaced as a
   `resume_unreachable` dead-end). Validate at deploy-create and/or map to a clean 4xx.
   *(Small; viewer-service.)*
8. **Runner `resume_unreachable` dead-end.** A failed resume (network/5xx) traps the participant on a
   "Try again" loop with no escape — offer a **"Start fresh"** (clear the IndexedDB record + new
   mint). *(Small; web-viewer.)*

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
