# Viewer Service VS-E (Monitoring Dashboard + Theme Infrastructure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Viewer Service with two modules — a per-deployment **metrics snapshot** endpoint (UC-12) and **theme infrastructure** (UC-13 infra: theme store + WCAG-at-save + built-ins + session-mint injection).

**Architecture:** Pure metric/theme service functions over the existing `session`/`outbox`/`deployment` tables + a new `theme` table; thin FastAPI routes; a pure WCAG contrast check; built-in themes seeded by `migrate`; `new_session` returns the resolved theme.

**Tech Stack:** Python 3.12 · FastAPI · psycopg 3 (`jsonb`) · stdlib only (pure WCAG contrast) · pytest + testcontainers.

**Spec:** [docs/superpowers/specs/2026-06-11-viewer-service-vs-e-design.md](../specs/2026-06-11-viewer-service-vs-e-design.md)

---

## File structure

```
viewer-service/src/viewer_service/
├── themes.py             # NEW: contrast_ratio, check_accessibility, ThemeAccessibilityError, BUILTIN_THEMES, seed_builtin_themes
├── metrics.py            # NEW: deployment_metrics(conn, deployment_id, *, soft_threshold, now)
├── models.py             # (modify) + ThemeCreate
├── sessions.py           # (modify) new_session returns resolved theme
├── cli.py                # (modify) migrate also seeds built-in themes
├── store/
│   ├── schema.sql        # (modify) + theme table
│   ├── themes.py         # NEW: insert_theme / get_theme / list_themes
│   └── metrics.py        # NEW: session_status_counts / recent_submitted / outbox_forwarding_stats
└── api/
    ├── app.py            # (modify) register themes + metrics routers
    ├── themes.py         # NEW: POST/GET /themes
    └── metrics.py        # NEW: GET /deployments/{id}/metrics
tests/
├── test_themes_store.py
├── test_themes_unit.py
├── test_themes_api.py
├── test_metrics.py
├── test_metrics_api.py
└── test_session_theme.py
```

**Environment:** repo root `/home/pedro/Repos/Cursor/questionnaire_apps`; branch `phase2-viewer-service-vs-e` (already checked out). venv pytest by ABSOLUTE PATH: `/home/pedro/Repos/Cursor/questionnaire_apps/.venv/bin/pytest`. Integration tests need `DOCKER_CONFIG=/tmp/lib_docker`. `viewer_service` + `denormaliser` installed editable.

---

### Task 1: theme table + store + conftest truncate

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql`, `viewer-service/tests/conftest.py`
- Create: `viewer-service/src/viewer_service/store/themes.py`
- Test: `viewer-service/tests/test_themes_store.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_themes_store.py`)

```python
from viewer_service.store import themes as store


def test_insert_get_list_theme(conn):
    store.insert_theme(conn, theme_id="thm_x", name="X",
                       palette={"primary": "#1a5fb4"}, typography={"font_family": "Inter", "base_size": 16},
                       spacing={"unit": 8}, logo_url=None, custom_css=None)
    t = store.get_theme(conn, "thm_x")
    assert t["name"] == "X"
    assert t["palette"]["primary"] == "#1a5fb4"
    assert t["typography"]["base_size"] == 16
    assert store.get_theme(conn, "nope") is None
    assert [x["theme_id"] for x in store.list_themes(conn)] == ["thm_x"]


def test_insert_is_idempotent(conn):
    store.insert_theme(conn, theme_id="thm_x", name="X", palette={}, typography={},
                       spacing=None, logo_url=None, custom_css=None)
    store.insert_theme(conn, theme_id="thm_x", name="Y", palette={}, typography={},
                       spacing=None, logo_url=None, custom_css=None)
    assert store.get_theme(conn, "thm_x")["name"] == "X"   # ON CONFLICT DO NOTHING
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_themes_store.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.store.themes'`

- [ ] **Step 3: Append the `theme` table to `store/schema.sql`** (after the existing tables):

```sql
CREATE TABLE IF NOT EXISTS theme (
  theme_id    text PRIMARY KEY,
  name        text NOT NULL,
  palette     jsonb NOT NULL,
  typography  jsonb NOT NULL,
  spacing     jsonb,
  logo_url    text,
  custom_css  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 4: Update the conftest TRUNCATE** in `viewer-service/tests/conftest.py` to include `theme`:

```python
        c.execute("TRUNCATE deployment, viewer_registry, runtime_cache, session, outbox, theme CASCADE")
```

- [ ] **Step 5: Implement `store/themes.py`**

```python
import psycopg
from psycopg.types.json import Jsonb

_COLS = ("theme_id", "name", "palette", "typography", "spacing", "logo_url", "custom_css")
_JSONB = {"palette", "typography", "spacing"}
_SELECT = _COLS + ("created_at",)


def _wrap(col, val):
    return Jsonb(val) if (col in _JSONB and val is not None) else val


def insert_theme(conn: psycopg.Connection, **fields) -> None:
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO theme ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))}) ON CONFLICT (theme_id) DO NOTHING", vals)
    conn.commit()


def get_theme(conn: psycopg.Connection, theme_id: str) -> dict | None:
    row = conn.execute(f"SELECT {', '.join(_SELECT)} FROM theme WHERE theme_id=%s", (theme_id,)).fetchone()
    return dict(zip(_SELECT, row)) if row else None


def list_themes(conn: psycopg.Connection) -> list[dict]:
    rows = conn.execute(f"SELECT {', '.join(_SELECT)} FROM theme ORDER BY theme_id").fetchall()
    return [dict(zip(_SELECT, r)) for r in rows]
```

- [ ] **Step 6: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_themes_store.py -q`
Expected: PASS (2 passed)

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/store/themes.py viewer-service/src/viewer_service/store/schema.sql viewer-service/tests/conftest.py viewer-service/tests/test_themes_store.py
git commit -m "feat(viewer-service): theme table + store

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: WCAG check + built-in themes (themes.py)

**Files:**
- Create: `viewer-service/src/viewer_service/themes.py`
- Test: `viewer-service/tests/test_themes_unit.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_themes_unit.py`)

```python
import pytest
from viewer_service.themes import (
    contrast_ratio, check_accessibility, ThemeAccessibilityError, BUILTIN_THEMES)


def test_contrast_ratio_known_pairs():
    assert round(contrast_ratio("#000000", "#ffffff")) == 21
    assert contrast_ratio("#ffffff", "#ffffff") == 1.0


def test_check_passes_accessible_palette():
    check_accessibility({"primary": "#1a5fb4"}, {"base_size": 16})  # no raise


def test_check_fails_low_contrast():
    with pytest.raises(ThemeAccessibilityError) as ei:
        check_accessibility({"primary": "#dddddd"}, {"base_size": 16})   # light grey on white
    assert any("primary" in f for f in ei.value.failures)


def test_check_fails_small_font():
    with pytest.raises(ThemeAccessibilityError) as ei:
        check_accessibility({"primary": "#000000"}, {"base_size": 10})
    assert any("base_size" in f for f in ei.value.failures)


def test_builtin_themes_are_accessible():
    assert len(BUILTIN_THEMES) >= 3
    ids = {t["theme_id"] for t in BUILTIN_THEMES}
    assert {"default", "institutional_blue", "institutional_green"}.issubset(ids)
    for t in BUILTIN_THEMES:
        check_accessibility(t["palette"], t["typography"])   # no raise
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_themes_unit.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.themes'`

- [ ] **Step 3: Implement `themes.py`**

```python
class ThemeAccessibilityError(Exception):
    """Raised when a theme fails the WCAG-AA contrast / min-font check."""

    def __init__(self, failures: list[str]):
        self.failures = failures
        super().__init__("; ".join(failures))


_TEXT_KEYS = ("primary", "secondary", "success", "warning", "error")
_MIN_CONTRAST = 4.5
_MIN_BASE_SIZE = 14


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def _luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    rl, gl, bl = (_srgb_to_linear(x) for x in (r, g, b))
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl


def contrast_ratio(hex_fg: str, hex_bg: str) -> float:
    """WCAG 2.1 contrast ratio (1..21) of two #rrggbb colours."""
    l1, l2 = _luminance(hex_fg), _luminance(hex_bg)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def check_accessibility(palette: dict, typography: dict) -> None:
    """WCAG-AA gate: each present text colour >= 4.5:1 vs background (default white);
    typography.base_size >= 14. Raises ThemeAccessibilityError listing every failure."""
    bg = palette.get("background", "#ffffff")
    failures: list[str] = []
    for key in _TEXT_KEYS:
        color = palette.get(key)
        if color is not None:
            ratio = contrast_ratio(color, bg)
            if ratio < _MIN_CONTRAST:
                failures.append(f"{key} {color}: contrast {ratio:.2f}:1 vs {bg} (need {_MIN_CONTRAST}:1)")
    if typography.get("base_size", 0) < _MIN_BASE_SIZE:
        failures.append(f"typography.base_size {typography.get('base_size', 0)} < {_MIN_BASE_SIZE}px")
    if failures:
        raise ThemeAccessibilityError(failures)


BUILTIN_THEMES = [
    {"theme_id": "default", "name": "Behaverse Default",
     "palette": {"primary": "#1a5fb4", "secondary": "#613583", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Inter, system-ui, sans-serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
    {"theme_id": "institutional_blue", "name": "Institutional Blue",
     "palette": {"primary": "#0b4f86", "secondary": "#1c5d99", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Georgia, serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
    {"theme_id": "institutional_green", "name": "Institutional Green",
     "palette": {"primary": "#1b5e3a", "secondary": "#2c6e49", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Inter, system-ui, sans-serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
]


def seed_builtin_themes(conn) -> None:
    """Idempotently upsert the built-in themes (ON CONFLICT DO NOTHING in the store)."""
    from .store import themes as store
    for t in BUILTIN_THEMES:
        store.insert_theme(conn, **t)
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_themes_unit.py -q`
Expected: PASS (5 passed). If `test_builtin_themes_are_accessible` fails, a built-in palette colour is below 4.5:1 on white — darken it until it passes (do NOT relax the check).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/themes.py viewer-service/tests/test_themes_unit.py
git commit -m "feat(viewer-service): WCAG-AA theme check + built-in themes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: theme API + migrate seeding

**Files:**
- Create: `viewer-service/src/viewer_service/api/themes.py`
- Modify: `viewer-service/src/viewer_service/models.py`, `viewer-service/src/viewer_service/api/app.py`, `viewer-service/src/viewer_service/cli.py`
- Test: `viewer-service/tests/test_themes_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_themes_api.py`)

```python
PASS_THEME = {"name": "My Theme",
              "palette": {"primary": "#1a5fb4", "secondary": "#613583", "background": "#ffffff"},
              "typography": {"font_family": "Inter", "base_size": 16}}


def test_create_theme_passes(client):
    r = client.post("/v1/themes", json=PASS_THEME)
    assert r.status_code == 201, r.text
    tid = r.json()["theme_id"]
    assert tid.startswith("thm_")
    assert client.get(f"/v1/themes/{tid}").json()["name"] == "My Theme"


def test_create_theme_blocked_by_wcag(client):
    bad = {"name": "Bad", "palette": {"primary": "#dddddd"}, "typography": {"base_size": 16}}
    r = client.post("/v1/themes", json=bad)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "theme_inaccessible"
    assert r.json()["error"]["detail"]   # lists the failure(s)


def test_get_unknown_theme_404(client):
    assert client.get("/v1/themes/thm_nope").status_code == 404


def test_seed_builtins_then_list(client, pg_url):
    import psycopg
    from viewer_service.themes import seed_builtin_themes
    with psycopg.connect(pg_url) as c:
        seed_builtin_themes(c)
    ids = {t["theme_id"] for t in client.get("/v1/themes").json()["items"]}
    assert {"default", "institutional_blue", "institutional_green"}.issubset(ids)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_themes_api.py -q`
Expected: FAIL (404/405 — no /themes routes).

- [ ] **Step 3: Add `ThemeCreate` to `models.py`** (append):

```python
class ThemeCreate(BaseModel):
    name: str
    palette: dict
    typography: dict
    spacing: dict | None = None
    logo_url: str | None = None
    custom_css: str | None = None
```

- [ ] **Step 4: Create `api/themes.py`**

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn
from ..models import ThemeCreate
from ..themes import check_accessibility, ThemeAccessibilityError
from ..store import themes as store

router = APIRouter()


@router.post("/themes", status_code=201)
def create(body: ThemeCreate, conn=Depends(get_conn)):
    try:
        check_accessibility(body.palette, body.typography)
    except ThemeAccessibilityError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "theme_inaccessible", "message": "theme failed the accessibility check",
            "detail": e.failures}})
    theme_id = "thm_" + uuid.uuid4().hex[:8]
    store.insert_theme(conn, theme_id=theme_id, name=body.name, palette=body.palette,
                       typography=body.typography, spacing=body.spacing,
                       logo_url=body.logo_url, custom_css=body.custom_css)
    return {"theme_id": theme_id}


@router.get("/themes")
def list_(conn=Depends(get_conn)):
    return {"items": store.list_themes(conn)}


@router.get("/themes/{theme_id}")
def get(theme_id: str, conn=Depends(get_conn)):
    t = store.get_theme(conn, theme_id)
    if t is None:
        raise HTTPException(status_code=404, detail="theme not found")
    return t
```

- [ ] **Step 5: Register the themes router in `api/app.py`** — add `themes` to the import line and an include after the export line:

```python
    from . import viewers, deployments, runtime, admin, sessions, submission, export, themes
```
```python
    app.include_router(themes.router, prefix="/v1")
```

- [ ] **Step 6: Make `cli.py migrate` seed built-ins.** In the `migrate` branch of `main`, after `apply_schema(conn)` and before `conn.commit()`, add the seed call:

```python
    if cmd == "migrate":
        from .themes import seed_builtin_themes
        with psycopg.connect(get_settings().database_url) as conn:
            apply_schema(conn)
            seed_builtin_themes(conn)
            conn.commit()
        print("schema applied")
        return 0
```

- [ ] **Step 7: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_themes_api.py -q`
Expected: PASS (4 passed)

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/api/themes.py viewer-service/src/viewer_service/api/app.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/cli.py viewer-service/tests/test_themes_api.py
git commit -m "feat(viewer-service): theme API (create w/ WCAG, list, get) + migrate seeding

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: metrics store + service

**Files:**
- Create: `viewer-service/src/viewer_service/store/metrics.py`, `viewer-service/src/viewer_service/metrics.py`
- Test: `viewer-service/tests/test_metrics.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_metrics.py`)

```python
from datetime import datetime, timezone, timedelta
from viewer_service.metrics import deployment_metrics
from viewer_service.store import sessions as ss, outbox, deployments as ds

NOW = datetime(2026, 6, 11, 12, 0, 0, tzinfo=timezone.utc)


def _dep(conn, did="dep_M", quota=None):
    ds.insert_deployment(conn, deployment_id=did, questionnaire_ref="qst_x@v26.0609",
                         runtime_policy={"scorer_impl_preference": ["wasm"]}, default_locale="en",
                         available_locales=["en"], quota=quota)
    conn.commit()


def _sess(conn, sid, did, status):
    ss.insert_session(conn, session_id=sid, session_index=1, deployment_id=did, viewer_id="web",
                      viewer_version="v", agent_id="a", instrument_id="qst_x",
                      instrument_version="v26.0609", status=status, token_hash="h",
                      initial_locale="en", last_active_locale="en")


def test_counts_completion_quota_recent(conn):
    _dep(conn, "dep_M", quota={"max_sessions": 5})
    _sess(conn, "s1", "dep_M", "in_progress")
    _sess(conn, "s2", "dep_M", "submitted")
    _sess(conn, "s3", "dep_M", "forwarded")
    conn.commit()
    m = deployment_metrics(conn, "dep_M", soft_threshold=10000, now=NOW)
    assert m["active_sessions"] == 1
    assert m["completion"] == {"started": 3, "completed": 2, "rate": 2 / 3}
    assert m["quota"] == {"max_sessions": 5, "used": 3, "remaining": 2}
    assert len(m["recent_submissions"]) == 2
    assert m["forwarding"] == {"unforwarded": 0, "oldest_unforwarded_age_seconds": None,
                               "last_error": None, "alert": False}


def test_forwarding_alert_and_age(conn):
    _dep(conn, "dep_F")
    _sess(conn, "s1", "dep_F", "submitted")
    oid = outbox.enqueue(conn, "s1", "responses", {"response_id": 1}, "h")
    conn.execute("UPDATE outbox SET status='pending', last_error='boom', created_at=%s WHERE id=%s",
                 (NOW - timedelta(seconds=30), oid))
    conn.commit()
    m = deployment_metrics(conn, "dep_F", soft_threshold=1, now=NOW)
    assert m["forwarding"]["unforwarded"] == 1
    assert m["forwarding"]["last_error"] == "boom"
    assert m["forwarding"]["oldest_unforwarded_age_seconds"] == 30.0
    assert m["forwarding"]["alert"] is True


def test_empty_deployment_zero_metrics(conn):
    _dep(conn, "dep_E")
    m = deployment_metrics(conn, "dep_E", soft_threshold=10000, now=NOW)
    assert m["active_sessions"] == 0
    assert m["completion"]["rate"] == 0.0
    assert m["quota"]["remaining"] is None
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_metrics.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.metrics'`

- [ ] **Step 3: Implement `store/metrics.py`**

```python
import psycopg


def session_status_counts(conn: psycopg.Connection, deployment_id: str) -> dict:
    rows = conn.execute("SELECT status, count(*) FROM session WHERE deployment_id=%s GROUP BY status",
                        (deployment_id,)).fetchall()
    return {status: n for status, n in rows}


def recent_submitted(conn: psycopg.Connection, deployment_id: str, limit: int = 10) -> list[dict]:
    rows = conn.execute(
        "SELECT session_id, session_index, status, submitted_at, forwarded_at FROM session "
        "WHERE deployment_id=%s AND status IN ('submitted','forwarded') "
        "ORDER BY submitted_at DESC NULLS LAST LIMIT %s", (deployment_id, limit)).fetchall()
    cols = ["session_id", "session_index", "status", "submitted_at", "forwarded_at"]
    return [dict(zip(cols, r)) for r in rows]


def outbox_forwarding_stats(conn: psycopg.Connection, deployment_id: str) -> dict:
    row = conn.execute(
        "SELECT count(*) FILTER (WHERE o.status='pending'), "
        "min(o.created_at) FILTER (WHERE o.status='pending') "
        "FROM outbox o JOIN session s ON o.session_id=s.session_id WHERE s.deployment_id=%s",
        (deployment_id,)).fetchone()
    err = conn.execute(
        "SELECT o.last_error FROM outbox o JOIN session s ON o.session_id=s.session_id "
        "WHERE s.deployment_id=%s AND o.last_error IS NOT NULL ORDER BY o.id DESC LIMIT 1",
        (deployment_id,)).fetchone()
    return {"unforwarded": row[0] or 0, "oldest_created_at": row[1],
            "last_error": err[0] if err else None}
```

- [ ] **Step 4: Implement `metrics.py`**

```python
from datetime import datetime, timezone

from .store import metrics as mstore
from .store import deployments as dep_store


def deployment_metrics(conn, deployment_id: str, *, soft_threshold: int, now: datetime | None = None) -> dict:
    """Per-deployment metrics snapshot for the monitoring dashboard (UC-12)."""
    now = now or datetime.now(timezone.utc)
    counts = mstore.session_status_counts(conn, deployment_id)
    started = sum(counts.values())
    completed = counts.get("submitted", 0) + counts.get("forwarded", 0)
    quota = (dep_store.get_deployment(conn, deployment_id) or {}).get("quota") or {}
    max_sessions = quota.get("max_sessions")
    fwd = mstore.outbox_forwarding_stats(conn, deployment_id)
    oldest_age = (now - fwd["oldest_created_at"]).total_seconds() if fwd["oldest_created_at"] else None
    return {
        "active_sessions": counts.get("in_progress", 0),
        "completion": {"started": started, "completed": completed,
                       "rate": (completed / started) if started else 0.0},
        "quota": {"max_sessions": max_sessions, "used": started,
                  "remaining": (max_sessions - started) if max_sessions is not None else None},
        "recent_submissions": mstore.recent_submitted(conn, deployment_id),
        "forwarding": {"unforwarded": fwd["unforwarded"],
                       "oldest_unforwarded_age_seconds": oldest_age,
                       "last_error": fwd["last_error"],
                       "alert": fwd["unforwarded"] >= soft_threshold},
    }
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_metrics.py -q`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/store/metrics.py viewer-service/src/viewer_service/metrics.py viewer-service/tests/test_metrics.py
git commit -m "feat(viewer-service): per-deployment metrics (store + service)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: metrics endpoint

**Files:**
- Create: `viewer-service/src/viewer_service/api/metrics.py`
- Modify: `viewer-service/src/viewer_service/api/app.py`
- Test: `viewer-service/tests/test_metrics_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_metrics_api.py`)

```python
def _make_deployment(client):
    return client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_x@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"]},
        "default_locale": "en", "available_locales": ["en"]}).json()["deployment_id"]


def test_metrics_endpoint_snapshot(client):
    dep = _make_deployment(client)
    r = client.get(f"/v1/deployments/{dep}/metrics")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["active_sessions"] == 0
    assert set(body) == {"active_sessions", "completion", "quota", "recent_submissions", "forwarding"}
    assert body["forwarding"]["alert"] is False


def test_metrics_unknown_deployment_404(client):
    assert client.get("/v1/deployments/dep_nope/metrics").status_code == 404
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_metrics_api.py -q`
Expected: FAIL (404 on the metrics route — not registered).

- [ ] **Step 3: Create `api/metrics.py`**

```python
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn
from ..config import get_settings
from ..metrics import deployment_metrics
from ..store import deployments as dep_store

router = APIRouter()


@router.get("/deployments/{deployment_id}/metrics")
def metrics(deployment_id: str, conn=Depends(get_conn)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return deployment_metrics(conn, deployment_id,
                              soft_threshold=get_settings().outbox_soft_threshold,
                              now=datetime.now(timezone.utc))
```

- [ ] **Step 4: Register the metrics router in `api/app.py`** — add `metrics` to the import line and an include after the themes line:

```python
    from . import viewers, deployments, runtime, admin, sessions, submission, export, themes, metrics
```
```python
    app.include_router(metrics.router, prefix="/v1")
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_metrics_api.py -q`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/metrics.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_metrics_api.py
git commit -m "feat(viewer-service): GET /deployments/{id}/metrics

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: session-mint theme injection

**Files:**
- Modify: `viewer-service/src/viewer_service/sessions.py`
- Test: `viewer-service/tests/test_session_theme.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_session_theme.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE   # reuse fixtures (pytest prepend mode)


@pytest.fixture
def env(client, monkeypatch, pg_url):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    import psycopg
    from viewer_service.themes import seed_builtin_themes
    with psycopg.connect(pg_url) as c:
        seed_builtin_themes(c)
    client.post("/v1/viewers", json=MANIFEST)
    return client


def _dep(client, **over):
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    body.update(over)
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


def _mint(client, dep):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()


def test_session_includes_theme_when_set(env):
    s = _mint(env, _dep(env, theme_id="default"))
    assert s["theme"]["theme_id"] == "default"
    assert s["theme"]["palette"]["primary"]


def test_session_theme_null_when_unset(env):
    s = _mint(env, _dep(env))
    assert s["theme"] is None
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_theme.py -q`
Expected: FAIL — `KeyError: 'theme'` (the `/sessions/new` response has no `theme` field yet).

- [ ] **Step 3: Edit `sessions.py`** — add the themes-store import and resolve the theme in `new_session`. Add to the imports:

```python
from .store import themes as themes_store
```

Replace the final `return {...}` of `new_session` with:

```python
    theme = themes_store.get_theme(conn, deployment["theme_id"]) if deployment.get("theme_id") else None
    return {"session_id": session_id, "session_token": token, "runtime": runtime, "theme": theme}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_theme.py -q`
Expected: PASS (2 passed). Also re-run the prior session tests: `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_sessions_api.py viewer-service/tests/test_session_lifecycle.py -q` → still PASS (they assert session_id/token/runtime; the new `theme` key doesn't break them).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/sessions.py viewer-service/tests/test_session_theme.py
git commit -m "feat(viewer-service): return the resolved theme bundle at session-mint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: README + FOLLOWUPS + final gate

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`

- [ ] **Step 1: Update `viewer-service/README.md`** — insert these rows into the endpoint table:

```markdown
| `GET /v1/deployments/{id}/metrics` | Per-deployment monitoring snapshot (UC-12): active/completion/quota/recent + forwarding alert. |
| `POST /v1/themes` · `GET /v1/themes` · `GET /v1/themes/{id}` | Theme infrastructure (UC-13 infra): create (WCAG-AA-checked), list, get. |
```

Add a short note near the end:

```markdown
## Monitoring & theming (VS-E)

`GET /deployments/{id}/metrics` returns a JSON snapshot (poll it; SSE is deferred until a dashboard
UI exists). `/themes` stores theme bundles; `POST /themes` runs a WCAG-AA check (palette text colours
>= 4.5:1 vs background + base_size >= 14) and blocks save on failure. `viewer-service migrate` seeds
the built-in themes (`default`, `institutional_blue`, `institutional_green`). `/sessions/new` returns
the deployment's resolved `theme` bundle (or null) for the viewer to apply.
```

- [ ] **Step 2: Append to `viewer-service/FOLLOWUPS.md`:**

```markdown

## VS-E follow-ups

- **SSE dashboard transport.** The metrics endpoint is a pollable JSON snapshot; add the 08a SSE
  stream when a dashboard UI consumes it.
- **Abandonment hotspots.** Per-question drop-off (Phase-5 dashboard) needs event-level telemetry.
- **Theme editor (Phase 6, UC-13).** No logo-upload / colour-picker / custom-CSS-authoring UI,
  accessibility-conformance UI, or theme versioning; `POST /themes` is a raw create (unauthenticated).
- **Theme application.** VS-E returns the bundle at session-mint; applying it (+ the R18 style/flow
  overrides) is the Web Viewer's job.
- **Viewer Service is now feature-complete for Phase 2 (VS-A..E).** Remaining Phase-2 gate work is
  non-VS: the Web Viewer, the WASM expression evaluator, and the Scorer conformance runner.
```

- [ ] **Step 3: Run the full verification gate** (each suite separately):

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q
.venv/bin/pytest questionnaire-runtime-denormaliser/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest tools/tests/ -q
```
Expected: viewer-service all green (VS-A..E); `library/` 126; denormaliser 56; tools 309. Report counts.

- [ ] **Step 4: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): VS-E README + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** theme table+store (T1) ✓ · WCAG check + built-ins + seed (T2) ✓ · theme API + migrate seeding (T3) ✓ · metrics store+service incl. forwarding alert (T4) ✓ · metrics endpoint + 404 (T5) ✓ · session-mint theme injection (T6) ✓ · README/FOLLOWUPS/gate (T7) ✓. Deferred items (SSE, abandonment, editor) are out of scope per spec.
- **Type consistency:** `insert_theme(conn, **fields)`/`get_theme`/`list_themes` (T1) used by `seed_builtin_themes` (T2) + `api/themes` (T3) + `new_session` (T6); `check_accessibility(palette, typography)` raising `ThemeAccessibilityError(failures)` (T2) used in `api/themes` (T3); `deployment_metrics(conn, deployment_id, *, soft_threshold, now=None)` (T4) called by `api/metrics` (T5); the three `store/metrics` query fns (T4) consistent.
- **No placeholders:** every step has real code + commands + expected output.
- **Cross-task safety:** T1 adds `theme` to the conftest TRUNCATE so tests stay isolated (built-ins are seeded per-test where needed); the new `theme` key on `/sessions/new` is additive (T6 re-runs the prior session suites); built-in palettes are dark enough to pass 4.5:1 on white (T2 asserts it); app.py gains two router registrations (T3 themes, T5 metrics) — distinct paths, no conflict with existing routes.
```
