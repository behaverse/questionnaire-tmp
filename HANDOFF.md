# Handoff — system root

Orients a new agent to the **whole** ecosystem and routes you to the right component. This file is now
the **map + the system-wide task list**, not a changelog. For per-component status and "what's left",
open that component's own `HANDOFF.md` (index below). For the authoritative design go to
[design/00_index.md](design/00_index.md); for sequencing, [plan/01_roadmap.md](plan/01_roadmap.md).

> **Before running or demoing anything, read [docs/operational-gotchas.md](docs/operational-gotchas.md)**
> — the recurring traps (per-origin CORS, "test the browser request not the API", don't-re-import,
> restart-services-after-merge) that have repeatedly cost debugging or produced wrong "it works" claims.
> To walk the stack locally end-to-end: [docs/testing-participant-flow.md](docs/testing-participant-flow.md).
>
> **History:** the previous root HANDOFF was a long dated changelog — it's preserved verbatim at
> [docs/handoff-archive.md](docs/handoff-archive.md) (the per-build narrative + the old "START HERE" briefs).

## What this system is

An open, modular platform for designing, distributing, running, and analysing **psychological-research
questionnaires** and **cognitive tasks**. One canonical **Schema-2 JSON** definition renders consistently
in a **Web Viewer** (built), a **Native/Godot viewer** (not started), or as PDF; responses + `bdm:`
interaction events flow into the sibling [Behaverse](https://behaverse.org) project via the **Viewer
Service**. See [design/04_architecture.md](design/04_architecture.md).

## State at a glance (2026-06-25)

- **🟢 Everything started is LIVE on Vercel + Supabase ($0 tier)** and browser-verified: Library, Identity,
  Viewer Service, the player (web-viewer), the portal (participant-app), **and the editor**. Real email via
  Resend (`xcit.org`). URLs are in each component HANDOFF and [DEPLOYMENT.md](DEPLOYMENT.md) §0.
- **Built + live:** Phase 1 (schemas + Library), Phase 2 (Viewer Service + Web Viewer + deployments), the
  full participant experience (portal + player + Identity SSO handoff), and the Editor (incl. auto-translate).
- **Public catalogue:** **https://questionnaire-library.vercel.app** — **222 questionnaires** (64 `survey_database`
  + 158 from the harvester), normalized **v26.0618**; homepage stats ~222 Q / 3,741 questions / 490 options / 7 languages.
- **Owner quick-wins shipped + live (2026-06-26→30):** presentation flags (`x_key_select` / `x_back_nav`),
  per-question QA **comments** (+ researcher CSV export), Editor authoring of those flags, Library
  **question search**, the **score-progression** dashboard, and **xAPI download** (`my_comments.md`
  #1/#2/#5-6/#9/#4/#3). **Remaining from `my_comments.md`: replay (#7) + respondent-bot (#8)** — now
  written up as a ready-to-delegate track in [§System-wide tasks](#system-wide-tasks).
- **Remaining big tracks:** **Phase 4** (Native/Godot viewer) and **Phase 5** (Participant Platform —
  studies/protocols/scheduling) — both system-level, see [§System-wide tasks](#system-wide-tasks).
- **⚠️ Known content gap:** the 158 harvested questionnaires lack `classification` metadata, so the Library
  Domain/Population/Instrument filters only cover the 64 old ones. This is a **harvester content task**, not a
  Library bug — see [questionnaire-harvester/HANDOFF.md](questionnaire-harvester/HANDOFF.md).

## How agents work here

This monorepo is worked on **one component per agent, each on its own branch** — to prevent
cross-contamination. If you've been handed a component:

1. **Read that component's `HANDOFF.md`** (index below) — it has the run/test commands, the curated
   "what's left", and the component-specific gotchas. It links its `README.md` (depth) and `FOLLOWUPS.md`
   (raw backlog) where those exist.
2. **Branch:** create `work/<component>` (the suggested name is in each HANDOFF). Keep commits scoped to
   your component's directory.
3. **Finish:** **merge to `master` locally + push — no PRs** (owner preference). `git fetch origin` +
   ff-or-rebase **before every push** — a separate **harvester** agent shares this checkout and pushes
   `master` concurrently (it works under `questionnaire-harvester/` + `library/`).
4. **Standing build pattern** for non-trivial work: brainstorm → spec (`docs/superpowers/specs/`) → plan
   (`docs/superpowers/plans/`) → subagent-driven TDD build → review → merge + push.
5. The owner reacts to **screenshots** — for UI work, show don't describe (Playwright chromium is installed).

⚠️ Each frontend on a new port/origin MUST be added to the backends' CORS allow-lists
(`IDENTITY_CORS_ORIGINS`, `VS_CORS_ORIGINS`, `LIBRARY_CORS_ORIGINS`) or the page silently fails to load.

## Component index

Each row links the component's own HANDOFF.md. Local dev ports in parens.

| Component | What it is | Status | Branch |
|---|---|---|---|
| [schemas/](schemas/HANDOFF.md) | The 8 canonical JSON Schemas (data-model source of truth) | ✅ | `work/schemas` |
| [tools/](tools/HANDOFF.md) | Schema validator (`validate_schemas.py`) | ✅ | `work/tools` |
| [library/](library/HANDOFF.md) | **Library Core** — catalogue/ingest/read API + survey_db importer + community signals (FastAPI+PG, :8000) | ✅ live | `work/library` |
| [library-web/](library-web/HANDOFF.md) | **Library web UI** — read-only catalogue + export (JSON / Markdown / SurveyJS) + "Try it" demo (Vite/React, :5175) | ✅ live | `work/library-web` |
| [questionnaire-runtime-denormaliser/](questionnaire-runtime-denormaliser/HANDOFF.md) | Schema 2 → Schema 3 runtime denormaliser (Python lib) | ✅ | `work/denormaliser` |
| [questionnaire-expression-evaluator/](questionnaire-expression-evaluator/HANDOFF.md) | Logic/expression evaluator (Rust→WASM, OD-11) | ✅ | `work/expression-evaluator` |
| [questionnaire-scorer/](questionnaire-scorer/HANDOFF.md) | Scorer ABI + conformance runner + PHQ-9 (Rust→WASM, OD-16) | ✅ | `work/scorer` |
| [viewer-service/](viewer-service/HANDOFF.md) | **Viewer Service** — deployments, sessions, runtime cache, outbox, catalogue/preview (FastAPI+PG, :8001) | ✅ live | `work/viewer-service` |
| [identity-service/](identity-service/HANDOFF.md) | **Identity** — accounts, JWT/JWKS, RBAC, SSO handoff (FastAPI+PG, :8100) | ✅ live | `work/identity` |
| [web-viewer/](web-viewer/HANDOFF.md) | **The player** — focus-mode runner; exports renderer/scoring libs for the editor (Vite/React, :5173) | ✅ live | `work/web-viewer` |
| [participant-app/](participant-app/HANDOFF.md) | **The portal** — sign in, browse, pick→run→return, my-data (Vite/React, :5174) | ✅ live | `work/participant-app` |
| [participant-session/](participant-session/HANDOFF.md) | Shared auth/session package (portal + player consume by source alias) | ✅ | `work/participant-session` |
| [editor/](editor/HANDOFF.md) | **The Editor** — visual Schema-2 authoring + auto-translate (Vite/React) | ✅ live | `work/editor` |
| [api/](api/HANDOFF.md) | Vercel serverless entry for the deployed Library (thin) | ✅ live | `work/deploy-api` |
| [questionnaire-harvester/](questionnaire-harvester/HANDOFF.md) | Web → Schema-2 harvester (**separate concurrent agent**; its HANDOFF is agent-maintained) | ✅ 158 live | — |
| [tools/respondent-bot/](tools/respondent-bot/HANDOFF.md) | **Respondent-bot** — drives the player to auto-answer a deployment (trait model) + emit `bdm:` traces for replay (Node/Playwright) | ✅ | `work/respondent-bot` |

> The participant experience is **three apps + a shared package**: the **portal** (`participant-app/`)
> browses/picks, the **player** (`web-viewer/`) runs one questionnaire and returns, and
> `participant-session/` is the shared login; cross-origin auth uses Identity's one-time SSO handoff.

## System-wide tasks

Work that concerns the whole system or doesn't fit a single component. Decompose each with the owner
(brainstorm → spec → plan) before building.

- **Phase 4 — Native/Godot viewer** (the biggest non-blocked track). Must honour `style.x_presentation`
  and the same `bdm:`/Schema-5 contract as the web viewer, or declare non-support via a Schema-7 manifest.
  Embeds the same OD-11 evaluator (needs the deferred Godot C-ABI binding from `questionnaire-expression-evaluator`).
  See [design/08_viewer.md](design/08_viewer.md), OD-01.
- **Phase 5 — Participant Platform** (the largest remaining piece; consumes Identity). Study/protocol
  builder, OD-09 assignment scheduler, consent **lifecycle** (versioning/re-consent/withdrawal — the
  per-deployment consent gate is built), notifications, researcher dashboards. Spans Identity (ID-D),
  the Viewer Service, and a new platform surface.
- **QA / research tooling — replay (#7) + respondent-bot (#8)** *(owner-requested, **ready to delegate
  to a new agent**; brainstorm each with the owner before building).* A paired track: the
  **respondent-bot** auto-answers a deployment and generates realistic interaction traces; **replay**
  reconstructs a participant's run from those traces. Build **#8 first — it produces the event traces
  #7 consumes.** Branch `work/respondent-bot`, then `work/replay`.
  - **Foundation already in place** (don't rebuild): the player emits xAPI-shaped `bdm:` events
    (`web-viewer/src/app/events.ts` + the `EventBatcher`, 5 s flush) → `POST /v1/sessions/{id}/events`
    → **retained** in the Viewer Service `outbox` (`kind='events'`, never deleted). Events carry
    `actor`/`verb`/`object`/`context.extensions`/`result.extensions`/`timestamp`. A participant can
    already **download** their own statements via `GET /v1/me/events` (#3, live); the per-deployment
    reader pattern is `viewer-service/.../store/export.py` `iter_event_rows_for_participant`.
  - **#8 Respondent-bot** — likely a **Playwright-driven** harness (chromium is installed; the owner
    reacts to screenshots) that drives the live player or a `?fixture=` / `?preview=` / `?deployment=`
    run, plus a **trait/constraint model** (acquiescence, straight-lining, random, fixed profile, …)
    and a toggle for **real pointer movement + clicks vs. direct state**. Doubles as cross-stack E2E
    and as the trace generator for #7. New home: a small tool dir (e.g. `tools/respondent-bot/`).
    First owner decision: scope (test-harness vs. data-generator vs. both) + the trait model.
  - **#7 Replay** — needs (a) a **session/deployment-scoped event read** for researchers (only the
    participant-self `/me/events` exists today — add the researcher read, mirroring how
    `export.csv`/`comments.csv` are researcher-gated), and (b) a player **replay mode** that drives
    the renderer from the ordered, timestamped event stream instead of live input (step-through +
    timing reconstruction). First owner decision: viewer-embedded replay vs. a standalone viewer.
  - **Detail + raw backlog:** `web-viewer/FOLLOWUPS.md` ("Owner feature requests" — #7/#8) and
    `my_comments.md`. Follow the standing build pattern (brainstorm → spec → plan → subagent-driven
    TDD → review → merge+push), exactly as #3/#4 were done (see their specs/plans in
    `docs/superpowers/`).
- **🔒 Identity/OD-08-gated features** spanning components: Library contribution/review workflow + DOI
  (ID-C2/C3), the Editor's real "Open in viewer" preview deployment + write-back of forked/translated
  entities to the shared Library. Unblock once the relevant Identity slices land.
- **Harvester content classification** (cross-cutting): populate `classification.{domain,population,
  administration_mode}` + `instrument_id` for the 158 harvested questionnaires so the Library filters
  cover them. Owned by the harvester — [questionnaire-harvester/HANDOFF.md](questionnaire-harvester/HANDOFF.md).
- **Shared TTL reaper** for unbounded token/outbox tables — Identity (`handoff_codes`/email/refresh) +
  Viewer Service (outbox). Coordinate a single approach across both services.
- **Schema gaps requiring a CalVer bump** (🔒 breaking, new OD each): native **date** question type
  (Schema 2 `input_data_type`); **per-locale** validation messages + metadata/section/page/block titles
  (plain strings today — blocks full Editor translation); promote the player's `x_response_revises`/
  `x_response_revision` attempt fields to first-class at the next Schema 5 bump; behavioural-capture
  channels beyond mouse+keyboard (EEG/webcam/mic) for Schema 4b.
- **Regenerate `schemas/runtime/examples/`** once the canonical Schema-2 examples' ~14 dangling refs are
  filled (shared between `schemas/`, `tools/`, and the denormaliser).
- **Multi-repo split** (deferred): the locked plan is multi-repo `behaverse/questionnaire-*`
  ([design/14_repository_topology.md](design/14_repository_topology.md)); 🔒 needs cross-repo schema
  packaging first (the split would break the build today). Until then, everything is one local repo.
- **Public schema hosting** at `behaverse.org/schemas/` — deferred; `$id` URLs stay canonical + resolve
  locally. Don't change them.
- **Ops:** move the Library function `iad1` (US) → `fra1` to match the EU Supabase region.

## Active conventions — must follow

- **CalVer `vYY.MMDD`** for everything project-owned; published versions immutable; `severity` tag per bump.
- **`bdm:` namespace** for the Events vocabulary (OD-19); reject mixed xAPI/Schema.org/AS2 statements.
- **`additionalProperties: false` + `^x_` patternProperties** on project-owned objects.
- **Hard-pinned references** `entity_id@vYY.MMDD` (OD-06); updates never silently propagate.
- **Design vs. plan separation:** `design/` = what the system *is*; `plan/` = when/how it's built. Build
  *status* goes in `plan/` + the component HANDOFFs, never in `design/`.
- **No PRs:** finish branches by merging to `master` locally + pushing (owner preference).

## Schema inventory — what's shipped

| # | Schema | Live version |
|---|---|---|
| 1 | Instrument Metadata | v26.0609 (`author` singular; optional `instrument_id`/`variant`, OD-21) |
| 2 | Questionnaire Definition | **v26.0618** |
| 3 | Questionnaire Runtime | v26.0603 |
| 4a | Event Data | v26.0605 |
| 4b | Behavioural Channels (Mouse + Keyboard) | v26.0605 |
| 5 | Response Data | v26.0603 |
| 6 | Session Metadata | v26.0603 |
| 7 | Viewer Conformance Manifest | v26.0603 |

Schemas are kept **in-repo**; the validator registry resolves all archived + live `$id` URLs locally.
Confirm exact live versions from each schema's `CHANGELOG` (the questionnaire schema has moved past v26.0609).

## Things NOT to do

- **Don't bump a schema version casually** — CalVer bumps are breaking per OD-06 (full spec/plan/execute each).
- **Don't re-decide settled ODs** — open a new OD instead of silently revising an old one (all 21 resolved).
- **Don't open PRs**; don't push without `git fetch` + ff/rebase first (shared checkout).
- **Don't execute the multi-repo split** until cross-repo schema packaging exists (it would break the build).
- **Don't `import-survey-db` into the local dev Library to "fill" it** — the canonical growing catalogue is
  the deployed Supabase app; a local re-import is a redundant parallel copy.
- **Don't commit importer output** (`content/` is gitignored) or the harvester's untracked working files.
- **Don't change schema `$id` URLs** to drop `behaverse.org` — they're canonical identifiers (resolve locally).

## Verifying the whole suite

Run each Python suite in its **own** `pytest` invocation (the monorepo has multiple `tests/test_validation.py`
packages → "import file mismatch" if combined). `DOCKER_CONFIG=/tmp/lib_docker` is **required** for the
`library/` + `viewer-service/` integration tests (testcontainers Postgres; the default docker cred helper is absent).

```bash
source .venv/bin/activate
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q            # Library Core + importer + community signals
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q     # Viewer Service (VS-A..E + participant slices)
pytest identity-service/ -q                                  # Identity
pytest questionnaire-runtime-denormaliser/ -q                # denormaliser (pure)
pytest tools/tests/ -q                                       # schema validation
( cd library-web && npm test && npm run build )
( cd web-viewer && npm test && npm run build && npm run build:lib )
( cd participant-app && npm test && npm run build )
( cd editor && npm test && npm run build )
bash -c '. "$HOME/.cargo/env" && cd questionnaire-expression-evaluator && cargo test' ; ( cd questionnaire-expression-evaluator/web && npm test )
bash -c '. "$HOME/.cargo/env" && cd questionnaire-scorer && cargo test' ; ( cd questionnaire-scorer/host && npm test )
( cd tools/respondent-bot && npm test )                      # respondent-bot trait model + trace (unit)
( cd tools/respondent-bot && npm run e2e )                   # respondent-bot offline capture smoke (Playwright)
```
If integration tests hang (container ready but host can't reach its port), Docker's host→container NAT has
gone stale — `sudo systemctl restart docker` clears it.

## References

- [README.md](README.md) — short project overview · [DEPLOYMENT.md](DEPLOYMENT.md) — live URLs + as-built deploy
- [design/00_index.md](design/00_index.md) — authoritative design · [plan/01_roadmap.md](plan/01_roadmap.md) — roadmap/phasing
- [docs/operational-gotchas.md](docs/operational-gotchas.md) · [docs/testing-participant-flow.md](docs/testing-participant-flow.md) · [docs/overview.md](docs/overview.md)
- [docs/handoff-archive.md](docs/handoff-archive.md) — the previous chronological HANDOFF (full history)
