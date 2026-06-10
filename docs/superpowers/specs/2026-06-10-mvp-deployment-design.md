# MVP Deployment — Design Spec

**Date drafted:** 2026-06-10
**Goal:** Ship the MVP — deploy the Library Core (FastAPI read API) + the `library-web` React SPA to a public URL, backed by a managed Postgres seeded with the survey_db content, so a researcher can open the web interface, search the catalogue, view a questionnaire, and download its canonical JSON. This closes Phase 1 (`plan/01_roadmap.md`).
**Approach (owner-approved):** **Supabase** (managed Postgres) **+ Vercel** (SPA + FastAPI serverless, same-origin). Project name **`questionnaire-library`** on both. Cost **$0/month** (Supabase free tier confirmed via `get_cost`; Vercel hobby).

**Authoritative sources:** the built `library/` (FastAPI, `api/app.py::create_app`, per-request `api/deps.py::get_conn`, env-driven `config.py`) + `library-web/` (Vite/React SPA, `src/api/client.ts`). Decision context: the schema-hosting decision ([plan/02_mvp_scope.md](../../../plan/02_mvp_scope.md) §"Schema hosting" — schemas stay in-repo; the serve path needs no schemas). `plan/02_mvp_scope.md` (MVP outcome + DoD).

---

## 1 — Scope

### In scope
- A new **Supabase** Postgres project (`eu-central-1`, free tier), schema-migrated + **seeded** with the importer output (64 questionnaires + entities).
- A **Vercel** project serving, same-origin: the `library-web` SPA at `/` + the FastAPI read API (`/v1/*`, `/healthz`) as a Python serverless function.
- The small repo changes deployment requires: a Vercel function entrypoint, a deploy-time `requirements.txt`, `vercel.json`, and a one-line SPA client tweak for same-origin URL resolution.
- A repeatable **seed script/command** (run locally against Supabase).
- Verification: the live URL serves the catalogue end-to-end.

### Out of scope (deferred)
- Custom domain (`library.behaverse.org`) — use the Vercel-provided URL for now.
- The write API / contribution workflow / auth (sub-project 3, needs Identity).
- Public schema hosting at behaverse.org (deferred per the schema-hosting decision; not needed — the serve path doesn't use schemas).
- CI/CD auto-deploy wiring (deploy is owner-triggered for now).

### Non-goals
- No change to the Library's API behaviour, the data model, or the importer logic. This is packaging + hosting + seeding only (plus the one same-origin client tweak).

---

## 2 — Architecture

```
 Browser ──HTTPS──> Vercel project "questionnaire-library"
                      ├── /                → library-web SPA (Vite static build)
                      ├── /v1/* , /healthz → FastAPI (Python serverless function)  ──┐
                      └── (same origin → no CORS)                                    │
                                                                                     ▼
                                          Supabase Postgres "questionnaire-library" (eu-central-1)
                                          (serving: transaction pooler :6543)
```
- **Same-origin**: the SPA and API share the Vercel origin, so **no CORS** is needed in production (`LIBRARY_CORS_ORIGINS` left unset).
- **Stateless serving**: the function does per-request `connect/close` (`get_conn`) — serverless-correct. It connects through Supabase's **transaction pooler** (port 6543) so many short-lived function invocations don't exhaust Postgres connections.
- **No schemas at serve time**: the API serves pre-ingested `jsonb`; validation happened at ingest (local seed). So the Vercel function bundle does **not** need `schemas/`.

---

## 3 — Components

### 3.1 Supabase project
A new free project `questionnaire-library` in `eu-central-1` (matches the org's existing region). Created via the Supabase MCP (`create_project`, after `confirm_cost`). Yields: a direct connection (`db.<ref>.supabase.co:5432`) and a transaction-pooler connection (`aws-0-eu-central-1.pooler.supabase.com:6543`, user `postgres.<ref>`). The generated DB password is a **secret** (never committed; stored in Vercel env + used locally for seeding).

### 3.2 Vercel function packaging (the one real engineering task)
- **`api/index.py`** (repo root) — the serverless entrypoint exposing the ASGI app:
  ```python
  from library.api.app import create_app
  app = create_app()
  ```
- **`requirements.txt`** (repo root) — makes the `library` package + its deps installable in Vercel's Python build: the local package (`./library`) plus `psycopg[binary]` (the binary build needs no system libpq, required on serverless). Exact contents finalized in the plan + verified by a real deploy.
- **`vercel.json`** (repo root) — builds the SPA and routes:
  - build the SPA: `cd library-web && npm install && npm run build`, output `library-web/dist`;
  - **rewrites** so `/v1/*` and `/healthz` hit the Python function, while all other paths fall through to the SPA's `index.html` (client-side routing). Rewrite **order** matters (API paths before the SPA catch-all) — pinned + verified in the plan.
- **Env var** on the Vercel project: `DATABASE_URL` = the Supabase **transaction-pooler** URL (secret). `LIBRARY_CORS_ORIGINS` unset (same-origin).

> If Vercel's Python packaging of the `library` monorepo package proves fragile (build can't resolve `./library`, function size, cold-start issues), the **fallback** is: keep the SPA on Vercel, host the FastAPI on a container host (e.g. Render free tier) as a normal long-running process, and set `LIBRARY_CORS_ORIGINS` to the Vercel origin (the app's CORS support already exists). We try same-origin Vercel first.

### 3.3 SPA same-origin client tweak
`library-web/src/api/client.ts` builds `new URL(BASE_URL + path)`, which throws on a relative base. For same-origin (build with `VITE_API_BASE_URL=""`), resolve against the page origin:
```ts
const url = new URL(BASE_URL + path, window.location.origin)
```
With `BASE_URL=""` this yields same-origin absolute URLs; with `BASE_URL="http://localhost:8000"` (local dev) the absolute base still wins. The download helper (`rawDefinitionUrl` → `fetch`) already works with a relative `/v1/...` path. Covered by a unit test (relative base resolves to same-origin).

### 3.4 Connections: seed vs serve
- **Seeding** (one-off, local): use the **direct** connection (`:5432`) — a single long migrate/import/ingest run.
- **Serving** (Vercel function): use the **transaction pooler** (`:6543`) — many short connections.

---

## 4 — Seeding procedure (repeatable, run locally)

Against the new Supabase DB (direct connection), reusing the same commands proven locally:
```
DATABASE_URL=<supabase-direct-url> python -m library.cli migrate
python -m library.cli import-survey-db survey_database/data/survey_db.sqlite --out /tmp/content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
DATABASE_URL=<supabase-direct-url> python -m library.cli ingest /tmp/content --release v26.0606
```
Result: 1184 entities (64 questionnaires) in Supabase, validated at ingest. Idempotent re-seed = `TRUNCATE … CASCADE` then re-ingest. Documented as `scripts/seed-supabase.md` (or a small script) so it's repeatable. The importer output stays gitignored.

---

## 5 — Secrets / safety
- The Supabase DB password / connection strings are **secrets**: stored in the Vercel project env (`DATABASE_URL`) and used locally for seeding; **never committed**. `.env*` stays gitignored.
- Creating cloud resources is owner-confirmed (done). Cost re-confirmed at create time via `confirm_cost`.
- The deployed API is **read-only** (no write endpoints, no auth surface) — the public read API is the intended exposure.

---

## 6 — Verification (definition of done)
1. **Supabase** project `questionnaire-library` exists (eu-central-1), migrated + seeded (64 questionnaires; `GET count` matches the local seed).
2. **Vercel** project `questionnaire-library` deployed; `GET <url>/healthz` → `{"status":"ok"}`; `GET <url>/v1/questionnaires` returns the instrument-grouped catalogue from Supabase.
3. **End-to-end in a browser** at the Vercel URL: search the catalogue → open a questionnaire (metadata + items render) → download its canonical JSON. Same-origin (no CORS errors in console).
4. Repo: `api/index.py`, `requirements.txt`, `vercel.json`, the client tweak (+ test), and the seed doc committed on the branch; secrets not committed; frontend + library suites stay green.
5. The live URL recorded (in HANDOFF / the PR-less merge commit). Custom domain deferred.

---

## 7 — Risks
- **Vercel Python + monorepo package** is the main unknown — mitigated by the container-host fallback (§3.2) and by verifying with a real deploy before declaring done.
- **Pooler vs direct** — using the transaction pooler for serving avoids connection exhaustion; if the pooler rejects the per-request pattern, fall back to the session pooler or add a tiny connection retry.
- **Cold starts** — acceptable for an MVP catalogue; noted, not optimized.
