# PP-A — Authenticated participant sessions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a participant log in (Identity) so the Viewer Service tags their completion session with their stable user id, with returning participants accumulating sessions under one id.

**Architecture:** Add an `authenticated` deployment mode to the Viewer Service; on `POST /v1/sessions/new` for such a deployment, verify an Identity access token (reusing ID-B's `api/identity.py` verifier) and record `participant_sub` (= `agent_id`) with a per-participant `session_index`. The Web Viewer gains a login screen driven by a `401 auth_required` mint response. The Identity token is used only at mint; the existing session token carries the rest.

**Tech Stack:** viewer-service (FastAPI, raw psycopg3, PyJWT via ID-B), web-viewer (Vite/React19/TS, vitest), Identity (ID-A, frozen). testcontainers Postgres for VS tests.

## Global Constraints

- New deployment preset `authenticated` → dimensions `{auth: "identity", persistence: "persisted", lifecycle: "standard", rendering_context: "standalone"}`. Existing `anonymous_link`/`demo` unchanged.
- Auth is per-deployment: `auth == "identity"` REQUIRES a valid Identity token (else `401 auth_required`); `auth == "none"` stays anonymous and IGNORES any token.
- Token verification reuses `viewer_service.api.identity` (ID-B): audience `questionnaire-apps`, issuer/JWKS from config. **Role-agnostic** — any valid Identity access token suffices (the verified `sub` is what matters).
- For an authenticated session: `participant_sub = agent_id = claims["sub"]`; `session_index = count_sessions_for_agent(agent_id) + 1`. For anonymous: `participant_sub = NULL`, `agent_id = "agent_"+uuid4hex[:8]`, `session_index = 1`.
- The mint response gains `participant_sub` (null for anonymous). The `401` body is `{"error":{"code":"auth_required","message":...}}` (explicit JSONResponse, like the other mint-gate errors).
- The Identity token is sent only on `POST /v1/sessions/new` (`Authorization: Bearer <access token>`); all later calls keep using the opaque session token. No web-viewer refresh logic.
- Raw psycopg3, no ORM; new column added idempotently (CREATE column + `ALTER … ADD COLUMN IF NOT EXISTS`). VS tests: own pytest invocation, `DOCKER_CONFIG=/tmp/lib_docker`. venv uv-managed (`.venv/bin/python -m pytest`/`-m pip`). web-viewer: `cd web-viewer && npm test`.
- No changes to `identity-service/` (frozen) or to session resume. TDD; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-22-participant-pp-a-design.md`.

---

### Task 1: VS foundation — `authenticated` preset + `participant_sub` column + store helpers

**Files:**
- Modify: `viewer-service/src/viewer_service/modes.py`
- Modify: `viewer-service/src/viewer_service/store/schema.sql`
- Modify: `viewer-service/src/viewer_service/store/sessions.py`
- Create: `viewer-service/tests/test_pp_foundation.py`

**Interfaces:**
- Produces: `modes.PRESETS["authenticated"]`; `session.participant_sub` column; `store.sessions.insert_session(..., participant_sub=None, ...)`; `store.sessions.count_for_agent(conn, agent_id) -> int`; `participant_sub` in `_SELECT_COLS` (so `get_session` returns it).

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_pp_foundation.py`)

```python
from viewer_service.modes import resolve_preset
from viewer_service.store import sessions as sstore


def test_authenticated_preset_resolves_identity_auth():
    dims = resolve_preset("authenticated")
    assert dims == {"auth": "identity", "persistence": "persisted",
                    "lifecycle": "standard", "rendering_context": "standalone"}


def _insert(conn, sid, agent, idx, participant_sub=None):
    sstore.insert_session(
        conn, ephemeral=False, participant_sub=participant_sub, session_id=sid, session_index=idx,
        deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=agent,
        instrument_id="qst_x", instrument_version="v26.0101", status="in_progress",
        token_hash="h" + sid, initial_locale="en", last_active_locale="en")


def test_participant_sub_persists_and_reads(conn):
    _insert(conn, "s1", "u-alice", 1, participant_sub="u-alice")
    got = sstore.get_session(conn, "s1")
    assert got["participant_sub"] == "u-alice"


def test_participant_sub_defaults_null_for_anonymous(conn):
    _insert(conn, "s2", "agent_abc", 1)
    assert sstore.get_session(conn, "s2")["participant_sub"] is None


def test_count_for_agent(conn):
    _insert(conn, "s3", "u-bob", 1, participant_sub="u-bob")
    _insert(conn, "s4", "u-bob", 2, participant_sub="u-bob")
    _insert(conn, "s5", "agent_z", 1)
    assert sstore.count_for_agent(conn, "u-bob") == 2
    assert sstore.count_for_agent(conn, "nobody") == 0
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_pp_foundation.py -q`
Expected: FAIL (`UnsupportedPreset` / missing column / `count_for_agent` undefined).

- [ ] **Step 3: Add the preset to `modes.py`** — add this entry to the `PRESETS` dict (after `demo`):

```python
    "authenticated": {"auth": "identity", "persistence": "persisted",
                      "lifecycle": "standard", "rendering_context": "standalone"},
```

- [ ] **Step 4: Add the column to `store/schema.sql`** — (a) add `participant_sub text` to the `session` `CREATE TABLE` column list (after `agent_id text NOT NULL,` add `participant_sub text,`); (b) append an idempotent ALTER at the end of the file (after the session table block) for existing databases:

```sql
ALTER TABLE session ADD COLUMN IF NOT EXISTS participant_sub text;
```

- [ ] **Step 5: Update `store/sessions.py`** — make `insert_session` accept `participant_sub` (default None) without changing `_INSERT_COLS`; add it to `_SELECT_COLS`; add `count_for_agent`.

Replace `insert_session` with:

```python
def insert_session(conn: psycopg.Connection, ephemeral: bool = False,
                   participant_sub: str | None = None, **fields) -> None:
    cols = ", ".join(_INSERT_COLS + ("participant_sub", "ephemeral"))
    placeholders = ", ".join(["%s"] * (len(_INSERT_COLS) + 2))
    conn.execute(f"INSERT INTO session ({cols}) VALUES ({placeholders})",
                 tuple(fields[c] for c in _INSERT_COLS) + (participant_sub, ephemeral))
```

Add `"participant_sub"` to the end of the `_SELECT_COLS` tuple (so `_row_to_dict`/`get_session` include it). Then add:

```python
def count_for_agent(conn: psycopg.Connection, agent_id: str) -> int:
    return conn.execute("SELECT count(*) FROM session WHERE agent_id=%s",
                        (agent_id,)).fetchone()[0]
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_pp_foundation.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/modes.py viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/sessions.py viewer-service/tests/test_pp_foundation.py
git commit -m "feat(vs): authenticated deployment preset + session.participant_sub + count_for_agent"
```

---

### Task 2: VS mint participant-auth path

**Files:**
- Modify: `viewer-service/src/viewer_service/api/identity.py` (add `verify_participant`)
- Modify: `viewer-service/src/viewer_service/sessions.py` (`new_session` participant branch)
- Modify: `viewer-service/src/viewer_service/api/sessions.py` (`new` handler reads dimension + 401)
- Create: `viewer-service/tests/test_pp_session_auth.py`

**Interfaces:**
- Consumes: `modes`/preset, `store.sessions.count_for_agent`, `insert_session(participant_sub=...)`, the ID-B `api/identity._claims` + `JwksCache`, the conftest `auth_header(roles, *, sub=...)` fixture.
- Produces: `api.identity.verify_participant(authorization) -> dict | None`; `sessions.new_session(..., participant_claims: dict | None = None)`; `POST /v1/sessions/new` honoring `auth: identity` (401 `auth_required` / tagged session).

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_pp_session_auth.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod

BUNDLE = {
    "definition": {"metadata": {"id": "qst_mini", "version": "v26.0609", "title": "M",
                                "description": "d", "language": "en"},
                   "pages": [{"id": "page_1", "elements": [
                       {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}},
                        "option": {"ref": "opt_1@v26.0609"}}]}]},
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}]}}},
    },
}
_MANIFEST = {"viewer_id": "web", "viewer_version": "v26.0610",
             "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
             "evaluator": {"language_version": "v1.0", "functions": ["if"]},
             "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}


@pytest.fixture
def auth_dep(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)  # default client carries a researcher token
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"],
        "mode_preset": "authenticated"}).json()
    return client, dep["deployment_id"]


def _mint(client, dep_id, headers=None):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"},
        headers=headers or {})


def test_authenticated_deploy_requires_token(auth_dep):
    client, dep_id = auth_dep
    r = _mint(client, dep_id)                         # no Authorization header
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "auth_required"


def test_invalid_token_rejected(auth_dep):
    client, dep_id = auth_dep
    r = _mint(client, dep_id, {"Authorization": "Bearer junk"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "auth_required"


def test_valid_token_tags_session(auth_dep, auth_header):
    client, dep_id = auth_dep
    r = _mint(client, dep_id, auth_header(["participant"], sub="alice-1"))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_sub"] == "alice-1" and body["agent_id"] == "alice-1"
    assert body["session_index"] == 1


def test_returning_participant_increments_index(auth_dep, auth_header):
    client, dep_id = auth_dep
    h = auth_header(["participant"], sub="bob-2")
    _mint(client, dep_id, h)
    second = _mint(client, dep_id, h).json()
    assert second["session_index"] == 2 and second["participant_sub"] == "bob-2"


def test_anonymous_deploy_ignores_token(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()  # default anonymous_link
    # no token → still mints anonymously
    r = _mint(client, dep["deployment_id"])
    assert r.status_code == 201 and r.json()["participant_sub"] is None
    # a token is ignored (still anonymous)
    r2 = _mint(client, dep["deployment_id"], auth_header(["participant"], sub="ignored"))
    assert r2.status_code == 201 and r2.json()["participant_sub"] is None
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_pp_session_auth.py -q`
Expected: FAIL (authenticated deploy mints without a token / no `participant_sub` in response).

- [ ] **Step 3: Add `verify_participant` to `api/identity.py`** (append)

```python
def verify_participant(authorization: str | None) -> dict | None:
    """Return claims if a valid Identity access token is present (any role), else None.
    Used by the session-mint path of an `auth: identity` deployment."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    s = get_settings()
    try:
        return verify(token, jwks=_get_cache(), audience=s.identity_audience, issuer=s.identity_issuer)
    except Exception:
        return None
```

- [ ] **Step 4: Update `sessions.py` `new_session`** — add a `participant_claims` param and branch the identity fields. Replace the `new_session` signature + the `agent_id`/`session_index`/`insert_session`/return lines:

```python
def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None, participant_claims: dict | None = None) -> dict:
    """Gate against the active window + quota, mint the runtime, allocate session + token.
    For an `auth: identity` deployment, tag the session with the participant's Identity sub."""
    session_count = session_store.count_for_deployment(conn, deployment["deployment_id"])
    deploy_svc.check_deployable(deployment, datetime.now(timezone.utc), session_count)
    runtime = mint_runtime(conn, deployment, viewer, requested_locale)
    locale = runtime["locale"]
    session_id = str(uuid.uuid4())
    token = tokens.mint_token()
    auth_mode = (deployment.get("dimensions") or {}).get("auth", "none")
    if auth_mode == "identity" and participant_claims is not None:
        participant_sub = participant_claims["sub"]
        agent_id = participant_sub
        session_index = session_store.count_for_agent(conn, agent_id) + 1
    else:
        participant_sub = None
        agent_id = "agent_" + uuid.uuid4().hex[:8]
        session_index = 1
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    ephemeral = (deployment.get("dimensions") or {}).get("persistence") == "ephemeral"
    session_store.insert_session(
        conn, ephemeral=ephemeral, participant_sub=participant_sub, session_id=session_id,
        session_index=session_index, deployment_id=deployment["deployment_id"], viewer_id=viewer_id,
        viewer_version=viewer_version, agent_id=agent_id, instrument_id=qst_id,
        instrument_version=qst_version, status="in_progress", token_hash=tokens.hash_token(token),
        initial_locale=locale, last_active_locale=locale)
    conn.commit()
    theme = themes_store.get_theme(conn, deployment["theme_id"]) if deployment.get("theme_id") else None
    return {"session_id": session_id, "session_token": token, "runtime": runtime, "theme": theme,
            "agent_id": agent_id, "session_index": session_index, "ephemeral": ephemeral,
            "participant_sub": participant_sub}
```

- [ ] **Step 5: Update the `new` handler in `api/sessions.py`** — read the deployment's auth dimension and verify the participant token. Add the `Header` import + the `identity` import at the top:

```python
from fastapi import APIRouter, Depends, HTTPException, Header
from . import identity
```

Replace the `new` handler body's try-block lead so it computes `participant_claims` first:

```python
@router.post("/sessions/new", status_code=201)
def new(body: SessionNew, authorization: str | None = Header(default=None), conn=Depends(get_conn)):
    dep = dep_store.get_deployment(conn, body.deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    viewer = viewer_store.get_viewer(conn, body.viewer_id, body.viewer_version)
    if viewer is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    participant_claims = None
    if (dep.get("dimensions") or {}).get("auth") == "identity":
        participant_claims = identity.verify_participant(authorization)
        if participant_claims is None:
            return JSONResponse(status_code=401, content={"error": {
                "code": "auth_required", "message": "this deployment requires participant login"}})
    try:
        return sessions_svc.new_session(conn, dep, viewer, body.viewer_id, body.viewer_version,
                                        body.locale, participant_claims)
    except deploy_svc.DeploymentClosed:
        return JSONResponse(status_code=410, content={"error": {"code": "gone", "message": "deployment is closed (past active_until)"}})
    except deploy_svc.NotYetOpen:
        return JSONResponse(status_code=409, content={"error": {"code": "not_yet_open", "message": "deployment is not yet open (before active_from)"}})
    except deploy_svc.QuotaExhausted:
        return JSONResponse(status_code=409, content={"error": {"code": "quota_exhausted", "message": "deployment session quota reached"}})
    except PreflightError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "preflight_failed", "message": "runtime pre-flight failed",
            "detail": [{"kind": p.kind, "where": p.where, "detail": p.detail} for p in e.problems]}})
    except LibraryError as e:
        raise HTTPException(status_code=e.status, detail=e.message)
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_pp_session_auth.py -q`
Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/api/identity.py viewer-service/src/viewer_service/sessions.py viewer-service/src/viewer_service/api/sessions.py viewer-service/tests/test_pp_session_auth.py
git commit -m "feat(vs): authenticated session mint — verify participant token, tag participant_sub + agent_id + session_index"
```

---

### Task 3: Web Viewer bootstrap — token-carrying mint + `auth_required` + identity URL

**Files:**
- Modify: `web-viewer/src/app/bootstrap.ts`
- Modify: `web-viewer/src/app/bootstrap.test.ts`

**Interfaces:**
- Produces: `parseParams(...).identityBaseUrl`; `mintSession(vsBaseUrl, deploymentId, locale, accessToken?)` (sends `Authorization` when a token is given); `MintErr` gains kind `'auth_required'`; `MintOk` gains `participant_sub: string | null`.

- [ ] **Step 1: Write the failing tests** (append to `web-viewer/src/app/bootstrap.test.ts`)

```typescript
test('parseParams reads identity_url', () => {
  expect(parseParams('?deployment=d&identity_url=http://id:7').identityBaseUrl).toBe('http://id:7')
})

test('mintSession sends Authorization when a token is given', async () => {
  const ok = { session_id: 's', session_token: 't', agent_id: 'alice', session_index: 1,
               runtime: {}, theme: null, ephemeral: false, participant_sub: 'alice' }
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await mintSession('http://vs', 'dpl_1', null, 'tok-123')
  expect(res).toMatchObject({ ok: true, participant_sub: 'alice' })
  const [, init] = fetchMock.mock.calls[0]
  expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer tok-123' })
})

test('mintSession maps 401 auth_required to kind auth_required', async () => {
  const body = { error: { code: 'auth_required', message: 'login' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 401 })))
  const res = await mintSession('http://vs', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind: 'auth_required', code: 'auth_required' })
})
```

(Note: the existing `mintSession` happy-path test asserts the body has no `authorization` header when no token is passed — keep that working by only adding the header when `accessToken` is truthy.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- bootstrap`
Expected: FAIL (`identityBaseUrl` undefined; no auth header; 401 maps to `failed` not `auth_required`).

- [ ] **Step 3: Update `bootstrap.ts`**

In `Params` add `identityBaseUrl: string`, and in `parseParams` return add:

```typescript
    identityBaseUrl: q.get('identity_url') ?? import.meta.env.VITE_IDENTITY_BASE_URL ?? 'http://localhost:8100',
```

In `MintOk` add `participant_sub: string | null`. In `MintErr` widen the kind union to include `'auth_required'`:

```typescript
export type MintErr = { ok: false; kind: 'invalid_link' | 'not_open' | 'closed' | 'auth_required' | 'failed'; code: string }
```

Replace `mintSession` with the token-aware version:

```typescript
export async function mintSession(vsBaseUrl: string, deploymentId: string, locale: string | null, accessToken?: string): Promise<MintResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/sessions/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        deployment_id: deploymentId, viewer_id: VIEWER_ID, viewer_version: VIEWER_VERSION,
        ...(locale ? { locale } : {}),
      }),
    })
  } catch {
    return { ok: false, kind: 'failed', code: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, session_id: body.session_id, session_token: body.session_token, agent_id: body.agent_id, session_index: body.session_index, runtime: body.runtime, theme: body.theme ?? null, ephemeral: body.ephemeral ?? false, participant_sub: body.participant_sub ?? null }
  }
  const code = await resp.json().then((b) => b?.error?.code ?? String(resp.status)).catch(() => String(resp.status))
  const kind: MintErr['kind'] = code === 'auth_required' ? 'auth_required' : (KIND_BY_STATUS[resp.status] ?? 'failed')
  return { ok: false, kind, code }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- bootstrap`
Expected: all bootstrap tests pass (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/bootstrap.ts web-viewer/src/app/bootstrap.test.ts
git commit -m "feat(web-viewer): mintSession carries an access token; auth_required mint kind; identity_url param"
```

---

### Task 4: Web Viewer — participant login (`auth.ts` + `LoginView`)

**Files:**
- Create: `web-viewer/src/app/auth.ts`
- Create: `web-viewer/src/app/auth.test.ts`
- Create: `web-viewer/src/app/chrome/LoginView.tsx`
- Create: `web-viewer/src/app/chrome/LoginView.test.tsx`

**Interfaces:**
- Produces: `loginParticipant(identityBaseUrl, email, password) -> Promise<LoginResult>` where `LoginResult = {ok: true, accessToken: string} | {ok: false, error: 'invalid_credentials' | 'network'}`; `<LoginView onSubmit={(email,password)=>void} error={string|null} busy={boolean} />`.

- [ ] **Step 1: Write the failing tests**

`web-viewer/src/app/auth.test.ts`:

```typescript
import { test, expect, vi } from 'vitest'
import { loginParticipant } from './auth'

test('loginParticipant posts credentials with the questionnaire-apps audience', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await loginParticipant('http://id:8', 'a@e.com', 'pw')
  expect(res).toEqual({ ok: true, accessToken: 'AT' })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://id:8/v1/auth/login')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'a@e.com', password: 'pw', audience: 'questionnaire-apps' })
})

test('loginParticipant maps 401 to invalid_credentials', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  expect(await loginParticipant('http://id', 'a@e.com', 'bad')).toEqual({ ok: false, error: 'invalid_credentials' })
})

test('loginParticipant maps network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
  expect(await loginParticipant('http://id', 'a@e.com', 'pw')).toEqual({ ok: false, error: 'network' })
})
```

`web-viewer/src/app/chrome/LoginView.test.tsx`:

```typescript
import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from './LoginView'

test('LoginView submits the entered email and password', async () => {
  const onSubmit = vi.fn()
  render(<LoginView onSubmit={onSubmit} error={null} busy={false} />)
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  expect(onSubmit).toHaveBeenCalledWith('a@e.com', 'pw')
})

test('LoginView shows an error message', () => {
  render(<LoginView onSubmit={() => {}} error="Invalid email or password" busy={false} />)
  expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- auth LoginView`
Expected: FAIL (modules don't exist).

- [ ] **Step 3: Write `web-viewer/src/app/auth.ts`**

```typescript
export type LoginResult = { ok: true; accessToken: string } | { ok: false; error: 'invalid_credentials' | 'network' }

const AUDIENCE = 'questionnaire-apps'

export async function loginParticipant(identityBaseUrl: string, email: string, password: string): Promise<LoginResult> {
  let resp: Response
  try {
    resp = await fetch(`${identityBaseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, audience: AUDIENCE }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, accessToken: body.access_token }
  }
  if (resp.status === 401) return { ok: false, error: 'invalid_credentials' }
  return { ok: false, error: 'network' }
}
```

- [ ] **Step 4: Write `web-viewer/src/app/chrome/LoginView.tsx`**

```tsx
import { useState } from 'react'

type Props = { onSubmit: (email: string, password: string) => void; error: string | null; busy: boolean }

export function LoginView({ onSubmit, error, busy }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div className="qv-login">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }}>
        <h1>Log in to continue</h1>
        <label htmlFor="qv-login-email">Email</label>
        <input id="qv-login-email" type="email" autoComplete="username" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="qv-login-password">Password</label>
        <input id="qv-login-password" type="password" autoComplete="current-password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- auth LoginView`
Expected: all pass (3 auth + 2 LoginView).

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/app/auth.ts web-viewer/src/app/auth.test.ts web-viewer/src/app/chrome/LoginView.tsx web-viewer/src/app/chrome/LoginView.test.tsx
git commit -m "feat(web-viewer): participant login (loginParticipant + LoginView)"
```

---

### Task 5: Web Viewer — wire login into the boot flow

**Files:**
- Modify: `web-viewer/src/app/App.tsx`
- Modify: `web-viewer/src/app/App.test.tsx`

**Interfaces:**
- Consumes: `mintSession(..., accessToken?)`, `parseParams().identityBaseUrl`, `loginParticipant`, `LoginView`, the `auth_required` mint kind.
- Produces: the boot orchestration that, on an `auth_required` mint, renders `LoginView`, and after a successful login retries the mint with the token and proceeds.

- [ ] **Step 1: Read the current boot flow.** Read `web-viewer/src/app/App.tsx` — find where `mintSession(...)` is called inside the boot effect, and how the result drives the first render (and where `ErrorScreen` is rendered for `MintErr`). Note the component's state hooks at the top (e.g. `useState`).

- [ ] **Step 2: Write the failing test** (append to `web-viewer/src/app/App.test.tsx`)

Use the file's existing render/mock conventions (it already stubs `fetch` and renders `<App/>`). Add:

```typescript
test('authenticated deployment: 401 shows login, then completes after login', async () => {
  // first mint → 401 auth_required; login → 200; second mint → 201 with a runtime
  const runtime = MINI_RUNTIME // reuse whatever runtime fixture App.test already uses
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(url)
    if (url.endsWith('/v1/sessions/new')) {
      const authed = !!(init?.headers as Record<string,string> | undefined)?.authorization
      return authed
        ? new Response(JSON.stringify({ session_id: 's', session_token: 't', agent_id: 'alice', session_index: 1, runtime, theme: null, ephemeral: false, participant_sub: 'alice' }), { status: 201 })
        : new Response(JSON.stringify({ error: { code: 'auth_required', message: 'login' } }), { status: 401 })
    }
    if (url.endsWith('/v1/auth/login')) return new Response(JSON.stringify({ access_token: 'AT' }), { status: 200 })
    return new Response('{}', { status: 200 })
  }))
  // set the URL so parseParams sees a deployment
  window.history.pushState({}, '', '?deployment=dpl_auth')
  render(<App />)
  // login screen appears
  expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/email/i), 'a@e.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'pw')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))
  // after login, the second mint (with Bearer) runs and the questionnaire renders
  await screen.findByText('Q?')  // the mini runtime's prompt text
  expect(calls.filter((u) => u.endsWith('/v1/sessions/new')).length).toBe(2)
})
```

Adapt `MINI_RUNTIME`/the prompt assertion to the fixture the existing `App.test.tsx` uses (read the file; reuse its runtime shape + a known rendered string). If `App.test.tsx` already imports a runtime fixture and a render helper, use those rather than inventing new ones.

- [ ] **Step 3: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- App`
Expected: FAIL (no login screen appears; only one mint call).

- [ ] **Step 4: Wire the login gate into `App.tsx`.** Make the minimal change to the boot path:

- Add imports: `import { loginParticipant } from './auth'` and `import { LoginView } from './chrome/LoginView'`.
- Add state near the other `useState` hooks:

```typescript
  const [needLogin, setNeedLogin] = useState(false)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const accessTokenRef = useRef<string | undefined>(undefined)
```

- Refactor the boot so the mint is callable with the current token. Where the boot effect currently does `const mint = await mintSession(params.vsBaseUrl, params.deploymentId, params.locale)`, pass the token: `mintSession(params.vsBaseUrl, deploymentId, params.locale, accessTokenRef.current)`. Immediately after the mint result, before the existing error handling, handle the new kind:

```typescript
    if (!mint.ok && mint.kind === 'auth_required') { setNeedLogin(true); return }
```

(The `return` leaves the boot paused; the rest of the boot — pipeline setup, render — proceeds only on a successful mint, as today.)

- Extract the boot body into a callable (e.g. wrap the existing effect body in an async `runBoot()` function and call it from the effect). Add a login handler:

```typescript
  async function handleLogin(email: string, password: string) {
    setLoginBusy(true); setLoginErr(null)
    const res = await loginParticipant(params.identityBaseUrl, email, password)
    setLoginBusy(false)
    if (!res.ok) { setLoginErr(res.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again'); return }
    accessTokenRef.current = res.accessToken
    setNeedLogin(false)
    bootStarted.current = false   // allow the boot to run again, now with the token
    runBoot()
  }
```

- In the render, before the normal renderer, add: `if (needLogin) return <LoginView onSubmit={handleLogin} error={loginErr} busy={loginBusy} />`.

Keep the change surgical: do not alter the anonymous path (no token → `accessTokenRef.current` is `undefined` → `mintSession` omits the header → unchanged behavior). If `runBoot` extraction is awkward given the current effect shape, the equivalent is acceptable as long as: (a) `auth_required` renders `LoginView`, (b) a successful login retries the mint with the Bearer token, (c) the anonymous path is unchanged.

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- App`
Expected: the new test passes; existing App tests stay green.

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/app/App.tsx web-viewer/src/app/App.test.tsx
git commit -m "feat(web-viewer): boot login gate — auth_required renders login, then retries mint with the token"
```

---

### Task 6: Full-suite gate + docs

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full VS suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pass (existing + the 2 new PP test files). If a pre-existing session test breaks because the mint response or `get_session` now includes `participant_sub`, update that assertion to accommodate the additive field (it should not — additive keys don't break `==`-on-subset checks; investigate if so). Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build. Capture totals.

- [ ] **Step 3: Update `viewer-service/README.md` + `FOLLOWUPS.md`.** README: document the `authenticated` mode_preset and that `POST /v1/sessions/new` for it requires `Authorization: Bearer <Identity access token>` (audience `questionnaire-apps`), tags the session with `participant_sub`, and returns `participant_sub`; anonymous deployments unchanged. FOLLOWUPS: record PP-A deferrals — "my data" participant export (PP-C); signed invite links (PP-B); a dedicated `participant` role + self-registration; per-deployment `agent_id` pseudonymisation; concurrent-mint race on `session_index` (count+1 not transactional).

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md`.** README: document the login flow (an `authenticated` deployment prompts for Identity login before the questionnaire; `?identity_url=` / `VITE_IDENTITY_BASE_URL`). FOLLOWUPS: login-only (no self-register screen — PP-B); the access token is used once at mint (no refresh); "my data" view is PP-C.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs(pp): document authenticated participant sessions + login flow; record PP-A FOLLOWUPS; PP-A complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 authenticated preset (`auth: identity`) → Task 1 (modes) + Task 2 (deployment accepts it via resolve_preset; test asserts). ✓
- §2 per-deployment auth (identity requires token / none ignores) → Task 2 handler branch + tests (incl. anonymous-ignores-token). ✓
- §2 role-agnostic verify → Task 2 `verify_participant` (any valid token). ✓
- §2 `agent_id = participant_sub = sub`, `session_index = count+1` → Task 1 (`count_for_agent`) + Task 2 (`new_session` branch) + tests. ✓
- §2 token only at mint → web-viewer sends it only in `mintSession`; later calls unchanged (Tasks 3,5). ✓
- §4 `participant_sub` column (CREATE + idempotent ALTER) → Task 1. ✓
- §5 mint response `participant_sub`; `401 auth_required` JSONResponse → Task 2. ✓
- §5 web-viewer Identity base URL config + login + retry → Tasks 3,4,5. ✓
- §7 tests (VS matrix; web-viewer mint/login/boot) → Tasks 1,2,3,4,5. ✓
- §8 out-of-scope honored (no my-data/invite/role/pseudonymisation/refresh/resume change). ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Task 5 deliberately leaves the exact `runBoot` extraction shape to the implementer (App.tsx is a large existing component) but pins the three observable requirements + a concrete failing test as the gate — this is guidance for integrating into unseen code, not a placeholder for missing logic. The `MINI_RUNTIME`/prompt-string note instructs reuse of the file's existing fixture rather than inventing one.

**3. Type consistency:** `verify_participant(authorization)->dict|None` (Task 2) matches its handler use. `new_session(..., participant_claims=None)` (Task 2) matches the handler call. `insert_session(..., participant_sub=None, ...)` + `count_for_agent` (Task 1) match Task 2's calls. `mintSession(vsBaseUrl, deploymentId, locale, accessToken?)` + `MintOk.participant_sub` + `MintErr` kind `auth_required` (Task 3) match Task 5's boot use. `loginParticipant(identityBaseUrl,email,password)->LoginResult` + `LoginView` props (Task 4) match Task 5. `parseParams().identityBaseUrl` (Task 3) used in Task 5. Consistent.

One execution note: Task 1 adds `participant_sub` to `_SELECT_COLS`, so `get_session` dicts gain a key; Task 6 Step 1 explicitly checks the full VS suite for any exact-shape assertion that this additive key could disturb (none expected — additive keys don't break subset/`in` checks).
