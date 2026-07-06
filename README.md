# Questionnaire Apps

An open, modular platform for designing, distributing, running, and analysing psychological-research
questionnaires. This monorepo holds the **design**, the **canonical JSON schemas**, and the
**implementations** of every component.

**Status (2026-07-06).** Phase 1 (schemas + Library) and Phase 2 (Web Viewer + deployments) **shipped**;
the full **participant experience** and the **Editor** are **built and live on Vercel + Supabase** — the
whole stack (Library, Identity, Viewer Service, player, portal, editor) is deployed and browser-verified on
the $0 tier. The public Library is at **https://questionnaire-library.vercel.app** with **222
questionnaires** (64 `survey_database` + 158 from the harvester). The owner **QA / research-tooling** track is
complete — notably the **replay** feature (record → replay a session, researcher `/studies` links,
live-follow) and the respondent-bot. Remaining major tracks: **Phase 4** (Godot native viewer) and
**Phase 5** (Participant Platform — studies/protocols/scheduling). See **[HANDOFF.md](HANDOFF.md)** for the
live status and what's next, and **[docs/operational-gotchas.md](docs/operational-gotchas.md)** before
running the stack.

## Start here

- **New agent or contributor?** → **[HANDOFF.md](HANDOFF.md)** — current status, conventions,
  anti-patterns, suggested next work.
- **Running / demoing the stack?** → **[docs/operational-gotchas.md](docs/operational-gotchas.md)** +
  **[docs/testing-participant-flow.md](docs/testing-participant-flow.md)**.
- **What the system is →** [design/00_index.md](design/00_index.md) (authoritative).
- **How and when it gets built →** [plan/00_index.md](plan/00_index.md) (roadmap, phases).

The `design/` folder is the single authoritative source of *what the system is*; `plan/` records the
roadmap/MVP/phasing; `HANDOFF.md` is the navigation aid. Versioning is CalVer `vYY.MMDD`.

## Components (implementations)

| Path | What it is | State |
|---|---|---|
| [schemas/](schemas/) | The 8 canonical JSON Schemas (questionnaire, runtime, events, response, …) | ✅ authored/validated |
| [tools/](tools/) | Schema validator (`validate_schemas.py`) | ✅ |
| [library/](library/) | **Library Core** — catalogue, ingestion, public read API, `survey_database` importer, community signals (FastAPI + Postgres) | ✅ built + deployed |
| [library-web/](library-web/) | **Library web UI** — read-only catalogue (search → view → download) + **"Try it"** demo links (Vite/React) | ✅ built + deployed |
| [questionnaire-runtime-denormaliser/](questionnaire-runtime-denormaliser/) | Schema 2 → Schema 3 runtime denormaliser (Python lib) | ✅ |
| [questionnaire-expression-evaluator/](questionnaire-expression-evaluator/) | Logic/expression evaluator (Rust → WASM) | ✅ |
| [questionnaire-scorer/](questionnaire-scorer/) | Scorer ABI + conformance runner (Rust → WASM) | ✅ |
| [viewer-service/](viewer-service/) | **Viewer Service** — deployments, sessions, runtime cache, response/event outbox, public catalogue + `preview` (FastAPI + Postgres) | ✅ |
| [identity-service/](identity-service/) | **Identity** — accounts, JWT/JWKS, RBAC, the cross-origin SSO handoff (FastAPI + Postgres) | ✅ |
| [web-viewer/](web-viewer/) | **The player** — the focus-mode questionnaire runner (Vite/React); also exports the renderer/scoring libs for the editor | ✅ |
| [participant-app/](participant-app/) | **The participant portal** — sign in, browse, pick → run → return, my-data (Vite/React) | ✅ |
| [participant-session/](participant-session/) | Shared auth/session package consumed by the portal + the player | ✅ |
| [editor/](editor/) | **The Editor** — visual authoring (Vite/React) | ✅ built + deployed, ⏸ dev-parked |
| [questionnaire-harvester/](questionnaire-harvester/) | Web → Schema-2 questionnaire harvester | ✅ 158 live |
| [api/](api/) | Vercel serverless entry for the deployed Library | — |

> **The participant experience is three apps + a shared package**, not one: the **portal**
> (`participant-app/`, :5174) lets a participant browse and pick; the **player** (`web-viewer/`, :5173)
> runs one questionnaire and returns; **`participant-session/`** is the shared login. Authentication
> across the two origins uses Identity's one-time **SSO handoff**. (Historically `web-viewer/` was both;
> it is now the player only.)

## Running locally

See **[docs/testing-participant-flow.md](docs/testing-participant-flow.md)** for the full multi-service
setup. Default local ports: Identity **8100**, Library **8000**, Viewer Service **8001**, player
**5173**, portal **5174**, Library web **5175**. ⚠️ **Read [docs/operational-gotchas.md](docs/operational-gotchas.md)
first** — every frontend on a new port must be added to the backends' CORS allow-lists, or the page
silently fails to load.

## docs/, design/, plan/

- [docs/](docs/) — operational guides + `docs/superpowers/` implementation specs & plans (one pair per
  build slice).
- [design/](design/) — the authoritative design (vision, terminology, use cases, architecture, data
  model, per-component specs, open decisions).
- [plan/](plan/) — the roadmap and phasing.

Superseded predecessor projects (the old `survey_database`/`survey_system`/`qv_godot` prototypes) were
moved to a gitignored, local-only `archive/` during the 2026-06-23 cleanup; they are reference-only and
not authoritative.
