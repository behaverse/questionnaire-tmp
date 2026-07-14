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

## State at a glance (2026-07-11)

- **🟢 Everything started is LIVE on Vercel + Supabase ($0 tier)** and browser-verified: Library, Identity,
  Viewer Service, the player (web-viewer), the portal (participant-app), **and the editor**. Real email via
  Resend (`xcit.org`). URLs are in each component HANDOFF and [DEPLOYMENT.md](DEPLOYMENT.md) §0.
- **🔒 Security + production hardening — DONE + LIVE (2026-07-10→11).** A 5-lens whole-repo review
  ([plan/05_completion_plan.md](plan/05_completion_plan.md)) drove Phase 0 (critical security + backups) and
  Phase 1 (auth/ops hardening), both merged and **redeployed live** + verified. Highlights, all live:
  registration is participant-only + **enumeration-resistant** (uniform 202); the Viewer Service enforces
  **per-owner authorization** on every deployment route (cross-tenant IDOR closed); `redirect_url` is
  http(s)-validated (open-redirect closed); the editor's `/api/translate` is guarded; **per-IP rate limiting**
  on auth endpoints (backed by the live `rate_limit_hit` table); admin reads are audience-scoped;
  constant-time cron guards; interactive API docs gated off (`ENABLE_DOCS`). Ops: **nightly `pg_dump`
  backups** ([docs/backups.md](docs/backups.md)), a **VS TTL reaper** + `requeue-failed`, **`fra1`** region,
  **versioned migrations** (`schema_migrations`, baseline adopted on the live DBs), **Sentry** (dormant unless
  `SENTRY_DSN`; set on all 3 services), and a **GitHub Actions uptime + Supabase keepalive**
  ([docs/monitoring.md](docs/monitoring.md)). An adversarial re-review confirmed the IDOR fix complete and
  fixed rate-limiter follow-ups (trusted client-IP, fail-open, bounded map). **Deferred** (owner):
  RLS/PostgREST exposure check (all tables RLS-off incl. `users`/`outbox`) — see memory / plan/05.
- **Built + live:** Phase 1 (schemas + Library), Phase 2 (Viewer Service + Web Viewer + deployments), the
  full participant experience (portal + player + Identity SSO handoff), and the Editor (incl. auto-translate).
- **Public catalogue:** **https://questionnaire-library.vercel.app** — **222 questionnaires** (64 `survey_database`
  + 158 from the harvester), normalized **v26.0618**; homepage stats ~222 Q / 3,741 questions / 490 options / 7 languages.
- **Owner quick-wins — `my_comments.md` #1–#9 fully shipped + live:** presentation flags (`x_key_select` /
  `x_back_nav`), per-question QA **comments** (+ researcher CSV export), Editor authoring of those flags,
  Library **question search**, the **score-progression** dashboard, **xAPI download**, the **respondent-bot**
  (#8), and — completing the list (2026-07-02→03) — the **replay** track (#7): RP1/RP2/RP3 plus multi-select
  (checkbox) reconstruction, a researcher **`/studies`** surface (copy / revoke / watch-live), a dedicated
  **`REPLAY_SIGNING_SECRET`** + per-session link revocation, and **live-follow** (`?follow=1`). See
  [web-viewer/docs/replay.md](web-viewer/docs/replay.md).
- **Remaining big tracks:** **Phase 4** (Native/Godot viewer) and **Phase 5** (Participant Platform —
  studies/protocols/scheduling) — both system-level, see [§System-wide tasks](#system-wide-tasks).
- **✅ Classification gap CLOSED (2026-06-25; verified live 2026-07-06):** all 158 harvested questionnaires now
  carry `classification.{domain,population,administration_mode}` + `instrument_id`, and the survey_db domains were
  normalized to the same clean vocab and re-seeded. Live `/v1/facets` spans the whole corpus — **domain 222/222,
  instrument 222/222, population 205/222**. Residual (minor): `administration_mode` covers only the 158 harvested,
  and 17 survey_db entries lack `population`. See [questionnaire-harvester/HANDOFF.md](questionnaire-harvester/HANDOFF.md).

## How agents work here

This monorepo is worked on **one component per agent, each on its own branch** — to prevent
cross-contamination. If you've been handed a component:

1. **Read that component's `HANDOFF.md`** (index below) — it has the run/test commands, the curated
   "what's left", and the component-specific gotchas. It links its `README.md` (depth) and `FOLLOWUPS.md`
   (raw backlog) where those exist.
2. **Branch:** create `work/<component>` (the suggested name is in each HANDOFF). Keep commits scoped to
   your component's directory.
3. **Finish:** **merge to `master` locally + push — no PRs** (owner preference). `git fetch origin` +
   ff-or-rebase **before every push**.
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
| [questionnaire-harvester/](questionnaire-harvester/HANDOFF.md) | Web → Schema-2 harvester (its HANDOFF is a gitignored working note) | ✅ 158 live | — |
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
- **QA / research tooling — replay (#7) + respondent-bot (#8): ✅ COMPLETE (2026-07-02→03).** The paired
  track is built and merged. **#8 respondent-bot** (`tools/respondent-bot/`) is a Playwright trait-model
  harness (acquiescence / straight-lining / random / fixed profile; real-pointer vs. direct-state) that
  drives the player and emits `bdm:` traces — doubling as cross-stack E2E and the trace generator for #7.
  **#7 replay** is done end-to-end: RP1 (offline `?replay=<src>` → `ReplayApp` renderer), RP2 (researcher
  `POST /v1/deployments/{id}/sessions/{sid}/replay-link` + token-authorized `GET /v1/replay?token=`),
  RP3-core (verified round-trip: e2e `tools/respondent-bot/tests/e2e/replay.spec.ts` + `web-viewer/docs/replay.md`),
  plus all follow-ons — multi-select (checkbox) reconstruction, the participant-app researcher **`/studies`**
  surface (copy / revoke / watch-live), a dedicated **`REPLAY_SIGNING_SECRET`** + per-session link revocation,
  and **live-follow** (`?follow=1`). Detail: [web-viewer/docs/replay.md](web-viewer/docs/replay.md),
  `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, and the `2026-07-0x-replay-*` specs/plans in
  `docs/superpowers/`. (Foundation reference: the player's `bdm:` events flush to the retained Viewer Service
  `outbox`; the per-session reader is `viewer-service/.../store/export.py`.)
- **🔒 Identity/OD-08-gated features** spanning components: Library contribution/review workflow + DOI
  (ID-C2/C3), the Editor's real "Open in viewer" preview deployment + write-back of forked/translated
  entities to the shared Library. Unblock once the relevant Identity slices land.
- **Harvester content classification — ✅ DONE + LIVE (2026-06-25).** All 158 harvested questionnaires classified
  (`domain`/`population`/`administration_mode` + `instrument_id`) and re-seeded; Library filters now cover all 222.
  Residual only: back-fill `administration_mode` (and the 17 missing `population`) on the 64 survey_db entries so
  those two facets also span the whole corpus. Owned by the harvester — [questionnaire-harvester/HANDOFF.md](questionnaire-harvester/HANDOFF.md).
- **TTL reaper — ✅ DONE (2026-07-10→11).** Identity reaps `handoff_codes`/email/refresh + `rate_limit_hit`
  (daily `/internal/reap` cron). Viewer Service `maintenance.reap` prunes moot replay-revocations + aged
  ephemeral sessions (folded into the daily `/internal/forward` tick; the outbox is NEVER pruned — it's the
  export source) + a `requeue-failed` CLI. See [plan/05_completion_plan.md](plan/05_completion_plan.md).
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
- **Ops:** ~~move the Library function `iad1` (US) → `fra1`~~ **✅ DONE** — `regions:["fra1"]` on all 3
  Python `vercel.json`.

## Active conventions — must follow

- **CalVer `vYY.MMDD`** for everything project-owned; published versions immutable; `severity` tag per bump.
- **`bdm:` namespace** for the Events vocabulary (OD-19); reject mixed xAPI/Schema.org/AS2 statements.
- **`additionalProperties: false` + `^x_` patternProperties** on project-owned objects.
- **Hard-pinned references** `entity_id@vYY.MMDD` (OD-06); updates never silently propagate.
- **Design vs. plan separation:** `design/` = what the system *is*; `plan/` = when/how it's built. Build
  *status* goes in `plan/` + the component HANDOFFs, never in `design/`.
- **No PRs:** finish branches by merging to `master` locally + pushing (owner preference).
- **Migrations:** each service applies numbered `store/migrations/*.sql` recorded in `schema_migrations`
  (service-namespaced version keys, e.g. `identity:001_baseline.sql`, since Identity+VS share one DB). New
  schema changes = a new `NNN_*.sql` (never edit an applied one); they CAN alter existing columns.
  **Never `DROP SCHEMA`** to force a change — use a migration.
- **API docs** are gated off in prod unless `ENABLE_DOCS` is truthy; **Sentry** is dormant unless
  `SENTRY_DSN` is set (both platform-agnostic env vars — the owner may move Vercel→GCP later).

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
- **Don't open PRs**; don't push without `git fetch` + ff/rebase first.
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
- [docs/backups.md](docs/backups.md) — **DB backup + restore runbook** (responses are a single copy; back them up)
- [docs/monitoring.md](docs/monitoring.md) — Sentry (dormant unless `SENTRY_DSN`) + uptime/keepalive (healthchecks + GH Actions)
- [plan/05_completion_plan.md](plan/05_completion_plan.md) — **completion + production-hardening plan** (2026-07-10 review; Phase 0/1 done, 2–6 remain)
- [design/00_index.md](design/00_index.md) — authoritative design · [plan/01_roadmap.md](plan/01_roadmap.md) — roadmap/phasing
- [docs/operational-gotchas.md](docs/operational-gotchas.md) · [docs/testing-participant-flow.md](docs/testing-participant-flow.md) · [docs/overview.md](docs/overview.md)
- [docs/handoff-archive.md](docs/handoff-archive.md) — the previous chronological HANDOFF (full history)
