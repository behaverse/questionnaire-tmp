# Deployment runbook — Vercel + Supabase go-live (and GCP migration path)

> **Who this is for:** the operator (owner) taking the local stack to production.
> Prerequisites: accounts on Vercel, Supabase (free tier is fine), and Resend.
> All shell commands assume the repo root as the working directory.

---

## 0a. Security + production hardening — ✅ DONE + LIVE (2026-07-11)

The 2026-07-10→11 whole-repo review's Phase 0 (critical security) and Phase 1 (production hardening) are
**merged, redeployed, and verified live** across all 5 Vercel projects. State now live:

- Registration is participant-only + enumeration-resistant; VS enforces per-owner authorization
  (`created_by`); `redirect_url` validated; editor `/api/translate` guarded; per-IP auth rate limiting
  (backed by the live `rate_limit_hit` table); admin reads audience-scoped; API docs gated (`ENABLE_DOCS`).
- **Migrations adopted on the live DBs** — `schema_migrations` created + `001_baseline.sql` recorded for
  identity/viewer_service (shared DB) and library; the drift that had left `rate_limit_hit` +
  `replay_revocation` missing is fixed. Future changes = numbered `store/migrations/NNN_*.sql`.
- **Sentry** `SENTRY_DSN` + `SENTRY_ENVIRONMENT=production` set on identity, viewer-service, library
  (dormant in code until the DSN is present).
- **Backups**: `scripts/backup-supabase.sh` (see [docs/backups.md](docs/backups.md)) — schedule it.
- **Uptime + keepalive**: `.github/workflows/uptime-keepalive.yml` (green) pings healthchecks.io + keeps
  the Library DB warm (see [docs/monitoring.md](docs/monitoring.md)); needs the `HC_PING_URL` repo secret.

> Historical note — the original operator actions this section listed (set `DEFAULT_REGISTER_ROLE`,
> backfill `created_by`, adopt the migration baseline, set the Sentry DSN) have all been completed. The
> `created_by` backfill turned out unnecessary (all live deployments already had owners).

The original required-action list follows for reference:

1. **Identity — set `DEFAULT_REGISTER_ROLE=participant`** on the Identity Vercel project, then redeploy
   Identity. Before this, public `/v1/auth/register` granted `researcher` by default (privilege
   escalation). The code default is now `participant`; the live env must not override it back.
   Grant researcher/reviewer to real accounts via `POST /v1/admin/users/{id}/roles` or the
   `identity create-admin` CLI.
2. **Viewer Service — deployment ownership is now enforced.** Researcher routes (`get`, `sessions`,
   `export.csv`, `metrics`, `invites`, `comments`, `recordings`, `runtime`, `replay-link`, `patch`,
   and the scoped `list`) now require the caller to be the deployment's `created_by` (admins override;
   non-owners get 404). **Backfill any legacy rows with a NULL `created_by`** or they become
   admin-only — run once against the shared DB after deploying VS:
   ```sql
   -- set the real owner sub for pre-ownership deployments (they are otherwise admin-only):
   UPDATE deployment SET created_by = '<owner-identity-sub>' WHERE created_by IS NULL;
   ```
   Confirm the owner account holds the `administrator` role (or is the `created_by`) so it retains
   access to its live deployments. Then redeploy VS via `scripts/redeploy-participant-stack.sh vs`.
3. **Editor** — `/api/translate` is now origin-guarded + rate-limited. Optionally set
   `TRANSLATE_SHARED_SECRET` on the editor project to fully lock it (see `editor/.env.example`).
4. **Backups** — stand up `scripts/backup-supabase.sh` on a schedule (see [docs/backups.md](docs/backups.md)).

---

## 0. AS-BUILT (the live deployment, 2026-06-25) — read this first

The participant stack went live on **Vercel + Supabase (free tier, $0)**. The actual
go-live diverged from the original runbook below in a few important ways — those sections
are kept for reference, but **this section is the source of truth**.

**Live URLs**

| Component | Live URL |
|---|---|
| Portal (participant-app) | https://portal-henna-seven-32.vercel.app |
| Player (web-viewer) | https://player-sooty-six.vercel.app |
| Viewer Service | https://viewer-service.vercel.app |
| Identity | https://identity-service-three.vercel.app |
| Library catalogue (+ Try-it) | https://questionnaire-library.vercel.app |

> ⚠ **`web-viewer.vercel.app` is NOT ours** — that alias is squatted by an unrelated app
> ("Vespucci"). Vercel auto-named our player **`player-sooty-six.vercel.app`** because the nice
> name was taken. Always use the auto-generated names above. The **player is launched _with_ a
> questionnaire** (catalogue "Try it", a portal Start link, or an invite `?invite=`); opening its
> bare root shows nothing. "Try it" is live — it opens the player and renders the questionnaire.

**Key divergences from the runbook (and why)**

- **One shared Supabase DB** (`questionnaire-identity`, ref `vknmmbcenrgorexxqhxv`) hosts
  **both** the Identity and Viewer Service tables — the free tier caps an org at 2 active
  projects, and the two services' table names don't collide. (The Library keeps its own.)
  Migrations were applied via the **Supabase MCP** (the sandbox couldn't reach the pooler
  directly). `DATABASE_URL` uses the **session pooler `:5432`**; consider the transaction
  pooler `:6543` for production scale.
- **Backends deploy per-service via the authenticated `vercel` CLI**, not the MCP deploy
  tool. **Identity** deploys straight from `identity-service/`. The **Viewer Service does
  NOT** deploy from `viewer-service/` (Vercel uploads only the project dir + builds from
  `pyproject.toml`, so its sibling packages + `schemas`/scorer are missing) — it deploys
  from a **self-contained assembled dir** (siblings as PEP 508 git deps pinned to the
  master commit + `schemas`/scorer bundled locally + `SCHEMAS_DIR`/`VS_SCORER_DIR` env).
- **Frontends are built locally and deployed as static `dist/`** (their Vite builds
  source-alias sibling dirs that don't upload).
- **Set Vercel env via the API** (`POST /v10/projects/{id}/env?upsert=true`). **Do NOT use
  `printf | vercel env add`** — it silently stored empty values during go-live.
- **The Library build was broken** (uv rejects the bare `./identity-service` path dep —
  pkg name ≠ dir name): every Library deploy ERRORed since Vercel adopted uv, stranding the
  live site on an old build. Fixed in root `requirements.txt` with the PEP 508 named form
  `questionnaire-identity-service @ ./identity-service`. The Library auto-deploys from
  master; its **Try-it** button needs `VITE_PLAYER_BASE_URL` + `VITE_VS_BASE_URL` build env
  (now set).

**Redeploying** — use **`scripts/redeploy-participant-stack.sh`** (encodes the assembled-VS
+ static-frontend mechanics). Push the commit you want first (the VS sibling deps pin to
the current master SHA), then:

```bash
./scripts/redeploy-participant-stack.sh            # all four
./scripts/redeploy-participant-stack.sh vs         # just one of: identity|vs|player|portal
```

**Email (Resend): DONE** — `RESEND_API_KEY` + `SMTP_FROM=no-reply@xcit.org` set on Identity;
domain `xcit.org` verified; register→verify-email proven end-to-end.

**Editor (M2): DONE** — live at `editor-static.vercel.app`, deployed via **`vercel build
--prebuilt`** (siblings present locally; the prebuilt output ships both the SPA **and** the
`/api/translate` Vercel Function). It reads the Library cross-origin, so the editor origin must
be in the Library project's `LIBRARY_CORS_ORIGINS`. **Auto-translate is live** — the function
reads `ANTHROPIC_API_KEY` + `TRANSLATE_MODEL=claude-sonnet-4-6` (project env). Note: the function
files use **`.js`-extension relative imports** (Vercel deploys them as raw Node ESM, trace-mode).
Redeploy with `scripts/redeploy-participant-stack.sh editor`.

---

## 1. Overview

The system is split into six Vercel projects, each deployed from a sub-directory of this mono-repo:

| Project | Sub-directory | Type | Status |
|---|---|---|---|
| **library** | repo root (`vercel.json` + `library-web/`) | Python API + React SPA | exists (questionnaire-library.vercel.app) |
| **identity-service** | `identity-service/` | Python API | new |
| **viewer-service** | `viewer-service/` | Python API | new |
| **web-viewer** (player) | `web-viewer/` | React SPA | new |
| **participant-app** (portal) | `participant-app/` | React SPA | new |
| **editor** | `editor/` | React SPA + serverless translate fn | M2 (later) |

The two-layer pattern is: each Python service exposes a single ASGI entry-point at
`api/index.py`; Vercel's Python runtime picks it up automatically and the `vercel.json`
`rewrites` block routes all traffic into it. Frontend SPAs are static builds; their
`vercel.json` uses a catch-all rewrite so client-side routing works.

The local full stack (Docker) mirrors this exactly: the same Python packages + the same
Nginx-served static builds, just wired together on `localhost` instead of `*.vercel.app`.

---

## 2. Local full stack

### 2.1 Prerequisites

- Docker (with either Compose v1 `docker-compose` or Compose v2 `docker compose`)
- No local Python or Node install required — everything runs inside containers

### 2.2 First-time setup

The compose file injects all required env vars inline. For services that accept optional
secrets (email, Behaverse forwarding) you can override them via a `.env` file at the repo
root — but for local development the defaults work without any configuration:

```bash
# Optional: override secrets for local testing (none of these are required to start)
cp identity-service/.env.example identity-service/.env   # edit RESEND_API_KEY etc.
cp viewer-service/.env.example    viewer-service/.env
cp web-viewer/.env.example        web-viewer/.env
cp participant-app/.env.example   participant-app/.env
```

Then start everything with a single command. Use whichever Compose version is installed:

```bash
# Compose v2 (preferred)
docker compose up --build

# Compose v1
docker-compose up --build
```

The first run takes a few minutes: Postgres starts first (healthcheck), then both Python
services run their database migrations automatically, then Nginx serves the built frontends.

### 2.3 Local URLs

| Service | URL | Notes |
|---|---|---|
| Identity Service | http://localhost:8100 | JWKS at `/.well-known/jwks.json` |
| Viewer Service | http://localhost:8001 | |
| Player (web-viewer) | http://localhost:5173 | |
| Portal (participant-app) | http://localhost:5174 | |
| Library (if run separately) | https://questionnaire-library.vercel.app | already live; not in compose |
| Postgres | localhost:5432 | `postgres`/`postgres`; two DBs: `identity_service`, `viewer_service` |

The compose file creates both databases via `scripts/compose-initdb.sql` on first boot.

### 2.4 Creating a local admin and seeding data

After `docker compose up` completes, create an admin account and a demo deployment:

```bash
# Create admin (runs inside the already-running identity container)
docker compose exec identity python -m identity_service.cli create-admin \
  --email admin@example.com --password changeme123

# Seed the demo deployment (pointing at local services)
IDENTITY_URL=http://localhost:8100 \
VS_URL=http://localhost:8001 \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=changeme123 \
QREF='qst_wellbeing@v26.0601' \
./scripts/seed-demo-deployment.sh
```

---

## 3. Environment variable matrix

### 3.1 How to read this table

- **Local** = values used by `docker compose up` and the service `.env.example` files.
- **Production** = values to set in each Vercel project's "Environment Variables" UI.
- Replace the `<placeholder>` values with your actual credentials.
- Secrets must never be committed to git; set them only in Vercel or a gitignored `.env.local`.

### 3.2 Identity Service

| Variable | Local value | Production value | Notes |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/identity_service` | `<Supabase pooled connection string>` | Supabase → Settings → Database → Connection pooling (transaction mode) |
| `IDENTITY_ISSUER` | `http://localhost:8100` | `https://<identity-vercel-project>.vercel.app` | Must match the URL participants receive tokens from |
| `IDENTITY_CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | `https://<player>.vercel.app,https://<portal>.vercel.app` | **Must include BOTH player and portal origins** |
| `WEB_VIEWER_BASE_URL` | `http://localhost:5173` | `https://<player>.vercel.app` | Used in verification and password-reset email links |
| `RESEND_API_KEY` | _(empty — links logged to console)_ | `re_<your Resend key>` | See section 7 |
| `SMTP_FROM` | `no-reply@behaverse.org` | `no-reply@behaverse.org` | Sender address for all transactional email |
| `SMTP_HOST` | _(unset)_ | _(unset unless not using Resend)_ | SMTP alternative; only used when `RESEND_API_KEY` is unset |
| `SMTP_PORT` | _(unset)_ | _(unset unless not using Resend)_ | Default 587 |
| `SMTP_USERNAME` | _(unset)_ | _(unset unless not using Resend)_ | |
| `SMTP_PASSWORD` | _(unset)_ | _(unset unless not using Resend)_ | |
| `CRON_SECRET` | `dev-cron-secret` | `<random 32+ char secret>` | Vercel sends `Authorization: Bearer $CRON_SECRET` to `/internal/reap` |

### 3.3 Viewer Service

| Variable | Local value | Production value | Notes |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/viewer_service` | `<Supabase pooled connection string>` | Separate Supabase project from Identity |
| `LIBRARY_BASE_URL` | `https://questionnaire-library.vercel.app` | `https://questionnaire-library.vercel.app` | The already-live Library; same in both environments |
| `VS_CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | `https://<player>.vercel.app,https://<portal>.vercel.app` | **Must include BOTH player and portal origins** |
| `IDENTITY_JWKS_URL` | `http://localhost:8100/.well-known/jwks.json` | `https://<identity-vercel-project>.vercel.app/.well-known/jwks.json` | VS fetches this to verify participant/researcher JWTs |
| `IDENTITY_ISSUER` | `http://localhost:8100` | `https://<identity-vercel-project>.vercel.app` | Must match the `iss` claim in tokens |
| `IDENTITY_AUDIENCE` | `questionnaire-apps` | `questionnaire-apps` | Must match the `aud` claim; default is fine |
| `INVITE_SIGNING_SECRET` | `dev-invite-secret` | `<random 32+ char secret>` | Signs invite-link tokens; rotate with care |
| `REPLAY_SIGNING_SECRET` | _(unset)_ | _(optional; `<random 32+ char secret>`)_ | Signs researcher **replay-link** tokens; falls back to `INVITE_SIGNING_SECRET` when unset. Rotating it invalidates all outstanding replay links |
| `WEB_VIEWER_BASE_URL` | `http://localhost:5173` | `https://<player>.vercel.app` | Player origin — the Viewer Service builds the `replay_url` (and the `/studies` "Watch live" link) from it; when unset, a minted replay link returns `bundle_url` only |
| `REPLAY_LINK_TTL_SECONDS` | _(unset → 7 days)_ | _(optional)_ | Lifetime of a minted replay link |
| `SCHEMAS_DIR` | `./schemas` | _(set by `vercel.json` includeFiles; default is fine)_ | Path to the bundled schemas directory |
| `VS_SCORER_DIR` | `./questionnaire-scorer/dist-wasm` | _(set by `vercel.json` includeFiles; default is fine)_ | Path to bundled scorer wasm files |
| `BEHAVERSE_BASE_URL` | `http://localhost:9000` | _(unset unless Behaverse forwarding is active)_ | Forwarding is disabled when this is a localhost URL |
| `CRON_SECRET` | `dev-cron-secret` | `<same or different 32+ char secret>` | Vercel sends this to `/internal/forward` daily (03:00 UTC); that tick drains the outbox fully **and** reaps dead rows |
| `VS_PUBLIC_BASE` | _(unset)_ | `https://<viewer-service-vercel-project>.vercel.app` | Optional; used to build absolute invite/preview links |

### 3.4 Player (web-viewer) — Vite build-time vars

These are baked in at build time (`npm run build`). Set them as Environment Variables in the
Vercel project before deploying (Vercel passes them as build-time args).

| Variable | Local value | Production value |
|---|---|---|
| `VITE_VS_BASE_URL` | `http://localhost:8001` | `https://<viewer-service-vercel-project>.vercel.app` |
| `VITE_IDENTITY_BASE_URL` | `http://localhost:8100` | `https://<identity-vercel-project>.vercel.app` |

### 3.5 Portal (participant-app) — Vite build-time vars

| Variable | Local value | Production value |
|---|---|---|
| `VITE_VS_BASE_URL` | `http://localhost:8001` | `https://<viewer-service-vercel-project>.vercel.app` |
| `VITE_IDENTITY_BASE_URL` | `http://localhost:8100` | `https://<identity-vercel-project>.vercel.app` |
| `VITE_PLAYER_BASE_URL` | `http://localhost:5173` | `https://<player-vercel-project>.vercel.app` |

### 3.6 Library web (library-web) — Vite build-time vars

| Variable | Local value | Production value |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | _(unset; defaults to the same origin — the Library Vercel project hosts both API and SPA)_ |

### 3.7 Editor (M2 — skip for Phase 1 go-live)

| Variable | Local value | Production value | Notes |
|---|---|---|---|
| `VITE_LIBRARY_BASE_URL` | _(unset; defaults to questionnaire-library.vercel.app)_ | _(unset; default is fine)_ | |
| `ANTHROPIC_API_KEY` | _(empty)_ | `<your Anthropic API key>` | Enables auto-translate; set as a server-side Vercel env var (never exposed to the browser) |
| `AI_GATEWAY_API_KEY` | _(empty)_ | `<Vercel AI Gateway key>` | Alternative to direct Anthropic; only one key is needed |

---

## 4. Supabase provisioning

Create one Supabase project per backend service. The Library already has its own project.
Identity and Viewer Service each need a fresh one.

### 4.1 Create projects

1. Go to https://supabase.com → New project.
2. Choose the `eu-central-1` region (or nearest to your users).
3. Name them `questionnaire-identity` and `questionnaire-viewer-service` (or similar).
4. Note the **pooled** connection string for each: Settings → Database → Connection string →
   select **Transaction mode** (pgBouncer port 6543). This is your `DATABASE_URL`.

### 4.2 Run migrations

Activate a Python virtual environment that has the service packages installed, then:

```bash
# Identity Service
DATABASE_URL="<identity Supabase pooled connection string>" \
  python -m identity_service.cli migrate

# Viewer Service (must have questionnaire-runtime-denormaliser + identity-service installed too)
DATABASE_URL="<viewer-service Supabase pooled connection string>" \
  python -m viewer_service.cli migrate
```

Both CLIs are idempotent — safe to run again after updates.

**Migration system (2026-07-11).** Each service applies **numbered `.sql` files** in
`store/migrations/` (`001_baseline.sql`, `002_*.sql`, …) and records each applied file in a
`schema_migrations` table, so every file runs **exactly once** against a known state. `migrate` runs
only the pending ones.

- **Adopting the baseline on the existing live DBs:** `001_baseline.sql` is the prior schema, all
  `IF NOT EXISTS`, so running `migrate` on a database that already has the tables is a **no-op that
  just records `001_baseline.sql`**. Run it once per live DB (identity+VS shared DB, and the library
  DB) after deploying this change.
- **Adding a schema change:** drop a new `NNN_description.sql` (next number) into the service's
  `store/migrations/`. Unlike the old re-applied `schema.sql`, a migration **can alter existing
  columns/constraints** (it runs once). Never edit an already-applied migration — add a new one.
- **Do NOT `DROP SCHEMA`** to force a change anymore — that destroys non-re-seedable data (responses,
  users, comments). Use a migration.

### 4.3 Generate signing keys and create the admin account

```bash
# Generate the EdDSA signing key (rotates any existing key out)
DATABASE_URL="<identity Supabase pooled connection string>" \
  python -m identity_service.cli generate-key --retire-others

# Create the first administrator account
DATABASE_URL="<identity Supabase pooled connection string>" \
  python -m identity_service.cli create-admin \
    --email admin@your-domain.com \
    --password "<strong password>"
```

Keep the admin password in a secrets manager. The `generate-key` step must be run before
any token issuance — it writes the EdDSA key pair that all services use to verify JWTs.

---

## 5. Vercel project setup

### 5.1 One-time: connect the repo

In the Vercel dashboard, import the `questionnaire_apps` GitHub repo once. Each service is
then deployed as a separate Vercel project within the same repo, distinguished by its
**Root Directory** setting.

### 5.2 Per-project setup (repeat for each service below)

1. New Project → select the repo → set **Root Directory** to the service folder (see table).
2. Vercel detects the framework from `vercel.json`: `"framework": null` → Python serverless;
   no explicit framework → static/Node. Leave Framework Preset on **Other**.
3. Add all environment variables from section 3 for that service.
4. Deploy to a **Preview** branch first (see validation spike in §5.4).
5. Promote to Production once validation passes.

### 5.3 Root Directory mapping

| Project | Root Directory |
|---|---|
| library | _(repo root — `vercel.json` is at root)_ |
| identity-service | `identity-service` |
| viewer-service | `viewer-service` |
| player (web-viewer) | `web-viewer` |
| portal (participant-app) | `participant-app` |
| editor (M2) | `editor` |

The Python services expose `api/index.py` within their sub-directory. Vercel auto-detects
this file and routes all rewrites (defined in each `vercel.json`) through it.

### 5.4 Validation spike — preview deploy before production

**Before promoting any Python service to Production, validate on a Preview URL:**

**Identity Service preview checks:**
- `GET https://<preview>.vercel.app/healthz` → `{"status":"ok"}`
- `GET https://<preview>.vercel.app/.well-known/jwks.json` → JSON with `keys` array
- `POST https://<preview>.vercel.app/v1/auth/login` with the admin credentials → 200 + `access_token`
- Confirm Argon2id cold-start completes within Vercel's function timeout (default 10s).
  If the first request after a cold start times out, increase the function timeout in
  `vercel.json` under `functions.api/index.py.maxDuration`.
- `GET https://<preview>.vercel.app/internal/reap` with `Authorization: Bearer <CRON_SECRET>` → 200

**Viewer Service preview checks:**
- `GET https://<preview>.vercel.app/healthz` → `{"status":"ok"}`
- `GET https://<preview>.vercel.app/v1/preview/runtime?questionnaire_ref=qst_wellbeing@v26.0601`
  → a Schema 3 runtime JSON (confirms sibling `schemas/` + scorer wasm bundled correctly via
  `includeFiles`). **This is the critical check** — if it 404s or errors, the `includeFiles`
  glob in `viewer-service/vercel.json` did not pick up the sibling directories. Investigate
  before promoting to production.

The Viewer Service `vercel.json` uses:
```json
"functions": {
  "api/index.py": {
    "includeFiles": "../{schemas,questionnaire-scorer/dist-wasm}/**"
  }
}
```
This glob is relative to the Root Directory (`viewer-service/`), so it resolves to the
sibling `schemas/` and `questionnaire-scorer/dist-wasm/` directories at the repo root.
Verify this bundling works on every deploy that changes those directories.

**Player and Portal sibling-directory build check:**
Both the player (`web-viewer/`) and portal (`participant-app/`) Vite builds reach outside their
Root Directory into sibling directories:
- Portal references `../participant-session/src` via the `@behaverse/participant-session` alias.
- Player additionally references `../questionnaire-expression-evaluator` (wasm artifacts) and
  `../questionnaire-scorer` (scorer wasm).

These sibling-directory references work in Docker and locally but are **unverified on Vercel**
until a preview deploy succeeds. Add to the preview-deploy validation checklist: confirm that
the player and portal preview builds complete without errors, and that the runner renders a
questionnaire end-to-end. If a build fails with a "cannot find module" or "ENOENT" error
pointing into a sibling directory, the Root Directory isolation on Vercel may be stripping that
directory — contact Vercel support or restructure the build (e.g. move the shared code inside
the Root Directory).

### 5.5 WASM artifacts — no Rust required at build time

The frontend wasm artifacts are **committed to git**:
- `questionnaire-scorer/dist-wasm/phq9.wasm` — PHQ-9 scorer
- `questionnaire-expression-evaluator/web/pkg-web/*` — expression evaluator

The player's Vercel build (`npm run build` inside `web-viewer/`) consumes these committed
artifacts directly. **No Rust toolchain or `wasm-pack` is needed on the Vercel build worker.**

If you ever need to regenerate the wasm (e.g. after changing the scorer or evaluator Rust
source), you must have Rust + wasm-pack installed locally, run the respective build command,
and **re-commit the output artifacts** before deploying. The player's Dockerfile contains a
guard that fails the build loudly if the evaluator wasm is missing from the build context —
the same principle applies to the Vercel build.

---

## 6. Cron jobs

Both Python services declare cron jobs in their `vercel.json`:

| Service | Path | Schedule | Purpose |
|---|---|---|---|
| identity-service | `/internal/reap` | `0 4 * * *` (04:00 UTC daily) | Reap expired tokens + rate-limit hits (TTL cleanup) |
| viewer-service | `/internal/forward` | `0 3 * * *` (03:00 UTC daily) | Drain the outbox → Behaverse (batches until empty) **and** reap moot revocations + aged ephemeral sessions. Reap is also separately callable at `/internal/reap`. One cron to stay within the Vercel Hobby per-account cron cap. |

Vercel reads the `crons` array automatically and triggers each path on schedule. It sends the
request with `Authorization: Bearer <CRON_SECRET>` where `CRON_SECRET` is the value set in
the project's environment variables.

**Action required:** set `CRON_SECRET` in each backend Vercel project's environment. Use a
different random value for each project. A 32-character random hex string is sufficient:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

The cron guard in both services is fail-closed: if `CRON_SECRET` is unset, the endpoint
returns 401 on every request (no accidental public exposure).

---

## 7. Email (Resend)

Identity uses email for address verification after registration and for password-reset links.
The mailer is selected at startup by precedence:

1. **Resend** — if `RESEND_API_KEY` is set (recommended for production)
2. **SMTP** — if `SMTP_HOST` is set (and `RESEND_API_KEY` is unset)
3. **Console** — fallback: links are printed to the service log (useful for local dev)

### 7.1 Setup (Resend)

1. Create an account at https://resend.com.
2. Go to API Keys → Create API key. Copy the key (shown only once).
3. Set `RESEND_API_KEY=re_<your key>` in the Identity Service Vercel project.
4. Set `SMTP_FROM=no-reply@behaverse.org` (or whichever sender address you want).
5. **Start with Resend's sandbox sender** (`onboarding@resend.dev`) during the smoke test —
   real sends work immediately without DNS setup. Switch to a custom domain sender as a
   follow-up once the go-live is confirmed working.

### 7.2 Custom domain (follow-up)

To send from `no-reply@behaverse.org`:
1. Resend → Domains → Add Domain → enter `behaverse.org`.
2. Add the SPF, DKIM, and DMARC DNS records to your DNS provider.
3. Wait for verification (usually under 30 minutes).
4. Update `SMTP_FROM` to `no-reply@behaverse.org` and redeploy Identity.

### 7.3 SMTP alternative

If not using Resend, set these variables on the Identity project instead:

```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=no-reply@behaverse.org
```

Leave `RESEND_API_KEY` unset. The mailer falls back to SMTP automatically.

---

## 8. Seed a demo deployment

After the services are deployed and the admin account exists, run the seed script to create
one listed demo deployment so the participant portal's catalogue is non-empty:

```bash
IDENTITY_URL=https://<identity-vercel-project>.vercel.app \
VS_URL=https://<viewer-service-vercel-project>.vercel.app \
ADMIN_EMAIL=admin@your-domain.com \
ADMIN_PASSWORD="<your admin password>" \
QREF='qst_wellbeing@v26.0601' \
./scripts/seed-demo-deployment.sh
```

The script logs in as the admin, obtains an access token, and creates one `anonymous_link`
deployment for the wellbeing questionnaire with `listed: true`. The portal catalogue will
show it immediately — no further action required.

To seed additional questionnaires, re-run the script with a different `QREF`. The
`questionnaire_ref` must match a questionnaire that is importable from the Library; confirm
available refs via `GET <library>/v1/questionnaires`.

---

## 9. Smoke test (production)

Run this end-to-end journey using a **browser** (not curl), so CORS is exercised against the
real origins:

1. Open the portal URL (`https://<portal>.vercel.app`).
2. Click **Register** — fill in email and a strong password. Submit.
3. Check your email inbox for the verification link. Click it.
4. Log in with your email and password.
5. The catalogue should show the "Wellbeing check-in" demo questionnaire.
6. Click **Start** — the player opens (`https://<player>.vercel.app`).
7. Complete all questions and click **Done**.
8. Navigate to **My data** in the portal. The completed session should appear.
9. Download the CSV. Verify it contains a row for the session.

**CORS verification:** open the browser DevTools → Network tab. Filter by the identity and
viewer-service domains. All API calls should return `200` (or `201`/`202`) with an
`Access-Control-Allow-Origin` response header matching the player or portal origin. Any
`CORS error` in the console means one or both of `IDENTITY_CORS_ORIGINS` / `VS_CORS_ORIGINS`
is missing the relevant origin — update the env var and redeploy.

**Do not use curl for the smoke test.** Curl bypasses CORS pre-flight checks. The browser is
the source of truth for whether the cross-origin policy is correctly configured.

Once all nine steps pass, promote any Preview deployments to Production in the Vercel
dashboard.

---

## 10. Future: Google Cloud migration path

When moving off Vercel to Google Cloud, the same code runs without modification — the
`api/index.py` and `vercel.json` files become unused artifacts.

### 10.1 Container workloads → Cloud Run

Each service has a `Dockerfile` at its sub-directory (Identity, Viewer Service) or uses a
multi-stage build from the repo root (Player, Portal). Build and push each image:

```bash
# Example: Identity Service
docker build -t gcr.io/<project>/identity-service ./identity-service
docker push gcr.io/<project>/identity-service
# Then deploy to Cloud Run with the same env vars from section 3
```

The Viewer Service `Dockerfile` is built from the **repo root** context (it imports sibling
packages at build time):
```bash
docker build -f viewer-service/Dockerfile -t gcr.io/<project>/viewer-service .
```

Deploy each image as a Cloud Run service. Set all environment variables from section 3 via
Cloud Run's `--set-env-vars` flag or Secret Manager references. The services are stateless
and scale to zero automatically.

### 10.2 Database → Cloud SQL

Replace each `DATABASE_URL` with a Cloud SQL PostgreSQL connection string (use the Cloud SQL
Auth Proxy for secure connectivity from Cloud Run). Run the same migration CLI commands
against the new URL:

```bash
DATABASE_URL="postgresql://user:pass@/<db>?host=/cloudsql/<instance>" \
  python -m identity_service.cli migrate
```

Supabase is retained until Cloud SQL is validated; switch by changing `DATABASE_URL`.

### 10.3 Cron → Cloud Scheduler

Replace Vercel Cron with Cloud Scheduler HTTP jobs that hit the same internal endpoints:

| Cloud Scheduler job | URL | Schedule | Header |
|---|---|---|---|
| identity-reap | `https://<identity-cloudrun-url>/internal/reap` | `0 4 * * *` | `Authorization: Bearer <CRON_SECRET>` |
| vs-forward | `https://<vs-cloudrun-url>/internal/forward` | `0 3 * * *` | `Authorization: Bearer <CRON_SECRET>` (drains outbox + reaps) |

Use an OIDC service account token for Cloud Scheduler → Cloud Run authentication (add it as
a second `Authorization` header is not possible — instead, protect the internal endpoints with
both the `CRON_SECRET` bearer check and Cloud Run's built-in IAM; or use a Cloud Run
Invoker service account for the scheduler and keep the `CRON_SECRET` check as belt-and-
suspenders).

### 10.4 Frontends → Cloud Run static or GCS + CDN

The player and portal build to static files (`dist/`). Options:
- Run the Nginx-based Docker images (already present in their `Dockerfile`s) on Cloud Run.
- Copy `dist/` to a Cloud Storage bucket and serve via a Load Balancer + Cloud CDN.

Either approach works. The Nginx images are simpler if you want parity with the Docker
compose local stack.

### 10.5 Editor → Vercel (recommended to leave on Vercel)

The editor uses a Vercel Serverless Function (`api/translate.ts`) for auto-translation. This
function has no Docker equivalent in the repo. Unless auto-translate is needed in the GCP
environment, leave the editor on Vercel indefinitely.
