# PP-C — "My data" participant self-service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-in participant list their own sessions and download their own responses (BDM CSV), strictly scoped to their Identity sub.

**Architecture:** Two participant-scoped Viewer Service endpoints (`GET /v1/me/sessions`, `GET /v1/me/responses.csv`) reuse the existing export serializer over new participant-filtered queries, gated by a `require_participant` dependency scoping to `claims["sub"]`. A small `MyDataApp` Web Viewer portal (new `mydata.html` Vite entry) logs in (reusing PP-A's login) and shows the list + a download button. Identity stays frozen.

**Tech Stack:** viewer-service (FastAPI, raw psycopg3, testcontainers), web-viewer (Vite/React19/TS, vitest), reuses PP-A login + the researcher-export serializer + library-web's blob-download pattern.

## Global Constraints

- The me-endpoints scope STRICTLY to `claims["sub"]` (`WHERE session.participant_sub = claims["sub"]`); a participant can never see another's data; the participant id comes ONLY from the verified token, never a query/path/body param. Invite sessions (`participant_sub` = `invite:<code>`) are naturally excluded (a logged-in sub is an Identity UUID).
- `require_participant` = a FastAPI dependency that reuses `api/identity._claims` (raises `401` on missing/invalid token) and returns the claims. Audience `questionnaire-apps`, role-agnostic (any valid token).
- Download = BDM CSV via the existing `export_csv.response_columns` + `export_csv.to_csv`; only a participant-scoped row iterator is new (same `outbox → session` join + ResponseSet/bare-Response flattening as `iter_response_rows`, filtered by `participant_sub`). Empty data → a header-only CSV (still 200).
- The "My data" portal is a second Vite entry (`mydata.html` → `src/mydata/main.tsx` → `MyDataApp`), shipped in BOTH prod and dev `rollupOptions.input`; reuses `LoginView` + `loginParticipant` (PP-A) + `parseParams`.
- Reuse the VS `{"error":{"code","message"}}` envelope; `401` on the me-endpoints. Raw psycopg3, no ORM, no new tables/columns. VS tests: own pytest invocation, `DOCKER_CONFIG=/tmp/lib_docker`. venv uv-managed (`.venv/bin/python -m pytest`/`-m pip`). web-viewer: `cd web-viewer && npm test` / `npm run build`.
- No changes to `identity-service/` (frozen) or to the existing researcher export / questionnaire renderer. TDD; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-22-participant-pp-c-design.md`.

---

### Task 1: VS data layer — `require_participant` + participant-scoped store queries

**Files:**
- Modify: `viewer-service/src/viewer_service/api/identity.py` (add `require_participant`)
- Modify: `viewer-service/src/viewer_service/store/sessions.py` (add `list_sessions_for_participant`)
- Modify: `viewer-service/src/viewer_service/store/export.py` (add `iter_response_rows_for_participant`)
- Create: `viewer-service/tests/test_my_data_store.py`

**Interfaces:**
- Consumes: `api/identity._claims`, `store/sessions._SELECT_COLS`/`_row_to_dict`, the conftest `id_key` fixture, `identity_service.tokens.sign_access`.
- Produces: `identity.require_participant(authorization=Header(...)) -> dict`; `store.sessions.list_sessions_for_participant(conn, participant_sub) -> list[dict]`; `store.export.iter_response_rows_for_participant(conn, participant_sub) -> Iterator[dict]`.

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_my_data_store.py`)

```python
import pytest
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as estore


def _session(conn, sid, sub, *, status="submitted"):
    sstore.insert_session(
        conn, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
        deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=sub,
        instrument_id="qst_x", instrument_version="v26.0101", status=status,
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _responses(conn, sid, responses):
    conn.execute(
        "INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'responses',%s,%s)",
        (sid, Jsonb({"session_id": sid, "responses": responses}), "sha_" + sid))


def test_list_sessions_for_participant_scoped(conn):
    _session(conn, "sA1", "alice")
    _session(conn, "sA2", "alice")
    _session(conn, "sB1", "bob")
    got = sstore.list_sessions_for_participant(conn, "alice")
    assert {s["session_id"] for s in got} == {"sA1", "sA2"}
    assert all(s["participant_sub"] == "alice" for s in got)


def test_iter_responses_for_participant_scoped(conn):
    _session(conn, "sA1", "alice")
    _session(conn, "sB1", "bob")
    _responses(conn, "sA1", [{"id": "rA", "value": 1}])
    _responses(conn, "sB1", [{"id": "rB", "value": 2}])
    rows = list(estore.iter_response_rows_for_participant(conn, "alice"))
    assert [r["id"] for r in rows] == ["rA"]


def test_require_participant_dep(id_key, monkeypatch):
    from fastapi import FastAPI, Depends
    from fastapi.testclient import TestClient
    from viewer_service.api import identity as idmod
    from identity_service.tokens import sign_access
    kid, jwk, pem = id_key
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    app = FastAPI()

    @app.get("/p")
    def p(claims=Depends(idmod.require_participant)):
        return {"sub": claims["sub"]}

    c = TestClient(app)
    assert c.get("/p").status_code == 401
    tok = sign_access(private_pem=pem, kid=kid, sub="alice", aud="questionnaire-apps",
                      roles=["participant"], issuer="http://id-test", ttl=900)
    r = c.get("/p", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["sub"] == "alice"
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_my_data_store.py -q`
Expected: FAIL (`list_sessions_for_participant`/`iter_response_rows_for_participant`/`require_participant` undefined).

- [ ] **Step 3: Add `require_participant` to `api/identity.py`** (append)

```python
def require_participant(authorization: str | None = Header(default=None)) -> dict:
    """Require a valid Identity access token (any role). Returns the verified claims; raises 401 if
    missing/invalid. The 'my data' endpoints scope strictly to claims['sub']."""
    return _claims(authorization)
```

- [ ] **Step 4: Add `list_sessions_for_participant` to `store/sessions.py`** (append)

```python
def list_sessions_for_participant(conn: psycopg.Connection, participant_sub: str) -> list[dict]:
    cur = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE participant_sub=%s "
        "ORDER BY started_at DESC", (participant_sub,))
    return [_row_to_dict(r) for r in cur.fetchall()]
```

- [ ] **Step 5: Add `iter_response_rows_for_participant` to `store/export.py`** (append)

```python
def iter_response_rows_for_participant(conn: psycopg.Connection, participant_sub: str) -> Iterator[dict]:
    """Yield every Schema 5 Response collected for one participant, flattened from the outbox.
    Same shape as iter_response_rows but scoped to session.participant_sub."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.participant_sub = %s AND o.kind = 'responses' ORDER BY o.id", (participant_sub,))
    for (payload,) in cur:
        if isinstance(payload, dict) and "responses" in payload:
            yield from payload["responses"]
        else:
            yield payload
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_my_data_store.py -q`
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/api/identity.py viewer-service/src/viewer_service/store/sessions.py viewer-service/src/viewer_service/store/export.py viewer-service/tests/test_my_data_store.py
git commit -m "feat(vs): participant-scoped session list + response iterator + require_participant"
```

---

### Task 2: VS `me` endpoints

**Files:**
- Create: `viewer-service/src/viewer_service/api/me.py`
- Modify: `viewer-service/src/viewer_service/api/app.py` (include router)
- Create: `viewer-service/tests/test_my_data_api.py`

**Interfaces:**
- Consumes: `require_participant`, `list_sessions_for_participant`, `iter_response_rows_for_participant`, `export_csv.response_columns`/`to_csv`, the conftest `auth_header`/`client`/`conn`.
- Produces: `GET /v1/me/sessions`, `GET /v1/me/responses.csv`.

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_my_data_api.py`)

```python
import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore


def _seed(pg_url, sub, sid):
    with psycopg.connect(pg_url) as c:
        sstore.insert_session(
            c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
            deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=sub,
            instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
            token_hash="h_" + sid, initial_locale="en", last_active_locale="en")
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES (%s,'responses',%s,%s)",
                  (sid, Jsonb({"session_id": sid, "responses": [{"id": "r_" + sid, "value": 1}]}),
                   "sha_" + sid))
        c.commit()


def test_my_sessions_scoped_to_caller(client, auth_header, pg_url):
    _seed(pg_url, "alice", "sA")
    _seed(pg_url, "bob", "sB")
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/sessions", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200
    sids = [s["session_id"] for s in r.json()["sessions"]]
    assert sids == ["sA"]                                  # bob's session excluded
    s0 = r.json()["sessions"][0]
    assert s0["instrument_id"] == "qst_x" and s0["status"] == "submitted"


def test_my_sessions_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/sessions").status_code == 401


def test_my_responses_csv_scoped(client, auth_header, pg_url):
    _seed(pg_url, "alice", "sA")
    _seed(pg_url, "bob", "sB")
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/responses.csv", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    body = r.text
    assert "id" in body.splitlines()[0]                    # BDM header present
    assert "r_sA" in body and "r_sB" not in body           # only alice's responses


def test_my_responses_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/responses.csv").status_code == 401


def test_my_responses_empty_is_header_only(client, auth_header):
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/responses.csv", headers=auth_header(["participant"], sub="nobody"))
    assert r.status_code == 200
    assert len(r.text.strip().splitlines()) == 1           # header row only
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_my_data_api.py -q`
Expected: FAIL (404s — `/v1/me/*` not registered).

- [ ] **Step 3: Write `api/me.py`**

```python
import psycopg
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from .deps import get_conn
from .identity import require_participant
from ..config import get_settings
from .. import export_csv
from ..store import sessions as session_store
from ..store import export as export_store

router = APIRouter()


@router.get("/me/sessions")
def my_sessions(conn=Depends(get_conn), claims=Depends(require_participant)):
    rows = session_store.list_sessions_for_participant(conn, claims["sub"])
    return {"sessions": [{
        "session_id": r["session_id"], "instrument_id": r["instrument_id"],
        "instrument_version": r["instrument_version"], "deployment_id": r["deployment_id"],
        "status": r["status"], "session_index": r["session_index"],
        "started_at": r["started_at"].isoformat() if r["started_at"] else None,
        "completed_at": r["completed_at"].isoformat() if r["completed_at"] else None,
        "submitted_at": r["submitted_at"].isoformat() if r["submitted_at"] else None,
    } for r in rows]}


@router.get("/me/responses.csv")
def my_responses(claims=Depends(require_participant)):
    sub = claims["sub"]
    columns = export_csv.response_columns(str(get_settings().schemas_dir))

    def stream():
        with psycopg.connect(get_settings().database_url) as c:
            yield from export_csv.to_csv(export_store.iter_response_rows_for_participant(c, sub), columns)

    return StreamingResponse(stream(), media_type="text/csv", headers={
        "Content-Disposition": 'attachment; filename="my_responses.csv"'})
```

- [ ] **Step 4: Include the router in `api/app.py`** — alongside the other route includes inside `create_app`:

```python
    from . import me as me_routes
    app.include_router(me_routes.router, prefix="/v1")
```

(Match the file's existing import/include style.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_my_data_api.py -q`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/me.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_my_data_api.py
git commit -m "feat(vs): /v1/me/sessions + /v1/me/responses.csv (participant self-scoped)"
```

---

### Task 3: Web Viewer — `mydata` client

**Files:**
- Create: `web-viewer/src/mydata/client.ts`
- Create: `web-viewer/src/mydata/client.test.ts`

**Interfaces:**
- Produces: `MySession` type; `fetchMySessions(vsBaseUrl, token) -> Promise<SessionsResult>` (`{ok:true, sessions} | {ok:false, error:'unauthorized'|'network'}`); `downloadMyData(vsBaseUrl, token) -> Promise<void>` (authenticated fetch → blob → `<a download="my_responses.csv">`).

- [ ] **Step 1: Write the failing test** (`web-viewer/src/mydata/client.test.ts`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { fetchMySessions, downloadMyData } from './client'

beforeEach(() => { vi.restoreAllMocks() })

test('fetchMySessions sends the bearer token and returns sessions', async () => {
  const sessions = [{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v1', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }]
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sessions }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await fetchMySessions('http://vs', 'TOK')
  expect(res).toEqual({ ok: true, sessions })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/me/sessions')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer TOK' })
})

test('fetchMySessions maps 401 to unauthorized', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect(await fetchMySessions('http://vs', 'TOK')).toEqual({ ok: false, error: 'unauthorized' })
})

test('downloadMyData fetches with the bearer token and creates an object URL', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('id\nr1\n', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const createObjectURL = vi.fn().mockReturnValue('blob:x')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
  await downloadMyData('http://vs', 'TOK')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs/v1/me/responses.csv')
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer TOK' })
  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- mydata/client`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `web-viewer/src/mydata/client.ts`**

```typescript
export type MySession = {
  session_id: string; instrument_id: string; instrument_version: string; deployment_id: string
  status: string; session_index: number
  started_at: string | null; completed_at: string | null; submitted_at: string | null
}
export type SessionsResult = { ok: true; sessions: MySession[] } | { ok: false; error: 'unauthorized' | 'network' }

export async function fetchMySessions(vsBaseUrl: string, token: string): Promise<SessionsResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/me/sessions`, { headers: { authorization: `Bearer ${token}` } })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, sessions: (await resp.json()).sessions ?? [] }
  if (resp.status === 401) return { ok: false, error: 'unauthorized' }
  return { ok: false, error: 'network' }
}

export async function downloadMyData(vsBaseUrl: string, token: string): Promise<void> {
  const resp = await fetch(`${vsBaseUrl}/v1/me/responses.csv`, { headers: { authorization: `Bearer ${token}` } })
  if (!resp.ok) throw new Error(`download failed: ${resp.status}`)
  const blob = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'my_responses.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- mydata/client`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/mydata/client.ts web-viewer/src/mydata/client.test.ts
git commit -m "feat(web-viewer): mydata client (fetchMySessions + downloadMyData)"
```

---

### Task 4: Web Viewer — `MyDataApp` portal + `mydata` entry

**Files:**
- Create: `web-viewer/mydata.html`
- Create: `web-viewer/src/mydata/main.tsx`
- Modify: `web-viewer/vite.config.ts` (add the `mydata` entry to prod + dev input)
- Create: `web-viewer/src/mydata/MyDataApp.tsx`
- Create: `web-viewer/src/mydata/MyDataApp.test.tsx`

**Interfaces:**
- Consumes: `fetchMySessions`/`downloadMyData` (Task 3), `loginParticipant` (`../app/auth`), `LoginView` (`../app/chrome/LoginView`), `parseParams` (`../app/bootstrap`).
- Produces: `MyDataApp` (default-exported React component) + the `mydata.html` build entry.

- [ ] **Step 1: Write the failing test** (`web-viewer/src/mydata/MyDataApp.test.tsx`)

```typescript
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyDataApp } from './MyDataApp'

beforeEach(() => { vi.restoreAllMocks() })

function stubFlow(sessions: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 })
    if (url.endsWith('/v1/me/sessions')) return new Response(JSON.stringify({ sessions }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
}

test('logs in then lists the participant sessions', async () => {
  stubFlow([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v26.0101', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  render(<MyDataApp />)
  expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/qst_x/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument()
})

test('shows an empty state when there are no sessions', async () => {
  stubFlow([])
  render(<MyDataApp />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(await screen.findByText(/no completed questionnaires yet/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- mydata/MyDataApp`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `web-viewer/src/mydata/MyDataApp.tsx`**

```tsx
import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { loginParticipant } from '../app/auth'
import { LoginView } from '../app/chrome/LoginView'
import { fetchMySessions, downloadMyData, type MySession } from './client'

export function MyDataApp() {
  const params = parseParams(window.location.search)
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function handleLogin(email: string, password: string) {
    setBusy(true); setLoginErr(null)
    const res = await loginParticipant(params.identityBaseUrl, email, password)
    if (!res.ok) {
      setBusy(false)
      setLoginErr(res.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again')
      return
    }
    setToken(res.accessToken)
    const list = await fetchMySessions(params.vsBaseUrl, res.accessToken)
    setBusy(false)
    setLoaded(true)
    if (list.ok) setSessions(list.sessions)
  }

  if (!token) return <LoginView onSubmit={handleLogin} error={loginErr} busy={busy} />

  return (
    <main className="min-h-screen px-6 py-8 font-theme max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My data</h1>
      {loaded && sessions.length === 0 ? (
        <p className="text-slate-600">No completed questionnaires yet.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {sessions.map((s) => (
            <li key={s.session_id} className="border rounded p-3">
              <div className="font-medium">{s.instrument_id} <span className="text-slate-400">{s.instrument_version}</span></div>
              <div className="text-sm text-slate-500">{s.status} · session {s.session_index}{s.submitted_at ? ` · ${s.submitted_at}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
      <button
        className="qv-button qv-focusable px-5 py-2.5"
        onClick={() => { void downloadMyData(params.vsBaseUrl, token).catch((e) => console.error(e)) }}>
        Download my data (CSV)
      </button>
    </main>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- mydata/MyDataApp`
Expected: 2 passed.

- [ ] **Step 5: Add the entry HTML + mount + Vite input**

Create `web-viewer/mydata.html` (mirror `gallery.html`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My data</title>
  </head>
  <body>
    <div id="mydata-root"></div>
    <script type="module" src="/src/mydata/main.tsx"></script>
  </body>
</html>
```

Create `web-viewer/src/mydata/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client'
import { MyDataApp } from './MyDataApp'
import '../index.css'

createRoot(document.getElementById('mydata-root')!).render(<MyDataApp />)
```

In `web-viewer/vite.config.ts`, add the `mydata` entry to BOTH input branches:

```typescript
          input: mode === 'production'
            ? { main: resolve(__dirname, 'index.html'), mydata: resolve(__dirname, 'mydata.html') }
            : { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html'), mydata: resolve(__dirname, 'mydata.html') },
```

- [ ] **Step 6: Build to confirm the entry compiles**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm run build`
Expected: clean build; `dist/mydata.html` emitted.

- [ ] **Step 7: Commit**

```bash
git add web-viewer/mydata.html web-viewer/src/mydata/main.tsx web-viewer/vite.config.ts web-viewer/src/mydata/MyDataApp.tsx web-viewer/src/mydata/MyDataApp.test.tsx
git commit -m "feat(web-viewer): MyDataApp portal + mydata.html entry (login → list → download)"
```

---

### Task 5: Full-suite gate + docs

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full VS suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pass (existing + the 2 new PP-C test files). Capture the total. If a pre-existing test breaks for a reason unrelated to the additive `me` router / store fns, STOP and report BLOCKED with output.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build with `dist/mydata.html`. Capture totals.

- [ ] **Step 3: Update `viewer-service/README.md` + `FOLLOWUPS.md`.** README: document `GET /v1/me/sessions` + `GET /v1/me/responses.csv` (require an Identity Bearer token, return ONLY the caller's data scoped to `sub`; BDM CSV; invite participants excluded by namespacing). FOLLOWUPS: human questionnaire titles (Library lookup); JSON download; participant response erasure ("delete my data"); outbox retention affects what "my data" can return.

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md`.** README: document the `mydata.html` portal (a participant logs in to see + download their own data; `?identity_url=`/`?viewer_url=` params). FOLLOWUPS: portal is login-only (no register); merges with PP-D pick-a-questionnaire into one participant home later; no human titles yet.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs(pp): document my-data endpoints + the MyData portal; record PP-C FOLLOWUPS; PP-C complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 strict self-scope (`participant_sub = claims["sub"]`; invite excluded) → Task 1 (store queries) + Task 2 (endpoints use `claims["sub"]`) + tests (scoping). ✓
- §2 CSV reuse + participant iterator → Task 1 (`iter_response_rows_for_participant`) + Task 2 (`to_csv`). ✓
- §2 session list fields → Task 2 (`my_sessions` projection) + test. ✓
- §2 `require_participant` (401) → Task 1 + tests. ✓
- §2 second Vite entry → Task 4 (mydata.html + main.tsx + vite input). ✓
- §3 units (identity dep / store / export iter / api/me / app include / client / MyDataApp / entry) → Tasks 1–4. ✓
- §5 endpoints (me/sessions, me/responses.csv; 401; empty → header-only) → Task 2 + tests. ✓
- §6 security (id only from token; parameterized; read-only) → Tasks 1,2. ✓
- §7 testing (store scoping; api auth matrix; client; MyDataApp + empty; build) → Tasks 1–4. ✓
- §8 deliverable gate → Task 5. ✓
- §1 out-of-scope honored (no titles/JSON/erasure/invite-access/PP-D merge/identity change). ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every code step carries complete code or an exact edit (the Vite input edit shows the full replacement lines). The empty-state copy ("No completed questionnaires yet.") is concrete and matched by the test's `/no completed questionnaires yet/i`.

**3. Type consistency:** `require_participant` (Task 1) consumed by `api/me.py` (Task 2). `list_sessions_for_participant`/`iter_response_rows_for_participant` (Task 1) consumed by Task 2. `export_csv.response_columns`/`to_csv` (existing) used in Task 2 exactly as the researcher export does. `MySession`/`fetchMySessions`/`downloadMyData` (Task 3) consumed by `MyDataApp` (Task 4). `loginParticipant`/`LoginView`/`parseParams` reused from PP-A with their existing signatures. The session-list JSON keys (Task 2) match the `MySession` fields (Task 3) and the MyDataApp rendering (Task 4: `instrument_id`, `instrument_version`, `status`, `session_index`, `submitted_at`). Consistent.

One execution note: the `_seed`/`_session` test helpers use `store.sessions.insert_session(..., participant_sub=...)` (added in PP-A) and a raw `outbox` INSERT with a `Jsonb` payload — both match the live schema (`outbox(session_id, kind, payload, payload_sha256, …)`). The `conn`/`pg_url`/`client`/`auth_header` fixtures are the existing VS conftest ones.
