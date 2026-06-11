# Viewer Service VS-C (Deployment Management & Lifecycle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `viewer-service/` with the full deployment record (mode presets, active window, quota, style/flow overrides), deployment CRUD, and wire the deferred OD-14 lifecycle rules into VS-B's mint/resume/submission — delivering anonymous-link (UC-04) and demo (UC-08) modes.

**Architecture:** Idempotent `ALTER TABLE` extensions to `deployment` (+ `session.ephemeral`); a `modes.py` preset→dimensions resolver (anonymous_link + demo supported); a `**fields`-driven deployments store; a pure `check_deployable` gate (active window + quota); and edits to VS-B's `new_session`/resume/submission paths so the lifecycle is enforced.

**Tech Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3) · pytest + testcontainers. (No new deps.)

**Spec:** [docs/superpowers/specs/2026-06-11-viewer-service-vs-c-design.md](../specs/2026-06-11-viewer-service-vs-c-design.md)

**Key refinement:** `mode_preset` **defaults to `"anonymous_link"`** in the create model (not strictly required). This keeps every existing VS-A/VS-B deployment-creating test fixture working unchanged (they omit it → default), so no suite-wide fixture rewrite is needed; new tests opt into `"demo"` / unsupported presets explicitly.

---

## File structure

```
viewer-service/src/viewer_service/
├── modes.py                  # NEW: PRESETS, SUPPORTED, resolve_preset, UnsupportedPreset
├── deployments.py            # NEW: check_deployable + DeploymentClosed/NotYetOpen/QuotaExhausted
├── models.py                 # (modify) extend DeploymentCreate; add DeploymentPatch
├── sessions.py               # (modify) new_session: check_deployable + ephemeral
├── submission.py             # (modify) submit: ephemeral skips outbox
├── store/
│   ├── schema.sql            # (modify) ALTER deployment + session
│   ├── deployments.py        # (modify) **fields insert + full get + list + patch
│   └── sessions.py           # (modify) insert_session ephemeral kwarg + _SELECT_COLS + count_for_deployment
└── api/
    ├── deployments.py        # (modify) extended create + get + list + patch
    ├── sessions.py           # (modify) mint gating + ephemeral 409 on resume/runtime/locale
    └── submission.py         # (modify) pass session.ephemeral to submit
tests/
├── test_modes.py
├── test_deployable.py
├── test_deployments_api.py   # (replace VS-A version) extended
├── test_session_lifecycle.py
└── test_ephemeral_submission.py
```

**Environment:** repo root `/home/pedro/Repos/Cursor/questionnaire_apps`; branch `phase2-viewer-service-vs-c` (already checked out). venv pytest by ABSOLUTE PATH: `/home/pedro/Repos/Cursor/questionnaire_apps/.venv/bin/pytest`. Integration tests need `DOCKER_CONFIG=/tmp/lib_docker`. `viewer_service` + `denormaliser` installed editable.

---

### Task 1: Schema ALTERs + session ephemeral support

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql`, `viewer-service/src/viewer_service/store/sessions.py`
- Test: `viewer-service/tests/test_vsc_schema.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_vsc_schema.py`)

```python
from viewer_service.store import sessions as session_store


def test_deployment_has_new_columns(conn):
    cols = {r[0] for r in conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name='deployment'").fetchall()}
    assert {"mode_preset", "dimensions", "active_from", "active_until", "quota",
            "style_overrides", "flow_overrides", "channels"}.issubset(cols)


def test_session_has_ephemeral_column(conn):
    cols = {r[0] for r in conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name='session'").fetchall()}
    assert "ephemeral" in cols


def _insert(conn, sid, **over):
    fields = dict(session_id=sid, session_index=1, deployment_id="dep_1", viewer_id="web",
                  viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
                  instrument_version="v26.0609", status="in_progress", token_hash="h",
                  initial_locale="en", last_active_locale="en")
    session_store.insert_session(conn, **fields, **over)
    conn.commit()


def test_insert_session_defaults_ephemeral_false(conn):
    _insert(conn, "s_def")
    assert session_store.get_session(conn, "s_def")["ephemeral"] is False


def test_insert_session_ephemeral_true(conn):
    _insert(conn, "s_eph", ephemeral=True)
    assert session_store.get_session(conn, "s_eph")["ephemeral"] is True


def test_count_for_deployment(conn):
    _insert(conn, "s1")
    _insert(conn, "s2")
    assert session_store.count_for_deployment(conn, "dep_1") == 2
    assert session_store.count_for_deployment(conn, "dep_other") == 0
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_vsc_schema.py -q`
Expected: FAIL — new columns missing / `count_for_deployment` undefined.

- [ ] **Step 3: Append to `store/schema.sql`** (after the existing tables):

```sql
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS mode_preset                 text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS dimensions                  jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_from                 timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_until                timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS quota                       jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS style_overrides             jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS flow_overrides              jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS redirect_url                text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS confirmation_message        jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS randomization_seed_strategy text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS channels                    jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS created_by                  text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS consent_text_ref            text;

ALTER TABLE session ADD COLUMN IF NOT EXISTS ephemeral boolean NOT NULL DEFAULT false;
```

- [ ] **Step 4: Edit `store/sessions.py`** — change `insert_session` to accept an optional `ephemeral` kwarg, append `"ephemeral"` to `_SELECT_COLS`, and add `count_for_deployment`. Replace the `insert_session` definition with:

```python
def insert_session(conn: psycopg.Connection, ephemeral: bool = False, **fields) -> None:
    cols = ", ".join(_INSERT_COLS + ("ephemeral",))
    placeholders = ", ".join(["%s"] * (len(_INSERT_COLS) + 1))
    conn.execute(f"INSERT INTO session ({cols}) VALUES ({placeholders})",
                 tuple(fields[c] for c in _INSERT_COLS) + (ephemeral,))
```

Append `"ephemeral"` as the last entry of the existing `_SELECT_COLS` tuple, and add:

```python
def count_for_deployment(conn: psycopg.Connection, deployment_id: str) -> int:
    return conn.execute("SELECT count(*) FROM session WHERE deployment_id=%s",
                        (deployment_id,)).fetchone()[0]
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_vsc_schema.py -q`
Expected: PASS (6 passed)

- [ ] **Step 6: Confirm VS-A/VS-B session tests still pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_store.py viewer-service/tests/test_outbox_store.py viewer-service/tests/test_forwarding.py -q`
Expected: PASS (still green — `insert_session` callers that omit `ephemeral` default to false; the extra `_SELECT_COLS` key doesn't break their assertions).

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/sessions.py viewer-service/tests/test_vsc_schema.py
git commit -m "feat(viewer-service): VS-C schema ALTERs + session.ephemeral + count_for_deployment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Mode presets (modes.py)

**Files:**
- Create: `viewer-service/src/viewer_service/modes.py`
- Test: `viewer-service/tests/test_modes.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_modes.py`)

```python
import pytest
from viewer_service.modes import resolve_preset, UnsupportedPreset, SUPPORTED


def test_anonymous_link_dimensions():
    assert resolve_preset("anonymous_link") == {
        "auth": "none", "persistence": "persisted", "lifecycle": "standard",
        "rendering_context": "standalone"}


def test_demo_dimensions_are_ephemeral():
    assert resolve_preset("demo")["persistence"] == "ephemeral"


def test_supported_set():
    assert SUPPORTED == {"anonymous_link", "demo"}


def test_unsupported_preset_raises():
    for p in ("access_code", "platform_study", "embedded", "kiosk", "preview", "bogus"):
        with pytest.raises(UnsupportedPreset):
            resolve_preset(p)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_modes.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.modes'`

- [ ] **Step 3: Implement `modes.py`**

```python
class UnsupportedPreset(Exception):
    """Raised for a mode preset whose dependencies (Identity/Platform/host) aren't built yet."""


# Only the two auth:none presets are wired in VS-C. The others exist in design/08a but
# require Identity/Platform/host integration and are rejected at create until then.
PRESETS = {
    "anonymous_link": {"auth": "none", "persistence": "persisted",
                       "lifecycle": "standard", "rendering_context": "standalone"},
    "demo": {"auth": "none", "persistence": "ephemeral",
             "lifecycle": "standard", "rendering_context": "standalone"},
}
SUPPORTED = set(PRESETS)


def resolve_preset(preset: str) -> dict:
    """Return the 4 orthogonal dimensions for a supported preset, or raise UnsupportedPreset."""
    if preset not in PRESETS:
        raise UnsupportedPreset(preset)
    return dict(PRESETS[preset])
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_modes.py -q`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/modes.py viewer-service/tests/test_modes.py
git commit -m "feat(viewer-service): mode presets (anonymous_link + demo)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Deployment store refactor + extended CRUD API

**Files:**
- Modify: `viewer-service/src/viewer_service/store/deployments.py`, `viewer-service/src/viewer_service/models.py`, `viewer-service/src/viewer_service/api/deployments.py`
- Test: `viewer-service/tests/test_deployments_api.py` (replace the VS-A version)

- [ ] **Step 1: Write the failing tests** (replace `tests/test_deployments_api.py`)

```python
def _body(**over):
    b = {"questionnaire_ref": "qst_phq9@v26.0609",
         "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": False},
         "default_locale": "en", "available_locales": ["en", "pt"]}
    b.update(over)
    return b


def test_create_defaults_to_anonymous_link(client):
    r = client.post("/v1/deployments", json=_body())
    assert r.status_code == 201, r.text
    dep_id = r.json()["deployment_id"]
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["mode_preset"] == "anonymous_link"
    assert g["dimensions"]["persistence"] == "persisted"
    assert g["channels"]["rt"] is True               # OD-07 default
    assert g["randomization_seed_strategy"] == "per_session"
    assert g["runtime_policy"]["show_score"] is False  # normalized


def test_create_demo_is_ephemeral(client):
    dep_id = client.post("/v1/deployments", json=_body(mode_preset="demo")).json()["deployment_id"]
    assert client.get(f"/v1/deployments/{dep_id}").json()["dimensions"]["persistence"] == "ephemeral"


def test_create_unsupported_preset_422(client):
    r = client.post("/v1/deployments", json=_body(mode_preset="access_code"))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "unsupported_preset"


def test_create_rejects_instrument_only_override(client):
    r = client.post("/v1/deployments", json=_body(flow_overrides={"allow_back": True}))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "instrument_only_override"


def test_create_accepts_allowed_overrides(client):
    r = client.post("/v1/deployments", json=_body(
        style_overrides={"progress_bar": True}, flow_overrides={"max_time_seconds": 600}))
    assert r.status_code == 201


def test_create_with_active_window_and_quota(client):
    dep_id = client.post("/v1/deployments", json=_body(
        active_until="2099-01-01T00:00:00Z", quota={"max_sessions": 10})).json()["deployment_id"]
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["active_until"].startswith("2099-01-01")
    assert g["quota"]["max_sessions"] == 10


def test_list_deployments(client):
    client.post("/v1/deployments", json=_body())
    client.post("/v1/deployments", json=_body(mode_preset="demo"))
    items = client.get("/v1/deployments").json()["items"]
    assert len(items) == 2
    assert {"deployment_id", "mode_preset", "questionnaire_ref"}.issubset(items[0])


def test_patch_active_until_and_quota(client):
    dep_id = client.post("/v1/deployments", json=_body()).json()["deployment_id"]
    r = client.patch(f"/v1/deployments/{dep_id}",
                     json={"active_until": "2030-06-01T00:00:00Z", "quota": {"max_sessions": 5}})
    assert r.status_code == 200
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["active_until"].startswith("2030-06-01")
    assert g["quota"]["max_sessions"] == 5
    assert g["questionnaire_ref"] == "qst_phq9@v26.0609"  # unchanged


def test_get_unknown_404(client):
    assert client.get("/v1/deployments/dep_nope").status_code == 404
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_deployments_api.py -q`
Expected: FAIL (no `mode_preset`/`dimensions` in the response; no list/patch routes).

- [ ] **Step 3: Replace `store/deployments.py` with:**

```python
import psycopg
from psycopg.types.json import Jsonb

_COLS = ("deployment_id", "questionnaire_ref", "runtime_policy", "default_locale",
         "available_locales", "theme_id", "mode_preset", "dimensions", "active_from",
         "active_until", "quota", "style_overrides", "flow_overrides", "redirect_url",
         "confirmation_message", "randomization_seed_strategy", "channels", "created_by",
         "consent_text_ref")
_JSONB = {"runtime_policy", "available_locales", "dimensions", "quota", "style_overrides",
          "flow_overrides", "confirmation_message", "channels"}
_SELECT_COLS = _COLS + ("created_at",)


def _wrap(col, val):
    return Jsonb(val) if (col in _JSONB and val is not None) else val


def insert_deployment(conn: psycopg.Connection, **fields) -> None:
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO deployment ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))})", vals)
    conn.commit()


def get_deployment(conn: psycopg.Connection, deployment_id: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM deployment WHERE deployment_id=%s",
        (deployment_id,)).fetchone()
    return dict(zip(_SELECT_COLS, row)) if row else None


def list_deployments(conn: psycopg.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT deployment_id, questionnaire_ref, mode_preset, active_from, active_until, "
        "created_at FROM deployment ORDER BY created_at DESC").fetchall()
    cols = ["deployment_id", "questionnaire_ref", "mode_preset", "active_from",
            "active_until", "created_at"]
    return [dict(zip(cols, r)) for r in rows]


def patch_deployment(conn: psycopg.Connection, deployment_id: str, *, active_until=..., quota=...) -> bool:
    sets, vals = [], []
    if active_until is not ...:
        sets.append("active_until=%s"); vals.append(active_until)
    if quota is not ...:
        sets.append("quota=%s"); vals.append(Jsonb(quota) if quota is not None else None)
    if not sets:
        return get_deployment(conn, deployment_id) is not None
    vals.append(deployment_id)
    cur = conn.execute(f"UPDATE deployment SET {', '.join(sets)} WHERE deployment_id=%s", tuple(vals))
    conn.commit()
    return cur.rowcount > 0
```

- [ ] **Step 4: Edit `models.py`** — replace `DeploymentCreate` and add `DeploymentPatch`:

```python
from datetime import datetime
from pydantic import BaseModel


class DeploymentCreate(BaseModel):
    questionnaire_ref: str
    runtime_policy: dict
    default_locale: str
    available_locales: list[str]
    mode_preset: str = "anonymous_link"
    theme_id: str | None = None
    active_from: datetime | None = None
    active_until: datetime | None = None
    quota: dict | None = None
    style_overrides: dict | None = None
    flow_overrides: dict | None = None
    redirect_url: str | None = None
    confirmation_message: dict | None = None
    randomization_seed_strategy: str = "per_session"
    channels: dict | None = None
    created_by: str | None = None
    consent_text_ref: str | None = None


class DeploymentPatch(BaseModel):
    active_until: datetime | None = None
    quota: dict | None = None
```

(Keep the existing `RuntimeRequest`, `SessionNew`, `LocaleSwitch` models.)

- [ ] **Step 5: Replace `api/deployments.py` with:**

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import RuntimePolicy
from .deps import get_conn
from ..models import DeploymentCreate, DeploymentPatch
from ..modes import resolve_preset, UnsupportedPreset
from ..store import deployments as store

router = APIRouter()

_DEFAULT_CHANNELS = {"rt": True, "mouse": False, "keyboard": False, "webcam": False, "microphone": False}
_ALLOWED_STYLE = {"progress_bar", "question_numbering"}
_ALLOWED_FLOW = {"max_time_seconds"}


@router.post("/deployments", status_code=201)
def create(body: DeploymentCreate, conn=Depends(get_conn)):
    try:
        dimensions = resolve_preset(body.mode_preset)
    except UnsupportedPreset:
        return JSONResponse(status_code=422, content={"error": {
            "code": "unsupported_preset",
            "message": f"mode_preset '{body.mode_preset}' requires Identity/Platform/host integration, not yet available"}})
    if body.style_overrides and set(body.style_overrides) - _ALLOWED_STYLE:
        return JSONResponse(status_code=422, content={"error": {
            "code": "instrument_only_override", "message": "style_overrides may only set: progress_bar, question_numbering"}})
    if body.flow_overrides and set(body.flow_overrides) - _ALLOWED_FLOW:
        return JSONResponse(status_code=422, content={"error": {
            "code": "instrument_only_override", "message": "flow_overrides may only set: max_time_seconds"}})
    try:
        policy = RuntimePolicy(**body.runtime_policy).to_canonical_dict()
    except TypeError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid", "message": f"invalid runtime_policy: {e}"}})

    deployment_id = "dep_" + uuid.uuid4().hex[:8]
    store.insert_deployment(
        conn, deployment_id=deployment_id, questionnaire_ref=body.questionnaire_ref,
        runtime_policy=policy, default_locale=body.default_locale,
        available_locales=body.available_locales, theme_id=body.theme_id,
        mode_preset=body.mode_preset, dimensions=dimensions, active_from=body.active_from,
        active_until=body.active_until, quota=body.quota, style_overrides=body.style_overrides,
        flow_overrides=body.flow_overrides, redirect_url=body.redirect_url,
        confirmation_message=body.confirmation_message,
        randomization_seed_strategy=body.randomization_seed_strategy,
        channels=body.channels or _DEFAULT_CHANNELS, created_by=body.created_by,
        consent_text_ref=body.consent_text_ref)
    return {"deployment_id": deployment_id}


@router.get("/deployments")
def list_(conn=Depends(get_conn)):
    return {"items": store.list_deployments(conn)}


@router.get("/deployments/{deployment_id}")
def get(deployment_id: str, conn=Depends(get_conn)):
    dep = store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return dep


@router.patch("/deployments/{deployment_id}")
def patch(deployment_id: str, body: DeploymentPatch, conn=Depends(get_conn)):
    kwargs = {}
    if "active_until" in body.model_fields_set:
        kwargs["active_until"] = body.active_until
    if "quota" in body.model_fields_set:
        kwargs["quota"] = body.quota
    ok = store.patch_deployment(conn, deployment_id, **kwargs)
    if not ok:
        raise HTTPException(status_code=404, detail="deployment not found")
    return {"deployment_id": deployment_id}
```

Note: the `GET /deployments` (list) route is declared **before** `GET /deployments/{deployment_id}` so the literal path isn't shadowed by the path param.

- [ ] **Step 6: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_deployments_api.py -q`
Expected: PASS (9 passed)

- [ ] **Step 7: Confirm VS-A/VS-B suites unaffected by the create-contract change**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_runtime_api.py viewer-service/tests/test_sessions_api.py viewer-service/tests/test_submission_api.py -q`
Expected: PASS (their fixtures omit `mode_preset` → default `anonymous_link`; `get_deployment` now returns extra keys but they read specific keys).

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/store/deployments.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/api/deployments.py viewer-service/tests/test_deployments_api.py
git commit -m "feat(viewer-service): full deployment record + CRUD (presets, overrides, list, patch)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: check_deployable (deployments.py service)

**Files:**
- Create: `viewer-service/src/viewer_service/deployments.py`
- Test: `viewer-service/tests/test_deployable.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_deployable.py`) — pure unit (no DB):

```python
from datetime import datetime, timezone, timedelta
import pytest
from viewer_service.deployments import (
    check_deployable, DeploymentClosed, NotYetOpen, QuotaExhausted)

NOW = datetime(2026, 6, 11, 12, 0, 0, tzinfo=timezone.utc)


def _dep(**over):
    d = {"active_from": None, "active_until": None, "quota": None}
    d.update(over)
    return d


def test_open_deployment_passes():
    check_deployable(_dep(), NOW, session_count=0)  # no raise


def test_past_active_until_raises_closed():
    with pytest.raises(DeploymentClosed):
        check_deployable(_dep(active_until=NOW - timedelta(hours=1)), NOW, 0)


def test_before_active_from_raises_not_yet_open():
    with pytest.raises(NotYetOpen):
        check_deployable(_dep(active_from=NOW + timedelta(hours=1)), NOW, 0)


def test_quota_reached_raises():
    with pytest.raises(QuotaExhausted):
        check_deployable(_dep(quota={"max_sessions": 5}), NOW, session_count=5)


def test_quota_under_cap_passes():
    check_deployable(_dep(quota={"max_sessions": 5}), NOW, session_count=4)


def test_no_max_sessions_key_ignores_quota():
    check_deployable(_dep(quota={}), NOW, session_count=999)  # no raise
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_deployable.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.deployments'`

- [ ] **Step 3: Implement `deployments.py`**

```python
from datetime import datetime


class DeploymentClosed(Exception):
    """now > active_until — new sessions refused (resume is still allowed, OD-14 sub-q5)."""


class NotYetOpen(Exception):
    """now < active_from — deployment not yet accepting sessions."""


class QuotaExhausted(Exception):
    """The per-deployment max_sessions cap has been reached."""


def check_deployable(deployment: dict, now: datetime, session_count: int) -> None:
    """Gate a NEW session mint against the deployment's active window + quota. Pure;
    the caller supplies `now` and the deployment's current session_count."""
    active_until = deployment.get("active_until")
    if active_until is not None and now > active_until:
        raise DeploymentClosed()
    active_from = deployment.get("active_from")
    if active_from is not None and now < active_from:
        raise NotYetOpen()
    quota = deployment.get("quota")
    if quota and quota.get("max_sessions") is not None and session_count >= quota["max_sessions"]:
        raise QuotaExhausted()
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_deployable.py -q`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/deployments.py viewer-service/tests/test_deployable.py
git commit -m "feat(viewer-service): check_deployable (active window + quota gate)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Lifecycle wiring into sessions (mint gating + ephemeral)

**Files:**
- Modify: `viewer-service/src/viewer_service/sessions.py`, `viewer-service/src/viewer_service/api/sessions.py`
- Test: `viewer-service/tests/test_session_lifecycle.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_session_lifecycle.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE  # reuse fixtures (pytest prepend mode)


@pytest.fixture
def env(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    def make_dep(**over):
        body = {"questionnaire_ref": "qst_mini@v26.0609",
                "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
                "default_locale": "en", "available_locales": ["en", "pt"]}
        body.update(over)
        return client.post("/v1/deployments", json=body).json()["deployment_id"]
    return client, make_dep


def _mint(client, dep_id):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"})


def test_mint_past_active_until_is_410(env):
    client, make_dep = env
    dep = make_dep(active_until="2000-01-01T00:00:00Z")
    r = _mint(client, dep)
    assert r.status_code == 410
    assert r.json()["error"]["code"] == "gone"


def test_mint_before_active_from_is_409(env):
    client, make_dep = env
    dep = make_dep(active_from="2099-01-01T00:00:00Z")
    r = _mint(client, dep)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "not_yet_open"


def test_quota_exhausted_is_409(env):
    client, make_dep = env
    dep = make_dep(quota={"max_sessions": 1})
    assert _mint(client, dep).status_code == 201          # first ok
    r = _mint(client, dep)                                 # second over cap
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "quota_exhausted"


def test_anonymous_link_session_not_ephemeral(env):
    client, make_dep = env
    s = _mint(client, make_dep()).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).status_code == 200


def test_demo_session_refuses_resume_409(env):
    client, make_dep = env
    dep = make_dep(mode_preset="demo")
    s = _mint(client, dep).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).status_code == 409
    assert client.get(f"/v1/sessions/{s['session_id']}/runtime", headers=h).status_code == 409
    assert client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "pt"}, headers=h).status_code == 409
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_lifecycle.py -q`
Expected: FAIL (mint not gated → 201 where 410/409 expected; ephemeral resume → 200 not 409).

- [ ] **Step 3: Edit `sessions.py`** — gate the mint + set ephemeral. Add imports at the top and replace `new_session`:

```python
import uuid
from datetime import datetime, timezone

from .runtime import mint_runtime
from . import tokens
from . import deployments as deploy_svc
from .store import sessions as session_store
from .store import deployments as dep_store
from .store import viewers as viewer_store


def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None) -> dict:
    """Gate against the active window + quota, mint the runtime, allocate session + token."""
    session_count = session_store.count_for_deployment(conn, deployment["deployment_id"])
    deploy_svc.check_deployable(deployment, datetime.now(timezone.utc), session_count)
    runtime = mint_runtime(conn, deployment, viewer, requested_locale)
    locale = runtime["locale"]
    session_id = str(uuid.uuid4())
    token = tokens.mint_token()
    agent_id = "agent_" + uuid.uuid4().hex[:8]
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    ephemeral = (deployment.get("dimensions") or {}).get("persistence") == "ephemeral"
    session_store.insert_session(
        conn, ephemeral=ephemeral, session_id=session_id, session_index=1,
        deployment_id=deployment["deployment_id"], viewer_id=viewer_id,
        viewer_version=viewer_version, agent_id=agent_id, instrument_id=qst_id,
        instrument_version=qst_version, status="in_progress", token_hash=tokens.hash_token(token),
        initial_locale=locale, last_active_locale=locale)
    conn.commit()
    return {"session_id": session_id, "session_token": token, "runtime": runtime}
```

(Keep `session_runtime`, `LocaleNotAvailable`, `switch_locale` unchanged.)

- [ ] **Step 4: Edit `api/sessions.py`** — map the new mint exceptions + add the ephemeral guard. Update imports to include `from .. import deployments as deploy_svc`, then replace the four route bodies:

```python
@router.post("/sessions/new", status_code=201)
def new(body: SessionNew, conn=Depends(get_conn)):
    dep = dep_store.get_deployment(conn, body.deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    viewer = viewer_store.get_viewer(conn, body.viewer_id, body.viewer_version)
    if viewer is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    try:
        return sessions_svc.new_session(conn, dep, viewer, body.viewer_id, body.viewer_version, body.locale)
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


def _ephemeral_409():
    return JSONResponse(status_code=409, content={"error": {
        "code": "ephemeral_no_resume", "message": "demo/ephemeral sessions cannot be resumed; mint a new session"}})


@router.get("/sessions/{session_id}")
def get(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    if session["ephemeral"]:
        return _ephemeral_409()
    return {"status": session["status"], "last_active_locale": session["last_active_locale"],
            "outbox": outbox_store.counts_for_session(conn, session_id)}


@router.get("/sessions/{session_id}/runtime")
def runtime(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    if session["ephemeral"]:
        return _ephemeral_409()
    return sessions_svc.session_runtime(conn, session)


@router.post("/sessions/{session_id}/locale")
def locale(session_id: str, body: LocaleSwitch, session=Depends(require_session), conn=Depends(get_conn)):
    if session["ephemeral"]:
        return _ephemeral_409()
    try:
        return {"runtime": sessions_svc.switch_locale(conn, session, body.locale)}
    except sessions_svc.LocaleNotAvailable:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid", "message": f"locale '{body.locale}' not in deployment.available_locales"}})
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_lifecycle.py -q`
Expected: PASS (6 passed). Also re-run the prior session tests: `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_sessions_api.py -q` → still PASS (those deployments have no window/quota and are anonymous_link → not ephemeral).

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/sessions.py viewer-service/src/viewer_service/api/sessions.py viewer-service/tests/test_session_lifecycle.py
git commit -m "feat(viewer-service): wire OD-14 lifecycle into mint/resume (active window, quota, ephemeral)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Ephemeral submission skips the outbox

**Files:**
- Modify: `viewer-service/src/viewer_service/submission.py`, `viewer-service/src/viewer_service/api/submission.py`
- Test: `viewer-service/tests/test_ephemeral_submission.py`

- [ ] **Step 1: Write the failing test** (`tests/test_ephemeral_submission.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE
from test_submission_api import _response_set  # reuse the valid Schema 5 fixture


@pytest.fixture
def demo_session(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609", "mode_preset": "demo",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()["deployment_id"]
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return client, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


def test_ephemeral_responses_accepted_but_not_enqueued(demo_session):
    client, sid, h = demo_session
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 202
    assert r.json() == {"ephemeral": True}
    # nothing queued — verify directly via the outbox store (the resume endpoint is 409 for demo)
    from viewer_service.store import outbox
    import psycopg, os
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        assert outbox.counts_for_session(c, sid) == {"pending": 0, "forwarded": 0, "failed": 0}


def test_ephemeral_invalid_submission_still_422(demo_session):
    client, sid, h = demo_session
    r = client.post(f"/v1/sessions/{sid}/responses", json={"bad": 1}, headers=h)
    assert r.status_code == 422
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_ephemeral_submission.py -q`
Expected: FAIL (ephemeral path not implemented → returns `{enqueued: ...}` / enqueues a row).

- [ ] **Step 3: Edit `submission.py`** — `submit` gains an `ephemeral` parameter:

```python
def submit(conn, session_id: str, kind: str, payload: dict, schemas_dir, ephemeral: bool = False) -> int | None:
    """Validate the payload (Schema 5 / 4a). For an ephemeral (demo) session, return None
    WITHOUT enqueuing ('no data leaves VS'). Otherwise bounds-check + enqueue + return the
    outbox id. Raises jsonschema.ValidationError (bad body) or OutboxFull (hard cap)."""
    if kind == "responses":
        validate_response(payload, schemas_dir)
    else:
        validate_events(payload, schemas_dir)
    if ephemeral:
        return None
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    oid = outbox_store.enqueue(conn, session_id, kind, payload, canonical_hash(payload))
    conn.commit()
    return oid
```

(Validation now runs before the bounds check so an ephemeral invalid body still 422s; the persisted path is otherwise unchanged.)

- [ ] **Step 4: Edit `api/submission.py`** — pass `session["ephemeral"]` and branch the 202 body:

```python
def _enqueue(session_id: str, kind: str, payload: dict, conn, ephemeral: bool):
    try:
        oid = submission_svc.submit(conn, session_id, kind, payload, get_settings().schemas_dir, ephemeral)
    except submission_svc.OutboxFull:
        return JSONResponse(status_code=503, content={"error": {
            "code": "service_unavailable", "message": "submission queue is full; try again later"}})
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid_submission", "message": e.message}})
    if oid is None:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    return JSONResponse(status_code=202, content={"enqueued": oid})


@router.post("/sessions/{session_id}/responses")
def responses(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "responses", payload, conn, session["ephemeral"])


@router.post("/sessions/{session_id}/events")
def events(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "events", payload, conn, session["ephemeral"])
```

(Keep the `complete` route unchanged.)

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_ephemeral_submission.py viewer-service/tests/test_submission_api.py -q`
Expected: PASS (ephemeral tests + the VS-B persisted submission tests both green).

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/submission.py viewer-service/src/viewer_service/api/submission.py viewer-service/tests/test_ephemeral_submission.py
git commit -m "feat(viewer-service): ephemeral (demo) submissions validate but skip the outbox

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: README + FOLLOWUPS + final gate

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`

- [ ] **Step 1: Update `viewer-service/README.md`.** (a) Insert these rows into the endpoint table after the `POST /deployments` row:

```markdown
| `GET /v1/deployments` | List deployment summaries. |
| `PATCH /v1/deployments/{id}` | Narrow update — `active_until` and/or `quota` only. |
```

(b) Add a short paragraph after the endpoint table:

```markdown
## Deployment modes & lifecycle (VS-C)

`POST /deployments` takes a `mode_preset` (default `anonymous_link`; `demo` also supported —
others require Identity/Platform and are rejected). The preset resolves to the four orthogonal
dimensions (auth/persistence/lifecycle/rendering_context). At `/sessions/new` the active window
(`active_from`/`active_until`) and a per-deployment `quota.max_sessions` are enforced: minting past
`active_until` → `410`, before `active_from` or over quota → `409`. **Demo (ephemeral)** deployments
mint sessions whose submissions are validated but never forwarded ("no data leaves VS"), and which
refuse resume (`409 ephemeral_no_resume`). Resume of an in-progress session is allowed even after
`active_until` (asymmetric, OD-14).
```

- [ ] **Step 2: Append to `viewer-service/FOLLOWUPS.md`:**

```markdown

## VS-C follow-ups

- **Ephemeral session TTL purge.** Demo sessions skip the outbox + refuse resume, but their
  `session` rows are not yet purged; add an age-based sweeper before production.
- **Per-condition quota.** Only a per-deployment `max_sessions` cap exists; per-condition caps
  need Participant-Platform condition assignment (Phase 5).
- **Non-`none`-auth presets.** access_code / platform_study / embedded / kiosk / preview are
  rejected at create until Identity/Platform/host integration lands (OD-08).
- **Full deployment update.** Only `active_until` + `quota` are mutable via PATCH; broader edits
  (e.g. locale set, overrides) would need careful in-flight-session semantics.
- **Style/flow override application.** Overrides are stored + validated, but applying them to the
  runtime (resolving instrument vs deployment values per R18) is the Web Viewer / runtime concern —
  not wired here.
```

- [ ] **Step 3: Run the full verification gate** (each suite separately):

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q
.venv/bin/pytest questionnaire-runtime-denormaliser/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest tools/tests/ -q
```
Expected: viewer-service all green (VS-A+VS-B+VS-C); `library/` 126; denormaliser 56; tools 309. Report counts.

- [ ] **Step 4: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): VS-C README + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** schema ALTERs + session.ephemeral (T1) ✓ · mode presets (T2) ✓ · full deployment record + CRUD + preset/override validation + list + patch (T3) ✓ · check_deployable active-window/quota (T4) ✓ · mint gating (410/409) + ephemeral flag + ephemeral resume 409 + asymmetric active_until (T5) ✓ · ephemeral submission skips outbox (T6) ✓ · README/FOLLOWUPS/gate (T7) ✓. UC-04 (anonymous_link default) + UC-08 (demo preset) delivered across T2/T3/T5/T6.
- **Type consistency:** `insert_session(conn, ephemeral=False, **fields)` (T1) used by `new_session(... ephemeral=...)` (T5); `insert_deployment(conn, **fields)` with `_COLS` (T3) called with the full kwarg set by the create route (T3); `check_deployable(deployment, now, session_count)` (T4) called by `new_session` (T5); `count_for_deployment(conn, deployment_id)` (T1) used in T5; `resolve_preset(preset)->dict` / `UnsupportedPreset` (T2) used in T3; `submit(conn, session_id, kind, payload, schemas_dir, ephemeral=False)` (T6) called by `_enqueue` (T6); `session["ephemeral"]` available because T1 adds it to `_SELECT_COLS`.
- **No placeholders:** every step has real code + commands + expected output.
- **Cross-task safety:** `mode_preset` defaults to `anonymous_link` so VS-A/VS-B fixtures that omit it keep working (T3 step 7 verifies); `insert_session`'s `ephemeral` kwarg defaults false so VS-B callers are unaffected (T1 step 6 verifies); the GET `/deployments` list route is registered before `/deployments/{id}`.
```
