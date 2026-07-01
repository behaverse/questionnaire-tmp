# Viewer Service replay link (#7 RP2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A researcher mints a signed replay link for a session; a token-authorized `GET /v1/replay` assembles `{runtime, statements, mouse}` for that session (the RP1 bundle shape), which the RP1 player replays unchanged.

**Architecture:** A session-scoped HMAC token (mirrors `invites.py`); per-session outbox readers; a bundle-assembly service (`session_runtime` + flattened events + flattened recording); two endpoints (researcher-gated mint + token-authorized bundle). No schema migration; no player code change.

**Tech Stack:** Python, FastAPI, psycopg, pytest + testcontainers. Component `viewer-service/`.

## Global Constraints

- All changes under `viewer-service/`. Do NOT modify web-viewer/, library/, questionnaire-harvester/, or other components. No schema migration (reuse the outbox + existing session/runtime machinery).
- Reuse: `invites.py` HMAC helpers (`_b64u`, `_sign`); `store/sessions.py` `get_session`; `sessions.py` `session_runtime`; `store/deployments.py` `get_deployment`; `config.invite_signing_secret`. Signing reuses `invite_signing_secret` (fails closed on empty).
- Bundle shape returned by `GET /v1/replay`: `{ "runtime": <Runtime>, "statements": <BdmEvent[]>, "mouse": <MouseSample[]> }` — exactly what the RP1 player's `loadBundle` expects.
- Tests run from `viewer-service/` ONLY, with `DOCKER_CONFIG=/tmp/lib_docker` (testcontainers Postgres). Run: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/<test> -q`. If a DB test hangs, `sudo systemctl restart docker`.
- Branch: `work/viewer-service-replay-link`. Finish by merging to master + push (no PRs); `git fetch` + ff/rebase before push (shared checkout). Stage explicit paths only.

---

### Task 1: session-scoped signed token (`replay_links.py`)

**Files:**
- Create: `viewer-service/src/viewer_service/replay_links.py`
- Test: `viewer-service/tests/test_replay_links.py` (new)

**Interfaces:**
- Produces:
  - `mint_replay(secret: str, *, deployment_id: str, session_id: str, ttl: int, now: int | None = None) -> str`
  - `verify_replay(secret: str, token: str | None, now: int | None = None) -> dict | None` — returns `{deployment_id, session_id, exp}` iff HMAC + exp check out, else None; never raises; fails closed on empty secret.

- [ ] **Step 1: Write the failing test** — `tests/test_replay_links.py`

```python
from viewer_service.replay_links import mint_replay, verify_replay

SECRET = "s3cr3t"


def test_round_trip():
    tok = mint_replay(SECRET, deployment_id="dep_1", session_id="sess_1", ttl=100, now=1000)
    p = verify_replay(SECRET, tok, now=1050)
    assert p is not None
    assert p["deployment_id"] == "dep_1" and p["session_id"] == "sess_1" and p["exp"] == 1100


def test_expired_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=10, now=1000)
    assert verify_replay(SECRET, tok, now=1011) is None


def test_tampered_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100, now=1000)
    payload_b64, _, _sig = tok.partition(".")
    assert verify_replay(SECRET, payload_b64 + ".deadbeef", now=1000) is None


def test_wrong_secret_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100, now=1000)
    assert verify_replay("other", tok, now=1000) is None


def test_empty_secret_fails_closed():
    assert verify_replay("", "anything", now=1000) is None
    # minting with an empty secret still produces a string, but it can never verify
    tok = mint_replay("", deployment_id="d", session_id="s", ttl=100, now=1000)
    assert verify_replay("", tok, now=1000) is None


def test_garbage_token_returns_none():
    assert verify_replay(SECRET, None) is None
    assert verify_replay(SECRET, "no-dot") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_links.py -q`
Expected: FAIL — cannot import `replay_links`.

- [ ] **Step 3: Write `src/viewer_service/replay_links.py`**

```python
import hashlib
import hmac
import json
import time

from .invites import _b64u, _b64u_decode, _sign


def mint_replay(secret: str, *, deployment_id: str, session_id: str, ttl: int, now: int | None = None) -> str:
    iat = int(time.time()) if now is None else now
    payload = {"deployment_id": deployment_id, "session_id": session_id, "exp": iat + ttl}
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{payload_b64}.{_sign(secret, payload_b64)}"


def verify_replay(secret: str, token: str | None, now: int | None = None) -> dict | None:
    """Return {deployment_id, session_id, exp} iff the HMAC + exp check out, else None.
    Never raises. Fails closed on an empty secret."""
    if not secret or not token or "." not in token:
        return None
    payload_b64, _, sig = token.partition(".")
    try:
        if not hmac.compare_digest(sig, _sign(secret, payload_b64)):
            return None
        payload = json.loads(_b64u_decode(payload_b64))
    except Exception:
        return None
    t = int(time.time()) if now is None else now
    if not isinstance(payload, dict) or not payload.get("deployment_id") or not payload.get("session_id"):
        return None
    if not isinstance(payload.get("exp"), int) or payload["exp"] <= t:
        return None
    return payload
```

(Imports `_b64u`/`_b64u_decode`/`_sign` from `invites.py` — the `hashlib`/`hmac` imports are only for the `compare_digest` call.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_links.py -q`
Expected: PASS (6 cases). (This test has no DB dependency but the DOCKER_CONFIG env is harmless.)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/replay_links.py viewer-service/tests/test_replay_links.py
git commit -m "feat(viewer-service): session-scoped signed replay token (HMAC)"
```

---

### Task 2: per-session outbox readers (`store/export.py`)

**Files:**
- Modify: `viewer-service/src/viewer_service/store/export.py`
- Test: `viewer-service/tests/test_replay_store.py` (new)

**Interfaces:**
- Produces:
  - `iter_event_rows_for_session(conn, session_id) -> Iterator[dict]` — `kind='events'` payloads for the session, in `outbox.id` order.
  - `iter_recording_rows_for_session(conn, session_id) -> Iterator[dict]` — `kind='recording'` payloads for the session.

- [ ] **Step 1: Write the failing test** — `tests/test_replay_store.py`

```python
import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as export_store


def _seed(c, sid, dep="dep_1"):
    sstore.insert_session(
        c, ephemeral=False, participant_sub="p", session_id=sid, session_index=1,
        deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id="p",
        instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _outbox(c, sid, kind, payload):
    c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,%s,%s,%s)",
              (sid, kind, Jsonb(payload), f"h_{sid}_{kind}"))


def test_events_and_recordings_scoped_to_session(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed(c, "sA"); _seed(c, "sB")
        _outbox(c, "sA", "events", {"batch_id": "b", "events": [{"verb": "bdm:started"}]})
        _outbox(c, "sA", "recording", {"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]})
        _outbox(c, "sA", "responses", {"session_id": "sA", "responses": [{"response_id": "r"}]})
        _outbox(c, "sB", "events", {"batch_id": "b2", "events": [{"verb": "bdm:started"}]})
        c.commit()
        evs = list(export_store.iter_event_rows_for_session(c, "sA"))
        recs = list(export_store.iter_recording_rows_for_session(c, "sA"))
    assert evs == [{"batch_id": "b", "events": [{"verb": "bdm:started"}]}]        # sB + responses excluded
    assert recs == [{"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_store.py -q`
Expected: FAIL — the two functions don't exist.

- [ ] **Step 3: Append to `store/export.py`**

```python
def iter_event_rows_for_session(conn: psycopg.Connection, session_id: str) -> Iterator[dict]:
    """Yield every event batch payload ({batch_id, events:[...]}) for one session; kind='events'; id order."""
    cur = conn.execute(
        "SELECT payload FROM outbox WHERE session_id = %s AND kind = 'events' ORDER BY id", (session_id,))
    for (payload,) in cur:
        yield payload


def iter_recording_rows_for_session(conn: psycopg.Connection, session_id: str) -> Iterator[dict]:
    """Yield every recording payload ({channel, samples}) for one session; kind='recording'; id order."""
    cur = conn.execute(
        "SELECT payload FROM outbox WHERE session_id = %s AND kind = 'recording' ORDER BY id", (session_id,))
    for (payload,) in cur:
        yield payload
```

(`psycopg`/`Iterator` already imported at the top of `export.py`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_store.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/store/export.py viewer-service/tests/test_replay_store.py
git commit -m "feat(viewer-service): per-session event + recording outbox readers"
```

---

### Task 3: config + bundle assembly (`replay.py` service)

**Files:**
- Modify: `viewer-service/src/viewer_service/config.py` (add `web_viewer_base_url`, `replay_link_ttl_seconds`)
- Create: `viewer-service/src/viewer_service/replay.py`
- Test: `viewer-service/tests/test_replay_bundle.py` (new)

**Interfaces:**
- Consumes: `sessions.session_runtime`, `store/export.iter_event_rows_for_session` / `iter_recording_rows_for_session`.
- Produces: `build_replay_bundle(conn, session: dict) -> dict` → `{runtime, statements, mouse}`.
- Config gains `web_viewer_base_url: str = ""` (env `WEB_VIEWER_BASE_URL`) and `replay_link_ttl_seconds: int = 604800` (env `REPLAY_LINK_TTL_SECONDS`).

- [ ] **Step 1: Add the config fields — `config.py`**

In the `Settings` dataclass (next to `invite_default_ttl_seconds`):
```python
    web_viewer_base_url: str = ""
    replay_link_ttl_seconds: int = 604_800
```
In the `Settings(...)` construction inside `from_env` (next to `invite_default_ttl_seconds=...`):
```python
        web_viewer_base_url=os.environ.get("WEB_VIEWER_BASE_URL", ""),
        replay_link_ttl_seconds=int(os.environ.get("REPLAY_LINK_TTL_SECONDS", "604800")),
```

- [ ] **Step 2: Write the failing test** — `tests/test_replay_bundle.py`

```python
import psycopg
from psycopg.types.json import Jsonb
import viewer_service.runtime as runtime_mod
from viewer_service import replay as replay_svc
from viewer_service.store import sessions as sstore
from test_sessions_api import MANIFEST, BUNDLE


def _deploy_and_session(client, monkeypatch, pg_url):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    with psycopg.connect(pg_url) as c:
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'events',%s,'he')",
                  (s["session_id"], Jsonb({"batch_id": "b", "events": [{"verb": "bdm:started"}, {"verb": "bdm:submitted"}]})))
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'recording',%s,'hr')",
                  (s["session_id"], Jsonb({"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]})))
        c.commit()
    return dep["deployment_id"], s["session_id"]


def test_build_replay_bundle(client, monkeypatch, pg_url):
    dep_id, sid = _deploy_and_session(client, monkeypatch, pg_url)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    with psycopg.connect(pg_url) as c:
        session = sstore.get_session(c, sid)
        bundle = replay_svc.build_replay_bundle(c, session)
    assert set(bundle) == {"runtime", "statements", "mouse"}
    assert bundle["runtime"]["metadata"]["id"] == "qst_mini"
    assert [s["verb"] for s in bundle["statements"]] == ["bdm:started", "bdm:submitted"]
    assert bundle["mouse"] == [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_bundle.py -q`
Expected: FAIL — `viewer_service.replay` does not exist.

- [ ] **Step 4: Write `src/viewer_service/replay.py`**

```python
from . import sessions as sessions_svc
from .store import export as export_store


def build_replay_bundle(conn, session: dict) -> dict:
    """Assemble the RP1 replay bundle for a session: the re-minted runtime + its flattened event
    statements + its flattened mouse samples."""
    runtime = sessions_svc.session_runtime(conn, session)
    statements: list = []
    for payload in export_store.iter_event_rows_for_session(conn, session["session_id"]):
        evs = payload.get("events") if isinstance(payload, dict) else None
        if isinstance(evs, list):
            statements.extend(evs)
    mouse: list = []
    for payload in export_store.iter_recording_rows_for_session(conn, session["session_id"]):
        samples = payload.get("samples") if isinstance(payload, dict) else None
        if isinstance(samples, list):
            mouse.extend(samples)
    return {"runtime": runtime, "statements": statements, "mouse": mouse}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_bundle.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/config.py viewer-service/src/viewer_service/replay.py viewer-service/tests/test_replay_bundle.py
git commit -m "feat(viewer-service): replay bundle assembly + config (web_viewer_base_url, ttl)"
```

---

### Task 4: endpoints (`api/replay.py`) — mint + bundle

**Files:**
- Create: `viewer-service/src/viewer_service/api/replay.py`
- Modify: `viewer-service/src/viewer_service/api/app.py` (register the router)
- Test: `viewer-service/tests/test_replay_api.py` (new)

**Interfaces:**
- Consumes: `mint_replay`/`verify_replay` (Task 1); `build_replay_bundle` (Task 3); `get_session`, `get_deployment`, `get_settings`, `require_researcher`.
- Produces: `POST /v1/deployments/{deployment_id}/sessions/{session_id}/replay-link` (researcher) + `GET /v1/replay` (token).

- [ ] **Step 1: Write the failing test** — `tests/test_replay_api.py`

```python
import psycopg
from psycopg.types.json import Jsonb
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _setup(client, monkeypatch, pg_url):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    with psycopg.connect(pg_url) as c:
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'events',%s,'he')",
                  (s["session_id"], Jsonb({"batch_id": "b", "events": [{"verb": "bdm:started"}]})))
        c.commit()
    return dep["deployment_id"], s["session_id"]


def test_mint_then_fetch_bundle(client, monkeypatch, pg_url):
    dep_id, sid = _setup(client, monkeypatch, pg_url)
    # researcher mints (client default headers carry the researcher role)
    r = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link")
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert r.json()["bundle_url"].endswith(f"/v1/replay?token={token}")

    # unauthenticated bundle fetch with the token (re-stub the bundle for the runtime mint)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    g = client.get(f"/v1/replay?token={token}")
    assert g.status_code == 200, g.text
    b = g.json()
    assert set(b) == {"runtime", "statements", "mouse"}
    assert b["runtime"]["metadata"]["id"] == "qst_mini"
    assert [s["verb"] for s in b["statements"]] == ["bdm:started"]


def test_mint_requires_researcher(client, monkeypatch, pg_url, auth_header):
    dep_id, sid = _setup(client, monkeypatch, pg_url)
    assert client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link",
                       headers=auth_header(["participant"])).status_code == 403


def test_mint_unknown_deployment_404(client):
    assert client.post("/v1/deployments/nope/sessions/s/replay-link").status_code == 404


def test_mint_foreign_session_404(client, monkeypatch, pg_url):
    dep_id, _sid = _setup(client, monkeypatch, pg_url)
    # a session id that does not belong to dep_id
    assert client.post(f"/v1/deployments/{dep_id}/sessions/sess_not_here/replay-link").status_code == 404


def test_bundle_bad_token_401(client):
    assert client.get("/v1/replay?token=garbage").status_code == 401
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_api.py -q`
Expected: FAIL — routes 404 (router not registered).

- [ ] **Step 3: Write `api/replay.py`**

```python
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from .deps import get_conn
from .identity import require_researcher
from ..config import get_settings
from ..replay_links import mint_replay, verify_replay
from ..replay import build_replay_bundle
from ..store import sessions as session_store
from ..store import deployments as dep_store

router = APIRouter()


@router.post("/deployments/{deployment_id}/sessions/{session_id}/replay-link")
def mint_link(deployment_id: str, session_id: str, request: Request, conn=Depends(get_conn),
              claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    session = session_store.get_session(conn, session_id)
    if session is None or session["deployment_id"] != deployment_id:
        raise HTTPException(status_code=404, detail="session not found in this deployment")
    s = get_settings()
    token = mint_replay(s.invite_signing_secret, deployment_id=deployment_id, session_id=session_id,
                        ttl=s.replay_link_ttl_seconds)
    base = (s.public_base_url or str(request.base_url)).rstrip("/")
    bundle_url = f"{base}/v1/replay?token={token}"
    replay_url = f"{s.web_viewer_base_url.rstrip('/')}/?replay={quote(bundle_url, safe='')}" if s.web_viewer_base_url else None
    return {"token": token, "bundle_url": bundle_url, "replay_url": replay_url}


@router.get("/replay")
def bundle(token: str, conn=Depends(get_conn)):
    s = get_settings()
    payload = verify_replay(s.invite_signing_secret, token)
    if payload is None:
        return JSONResponse(status_code=401, content={"error": {"code": "invalid_replay_token",
            "message": "the replay token is missing, invalid, or expired"}})
    session = session_store.get_session(conn, payload["session_id"])
    if session is None or session["deployment_id"] != payload["deployment_id"]:
        raise HTTPException(status_code=404, detail="session not found")
    return build_replay_bundle(conn, session)
```

- [ ] **Step 4: Register the router — `api/app.py`**

Add `replay as replay_routes` to the `from . import ...` line, and an `include_router` next to the others (before `internal`):
```python
    app.include_router(replay_routes.router, prefix="/v1")
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_replay_api.py -q`
Expected: PASS (5 cases).

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/replay.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_replay_api.py
git commit -m "feat(viewer-service): replay-link mint + token-authorized bundle endpoints"
```

---

### Task 5: Docs

**Files:**
- Modify: `viewer-service/HANDOFF.md`
- Modify: `viewer-service/FOLLOWUPS.md`

**Interfaces:** none (docs).

- [ ] **Step 1: Update `viewer-service/HANDOFF.md`**

Add a subsection: `POST /v1/deployments/{id}/sessions/{sid}/replay-link` (researcher-gated) mints a
short-lived HMAC replay token (reuses `invite_signing_secret`; TTL `REPLAY_LINK_TTL_SECONDS`, default
7d) and returns `{token, bundle_url, replay_url}` (`replay_url` set when `WEB_VIEWER_BASE_URL` is
configured). `GET /v1/replay?token=` (token-authorized, no login) returns the RP1 bundle
`{runtime, statements, mouse}` assembled from `session_runtime` + the session's `events`/`recording`
outbox rows — so the web-viewer's `?replay=` mode replays a real participant's session. This is #7 RP2.
Match the file's existing spaced-em-dash style.

- [ ] **Step 2: Update `viewer-service/FOLLOWUPS.md`**

Record: RP3 (`web-viewer/`) — an e2e + docs confirming `?replay=<vs bundle url>` plays a live session,
and an optional researcher "copy replay link" UI; a dedicated `REPLAY_SIGNING_SECRET` + link
revocation; a researcher session-list + link-copy surface; incremental live-follow of an in-progress
session. Match the file's existing style.

- [ ] **Step 3: Commit**

```bash
git add viewer-service/HANDOFF.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): replay-link RP2 + RP3/follow-ups"
```

---

## Self-Review

**Spec coverage:**
- Session-scoped signed token (mint/verify, expiry, fail-closed) — Task 1. ✅
- Per-session event + recording readers — Task 2. ✅
- Server-side bundle assembly `{runtime, statements, mouse}` via `session_runtime` — Task 3. ✅
- Researcher-gated mint (403 non-researcher, 404 unknown deployment / foreign session) + token-authorized bundle (401 bad token, 404 missing session) — Task 4. ✅
- `replay_url` from `web_viewer_base_url`; TTL config — Task 3 (config) + Task 4 (mint). ✅
- No schema migration; reuse invite HMAC + session_runtime — Global Constraints + Tasks 1/3. ✅
- Tests via pytest+testcontainers, viewer-service alone — every task. ✅
- Docs + RP3 follow-ups — Task 5. ✅

**Placeholder scan:** none. `replay.py` `import hashlib`/`hmac` in Task 1 are used by `compare_digest`; `_b64u_decode` is imported from invites (it exists there — verified). No stubs.

**Type consistency:** `mint_replay`/`verify_replay` (Task 1) payload `{deployment_id, session_id, exp}` consumed by the bundle endpoint (Task 4); `iter_event_rows_for_session`/`iter_recording_rows_for_session` (Task 2) consumed by `build_replay_bundle` (Task 3); `build_replay_bundle(conn, session)` (Task 3) called by `GET /v1/replay` (Task 4); `get_session` returns the session dict both the mint and bundle endpoints use; config `invite_signing_secret`/`replay_link_ttl_seconds`/`web_viewer_base_url`/`public_base_url` read consistently in Task 4. The bundle shape `{runtime, statements, mouse}` matches the RP1 player's `loadBundle` expectation. ✅
