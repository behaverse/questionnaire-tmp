# PP-D — Participant catalogue / home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a participant browse the questionnaires a researcher chose to publish and start one — via a public catalogue endpoint and a `home.html` portal that links into the existing runner.

**Architecture:** Deployments gain a `listed` opt-in + optional `title`/`description`; a public `GET /v1/catalogue` returns `listed` + currently-open (reusing the pure `check_deployable` gate) + browse-startable (auth none/identity) deployments. A new `home.html` Web Viewer entry renders cards whose "Start" links to `index.html?deployment=<id>` (the runner handles auth). No new session logic.

**Tech Stack:** viewer-service (FastAPI, raw psycopg3, testcontainers), web-viewer (Vite/React19/TS, vitest). Reuses `check_deployable`, the runner's auth flow, and the PP-C second-entry/portal pattern.

## Global Constraints

- A deployment is in the catalogue only if `listed = true`. The catalogue shows `listed` AND open (passes `check_deployable`: within `active_from`/`active_until`, not over `quota.max_sessions`) AND browse-startable (`dimensions.auth in {"none","identity"}` — NOT `invite_link`).
- Deployment gains `listed boolean NOT NULL DEFAULT false`, `title text` (nullable), `description text` (nullable). `DeploymentCreate` accepts `listed: bool = False`, `title: str | None = None`, `description: str | None = None`. Title in the catalogue falls back to `questionnaire_ref` when absent. No live Library call.
- `GET /v1/catalogue` is PUBLIC (no auth dependency) and returns `{"items":[{deployment_id, title, description, questionnaire_ref, auth}]}`. Empty → `{"items":[]}`. Read-only.
- "Start" navigates to `index.html?deployment=<id>` (carry `viewer_url`/`identity_url` query params); the runner handles anonymous/login. The catalogue has no session/mint logic.
- A new `home.html` Vite entry, shipped in BOTH prod and dev `rollupOptions.input`.
- Reuse the VS `{"error":{"code","message"}}` envelope. Raw psycopg3, no ORM; new columns added idempotently (CREATE column + `ALTER … ADD COLUMN IF NOT EXISTS`). VS tests: own pytest invocation, `DOCKER_CONFIG=/tmp/lib_docker`. venv uv-managed (`.venv/bin/python -m pytest`/`-m pip`). web-viewer: `cd web-viewer && npm test`/`npm run build`.
- No changes to `identity-service/` (frozen), the runner's auth flow, the mydata portal, or the researcher deployment list. TDD; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-22-participant-pp-d-design.md`.

---

### Task 1: Deployment `listed`/`title`/`description` + catalogue-candidates query

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql`
- Modify: `viewer-service/src/viewer_service/store/deployments.py`
- Modify: `viewer-service/src/viewer_service/models.py` (`DeploymentCreate`)
- Modify: `viewer-service/src/viewer_service/api/deployments.py` (persist the 3 fields)
- Create: `viewer-service/tests/test_catalogue_store.py`

**Interfaces:**
- Produces: `deployment.listed/title/description` columns; `DeploymentCreate.listed/title/description`; `store.deployments.insert_deployment` persists them; `store.deployments.list_catalogue_candidates(conn) -> list[dict]`.

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_catalogue_store.py`)

```python
from viewer_service.store import deployments as dstore

_BODY = {
    "questionnaire_ref": "qst_x@v26.0101",
    "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
    "default_locale": "en", "available_locales": ["en"],
}


def _create(client, *, listed, preset="anonymous_link", title=None, description=None):
    return client.post("/v1/deployments", json={
        **_BODY, "mode_preset": preset, "listed": listed, "title": title,
        "description": description}).json()["deployment_id"]


def test_create_persists_listed_title_description(client, conn):
    dep_id = _create(client, listed=True, title="Wellbeing survey", description="A short check-in.")
    dep = dstore.get_deployment(conn, dep_id)
    assert dep["listed"] is True
    assert dep["title"] == "Wellbeing survey" and dep["description"] == "A short check-in."


def test_create_defaults_listed_false(client, conn):
    dep_id = _create(client, listed=False)
    assert dstore.get_deployment(conn, dep_id)["listed"] is False


def test_catalogue_candidates_filters_listed_and_auth(client, conn):
    listed_id = _create(client, listed=True, title="Listed")
    unlisted_id = _create(client, listed=False)
    invite_id = _create(client, listed=True, preset="invite_link", title="Invite-only")
    cands = dstore.list_catalogue_candidates(conn)
    ids = {c["deployment_id"] for c in cands}
    assert listed_id in ids
    assert unlisted_id not in ids                       # unlisted excluded
    assert invite_id not in ids                          # invite_link not browse-startable
    assert all((c["dimensions"] or {}).get("auth") in ("none", "identity") for c in cands)
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_catalogue_store.py -q`
Expected: FAIL (DeploymentCreate rejects `listed`/`title`/`description` OR `list_catalogue_candidates` undefined).

- [ ] **Step 3: Add the columns to `store/schema.sql`** — (a) add to the `deployment` `CREATE TABLE` column list (after `consent_text_ref text,` or any column): `listed boolean NOT NULL DEFAULT false,`, `title text,`, `description text,`; (b) append idempotent ALTERs in the deployment ALTER block:

```sql
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS listed      boolean NOT NULL DEFAULT false;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS description text;
```

- [ ] **Step 4: Update `store/deployments.py`** — add the 3 columns to `_COLS` (they are NOT jsonb), make `insert_deployment` default `listed`, and add `list_catalogue_candidates`.

Add `"listed", "title", "description"` to the end of the `_COLS` tuple. In `insert_deployment`, add a default for `listed` at the top so a direct caller that omits it doesn't violate the NOT NULL column:

```python
def insert_deployment(conn: psycopg.Connection, **fields) -> None:
    fields.setdefault("listed", False)
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO deployment ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))})", vals)
    conn.commit()
```

Add the candidates query:

```python
def list_catalogue_candidates(conn: psycopg.Connection) -> list[dict]:
    """Listed, browse-startable deployments (auth none/identity), newest first. The active-window +
    quota filter is applied by the caller via check_deployable."""
    cols = ["deployment_id", "questionnaire_ref", "title", "description", "dimensions",
            "active_from", "active_until", "quota"]
    rows = conn.execute(
        f"SELECT {', '.join(cols)} FROM deployment "
        "WHERE listed AND (dimensions->>'auth') IN ('none','identity') "
        "ORDER BY created_at DESC").fetchall()
    return [dict(zip(cols, r)) for r in rows]
```

- [ ] **Step 5: Add the fields to `DeploymentCreate` in `models.py`** — add to the `DeploymentCreate` model:

```python
    listed: bool = False
    title: str | None = None
    description: str | None = None
```

- [ ] **Step 6: Persist them in the `create` handler (`api/deployments.py`)** — in the `store.insert_deployment(...)` call, add the three kwargs (e.g. after `consent_text_ref=body.consent_text_ref`):

```python
        listed=body.listed, title=body.title, description=body.description,
```

- [ ] **Step 7: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_catalogue_store.py -q`
Expected: 3 passed.

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/deployments.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/api/deployments.py viewer-service/tests/test_catalogue_store.py
git commit -m "feat(vs): deployment listed/title/description + list_catalogue_candidates"
```

---

### Task 2: Public `GET /v1/catalogue` endpoint

**Files:**
- Create: `viewer-service/src/viewer_service/api/catalogue.py`
- Modify: `viewer-service/src/viewer_service/api/app.py` (include router)
- Create: `viewer-service/tests/test_catalogue_api.py`

**Interfaces:**
- Consumes: `store.deployments.list_catalogue_candidates`, `store.sessions.count_for_deployment`, `deployments.check_deployable` + its `DeploymentClosed`/`NotYetOpen`/`QuotaExhausted`, the conftest `client`/`auth_header`.
- Produces: `GET /v1/catalogue`.

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_catalogue_api.py`)

```python
_BODY = {
    "questionnaire_ref": "qst_x@v26.0101",
    "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
    "default_locale": "en", "available_locales": ["en"],
}


def _create(client, *, listed, preset="anonymous_link", title=None, active_until=None):
    body = {**_BODY, "mode_preset": preset, "listed": listed, "title": title}
    if active_until is not None:
        body["active_until"] = active_until
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


def test_catalogue_lists_listed_open(client):
    dep_id = _create(client, listed=True, title="Open survey")
    client.headers.pop("authorization", None)            # public — no token needed
    r = client.get("/v1/catalogue")
    assert r.status_code == 200
    items = {i["deployment_id"]: i for i in r.json()["items"]}
    assert dep_id in items
    assert items[dep_id]["title"] == "Open survey" and items[dep_id]["auth"] == "none"


def test_catalogue_excludes_unlisted_and_invite(client):
    listed_id = _create(client, listed=True, title="A")
    unlisted_id = _create(client, listed=False)
    invite_id = _create(client, listed=True, preset="invite_link", title="B")
    items = {i["deployment_id"] for i in client.get("/v1/catalogue").json()["items"]}
    assert listed_id in items and unlisted_id not in items and invite_id not in items


def test_catalogue_excludes_closed(client):
    closed_id = _create(client, listed=True, title="Closed", active_until="2020-01-01T00:00:00Z")
    items = {i["deployment_id"] for i in client.get("/v1/catalogue").json()["items"]}
    assert closed_id not in items


def test_catalogue_title_falls_back_to_ref(client):
    dep_id = _create(client, listed=True, title=None)
    item = next(i for i in client.get("/v1/catalogue").json()["items"] if i["deployment_id"] == dep_id)
    assert item["title"] == "qst_x@v26.0101"
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_catalogue_api.py -q`
Expected: FAIL (404 — `/v1/catalogue` not registered).

- [ ] **Step 3: Write `api/catalogue.py`**

```python
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from .deps import get_conn
from ..store import deployments as dep_store
from ..store import sessions as session_store
from .. import deployments as deploy_svc

router = APIRouter()


@router.get("/catalogue")
def catalogue(conn=Depends(get_conn)):
    now = datetime.now(timezone.utc)
    items = []
    for dep in dep_store.list_catalogue_candidates(conn):
        count = session_store.count_for_deployment(conn, dep["deployment_id"])
        try:
            deploy_svc.check_deployable(dep, now, count)
        except (deploy_svc.DeploymentClosed, deploy_svc.NotYetOpen, deploy_svc.QuotaExhausted):
            continue
        items.append({
            "deployment_id": dep["deployment_id"],
            "title": dep["title"] or dep["questionnaire_ref"],
            "description": dep["description"],
            "questionnaire_ref": dep["questionnaire_ref"],
            "auth": (dep["dimensions"] or {}).get("auth"),
        })
    return {"items": items}
```

- [ ] **Step 4: Include the router in `api/app.py`** — alongside the other route includes inside `create_app`:

```python
    from . import catalogue as catalogue_routes
    app.include_router(catalogue_routes.router, prefix="/v1")
```

(Match the file's existing import/include style.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_catalogue_api.py -q`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/catalogue.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_catalogue_api.py
git commit -m "feat(vs): public GET /v1/catalogue (listed + open + browse-startable deployments)"
```

---

### Task 3: Web Viewer — `home` client

**Files:**
- Create: `web-viewer/src/home/client.ts`
- Create: `web-viewer/src/home/client.test.ts`

**Interfaces:**
- Produces: `CatalogueItem` type; `fetchCatalogue(vsBaseUrl) -> Promise<CatalogueResult>` (`{ok:true, items} | {ok:false, error:'network'}`).

- [ ] **Step 1: Write the failing test** (`web-viewer/src/home/client.test.ts`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { fetchCatalogue } from './client'

beforeEach(() => { vi.restoreAllMocks() })

test('fetchCatalogue GETs /v1/catalogue (no auth) and returns items', async () => {
  const items = [{ deployment_id: 'd1', title: 'Survey', description: null, questionnaire_ref: 'qst_x@v1', auth: 'none' }]
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await fetchCatalogue('http://vs')
  expect(res).toEqual({ ok: true, items })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/catalogue')
  expect((init as RequestInit | undefined)?.headers).toBeUndefined()   // no auth header
})

test('fetchCatalogue maps a network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await fetchCatalogue('http://vs')).toEqual({ ok: false, error: 'network' })
})

test('fetchCatalogue defaults to [] when items is absent', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  expect(await fetchCatalogue('http://vs')).toEqual({ ok: true, items: [] })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- home/client`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `web-viewer/src/home/client.ts`**

```typescript
export type CatalogueItem = {
  deployment_id: string
  title: string
  description: string | null
  questionnaire_ref: string
  auth: string | null
}
export type CatalogueResult = { ok: true; items: CatalogueItem[] } | { ok: false; error: 'network' }

export async function fetchCatalogue(vsBaseUrl: string): Promise<CatalogueResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/catalogue`)
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, items: (await resp.json()).items ?? [] }
  return { ok: false, error: 'network' }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- home/client`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/home/client.ts web-viewer/src/home/client.test.ts
git commit -m "feat(web-viewer): home catalogue client (fetchCatalogue)"
```

---

### Task 4: Web Viewer — `HomeApp` + `home` entry

**Files:**
- Create: `web-viewer/src/home/HomeApp.tsx`
- Create: `web-viewer/src/home/HomeApp.test.tsx`
- Create: `web-viewer/home.html`
- Create: `web-viewer/src/home/main.tsx`
- Modify: `web-viewer/vite.config.ts` (add `home` entry to prod + dev input)

**Interfaces:**
- Consumes: `fetchCatalogue`/`CatalogueItem` (Task 3), `parseParams` (`../app/bootstrap`).
- Produces: `HomeApp` (named export) + the `home.html` build entry.

- [ ] **Step 1: Write the failing test** (`web-viewer/src/home/HomeApp.test.tsx`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeApp } from './HomeApp'

beforeEach(() => { vi.restoreAllMocks() })

function stub(items: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/catalogue')) return new Response(JSON.stringify({ items }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('renders a card per catalogue item with a Start link into the runner', async () => {
  stub([{ deployment_id: 'd1', title: 'Wellbeing survey', description: 'A short check-in.', questionnaire_ref: 'qst_x@v1', auth: 'none' }])
  render(<HomeApp />)
  expect(await screen.findByText('Wellbeing survey')).toBeInTheDocument()
  expect(screen.getByText('A short check-in.')).toBeInTheDocument()
  const start = screen.getByRole('link', { name: /start/i })
  expect(start.getAttribute('href')).toContain('index.html?')
  expect(start.getAttribute('href')).toContain('deployment=d1')
})

test('shows an empty state when the catalogue is empty', async () => {
  stub([])
  render(<HomeApp />)
  expect(await screen.findByText(/no questionnaires available right now/i)).toBeInTheDocument()
})

test('has a My data link', async () => {
  stub([])
  render(<HomeApp />)
  const mydata = await screen.findByRole('link', { name: /my data/i })
  expect(mydata.getAttribute('href')).toContain('mydata.html')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- home/HomeApp`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `web-viewer/src/home/HomeApp.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { fetchCatalogue, type CatalogueItem } from './client'

function carry(base: string, extra: Record<string, string>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) q.set(k, v)
  const cur = new URLSearchParams(window.location.search)
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  return `${base}?${q.toString()}`
}

export function HomeApp() {
  const params = parseParams(window.location.search)
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetchCatalogue(params.vsBaseUrl)
      if (res.ok) setItems(res.items)
      setLoaded(true)
    })()
  }, [params.vsBaseUrl])

  return (
    <main className="min-h-screen px-6 py-8 font-theme max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Available questionnaires</h1>
        <a className="text-sm text-slate-500 underline" href={carry('mydata.html', {})}>My data</a>
      </header>
      {loaded && items.length === 0 ? (
        <p className="text-slate-600">No questionnaires available right now.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.deployment_id} className="border rounded p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{it.title}</div>
                {it.description ? <div className="text-sm text-slate-500">{it.description}</div> : null}
              </div>
              <a className="qv-button qv-focusable px-4 py-2 shrink-0"
                 href={carry('index.html', { deployment: it.deployment_id })}>Start</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- home/HomeApp`
Expected: 3 passed.

- [ ] **Step 5: Add the entry HTML + mount + Vite input**

Create `web-viewer/home.html` (mirror `mydata.html`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Questionnaires</title>
  </head>
  <body>
    <div id="home-root"></div>
    <script type="module" src="/src/home/main.tsx"></script>
  </body>
</html>
```

Create `web-viewer/src/home/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client'
import { HomeApp } from './HomeApp'
import '../index.css'

createRoot(document.getElementById('home-root')!).render(<HomeApp />)
```

In `web-viewer/vite.config.ts`, add `home` to BOTH input branches (alongside `mydata`):

```typescript
          input: mode === 'production'
            ? { main: resolve(__dirname, 'index.html'), mydata: resolve(__dirname, 'mydata.html'), home: resolve(__dirname, 'home.html') }
            : { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html'), mydata: resolve(__dirname, 'mydata.html'), home: resolve(__dirname, 'home.html') },
```

- [ ] **Step 6: Build to confirm the entry compiles**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm run build`
Expected: clean build; `dist/home.html` emitted.

- [ ] **Step 7: Commit**

```bash
git add web-viewer/src/home/HomeApp.tsx web-viewer/src/home/HomeApp.test.tsx web-viewer/home.html web-viewer/src/home/main.tsx web-viewer/vite.config.ts
git commit -m "feat(web-viewer): HomeApp catalogue portal + home.html entry (browse → Start)"
```

---

### Task 5: Full-suite gate + docs

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full VS suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pass (existing + the 2 new PP-D test files). If a pre-existing deployment test breaks because `get_deployment` now returns `listed`/`title`/`description` (additive keys) or because the create handler signature changed, update that assertion minimally. If a failure is unrelated, STOP + report BLOCKED with output. Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build with `dist/home.html`. Capture totals.

- [ ] **Step 3: Update `viewer-service/README.md` + `FOLLOWUPS.md`.** README: document the `listed`/`title`/`description` deployment fields + `GET /v1/catalogue` (public; lists `listed` + open + browse-startable [auth none/identity] deployments; title falls back to `questionnaire_ref`). FOLLOWUPS: auto-fill title/description from the Library (cross-service); per-participant assignment (Phase 5); catalogue search/filter; quota "full" badges.

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md`.** README: document the `home.html` participant home (browse available questionnaires → Start opens the runner; a "My data" link; `?viewer_url=`/`?identity_url=` carried into Start). FOLLOWUPS: merge home + my-data into one tabbed portal later; no search/filter yet.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs(pp): document the catalogue endpoint + home portal; record PP-D FOLLOWUPS; PP-D complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 `listed` opt-in + open + browse-startable → Task 1 (`list_catalogue_candidates` auth filter) + Task 2 (`check_deployable` open filter) + tests. ✓
- §2 title/description stored + fallback → Task 1 (columns/model/insert) + Task 2 (`title or questionnaire_ref`) + tests. ✓
- §2 public catalogue → Task 2 (no auth dep) + test (header stripped). ✓
- §2 Start links to runner (carry viewer_url/identity_url) → Task 4 (`carry`) + test. ✓
- §2 new home.html entry (prod+dev) → Task 4. ✓
- §3 units (schema/model/insert/handler/candidates/catalogue/app/client/HomeApp/entry) → Tasks 1–4. ✓
- §4 columns (listed NOT NULL DEFAULT false, title, description) → Task 1. ✓
- §5 endpoints (POST deployments accepts the 3; GET /v1/catalogue public shape) → Tasks 1,2. ✓
- §6 privacy (only listed; non-sensitive fields; read-only public) → Tasks 1,2 + tests. ✓
- §7 testing (VS filters + fallback + public; web-viewer client + HomeApp + empty + build) → Tasks 1–4. ✓
- §8 out-of-scope honored (no Library auto-fill, no tabbed merge, no assignment, no search, no quota badge, no runner change). ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit. The empty-state copy ("No questionnaires available right now.") is concrete and matched by the HomeApp test. The Start-link `carry` helper has full code.

**3. Type consistency:** `DeploymentCreate.listed/title/description` (Task 1) consumed by the create handler (Task 1) + persisted via `insert_deployment` (Task 1 `_COLS`). `list_catalogue_candidates` (Task 1) consumed by `api/catalogue.py` (Task 2). `check_deployable` + its 3 exceptions (existing) used in Task 2. The catalogue item shape `{deployment_id, title, description, questionnaire_ref, auth}` (Task 2) matches `CatalogueItem` (Task 3) and HomeApp's rendering (Task 4: `title`, `description`, `deployment_id`). `fetchCatalogue` (Task 3) consumed by HomeApp (Task 4). `parseParams().vsBaseUrl` (existing) used by HomeApp. Consistent.

One execution note: Task 1 adds `listed`/`title`/`description` to `get_deployment`'s returned dict (via `_COLS`→`_SELECT_COLS`); Task 5 Step 1 checks the full VS suite for any exact-shape deployment assertion the additive keys could disturb (additive keys don't break subset/`in` checks; investigate only if one fails).
