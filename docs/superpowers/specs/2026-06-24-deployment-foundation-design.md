# Deployment Foundation + Participant Stack (M1) — Design

**Date:** 2026-06-24
**Status:** Approved (brainstorm) → ready for implementation plan
**Scope:** The shared deployment foundation for the whole system + Milestone 1 (the
participant stack live in production). The Editor deploy (M2) and the polish track (M3)
are separate spec→plan→build cycles.

---

## 1. Background & goal

The project owner has shifted focus away from new functionality: the goal now is to
**complete and deploy the components that have already been started**, then polish them,
before any new components are built.

Reality check (from a deployment recon on 2026-06-24): almost every component is already
**feature-complete**, but **only the Library is hosted**. The Library runs as a Vercel
project (`library-web` static SPA + an `api/index.py` FastAPI serverless function) backed
by Supabase Postgres at https://questionnaire-library.vercel.app (212 questionnaires).
The four other started pieces — **viewer-service**, **identity-service**, **web-viewer**
(the player), and **participant-app** (the portal) — have **no deployment scaffolding at
all** (no `vercel.json`, no `api/` entry, no Dockerfile). The background jobs (VS
forwarding outbox, Identity token reaper) already exist as **CLI commands**.

So "complete and deploy the started components" is **~90% a deployment effort**, not a
build effort.

### Owner decisions (this brainstorm)

1. **Hosting:** Vercel + Supabase **for now**, but explicitly built for **portability** —
   the owner expects to move to **Google Cloud** later and wants the whole-system
   deployment to be **as easy as possible**.
2. **First milestone:** the **participant stack** (Identity + Viewer Service + player +
   portal) — it delivers the visible public end-to-end (pick → run → collect → download)
   and unlocks the public "Try it" demo.
3. **Editor:** deploy **as-is** (export-only authoring) + polish; its true Phase-3 gate
   (Library write-back) is new functionality and stays out of scope. → Milestone 2.
4. **Portability scaffolding:** **containerize now** — a `Dockerfile` per service + a
   top-level `docker-compose.yml`, alongside the thin Vercel adapters.
5. **Accounts/email:** the first deploy **includes authenticated participant accounts**,
   which requires wiring a **real transactional-email provider (Resend)** for
   verify-email + password-reset.

### Success criteria for M1

- A member of the public can open the **portal** (hosted), browse the catalogue, **pick**
  a deployed questionnaire, **run** it in the hosted **player**, and have responses +
  events land in the hosted **Viewer Service**.
- A participant can **register / verify email / log in / view & download their own data**
  end-to-end against the hosted Identity + VS.
- Invite-link and demo (render-only "Try it") flows work in production.
- A researcher/admin can create deployments against the hosted VS (so the catalogue is
  non-empty).
- The **entire stack runs locally with one command** (`docker compose up`).
- Lock-in is confined to a handful of thin adapter files; a documented path to Google
  Cloud exists.

### Non-goals (M1)

- No new product features. Internal cron-trigger endpoints and a `ResendMailer` are
  deployment plumbing / completing the already-built email slice, not new features.
- No Editor deploy (M2). No polish backlog (M3). No Library changes (it is already live;
  VS points at it over HTTP).
- No live Behaverse forwarding sink (kept configurable; off by default).
- No custom domains (use `*.vercel.app`).
- No Google Cloud deployment (only a documented path).

---

## 2. Architecture: the two-layer pattern

Each service is deployed as its **own Vercel project**, with its Vercel "root directory"
set to the service's folder. This keeps services independently deployable and mirrors the
container-per-service model.

| Vercel project | Source dir | Type | Backing store |
|---|---|---|---|
| library *(exists)* | `library-web/` + `api/` | static SPA + Python fn | Supabase (existing) |
| **identity** | `identity-service/` | Python fn | Supabase (new) |
| **viewer-service** | `viewer-service/` | Python fn | Supabase (new) |
| **player** | `web-viewer/` | static SPA | — |
| **portal** | `participant-app/` | static SPA | — |
| editor *(M2)* | `editor/` | static SPA + `/api/translate` fn | — |

For every **backend** service, two layers:

- **Core (portable, essentially unchanged).** The standard FastAPI app served by
  `uvicorn`. Gains a **`Dockerfile`** (used by compose locally; Cloud-Run-ready later).
  All behavior is driven by environment variables (§3).
- **Adapter (thin, platform-specific).** A small **`api/index.py`** that exposes the ASGI
  app to Vercel's Python runtime (the Library already has exactly this), plus a
  **`vercel.json`** (routes `/v1/*`, `/healthz`, internal cron paths to the function).
  These two files are the **only** Vercel-coupled artifacts per service.

For every **frontend** (Vite SPA): a `vercel.json` with an SPA rewrite, built with
build-time `VITE_*_BASE_URL` env. Dockerfile builds the static bundle and serves it (for
compose / portability).

**Why this is portable.** The FastAPI apps, the Vite apps, the Dockerfiles, and the env
contract are 100% standard. Moving to Google Cloud later means: build the existing
Dockerfiles to Cloud Run, repoint `DATABASE_URL` at Cloud SQL, and replace Vercel Cron
with Cloud Scheduler hitting the same endpoints. The `api/index.py` + `vercel.json` files
are simply unused on GCP.

Domains: default `*.vercel.app` per project. Cross-origin CORS must list every frontend
origin (§3) — historically the #1 "page silently fails to load" trap in this project.

---

## 3. Configuration & portability (12-factor)

Every service reads **all** configuration from environment variables; nothing platform- or
host-specific is hardcoded. The same values drive **both** compose (local) and Vercel
(cloud) — one config dialect, two targets.

**Backend env (per service, representative):**

- Identity: `DATABASE_URL`, `IDENTITY_ISSUER`, `IDENTITY_AUDIENCE`, signing key material,
  `IDENTITY_CORS_ORIGINS`, `WEB_VIEWER_BASE_URL` (link base for emails), `RESEND_API_KEY`,
  `CRON_SECRET`.
- Viewer Service: `DATABASE_URL`, `LIBRARY_BASE_URL`, `IDENTITY_JWKS_URL`/`ISSUER`/
  `AUDIENCE`, `VS_CORS_ORIGINS`, `INVITE_SIGNING_SECRET`, forwarding sink config
  (optional), `CRON_SECRET`.

**Frontend env (build-time):**

- player (`web-viewer`): `VITE_VIEWER_BASE_URL`, `VITE_IDENTITY_BASE_URL`.
- portal (`participant-app`): `VITE_VIEWER_BASE_URL`, `VITE_IDENTITY_BASE_URL`,
  `VITE_PLAYER_BASE_URL` (where it launches the player).

**Single source of truth for the topology.** The deploy doc (§6) carries an **env matrix**
table (which origin each `*_BASE_URL` and each `*_CORS_ORIGINS` points to), and each
service ships a committed **`.env.example`**. CORS allow-lists must include both the portal
and player origins on Identity and VS.

---

## 4. Background workers as scheduled endpoints

The VS forwarder and the Identity reaper already exist as CLI commands. To run them in a
serverless environment without a long-running process:

- Add a thin **internal HTTP endpoint** per job (e.g. `POST /internal/forward` on VS,
  `POST /internal/reap` on Identity) that simply invokes the existing CLI/service logic.
- Guard each endpoint with a shared **`CRON_SECRET`** (header/bearer check) so only the
  scheduler can call it.
- Trigger them with **Vercel Cron** (declared in each service's `vercel.json`).

No business logic changes — the endpoint is a trigger wrapper around code that already
exists and is tested. On Google Cloud later, **Cloud Scheduler** calls the same endpoints
(or a container runs the CLI on a cron) — fully portable.

**Forwarding sink.** The VS→Behaverse forwarding sink stays **configurable and off by
default**: with no live Behaverse endpoint, responses simply remain in VS (`submitted`)
and are downloadable via the existing CSV export. Forwarding is enabled when a sink URL is
configured.

---

## 5. Data & email

**Postgres.** Each service keeps its own `DATABASE_URL`. Default: a **separate Supabase
project per service** (Identity, Viewer Service; Library already has one) — clean
isolation that maps 1:1 to separate Cloud SQL instances later. Cheap fallback (if project
count/cost matters): one Supabase project with a **schema per service**; invisible to the
code since everything is behind `DATABASE_URL`. Migrations are run per service via its
existing `migrate` CLI against the production `DATABASE_URL`.

**Email (Resend).** Add a **`ResendMailer`** to Identity's existing `make_mailer(settings)`
factory, selected when `RESEND_API_KEY` is set (precedence: Resend → SMTP → Console →
Null-in-tests). It sends the same verify-email / password-reset links already built,
using `WEB_VIEWER_BASE_URL` as the link base. The existing **no-enumeration** guarantees
are preserved (request-password-reset stays 202-always; mailer failure there is
swallowed+logged; register send stays atomic).

---

## 6. "Easy to deploy the whole system" (first-class deliverable)

- **Local — one command.** A top-level **`docker-compose.yml`** brings up Postgres + all
  three backends + the frontends, wired via the env matrix. This is both a real dev/test
  environment and the proof that nothing is Vercel-dependent.
- **Cloud — a runbook.** A top-level **`DEPLOYMENT.md`**: the per-service Vercel project
  setup (root directory, build command, env), the **env matrix**, the cron configuration,
  the migration step, and the **seeding step** — an admin account creates the demo
  deployments (e.g. `qst_wellbeing`) marked `listed=true` so the portal catalogue is
  non-empty on day one.
- **Future GCP — a documented path.** A `DEPLOYMENT.md` section describing the move:
  existing Dockerfiles → Cloud Run, Supabase → Cloud SQL (repoint `DATABASE_URL`), Vercel
  Cron → Cloud Scheduler (same endpoints). Documented, not built.

---

## 7. Components / work units (for M1)

Each is small, independently testable, and follows existing patterns:

1. **Per-service Vercel adapter** — `api/index.py` + `vercel.json` for identity-service and
   viewer-service (model on the Library's existing adapter).
2. **Per-service Dockerfile** — identity-service, viewer-service, web-viewer,
   participant-app (and Postgres via the compose base image).
3. **`docker-compose.yml`** (top level) — full-stack local bring-up + env wiring.
4. **Frontend Vercel config** — `vercel.json` (SPA rewrite) + build-time env for player &
   portal.
5. **Cron-trigger endpoints** — `/internal/forward` (VS) and `/internal/reap` (Identity),
   `CRON_SECRET`-guarded, + Vercel Cron declarations.
6. **`ResendMailer`** — added to Identity's mailer factory + config.
7. **`.env.example` per service** + the **env matrix** in `DEPLOYMENT.md`.
8. **`DEPLOYMENT.md`** runbook (Vercel setup, env matrix, cron, migrations, seeding, GCP
   path).
9. **Provisioning + go-live** — create Supabase projects, run migrations, set Vercel env,
   deploy each project, seed demo deployments, verify the end-to-end + accounts/email
   flows in production.

---

## 8. Risks & mitigations

- **CORS misconfiguration** (the recurring trap). Mitigation: the single env matrix;
  verify the **browser request** (not just the API) per the operational-gotchas doc.
- **Python on Vercel serverless** (cold starts, package size, native deps like Argon2).
  Mitigation: the Library already runs FastAPI + PyJWT on Vercel; validate Argon2 + psycopg
  in a preview deploy early; the Dockerfile is the fallback if a service won't fit.
- **Cross-origin auth** (portal ↔ player). The SSO handoff (#1-SSO) is already built and
  expects the two origins — production must set the handoff/exchange origins correctly in
  the env matrix.
- **Secrets management.** Identity signing key, `INVITE_SIGNING_SECRET`, `RESEND_API_KEY`,
  `CRON_SECRET`, `DATABASE_URL`s live in Vercel env (and a local `.env` for compose, git-
  ignored). Documented in the runbook.
- **Email deliverability** (Resend domain verification). Mitigation: start with Resend's
  onboarding/sandbox domain; document custom-domain verification as a follow-up.

---

## 9. Milestones beyond M1 (separate cycles)

- **M2 — Editor deploy:** the editor as a static SPA + its one `/api/translate` function;
  clear the a11y backlog (`ForkDialog`/`LibraryPicker` Escape/role/focus-trap). Reuses the
  patterns established here.
- **M3 — Polish track:** per-component `FOLLOWUPS.md` items, robustness, UX, across the
  now-live components.
