# Viewer Service VS-B (Sessions + Submission + Forwarding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `viewer-service/` with the participant data path — session minting (+ opaque token + runtime), core resume + locale switch, response/event submission to a durable Postgres outbox, and an OD-13 forwarder (batch function + `forward-worker` CLI) shipping to a pluggable Behaverse sink.

**Architecture:** Two new tables (`session`, `outbox`); a token-auth dependency; session-mint reuses VS-A's `mint_runtime`; submissions validate (Schema 5 / 4a) and enqueue to the outbox in one transaction; `process_outbox_batch` claims due rows (`FOR UPDATE SKIP LOCKED`), forwards via a `Sink`, applies exponential back-off, and drives sessions `submitted → forwarded`.

**Tech Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3) · httpx · jsonschema + referencing · the `denormaliser` package · pytest + testcontainers · stdlib `secrets`/`hashlib`.

**Spec:** [docs/superpowers/specs/2026-06-10-viewer-service-vs-b-design.md](../specs/2026-06-10-viewer-service-vs-b-design.md)

---

## File structure

```
viewer-service/src/viewer_service/
├── config.py                 # (modify) + behaverse + outbox + forward settings
├── tokens.py                 # NEW
├── models.py                 # (modify) + SessionNew, LocaleSwitch
├── sessions.py               # NEW: new_session / session_runtime / switch_locale
├── submission.py             # NEW: submit() + OutboxFull
├── forwarding.py             # NEW: backoff_seconds + process_outbox_batch
├── sinks.py                  # NEW: SinkError + HTTPBehaverseSink
├── validation.py             # (modify) + validate_response, validate_events
├── cli.py                    # (modify) + forward-worker subcommand
├── store/
│   ├── schema.sql            # (modify) + session + outbox DDL
│   ├── sessions.py           # NEW
│   └── outbox.py             # NEW
└── api/
    ├── deps.py               # (modify) + require_session
    ├── app.py                # (modify) + 401 code + sessions/submission routers
    ├── sessions.py           # NEW (stub in Task 1, real in Task 7)
    └── submission.py         # NEW (stub in Task 1, real in Task 8)
viewer-service/tests/
├── test_tokens.py
├── test_outbox_store.py
├── test_session_store.py
├── test_sinks.py
├── test_forwarding.py
├── test_sessions_api.py
└── test_submission_api.py
```

**Environment:** repo root `/home/pedro/Repos/Cursor/questionnaire_apps`; branch `phase2-viewer-service-vs-b` (already checked out). venv binaries by ABSOLUTE PATH: `/home/pedro/Repos/Cursor/questionnaire_apps/.venv/bin/pytest`. Integration tests need `DOCKER_CONFIG=/tmp/lib_docker`. The `viewer_service` + `denormaliser` packages are installed editable. **Note:** `session_id` is stored as `text` (the uuid4 string) to avoid psycopg uuid/text cast friction; the value is a uuid4 string.

---

### Task 1: Foundation — config, schema, conftest, app wiring

**Files:**
- Modify: `viewer-service/src/viewer_service/config.py`
- Modify: `viewer-service/src/viewer_service/store/schema.sql`
- Modify: `viewer-service/tests/conftest.py`
- Modify: `viewer-service/src/viewer_service/api/app.py`
- Create: `viewer-service/src/viewer_service/api/sessions.py`, `viewer-service/src/viewer_service/api/submission.py` (stubs)
- Test: `viewer-service/tests/test_foundation.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_foundation.py`)

```python
from viewer_service.config import get_settings


def test_new_settings_have_defaults():
    s = get_settings()
    assert s.outbox_hard_threshold == 1_000_000
    assert s.outbox_soft_threshold == 10_000
    assert s.forward_max_attempts == 8
    assert s.forward_batch_size == 50
    assert s.behaverse_base_url  # non-empty default


def test_session_and_outbox_tables_exist(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_name IN ('session','outbox')"
    ).fetchall()
    assert {r[0] for r in rows} == {"session", "outbox"}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_foundation.py -q`
Expected: FAIL — `AttributeError: 'Settings' object has no attribute 'outbox_hard_threshold'`

- [ ] **Step 3: Extend `config.py`** — add fields to the `Settings` dataclass and `get_settings`:

```python
import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class Settings:
    database_url: str
    library_base_url: str
    schemas_dir: Path
    runtime_cache_cap: int = 10000
    denormaliser_version: str = "v26.0610"
    behaverse_base_url: str = "http://localhost:9000"
    behaverse_bearer_token: str = ""
    outbox_soft_threshold: int = 10_000
    outbox_hard_threshold: int = 1_000_000
    forward_max_attempts: int = 8
    forward_batch_size: int = 50


def get_settings() -> Settings:
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/viewer_service"),
        library_base_url=os.environ.get("LIBRARY_BASE_URL", "http://localhost:8000"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        runtime_cache_cap=int(os.environ.get("RUNTIME_CACHE_CAP", "10000")),
        denormaliser_version=os.environ.get("DENORMALISER_VERSION", "v26.0610"),
        behaverse_base_url=os.environ.get("BEHAVERSE_BASE_URL", "http://localhost:9000"),
        behaverse_bearer_token=os.environ.get("BEHAVERSE_BEARER_TOKEN", ""),
        outbox_soft_threshold=int(os.environ.get("OUTBOX_SOFT_THRESHOLD", "10000")),
        outbox_hard_threshold=int(os.environ.get("OUTBOX_HARD_THRESHOLD", "1000000")),
        forward_max_attempts=int(os.environ.get("FORWARD_MAX_ATTEMPTS", "8")),
        forward_batch_size=int(os.environ.get("FORWARD_BATCH_SIZE", "50")),
    )
```

- [ ] **Step 4: Append the new tables to `store/schema.sql`** (after the existing `runtime_cache` block):

```sql
CREATE TABLE IF NOT EXISTS session (
  session_id             text PRIMARY KEY,
  session_index          bigint NOT NULL,
  deployment_id          text NOT NULL,
  viewer_id              text NOT NULL,
  viewer_version         text NOT NULL,
  agent_id               text NOT NULL,
  instrument_id          text NOT NULL,
  instrument_version     text NOT NULL,
  status                 text NOT NULL,
  token_hash             text NOT NULL,
  initial_locale         text NOT NULL,
  last_active_locale     text NOT NULL,
  started_at             timestamptz NOT NULL DEFAULT now(),
  completed_at           timestamptz,
  submitted_at           timestamptz,
  forwarded_at           timestamptz,
  forward_attempts       int NOT NULL DEFAULT 0,
  forward_failure_reason text,
  device                 jsonb
);
CREATE INDEX IF NOT EXISTS session_token_idx ON session (token_hash);
CREATE INDEX IF NOT EXISTS session_deployment_idx ON session (deployment_id);

CREATE TABLE IF NOT EXISTS outbox (
  id              bigserial PRIMARY KEY,
  session_id      text NOT NULL REFERENCES session (session_id),
  kind            text NOT NULL,
  payload         jsonb NOT NULL,
  payload_sha256  text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  attempts        int NOT NULL DEFAULT 0,
  last_error      text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  forwarded_at    timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_due_idx ON outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS outbox_session_idx ON outbox (session_id);
```

- [ ] **Step 5: Update `tests/conftest.py` truncate** — change the TRUNCATE line to include the new tables:

```python
        c.execute("TRUNCATE deployment, viewer_registry, runtime_cache, session, outbox CASCADE")
```

- [ ] **Step 6: Update `api/app.py`** — add `401` to `_CODE_FOR` and include the two new routers. Replace the `_CODE_FOR` dict and the router-import/include lines:

```python
_CODE_FOR = {400: "bad_request", 401: "unauthorized", 404: "not_found", 410: "gone",
             422: "unprocessable", 502: "upstream_unavailable", 503: "service_unavailable"}
```

In `create_app`, change the import + includes to:

```python
    from . import viewers, deployments, runtime, admin, sessions, submission
    app = FastAPI(title="Questionnaire Viewer Service", version="v1")
    app.include_router(viewers.router, prefix="/v1")
    app.include_router(deployments.router, prefix="/v1")
    app.include_router(runtime.router, prefix="/v1")
    app.include_router(admin.router, prefix="/v1")
    app.include_router(sessions.router, prefix="/v1")
    app.include_router(submission.router, prefix="/v1")
```

- [ ] **Step 7: Create stub routers** — `api/sessions.py` and `api/submission.py`, each:

```python
from fastapi import APIRouter

router = APIRouter()
```

- [ ] **Step 8: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_foundation.py -q`
Expected: PASS (2 passed)

- [ ] **Step 9: Commit**

```bash
git add viewer-service/src/viewer_service/config.py viewer-service/src/viewer_service/store/schema.sql viewer-service/tests/conftest.py viewer-service/src/viewer_service/api/app.py viewer-service/src/viewer_service/api/sessions.py viewer-service/src/viewer_service/api/submission.py viewer-service/tests/test_foundation.py
git commit -m "feat(viewer-service): VS-B foundation — config + session/outbox tables + app wiring

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Session tokens

**Files:**
- Create: `viewer-service/src/viewer_service/tokens.py`
- Test: `viewer-service/tests/test_tokens.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_tokens.py`)

```python
from viewer_service.tokens import mint_token, hash_token


def test_mint_token_is_long_and_unique():
    a, b = mint_token(), mint_token()
    assert a != b
    assert len(a) >= 32


def test_hash_token_is_stable_sha256_hex():
    import hashlib
    t = "abc"
    assert hash_token(t) == hashlib.sha256(b"abc").hexdigest()
    assert len(hash_token(t)) == 64
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_tokens.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.tokens'`

- [ ] **Step 3: Implement `tokens.py`**

```python
import hashlib
import secrets


def mint_token() -> str:
    """A high-entropy, URL-safe opaque session token (returned to the viewer once)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hex of a token. Only the hash is stored in the session row."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_tokens.py -q`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/tokens.py viewer-service/tests/test_tokens.py
git commit -m "feat(viewer-service): session tokens (mint + hash)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Outbox store

**Files:**
- Create: `viewer-service/src/viewer_service/store/outbox.py`
- Test: `viewer-service/tests/test_outbox_store.py`

Store functions are **commit-free** (callers own the transaction — the forwarder claims + updates + commits once so `FOR UPDATE SKIP LOCKED` locks hold across the batch). Tests using the `conn` fixture commit explicitly.

- [ ] **Step 1: Write the failing tests** (`tests/test_outbox_store.py`)

```python
from viewer_service.store import outbox
from viewer_service.store import sessions as session_store


def _mk_session(conn, sid="s1"):
    # outbox.session_id FKs to session; insert a minimal session row first.
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1",
        viewer_id="web", viewer_version="v26.0610", agent_id="agent_1",
        instrument_id="qst_x", instrument_version="v26.0609", status="in_progress",
        token_hash="h", initial_locale="en", last_active_locale="en")
    conn.commit()


def test_enqueue_and_depth(conn):
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    assert isinstance(oid, int)
    assert outbox.depth(conn) == 1


def test_claim_due_returns_pending_rows(conn):
    _mk_session(conn)
    outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    due = outbox.claim_due(conn, 10)
    assert len(due) == 1
    assert due[0]["kind"] == "responses"
    assert due[0]["payload"] == {"a": 1}
    conn.commit()


def test_mark_forwarded_and_counts(conn):
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    outbox.mark_forwarded(conn, oid)
    conn.commit()
    assert outbox.depth(conn) == 0
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 1, "failed": 0}


def test_mark_failed_and_retry(conn):
    from datetime import datetime, timezone, timedelta
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    nxt = datetime(2030, 1, 1, tzinfo=timezone.utc)
    outbox.mark_retry(conn, oid, attempts=1, last_error="boom", next_attempt_at=nxt)
    conn.commit()
    # future next_attempt_at -> not due now
    assert outbox.claim_due(conn, 10) == []
    conn.commit()
    outbox.mark_failed(conn, oid, attempts=8, last_error="dead")
    conn.commit()
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 0, "failed": 1}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_outbox_store.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.store.outbox'` (also `...sessions`; both are created — sessions store in Task 4. For THIS task, also create a minimal `store/sessions.py` with just `insert_session`; Task 4 extends it.)

- [ ] **Step 3: Create a minimal `store/sessions.py`** (Task 4 adds the rest):

```python
import psycopg
from psycopg.types.json import Jsonb

_INSERT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale")


def insert_session(conn: psycopg.Connection, **fields) -> None:
    cols = ", ".join(_INSERT_COLS)
    placeholders = ", ".join(["%s"] * len(_INSERT_COLS))
    conn.execute(f"INSERT INTO session ({cols}) VALUES ({placeholders})",
                 tuple(fields[c] for c in _INSERT_COLS))
```

- [ ] **Step 4: Implement `store/outbox.py`**

```python
import psycopg
from datetime import datetime
from psycopg.types.json import Jsonb


def enqueue(conn: psycopg.Connection, session_id: str, kind: str, payload: dict,
            payload_sha256: str) -> int:
    row = conn.execute(
        "INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
        "VALUES (%s,%s,%s,%s) RETURNING id",
        (session_id, kind, Jsonb(payload), payload_sha256)).fetchone()
    return row[0]


def depth(conn: psycopg.Connection) -> int:
    return conn.execute("SELECT count(*) FROM outbox WHERE status='pending'").fetchone()[0]


def claim_due(conn: psycopg.Connection, limit: int) -> list[dict]:
    rows = conn.execute(
        "SELECT id, session_id, kind, payload, payload_sha256, attempts FROM outbox "
        "WHERE status='pending' AND next_attempt_at<=now() ORDER BY id LIMIT %s "
        "FOR UPDATE SKIP LOCKED", (limit,)).fetchall()
    cols = ["id", "session_id", "kind", "payload", "payload_sha256", "attempts"]
    return [dict(zip(cols, r)) for r in rows]


def mark_forwarded(conn: psycopg.Connection, outbox_id: int) -> None:
    conn.execute("UPDATE outbox SET status='forwarded', forwarded_at=now() WHERE id=%s", (outbox_id,))


def mark_retry(conn: psycopg.Connection, outbox_id: int, attempts: int, last_error: str,
               next_attempt_at: datetime) -> None:
    conn.execute("UPDATE outbox SET attempts=%s, last_error=%s, next_attempt_at=%s WHERE id=%s",
                 (attempts, last_error, next_attempt_at, outbox_id))


def mark_failed(conn: psycopg.Connection, outbox_id: int, attempts: int, last_error: str) -> None:
    conn.execute("UPDATE outbox SET status='failed', attempts=%s, last_error=%s WHERE id=%s",
                 (attempts, last_error, outbox_id))


def counts_for_session(conn: psycopg.Connection, session_id: str) -> dict:
    rows = conn.execute("SELECT status, count(*) FROM outbox WHERE session_id=%s GROUP BY status",
                        (session_id,)).fetchall()
    out = {"pending": 0, "forwarded": 0, "failed": 0}
    for status, n in rows:
        out[status] = n
    return out
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_outbox_store.py -q`
Expected: PASS (4 passed)

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/store/outbox.py viewer-service/src/viewer_service/store/sessions.py viewer-service/tests/test_outbox_store.py
git commit -m "feat(viewer-service): outbox store (enqueue, claim SKIP LOCKED, counts)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Session store

**Files:**
- Modify: `viewer-service/src/viewer_service/store/sessions.py` (add the rest)
- Test: `viewer-service/tests/test_session_store.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_session_store.py`)

```python
from viewer_service.store import sessions as store


def _insert(conn, sid="s1", status="in_progress", token_hash="h1"):
    store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1",
        viewer_id="web", viewer_version="v26.0610", agent_id="agent_1",
        instrument_id="qst_x", instrument_version="v26.0609", status=status,
        token_hash=token_hash, initial_locale="en", last_active_locale="en")
    conn.commit()


def test_get_session(conn):
    _insert(conn)
    s = store.get_session(conn, "s1")
    assert s["status"] == "in_progress"
    assert s["viewer_id"] == "web"
    assert s["last_active_locale"] == "en"


def test_get_session_for_auth(conn):
    _insert(conn, token_hash="abc")
    assert store.get_session_for_auth(conn, "s1", "abc")["session_id"] == "s1"
    assert store.get_session_for_auth(conn, "s1", "wrong") is None
    assert store.get_session_for_auth(conn, "nope", "abc") is None


def test_set_submitted(conn):
    _insert(conn)
    store.set_submitted(conn, "s1")
    conn.commit()
    s = store.get_session(conn, "s1")
    assert s["status"] == "submitted"
    assert s["submitted_at"] is not None


def test_set_locale(conn):
    _insert(conn)
    store.set_locale(conn, "s1", "pt")
    conn.commit()
    assert store.get_session(conn, "s1")["last_active_locale"] == "pt"


def test_set_forwarded(conn):
    _insert(conn, status="submitted")
    store.set_forwarded(conn, "s1")
    conn.commit()
    s = store.get_session(conn, "s1")
    assert s["status"] == "forwarded"
    assert s["forwarded_at"] is not None


def test_set_failure_reason(conn):
    _insert(conn, status="submitted")
    store.set_failure_reason(conn, "s1", "1 failed")
    conn.commit()
    assert store.get_session(conn, "s1")["forward_failure_reason"] == "1 failed"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_store.py -q`
Expected: FAIL — `AttributeError: module 'viewer_service.store.sessions' has no attribute 'get_session'`

- [ ] **Step 3: Extend `store/sessions.py`** — append below the existing `insert_session`:

```python
_SELECT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale", "started_at", "completed_at",
                "submitted_at", "forwarded_at", "forward_attempts", "forward_failure_reason")


def _row_to_dict(row) -> dict:
    return dict(zip(_SELECT_COLS, row))


def get_session(conn: psycopg.Connection, session_id: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE session_id=%s", (session_id,)).fetchone()
    return _row_to_dict(row) if row else None


def get_session_for_auth(conn: psycopg.Connection, session_id: str, token_hash: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE session_id=%s AND token_hash=%s",
        (session_id, token_hash)).fetchone()
    return _row_to_dict(row) if row else None


def set_submitted(conn: psycopg.Connection, session_id: str) -> None:
    conn.execute("UPDATE session SET status='submitted', completed_at=now(), submitted_at=now() "
                 "WHERE session_id=%s", (session_id,))


def set_locale(conn: psycopg.Connection, session_id: str, locale: str) -> None:
    conn.execute("UPDATE session SET last_active_locale=%s WHERE session_id=%s", (locale, session_id))


def set_forwarded(conn: psycopg.Connection, session_id: str) -> None:
    conn.execute("UPDATE session SET status='forwarded', forwarded_at=now() WHERE session_id=%s",
                 (session_id,))


def set_failure_reason(conn: psycopg.Connection, session_id: str, reason: str) -> None:
    conn.execute("UPDATE session SET forward_failure_reason=%s WHERE session_id=%s",
                 (reason, session_id))
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_session_store.py -q`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/store/sessions.py viewer-service/tests/test_session_store.py
git commit -m "feat(viewer-service): session store (get/auth/state transitions)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Behaverse sink

**Files:**
- Create: `viewer-service/src/viewer_service/sinks.py`
- Test: `viewer-service/tests/test_sinks.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_sinks.py`)

```python
import httpx
import pytest
from viewer_service.sinks import HTTPBehaverseSink, SinkError


def _sink(handler, token="tok"):
    return HTTPBehaverseSink("http://bh", token, client=httpx.Client(transport=httpx.MockTransport(handler)))


def test_send_posts_with_headers_and_path():
    seen = {}

    def handler(request):
        seen["path"] = request.url.path
        seen["auth"] = request.headers.get("authorization")
        seen["sha"] = request.headers.get("x-payload-sha256")
        return httpx.Response(200, json={"ok": True})

    _sink(handler).send("responses", {"session_id": "s1", "responses": []})
    assert seen["path"] == "/responses"
    assert seen["auth"] == "Bearer tok"
    assert len(seen["sha"]) == 64


def test_non_2xx_raises_sink_error():
    def handler(request):
        return httpx.Response(500, text="boom")
    with pytest.raises(SinkError):
        _sink(handler).send("events", {"a": 1})


def test_transport_error_raises_sink_error():
    def handler(request):
        raise httpx.ConnectError("down")
    with pytest.raises(SinkError):
        _sink(handler).send("responses", {"a": 1})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_sinks.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.sinks'`

- [ ] **Step 3: Implement `sinks.py`**

```python
import httpx
from denormaliser import canonical_hash


class SinkError(Exception):
    """A forwarding attempt failed (non-2xx or transport error)."""


class HTTPBehaverseSink:
    """Forwards a payload to Behaverse via HTTPS POST {base_url}/{kind} with a bearer
    token and a per-submission SHA-256 header (OD-13 tamper detection)."""

    def __init__(self, base_url: str, bearer_token: str, *, client: httpx.Client | None = None):
        self.base_url = base_url.rstrip("/")
        self.bearer = bearer_token
        self.client = client or httpx.Client(timeout=10.0)

    def send(self, kind: str, payload: dict) -> None:
        headers = {"Authorization": f"Bearer {self.bearer}",
                   "X-Payload-SHA256": canonical_hash(payload)}
        try:
            resp = self.client.post(f"{self.base_url}/{kind}", json=payload, headers=headers)
        except httpx.HTTPError as e:
            raise SinkError(f"transport error: {e}")
        if resp.status_code >= 300:
            raise SinkError(f"behaverse returned {resp.status_code}")
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_sinks.py -q`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/sinks.py viewer-service/tests/test_sinks.py
git commit -m "feat(viewer-service): Sink interface + HTTPBehaverseSink

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Forwarding (process_outbox_batch)

**Files:**
- Create: `viewer-service/src/viewer_service/forwarding.py`
- Test: `viewer-service/tests/test_forwarding.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_forwarding.py`)

```python
from datetime import datetime, timezone
from denormaliser import canonical_hash
from viewer_service.forwarding import backoff_seconds, process_outbox_batch
from viewer_service.sinks import SinkError
from viewer_service.store import outbox
from viewer_service.store import sessions as session_store

NOW = datetime(2026, 6, 10, 12, 0, 0, tzinfo=timezone.utc)


class FakeSink:
    def __init__(self, fail_times=0):
        self.fail_times = fail_times
        self.calls = 0

    def send(self, kind, payload):
        self.calls += 1
        if self.calls <= self.fail_times:
            raise SinkError("temporary")


def _session(conn, sid="s1", status="submitted"):
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1", viewer_id="web",
        viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
        instrument_version="v26.0609", status=status, token_hash="h",
        initial_locale="en", last_active_locale="en")
    conn.commit()


def _enqueue(conn, sid="s1", payload=None):
    payload = payload or {"x": 1}
    oid = outbox.enqueue(conn, sid, "responses", payload, canonical_hash(payload))
    conn.commit()
    return oid


def test_backoff_caps_at_3600():
    assert backoff_seconds(1) == 2
    assert backoff_seconds(2) == 4
    assert backoff_seconds(20) == 3600


def test_successful_forward_marks_forwarded_and_session(conn):
    _session(conn)
    _enqueue(conn)
    summary = process_outbox_batch(conn, FakeSink(), batch_size=10, max_attempts=8, now=NOW)
    assert summary["forwarded"] == 1
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 1, "failed": 0}
    assert session_store.get_session(conn, "s1")["status"] == "forwarded"


def test_failure_retries_with_backoff(conn):
    _session(conn)
    oid = _enqueue(conn)
    summary = process_outbox_batch(conn, FakeSink(fail_times=1), batch_size=10, max_attempts=8, now=NOW)
    assert summary["retried"] == 1
    row = conn.execute("SELECT attempts, next_attempt_at FROM outbox WHERE id=%s", (oid,)).fetchone()
    assert row[0] == 1
    assert row[1] == NOW.replace(second=2)  # NOW + 2s backoff
    # session NOT forwarded (still has a pending row)
    assert session_store.get_session(conn, "s1")["status"] == "submitted"


def test_max_attempts_marks_failed(conn):
    _session(conn)
    oid = _enqueue(conn)
    # already at attempts=7; one more failure -> attempts=8 == max -> failed
    conn.execute("UPDATE outbox SET attempts=7 WHERE id=%s", (oid,))
    conn.commit()
    summary = process_outbox_batch(conn, FakeSink(fail_times=1), batch_size=10, max_attempts=8, now=NOW)
    assert summary["failed"] == 1
    assert outbox.counts_for_session(conn, "s1")["failed"] == 1
    s = session_store.get_session(conn, "s1")
    assert s["status"] == "submitted"
    assert "fail" in (s["forward_failure_reason"] or "").lower()


def test_tamper_detection_fails_row(conn):
    _session(conn)
    # enqueue with a WRONG sha256
    outbox.enqueue(conn, "s1", "responses", {"x": 1}, "0" * 64)
    conn.commit()
    summary = process_outbox_batch(conn, FakeSink(), batch_size=10, max_attempts=8, now=NOW)
    assert summary["failed"] == 1
    assert outbox.counts_for_session(conn, "s1")["failed"] == 1
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_forwarding.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.forwarding'`

- [ ] **Step 3: Implement `forwarding.py`**

```python
from datetime import datetime, timedelta, timezone

from denormaliser import canonical_hash

from .sinks import SinkError
from .store import outbox as outbox_store
from .store import sessions as session_store


def backoff_seconds(attempts: int) -> int:
    """Exponential back-off capped at 1 hour."""
    return min(2 ** attempts, 3600)


def process_outbox_batch(conn, sink, *, batch_size: int = 50, max_attempts: int = 8,
                         now: datetime | None = None) -> dict:
    """Claim due outbox rows (FOR UPDATE SKIP LOCKED), forward each via the sink, and
    apply back-off / max-attempts. Sessions that are 'submitted' with no remaining
    pending/failed rows transition to 'forwarded'. Commits once at the end."""
    now = now or datetime.now(timezone.utc)
    due = outbox_store.claim_due(conn, batch_size)
    summary = {"forwarded": 0, "failed": 0, "retried": 0}
    affected: set[str] = set()

    for row in due:
        affected.add(row["session_id"])
        if canonical_hash(row["payload"]) != row["payload_sha256"]:
            outbox_store.mark_failed(conn, row["id"], row["attempts"] + 1, "payload sha256 mismatch")
            summary["failed"] += 1
            continue
        try:
            sink.send(row["kind"], row["payload"])
        except SinkError as e:
            attempts = row["attempts"] + 1
            if attempts >= max_attempts:
                outbox_store.mark_failed(conn, row["id"], attempts, str(e))
                summary["failed"] += 1
            else:
                outbox_store.mark_retry(conn, row["id"], attempts, str(e),
                                        now + timedelta(seconds=backoff_seconds(attempts)))
                summary["retried"] += 1
            continue
        outbox_store.mark_forwarded(conn, row["id"])
        summary["forwarded"] += 1

    for sid in affected:
        counts = outbox_store.counts_for_session(conn, sid)
        sess = session_store.get_session(conn, sid)
        if sess is None:
            continue
        if sess["status"] == "submitted" and counts["pending"] == 0 and counts["failed"] == 0:
            session_store.set_forwarded(conn, sid)
        elif counts["failed"] > 0:
            session_store.set_failure_reason(conn, sid, f"{counts['failed']} submission(s) failed forwarding")

    conn.commit()
    return summary
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_forwarding.py -q`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/forwarding.py viewer-service/tests/test_forwarding.py
git commit -m "feat(viewer-service): outbox forwarder (backoff, max-attempts, session aggregate)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Sessions orchestration + API + token auth

**Files:**
- Create: `viewer-service/src/viewer_service/sessions.py`
- Modify: `viewer-service/src/viewer_service/models.py`, `viewer-service/src/viewer_service/api/deps.py`, `viewer-service/src/viewer_service/api/sessions.py` (replace stub)
- Test: `viewer-service/tests/test_sessions_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_sessions_api.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod

MANIFEST = {
    "viewer_id": "web", "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "logic_actions": ["skip", "visibility", "piping", "branch"],
    "scorer_impl_kinds": ["wasm", "http"],
}
BUNDLE = {
    "definition": {
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini", "description": "d", "language": "en"},
        "pages": [{"id": "p1", "elements": [
            {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}}, "option": {"ref": "opt_1@v26.0609"}}]}],
    },
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"},
                                                     "pt": {"status": "validated", "text": "Q-pt?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}, {"index": 2, "text": "b"}]},
                        "pt": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "x"}, {"index": 2, "text": "y"}]}}},
    },
}


@pytest.fixture
def setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    return client, dep["deployment_id"]


def _new_session(client, dep_id, locale=None):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610", "locale": locale})


def test_new_session_returns_token_and_runtime(setup):
    client, dep_id = setup
    r = _new_session(client, dep_id, "en")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["session_id"]
    assert body["session_token"]
    assert body["runtime"]["provenance"]["source_questionnaire_id"] == "qst_mini"


def test_resume_requires_token(setup):
    client, dep_id = setup
    sid = _new_session(client, dep_id, "en").json()["session_id"]
    # no token -> 401
    assert client.get(f"/v1/sessions/{sid}").status_code == 401
    # bad token -> 401
    assert client.get(f"/v1/sessions/{sid}", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_resume_returns_status_and_runtime(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    g = client.get(f"/v1/sessions/{s['session_id']}", headers=h)
    assert g.status_code == 200
    assert g.json()["status"] == "in_progress"
    assert g.json()["last_active_locale"] == "en"
    rt = client.get(f"/v1/sessions/{s['session_id']}/runtime", headers=h)
    assert rt.status_code == 200
    assert rt.json()["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "en": {"status": "validated", "text": "Q?"}}


def test_locale_switch_remints_and_persists(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    r = client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "pt"}, headers=h)
    assert r.status_code == 200
    assert r.json()["runtime"]["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "pt": {"status": "validated", "text": "Q-pt?"}}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).json()["last_active_locale"] == "pt"


def test_locale_switch_rejects_unavailable_locale(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    r = client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "fr"}, headers=h)
    assert r.status_code == 422
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_sessions_api.py -q`
Expected: FAIL (stub router → 404/405; or ImportError on `viewer_service.sessions`)

- [ ] **Step 3: Add request models to `models.py`** (append):

```python
class SessionNew(BaseModel):
    deployment_id: str
    viewer_id: str
    viewer_version: str
    locale: str | None = None


class LocaleSwitch(BaseModel):
    locale: str
```

- [ ] **Step 4: Implement `sessions.py`**

```python
import uuid

from .runtime import mint_runtime
from . import tokens
from .store import sessions as session_store
from .store import deployments as dep_store
from .store import viewers as viewer_store


def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None) -> dict:
    """Mint the runtime (VS-A), allocate a session + opaque token, persist the session."""
    runtime = mint_runtime(conn, deployment, viewer, requested_locale)
    locale = runtime["locale"]
    session_id = str(uuid.uuid4())
    token = tokens.mint_token()
    agent_id = "agent_" + uuid.uuid4().hex[:8]
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    session_store.insert_session(
        conn, session_id=session_id, session_index=1, deployment_id=deployment["deployment_id"],
        viewer_id=viewer_id, viewer_version=viewer_version, agent_id=agent_id,
        instrument_id=qst_id, instrument_version=qst_version, status="in_progress",
        token_hash=tokens.hash_token(token), initial_locale=locale, last_active_locale=locale)
    conn.commit()
    return {"session_id": session_id, "session_token": token, "runtime": runtime}


def session_runtime(conn, session: dict) -> dict:
    """Re-mint (cache hit) the runtime for a session in its last_active_locale."""
    deployment = dep_store.get_deployment(conn, session["deployment_id"])
    viewer = viewer_store.get_viewer(conn, session["viewer_id"], session["viewer_version"])
    return mint_runtime(conn, deployment, viewer, session["last_active_locale"])


class LocaleNotAvailable(Exception):
    pass


def switch_locale(conn, session: dict, locale: str) -> dict:
    """Update last_active_locale and re-mint the runtime in the new locale."""
    deployment = dep_store.get_deployment(conn, session["deployment_id"])
    if locale not in deployment["available_locales"]:
        raise LocaleNotAvailable(locale)
    session_store.set_locale(conn, session["session_id"], locale)
    conn.commit()
    viewer = viewer_store.get_viewer(conn, session["viewer_id"], session["viewer_version"])
    return mint_runtime(conn, deployment, viewer, locale)
```

- [ ] **Step 5: Add `require_session` to `api/deps.py`** (append; keep existing `get_conn`):

```python
from fastapi import Depends, Header, HTTPException
from .. import tokens
from ..store import sessions as session_store


def require_session(session_id: str, authorization: str | None = Header(default=None),
                    conn=Depends(get_conn)) -> dict:
    """Validate the Bearer session token against the session's stored hash. FastAPI caches
    get_conn within a request, so this shares the route's connection."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    sess = session_store.get_session_for_auth(conn, session_id, tokens.hash_token(token))
    if sess is None:
        raise HTTPException(status_code=401, detail="invalid session token")
    return sess
```

- [ ] **Step 6: Implement `api/sessions.py`** (replace stub)

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import PreflightError
from .deps import get_conn, require_session
from ..models import SessionNew, LocaleSwitch
from ..library_client import LibraryError
from ..store import deployments as dep_store
from ..store import viewers as viewer_store
from ..store import outbox as outbox_store
from .. import sessions as sessions_svc

router = APIRouter()


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
    except PreflightError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "preflight_failed", "message": "runtime pre-flight failed",
            "detail": [{"kind": p.kind, "where": p.where, "detail": p.detail} for p in e.problems]}})
    except LibraryError as e:
        raise HTTPException(status_code=e.status, detail=e.message)


@router.get("/sessions/{session_id}")
def get(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    return {"status": session["status"], "last_active_locale": session["last_active_locale"],
            "outbox": outbox_store.counts_for_session(conn, session_id)}


@router.get("/sessions/{session_id}/runtime")
def runtime(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    return sessions_svc.session_runtime(conn, session)


@router.post("/sessions/{session_id}/locale")
def locale(session_id: str, body: LocaleSwitch, session=Depends(require_session), conn=Depends(get_conn)):
    try:
        return {"runtime": sessions_svc.switch_locale(conn, session, body.locale)}
    except sessions_svc.LocaleNotAvailable:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid", "message": f"locale '{body.locale}' not in deployment.available_locales"}})
```

- [ ] **Step 7: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_sessions_api.py -q`
Expected: PASS (5 passed)

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/sessions.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/api/deps.py viewer-service/src/viewer_service/api/sessions.py viewer-service/tests/test_sessions_api.py
git commit -m "feat(viewer-service): session mint + resume + locale switch + token auth

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Submission API

**Files:**
- Create: `viewer-service/src/viewer_service/submission.py`
- Modify: `viewer-service/src/viewer_service/validation.py` (add Schema 5 / 4a validators), `viewer-service/src/viewer_service/api/submission.py` (replace stub)
- Test: `viewer-service/tests/test_submission_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_submission_api.py`) — reuses the Task-7 `setup` fixture pattern (inline here):

```python
import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE  # top-level import (pytest prepend mode; no tests/__init__.py)


@pytest.fixture
def session(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return client, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


# A minimal valid Schema 5 ResponseSet: one Response with EXACTLY the 12 required fields
# (Response has additionalProperties:false, so include only defined keys).
def _response_set(sid):
    return {"session_id": sid, "responses": [{
        "response_id": 1, "agent_id": "a1", "session_index": 1, "instrument_id": "qst_mini",
        "multitask_type": "", "block_index": 1, "block_type": "instruction",
        "transformation_name": "identity", "trial_index": "0",
        "trial_start_datetime": "2026-06-10T12:00:00Z", "stimulus_id": "it_1",
        "stimulus_type": "instruction"}]}   # valid Schema 5 enum value


def test_submit_responses_enqueues(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 202, r.text
    assert "enqueued" in r.json()
    counts = client.get(f"/v1/sessions/{sid}", headers=h).json()["outbox"]
    assert counts["pending"] == 1


def test_submit_invalid_responses_422(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/responses", json={"not": "valid"}, headers=h)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_submission"


def test_submit_requires_token(session):
    client, sid, h = session
    assert client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid)).status_code == 401


def test_complete_marks_submitted(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/complete", headers=h)
    assert r.status_code == 200
    assert client.get(f"/v1/sessions/{sid}", headers=h).json()["status"] == "submitted"


def test_hard_cap_returns_503(session, monkeypatch):
    client, sid, h = session
    from viewer_service import submission as sub_mod
    monkeypatch.setattr(sub_mod, "_depth", lambda conn: 10**9)  # force over hard cap
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "service_unavailable"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_submission_api.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.submission'`

- [ ] **Step 3: Add validators to `validation.py`** (append):

```python
def validate_response(payload: dict, schemas_dir: Path) -> None:
    """Validate a submission body against Schema 5 (response). Raises ValidationError."""
    sd = str(schemas_dir)
    Draft202012Validator(_schema(sd, "response"), registry=_registry(sd)).validate(payload)


def validate_events(payload: dict, schemas_dir: Path) -> None:
    """Validate a submission body against Schema 4a (events). Raises ValidationError."""
    sd = str(schemas_dir)
    Draft202012Validator(_schema(sd, "events"), registry=_registry(sd)).validate(payload)
```

- [ ] **Step 4: Implement `submission.py`**

```python
from denormaliser import canonical_hash

from .config import get_settings
from .validation import validate_response, validate_events
from .store import outbox as outbox_store


class OutboxFull(Exception):
    pass


def _depth(conn) -> int:
    return outbox_store.depth(conn)


def submit(conn, session_id: str, kind: str, payload: dict, schemas_dir) -> int:
    """Validate the payload (Schema 5 / 4a), bounds-check the outbox, enqueue. Returns the
    outbox id. Raises jsonschema.ValidationError (bad body) or OutboxFull (hard cap)."""
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    if kind == "responses":
        validate_response(payload, schemas_dir)
    else:
        validate_events(payload, schemas_dir)
    oid = outbox_store.enqueue(conn, session_id, kind, payload, canonical_hash(payload))
    conn.commit()
    return oid
```

- [ ] **Step 5: Implement `api/submission.py`** (replace stub)

```python
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from jsonschema.exceptions import ValidationError
from .deps import get_conn, require_session
from ..config import get_settings
from ..store import sessions as session_store
from .. import submission as submission_svc

router = APIRouter()


def _enqueue(session_id: str, kind: str, payload: dict, conn):
    try:
        oid = submission_svc.submit(conn, session_id, kind, payload, get_settings().schemas_dir)
    except submission_svc.OutboxFull:
        return JSONResponse(status_code=503, content={"error": {
            "code": "service_unavailable", "message": "submission queue is full; try again later"}})
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid_submission", "message": e.message}})
    return JSONResponse(status_code=202, content={"enqueued": oid})


@router.post("/sessions/{session_id}/responses")
def responses(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "responses", payload, conn)


@router.post("/sessions/{session_id}/events")
def events(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "events", payload, conn)


@router.post("/sessions/{session_id}/complete")
def complete(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    session_store.set_submitted(conn, session_id)
    conn.commit()
    return {"status": "submitted"}
```

- [ ] **Step 6: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_submission_api.py -q`
Expected: PASS (5 passed)

- [ ] **Step 7: Run the whole viewer-service suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q`
Expected: PASS (VS-A 26 + VS-B additions). Report the total.

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/submission.py viewer-service/src/viewer_service/validation.py viewer-service/src/viewer_service/api/submission.py viewer-service/tests/test_submission_api.py
git commit -m "feat(viewer-service): submission API (responses/events/complete + outbox bounds)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: forward-worker CLI

**Files:**
- Modify: `viewer-service/src/viewer_service/cli.py`
- Test: `viewer-service/tests/test_cli_worker.py`

- [ ] **Step 1: Write the failing test** (`tests/test_cli_worker.py`)

```python
import viewer_service.cli as cli


def test_forward_worker_once_runs_a_batch(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    calls = {"n": 0}

    def fake_process(conn, sink, **kw):
        calls["n"] += 1
        return {"forwarded": 0, "failed": 0, "retried": 0}

    monkeypatch.setattr(cli, "process_outbox_batch", fake_process)
    rc = cli.main(["forward-worker", "--once"])
    assert rc == 0
    assert calls["n"] == 1


def test_unknown_command_returns_2():
    assert cli.main(["bogus"]) == 2
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_cli_worker.py -q`
Expected: FAIL — `AttributeError: module 'viewer_service.cli' has no attribute 'process_outbox_batch'`

- [ ] **Step 3: Rewrite `cli.py`**

```python
import sys
import time

import psycopg

from .config import get_settings
from .store.migrate import apply_schema
from .forwarding import process_outbox_batch
from .sinks import HTTPBehaverseSink


def _build_sink():
    s = get_settings()
    return HTTPBehaverseSink(s.behaverse_base_url, s.behaverse_bearer_token)


def _forward_once() -> dict:
    s = get_settings()
    sink = _build_sink()
    with psycopg.connect(s.database_url) as conn:
        return process_outbox_batch(conn, sink, batch_size=s.forward_batch_size,
                                    max_attempts=s.forward_max_attempts)


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print("usage: viewer-service {migrate | forward-worker [--once|--loop --interval N]}")
        return 2
    cmd = argv[0]
    if cmd == "migrate":
        with psycopg.connect(get_settings().database_url) as conn:
            apply_schema(conn)
            conn.commit()
        print("schema applied")
        return 0
    if cmd == "forward-worker":
        if "--once" in argv or "--loop" not in argv:
            summary = _forward_once()
            print(summary)
            return 0
        interval = 5
        if "--interval" in argv:
            interval = int(argv[argv.index("--interval") + 1])
        while True:                                  # daemon loop
            print(_forward_once())
            time.sleep(interval)
    print("usage: viewer-service {migrate | forward-worker [--once|--loop --interval N]}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_cli_worker.py -q`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/cli.py viewer-service/tests/test_cli_worker.py
git commit -m "feat(viewer-service): forward-worker CLI (--once / --loop)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: README + FOLLOWUPS + final gate

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`

- [ ] **Step 1: Update `README.md`** — add the VS-B endpoints + the worker to the existing README. Insert these rows into the endpoint table (after the runtime row) and add a worker section:

```markdown
| `POST /v1/sessions/new` | Mint a session for a deployment → `{session_id, session_token, runtime}`. |
| `GET /v1/sessions/{id}` | (Bearer session token) status + last_active_locale + outbox counts (resume read). |
| `GET /v1/sessions/{id}/runtime` | (token) Schema 3 runtime in the session's last_active_locale. |
| `POST /v1/sessions/{id}/locale` | (token) switch locale → re-minted runtime. |
| `POST /v1/sessions/{id}/responses` · `/events` | (token) submit Schema 5 / Schema 4a → enqueued to the outbox (202). |
| `POST /v1/sessions/{id}/complete` | (token) mark the session submitted. |
```

Add below the dev section:

````markdown
## Forwarding worker (OD-13)

Submissions are buffered in a durable Postgres `outbox` and shipped to Behaverse by a
separate worker:

```bash
export BEHAVERSE_BASE_URL=https://behaverse.example/ingest
export BEHAVERSE_BEARER_TOKEN=...
viewer-service forward-worker --once          # one batch (cron / scheduled invoke)
viewer-service forward-worker --loop --interval 5   # daemon
```

A session reaches `forwarded` once it is `submitted` and all its outbox rows are forwarded.
````

- [ ] **Step 2: Append to `FOLLOWUPS.md`**

```markdown

## VS-B follow-ups

- **`validated` state + Behaverse reconciliation.** VS-B stops at `forwarded` (sink 2xx).
  `validated` needs Behaverse validation feedback (callback or reconciliation poll) — VS-C/later.
- **`abandoned` on timeout.** No session-timeout sweeper yet; in_progress sessions live forever.
- **Outbox retention.** Forwarded/failed rows are kept indefinitely (available for VS-C export).
  Add a pruning policy (e.g. drop forwarded rows older than N days) before production.
- **Soft-threshold alerting.** The hard cap (503) is enforced; the soft threshold is config but
  only logged — the alert banner / dashboard surface is VS-C.
- **Forwarder concurrency.** A single `forward-worker` is assumed; `FOR UPDATE SKIP LOCKED` makes
  multiple workers safe, but that hasn't been load-tested.
- **mTLS / E2E encryption.** Deferred per OD-13 (TLS + SHA-256 + bearer ship now).
```

- [ ] **Step 3: Run the full verification gate** (each suite separately — `library/` and `viewer-service/` collide in one pytest run):

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q
.venv/bin/pytest questionnaire-runtime-denormaliser/ -q
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest tools/tests/ -q
```
Expected: viewer-service all green; `library/` 126; denormaliser 56; tools 309. Report counts.

- [ ] **Step 4: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "docs(viewer-service): VS-B README + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** session + outbox tables (T1) ✓ · tokens (T2) ✓ · outbox store incl. SKIP-LOCKED claim (T3) ✓ · session store + state transitions (T4) ✓ · HTTPBehaverseSink + SHA-256/bearer headers (T5) ✓ · forwarder backoff/max-attempts/tamper/session-aggregate (T6) ✓ · session mint + token + core resume + locale switch (T7) ✓ · response/event submission + Schema 5/4a validation + hard-cap 503 + complete (T8) ✓ · forward-worker CLI (T9) ✓ · README/FOLLOWUPS/gate (T10) ✓.
- **Type consistency:** `insert_session(conn, **fields)` keyword set identical in T3/T4/T6/T7; `outbox.enqueue(conn, session_id, kind, payload, payload_sha256) -> int` and `claim_due`/`mark_*`/`counts_for_session` consistent T3/T6/T8; `process_outbox_batch(conn, sink, *, batch_size, max_attempts, now=None)` consistent T6/T9; `mint_runtime(conn, deployment, viewer, requested_locale)` reused from VS-A (T7); `require_session(...) -> session dict` consistent T7/T8; `submit(conn, session_id, kind, payload, schemas_dir)` consistent T8; sink `.send(kind, payload)` consistent T5/T6/T9.
- **No placeholders:** every step has real code + commands + expected output.
- **Note:** T8's hard-cap test monkeypatches `submission._depth`; the production path calls `outbox_store.depth` through that indirection — keep `_depth` as the single depth call site.
```
