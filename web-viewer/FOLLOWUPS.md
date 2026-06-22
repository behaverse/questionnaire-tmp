# web-viewer — deferred work / follow-ups

## PP-C follow-ups (MyData portal — 2026-06-22)

- **Login-only — no self-register.** The portal shows the `LoginView` (email + password)
  but has no "create account" path. Self-registration is deferred (PP-B/PP-D or later).
- **Merges with PP-D pick-a-questionnaire into one participant home.** PP-D will add
  a "start a new questionnaire" flow (browsing / launching deployments). The MyData portal
  and the PP-D questionnaire picker should eventually merge into a single participant
  home page rather than two separate HTML entries.
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

- **Login only — no self-register screen (PP-B).** The login form (`LoginView`) is email +
  password only; there is no "create account" path. Self-registration is deferred to PP-B
  (signed invite links or a dedicated participant registration flow).
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
