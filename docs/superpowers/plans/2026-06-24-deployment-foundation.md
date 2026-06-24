# Deployment Foundation + Participant Stack (M1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the already-built participant stack (Identity + Viewer Service + player + portal) deployable to Vercel + Supabase and runnable as a whole system with one `docker compose up`, with accounts/email wired and a documented Google-Cloud path.

**Architecture:** Each service keeps its portable core (standard FastAPI app / Vite SPA) and gains a thin platform adapter (`api/index.py` + `vercel.json`) plus a `Dockerfile`. Config is 12-factor (everything via env). Background workers (forwarder, reaper) become `CRON_SECRET`-guarded HTTP endpoints triggered by Vercel Cron. A top-level `docker-compose.yml` brings the full stack up locally; a `DEPLOYMENT.md` runbook drives the cloud go-live.

**Tech Stack:** Python 3.12 / FastAPI / psycopg3 / Uvicorn (backends), React 19 / Vite 6 (frontends), Docker + docker-compose, Vercel (serverless functions + static + Cron), Supabase Postgres, Resend (email).

## Global Constraints

- **No new product features.** Cron-trigger endpoints and `ResendMailer` are deployment plumbing / completing the built email slice — not new features.
- **No business-logic changes** to forwarding/reaping/auth — only triggers and wiring.
- **12-factor:** every new setting is read from an environment variable with a safe default; nothing host-specific is hardcoded.
- **Fail-closed cron guard:** when `CRON_SECRET` is unset, the internal endpoints return 401 (never run unguarded).
- **Preserve no-enumeration** in Identity email flows (request-password-reset stays 202-always; mailer failure there is swallowed+logged).
- **Mailer precedence:** Resend (if `RESEND_API_KEY`) → SMTP (if `SMTP_HOST`) → Console.
- **Importable package names:** `identity_service`, `viewer_service`, `library`. App factories: `identity_service.api.app:create_app`, `viewer_service.api.app:create_app`.
- **Frontend env var names (exact):** `VITE_VS_BASE_URL`, `VITE_IDENTITY_BASE_URL`, `VITE_PLAYER_BASE_URL`.
- **Ports:** Identity 8100, Library 8000, Viewer Service 8001, player 5173, portal 5174.
- **Run tests from each service dir** (separate venvs/test DBs): identity-service and viewer-service have their own `tests/conftest.py` with a `client` TestClient fixture and a session Postgres (`pg_url`). Do NOT run library + viewer-service suites in one pytest invocation.
- **Commit** after every task with a conventional-commit message.

---

### Task 1: Resend mailer + Identity config fields

**Files:**
- Modify: `identity-service/src/identity_service/mailer.py`
- Modify: `identity-service/src/identity_service/config.py`
- Test: `identity-service/tests/test_mailer.py` (create)

**Interfaces:**
- Consumes: `Settings` (frozen dataclass) from `identity_service.config`.
- Produces: `ResendMailer(api_key: str, sender: str)` with `.send(to, subject, body)`; `make_mailer(settings)` now returns `ResendMailer` when `settings.resend_api_key` is set. New `Settings.resend_api_key: str | None` and `Settings.cron_secret: str | None`.

- [ ] **Step 1: Write the failing test**

```python
# identity-service/tests/test_mailer.py
import httpx
from identity_service.config import Settings
from identity_service.mailer import make_mailer, ResendMailer, SmtpMailer, ConsoleMailer


def _settings(**kw):
    base = dict(database_url="postgresql://localhost/x", issuer="http://localhost:8100")
    base.update(kw)
    return Settings(**base)


def test_make_mailer_prefers_resend_then_smtp_then_console():
    assert isinstance(make_mailer(_settings(resend_api_key="re_123")), ResendMailer)
    assert isinstance(make_mailer(_settings(smtp_host="smtp.x")), SmtpMailer)
    assert isinstance(make_mailer(_settings()), ConsoleMailer)


def test_resend_mailer_posts_to_resend_api(monkeypatch):
    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured.update(url=url, headers=headers, json=json)

        class _R:
            def raise_for_status(self):
                return None
        return _R()

    monkeypatch.setattr(httpx, "post", fake_post)
    ResendMailer("re_secret", "no-reply@behaverse.org").send(
        "p@example.com", "Verify", "click https://app/verify?token=abc")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer re_secret"
    assert captured["json"]["from"] == "no-reply@behaverse.org"
    assert captured["json"]["to"] == ["p@example.com"]
    assert captured["json"]["subject"] == "Verify"
    assert "verify?token=abc" in captured["json"]["text"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_mailer.py -v`
Expected: FAIL with `ImportError: cannot import name 'ResendMailer'` (and `Settings` has no `resend_api_key`).

- [ ] **Step 3: Add the config fields**

In `identity-service/src/identity_service/config.py`, add two fields to the `Settings` dataclass (after `smtp_from`):

```python
    resend_api_key: str | None = None
    cron_secret: str | None = None
```

And in `get_settings()` (inside the `Settings(...)` call, after `smtp_from=...`):

```python
        resend_api_key=os.environ.get("RESEND_API_KEY") or None,
        cron_secret=os.environ.get("CRON_SECRET") or None,
```

- [ ] **Step 4: Implement `ResendMailer` and update `make_mailer`**

In `identity-service/src/identity_service/mailer.py`, add (after `SmtpMailer`):

```python
class ResendMailer:
    """Sends via the Resend transactional-email API (https://resend.com)."""

    def __init__(self, api_key: str, sender: str) -> None:
        self._api_key, self._sender = api_key, sender

    def send(self, to: str, subject: str, body: str) -> None:
        import httpx
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"from": self._sender, "to": [to], "subject": subject, "text": body},
            timeout=10.0,
        )
        resp.raise_for_status()
```

Replace the body of `make_mailer`:

```python
def make_mailer(settings: Settings) -> Mailer:
    if settings.resend_api_key:
        return ResendMailer(settings.resend_api_key, settings.smtp_from)
    if settings.smtp_host:
        return SmtpMailer(settings.smtp_host, settings.smtp_port, settings.smtp_username,
                          settings.smtp_password, settings.smtp_from)
    return ConsoleMailer()
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd identity-service && python -m pytest tests/test_mailer.py -v`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/mailer.py identity-service/src/identity_service/config.py identity-service/tests/test_mailer.py
git commit -m "feat(identity): ResendMailer + resend/cron config (deploy email)"
```

---

### Task 2: Identity reaper cron endpoint

**Files:**
- Create: `identity-service/src/identity_service/api/internal.py`
- Modify: `identity-service/src/identity_service/api/app.py:19-22` (router registration)
- Test: `identity-service/tests/test_internal.py` (create)

**Interfaces:**
- Consumes: `get_conn` from `identity_service.api.deps`; `reap_expired(conn, *, grace_seconds)` from `identity_service.service.maintenance`; `Settings.cron_secret` (Task 1).
- Produces: `GET /internal/reap` → `{"reaped": {"handoff_codes": int, "email_tokens": int, "refresh_tokens": int}}`; `_require_cron` guard dependency.

- [ ] **Step 1: Write the failing test**

```python
# identity-service/tests/test_internal.py
def test_reap_requires_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    # wrong secret
    r = client.get("/internal/reap", headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_reap_runs_with_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/reap", headers={"Authorization": "Bearer topsecret"})
    assert r.status_code == 200
    body = r.json()["reaped"]
    assert set(body) == {"handoff_codes", "email_tokens", "refresh_tokens"}


def test_reap_fails_closed_when_secret_unset(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    r = client.get("/internal/reap", headers={"Authorization": "Bearer anything"})
    assert r.status_code == 401
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_internal.py -v`
Expected: FAIL (404 — route not registered).

- [ ] **Step 3: Create the internal router**

```python
# identity-service/src/identity_service/api/internal.py
from fastapi import APIRouter, Depends, Header, HTTPException
from .deps import get_conn
from ..config import get_settings
from ..service import maintenance

router = APIRouter()


def _require_cron(authorization: str | None = Header(default=None)):
    """Fail-closed: rejects unless Authorization is exactly `Bearer <CRON_SECRET>` and the
    secret is configured. Matches Vercel Cron's `Authorization: Bearer ${CRON_SECRET}`."""
    secret = get_settings().cron_secret
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="unauthorized")


@router.get("/internal/reap")
def reap(_=Depends(_require_cron), conn=Depends(get_conn)):
    counts = maintenance.reap_expired(conn, grace_seconds=0)
    conn.commit()
    return {"reaped": counts}
```

- [ ] **Step 4: Register the router**

In `identity-service/src/identity_service/api/app.py`, update the import + registration block (currently lines ~19-22):

```python
    from . import auth as auth_routes, wellknown, admin as admin_routes, internal
    app.include_router(auth_routes.router)
    app.include_router(wellknown.router)
    app.include_router(admin_routes.router)
    app.include_router(internal.router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd identity-service && python -m pytest tests/test_internal.py -v`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/api/internal.py identity-service/src/identity_service/api/app.py identity-service/tests/test_internal.py
git commit -m "feat(identity): cron-guarded GET /internal/reap (serverless reaper trigger)"
```

---

### Task 3: Viewer Service forwarder cron endpoint

**Files:**
- Create: `viewer-service/src/viewer_service/api/internal.py`
- Modify: `viewer-service/src/viewer_service/api/app.py` (router registration + config field)
- Modify: `viewer-service/src/viewer_service/config.py` (add `cron_secret`)
- Test: `viewer-service/tests/test_internal.py` (create)

**Interfaces:**
- Consumes: `process_outbox_batch(conn, sink, *, batch_size, max_attempts)` from `viewer_service.forwarding`; `HTTPBehaverseSink` from `viewer_service.sinks`; `get_settings()`; new `Settings.cron_secret`.
- Produces: `GET /internal/forward` → `{"forwarded": <summary dict>}`; `_require_cron` guard.

- [ ] **Step 1: Add the config field**

In `viewer-service/src/viewer_service/config.py`, add to the `Settings` dataclass (after `public_base_url`):

```python
    cron_secret: str | None = None
```

And in `get_settings()` (inside the `Settings(...)` call, after `public_base_url=...`):

```python
        cron_secret=os.environ.get("CRON_SECRET") or None,
```

- [ ] **Step 2: Write the failing test**

```python
# viewer-service/tests/test_internal.py
def test_forward_requires_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/forward", headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_forward_runs_with_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/forward", headers={"Authorization": "Bearer topsecret"})
    assert r.status_code == 200
    assert "forwarded" in r.json()


def test_forward_fails_closed_when_secret_unset(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    r = client.get("/internal/forward", headers={"Authorization": "Bearer anything"})
    assert r.status_code == 401
```

Note: the VS `client` fixture injects a default researcher `Authorization` header; passing an explicit `Authorization` per request overrides it, so the guard sees the cron bearer (or a wrong one), not the researcher token.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd viewer-service && python -m pytest tests/test_internal.py -v`
Expected: FAIL (404 — route not registered).

- [ ] **Step 4: Create the internal router**

```python
# viewer-service/src/viewer_service/api/internal.py
import psycopg
from fastapi import APIRouter, Depends, Header, HTTPException
from ..config import get_settings
from ..forwarding import process_outbox_batch
from ..sinks import HTTPBehaverseSink

router = APIRouter()


def _require_cron(authorization: str | None = Header(default=None)):
    """Fail-closed cron guard. Matches Vercel Cron's `Authorization: Bearer ${CRON_SECRET}`."""
    secret = get_settings().cron_secret
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="unauthorized")


@router.get("/internal/forward")
def forward(_=Depends(_require_cron)):
    s = get_settings()
    sink = HTTPBehaverseSink(s.behaverse_base_url, s.behaverse_bearer_token)
    with psycopg.connect(s.database_url) as conn:          # context commits on success
        summary = process_outbox_batch(conn, sink, batch_size=s.forward_batch_size,
                                       max_attempts=s.forward_max_attempts)
    return {"forwarded": summary}
```

- [ ] **Step 5: Register the router**

In `viewer-service/src/viewer_service/api/app.py`, add `internal` to the import line inside `create_app()` and register it WITHOUT the `/v1` prefix (internal paths live at `/internal/*`):

```python
    from . import internal
    app.include_router(internal.router)
```

Add these two lines just before `@app.get("/healthz")`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd viewer-service && python -m pytest tests/test_internal.py -v`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/api/internal.py viewer-service/src/viewer_service/api/app.py viewer-service/src/viewer_service/config.py viewer-service/tests/test_internal.py
git commit -m "feat(viewer-service): cron-guarded GET /internal/forward (serverless forwarder trigger)"
```

---

### Task 4: Identity Vercel adapter + config

**Files:**
- Create: `identity-service/api/index.py`
- Create: `identity-service/requirements.txt`
- Create: `identity-service/vercel.json`
- Test: `identity-service/tests/test_vercel_entry.py` (create)

**Interfaces:**
- Consumes: `identity_service.api.app:create_app`.
- Produces: a module `api/index.py` exposing `app` (ASGI) for Vercel's Python runtime.

- [ ] **Step 1: Write the failing test**

```python
# identity-service/tests/test_vercel_entry.py
def test_vercel_entry_exposes_healthz():
    import importlib.util, pathlib
    from fastapi.testclient import TestClient
    path = pathlib.Path(__file__).resolve().parents[1] / "api" / "index.py"
    spec = importlib.util.spec_from_file_location("vercel_entry", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert TestClient(mod.app).get("/healthz").status_code == 200
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_vercel_entry.py -v`
Expected: FAIL (`api/index.py` does not exist).

- [ ] **Step 3: Create the adapter**

```python
# identity-service/api/index.py
"""Vercel serverless entrypoint: the Identity Service FastAPI app (auth + JWKS + reaper cron)."""
from identity_service.api.app import create_app

app = create_app()
```

- [ ] **Step 4: Create `requirements.txt`** (Vercel installs this from the project root = `identity-service/`)

```
.
```

- [ ] **Step 5: Create `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "rewrites": [
    { "source": "/v1/:path*", "destination": "/api/index" },
    { "source": "/.well-known/:path*", "destination": "/api/index" },
    { "source": "/internal/:path*", "destination": "/api/index" },
    { "source": "/healthz", "destination": "/api/index" }
  ],
  "crons": [
    { "path": "/internal/reap", "schedule": "0 4 * * *" }
  ]
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd identity-service && python -m pytest tests/test_vercel_entry.py -v`
Expected: PASS.

Also validate the JSON: `python -c "import json; json.load(open('vercel.json'))"` → no output (valid).

- [ ] **Step 7: Commit**

```bash
git add identity-service/api/index.py identity-service/requirements.txt identity-service/vercel.json identity-service/tests/test_vercel_entry.py
git commit -m "feat(identity): Vercel adapter (api/index.py + vercel.json + daily reap cron)"
```

---

### Task 5: Viewer Service Vercel adapter + config (with sibling bundling)

**Files:**
- Create: `viewer-service/api/index.py`
- Create: `viewer-service/requirements.txt`
- Create: `viewer-service/vercel.json`
- Test: `viewer-service/tests/test_vercel_entry.py` (create)

**Interfaces:**
- Consumes: `viewer_service.api.app:create_app`.
- Produces: a module `api/index.py` exposing `app`. The function bundle must include the sibling `schemas/` and scorer wasm and install the sibling denormaliser.

**Background:** VS imports `questionnaire-runtime-denormaliser` and reads `schemas/` + the scorer wasm, all of which live in sibling directories outside `viewer-service/`. On Vercel the project root is `viewer-service/`, so these must be (a) installed via `requirements.txt` relative path and (b) bundled via `functions.includeFiles`, with `SCHEMAS_DIR` / `VS_SCORER_DIR` env pointing at the bundled copies. This bundling is the one part that must be confirmed in a Vercel preview during go-live (see `DEPLOYMENT.md`); locally (docker-compose) it is exercised directly.

- [ ] **Step 1: Write the failing test**

```python
# viewer-service/tests/test_vercel_entry.py
def test_vercel_entry_exposes_healthz():
    import importlib.util, pathlib
    from fastapi.testclient import TestClient
    path = pathlib.Path(__file__).resolve().parents[1] / "api" / "index.py"
    spec = importlib.util.spec_from_file_location("vs_vercel_entry", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert TestClient(mod.app).get("/healthz").status_code == 200
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && python -m pytest tests/test_vercel_entry.py -v`
Expected: FAIL (`api/index.py` does not exist).

- [ ] **Step 3: Create the adapter**

```python
# viewer-service/api/index.py
"""Vercel serverless entrypoint: the Viewer Service FastAPI app."""
from viewer_service.api.app import create_app

app = create_app()
```

- [ ] **Step 4: Create `requirements.txt`** (installs the VS package + the sibling denormaliser)

```
.
../questionnaire-runtime-denormaliser
```

- [ ] **Step 5: Create `vercel.json`** (bundles sibling schemas + scorer wasm; forward cron every 10 min)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "functions": {
    "api/index.py": {
      "includeFiles": "../{schemas,questionnaire-scorer/dist-wasm}/**"
    }
  },
  "rewrites": [
    { "source": "/v1/:path*", "destination": "/api/index" },
    { "source": "/internal/:path*", "destination": "/api/index" },
    { "source": "/healthz", "destination": "/api/index" }
  ],
  "crons": [
    { "path": "/internal/forward", "schedule": "*/10 * * * *" }
  ]
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd viewer-service && python -m pytest tests/test_vercel_entry.py -v`
Expected: PASS.

Validate JSON: `python -c "import json; json.load(open('vercel.json'))"`.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/api/index.py viewer-service/requirements.txt viewer-service/vercel.json viewer-service/tests/test_vercel_entry.py
git commit -m "feat(viewer-service): Vercel adapter (api/index.py + vercel.json + forward cron + sibling bundling)"
```

---

### Task 6: Backend Dockerfiles (Identity + Viewer Service)

**Files:**
- Create: `identity-service/Dockerfile`
- Create: `viewer-service/Dockerfile`
- Create: `.dockerignore` (repo root)

**Interfaces:**
- Produces: two images that serve their FastAPI app via uvicorn on the service port and answer `GET /healthz` with 200.

Note: these tasks require a working Docker daemon. If Docker is unavailable in the execution environment, complete the file creation steps and mark the build/run verification as "to verify on a Docker host", but do not skip writing the files.

- [ ] **Step 1: Create the Identity Dockerfile** (self-contained build context = `identity-service/`)

```dockerfile
# identity-service/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir .
ENV PORT=8100
EXPOSE 8100
CMD ["sh", "-c", "uvicorn identity_service.api.app:create_app --factory --host 0.0.0.0 --port ${PORT}"]
```

- [ ] **Step 2: Create the Viewer Service Dockerfile** (build context = REPO ROOT, so siblings are present)

```dockerfile
# viewer-service/Dockerfile
# Build from the repo root:  docker build -f viewer-service/Dockerfile -t vs .
FROM python:3.12-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir ./questionnaire-runtime-denormaliser ./viewer-service
ENV PORT=8001 \
    SCHEMAS_DIR=/app/schemas \
    VS_SCORER_DIR=/app/questionnaire-scorer/dist-wasm
EXPOSE 8001
CMD ["sh", "-c", "uvicorn viewer_service.api.app:create_app --factory --host 0.0.0.0 --port ${PORT}"]
```

- [ ] **Step 3: Create `.dockerignore`** (repo root) to keep build contexts lean

```
**/node_modules
**/.venv
**/__pycache__
**/dist
**/dist-lib
.git
archive
**/.pytest_cache
```

- [ ] **Step 4: Build + run the Identity image to verify**

Run:
```bash
docker build -t identity-svc ./identity-service
docker run -d --name id-smoke -e DATABASE_URL=postgresql://x -p 8100:8100 identity-svc
sleep 3 && curl -fsS http://localhost:8100/healthz
docker rm -f id-smoke
```
Expected: `{"status":"ok"}` (healthz needs no DB).

- [ ] **Step 5: Build + run the Viewer Service image to verify**

Run (from repo root):
```bash
docker build -f viewer-service/Dockerfile -t viewer-svc .
docker run -d --name vs-smoke -e DATABASE_URL=postgresql://x -p 8001:8001 viewer-svc
sleep 3 && curl -fsS http://localhost:8001/healthz
docker rm -f vs-smoke
```
Expected: `{"status":"ok"}`.

- [ ] **Step 6: Commit**

```bash
git add identity-service/Dockerfile viewer-service/Dockerfile .dockerignore
git commit -m "feat(deploy): Dockerfiles for identity + viewer-service (+ .dockerignore)"
```

---

### Task 7: Frontend deploy config (player + portal)

**Files:**
- Create: `web-viewer/vercel.json`
- Create: `participant-app/vercel.json`
- Create: `web-viewer/Dockerfile`
- Create: `participant-app/Dockerfile`
- Create: `web-viewer/nginx.conf`, `participant-app/nginx.conf`

**Interfaces:**
- Produces: SPA rewrite config for Vercel and static-serving images for compose. Build-time env (`VITE_VS_BASE_URL`, `VITE_IDENTITY_BASE_URL`, `VITE_PLAYER_BASE_URL`) is supplied by the platform.

- [ ] **Step 1: Create the player `vercel.json`** (`web-viewer/vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Create the portal `vercel.json`** (`participant-app/vercel.json`) — identical shape.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

- [ ] **Step 3: Create an nginx SPA config** for each app (identical). `web-viewer/nginx.conf` and `participant-app/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location / { try_files $uri /index.html; }
}
```

- [ ] **Step 4: Create the player Dockerfile** (`web-viewer/Dockerfile`)

```dockerfile
# web-viewer/Dockerfile  (build context = web-viewer/)
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_VS_BASE_URL
ARG VITE_IDENTITY_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 5: Create the portal Dockerfile** (`participant-app/Dockerfile`)

```dockerfile
# participant-app/Dockerfile  (build context = participant-app/)
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_VS_BASE_URL
ARG VITE_IDENTITY_BASE_URL
ARG VITE_PLAYER_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Note: the player build runs `predev`/`prebuild` scorer + evaluator wasm steps via its npm scripts; `npm run build` already chains them. Confirm the build emits `dist/` with the wasm assets.

- [ ] **Step 6: Verify the player build succeeds**

Run: `cd web-viewer && npm ci && VITE_VS_BASE_URL=http://localhost:8001 VITE_IDENTITY_BASE_URL=http://localhost:8100 npm run build`
Expected: `dist/index.html` produced, build exits 0.

- [ ] **Step 7: Verify the portal build succeeds**

Run: `cd participant-app && npm ci && VITE_VS_BASE_URL=http://localhost:8001 VITE_IDENTITY_BASE_URL=http://localhost:8100 VITE_PLAYER_BASE_URL=http://localhost:5173 npm run build`
Expected: `dist/index.html` produced, build exits 0.

- [ ] **Step 8: Commit**

```bash
git add web-viewer/vercel.json web-viewer/Dockerfile web-viewer/nginx.conf participant-app/vercel.json participant-app/Dockerfile participant-app/nginx.conf
git commit -m "feat(deploy): player + portal Vercel SPA config + static Docker images"
```

---

### Task 8: `.env.example` per service + env matrix fragment

**Files:**
- Create: `identity-service/.env.example`
- Create: `viewer-service/.env.example`
- Create: `web-viewer/.env.example`
- Create: `participant-app/.env.example`

**Interfaces:**
- Produces: the canonical list of env vars each service reads, with local-dev defaults, consumed by compose (Task 9) and the runbook (Task 10).

- [ ] **Step 1: Identity `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/identity_service
IDENTITY_ISSUER=http://localhost:8100
IDENTITY_CORS_ORIGINS=http://localhost:5173,http://localhost:5174
WEB_VIEWER_BASE_URL=http://localhost:5173
# email: set RESEND_API_KEY for real sends; otherwise links are logged to the console
RESEND_API_KEY=
SMTP_FROM=no-reply@behaverse.org
# cron trigger guard (fail-closed when unset)
CRON_SECRET=dev-cron-secret
```

- [ ] **Step 2: Viewer Service `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/viewer_service
LIBRARY_BASE_URL=https://questionnaire-library.vercel.app
VS_CORS_ORIGINS=http://localhost:5173,http://localhost:5174
IDENTITY_JWKS_URL=http://localhost:8100/.well-known/jwks.json
IDENTITY_ISSUER=http://localhost:8100
IDENTITY_AUDIENCE=questionnaire-apps
INVITE_SIGNING_SECRET=dev-invite-secret
SCHEMAS_DIR=./schemas
VS_SCORER_DIR=./questionnaire-scorer/dist-wasm
# Behaverse forwarding sink is OFF unless a real base url is set
BEHAVERSE_BASE_URL=http://localhost:9000
CRON_SECRET=dev-cron-secret
```

- [ ] **Step 3: player `.env.example`** (`web-viewer/.env.example`)

```
VITE_VS_BASE_URL=http://localhost:8001
VITE_IDENTITY_BASE_URL=http://localhost:8100
```

- [ ] **Step 4: portal `.env.example`** (`participant-app/.env.example`)

```
VITE_VS_BASE_URL=http://localhost:8001
VITE_IDENTITY_BASE_URL=http://localhost:8100
VITE_PLAYER_BASE_URL=http://localhost:5173
```

- [ ] **Step 5: Commit**

```bash
git add identity-service/.env.example viewer-service/.env.example web-viewer/.env.example participant-app/.env.example
git commit -m "docs(deploy): per-service .env.example (env matrix source of truth)"
```

---

### Task 9: Top-level `docker-compose.yml` (one-command full stack)

**Files:**
- Create: `docker-compose.yml` (repo root)

**Interfaces:**
- Consumes: the Dockerfiles (Tasks 6, 7) and env (Task 8).
- Produces: a one-command local stack — Postgres + Identity + Viewer Service + player + portal — with auto-migration. VS points at the live Library by default (so 212 questionnaires are available without local seeding); pointing at a local Library is a documented optional extension in `DEPLOYMENT.md`.

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 3s
      timeout: 3s
      retries: 20
    volumes:
      - ./scripts/compose-initdb.sql:/docker-entrypoint-initdb.d/01-init.sql:ro

  identity:
    build: ./identity-service
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/identity_service
      IDENTITY_ISSUER: http://localhost:8100
      IDENTITY_CORS_ORIGINS: http://localhost:5173,http://localhost:5174
      WEB_VIEWER_BASE_URL: http://localhost:5173
      CRON_SECRET: dev-cron-secret
      PORT: "8100"
    ports: ["8100:8100"]
    depends_on:
      db: { condition: service_healthy }
    command: sh -c "python -m identity_service.cli migrate && python -m identity_service.cli generate-key --retire-others && uvicorn identity_service.api.app:create_app --factory --host 0.0.0.0 --port 8100"

  viewer-service:
    build:
      context: .
      dockerfile: viewer-service/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/viewer_service
      LIBRARY_BASE_URL: https://questionnaire-library.vercel.app
      VS_CORS_ORIGINS: http://localhost:5173,http://localhost:5174
      IDENTITY_JWKS_URL: http://identity:8100/.well-known/jwks.json
      IDENTITY_ISSUER: http://localhost:8100
      INVITE_SIGNING_SECRET: dev-invite-secret
      CRON_SECRET: dev-cron-secret
      PORT: "8001"
    ports: ["8001:8001"]
    depends_on:
      db: { condition: service_healthy }
    command: sh -c "python -m viewer_service.cli migrate && uvicorn viewer_service.api.app:create_app --factory --host 0.0.0.0 --port 8001"

  player:
    build:
      context: ./web-viewer
      args:
        VITE_VS_BASE_URL: http://localhost:8001
        VITE_IDENTITY_BASE_URL: http://localhost:8100
    ports: ["5173:80"]

  portal:
    build:
      context: ./participant-app
      args:
        VITE_VS_BASE_URL: http://localhost:8001
        VITE_IDENTITY_BASE_URL: http://localhost:8100
        VITE_PLAYER_BASE_URL: http://localhost:5173
    ports: ["5174:80"]
```

- [ ] **Step 2: Create the DB init script** so the two service databases exist on first boot.

```sql
-- scripts/compose-initdb.sql
CREATE DATABASE identity_service;
CREATE DATABASE viewer_service;
```

- [ ] **Step 3: Validate the compose file**

Run: `docker compose config`
Expected: prints the resolved config with no error.

- [ ] **Step 4: Bring the stack up and verify health** (requires Docker)

Run:
```bash
docker compose up -d --build
sleep 25
curl -fsS http://localhost:8100/healthz && echo
curl -fsS http://localhost:8001/healthz && echo
curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:5174/
curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```
Expected: two `{"status":"ok"}` lines and two `200`s. Then `docker compose down`.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml scripts/compose-initdb.sql
git commit -m "feat(deploy): docker-compose full-stack local bring-up (one command)"
```

---

### Task 10: `DEPLOYMENT.md` runbook (cloud go-live + GCP path)

**Files:**
- Create: `DEPLOYMENT.md` (repo root)
- Create: `scripts/seed-demo-deployment.sh`

**Interfaces:**
- Produces: the operator runbook for the Vercel + Supabase go-live, the env matrix, the seeding step, and the documented Google-Cloud migration path.

- [ ] **Step 1: Write `DEPLOYMENT.md`** with these sections (full prose, no placeholders):

  1. **Overview** — the six Vercel projects (library exists; identity, viewer-service, player, portal new; editor later) and the two-layer pattern.
  2. **Local full stack** — `cp` each `.env.example`, then `docker compose up --build`; URLs table.
  3. **Env matrix** — a table: for each of player/portal/identity/viewer-service, the exact value of every `VITE_*_BASE_URL`, `*_CORS_ORIGINS`, `LIBRARY_BASE_URL`, `IDENTITY_*`, and secret, for both local and production (`*.vercel.app`) columns. CORS allow-lists on Identity and VS MUST list both the portal and player origins.
  4. **Supabase provisioning** — create one project per service (Identity, Viewer Service); copy the pooled `DATABASE_URL`; run `python -m identity_service.cli migrate` / `python -m viewer_service.cli migrate` against it; `identity_service.cli generate-key --retire-others`; `identity_service.cli create-admin --email … --password …`.
  5. **Vercel project setup** — for each service: New Project → set **Root Directory** to the service folder → set env vars from the matrix → deploy. Note the Python services auto-detect `api/index.py`; confirm Argon2/psycopg cold-start in a **preview deploy first** (validation spike), and confirm the VS `includeFiles` bundling actually ships `schemas/` + scorer wasm (hit `/v1/preview/runtime` on the preview URL).
  6. **Cron** — Vercel reads the `crons` array from each `vercel.json`; set `CRON_SECRET` in each project's env (Vercel auto-sends `Authorization: Bearer $CRON_SECRET`).
  7. **Email (Resend)** — create a Resend account + API key; set `RESEND_API_KEY` + `SMTP_FROM` on Identity; start on Resend's sandbox sender, document custom-domain verification as follow-up.
  8. **Seed a demo deployment** — run `scripts/seed-demo-deployment.sh` (Step 2).
  9. **Smoke test (production)** — open the portal URL → register → verify email (real inbox) → log in → pick the demo questionnaire → run in the player → finish → "my data" → download CSV. Confirm via the browser Network tab (not just curl) that CORS passes.
  10. **Future: Google Cloud** — Dockerfiles → Cloud Run (one service each); Supabase → Cloud SQL (repoint `DATABASE_URL`); Vercel Cron → Cloud Scheduler hitting the same `/internal/*` endpoints with the `CRON_SECRET` bearer; frontends → Cloud Run static or a bucket+CDN. The `api/index.py` + `vercel.json` files are simply unused.

- [ ] **Step 2: Write `scripts/seed-demo-deployment.sh`** (creates an admin token and a listed demo deployment)

```bash
#!/usr/bin/env bash
# Seed one listed demo deployment so the portal catalogue is non-empty.
# Usage: IDENTITY_URL=… VS_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… QREF='qst_wellbeing@v26.0601' ./scripts/seed-demo-deployment.sh
set -euo pipefail
: "${IDENTITY_URL:?}"; : "${VS_URL:?}"; : "${ADMIN_EMAIL:?}"; : "${ADMIN_PASSWORD:?}"; : "${QREF:?}"

TOKEN=$(curl -fsS -X POST "$IDENTITY_URL/v1/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -fsS -X POST "$VS_URL/v1/deployments" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"questionnaire_ref\":\"$QREF\",\"mode_preset\":\"open\",\"listed\":true,\"title\":\"Wellbeing check-in\",\"description\":\"A short demo questionnaire.\"}"
echo "seeded demo deployment for $QREF"
```

Note: confirm the exact `/v1/deployments` request body against `viewer-service/README.md` before running (mode-preset name and required fields); adjust the JSON if the README differs. This script is operator-run during go-live, not in CI.

- [ ] **Step 3: Make the script executable + sanity-check it parses**

Run: `chmod +x scripts/seed-demo-deployment.sh && bash -n scripts/seed-demo-deployment.sh`
Expected: no output (valid bash).

- [ ] **Step 4: Commit**

```bash
git add DEPLOYMENT.md scripts/seed-demo-deployment.sh
git commit -m "docs(deploy): DEPLOYMENT.md runbook + demo-deployment seed script"
```

---

## Go-live (operator-run, not an autonomous task)

After Tasks 1–10 land and the local `docker compose up` smoke passes, the cloud go-live is executed by following `DEPLOYMENT.md` interactively (it needs the owner's Vercel + Supabase + Resend credentials and a real email inbox). Sequence: provision Supabase → migrate + generate-key + create-admin → deploy Identity to a **preview** and validate (Argon2 cold-start, JWKS, `/internal/reap` with the cron bearer) → deploy Viewer Service to a preview and validate the sibling bundling via `/v1/preview/runtime` → deploy player + portal with the production env matrix → set CORS to the production origins → seed the demo deployment → run the production smoke test (register → verify → run → download), confirming CORS in the browser Network tab. Promote to production once the smoke passes.

---

## Self-Review

**Spec coverage** (each spec section → task):
- §2 two-layer pattern / per-service Vercel projects → Tasks 4, 5, 7 (adapters + vercel.json) + Task 6 (Dockerfiles).
- §3 12-factor config + env matrix → Tasks 1, 3 (config fields), Task 8 (.env.example), Task 10 (matrix).
- §4 workers-as-cron-endpoints → Tasks 2, 3 (endpoints) + Tasks 4, 5 (cron declarations).
- §5 Supabase per service + Resend → Task 1 (Resend), Task 10 (Supabase provisioning).
- §6 one-command local + runbook + GCP path → Task 9 (compose), Task 10 (DEPLOYMENT.md).
- §7 work units 1–9 → all covered (provisioning/go-live = the operator section, deliberately not a TDD task because it is credential-bound and exploratory).

**Placeholder scan:** no "TBD"/"handle appropriately"; every code/config step shows full content. The two genuinely external-validation points (VS sibling bundling on Vercel; exact `/v1/deployments` body) are explicitly flagged with how to confirm, not hidden as placeholders.

**Type/name consistency:** `CRON_SECRET` + `cron_secret` used consistently across Tasks 1–5; `_require_cron` guard identical in both internal routers; `make_mailer` precedence matches the Global Constraints; frontend env names (`VITE_VS_BASE_URL`, `VITE_IDENTITY_BASE_URL`, `VITE_PLAYER_BASE_URL`) match the verified source usage; app-factory paths (`…api.app:create_app`) match the real modules.
