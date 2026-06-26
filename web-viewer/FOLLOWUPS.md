# web-viewer — deferred work / follow-ups

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
- `style.layout` refinements (dropdown / slider-like) unrendered until WV-D — base widgets shown meanwhile.
- Matrix on very narrow viewports relies on horizontal scroll (contract-compliant); author-defined breakpoints remain a schema-reserved future.
- Session token in memory only — refresh loses the session until WV-E resume lands. (~~"Answers are not submitted yet"~~ — resolved by WV-B; the remaining gap is the in-memory queue, see README caveats.)
- `SubmissionQueue.flushKeepalive` is optimistic (clears the queue on pagehide without delivery confirmation) — acceptable while the page is being destroyed; revisit with WV-E IndexedDB durability.
- Finishing flow's 10 s idle timeout is a soft heuristic; surface queue depth in the submitting screen if field reports show long drains.
- Manifest `viewer_version` bump check (CI: manifest diff ⇒ version bump) deferred to WV-F.
- ~~design/08_viewer.md presentation-modes note~~ — DONE at WV-A merge (design/08 §"Presentation modes").
- **Date questions are not expressible** (owner note 2026-06-12): Schema 2's `input_data_type` is `choice|number|text`, so a date item renders the UnsupportedElement card (see the `widgets` fixture). Workaround: author as `text` + RegEx validation or `number` (year). Native date support = breaking Schema 2 bump (new OD) + §13 derivation row + widget + manifest addition — decide if/when a real instrument needs it.
- **Slider / number-interval widget unsupported → those questionnaires fail preflight** (found 2026-06-26 wiring scorers): questionnaires whose items use a single-value numeric **slider** emit the widget id `number.interval.single`, which is **not in the viewer manifest** (`public/manifest.json` lists `number.interval` and `number.ratio`, without the `.single` suffix). The VS runtime pre-flight therefore rejects them with `unsupported_widget` (kind `number.interval.single`), so they never render. Affects **4 harvested questionnaires — FSQ, SECS, RPS, SHS** (all use 0-N / 1-N sliders). Their `scr_*` scorers are authored, conformant, wired and live, but **unreachable** until the viewer renders this widget. Fix is one of: (a) **reconcile the naming** — confirm whether the denormaliser/Schema-7 widget id should be `number.interval` (drop `.single`) or the manifest should add `number.interval.single`; (b) **implement a slider widget** (`<input type=range>` bound to the option's `min`/`max`/`step`/`initial_value`, with `min_label`/`max_label`) and add its id to `widgets` in the manifest (bump `viewer_version`). Until then these 4 run only their (already-correct) scoring once rendering is possible. See `questionnaire-scorer` batch 18.
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

## Resume dead-end (2026-06-23, found during PA-2 manual testing)

- **`resume_unreachable` is a dead-end "Try again" loop.** When `resolveResume`'s `getSession`/`getRuntime`
  returns a network/5xx (e.g. VS 500s building an unsupported locale, or VS is briefly down), the runner
  shows "Something went wrong … Try again" with no escape. It should offer a **"Start fresh"** action
  (clear the IndexedDB resume record for that deployment + mint a new session) rather than trapping the
  participant, and ideally treat a failed runtime fetch as recoverable-to-fresh after N retries.
