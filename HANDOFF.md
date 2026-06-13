# Handoff

Orients a new agent (or contributor) to the project's current state. Read this once; then go to `design/00_index.md` for the authoritative design and `plan/01_roadmap.md` for sequencing.

**Last updated:** 2026-06-12 — **Phase 1 shipped. Phase 2 backend COMPLETE; Web Viewer WV-A + WV-B (LINEAR GATE CLOSED) + WV-C (OD-11 evaluator) + WV-D (LOGIC LAYER) + WV-E (RESUME + LOCALE) + WV-F (DISTRIBUTION) — **the Web Viewer (WV-A..F) is COMPLETE.**** A participant completes a questionnaire in a real browser, Schema 5 rows + `bdm:` events flow through the Viewer Service outbox to `export.csv` (live-verified), and the canonical **reference expression evaluator** (Rust→WASM, OD-11) now exists for WV-D to embed. **Suites (run each separately): 120 viewer-service + 126 library + 56 denormaliser + 309 schema + 59 library-web + 110 web-viewer + 24 expr-core (Rust) + 31 expr-web (WASM vectors); web-viewer now 173, all green (122 viewer-service).** **The viewer evaluates logic (OD-11) AND now resumes interrupted sessions (OD-14): per-question state persists to IndexedDB incl. the session token → reload restores answers + lands at the saved/first-unanswered position in the last-active locale; a LocaleSwitcher swaps runtime text with answers intact; demo/ephemeral never persists. **The Web Viewer is now feature-complete: linear + logic/branching/validation/scoring + resume/locale + the renderer published as a library (OD-03), iframe host events, a PWA shell, and PERF-01. The remaining Phase-2+ work is the OD-16 Scorer-conformance runner (unblocks real `score(id)` execution), the Editor (which consumes the renderer library), the Native (Godot) viewer, and the Participant Platform. See the "Web Viewer — START HERE" brief below for the full WV-A..F summary.** (8 schemas in-repo, v26.0609; public hosting at behaverse.org deferred. Owner rulings 2026-06-12: ALL durations in SECONDS — Schema 5/4a READMEs; expression grammar now normative in design/15.)

---

## ▶ ACTIVE TASK — Visual Polish — START HERE (delegation brief for a new agent)

**The task (owner-requested, 2026-06-12).** A dedicated, **owner-driven iteration on the Web Viewer's look & feel**. The viewer is **functionally complete** (WV-A..F: rendering, logic/branching, validation, scoring, resume, locale, distribution) — **this pass is presentation only.** Do NOT change functional code (logic engine, resume, submission, navigation semantics); refine styling, spacing, motion, and the default theme. It's expected to be **iterative with the owner** — brainstorm the visual direction *with them* before building.

**Stage 1 — BUILT + MERGED (branch `wv-visual-polish`, 2026-06-13).** Delivered: a data-driven theme system (`ViewerTheme` token model + registry + `applyTheme`), the universal polish pass (focus-ring restyle — `outline:none` on the step heading, rings preserved on all interactive controls; optical centring ~5vh up-shift; transition tuning; choice-card hover/selected states), the **Minimal** (default), **Sage**, and **Artsy** built-in themes, a dev-only **registry-driven theme gallery** at `/gallery.html` (`?theme=<id>` for single-theme preview), and a per-theme **WCAG-AA contrast test** that sweeps the full registry. Theme authoring runbook: **`web-viewer/THEMES.md`** — start there for any future theme/UI work. **Stage 2** (remaining six planned themes: Warm, Warm-mesh, Soft-float, Dotted-cool/warm, Lavender; + optional VS-bundle full-token extension) is the next cycle.

**The owner's directive is load-bearing — do not drift from it** (memory `feedback_web_viewer_visual_direction`; [design/08_viewer.md](design/08_viewer.md) §"Presentation modes"):
- The Web Viewer must look **elegant and polished in the typeform.com mould — one question per view as the main emphasis.** It must NOT read as a dense **Google-Forms / LimeSurvey** form.
- **`focus` is the default presentation mode** (one element per step; `style.x_presentation: "classic"` opts into page-at-a-time). Keep focus mode the default and primary target of the polish.
- The **default theme should feel opinionated and polished** (a considered neutral background + one accent), NOT a grey form scaffold.

**Concrete starting candidates** (from `web-viewer/FOLLOWUPS.md` — *starting points, not exhaustive*; the owner will steer):
1. **Focus ring on step headings** — today the `h2[tabindex="-1"]` that receives focus on step-change shows the raw browser black outline (a WV-A/E a11y requirement put focus there). Restyle it to something subtle (or `outline-none` on the heading specifically while keeping visible rings on interactive controls — never remove focus indicators wholesale).
2. **Optical centring on sparse steps** — the single-question column sits a touch low/adrift in a tall viewport; nudge the optical centre up (~5vh) so a lone question feels intentionally placed.
3. **Step transitions** — tune the slide/fade timing & easing (currently `qv-step-in/out` ~220/200 ms in `src/index.css`).
4. **Choice-card hover/selected states** — the radio/checkbox "cards" (RadioGroup/CheckboxGroup) — richer hover, clearer selected state, the A/B/C letter-hint badges.
5. **Theme typography** — prompt scale/rhythm, the secondary Context/Instruction text, font pairing via the `--qv-font-family` var.

**Where the styling lives (all `web-viewer/`):**
- **Renderer** (the questionnaire content): `src/renderer/ItemRenderer.tsx`, `StepRenderer.tsx`, `SectionRenderer.tsx`, and `src/renderer/widgets/{RadioGroup,CheckboxGroup,NumberInput,TextInput,MatrixGroup,MessageBlock,UnsupportedElement}.tsx` — Tailwind utility classes inline.
- **Chrome** (the frame): `src/app/chrome/{NavButtons,ProgressBar,StepTransition,ErrorScreen,LocaleSwitcher}.tsx`; the App layout/centring is in `src/app/App.tsx`'s ready-view `<main>`.
- **Tokens & globals**: `src/index.css` (the `--qv-*` theme-var defaults + the step-transition keyframes); `tailwind.config.ts` (Tailwind aliases `primary/secondary/.../surface/font-theme` → the `--qv-*` vars). Colours/fonts come from the **theme bundle** the Viewer Service injects at session-mint and the viewer maps onto `--qv-*` (`src/app/theme.ts`); the built-in `default` theme (VS) is primary `#1a5fb4`, Inter — `index.css` mirrors it as the fallback.

**Hard constraints (must hold):**
- **Cross-viewer visual-fidelity contract** ([design/08_viewer.md](design/08_viewer.md) §"Cross-viewer contract"): only *physical-envelope* adaptations (zoom, OS font-size, scroll-on-overflow). **Never structurally substitute** — a matrix must keep scrolling horizontally on narrow screens, never collapse to a stacked list; focus mode must not reorder or split elements (a Section is one view).
- **WCAG 2.1 AA**: keyboard-completable, **visible focus indicators** (restyle, don't remove), sufficient contrast. `vitest-axe` tests exist across the widgets/matrix — **keep them green.**
- **Theme-driven, not hard-coded**: prefer the `--qv-*` vars / Tailwind theme aliases over literal hex so deployment themes still work; the VS enforces WCAG-AA contrast on themes at save.
- **The renderer is ALSO a published library (OD-03)** — visual changes to `src/renderer/` flow into the future Editor preview. Keep the theme-var block in **`src/renderer/lib.css` in sync with `src/index.css`**, and `npm run build:lib` must still succeed.

**See it / iterate:** `cd web-viewer && npm run dev`, then `http://localhost:5173/?fixture=mini` (also `?fixture=matrix`, `?fixture=widgets`, `?fixture=branch` — **fixtures are DEV-only**, no backend needed). Screenshot in a real browser to judge (Playwright chromium is installed; the `/run` skill or a small playwright script from `library-web/` can capture). The owner reacts to screenshots — show, don't describe.

**Process:** standing pattern — **brainstorm the visual direction WITH the owner** (use the `frontend-design` skill for execution quality) → spec → plan → build → review → **merge to master locally + push (no PRs).** Keep the **173 web-viewer tests** green; if a DOM/structure tweak breaks a structural assertion, update the test to match the new (still-accessible) markup. Pure-presentation diff — no functional changes.

**Authoritative refs:** memory `feedback_web_viewer_visual_direction`; [design/08_viewer.md](design/08_viewer.md) §§"Presentation modes" / "Cross-viewer contract" / "Theming"; `web-viewer/README.md` (dev quickstart, URL contract) + `web-viewer/FOLLOWUPS.md` (the visual candidates). The WV-A spec `docs/superpowers/specs/2026-06-11-web-viewer-wv-a-design.md` §6 has the original focus-mode design rationale.

---

## Current status (what's built vs not)

| Area | Status |
|---|---|
| **8 data-model schemas** | ✅ authored, tagged, validated (`schemas/`, 309 tests, 44 examples). Schemas 1 + 2 at **v26.0609**. **Kept in-repo; public hosting at `behaverse.org/schemas/` deferred** (out of MVP scope, owner decision 2026-06-10); the `$id`/`$ref` URLs stay as canonical identifiers the validator resolves locally. |
| **21 open decisions** | ✅ all resolved (`design/10_open_decisions.md`); latest **OD-21** (instrument-family grouping, 2026-06-09). |
| **Repo topology** | ✅ decided + locked (`design/14_repository_topology.md`). Multi-repo split **deferred** (see below). |
| **Library Core** (sub-project 1) | ✅ **built + merged** under `library/` — Python/FastAPI/PostgreSQL, `jsonb` source-of-truth + derived index ("Approach C"), Git-backed ingestion, public read API (`/v1` questionnaires + entities + dependents + search + facets + definition + withdrawn→410), filters + CORS. No auth, no write API (Git-ingest only); published+withdrawn lifecycle only. |
| **Legacy importer** (sub-project 2) | ✅ **built + merged** under `library/src/library/importers/survey_db/` — `survey_db.sqlite` → canonical Schema 2 JSON (+ provenance + loss report). Smoke test converts all (793 prompts, 64 questionnaires), validates every artifact, ingests into Postgres with zero errors. Emits `instrument_id` (OD-21) + computed `item_count`. |
| **Library web UI** (sub-project 5) | ✅ **built + merged** under `library-web/` — Vite + React 19 + TS + Tailwind read-only catalogue SPA (search → view metadata + items → download canonical JSON). Instrument-family grouping, collapsible facets, item counts, variant rendering. |
| **BDM upstream deviations D1–D6** | ✅ drafted + filed as issues upstream in `behaverse/data-model`; the deviation log remains in `design/05c_bdm_alignment.md`. |
| **Contribution/review workflow + DOI** (sub-project 3) | ❌ not started — needs auth/Identity (OD-08). |
| **Community signals** (sub-project 4) | ❌ not started — needs Identity. |
| **Runtime denormaliser** (Phase 2, sub-project 1) | ✅ **built + merged** to `master` (2026-06-10) under `questionnaire-runtime-denormaliser/` — pure, I/O-free Python lib: Schema 2 → Schema 3 (resolve refs → locale-trim → reconcile manifest → pin scorers → strip scoring → provenance). Injectable `resolve_entity`; collect-all `PreflightError`; `canonical_hash` for the future cache key. 56 tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-runtime-denormaliser*`. |
| **Viewer Service — VS-A (runtime generation core)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-10) under `viewer-service/` — FastAPI+Postgres service that mints cached Schema 3 runtimes (OD-18f 5-tuple `runtime_cache` + LRU + admin purge) by calling the denormaliser, reading from the Library via a new additive **resolution-bundle** endpoint (`GET /v1/questionnaires/{id}/versions/{v}/resolution-bundle`, added to `library/`). Viewer registry (Schema 7 manifests, direct POST upload), minimal deployments, deployment-level locale. HTTP-only Library access; no sessions/auth (VS-B/C). 26 tests. Decomposed into **VS-A → VS-B → VS-C**. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-viewer-service-vs-a*`. |
| **Viewer Service — VS-B (sessions + submission + forwarding)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-10) under `viewer-service/` — the participant data path: anonymous session mint (+ opaque hashed token + Schema 3 runtime), core resume (OD-14 sub-q3/q6) + locale switch, response/event submission (Schema 5/4a validated) to a durable Postgres `outbox`, the **OD-13** forwarder (`process_outbox_batch` + `forward-worker` CLI, backoff/max-attempts/tamper-check + `HTTPBehaverseSink`), two-tier bounds (503 hard cap). Lifecycle `in_progress→submitted→forwarded`. 60 VS tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-viewer-service-vs-b*`. |
| **Viewer Service — VS-C (deployment management & lifecycle)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-11) under `viewer-service/` — full deployment record (mode presets + 4 dimensions + `active_from`/`active_until` + `quota` + style/flow overrides + channels) via idempotent `ALTER`s; deployment CRUD (create/get/list/patch); wires the deferred **OD-14** rules into mint/resume (active-window + quota gating → 410/409; ephemeral refuse-resume → 409; ephemeral submissions validated but skip the outbox; asymmetric `active_until`). Delivers **UC-04 anonymous-link + UC-08 demo**. `mode_preset` defaults `anonymous_link` (demo supported; others rejected until Identity/Platform). 88 VS tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-11-viewer-service-vs-c*`. |
| **Viewer Service — VS-D (response export / CSV serializer)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-11) under `viewer-service/` — gate-blocking **UC-11**: `GET /v1/deployments/{id}/export.csv` streams a BDM-native CSV of all collected responses for a deployment (pure `export_csv` serializer: 72-column header derived from Schema 5 `Response`, non-scalar cells JSON-encoded; `iter_response_rows` flattens outbox `ResponseSet`/bare-`Response` payloads, events excluded, demo/ephemeral absent; own-connection `StreamingResponse`). 98 VS tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-11-viewer-service-vs-d*`. |
| **Viewer Service — VS-E (monitoring dashboard + theme infrastructure)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-11) under `viewer-service/` — `GET /v1/deployments/{id}/metrics` per-deployment snapshot (active/completion/quota/recent + OD-13 forwarding alert; SSE + abandonment-hotspots deferred); theme store + `POST/GET /v1/themes` with WCAG-AA-at-save (contrast ≥4.5:1 + base_size≥14) + built-in themes seeded by `migrate` + `/sessions/new` theme injection. 116 VS tests. **The Viewer Service is now FEATURE-COMPLETE for Phase 2 (VS-A..E).** Spec/plan: `docs/superpowers/{specs,plans}/2026-06-11-viewer-service-vs-e*`. |
| **Web Viewer — WV-A (shell + bootstrap + renderer)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `web-viewer/` — Vite+React19+TS+Tailwind SPA; URL contract (`?deployment=&locale=&viewer_url=` + dev `?fixture=`); `POST /v1/sessions/new` bootstrap + theme→CSS-vars; faithful-projection Schema 3 renderer (`src/renderer/` = OD-03 library boundary: option merge on `index`, widget derivation per design/05a §13, items/messages/sections + `shared_option` matrix, UnsupportedElement honesty); **focus presentation default** (one question per view, choice cards + letter hints, auto-advance, `style.x_presentation`/`x_auto_advance` overrides — see design/08 §"Presentation modes"); step navigation + required gating + spec focus management; chrome en/pt; Schema 7 `manifest.json` (no `logic_actions` → VS strips logic) validated in `npm test`; +additive **VS CORS** (`VS_CORS_ORIGINS`). 80 vitest tests; **live smoke passed** (real imported AISS via Library→denormaliser→VS mint). Spec/plan: `docs/superpowers/{specs,plans}/2026-06-11-web-viewer-wv-a*`. |
| **Web Viewer — WV-B (response capture + submission)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `web-viewer/` — **closes the Phase-2 linear gate.** Schema 5 rows per attempt per item on forward-advance (ALL attempts kept: `x_response_revises`/`x_response_revision`; messages = `acknowledged` instruction trials; ALL durations SECONDS), `bdm:` event batches (5 s/20, canonical trial grammar), serial backoff SubmissionQueue (422-drop, keepalive flush on pagehide/visibilitychange), finishing flow (flush → `/complete` → thank-you, visible retry), `style.x_summary_rt: false` opt-out. Rows/events Ajv-validated against the REAL schemas in tests. +Additive VS change: mint/GET return `agent_id`+`session_index`. **Live gate smoke PASSED** (chromium completed AISS → export.csv 21 rows, RTs in seconds, session `submitted`). 110 web-viewer + 120 VS tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-12-web-viewer-wv-b*`. |
| **Expression Evaluator — WV-C / OD-11** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `questionnaire-expression-evaluator/` — the canonical reference evaluator (Rust→WASM) all viewers + Editor embed for IDENTICAL evaluation of `Expression` strings. `core/` crate (lexer→recursive-descent parser→deterministic evaluator; `Value` lattice; `/0`→Null, code-point string order, never-panics sentinel-Null, `condition()`=non-Bool→false) + `web/` (`wasm-bindgen` package `@behaverse/expression-evaluator`: `evaluate_condition`/`check_expression`/`reversed`/`compare`). Functions: `length/is_empty/not_empty/count/contains/score` (both `score('id')`+bare-id forms). Helpers `reversed_value` (05b 4.1) + `compare_solution` (equals/set_equals/matches_regex, OD-16 4.3). **Determinism proven**: one `test_vectors.json` run identically by the Rust host AND compiled WASM (24 host + 31 WASM tests). Grammar is now normative in **design/15_expression_language.md**. Rust toolchain installed (rustc/cargo 1.96.0, wasm32, wasm-pack 0.13.1). Godot C-ABI + Editor wasmer-python bindings DEFERRED (no consumer yet). Spec/plan: `docs/superpowers/{specs,plans}/2026-06-12-expression-evaluator-wv-c*`. |
| **Web Viewer — WV-D (logic, validation, in-session scoring)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `web-viewer/src/logic/` — embeds the WV-C evaluator (built `--target web`, lazy-loaded behind a `LogicEvaluator` port; engine tests inject a fake) to drive `show_if` visibility, **skip/branch graph-walk navigation** (forward-only jumps, hidden steps skipped, Back retraces a visited stack), `piping` (prompt-text), per-question (range/length/format) + cross-question validation (blocks Next + per-item messages), and scoring helpers (`reversed_value`→Schema 5 `score`, Solution `correct` at answer-commit). Manifest now declares `logic_actions`+`evaluator` (v26.0612) → **VS no longer strips logic**. `score(id)` resolves null (external Scorer deferred → score-gated branches safely don't fire, F1). 145 web-viewer tests; **live branching smoke PASSED** (real in-browser WASM branched on a fixture; denormaliser reconcile confirms logic carried for the v26.0612 manifest). Spec/plan: `docs/superpowers/{specs,plans}/2026-06-12-web-viewer-wv-d*`. |
| **Web Viewer — WV-E (session resume + locale switch)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `web-viewer/src/resume/` — OD-14 resume: per-question state persists to IndexedDB (DB `behaverse-web-viewer`, store `resume`, keyed by deployment, **incl. the session token** so reload re-authenticates — resolves WV-A's in-memory-token caveat). Boot tries resume before minting (`resolveResume` branches on `GET /sessions/{id}`: in_progress→rehydrate answers+visited & land at the first required-unanswered visible step ELSE the saved position; submitted→"already completed"; 409 ephemeral→wipe+fresh+demo-notice; invalid→fresh; network→retry). `LocaleSwitcher` (>1 available_locales) swaps runtime text via `POST /sessions/{id}/locale` with answers intact. Debounced (500 ms) per-question persistence; demo/ephemeral + fixture never persist. +Additive VS change: `/sessions/new` returns `ephemeral`. 167 web-viewer + 122 VS tests; **live resume smoke PASSED** (real chromium reload restored answers/token/position via IndexedDB; caught + fixed an all-optional landing bug). Spec/plan: `docs/superpowers/{specs,plans}/2026-06-12-web-viewer-wv-e*`. |
| **Web Viewer — WV-F (conformance + distribution)** (Phase 2) | ✅ **built + merged** to `master` (2026-06-12) under `web-viewer/` — **the FINAL Web Viewer stage; WV-A..F COMPLETE.** (A) Renderer-as-library (**OD-03**): `npm run build:lib` → `dist-lib/` (`@behaverse/questionnaire-renderer`: ESM + dts + precompiled CSS, React externalized; the Editor preview consumes it). (B) **PERF-01**: boot overlaps the 1 MB evaluator WASM load with the mint round-trip (Promise.all; PERF.md budget — shell ~81 KB gzip). (C) iframe: `embed.ts` posts `behaverse:loaded/completed/resize` to a host frame (optional `?embed_origin=`). (D) **PWA**: `vite-plugin-pwa` precaches the shell + WASM, installable webmanifest, `/v1/` NetworkOnly (cached-mint impossible). (E) Schema 7 manifest served at `/manifest.json` (build-generated from the canonical one; now correctly declares `resume`+`locale_switching` true). 173 web-viewer tests; **live PWA/iframe smoke PASSED**. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-12-web-viewer-wv-f*`. |
| **Scorer conformance runner / Editor / Native (Godot) viewer / Participant Platform** (Phase 2+) | ❌ not started — **the Web Viewer (WV-A..F) is COMPLETE.** NEXT candidates: **Scorer conformance runner** (OD-16: external Scorer execution [wasm/http/python/r] + in-session score display — unblocks `score(id)`, which currently resolves null/sentinel-false); the **Editor** (custom React/TS authoring UI; consumes the renderer library `@behaverse/questionnaire-renderer` per OD-03; creates Preview deployments via the VS); the **Native (Godot) viewer** (OD-01; must honour `style.x_presentation` + the same `bdm:` event/Schema-5 contract, or declare non-support); the **Participant Platform** (OD-08 Identity-blocked). **Forward notes (Web Viewer follow-ups, web-viewer/FOLLOWUPS.md):** fully-lazy evaluator load (PERF F3); theme not re-fetched on resume; WASM evaluator recompiles per `evaluate_condition` (add a wasm-bindgen `Program` handle if profiling needs it); promote `x_response_*` attempt fields to first-class (`attempt_index`) at next Schema 5 CalVer + BDM upstream request; renderer-lib npm publish at the deferred repo split. Deferred: Behaverse reconciliation + `validated` state (Behaverse-blocked). |
| **Deployment + persistent content seeding** | ✅ **DEPLOYED + LIVE (2026-06-10)** — **https://questionnaire-library.vercel.app** (Vercel SPA + FastAPI serverless, same-origin) reading a seeded Supabase Postgres (`questionnaire-library`, eu-central-1). 64 questionnaires / 54 instrument families live. **Phase 1 shipped.** See `project_mvp_deployed` memory (deploy gotchas) + `scripts/seed-supabase.md`. |
| **Public schema hosting at `behaverse.org/schemas/`** | ⏸️ **deferred** — schemas kept in-repo for now (owner decision 2026-06-10); out of MVP scope, revisited post-MVP. |

**Running the suites** (note the Docker quirk; **run each suite separately** — see below):
```bash
source .venv/bin/activate
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q     # 126 — integration tests use ephemeral Postgres via testcontainers (+5 resolution-bundle)
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q   # 120 — VS-A..E + CORS + session identity (testcontainers Postgres)
pytest questionnaire-runtime-denormaliser/ -q        # 56 — denormaliser (pure)
pytest tools/tests/ -q                               # 309 — schema validation (44 examples)
( cd library-web && npm test && npm run build )      # 59 frontend (vitest) + clean build
( cd web-viewer && npm test && npm run build )       # 110 web-viewer (vitest, Ajv row/event validation) + Schema 7 manifest check + clean build
```
`DOCKER_CONFIG=/tmp/lib_docker` is **required** for the library + viewer-service integration tests: `~/.docker/config.json` references a `credsStore: desktop` helper that isn't installed, so testcontainers fails without an override pointing at an empty docker config (`/tmp/lib_docker/config.json` = `{}`). **If integration tests hang** (the container is ready but the host can't reach its published port), Docker's host→container NAT has gone stale after heavy container create/remove churn — `sudo systemctl restart docker` clears it. **Run each Python suite in its own `pytest` invocation** — `library/` and `viewer-service/` each have a `tests/test_validation.py`, and pytest's default import mode raises an "import file mismatch" collection error if you collect both packages in one command. (Each package passes on its own; this is a multi-package monorepo pytest quirk, not a code defect.)

---

## What's next

The Library Core + importer + web UI close out the *buildable* MVP work. The two live tracks:

1. **MVP deployment — ✅ DONE (2026-06-10).** Phase 1 is shipped: the Library + web UI are live at **https://questionnaire-library.vercel.app** (Vercel SPA + FastAPI serverless, same-origin) on a seeded Supabase Postgres (eu-central-1). Re-seed: `scripts/seed-supabase.md`; deploy gotchas: the `project_mvp_deployed` memory. Follow-up: function is in `iad1` (US) while the DB is EU — consider moving it to `fra1`; custom domain deferred.
2. **Phase 2 — IN PROGRESS.** First deliverable shipped: the **`questionnaire-runtime-denormaliser`** (Schema 2 → Schema 3) is built + merged to `master` (2026-06-10, 56 tests). **Next = Viewer Service / Orchestrator**, then Web Viewer + WASM evaluator. **→ See the "Phase 2 — START HERE" delegation brief below** (updated to mark the denormaliser done).

Also open (not blocking the above): **contribution/review workflow + DOI** (sub-project 3) + **community signals** (sub-project 4) — both need the **Identity sibling / auth** (OD-08, out of Library-Core scope); and **library follow-ups** in `library/FOLLOWUPS.md` (item-list resolution, strictest-license surfacing, Alembic/`serve`, + the deferred variant-curation / response-scale QA items).

Standing implementation pattern: **brainstorm → spec (`docs/superpowers/specs/`) → plan (`docs/superpowers/plans/`) → subagent-driven TDD build → review → merge → push.** (11 spec/plan pairs to date.) **Finish branches by merging to master locally + pushing — no PRs on this project** (owner preference).

---

## Phase 2 — progress log (backend complete)

**Objective.** **Phase 2 — Web Viewer + Deployments**: take a questionnaire from the Library, deploy it for anonymous online use, let participants complete it, emit responses + `bdm:` events that flow into Behaverse via the Viewer Service, and let the researcher export the data. Full deliverable list + the leave-Phase-2 gate are in [plan/01_roadmap.md](plan/01_roadmap.md) §"Phase 2". **Backend status: COMPLETE** — the denormaliser + the full Viewer Service (VS-A..E) are built. The remaining gate work is the **Web Viewer** + its **WASM evaluator** (see the "Web Viewer — START HERE" brief below).

**✅ DONE — `questionnaire-runtime-denormaliser`** (built + merged 2026-06-10). The shared dependency everything else in Phase 2 needs: a pure, I/O-free Python library that turns a Schema 2 questionnaire (refs + translations + scoring) into a **Schema 3 Runtime** (references resolved, single locale, viewer-manifest reconciled, scorer impls pinned, scoring optionally stripped, provenance attached). Per **OD-18**, consumed by both the Viewer Service (session-mint) and the Editor preview. Built under `questionnaire-runtime-denormaliser/`. Public API `denormalise(...)` + injectable `resolve_entity` + `canonical_hash` (the future Viewer Service imports this for matching cache-key hashes). Key decisions locked in its spec: **faithful projection** (keep Schema 2 vocabulary/structure — the Web Viewer does the option-merge), **no Schema 3 bump** (loose canonical schema kept; shape enforced by package tests + an internal strict schema), **strict missing-locale pre-flight error**, **collect-all `PreflightError`**. Note logged in its `FOLLOWUPS.md`: the canonical Schema 2 examples have **dangling refs** (~14 reusable entities referenced but absent from `library_examples/`), so `schemas/runtime/examples/` were NOT regenerated — separate follow-up. Design: [design/05d_runtime.md](design/05d_runtime.md); spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-runtime-denormaliser*`.

**✅ DONE — Viewer Service VS-A (runtime generation core)** (built + merged 2026-06-10, `viewer-service/`). The Viewer Service was decomposed into **VS-A → VS-B → VS-C**. VS-A is the runtime-generation spine + denormaliser's first consumer: Postgres `runtime_cache` (OD-18f 5-tuple key + LRU + admin purge); viewer-registry storing Schema 7 manifests (direct POST upload); minimal deployments; deployment-level locale resolution; the mint-runtime path that calls the denormaliser; and a new additive **resolution-bundle** endpoint on `library/` (returns `{definition, entities}` so the denormaliser gets entity+scorer bodies). HTTP-only Library access; **no sessions/auth** (VS-B/C). 26 tests.

**✅ DONE — Viewer Service VS-B (sessions + submission + forwarding)** (built + merged 2026-06-10, `viewer-service/`). The participant data path: `POST /sessions/new` (anonymous mint → `{session_id, session_token, runtime}`, wrapping VS-A's `mint_runtime`); opaque session tokens (stored SHA-256-hashed; `require_session` Bearer auth); core resume (`GET /sessions/{id}` + `/runtime`) + locale switch (re-mint via the viewer stored on the session); `POST /sessions/{id}/responses`·`/events` (Schema 5 / 4a validated) → durable Postgres `outbox`; `/complete`; the **OD-13** forwarder (`forwarding.process_outbox_batch` + `viewer-service forward-worker --once/--loop` CLI; exponential backoff, max-attempts, per-submission SHA-256 tamper check; `Sink` interface + `HTTPBehaverseSink`); two-tier bounds (503 hard cap). Lifecycle `in_progress→submitted→forwarded` (`validated`/`abandoned` deferred). 60 VS tests. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-viewer-service-vs-{a,b}*`.

**✅ DONE — Viewer Service VS-C (deployment management & lifecycle)** (built + merged 2026-06-11, `viewer-service/`). Full deployment record + CRUD; `check_deployable` (active-window + per-deployment `quota.max_sessions` gate) wired into `new_session` (mint past `active_until` → 410; before `active_from` / over quota → 409) and resume (`session.ephemeral` set at mint; ephemeral → `409 ephemeral_no_resume`; ephemeral submissions validate + 202 but skip the outbox). `mode_preset` defaults `anonymous_link`. Delivers UC-04 + UC-08. 88 VS tests.

**✅ DONE — Viewer Service VS-D (response export / CSV serializer)** (built + merged 2026-06-11, `viewer-service/`). The remaining additive VS surfaces were split **VS-D** (CSV export — gate-blocking UC-11, done) and **VS-E** (dashboard + theming — next). VS-D: `GET /v1/deployments/{id}/export.csv` streams a BDM-native CSV (pure `export_csv.response_columns`/`to_csv`; `store/export.iter_response_rows` flattens the outbox; own-connection `StreamingResponse`). 98 VS tests.

**✅ DONE — Viewer Service VS-E (monitoring dashboard + theme infrastructure)** (built + merged 2026-06-11, `viewer-service/`). `GET /v1/deployments/{id}/metrics` (per-deployment snapshot: active/completion/quota/recent-submissions + OD-13 forwarding alert; SSE + abandonment-hotspots deferred) + theme store with `POST/GET /v1/themes` (WCAG-AA contrast/min-font check at save → 422 on fail), built-in themes seeded by `viewer-service migrate`, and `/sessions/new` returning the deployment's resolved `theme` bundle. 116 VS tests. **The Viewer Service is FEATURE-COMPLETE for Phase 2 (VS-A..E): runtime gen + sessions/submission/forwarding + deployment lifecycle + export + dashboard/theming. The whole VS side of the Phase-2 gate works.**

---

## Web Viewer — START HERE (delegation brief for a new agent)

> **PROGRESS (2026-06-12): WV-A + WV-B (linear gate CLOSED) + WV-C (OD-11 expression evaluator) are ALL BUILT + MERGED.** Next stage = **WV-D — wire the now-built `questionnaire-expression-evaluator/` (`@behaverse/expression-evaluator`, `evaluate_condition`/`reversed`/`compare`) into `web-viewer/`**: compile each runtime `LogicRule.condition`/`show_if`/validation `condition` and drive branching/visibility/skip/piping + per/cross-question validation; apply `reversed_value` at answer-commit and compute Solution `correct`; in-session scoring via the Schema-3-pinned scorer impls (the `score(id)` host binding feeds the evaluator). The evaluator's grammar is normative in **design/15_expression_language.md**; the Web Viewer's Schema 7 `manifest.json` must gain `logic_actions` + an `evaluator` block once WV-D supports logic (today it declares none, so the VS strips logic — WV-D flips that on). Start WV-D with its own brainstorm→spec→plan cycle.
>
> Original WV-A note: **WV-A built** (`web-viewer/`, 80 tests, live-smoke-verified against a real Library+VS stack). **Owner notes (2026-06-12), tracked in `web-viewer/FOLLOWUPS.md`:** (1) **date questions** are not expressible (Schema 2 `input_data_type` = choice|number|text → UnsupportedElement card; workaround text+RegEx / number-year; native support would be a breaking Schema 2 bump + new OD); (2) a dedicated **visual-design + behaviour polish pass** on the viewer is wanted later (focus-ring styling, optical centring, transitions, card states) — owner-driven, after the functional stages. The decomposition is locked in the WV-A spec §0: **WV-A shell+renderer ✅ → WV-B capture+submission (NEXT — closes the linear-questionnaire gate) → WV-C WASM evaluator (OD-11, parallel-able) → WV-D logic → WV-E resume → WV-F manifest/packaging.** Owner visual directive: Typeform-class focus mode is the default (`feedback_web_viewer_visual_direction` memory; design/08 §"Presentation modes"). Start WV-B with its own brainstorm→spec→plan cycle; `web-viewer/README.md` has the dev quickstart + a verified live-VS walkthrough, `web-viewer/FOLLOWUPS.md` the deferred items. The renderer reports answers via `onAnswer(key, value)` — WV-B turns those into Schema 5 `Response` rows (+ summary RT per OD-07) and wires `/responses`, `/events`, `/complete`.

**The whole backend for Phase 2 is done.** Schemas (8, in-repo), the Library (catalogue + API + web UI, live on Vercel+Supabase), the `questionnaire-runtime-denormaliser`, and the **full Viewer Service (VS-A..E)** are built, merged, and tested. **The one remaining gate-critical Phase-2 component is the participant-facing Web Viewer** (plus its embedded WASM evaluator). This brief orients you to build it.

**Objective.** Build the **Web Viewer**: a custom **React + TypeScript** single-page app that takes a **Schema 3 runtime** from the Viewer Service, renders the questionnaire to a participant, captures responses + `bdm:` semantic events, and submits them back to the Viewer Service — which already forwards to Behaverse and exposes export/metrics. Authoritative design: [design/08_viewer.md](design/08_viewer.md) (§"Web Viewer", §"Session lifecycle", §"Session resume semantics", §"Event emission"). Stack is **locked by OD-01: custom React + TS, NO SurveyJS.** Build it under a new top-level `web-viewer/` (mirrors `library-web/`'s Vite + React 19 + TS + Tailwind setup; migrates to `questionnaire-web-viewer` at the deferred repo split).

**This is a big component — decompose it.** Like the Viewer Service, brainstorm a decomposition first (each sub-stage its own spec→plan→build). A natural slicing:
1. **App shell + session bootstrap** — read deployment/session params from the URL, call `POST /v1/sessions/new` (→ `{session_id, session_token, runtime, theme}`), hold the token, render the runtime's metadata/first page. Apply the returned `theme` bundle.
2. **Schema 3 renderer** — render `pages[].elements[]`: the faithful-projection Option shapes (do the `options[]` + `content.<locale>.options[]` merge the denormaliser intentionally left for the viewer), the widget kinds from the Option `(input_data_type, measurement_type, selection)` triple, prompts/instructions/context. WCAG 2.1 AA (keyboard nav, screen-reader, contrast). Responsive per the §"visual fidelity" physical-envelope rule.
3. **Response capture + submission** — collect answers, build Schema 5 `Response`/`ResponseSet` rows, `POST /v1/sessions/{id}/responses` (per-item, debounced) + `/complete`; batch `bdm:` events (Schema 4a) to `/events` (every ~5 s / 20 statements); summary RT on `answered` (OD-07).
4. **Navigation + logic** — pages/sections/blocks, `show_if`, branching/skip — which needs the **WASM expression evaluator** (next bullet).
5. **Session resume** (OD-14) — persist per-question state to IndexedDB + mirror to the VS per-item endpoint; on reload `GET /v1/sessions/{id}` + `/runtime` (resumes in `last_active_locale`); locale switch via `POST /v1/sessions/{id}/locale`; ephemeral (demo) deployments get `409 ephemeral_no_resume` → mint fresh.
6. **Schema 7 conformance manifest** — publish a manifest (the viewer's supported widgets/logic-actions/scorer-impl-kinds/locales) at a stable URL; operators register it with the VS (`POST /v1/viewers`).

**Hard dependency — the WASM expression evaluator (OD-11), not yet built.** Logic (`LogicRule.condition`), validation, and scoring (`score(id)`) must evaluate via a **single Rust→WASM module** ([design/08_viewer.md](design/08_viewer.md) §"Reference evaluator"; OD-11). It's embedded by the Web Viewer (wasm-bindgen), the Native Viewer, and the Editor preview, so it's a shared deliverable — build/scope it as its own sub-project (likely before/with renderer step 4). Until it exists, steps 1–3 (linear questionnaires, no branching/scoring) are buildable; branching + in-session scoring need it.

**What the Web Viewer talks to — all built and ready (`viewer-service/`, base `/v1`):**
- `POST /sessions/new` `{deployment_id, viewer_id, viewer_version, locale?}` → `{session_id, session_token, runtime, theme}` (Bearer token for all later calls).
- `GET /sessions/{id}` (status + `last_active_locale` + outbox counts) · `GET /sessions/{id}/runtime` (resume) · `POST /sessions/{id}/locale` (switch+re-mint).
- `POST /sessions/{id}/responses` (Schema 5) · `/events` (Schema 4a) · `/complete`.
- `POST /v1/viewers` (register this viewer's Schema 7 manifest) · `POST /v1/deployments` (create a deployment to test against) · `GET /v1/deployments/{id}/export.csv` + `/metrics` (verify collected data).
- Run the VS locally: `viewer-service migrate` then `uvicorn viewer_service.api.app:create_app --factory --reload` with `DATABASE_URL` + `LIBRARY_BASE_URL` set (see `viewer-service/README.md`).

**Stack + process.** Vite + React 19 + TS + Tailwind (mirror `library-web/`). Standing pattern: **brainstorm → spec → plan → subagent-driven TDD build → review → merge+push (no PRs).** Note `library-web/`'s testing setup (vitest + RTL; a Playwright e2e smoke exists but Chrome isn't installed in this env).

**Key references:** [design/08_viewer.md](design/08_viewer.md) (Web Viewer + cross-viewer contract + OD-14 resume table), [design/08a_viewer_service.md](design/08a_viewer_service.md) (the service it calls), [design/05d_runtime.md](design/05d_runtime.md) + `schemas/runtime/` (Schema 3 it renders), `schemas/viewer_conformance/` (Schema 7 it publishes), `schemas/response/` + `schemas/events/` (what it emits), OD-01 (custom React, no SurveyJS), OD-11 (WASM evaluator), OD-07 (channels), OD-14 (resume). The `viewer-service/` README + the `project_viewer_service_vs_*` memories describe the live endpoints.

**Dependencies already in place:** all 8 schemas (✅ in-repo, v26.0609 etc.) and the Library (✅ built, serves Schema 2 via `/v1/.../definition`). The deployed MVP Library (Supabase + Vercel, in progress) gives Phase 2 a live source to read from.

**Stack (locked):** Python + FastAPI + Postgres for the Viewer Service (OD-04); custom React + TypeScript for the Web Viewer (OD-01); Rust→WASM for the evaluator (OD-11). No SurveyJS anywhere.

**Process:** the standing pattern — **brainstorm with the owner → spec → plan → subagent-driven TDD build → review → merge + push** (no PRs). Each Phase-2 deliverable is its own spec/plan cycle; start by brainstorming the denormaliser.

**Key references:** [design/05d_runtime.md](design/05d_runtime.md) (Schema 3 + denormaliser), [design/08_viewer.md](design/08_viewer.md) (Web Viewer), [design/08a_viewer_service.md](design/08a_viewer_service.md) (Viewer Service), [design/04_architecture.md](design/04_architecture.md); ODs 18 (runtime production model), 11 (WASM evaluator), 01 (custom renderer, no SurveyJS), 13 (queued forwarding), 14 (session resume), 16 (scoring); `schemas/runtime/` + `schemas/viewer_conformance/` + `schemas/events/` + `schemas/response/` + `schemas/session/`.

---

## The built components — orientation

### Library Core + importer (`library/`)
Python/FastAPI/Postgres; `jsonb` source-of-truth + derived index (Approach C); Git-backed read-only ingestion (no write API/auth). Run it locally:
```bash
source .venv/bin/activate
docker run -d --name pg -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=library -p 55432:5432 postgres:16
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/library
python -m library.cli migrate
python -m library.cli import-survey-db survey_database/data/survey_db.sqlite --out /tmp/content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
python -m library.cli ingest /tmp/content --release v26.0606
export LIBRARY_CORS_ORIGINS=http://localhost:5173   # for the SPA
uvicorn library.api.app:create_app --factory --reload    # serves /v1 + /openapi.json
```
Public read API (base `/v1`; routes in `library/src/library/api/`; `/openapi.json` is the authoritative contract):

| Endpoint | Returns |
|---|---|
| `GET /v1/questionnaires?q=&domain=&population=&language=&license=&instrument=&min_items=&max_items=&sort=&limit=&offset=` | **`PaginatedGroups`** — instrument-**grouped** catalogue (OD-21): `{items:[InstrumentGroup], total, limit, offset}`, `InstrumentGroup = {instrument_id, title, form_count, languages, domain, forms:[CatalogueCard]}`. Singletons are one-form groups. |
| `GET /v1/questionnaires/{id}` · `/versions` · `/versions/{version}` | `EntitySummary` / `VersionInfo[]` / `EntitySummary` (metadata-only — item content comes from `/definition`). |
| `GET /v1/questionnaires/{id}/versions/{version}/definition?resolved=true` | full canonical Schema 2 JSON with refs inlined (download); **`410`** if withdrawn. |
| `GET /v1/entities/{type}` · `/{id}` · `.../dependents` | reusable entities + dependency graph. |
| `GET /v1/search?q=&type=` · `GET /v1/facets?facet_type=` | flat `PaginatedCards` / `{facet_type, values:[{value,count,label?}]}` (facets: domain/population/**instrument**/language/license; `instrument` returns human-readable name labels). |
| `GET /healthz` · `GET /openapi.json` | health / OpenAPI. |

Error envelope `{error:{code,message,detail?}}` (404 unknown, 410 withdrawn, 422 bad params).

### Library web UI (`library-web/`)
Vite + React 19 + TS + Tailwind + TanStack Query — a read-only catalogue SPA. Renders item content from `/definition?resolved=true` (the detail endpoints are metadata-only). The catalogue collapses instrument variants into expandable rows; each card shows Domain / Items / Languages / License; collapsible facet sidebar (instrument facet shows names); markdown content; per-form JSON download (blob-fetch for cross-origin). Dev: `cd library-web && npm run dev` (needs the API on :8000 + `LIBRARY_CORS_ORIGINS=http://localhost:5173`). Unit/RTL via vitest; an e2e Playwright smoke exists (needs Chrome — not installed here).

---

## Repository topology & GitHub

- **Locked plan:** multi-repo under the existing `github.com/behaverse` org, `questionnaire-` prefix — full catalogue + rationale in `design/14_repository_topology.md` (folded into `design/12_governance.md`).
- **The split is DEFERRED.** Doing it now would break the build (the library reads `schemas/` by relative path and is `pip install -e`'d in place; separating them needs cross-repo schema packaging that doesn't exist) and there's no second active component to justify the churn. Prerequisite: cross-repo schema packaging + a second component in active dev.
- **Off-machine backup exists:** `master` is pushed to a **temporary private repo `behaverse/questionnaire-tmp`** (tracked files only; to be deleted once the split is finalized — *not* the long-term home). The git account `p15e` is an **admin** of the `behaverse` org. master is local-only otherwise; push happens at branch-finish (no PRs).
- The whole ecosystem still lives in this one local repo for now.

---

## What this project is

The **Questionnaire Apps Ecosystem** is an open, modular platform for designing, distributing, and analysing **psychological-research questionnaires** and **cognitive tasks**. One canonical questionnaire definition renders consistently in a Web Viewer, a Native (Godot) Viewer, or as PDF; responses + interaction telemetry flow into a sibling project ([Behaverse](https://behaverse.org)) via a Viewer Service. Components: **Library** (catalogue + content store + web UI; built), **Editor**, **Viewer Service / Orchestrator**, **Engine family** (Web + Native viewers), **Participant Platform**. See `design/04_architecture.md`.

---

## Repository layout

| Path | What's there | Editable? |
|---|---|---|
| `design/` | **Authoritative design** (16 docs incl. `14_repository_topology.md`). What the system *is*. | Yes — follow the design/plan separation. |
| `plan/` | **Roadmap + phasing.** When/how it gets built. | Yes. |
| `schemas/` | The 8 implemented JSON Schemas (+ `versions/`, `CHANGELOG`, `examples/`). | Only at version-bump boundaries (OD-06: published versions immutable). |
| `tools/` | Schema validator + tests (`validate_schemas.py`, 309 tests). | Yes. |
| `library/` | **The built Library Core + importer** (Python/FastAPI/Postgres). `src/library/` + `tests/` + `FOLLOWUPS.md`. → `questionnaire-library-service` at the reorg. | Yes. |
| `library-web/` | **The built Library web UI** (Vite/React 19/TS/Tailwind read-only SPA). → `questionnaire-library-web` at the reorg. | Yes. |
| `docs/superpowers/` | Implementation specs + plans (11 pairs, one per build). | Yes (new pairs for new work). |
| `archive_do_not_edit/` | Superseded scattered notes. | **No** — read-only. |
| `qv_godot/`, `survey_system/` | Prototypes, reference-only; **untracked, stay local**. | Reference-only. |
| `survey_database/` | Legacy Python/SQLite catalogue — the importer's input (`data/survey_db.sqlite`). **Untracked, stays local** (not backed up to GitHub). | Reference-only. |

(`HANDOFF.md`, `my_comments.md`, and any `TOFIX.md` are working files — **not git-tracked**.)

---

## Schema inventory — what's shipped

| # | Schema | Live version | Tag |
|---|---|---|---|
| 1 | Instrument Metadata | v26.0609 (`author` singular; + optional `instrument_id`/`variant` per OD-21) | `instrument-v26.0609` |
| 2 | Questionnaire Definition | v26.0609 (retargets Schema 1 v26.0609) | `v26.0609` |
| 3 | Questionnaire Runtime | v26.0603 | `runtime-v26.0603` |
| 4a | Event Data | v26.0605 | `events-v26.0605` |
| 4b | Behavioural Channels (Mouse + Keyboard) | v26.0605 | `recordings-v26.0605` |
| 5 | Response Data | v26.0603 | `response-v26.0603` |
| 6 | Session Metadata | v26.0603 | `session-v26.0603` |
| 7 | Viewer Conformance Manifest | v26.0603 | `viewer_conformance-v26.0603` |

**Archived:** Schema 1 v26.0528, v26.0605; Schema 2 v26.0528, v26.0601, v26.0602. **Cross-version retarget DONE (2026-06-09, OD-21):** Schema 2 v26.0609 retargets Schema 1 v26.0609, bundling the `authors`→`author` rename + the new optional `instrument_id`/`variant` fields. The validator registry resolves all archived + live `$id` URLs (whether or not they're publicly hosted).

---

## Active conventions — must follow

- **CalVer `vYY.MMDD`** for everything project-owned; published versions immutable; `severity` tag per bump.
- **Hybrid entity versioning** (impl): reusable entities have no `version` field; questionnaires keep `id`/`version` in `metadata`; ingestion reads an explicit version if present else stamps `--release`.
- **`bdm:` namespace** for the Events vocabulary (OD-19); reject mixed xAPI/Schema.org/AS2 in emitted statements.
- **`additionalProperties: false` + `^x_` patternProperties** on project-owned objects.
- **Hard-pinned references** `entity_id@vYY.MMDD`; updates never silently propagate.
- **Repos:** `questionnaire-` prefix under `behaverse` org (see `design/14`). **Finish branches by merging to master locally + pushing — no PRs.**
- **Design vs. plan separation:** `design/` = what the system is; `plan/` = when/how it's built. Build *status* (and the schema-hosting decision) goes in `plan/` + this file, never in `design/`.

---

## Persistent memory

Auto-memory at `~/.claude/projects/-home-pedro-Repos-Cursor-questionnaire-apps/memory/` (index: `MEMORY.md`, loaded each session). Notable entries: feedback notes (design/plan separation, lowercase filenames, block/section naming, direct recommendations, **no-PR merge+push**); OD resolutions (OD-01/10/12/13/14/15/16/17/18/19, **OD-21**); `project_calver_versioning`; **`project_repo_topology`** (multi-repo + deferred split + temp backup), **`project_library_core`** (built Core + hybrid versioning + DOCKER_CONFIG gotcha), **`project_survey_db_importer`** (built importer + legacy model), **`project_library_web`** (built web UI + gotchas), **`project_instrument_id_grouping`** (OD-21 grouping + re-seed gotcha), **`project_schema_hosting_deferred`** (this decision).

---

## Things NOT to do

- **Don't bump a schema version casually** — CalVer bumps are breaking per OD-06 (spec/plan/execute cycle each).
- **Don't track `HANDOFF.md` / `my_comments.md` / `TOFIX.md`** — working files.
- **Don't re-decide settled ODs** — open a new OD instead of silently revising an old body.
- **Don't open PRs** — finish branches by merging to master locally + pushing (owner preference).
- **Don't execute the multi-repo split** until cross-repo schema packaging exists (it would break the build).
- **Don't commit the importer output** (`content/` is gitignored; it belongs in `questionnaire-library-content` at the reorg).
- **Don't change the schema `$id` URLs** to drop `behaverse.org` — they are canonical identifiers (resolve locally); public hosting there is deferred, not cancelled.

---

## Consistency verification (run on changes)

```bash
source .venv/bin/activate
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q   # 121 passed (Library Core + importer)
pytest tools/tests/ -q                              # 309 passed
python tools/validate_schemas.py 2>&1 | tail -3     # All 44 example(s) passed + 1 SKIP (scorer-conformance stub)
( cd library-web && npm test && npm run build )     # 59 frontend tests + clean build
grep -c "^| OD-" design/10_open_decisions.md        # 20 log rows (21 ODs; OD-02 is a merged stub, no row)
git tag -l | sort                                   # 12 schema tags (incl. instrument-v26.0609 + v26.0609)
```
