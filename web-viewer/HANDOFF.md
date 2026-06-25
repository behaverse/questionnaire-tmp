# Web Viewer (the player) — Handoff

**Path:** `web-viewer/` · **Stack:** Vite + React 19 + TypeScript + Tailwind · **Status:** ✅ feature-complete + LIVE (https://player-sooty-six.vercel.app) · **Suggested branch:** `work/web-viewer`

> The **player**: the participant-facing focus-mode questionnaire runner. It mints a session from the Viewer Service, renders the Schema-3 runtime one question per view (Typeform-class — the owner's locked visual direction; **never** Google-Forms density), captures Schema-5 responses + `bdm:` events, and submits them back to the VS. It ALSO builds the renderer + scoring libraries that the Editor consumes.
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **Runner only.** `index.html` → `<App/>`, entered via `?deployment=`, `?invite=`, or `?fixture=`. No nav shell — intentional focus mode. The participant **portal** (catalogue / account / my-data) is now the sibling **`participant-app/`** package; the player returns there via the **Done** button / `?return_url=`.
- **Renderer + scoring libs (OD-03):** `npm run build:lib` → `dist-lib/` ships `@behaverse/questionnaire-renderer` (ESM, React peer) + `/scoring` + CSS + dts. **The Editor preview IS this deployed renderer** — there is no separate engine. Consumed by local path today.
- **Embedded WASM expression evaluator (OD-11):** show_if / skip / branch / piping / validation run entirely in-browser. Built `--target web` by `npm run build:evaluator` via the `predev`/`prebuild` hooks.
- **Embedded scorer engine (OD-16):** `score(id)` runs live for branching + score display; `scorer_outputs` persist to the session (Schema 6). Vendored host in `src/scoring/vendor/` (regenerate via `scripts/build-scorer-host.mjs` if the drift test fails).
- **Session resume (OD-14) + locale switch:** per-question state + session token persist to IndexedDB (DB `behaverse-web-viewer`, store `resume`, keyed by deployment); a reload resumes at the first unanswered visible question in the last-active locale. `LocaleSwitcher` swaps text with answers intact.
- **Participant auth:** anonymous / invite / demo need no login; `authenticated` deployments use the player's own `LoginView` (or the SSO-handoff exchange). All via the shared **`@behaverse/participant-session`** package (`useSession()`).
- **Distribution:** iframe embedding (`behaverse:loaded|completed|resize` postMessage), PWA shell (SW precaches shell + evaluator WASM), Schema-7 manifest at `/manifest.json`.

## Run & test
```bash
cd web-viewer && npm install
npm run dev            # default port 5173; open ?fixture=mini|matrix|widgets|branch (no backend needed)
npm test               # vitest (~315 tests) + Schema 7 manifest validation
npm run typecheck      # tests mock loadEvaluator — no prior wasm build needed
npm run build          # tsc + builds evaluator --target web + bundles the wasm
npm run build:lib      # renderer + scoring library (OD-03) → dist-lib/ (ESM + dts + CSS)
npm run test:lib       # smoke against the built dist-lib
```
Gotchas:
- **Evaluator build needs `cargo` + `wasm-pack` on PATH** — run `. "$HOME/.cargo/env"` first; the `predev`/`prebuild` hooks invoke `build:evaluator`.
- **After changing the renderer lib you MUST re-run `npm run build:lib`** (and restart the Editor) for the Editor to pick up the change. The lib is consumed by local path.
- The **VS + Identity origins** must be in this player's reach, and this player's origin must be in the **VS `VS_CORS_ORIGINS`** + Identity CORS allow-lists. Run against a live VS per README "Running against a live Viewer Service".
- The renderer's `qv-theme` CSS block must stay **byte-identical** in `src/index.css` and `src/renderer/lib.css` (`src/theme/sync.test.ts` enforces it).

## What's left to do
The player is feature-complete and live; remaining items are optimisations, polish, and schema/repo-blocked work.

### Now
- **Resume carries the wrong finished screen.** `confirmation_message` / `redirect_url` from the mint are in-memory only — a resumed (reloaded-after-complete) session shows the default thank-you with no redirect. Persist them with the resume record, or re-mint on resume. ([FOLLOWUPS.md](FOLLOWUPS.md) → PA-4)
- **Theme not re-fetched on resume.** A resumed session falls back to default theme tokens. Small fix; persist or re-fetch the theme on resume. ([FOLLOWUPS.md](FOLLOWUPS.md) → WV-E)
- **`resume_unreachable` dead-end loop.** When `resolveResume`'s session/runtime fetch 5xx's (e.g. VS locale-500 or VS down), the runner traps the participant in "Try again". Add a **"Start fresh"** action (clear the IndexedDB resume record + mint anew) and treat a failed runtime fetch as recoverable-to-fresh after N retries. ([FOLLOWUPS.md](FOLLOWUPS.md) → "Resume dead-end")

### Next
- **Fully-lazy evaluator WASM (PERF F3).** The ~1 MB (392 KB gzip) WASM load currently overlaps the mint (`Promise.all` in `boot()`) — make it fully lazy / on-demand (only fetch once a logic step is reached). See [PERF.md](PERF.md).
- **Visual Polish Stage 2 — 6 more themes.** Stage 1 shipped Minimal / Sage / Artsy. Add Warm, Warm-mesh, Soft-float, Dotted-cool/warm, Lavender + gallery polish. One token file per theme; follow the verify loop in [THEMES.md](THEMES.md) (`/gallery.html`, contrast + sync tests must stay green).
- **Catalogue / runner polish.** Multi-tab `storage`-event session sync; proactive pre-expiry refresh; runner mint should use `authFetch` (not the raw access token) so the 401-retry path covers it. ([FOLLOWUPS.md](FOLLOWUPS.md) → PA-1)
- **`randomize` (Page/Section) unimplemented** — needs a seeded-RNG determinism decision (reproducible order per session) before it can ship.

### Deferred / blocked
- 🔒 **Date questions unsupported (schema CalVer bump).** Schema 2 `input_data_type` is `choice|number|text` — date items render the `UnsupportedElement` card (see the `widgets` fixture). Native date support = breaking Schema 2 bump (new OD) + §13 derivation + widget + manifest addition. Workaround: author as `text` + RegEx or `number` (year).
- 🔒 **npm publish of `@behaverse/questionnaire-renderer` (repo split).** Consumed by local path until the deferred multi-repo split (project_repo_topology); the Editor imports from the workspace meanwhile.
- 🔒 **httpOnly-cookie refresh token (Identity).** Refresh token lives in `localStorage`; hardening to an httpOnly cookie needs a server-side cookie endpoint + CORS-cookie review.
- **SP3 scoring extensions** — forward `scorer_outputs` to Behaverse + server-side http/python/r executors + Library scorer-artifact storage (VS-side).
- See [FOLLOWUPS.md](FOLLOWUPS.md) for the full backlog (consent versioning, display-name editing, resend-verification, in-memory queue durability, multi-tab last-writer-wins, etc.).

## Conventions & gotchas
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the **harvester agent shares this checkout** and pushes master.
- **Focus-mode is locked.** One question per view, auto-advance on single choice; never Google-Forms density.
- **All durations are in SECONDS** (Schema 5 / BDM convention), not ms. **ALL response attempts are kept** — Back-and-edit emits a new revising row; dedup is analysis-side only, never storage-side.
- Themes are **data-only** (no structural change — cross-viewer fidelity contract); keep WCAG-AA contrast green and the `qv-theme` CSS synced across the two files.
- Prod static deploy needs an SPA-fallback rewrite (mirror `library-web`'s `vercel.json`: non-`api/` paths → `/index.html`).

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md) · [PERF.md](PERF.md) · [THEMES.md](THEMES.md)
- Specs: `docs/superpowers/specs/2026-06-11-web-viewer-wv-a-design.md` + the PA-1/PA-2 design docs alongside it.
- Design: [design/08_viewer.md](../design/08_viewer.md) (presentation modes, viewer contract).
- Participant journey end-to-end: [docs/testing-participant-flow.md](../docs/testing-participant-flow.md).
- Sibling packages: `participant-app/` (portal), `participant-session/` (shared auth), `viewer-service/`, `identity-service/`, `editor/` (renderer-lib consumer).
- Root [HANDOFF.md](../HANDOFF.md) for system-wide context.
