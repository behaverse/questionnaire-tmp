# Viewer Service recordings + channels plumbing (SP3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Viewer Service stores, retains, forwards, and reads back a session's behavioural-channel recording (mouse first) by reusing the outbox (`kind='recording'`), and surfaces `deployment.channels` in the mint so the player knows to capture — no schema migration.

**Architecture:** A `submit_recording` service enqueues a `{channel,samples}` payload as a `kind='recording'` outbox row (no Schema 4a/5 validation; the forwarder is kind-agnostic, so it ships to Behaverse for free). A new `api/recordings.py` carries the session-gated ingest plus a participant read (`/me/recordings`) and a researcher read (`/deployments/{id}/recordings`), mirroring `submission.py` / `me.py` / `comments.py`. The mint gains a `channels` field.

**Tech Stack:** Python, FastAPI, psycopg, pytest + testcontainers Postgres. Existing service at `viewer-service/`.

## Global Constraints

- All changes under `viewer-service/`. Do NOT modify web-viewer/, library/, questionnaire-harvester/, or other components.
- NO schema migration: `outbox.kind` is free-form text; `deployment.channels` jsonb already exists. Do not add tables/columns.
- Recordings must NOT go through `submission.submit()` — that validates every non-`responses` kind as a Schema-4a **events** payload and would reject a `{channel,samples}` envelope. Use the new `submit_recording`.
- Recording payload shape: `{ "channel": str, "samples": list }`; `channel` ∈ `{"mouse","keyboard"}`; each sample is a Schema-4b mouse sample `{t,x,y,button_state}` (the VS stores the list verbatim; it does not re-validate sample internals in SP3).
- Ephemeral/demo sessions: accepted (202 `{"ephemeral": true}`) but NOT enqueued (mirror `submission.submit`).
- Tests run from `viewer-service/` ONLY (the monorepo has multiple `tests/`), with `DOCKER_CONFIG=/tmp/lib_docker` (testcontainers Postgres). Run: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` (or a specific test file).
- Branch: `work/viewer-service-recordings`. Finish by merging to master + push (no PRs); `git fetch` + ff/rebase before push (shared checkout). Stage explicit paths only.

---

### Task 1: Outbox readers for recordings (`store/export.py`)

**Files:**
- Modify: `viewer-service/src/viewer_service/store/export.py`
- Test: `viewer-service/tests/test_recordings_store.py` (new)

**Interfaces:**
- Produces:
  - `iter_recording_rows_for_participant(conn, participant_sub) -> Iterator[dict]` — yields each `kind='recording'` payload for the participant's sessions, in `outbox.id` order.
  - `iter_recording_rows(conn, deployment_id) -> Iterator[dict]` — same for a deployment's sessions.

- [ ] **Step 1: Write the failing test** — `tests/test_recordings_store.py`

```python
import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as export_store


def _seed_session(c, sub, sid, dep="dep_1"):
    sstore.insert_session(
        c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
        deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id=sub,
        instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _seed_recording(c, sid, channel, samples):
    c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
              "VALUES (%s,'recording',%s,%s)",
              (sid, Jsonb({"channel": channel, "samples": samples}), "hr_" + sid))


def test_recordings_scoped_to_participant(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed_session(c, "alice", "sA")
        _seed_session(c, "bob", "sB")
        _seed_recording(c, "sA", "mouse", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
        _seed_recording(c, "sB", "mouse", [{"t": 0, "x": 9, "y": 9, "button_state": "up"}])
        # an events row must NOT be returned by the recording reader
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES ('sA','events',%s,'he')", (Jsonb({"batch_id": "b", "events": []}),))
        c.commit()
        rows = list(export_store.iter_recording_rows_for_participant(c, "alice"))
    assert rows == [{"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]}]


def test_recordings_for_deployment(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed_session(c, "alice", "sA", dep="dep_rec")
        _seed_session(c, "bob", "sB", dep="dep_other")
        _seed_recording(c, "sA", "mouse", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
        _seed_recording(c, "sB", "mouse", [{"t": 0, "x": 9, "y": 9, "button_state": "up"}])
        c.commit()
        rows = list(export_store.iter_recording_rows(c, "dep_rec"))
    assert len(rows) == 1 and rows[0]["channel"] == "mouse"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_store.py -q`
Expected: FAIL — `iter_recording_rows_for_participant` / `iter_recording_rows` do not exist.

- [ ] **Step 3: Append to `store/export.py`**

```python
def iter_recording_rows_for_participant(conn: psycopg.Connection, participant_sub: str) -> Iterator[dict]:
    """Yield every behavioural-channel recording payload ({channel, samples}) for one participant,
    from the outbox. Scoped to session.participant_sub; kind='recording' only; insertion order."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.participant_sub = %s AND o.kind = 'recording' ORDER BY o.id", (participant_sub,))
    for (payload,) in cur:
        yield payload


def iter_recording_rows(conn: psycopg.Connection, deployment_id: str) -> Iterator[dict]:
    """Yield every recording payload for a deployment's sessions; kind='recording'; insertion order."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.deployment_id = %s AND o.kind = 'recording' ORDER BY o.id", (deployment_id,))
    for (payload,) in cur:
        yield payload
```

(`psycopg` and `Iterator` are already imported at the top of `export.py`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_store.py -q`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/store/export.py viewer-service/tests/test_recordings_store.py
git commit -m "feat(viewer-service): outbox readers for kind=recording"
```

---

### Task 2: `submit_recording` service + ingest endpoint + router wiring

**Files:**
- Modify: `viewer-service/src/viewer_service/submission.py`
- Create: `viewer-service/src/viewer_service/api/recordings.py`
- Modify: `viewer-service/src/viewer_service/api/app.py`
- Test: `viewer-service/tests/test_recordings_api.py` (new)

**Interfaces:**
- Consumes: `outbox_store.enqueue`, `canonical_hash`, `get_settings().outbox_hard_threshold`, `OutboxFull` (all in `submission.py`).
- Produces:
  - `submission.submit_recording(conn, session_id: str, payload: dict, ephemeral: bool=False) -> int | None` — enqueue `kind='recording'`; ephemeral → `None`; raises `OutboxFull`.
  - `api/recordings.py` `router` with `POST /sessions/{session_id}/recordings`.

- [ ] **Step 1: Write the failing test** — `tests/test_recordings_api.py`

```python
import os
import psycopg
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _make_session(client, monkeypatch, *, preset=None):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    if preset:
        body["mode_preset"] = preset
    dep = client.post("/v1/deployments", json=body).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return dep["deployment_id"], s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


@pytest.fixture
def session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch))


@pytest.fixture
def ephemeral_session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch, preset="demo"))


_SAMPLES = [{"t": 0, "x": 1, "y": 2, "button_state": "up"},
            {"t": 0.1, "x": 3, "y": 4, "button_state": "left_down"}]


def test_post_recording_enqueues(session):
    client, dep_id, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 202, r.text
    assert "enqueued" in r.json()
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        row = c.execute("SELECT kind, payload FROM outbox o JOIN session s ON o.session_id=s.session_id "
                        "WHERE s.deployment_id=%s", (dep_id,)).fetchone()
    assert row[0] == "recording"
    assert row[1] == {"channel": "mouse", "samples": _SAMPLES}


def test_bad_channel_rejected(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "webcam", "samples": _SAMPLES})
    assert r.status_code == 400


def test_non_list_samples_rejected(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": "nope"})
    assert r.status_code == 400


def test_requires_valid_session_token(session):
    client, _dep, sid, _h = session
    r = client.post(f"/v1/sessions/{sid}/recordings",
                    headers={"Authorization": "Bearer not-a-real-token"},
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 401


def test_ephemeral_accepts_but_skips_store(ephemeral_session):
    client, dep_id, sid, h = ephemeral_session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 202, r.text
    assert r.json() == {"ephemeral": True}
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        n = c.execute("SELECT count(*) FROM outbox o JOIN session s ON o.session_id=s.session_id "
                      "WHERE s.deployment_id=%s AND o.kind='recording'", (dep_id,)).fetchone()[0]
    assert n == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_api.py -q`
Expected: FAIL — 404 on `/recordings` (router not registered) / `submit_recording` missing.

- [ ] **Step 3: Add `submit_recording` to `submission.py`**

```python
def submit_recording(conn, session_id: str, payload: dict, ephemeral: bool = False) -> int | None:
    """Enqueue a behavioural-channel recording (kind='recording'). NO Schema 4a/5 validation —
    the payload is a {channel, samples} envelope shape-checked by the caller. Ephemeral (demo)
    session -> None (no data leaves VS). Raises OutboxFull on the hard cap."""
    if ephemeral:
        return None
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    oid = outbox_store.enqueue(conn, session_id, "recording", payload, canonical_hash(payload))
    conn.commit()
    return oid
```

- [ ] **Step 4: Create `api/recordings.py` (ingest only for now)**

```python
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from .deps import get_conn, require_session
from .. import submission as submission_svc

router = APIRouter()

_CHANNELS = {"mouse", "keyboard"}


@router.post("/sessions/{session_id}/recordings")
def post_recording(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    channel = payload.get("channel")
    samples = payload.get("samples")
    if channel not in _CHANNELS or not isinstance(samples, list):
        return JSONResponse(status_code=400, content={"error": {
            "code": "bad_recording",
            "message": "channel must be one of mouse|keyboard and samples must be a list"}})
    try:
        oid = submission_svc.submit_recording(conn, session_id, {"channel": channel, "samples": samples},
                                              session["ephemeral"])
    except submission_svc.OutboxFull:
        return JSONResponse(status_code=503, content={"error": {
            "code": "service_unavailable", "message": "submission queue is full; try again later"}})
    if oid is None:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    return JSONResponse(status_code=202, content={"enqueued": oid})
```

- [ ] **Step 5: Register the router in `api/app.py`**

In the import line (currently ends `... comments as comments_routes, internal`), add `recordings as recordings_routes`:
```python
    from . import viewers, deployments, runtime, admin, sessions, submission, export, themes, metrics, scorers, scoring, invites as invites_routes, me as me_routes, catalogue as catalogue_routes, comments as comments_routes, recordings as recordings_routes, internal
```
And add an `include_router` next to the others (before `internal`):
```python
    app.include_router(recordings_routes.router, prefix="/v1")
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_api.py -q`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/submission.py viewer-service/src/viewer_service/api/recordings.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_recordings_api.py
git commit -m "feat(viewer-service): recording ingest endpoint (kind=recording outbox)"
```

---

### Task 3: Recording read endpoints (`/me/recordings`, `/deployments/{id}/recordings`)

**Files:**
- Modify: `viewer-service/src/viewer_service/api/recordings.py`
- Test: `viewer-service/tests/test_recordings_api.py` (add cases)

**Interfaces:**
- Consumes: `iter_recording_rows_for_participant`, `iter_recording_rows` (Task 1); `require_participant`, `require_researcher` (`.identity`); `dep_store.get_deployment`.
- Produces: `GET /me/recordings` (participant) and `GET /deployments/{id}/recordings` (researcher) on the same router.

- [ ] **Step 1: Add the failing tests** — append to `tests/test_recordings_api.py`

```python
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore


def _seed_recording_session(pg_url, sub, sid, dep, samples):
    with psycopg.connect(pg_url) as c:
        sstore.insert_session(
            c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
            deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id=sub,
            instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
            token_hash="h_" + sid, initial_locale="en", last_active_locale="en")
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES (%s,'recording',%s,%s)",
                  (sid, Jsonb({"channel": "mouse", "samples": samples}), "hr_" + sid))
        c.commit()


def test_me_recordings_scoped(client, auth_header, pg_url):
    _seed_recording_session(pg_url, "alice", "rA", "dep_x", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
    _seed_recording_session(pg_url, "bob", "rB", "dep_x", [{"t": 0, "x": 8, "y": 8, "button_state": "up"}])
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/recordings", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200
    recs = r.json()["recordings"]
    assert len(recs) == 1 and recs[0]["samples"][0]["x"] == 1   # bob excluded


def test_me_recordings_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/recordings").status_code == 401


def test_me_recordings_empty(client, auth_header):
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/recordings", headers=auth_header(["participant"], sub="nobody"))
    assert r.status_code == 200 and r.json() == {"recordings": []}


def test_deployment_recordings_researcher(session):
    client, dep_id, sid, h = session
    client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                json={"channel": "mouse", "samples": _SAMPLES})
    g = client.get(f"/v1/deployments/{dep_id}/recordings")   # default headers carry researcher role
    assert g.status_code == 200, g.text
    recs = g.json()["recordings"]
    assert len(recs) == 1 and recs[0]["channel"] == "mouse"


def test_deployment_recordings_requires_researcher(session, auth_header):
    client, dep_id, _sid, _h = session
    assert client.get(f"/v1/deployments/{dep_id}/recordings",
                      headers=auth_header(["participant"])).status_code == 403


def test_deployment_recordings_unknown_404(client):
    assert client.get("/v1/deployments/dpl_nope/recordings").status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_api.py -q`
Expected: the 6 new cases FAIL (routes 404 / not defined); the Task-2 cases still pass.

- [ ] **Step 3: Add the reads to `api/recordings.py`**

Update the imports at the top:
```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn, require_session
from .identity import require_participant, require_researcher
from .. import submission as submission_svc
from ..store import export as export_store
from ..store import deployments as dep_store
```
Append the two endpoints:
```python
@router.get("/me/recordings")
def my_recordings(conn=Depends(get_conn), claims=Depends(require_participant)):
    """Download the caller's behavioural-channel recordings (mouse/keyboard sample sets)."""
    recs = list(export_store.iter_recording_rows_for_participant(conn, claims["sub"]))
    return JSONResponse(content={"recordings": recs},
                        headers={"Content-Disposition": 'attachment; filename="my_recordings.json"'})


@router.get("/deployments/{deployment_id}/recordings")
def list_recordings(deployment_id: str, conn=Depends(get_conn), claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return {"recordings": list(export_store.iter_recording_rows(conn, deployment_id))}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_recordings_api.py -q`
Expected: PASS (all 11 cases — 5 from Task 2 + 6 new).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/api/recordings.py viewer-service/tests/test_recordings_api.py
git commit -m "feat(viewer-service): participant + researcher recording reads"
```

---

### Task 4: Surface `channels` in the mint

**Files:**
- Modify: `viewer-service/src/viewer_service/sessions.py`
- Test: `viewer-service/tests/test_mint_channels.py` (new)

**Interfaces:**
- Produces: the `new_session(...)` return dict gains `"channels": deployment.get("channels")`.

- [ ] **Step 1: Write the failing test** — `tests/test_mint_channels.py`

```python
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _mint(client, monkeypatch, channels=None):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    if channels is not None:
        body["channels"] = channels
    dep = client.post("/v1/deployments", json=body).json()
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()


def test_mint_returns_default_channels(client, monkeypatch):
    s = _mint(client, monkeypatch)
    assert "channels" in s
    assert s["channels"]["mouse"] is False          # default opt-out


def test_mint_returns_requested_channels(client, monkeypatch):
    s = _mint(client, monkeypatch, channels={"rt": True, "mouse": True, "keyboard": False,
                                             "webcam": False, "microphone": False})
    assert s["channels"]["mouse"] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_mint_channels.py -q`
Expected: FAIL — `channels` not in the mint response (KeyError).

- [ ] **Step 3: Edit `sessions.py` `new_session` return**

In the return dict (currently ending with `redirect_url`), add `channels`:
```python
    return {"session_id": session_id, "session_token": token, "runtime": runtime, "theme": theme,
            "agent_id": agent_id, "session_index": session_index, "ephemeral": ephemeral,
            "participant_sub": participant_sub if auth_mode != "none" else None,
            "consent": deployment.get("consent"),
            "confirmation_message": deployment.get("confirmation_message"),
            "redirect_url": deployment.get("redirect_url"),
            "channels": deployment.get("channels")}
```
(The exact pre-existing keys between `ephemeral` and `redirect_url` may differ slightly — keep them all and ADD the `"channels": deployment.get("channels")` entry as the final key. Do not remove any existing key.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_mint_channels.py -q`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/sessions.py viewer-service/tests/test_mint_channels.py
git commit -m "feat(viewer-service): surface deployment.channels in the session mint"
```

---

### Task 5: Docs

**Files:**
- Modify: `viewer-service/HANDOFF.md`
- Modify: `viewer-service/FOLLOWUPS.md` (if present; else add the note to `HANDOFF.md`)

**Interfaces:** none (docs).

- [ ] **Step 1: Update `viewer-service/HANDOFF.md`**

Add a short subsection documenting the new endpoints: `POST /v1/sessions/{id}/recordings` (session-gated; body `{channel, samples}`; `channel` ∈ mouse|keyboard; stored as a `kind='recording'` outbox row, forwarded like events/responses; ephemeral skips store), `GET /v1/me/recordings` (participant-scoped JSON download), `GET /v1/deployments/{id}/recordings` (researcher-gated). Note the mint now returns `channels` (from `deployment.channels`) so a viewer knows which behavioural channels to capture. State that this is SP3 of the mouse-tracking track and that the player-side live capture (SP2) is the remaining piece. Em-dashes with no surrounding spaces.

- [ ] **Step 2: Record the deferred follow-ups**

In `viewer-service/FOLLOWUPS.md` (create it if absent, mirroring a sibling component's FOLLOWUPS style) add: SP2 (player Schema-4b mouse capture → POST /recordings + `bdm:recording_started/ended` + `recording_url`); canonical `.jsonl.gz` archive format + per-recording size cap/rate-limit; recordings join the shared outbox-TTL-reaper follow-up; researcher CSV/streaming export of recordings.

- [ ] **Step 3: Commit**

```bash
git add viewer-service/HANDOFF.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): recordings endpoints + channels mint; SP3 follow-ups"
```

---

## Self-Review

**Spec coverage:**
- Reuse outbox `kind='recording'`, no migration — Tasks 1-2 (readers + `submit_recording` enqueue). ✅
- Recordings NOT through `submission.submit()` (events-schema validation) — Task 2 (`submit_recording` is separate, no validation). ✅
- Ingest `{channel,samples}`, channel ∈ mouse|keyboard, samples list, 400 otherwise, 401 bad token, ephemeral 202-no-store — Task 2. ✅
- Participant read `/me/recordings` (scoped, attachment) + researcher read `/deployments/{id}/recordings` (gated, 404 unknown) — Task 3. ✅
- Mint surfaces `channels` — Task 4. ✅
- Tests via pytest+testcontainers, viewer-service alone — every task's run command uses `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/...`. ✅
- Docs + follow-ups — Task 5. ✅

**Placeholder scan:** none. Task 4 Step 3 notes the surrounding keys "may differ slightly" but gives the exact line to ADD and the rule (keep all existing keys, append `channels`) — concrete, not a placeholder.

**Type consistency:** `iter_recording_rows_for_participant` / `iter_recording_rows` defined in Task 1 and consumed by Task 3's endpoints with matching names; `submit_recording(conn, session_id, payload, ephemeral)` defined in Task 2 and called by the ingest endpoint with that exact signature; payload shape `{channel, samples}` consistent across ingest, store rows, and reads; the router is registered once (Task 2) and extended in place (Task 3). ✅
