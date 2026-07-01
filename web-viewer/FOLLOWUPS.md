# web-viewer — deferred work / follow-ups

## Owner feature requests (2026-06-26)

Captured from `my_comments.md`. Items #1/#2 are implemented in the same pass (see
"Presentation-control flags" below); the rest are documented here for future agents.
Cross-component items live in the relevant sibling's FOLLOWUPS (viewer-service,
participant-app) and are cross-linked.

- ~~**#1 Disable key-press option selection.**~~ **DONE (2026-06-26)** — `runtime.style.x_key_select`
  (default `true`). When `false`, letter-key selection of choices is disabled **and** the letter
  badges are hidden, forcing the participant to click the option. Text inputs are unaffected and
  still accept keyboard typing. Player honors the flag; populating it from deployment/authoring
  (VS denormaliser + Editor) is the follow-up below.
- ~~**#2 Disable back navigation.**~~ **DONE (2026-06-26)** — `runtime.style.x_back_nav` (default
  `true`). When `false`, the **Back** button is hidden so the participant cannot return to a prior
  question. Same player-honors / VS-plumbing-deferred split as #1.
- ~~**Editor authoring for #1 + #2 (+ comments).**~~ **DONE (2026-06-26)** — the Editor's
  questionnaire-root inspector now has a **Presentation** section with toggles for `x_key_select`,
  `x_back_nav`, and `x_comments` (questionnaire-level `style`). Confirmed the denormaliser carries
  the questionnaire `style` verbatim into `runtime.style`, so the player honours them with no VS
  change. **Remaining (optional):** deployment-level *override* of these flags would need them added
  to the VS `_ALLOWED_STYLE` allow-list **and** a style_overrides→runtime merge (which isn't wired
  today); questionnaire-level authoring is the chosen home, matching `x_presentation`.
- ~~**#5/#6 Per-page QA comment widget (lightweight slice).**~~ **DONE (2026-06-26)** —
  `runtime.style.x_comments` (default `false`, opt-in) renders a small fixed comment icon on each
  runner step; clicking opens a modal capturing a free-text **comment** + an optional **1–5 star**
  rating (`CommentWidget`). Submitting POSTs `{ page_id, item_id, locale, comment, stars }` to the VS
  `POST /v1/sessions/{id}/comments` via `submitComment` (best-effort; non-blocking). Note the owner
  terminology: this is a **comment**, not "feedback" (feedback = info given to users about their
  performance). **Remaining / deferred:**
  - The extra rating scales (clarity confusing→clear, sentiment angry→happy) were intentionally
    dropped from this slice — fold them into the larger QA-research effort if wanted.
  - ~~Authoring `style.x_comments` from the questionnaire (Editor toggle).~~ **DONE (2026-06-26)** —
    Editor Presentation section (see the #1/#2 authoring note above).
  - The deeper **QA-research** programme (domain-expert review workflows, "ask questions *about* a
    question", reviewer assignment, aggregation/dashboards) is a much larger separate effort.
  - ~~Researcher read/export of comments.~~ **DONE (2026-06-26)** — `GET /v1/deployments/{id}/comments`
    (JSON) + `GET /v1/deployments/{id}/comments.csv` (download, mirrors `export.csv`). No researcher
    GUI exists in the project (data access is API/CSV by design), so there's no in-browser browser.
- ~~**#7 Replay — RP1 (offline, file-based).**~~ **DONE (2026-06-30)** — `?replay=<src>` mounts
  `ReplayApp` (no session). It fetches a replay bundle `{runtime, statements, mouse?}` (e.g. the
  respondent-bot's `trace.json` paired with a runtime), reconstructs the run via
  `src/replay/reconstruct.ts` (position from `bdm:trial_started`, answers from `bdm:trial_ended`
  extensions), and plays it back read-only through the existing `StepRenderer` (pointer-events:none,
  no-op onAnswer — no renderer change). Controls: timeline scrubber, play/pause, speed (0.5/1/2/4×).
  Mouse overlay: `src/replay/cursor.ts` animates pointer from the `mouse` track when present. Files:
  `src/replay/{reconstruct,cursor,clock,load}.ts` + `src/replay/{ReplayView,ReplayApp}.tsx`; normal
  run path is unchanged. **RP2 + RP3 follow-ups:**
  - **RP2 — VS researcher reads.** Expose `GET /v1/deployments/{id}/events` (event log) + a
    per-session variant so a researcher can pull a participant's `bdm:` statement stream from the VS
    without direct DB access. Pair with a runtime read so the caller can build a bundle client-side.
  - **RP3 — live `?replay=<deployment>/<session>` loader.** A player-side loader that calls the RP2
    endpoints, assembles `{runtime, statements, mouse?}` in memory, and passes the bundle into the
    existing `ReplayApp` — giving researchers a shareable URL into any participant's run (researcher
    auth required).
  - **Live selected/deselected pre-commit highlighting.** During replay, show each option's
    hover/focus/selected visual states in sync with the reconstructed pointer + answer timeline, so
    reviewers can see the momentary selection before the participant confirmed.
  - **Revision-diff UI.** When a step has multiple `RecAnswer` revisions, surface a visual diff
    (e.g. strikethrough old answer → new answer) so reviewers can see how the participant changed
    their mind.
  - **Export replay as video.** Drive the replay at 1× speed via `MediaRecorder` + `captureStream`
    on the player canvas/window and produce an `.mp4` / `.webm` download — useful for qualitative
    research reports and stakeholder demos.
- ~~**#8 Respondent-bot.**~~ **DONE (2026-06-30)** — built as a standalone tool at
  `tools/respondent-bot/` (Node + Playwright). Seeded trait model (random / acquiescence /
  straight_line / extreme / midpoint / fixed), default real-pointer UI driver + `--direct`
  fast lane, and real `?deployment=` runs that tee the `bdm:` statements into a portable
  `trace.json` (the artifact #7 replays). See its README/HANDOFF. v1 targets anonymous-capable
  deployments; authenticated + checkbox/matrix controls are deferred.

## SP2 follow-ups — mouse capture track (2026-06-30)

- **Deployment-level capture config.** Sample rate and channel set are currently controlled by `?mouse_hz=` (URL param) and the `channels` flag baked at mint time. Extend the VS `channels` shape to let researchers configure the sample rate and which channels are active per deployment (rather than relying on the URL param override). Needs a VS schema change + denormaliser passthrough.
- **Keyboard channel capture.** The current `channels` shape has `mouse` only. A `keyboard` channel (keydown/keyup events with timestamps, no content) would complement pointer capture for timing-based analytics — design the channel shape and add a `KeyCapture` sampler alongside `mouseCapture.ts`.
- **Resumed sessions must not re-start capture.** A session resumed from IndexedDB should not re-emit `bdm:recording_started` or begin a second recording. The current implementation starts capture fresh on every mount — add a resume-state check so capture is skipped (or resumes appending to the existing recording, once chunked upload lands) when the session token is from IndexedDB.
- **Chunked mid-run upload + canonical `.jsonl.gz`.** The current implementation accumulates all samples in memory and uploads once at finish. For long sessions this is fragile (tab crash = total loss). Add periodic chunked uploads during the run and define a canonical `.jsonl.gz` storage format at the VS level (SP3 follow-up).
- **Live end-to-end verification (player → VS → researcher read).** The player-side track is functionally complete but has not been exercised end-to-end against a real VS with `channels.mouse` enabled. Verify: mint returns `channels.mouse`, capture runs, upload succeeds via `POST /v1/sessions/{id}/recordings`, and a researcher can read back the recording from `GET /v1/deployments/{id}/recordings`.

## PA-4 follow-ups — consent gate + completion polish (2026-06-24)

- **Resumed sessions use the default finished screen.** The `confirmation_message` and
  `redirect_url` from the deployment mint are held in the runner's in-memory state; they
  are **not persisted** to IndexedDB. A resumed session (page reload after completion) will
  show the default "Thank you" screen and no redirect, because the mint is not re-run on
  resume. Fix by either (a) persisting these two fields alongside the resume record, or
  (b) always re-minting on resume so the latest deployment values are available.
- **Consent is not versioned.** The runner records `bdm:consented` but does not record
  *which version* of the consent text was accepted. If the researcher edits the deployment's
  `consent` field after some participants have already consented, there is no way to
  distinguish between old- and new-form acceptances. Versioned consent tracking is
  Phase-5 Platform (see VS FOLLOWUPS → PA-4).

## PA-3 follow-ups (change-password + session layer — 2026-06-23)

- ~~**Change-password UI.**~~ **DONE (PA-3, 2026-06-23)** — `AccountView` now shows a "Change
  password" section (old + new ≥ 8 chars) when signed in; calls `changePassword(authFetch,
  identityBaseUrl, old, new)`; the participant stays logged in on success. Remaining email work
  and display-name editing are tracked below.
- ~~**Email verification + forgot/reset-password UIs deferred to the "email" slice.**~~ **DONE (email slice, 2026-06-23)** — `VerifyEmailView` (`/verify-email?token=`) auto-verifies on load; `ResetPasswordView` (`/reset-password`) handles both request (email form) and set (new-password form with `?token=`) modes; a **"Forgot password?"** link on the AccountView login tab opens `/reset-password`. Identity client functions `verifyEmail`, `requestPasswordReset`, `resetPassword` added to `src/session/client.ts`.
- **Resend-verification still deferred.** There is no resend button or endpoint yet. A participant whose verification email expired must wait for the Identity service to add a `POST /v1/auth/resend-verification` endpoint (tracked in identity-service FOLLOWUPS).
- **Display-name editing not yet supported.** The Account page shows the logged-in email address
  but there is no field to set or change a display name. Add a `PATCH /v1/auth/me` Identity
  endpoint + an `AccountView` name field in the same slice that adds the profile fields.

## PA-2 follow-ups (consolidated SPA — 2026-06-23)

- ~~**Change-password / email-verification / password-reset UI (PA-3).**~~ **DONE (PA-3, 2026-06-23)** — change-password shipped; email flows remain deferred (see PA-3 follow-ups above).
- **Prod SPA-fallback rewrite.** When the web-viewer is deployed as a static site (Vercel or
  equivalent), the server must rewrite all non-asset paths to `index.html` so that direct navigation
  to `/my-data` or `/account` works.  Mirror `library-web`'s `vercel.json` pattern:
  `"source": "/((?!api/).*)", "destination": "/index.html"`.
- **Runner has no nav shell — intentional.** The questionnaire runner (entered via `?deployment=`,
  `?invite=`, or `?fixture=`) renders without the `NavShell` header so the participant stays in
  uninterrupted focus mode.  Returning to the catalogue after completing a run is via the
  deployment's redirect URL (if configured) or the browser back button.  This is by design, not a
  gap.
- **Anon `/my-data` shows two "Log in" signals.** When an anonymous participant navigates to
  `/my-data`, they see both the `NavShell` **Account** link and the `MyDataView` inline prompt
  (`"Log in to see your data"`).  Minor redundancy; de-dupe in a polish pass (e.g. the view could
  simply redirect to `/account` immediately).
- **Router uses `flushSync` on navigate.** `src/shell/router.tsx` wraps `pushState` + the
  `useSyncExternalStore` snapshot update in `flushSync` to ensure the new route is committed before
  the browser paints.  This is correct and sound; noted here because `flushSync` inside React
  render trees requires care if the router is ever refactored.

## PA-1 follow-ups (session layer — 2026-06-23)

- ~~**Register UI + full nav shell (PA-2/PA-3).**~~ **DONE (PA-2, 2026-06-23)** — register + nav shell + `/account` route shipped. Remaining: change-password / email-verification / password-reset (PA-3) — see PA-2 follow-ups above.
- **httpOnly-cookie hardening.** The refresh token is stored in `localStorage`. A future hardening pass should move it to an httpOnly cookie (set by the Identity service) so it is not reachable by injected JavaScript. This requires a server-side cookie endpoint and a CORS-cookie posture review.
- **Multi-tab storage-event sync.** If a participant logs in or out in one tab, other open tabs do not automatically update their session state. A `storage` event listener on `window` should propagate the change across tabs.
- **Proactive pre-expiry refresh.** The provider refreshes lazily (on `401`). A proactive refresh ~60 s before `expires_in` would eliminate the brief window where any concurrent call might see a 401.
- **"Log out everywhere" (revoke all).** The current `logout()` revokes only the current refresh token. A "log out everywhere" action (revoke all tokens for the account) requires a VS or Identity endpoint (`DELETE /v1/auth/sessions`) — deferred.
- **Runner mint uses raw access token (not `authFetch`).** `App.tsx` calls `POST /v1/sessions/new` with the plain `accessToken` from the session context, outside of `authFetch`. If the token expires in the narrow window between the provider's boot refresh and the mint call, the VS returns a `401 auth_required` and the runner shows the login screen instead of silently refreshing. Fix: pass `authFetch` into the mint call so the 401-retry path covers it.
- **MyData empty-state "Browse questionnaires" CTA.** The PA-2 `MyDataView` shows `"No completed questionnaires yet."` in the empty state without a browse link. The `NavShell` **Home** link is always present, so this is not a dead end — but a dedicated CTA would be more helpful. Restore in a polish pass (see PA-2 follow-ups: anon `/my-data` redundancy note).

## PP-D follow-ups (participant home portal — 2026-06-22)

- ~~**Merge home + my-data into one tabbed portal.**~~ **DONE (PA-2, 2026-06-23)** — `home.html` and `mydata.html` are removed; the SPA provides `/` (catalogue), `/my-data`, and `/account` under a single `NavShell`.
- **No search or filter on the catalogue.** The home portal renders all listed+open
  deployments as a flat list. Search (by title/description), category/tag filtering,
  and pagination are deferred until the catalogue grows beyond a handful of entries.

## PP-C follow-ups (MyData portal — 2026-06-22)

- ~~**Login-only — no self-register.**~~ **DONE (PA-2, 2026-06-23)** — `AccountView` at `/account` provides both register (auto-login) and profile/logout.
- ~~**Merges with PP-D pick-a-questionnaire into one participant home.**~~ **DONE (PA-2, 2026-06-23)** — unified into the SPA shell.
- **No human titles yet.** The session table shows `instrument_id` + `instrument_version`
  (machine identifiers). The VS `/v1/me/sessions` endpoint does not yet return a human
  title; a Library lookup is needed (tracked in the VS FOLLOWUPS).

## PP-B follow-ups (signed invite links — 2026-06-22)

- **Invite participants cannot recover data across devices (by design).** Invite sessions are
  anonymous — no Identity account is attached. The session token persists to IndexedDB on the
  same device/browser, so a reload within the same origin resumes normally. But switching
  devices or clearing the browser store means the session is unrecoverable. This is the
  expected posture for PP-B (no account = no cross-device continuity). PP-C is account-only;
  an optional "attach an account" upgrade path is tracked in the VS FOLLOWUPS.

## PP-A follow-ups (authenticated participant sessions — 2026-06-22)

- ~~**Login only — no self-register screen.**~~ **DONE (PA-2, 2026-06-23)** — see `AccountView` at `/account`.
- **Access token used once at mint (no refresh).** The Identity access token is fetched at
  login and passed once to `POST /v1/sessions/new`. It is not stored and not refreshed. If the
  token expires between login and mint (the window is tiny, but possible on slow networks), the
  user will see a generic network/auth error. Full token-refresh handling is deferred.
- **"My data" view is PP-C.** Participants cannot yet view or export their own response history
  from within the web viewer. This is deferred to PP-C (requires a participant-scoped VS query
  endpoint).

- Renderer types are hand-written against the faithful projection; add a type-conformance test against the canonical runtime examples once they are regenerated (denormaliser follow-up).
- `style.layout` refinements — **number scales now honour `style.layout: slider | rating | input`** (2026-06-26, see the resolved slider entry below). The remaining unrendered hint is **`dropdown`** for long choice lists (still shows the base RadioGroup).
- Matrix on very narrow viewports relies on horizontal scroll (contract-compliant); author-defined breakpoints remain a schema-reserved future.
- Session token in memory only — refresh loses the session until WV-E resume lands. (~~"Answers are not submitted yet"~~ — resolved by WV-B; the remaining gap is the in-memory queue, see README caveats.)
- `SubmissionQueue.flushKeepalive` is optimistic (clears the queue on pagehide without delivery confirmation) — acceptable while the page is being destroyed; revisit with WV-E IndexedDB durability.
- Finishing flow's 10 s idle timeout is a soft heuristic; surface queue depth in the submitting screen if field reports show long drains.
- Manifest `viewer_version` bump check (CI: manifest diff ⇒ version bump) deferred to WV-F.
- ~~design/08_viewer.md presentation-modes note~~ — DONE at WV-A merge (design/08 §"Presentation modes").
- **Date questions are not expressible** (owner note 2026-06-12): Schema 2's `input_data_type` is `choice|number|text`, so a date item renders the UnsupportedElement card (see the `widgets` fixture). Workaround: author as `text` + RegEx validation or `number` (year). Native date support = breaking Schema 2 bump (new OD) + §13 derivation row + widget + manifest addition — decide if/when a real instrument needs it.
- ~~**Slider / number-interval widget unsupported → those questionnaires fail preflight**~~ **DONE + LIVE (2026-06-26, merged 4fbcb4de).** Root cause was a naming bug, not a missing widget: the denormaliser's `_widget_triple` appended the choice-only `selection` to every option, so a `number`/`interval` option emitted `number.interval.single` — which the manifest (correctly) never listed → preflight rejected it. **Fix (a) reconcile the naming:** `_widget_triple` now produces canonical `number.{m}` / `text.{m}` (selection only for `choice`); no manifest / `viewer_version` change. **Plus the rendering (owner wanted both):** `ItemRenderer` renders `number.*` via a pure helper `numberPresentation(option, style?.layout)` → a `style.layout` hint (`slider`/`rating`/`input`) wins (falls back to `input` if it needs bounds the option lacks), else auto — bounded integer scale with ≤ 11 points → **`NumberRating`** (segmented numbered buttons, radiogroup), wider/continuous → **`Slider`** (`<input type=range>` + value readout + numeric end labels), unbounded → existing `NumberInput`. New `ItemElement.style?: { layout?: string }`. Browser-verified live: **FSQ 1–7 / RPS 1–9 / SHS 1–7 → rating buttons; SECS 0–100 → slider**; their scorers run (the 4 flipped 422→200 after the VS redeploy). Spec/plan: `docs/superpowers/specs|plans/2026-06-26-numeric-scale-widgets*.md`. ~~v1 a11y follow-ups~~ **DONE + LIVE (2026-06-29, commit ad83777d):** `NumberRating` now implements the full WAI-ARIA radiogroup keyboard pattern (roving tabindex + Arrow/Home/End, selection follows focus); an unanswered `Slider` announces `aria-valuetext="Not selected"` so AT no longer reads the midpoint thumb as a choice; and (bonus) the `CommentWidget` modal traps Tab + restores focus to its trigger on close. Tests for all three; widget tests 8/8, web-viewer 279. Verified the live player bundle carries them. Deploy note: the VS bundles the denormaliser as a sibling, so going live needs `scripts/redeploy-participant-stack.sh vs` (no `runtime_cache` purge needed — preflight *rejections* aren't cached); the player redeploys for renderer-lib changes.
- ~~**Visual design + behaviour polish pass** (owner, 2026-06-12): a dedicated owner-driven iteration on the viewer's look & feel is wanted after the functional stages — candidates: restyle the focus ring on step headings (raw black outline today), tighter optical centring on sparse steps (~5vh up-shift), transition tuning, choice-card hover/selected states, theme typography. Schedule alongside or after WV-B.~~ **DONE (Stage 1, 2026-06-13)** — all five candidates shipped via the theme system: focus-ring restyle (outline:none on heading, rings preserved on controls), optical centring (~5vh up-shift), transition tuning, choice-card hover/selected states, theme typography. Built: data-driven `ViewerTheme` token model (`src/theme/`), `applyTheme` (`src/app/theme.ts`), universal `qv-*` CSS polish, three built-in themes (Minimal default, Sage, Artsy), dev-only registry-driven gallery (`/gallery.html`, `?theme=<id>` preview), per-theme WCAG-AA contrast test. Theme authoring: see `THEMES.md` + the dev gallery at `/gallery.html`. **Stage 2** (remaining built-in themes: Warm, Warm-mesh, Soft-float, Dotted-cool/warm, Lavender; + gallery polish; + optional VS-bundle full-token extension) pending.
- Auto-advance a11y: revisit after first live use; the Godot Native Viewer must match `x_presentation` semantics or declare non-support in its manifest.
- `keyHints` letter shortcuts are intentionally suppressed inside Sections (App enables them only for single-item steps) — revisit if plain sections appear in focus mode.
- StepTransition uses an eslint-suppressed closure pattern — consider the useRef idiom if it grows.
- `applyTheme` does not clear vars set by a previously applied theme — irrelevant until themes can switch mid-session.
- Gating residual: a required choice item whose locale texts are missing (mergeOptions throw) still gates Next (needs locale-aware renderability check) — unreachable with denormaliser-produced runtimes, fix with WV-D validation work.
- First-render focus: the step-heading focus effect also fires on the initial step — review whether initial autofocus is wanted once real participants test it.
- **Schema 5 attempt fields** (owner, 2026-06-12): promote `x_response_revises`/`x_response_revision` to first-class Schema 5 fields (`response_revises`/`response_revision`, or BDM-style `attempt_index`) at the next Schema 5 CalVer boundary + file the matching BDM upstream change request (new D-entry in design/05c). Principle: ALL attempts are recorded — exact reproduction of what happened; dedup is analysis-side only.
- Retry after a finishing failure re-emits `bdm:completed` (one per attempt before the single `bdm:submitted`) — schema-legal and arguably faithful; revisit if analysts object.
- `flushKeepalive` can double-send the item that was in flight at pagehide (it is still queued until acknowledged) — second flavour of the optimistic-keepalive note above; the all-attempts model tolerates duplicates.
- Finishing effect's 10 s timeout timer is not cleared on early idle (dangling, harmless).
- **External Scorer execution + in-session score display** (OD-16 Scorer track): `score(id)` resolves to an unavailable sentinel (null) until the Scorer host lands — score-gated branches and any in-session score readout are inert by design until then.
- **`randomize` (Page/Section) is unimplemented** — needs a seeded-RNG determinism decision (reproducible order per session/agent) before it can ship; deferred.
- **Piping v1 covers prompt-text only**, matched by `field_path` prefix — richer field targeting (non-prompt content, sub-fields) is later work.
- **Multi-rule visibility precedence is first-firing-wins**; the spec's "`show:true` force-show override" is an untested edge case (no fixture has two rules targeting one element) — revisit if that ever occurs.
- The `next` reducer action is **retained for the degenerate no-pipeline safety path** but does NOT push the visited stack — harmless and unreachable once a pipeline is built (App always builds one).
- The evaluator wasm **rebuilds on every `npm run build`** (~6 s) — cache the `build:evaluator` output if CI build time becomes a concern.
- **Session token persisted in IndexedDB** (WV-E, F1): currently safe because tokens are **anonymous / opaque / origin-scoped** — revisit the storage posture if **authenticated deployments** arrive.
- **Theme is NOT re-fetched on resume** (WV-E): defaults are applied on a resumed session — small follow-up, or fold into WV-F.
- **Multi-tab coordination is last-writer-wins** (WV-E): no cross-tab locking/broadcast; the most recent writer's state wins.
- **Offline / PWA queue-and-sync is WV-F**: the in-memory submission queue still loses not-yet-sent rows/events on refresh until durable offline sync lands.
- **No participant "start over" affordance** (WV-E): a deliberate self-service reset of the persisted resume state is deferred.
- **Fully-lazy evaluator load** (WV-F, F3): the WASM load is overlapped with the mint (PERF-01) but not deferred until the first logic-requiring step — make it fully lazy if PERF profiling on real instruments demands it.
- **npm publish of `@behaverse/questionnaire-renderer`** (WV-F): the renderer library is consumed by **local path** today; an actual npm publish happens at the deferred repo split (project_repo_topology) — until then the Editor imports it from the workspace.
- **Offline-first MINT is out of scope** (WV-F): a first visit still needs the network to mint a session; truly offline-first kiosk operation is the **Native / Godot viewer's** domain, not the Web Viewer's.
- **Renderer-lib ships precompiled CSS** (WV-F): `dist-lib/renderer.css` is shipped for drop-in use; an Editor whose own Tailwind build already generates the renderer's utility classes can **skip importing `renderer/style.css`** to avoid duplication.
- **PWA icon is a single SVG** (WV-F): swap for a multi-size PNG icon set if app-store-install polish (richer install prompts / platform icon requirements) is wanted.
- **In-session scoring (SP2a, done):** `score(id)` runs live for branching (boot-compile + page-submit refresh; sentinel-null on failure). SP2b adds score **display** (`show_score`/`show_score_live`) + Schema 6 `scorer_outputs` persistence (new VS endpoint). The vendored scorer host (`src/scoring/vendor/`) is generated from `questionnaire-scorer/host` — run `scripts/build-scorer-host.mjs` if the drift test fails.
- **Score display convention (SP2b):** display scores = `PinnedScore`s with a non-empty `name` (`src/scoring/display.ts`). This is a SOFT convention — a questionnaire that mixes display + branching-only scores under `show_score=true` could mis-show a named branching score or omit an unnamed display score (cosmetic, fixable via the `name`). If it becomes a real authoring problem, add an explicit `display?: boolean` to the Schema 2 `Score` (additive CalVer bump + denormaliser passthrough); `displayScores()` centralises the rule so the switch is one function.
- **In-session scoring (SP2b, done):** scores display at terminal + live (root flags `runtime.x_show_score`/`x_show_score_live`, emitted by the denormaliser via the `^x_` extension — no Schema 3 bump); `scorer_outputs` persisted to the session (JSONB) via `POST /sessions/{id}/scorer_outputs`. SP3: forward `scorer_outputs` to Behaverse; server-side http/python/r executors; Library scorer-artifact storage.
- **Score-progression projection (#4, done 2026-06-29):** at completion the player also persists a display-ready projection `x_score_display: [{id, name, value}]` (named numeric scores only, via `buildScoreDisplay` in `src/scoring/display.ts`) as a sidecar in the same `POST /sessions/{id}/scorer_outputs` body. The VS stores it in `session.score_display` and returns it from `GET /v1/me/sessions`; `participant-app` charts it. No backfill of pre-existing sessions.

## Resume dead-end (2026-06-23, found during PA-2 manual testing)

- **`resume_unreachable` is a dead-end "Try again" loop.** When `resolveResume`'s `getSession`/`getRuntime`
  returns a network/5xx (e.g. VS 500s building an unsupported locale, or VS is briefly down), the runner
  shows "Something went wrong … Try again" with no escape. It should offer a **"Start fresh"** action
  (clear the IndexedDB resume record for that deployment + mint a new session) rather than trapping the
  participant, and ideally treat a failed runtime fetch as recoverable-to-fresh after N retries.
