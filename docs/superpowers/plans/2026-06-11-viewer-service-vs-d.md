# Viewer Service VS-D (Response Export / CSV Serializer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /v1/deployments/{id}/export.csv` to `viewer-service/` — streaming a BDM-native CSV of every collected response for a deployment (read from the VS-B outbox, flattened from Schema 5 payloads, fixed 72-column header).

**Architecture:** A pure `export_csv` serializer (columns derived from the Schema 5 `Response` schema; `to_csv` generator; `_cell` JSON-encodes non-scalars), a streaming `iter_response_rows` outbox query, and a thin `StreamingResponse` endpoint whose generator opens its own DB connection.

**Tech Stack:** Python 3.12 · FastAPI (`StreamingResponse`) · psycopg 3 · stdlib `csv`/`json` · pytest + testcontainers.

**Spec:** [docs/superpowers/specs/2026-06-11-viewer-service-vs-d-design.md](../specs/2026-06-11-viewer-service-vs-d-design.md)

---

## File structure

```
viewer-service/src/viewer_service/
├── export_csv.py        # NEW: response_columns + _cell + _flush + to_csv
├── store/
│   └── export.py        # NEW: iter_response_rows(conn, deployment_id)
└── api/
    ├── app.py           # (modify) register the export router
    └── export.py        # NEW: GET /deployments/{id}/export.csv
tests/
├── test_export_csv.py   # pure unit
├── test_export_store.py # testcontainers
└── test_export_api.py   # testcontainers + TestClient
```

**Environment:** repo root `/home/pedro/Repos/Cursor/questionnaire_apps`; branch `phase2-viewer-service-vs-d` (already checked out). venv pytest by ABSOLUTE PATH: `/home/pedro/Repos/Cursor/questionnaire_apps/.venv/bin/pytest`. Integration tests need `DOCKER_CONFIG=/tmp/lib_docker`. `viewer_service` + `denormaliser` installed editable.

---

### Task 1: CSV serializer (export_csv.py)

**Files:**
- Create: `viewer-service/src/viewer_service/export_csv.py`
- Test: `viewer-service/tests/test_export_csv.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_export_csv.py`)

```python
from pathlib import Path
from viewer_service.export_csv import response_columns, to_csv, _cell

SCHEMAS = str(Path(__file__).resolve().parents[2] / "schemas")


def test_response_columns_order_and_count():
    cols = response_columns(SCHEMAS)
    assert len(cols) == 72
    assert cols[0] == "response_id"
    assert cols[-1] == "extensions"
    assert "session_id" in cols and "stimulus_type" in cols


def test_cell_rendering():
    assert _cell(None) == ""
    assert _cell(5) == "5"
    assert _cell("x") == "x"
    assert _cell(True) == "True"
    assert _cell({"a": 1}) == '{"a":1}'
    assert _cell([1, 2]) == "[1,2]"


def test_to_csv_header_then_rows():
    cols = ("response_id", "agent_id", "extensions")
    rows = [{"response_id": 1, "agent_id": "a1", "extensions": {"k": "v"}},
            {"response_id": 2, "agent_id": "a2"}]  # missing 'extensions' -> empty cell
    lines = "".join(to_csv(rows, cols)).splitlines()
    assert lines[0] == "response_id,agent_id,extensions"
    assert lines[1] == '1,a1,"{""k"":""v""}"'   # csv quotes the JSON cell (contains ")
    assert lines[2] == "2,a2,"                    # absent extensions -> trailing empty


def test_to_csv_is_streaming_generator():
    import types
    assert isinstance(to_csv([], ("response_id",)), types.GeneratorType)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_export_csv.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.export_csv'`

- [ ] **Step 3: Implement `export_csv.py`**

```python
import csv
import io
import json
from collections.abc import Iterable, Iterator
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=4)
def response_columns(schemas_dir_str: str) -> tuple[str, ...]:
    """The fixed CSV column set: every Schema 5 Response property, in declared order.
    Derived from the schema so it stays in sync with Schema 5 / BDM."""
    schema = json.loads((Path(schemas_dir_str) / "response" / "schema.json").read_text())
    return tuple(schema["$defs"]["Response"]["properties"].keys())


def _cell(v) -> str:
    """Render one CSV cell: None -> empty; object/array -> compact JSON string; scalar -> str."""
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    return str(v)


def _flush(buf: io.StringIO) -> str:
    line = buf.getvalue()
    buf.seek(0)
    buf.truncate(0)
    return line


def to_csv(rows: Iterable[dict], columns) -> Iterator[str]:
    """Stream a BDM-native CSV: a header line of `columns`, then one line per row (cells
    pulled by column name; absent fields render empty). Constant-memory (one reused buffer)."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    yield _flush(buf)
    for row in rows:
        writer.writerow([_cell(row.get(c)) for c in columns])
        yield _flush(buf)
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_export_csv.py -q`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/export_csv.py viewer-service/tests/test_export_csv.py
git commit -m "feat(viewer-service): BDM-native CSV serializer (Schema 5 -> CSV)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Export query (store/export.py)

**Files:**
- Create: `viewer-service/src/viewer_service/store/export.py`
- Test: `viewer-service/tests/test_export_store.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_export_store.py`)

```python
from viewer_service.store import export as export_store
from viewer_service.store import sessions as session_store
from viewer_service.store import outbox


def _session(conn, sid, dep):
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id=dep, viewer_id="web",
        viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
        instrument_version="v26.0609", status="submitted", token_hash="h",
        initial_locale="en", last_active_locale="en")
    conn.commit()


def test_flattens_responseset_and_bare_and_skips_events(conn):
    _session(conn, "s1", "dep_X")
    outbox.enqueue(conn, "s1", "responses",
                   {"session_id": "s1", "responses": [{"response_id": 1}, {"response_id": 2}]}, "h1")
    outbox.enqueue(conn, "s1", "responses", {"response_id": 3}, "h2")   # bare Response
    outbox.enqueue(conn, "s1", "events", {"id": "e1"}, "h3")            # ignored (kind != responses)
    conn.commit()
    rows = list(export_store.iter_response_rows(conn, "dep_X"))
    assert [r["response_id"] for r in rows] == [1, 2, 3]


def test_scopes_to_deployment(conn):
    _session(conn, "s1", "dep_A")
    _session(conn, "s2", "dep_B")
    outbox.enqueue(conn, "s1", "responses", {"response_id": 1}, "h1")
    outbox.enqueue(conn, "s2", "responses", {"response_id": 99}, "h2")
    conn.commit()
    assert [r["response_id"] for r in export_store.iter_response_rows(conn, "dep_A")] == [1]


def test_empty_deployment_yields_nothing(conn):
    assert list(export_store.iter_response_rows(conn, "dep_none")) == []
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_export_store.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.store.export'`

- [ ] **Step 3: Implement `store/export.py`**

```python
import psycopg
from collections.abc import Iterator


def iter_response_rows(conn: psycopg.Connection, deployment_id: str) -> Iterator[dict]:
    """Yield every Schema 5 Response collected for a deployment, flattened from the outbox.
    Reads only kind='responses' rows for the deployment's sessions, in insertion order. A
    ResponseSet payload ({session_id, responses[]}) yields each of its responses; a bare
    Response payload yields itself. Demo/ephemeral sessions have no outbox rows -> excluded."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.deployment_id = %s AND o.kind = 'responses' ORDER BY o.id", (deployment_id,))
    for (payload,) in cur:
        if isinstance(payload, dict) and "responses" in payload:
            yield from payload["responses"]
        else:
            yield payload
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_export_store.py -q`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/store/export.py viewer-service/tests/test_export_store.py
git commit -m "feat(viewer-service): export query (flatten outbox responses for a deployment)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Export endpoint (api/export.py)

**Files:**
- Create: `viewer-service/src/viewer_service/api/export.py`
- Modify: `viewer-service/src/viewer_service/api/app.py`
- Test: `viewer-service/tests/test_export_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_export_api.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE      # reuse fixtures (pytest prepend mode)
from test_submission_api import _response_set       # valid Schema 5 ResponseSet builder


def _make_deployment(client, **over):
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    body.update(over)
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


@pytest.fixture
def deployed(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = _make_deployment(client)
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    client.post(f"/v1/sessions/{s['session_id']}/responses", json=_response_set(s["session_id"]), headers=h)
    return client, dep


def test_export_returns_csv_attachment_with_header_and_row(deployed):
    client, dep = deployed
    r = client.get(f"/v1/deployments/{dep}/export.csv")
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    lines = r.text.splitlines()
    assert lines[0].split(",")[0] == "response_id"      # header (first column)
    assert len(lines) == 2                              # header + the one submitted response
    assert lines[1].split(",")[0] == "1"                # response_id == 1 from _response_set


def test_export_unknown_deployment_404(deployed):
    client, _ = deployed
    assert client.get("/v1/deployments/dep_nope/export.csv").status_code == 404


def test_export_empty_deployment_header_only(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    dep = _make_deployment(client)
    r = client.get(f"/v1/deployments/{dep}/export.csv")
    assert r.status_code == 200
    assert len(r.text.splitlines()) == 1                # header only, no responses yet
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_export_api.py -q`
Expected: FAIL (404 on the export route — not registered yet).

- [ ] **Step 3: Implement `api/export.py`**

```python
import psycopg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from .deps import get_conn
from ..config import get_settings
from .. import export_csv
from ..store import deployments as dep_store
from ..store import export as export_store

router = APIRouter()


@router.get("/deployments/{deployment_id}/export.csv")
def export(deployment_id: str, conn=Depends(get_conn)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    columns = export_csv.response_columns(str(get_settings().schemas_dir))

    def stream():
        # own connection for the stream (request-scoped conn above is only for the 404 check)
        with psycopg.connect(get_settings().database_url) as c:
            yield from export_csv.to_csv(export_store.iter_response_rows(c, deployment_id), columns)

    return StreamingResponse(stream(), media_type="text/csv", headers={
        "Content-Disposition": f'attachment; filename="{deployment_id}_responses.csv"'})
```

- [ ] **Step 4: Register the router in `api/app.py`** — add `export` to the import line and an `include_router` line:

```python
    from . import viewers, deployments, runtime, admin, sessions, submission, export
```
and, after the existing `app.include_router(submission.router, prefix="/v1")` line:
```python
    app.include_router(export.router, prefix="/v1")
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_export_api.py -q`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/export.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_export_api.py
git commit -m "feat(viewer-service): GET /deployments/{id}/export.csv (streaming response export)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: README + FOLLOWUPS + final gate

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`

- [ ] **Step 1: Update `viewer-service/README.md`** — insert this row into the endpoint table (after the `PATCH /v1/deployments/{id}` row):

```markdown
| `GET /v1/deployments/{id}/export.csv` | Stream a BDM-native CSV of all collected responses for the deployment (UC-11). |
```

- [ ] **Step 2: Append to `viewer-service/FOLLOWUPS.md`:**

```markdown

## VS-D follow-ups

- **Events export.** Only response data (Schema 5) is exported; a Schema 4a events export is later.
- **Other formats + codebook.** Parquet / SPSS `.sav` / R `.rds` / JSON exports and the accompanying
  codebook (variable/value labels) are post-MVP (CSV is the Phase-2 format per OD-17 / 05_data_model).
- **Large-export streaming.** `iter_response_rows` iterates the result set; for very large deployments,
  switch to a server-side (named) cursor / `fetchmany` batching.
- **Per-session export + filtering.** Whole-deployment raw dump only; per-session export and
  filtering/aggregation are later.
- **VS-E (next):** monitoring dashboard (UC-12) + theme infrastructure (UC-13 infra).
- **Deferred:** Behaverse reconciliation + the `validated` session state (reconciliation needs a
  Behaverse query endpoint that doesn't exist yet; `validated` is a no-op stub).
```

- [ ] **Step 3: Run the full verification gate** (each suite separately):

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q
.venv/bin/pytest questionnaire-runtime-denormaliser/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest tools/tests/ -q
```
Expected: viewer-service all green (VS-A+B+C+D); `library/` 126; denormaliser 56; tools 309. Report counts.

- [ ] **Step 4: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): VS-D README + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** `response_columns` (72, schema-derived) + `to_csv` (header + rows, `_cell` JSON/None/scalar) (T1) ✓ · `iter_response_rows` (flatten ResponseSet/bare, skip events, scope to deployment) (T2) ✓ · streaming endpoint + 404 + own-connection (T3) ✓ · README/FOLLOWUPS/gate (T4) ✓. All collected responses regardless of forwarding status (T2 SQL has no status filter) ✓; demo/ephemeral excluded (no outbox rows) ✓.
- **Type consistency:** `response_columns(schemas_dir_str: str) -> tuple` (T1) called with `str(get_settings().schemas_dir)` (T3); `to_csv(rows, columns)` (T1) fed `iter_response_rows(c, deployment_id)` + `columns` (T3); `iter_response_rows(conn, deployment_id)` (T2) consistent; `_cell`/`_flush` are module-private helpers used only inside `to_csv`.
- **No placeholders:** every step has real code + commands + expected output.
- **Cross-task safety:** T3 adds a new router (no signature changes to existing modules); the endpoint's own-connection generator + the request-scoped `Depends(get_conn)` 404-check avoids the FastAPI yield-dependency-vs-streaming pitfall. No existing VS-A/B/C tests are touched (T4 gate re-runs the whole suite to confirm).
```
