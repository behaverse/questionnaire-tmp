# MVP Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) — the cloud-ops phases (B–D) are a coupled runbook that creates real resources, handles secrets (the Supabase connection string), and threads state (project ref, URLs) across steps, so they are executed **inline by the orchestrator**, not delegated to fresh subagents. Phase A (repo files) is plain code. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Deploy the Library Core (FastAPI) + `library-web` SPA to Vercel (same-origin), backed by a seeded Supabase Postgres, so a researcher can use the live catalogue end-to-end.

**Architecture:** Vercel project `questionnaire-library` serves the SPA at `/` and the FastAPI read API (`/v1/*`, `/healthz`) as a Python serverless function via `api/index.py`; same-origin (no CORS). Supabase Postgres `questionnaire-library` (eu-central-1, free) holds the seeded catalogue; the function connects via the transaction pooler (:6543), seeding runs locally via the direct connection (:5432).

**Tech Stack:** FastAPI + psycopg3 (Python 3.12) · Vite/React SPA · Vercel (`@vercel/python` + static) · Supabase Postgres · Supabase/Vercel MCP servers.

**Spec:** [docs/superpowers/specs/2026-06-10-mvp-deployment-design.md](../specs/2026-06-10-mvp-deployment-design.md). **Branch:** `mvp-deploy`.

**Secrets rule:** the Supabase connection strings/password are secrets — set them as Vercel env vars + use locally for seeding; **never commit**. Keep them out of files, plan output, and commits.

---

## Phase A — Repo deploy artifacts

### Task A1: Same-origin SPA client tweak

**Files:**
- Modify: `library-web/src/api/client.ts`
- Test: `library-web/src/api/client.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `library-web/src/api/client.test.ts` (inside the `describe`):
```ts
  it('resolves relative paths same-origin when VITE_API_BASE_URL is empty', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { api: sameOrigin } = await import('./client')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [], total: 0, limit: 20, offset: 0 }) } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await sameOrigin.listQuestionnaires({})
    const calledUrl = (fetchMock.mock.calls[0][0] as URL).toString()
    expect(calledUrl).toBe(`${window.location.origin}/v1/questionnaires`)
    vi.unstubAllEnvs(); vi.resetModules()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd library-web && npm test -- client 2>&1 | tail -12`
Expected: FAIL — `new URL('/v1/questionnaires')` throws "Invalid URL" (relative base, no origin).

- [ ] **Step 3: Resolve URLs against the page origin**

In `library-web/src/api/client.ts`, change the URL construction (currently `const url = new URL(BASE_URL + path)`) to pass the page origin as the base so a relative `BASE_URL` resolves same-origin (an absolute `BASE_URL` like `http://localhost:8000` still wins):
```ts
  const url = new URL(BASE_URL + path, window.location.origin)
```
(The download helper `rawDefinitionUrl` returns `${BASE_URL}/v1/...` and is consumed by `fetch`, which already accepts a relative path — no change needed there.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd library-web && npm test -- client 2>&1 | tail -6`
Expected: PASS (the new same-origin test + the existing client tests — absolute `BASE_URL` is unchanged).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/api/client.ts library-web/src/api/client.test.ts
git commit -m "feat(library-web): resolve API URLs same-origin when VITE_API_BASE_URL is empty"
```

---

### Task A2: Vercel Python function entrypoint + requirements

**Files:**
- Create: `api/index.py`
- Create: `requirements.txt`

- [ ] **Step 1: Create the serverless entrypoint**

`api/index.py` (repo root) — Vercel's `@vercel/python` runtime serves the exposed ASGI `app`:
```python
"""Vercel serverless entrypoint: the Library Core FastAPI read API.
Serves /v1/* + /healthz (validation happens at ingest, so no schemas are needed here)."""
from library.api.app import create_app

app = create_app()
```

- [ ] **Step 2: Create the deploy requirements**

`requirements.txt` (repo root) — installs the `library` package (its `pyproject.toml` already declares `fastapi`, `psycopg[binary]`, `pydantic`, so this one line pulls everything the function needs):
```
./library
```

- [ ] **Step 3: Sanity-check the entrypoint imports locally**

Run: `source .venv/bin/activate && python -c "from library.api.app import create_app; create_app(); print('entrypoint OK')"`
Expected: `entrypoint OK` (no import error; confirms the function module loads without a DB or schemas).

- [ ] **Step 4: Commit**

```bash
git add api/index.py requirements.txt
git commit -m "feat(deploy): Vercel Python function entrypoint + requirements for the Library API"
```

---

### Task A3: vercel.json (build the SPA + route same-origin)

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create the Vercel config**

`vercel.json` (repo root) — build the SPA, and route `/v1/*` + `/healthz` to the Python function while everything else falls through to the SPA (rewrite order: API paths first, SPA catch-all last):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd library-web && npm install && npm run build",
  "outputDirectory": "library-web/dist",
  "rewrites": [
    { "source": "/v1/:path*", "destination": "/api/index" },
    { "source": "/healthz", "destination": "/api/index" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```
(The Python function at `api/index.py` is auto-detected and served at `/api/index`. The last rewrite sends non-API routes to the SPA for client-side routing without capturing `/api/*`.)

- [ ] **Step 2: Validate JSON + commit**

Run: `python -c "import json; json.load(open('vercel.json')); print('vercel.json valid')"`
Expected: `vercel.json valid`
```bash
git add vercel.json
git commit -m "feat(deploy): vercel.json — SPA build + same-origin /v1 + /healthz routing"
```

---

### Task A4: Verify the SPA builds for same-origin

**Files:** none (verification)

- [ ] **Step 1: Build the SPA with an empty API base URL**

Run: `cd library-web && VITE_API_BASE_URL="" npm run build 2>&1 | tail -3`
Expected: clean build to `library-web/dist` (this is exactly what Vercel runs; `VITE_API_BASE_URL=""` → the SPA calls same-origin `/v1/...`).

- [ ] **Step 2: Confirm the bundle has no hard-coded localhost base**

Run: `grep -rc "localhost:8000" library-web/dist/assets/*.js | head -1`
Expected: `0` (the empty base var compiled in; no localhost fallback baked into the production bundle).

---

## Phase B — Supabase (cloud ops, inline)

### Task B1: Create the Supabase project

**Tooling:** Supabase MCP (load via ToolSearch: `select:mcp__claude_ai_Supabase__confirm_cost,mcp__claude_ai_Supabase__create_project,mcp__claude_ai_Supabase__get_project,mcp__claude_ai_Supabase__get_anon_key`).

- [ ] **Step 1: Confirm cost, then create**

Call `confirm_cost` (type `project`, org `zffewhemecrqggrcerny`) — expect $0/month — then `create_project` with:
- `name`: `questionnaire-library`
- `organization_id`: `zffewhemecrqggrcerny`
- `region`: `eu-central-1`
- `confirm_cost_id`: (from confirm_cost)
Capture the returned **project ref** (`<ref>`) and DB password.

- [ ] **Step 2: Wait until ACTIVE_HEALTHY**

Poll `get_project(<ref>)` until `status == "ACTIVE_HEALTHY"` (a new project takes ~1–2 min to provision).

- [ ] **Step 3: Record the two connection strings (NOT committed)**

Build them from the project ref + DB password (keep only in the shell env / Vercel env, never in a file or commit):
- **Direct** (seeding): `postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres`
- **Transaction pooler** (serving): `postgresql://postgres.<ref>:<pw>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

(Confirm the exact pooler host/region string from the Supabase dashboard or `get_project` connection info if it differs.)

---

### Task B2: Seed the Supabase database

**Files:** none (ops). Run locally against the **direct** connection.

- [ ] **Step 1: Migrate the schema**

```bash
source .venv/bin/activate
export DATABASE_URL='postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres'
python -m library.cli migrate 2>&1 | tail -1
```
Expected: `schema applied`.

- [ ] **Step 2: Import + ingest the survey_db content**

```bash
rm -rf /tmp/content
python -m library.cli import-survey-db survey_database/data/survey_db.sqlite --out /tmp/content --release v26.0606 --imported-at 2026-06-06T00:00:00Z >/dev/null 2>&1 && echo imported
python -m library.cli ingest /tmp/content --release v26.0606 2>&1 | tail -1
```
Expected: `imported` then `ingested=1184 skipped=0 errors=0`.

- [ ] **Step 3: Verify the seed**

```bash
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); print('questionnaires:', c.execute(\"SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire' AND status='published'\").fetchone()[0])"
```
Expected: `questionnaires: 64`.

---

## Phase C — Vercel deploy (cloud ops, inline)

### Task C1: Deploy to Vercel with the DB env

**Tooling:** Vercel MCP (load via ToolSearch: `select:mcp__claude_ai_Vercel__deploy_to_vercel,mcp__claude_ai_Vercel__get_deployment,mcp__claude_ai_Vercel__get_deployment_build_logs`) — or the `vercel` CLI if the MCP can't set env/secrets. Team `team_zRFaccDtEvpVZqUEwZERA1DF`.

- [ ] **Step 1: Set the project env var**

On the Vercel project `questionnaire-library`, set env var **`DATABASE_URL`** = the **transaction-pooler** URL (Production), as a secret. (Via the Vercel MCP env API, or `vercel env add DATABASE_URL production`.) Leave `LIBRARY_CORS_ORIGINS` unset (same-origin).

- [ ] **Step 2: Deploy**

Deploy the `mvp-deploy` branch / repo root to Vercel project `questionnaire-library` (Production). Vercel runs the `vercel.json` build (SPA) + bundles the `api/index.py` Python function from `requirements.txt`. If the Python builder doesn't default to 3.12, pin it (Vercel project setting / `"functions": {"api/index.py": {"runtime": "python3.12"}}` if needed). Capture the deployment URL.

- [ ] **Step 3: If the Python function fails to build/boot**

Read `get_deployment_build_logs`. Common fixes: ensure `./library` resolves in the build (repo-root requirements), the Python version is 3.12, the function size is within limits. **If it stays fragile, switch to the fallback** (spec §3.2): keep the SPA on Vercel, deploy the FastAPI on a container host (Render free tier) as a normal process, set `LIBRARY_CORS_ORIGINS` to the Vercel origin, and point the SPA's `VITE_API_BASE_URL` at the API origin (rebuild). Record the deviation.

---

### Task C2: Verify the live deployment end-to-end

**Files:** none (verification). `<url>` = the Vercel deployment URL.

- [ ] **Step 1: Health + API from Supabase**

```bash
curl -s <url>/healthz                                  # -> {"status":"ok"}
curl -s "<url>/v1/questionnaires?limit=1" | python3 -c "import sys,json; print('total groups:', json.load(sys.stdin)['total'])"
curl -s "<url>/v1/questionnaires?instrument=inst_asrs" | python3 -c "import sys,json; g=json.load(sys.stdin)['items'][0]; print('ASRS forms:', g['form_count'])"
```
Expected: `{"status":"ok"}`; a non-zero group total; `ASRS forms: 4` (proves the function is reading the seeded Supabase data).

- [ ] **Step 2: Browser end-to-end**

Open `<url>` in a browser: the catalogue loads; search "ASRS" → one grouped row expands to its forms; open a questionnaire → metadata + items render; click **Download JSON** → a file downloads. Confirm **no CORS errors** in the console (same-origin).

---

## Phase D — Record + finish

### Task D1: Seed doc + live URL, then merge

**Files:**
- Create: `scripts/seed-supabase.md`
- Modify: `HANDOFF.md` (record the live URL — untracked working file)

- [ ] **Step 1: Document the repeatable seed**

`scripts/seed-supabase.md` — the migrate/import/ingest commands from Phase B (with the connection-string placeholder, NOT the real secret), and the re-seed note (`TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE` then re-ingest).

- [ ] **Step 2: Record the live URL**

Add the live Vercel URL + the Supabase project ref to `HANDOFF.md` (the "Current status" / deployment line). Do NOT write the connection string.

- [ ] **Step 3: Commit + merge + push**

```bash
git add scripts/seed-supabase.md api/index.py requirements.txt vercel.json
git status   # confirm NO secrets / .env staged
git commit -m "feat(deploy): seed-supabase runbook + record MVP live deployment" || echo "nothing extra to commit"
git checkout master && git merge --ff-only mvp-deploy
( cd library-web && npm test >/dev/null 2>&1 && echo "frontend green" )
git branch -d mvp-deploy
GIT_TERMINAL_PROMPT=0 git push origin master
```

- [ ] **Step 4: Update the roadmap (Phase 1 shipped)**

In `plan/01_roadmap.md`, flip the Phase-1 gate note from "MVP deployment in progress" to "shipped (live at `<url>`)" and confirm Phase 2 is the active next priority. Commit + push.

---

## Self-review (completed during planning)

**Spec coverage:** §2 same-origin architecture → A1+A3. §3.2 Vercel function packaging → A2+A3+C1. §3.3 SPA client tweak → A1. §3.4 connections (direct seed / pooler serve) → B2 + C1. §4 seeding → B2 + D1. §5 secrets → the secrets rule + B/C/D non-commit checks. §6 verification → C2. §7 risk/fallback → C1 Step 3. Supabase create → B1.

**Placeholder scan:** the `<ref>`/`<pw>`/`<url>` placeholders are runtime values captured during execution (correct for a deploy runbook), not unfilled gaps. The MCP-tool params are concrete (org id, region, team id provided). The container-host fallback is a real branch, not "handle errors."

**Consistency:** project name `questionnaire-library` (Supabase + Vercel) and region `eu-central-1` consistent throughout; `DATABASE_URL` = pooler for serving (C1) vs direct for seeding (B2) consistent with the spec; the `library` package import (`from library.api.app import create_app`) matches `requirements.txt` `./library`.

---

## Notes for execution
- **Execute inline** (executing-plans), not subagent-driven: B–D create real resources, handle the DB secret, and pass state (ref/URLs) between steps. Phase A is ordinary code (could be done first, even by a subagent, but it's small).
- **Re-confirm cost** at create time (`confirm_cost`), per the Supabase MCP guidance.
- **No secrets in git** — verify `git status` before each commit (B/C/D).
- This is the last Phase-1 step; once verified, Phase 1 is shipped and Phase 2 (delegated) is next.
