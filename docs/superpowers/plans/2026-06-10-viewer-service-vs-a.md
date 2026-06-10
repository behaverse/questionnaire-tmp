# Viewer Service VS-A (Runtime Generation Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build VS-A — a FastAPI + Postgres service that mints cached Schema 3 runtimes by calling the `denormaliser`, reading questionnaire + entity bodies from the Library over HTTP via a new additive resolution-bundle endpoint.

**Architecture:** A new `viewer-service/` package (mirroring `library/`): three Postgres tables (`deployment`, `viewer_registry`, `runtime_cache`); a `LibraryClient` (httpx); a mint-runtime orchestration that resolves locale → builds the OD-18f 5-tuple cache key → returns the cached Schema 3 or denormalises on miss. The Library gains one additive endpoint returning `{definition, entities}`.

**Tech Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3) · httpx · jsonschema + referencing · the `denormaliser` package · pytest + testcontainers.

**Spec:** [docs/superpowers/specs/2026-06-10-viewer-service-vs-a-design.md](../specs/2026-06-10-viewer-service-vs-a-design.md)

---

## File structure

```
library/src/library/api/resolve.py        # (modify) + build_resolution_bundle
library/src/library/api/questionnaires.py # (modify) + resolution-bundle route
library/tests/integration/test_api_bundle.py   # (new) bundle endpoint tests

viewer-service/
├── pyproject.toml
├── README.md
├── FOLLOWUPS.md
├── src/viewer_service/
│   ├── __init__.py
│   ├── config.py
│   ├── models.py
│   ├── validation.py            # Schema 7 manifest validation
│   ├── library_client.py        # httpx bundle fetch
│   ├── locale.py                # VS-A locale resolution
│   ├── runtime.py               # mint-runtime orchestration
│   ├── store/
│   │   ├── __init__.py
│   │   ├── schema.sql
│   │   ├── migrate.py
│   │   ├── viewers.py
│   │   ├── deployments.py
│   │   └── runtime_cache.py
│   └── api/
│       ├── __init__.py
│       ├── deps.py              # get_conn
│       ├── app.py               # create_app factory
│       ├── viewers.py
│       ├── deployments.py
│       ├── runtime.py
│       └── admin.py
└── tests/
    ├── conftest.py
    ├── test_validation.py
    ├── test_locale.py
    ├── test_runtime_cache.py
    ├── test_library_client.py
    ├── test_viewers_api.py
    ├── test_deployments_api.py
    └── test_runtime_api.py
```

**Environment:** repo root `/home/pedro/Repos/Cursor/questionnaire_apps`; branch `phase2-viewer-service-vs-a` (already checked out). Use venv binaries by ABSOLUTE PATH: `/home/pedro/Repos/Cursor/questionnaire_apps/.venv/bin/pytest` and `.../.venv/bin/pip`. Integration tests use testcontainers and need `DOCKER_CONFIG=/tmp/lib_docker` (same quirk as `library/`). The `denormaliser` package is already installed editable in the venv.

---

### Task 1: Library resolution-bundle endpoint

**Files:**
- Modify: `library/src/library/api/resolve.py` (add `build_resolution_bundle`)
- Modify: `library/src/library/api/questionnaires.py` (add route)
- Test: `library/tests/integration/test_api_bundle.py`

- [ ] **Step 1: Write the failing tests** (`library/tests/integration/test_api_bundle.py`)

```python
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from psycopg.types.json import Jsonb
from library.api.app import create_app
from library.api.resolve import build_resolution_bundle
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
S = get_settings()


@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(S.schemas_dir),
                    schemas_dir=S.schemas_dir, release="v26.0601")
        c.commit()
    return TestClient(create_app())


def test_bundle_keeps_definition_refs_and_collects_entities(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/resolution-bundle")
    assert r.status_code == 200
    body = r.json()
    # definition keeps refs intact
    prompt = body["definition"]["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt == {"ref": "pr_aiss_q_2@v26.0601"}
    # the referenced prompt body is collected, keyed by id@version
    assert "pr_aiss_q_2@v26.0601" in body["entities"]
    assert body["entities"]["pr_aiss_q_2@v26.0601"]["content"]["en"]["text"].startswith("When the water is very cold")


def test_bundle_unknown_is_404(client):
    r = client.get("/v1/questionnaires/qst_nope/versions/v26.0601/resolution-bundle")
    assert r.status_code == 404


def test_bundle_withdrawn_is_410(client, pg_url):
    from datetime import datetime, timezone
    from library.store.entities import withdraw_entity
    with psycopg.connect(pg_url) as c:
        withdraw_entity(c, "qst_min", "v26.0601", datetime(2026, 6, 7, tzinfo=timezone.utc))
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/resolution-bundle")
    assert r.status_code == 410


def test_build_bundle_collects_scorer_bodies(conn):
    # A questionnaire whose scores[].scorer points at a Scorer entity (scorer refs are
    # bare strings, not {ref} objects, so the {ref} walk alone would miss them).
    conn.execute(
        "INSERT INTO entity (id, version, entity_type, content_json) VALUES (%s,%s,%s,%s)",
        ("scr_demo", "v26.0609", "scorer",
         Jsonb({"id": "scr_demo", "implementations": [{"kind": "wasm", "url": "https://x/s.wasm", "sha256": "a" * 64}]})),
    )
    conn.commit()
    definition = {
        "metadata": {"id": "qst_s", "version": "v26.0609", "title": "S", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": []}],
        "scores": [{"id": "tot", "scorer": "scr_demo@v26.0609", "path": "/total"}],
    }
    bundle = build_resolution_bundle(conn, definition)
    assert "scr_demo@v26.0609" in bundle["entities"]
    assert bundle["entities"]["scr_demo@v26.0609"]["implementations"][0]["kind"] == "wasm"


def test_build_bundle_omits_missing_entities(conn):
    definition = {"metadata": {"id": "qst_x"}, "pages": [{"id": "p", "elements": [
        {"question": {"prompt": {"ref": "pr_ghost@v26.0609"}}}]}]}
    bundle = build_resolution_bundle(conn, definition)
    assert bundle["entities"] == {}            # unresolved/missing omitted
    assert bundle["definition"] == definition  # definition untouched
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/tests/integration/test_api_bundle.py -q`
Expected: FAIL — `ImportError: cannot import name 'build_resolution_bundle'`

- [ ] **Step 3: Add `build_resolution_bundle` to `library/src/library/api/resolve.py`**

Append to the file (it already imports `parse_ref`; add the `extract_refs` import at the top alongside it):

```python
# add to the existing import line at the top:
from ..refs import parse_ref, extract_refs


def _scorer_refs(node) -> list[str]:
    """Collect every scores[].scorer "id@version" string (bare strings, not {ref} objects)."""
    out: list[str] = []

    def walk(n):
        if isinstance(n, dict):
            scorer = n.get("scorer")
            if isinstance(scorer, str) and "@" in scorer:
                out.append(scorer)
            for v in n.values():
                walk(v)
        elif isinstance(n, list):
            for x in n:
                walk(x)

    walk(node)
    return out


def build_resolution_bundle(conn, definition: dict) -> dict:
    """Return {"definition": <un-resolved Schema 2>, "entities": {"id@ver": <raw body>}}.
    Transitively collects every {ref} target AND every scores[].scorer target. Withdrawn /
    missing entities are omitted (the consumer's resolve_entity returns None for them).
    Hard-pinned CalVer refs are acyclic, so the fixed-point loop terminates."""
    entities: dict = {}
    seen: set[str] = set()
    frontier: set[str] = set()
    for r in extract_refs(definition):
        frontier.add(f"{r.to_id}@{r.to_version}")
    frontier.update(_scorer_refs(definition))
    while frontier:
        ref = frontier.pop()
        if ref in seen:
            continue
        seen.add(ref)
        body = _entity_content(conn, ref)
        if body is None:
            continue
        entities[ref] = body
        for r in extract_refs(body):
            frontier.add(f"{r.to_id}@{r.to_version}")
        frontier.update(_scorer_refs(body))
    return {"definition": definition, "entities": entities}
```

- [ ] **Step 4: Add the route to `library/src/library/api/questionnaires.py`**

The file already imports `resolve_definition`, `get_conn`, `HTTPException`, `JSONResponse`. Add `build_resolution_bundle` to the resolve import, then add this route (model it on the existing `definition` handler at line 48):

```python
# update the existing import:
from .resolve import resolve_definition, build_resolution_bundle


@router.get("/questionnaires/{qid}/versions/{version}/resolution-bundle")
def resolution_bundle(qid: str, version: str, conn=Depends(get_conn)):
    row = conn.execute(
        "SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s",
        (qid, version)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")
    status, content_json, withdrawn_at = row
    if status == "withdrawn" or content_json is None:
        return JSONResponse(status_code=410, content={
            "error": {"code": "gone", "message": "withdrawn",
                      "withdrawn_at": withdrawn_at.isoformat() if withdrawn_at else None}})
    return build_resolution_bundle(conn, content_json)
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/tests/integration/test_api_bundle.py -q`
Expected: PASS (5 passed)

- [ ] **Step 6: Confirm the rest of the library suite still passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q`
Expected: PASS (126 = prior 121 + 5 new)

- [ ] **Step 7: Commit**

```bash
git add library/src/library/api/resolve.py library/src/library/api/questionnaires.py library/tests/integration/test_api_bundle.py
git commit -m "feat(library): resolution-bundle endpoint for the Viewer Service

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: viewer-service scaffolding

**Files:**
- Create: `viewer-service/pyproject.toml`, `viewer-service/src/viewer_service/__init__.py`, `config.py`, `store/__init__.py`, `store/schema.sql`, `store/migrate.py`, `api/__init__.py`, `api/deps.py`, `api/app.py`, `tests/conftest.py`

- [ ] **Step 1: `pyproject.toml`**

```toml
[project]
name = "questionnaire-viewer-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.110",
  "uvicorn[standard]>=0.29",
  "psycopg[binary]>=3.1",
  "pydantic>=2.6",
  "httpx>=0.27",
  "jsonschema>=4.20",
  "referencing>=0.30",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "testcontainers[postgres]>=4.0"]

[project.scripts]
viewer-service = "viewer_service.cli:main"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: `src/viewer_service/__init__.py`**

```python
"""questionnaire-viewer-service VS-A: runtime generation core."""

__version__ = "0.1.0"
```

- [ ] **Step 3: `src/viewer_service/config.py`**

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


def get_settings() -> Settings:
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/viewer_service"),
        library_base_url=os.environ.get("LIBRARY_BASE_URL", "http://localhost:8000"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        runtime_cache_cap=int(os.environ.get("RUNTIME_CACHE_CAP", "10000")),
        denormaliser_version=os.environ.get("DENORMALISER_VERSION", "v26.0610"),
    )
```

- [ ] **Step 4: `src/viewer_service/store/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS deployment (
  deployment_id     text PRIMARY KEY,
  questionnaire_ref text NOT NULL,
  runtime_policy    jsonb NOT NULL,
  default_locale    text NOT NULL,
  available_locales jsonb NOT NULL,
  theme_id          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viewer_registry (
  viewer_id      text NOT NULL,
  viewer_version text NOT NULL,
  manifest       jsonb NOT NULL,
  manifest_hash  text NOT NULL,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_id, viewer_version)
);

CREATE TABLE IF NOT EXISTS runtime_cache (
  qst_id                         text NOT NULL,
  qst_version                    text NOT NULL,
  locale                         text NOT NULL,
  viewer_conformance_hash        text NOT NULL,
  deployment_runtime_policy_hash text NOT NULL,
  runtime                        jsonb NOT NULL,
  deployment_id                  text NOT NULL,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  last_accessed_at               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (qst_id, qst_version, locale, viewer_conformance_hash, deployment_runtime_policy_hash)
);
CREATE INDEX IF NOT EXISTS runtime_cache_lru ON runtime_cache (last_accessed_at);
CREATE INDEX IF NOT EXISTS runtime_cache_dep ON runtime_cache (deployment_id);
```

- [ ] **Step 5: `src/viewer_service/store/migrate.py`** + `store/__init__.py` (empty)

```python
from pathlib import Path
import psycopg

SCHEMA_SQL = Path(__file__).with_name("schema.sql")


def apply_schema(conn: psycopg.Connection) -> None:
    """Apply the DDL. Does not commit — the caller owns the transaction."""
    conn.execute(SCHEMA_SQL.read_text())
```

- [ ] **Step 6: `src/viewer_service/api/deps.py`** + `api/__init__.py` (empty)

```python
import psycopg
from ..config import get_settings


def get_conn():
    conn = psycopg.connect(get_settings().database_url)
    try:
        yield conn
    finally:
        conn.close()
```

- [ ] **Step 7: `src/viewer_service/api/app.py`**

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

_CODE_FOR = {400: "bad_request", 404: "not_found", 410: "gone",
             422: "unprocessable", 502: "upstream_unavailable"}


def create_app() -> FastAPI:
    from . import viewers, deployments, runtime, admin
    app = FastAPI(title="Questionnaire Viewer Service", version="v1")
    app.include_router(viewers.router, prefix="/v1")
    app.include_router(deployments.router, prefix="/v1")
    app.include_router(runtime.router, prefix="/v1")
    app.include_router(admin.router, prefix="/v1")

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    @app.exception_handler(HTTPException)
    async def _http_exc(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": _CODE_FOR.get(exc.status_code, "error"),
                               "message": str(exc.detail)}},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "unprocessable", "message": "validation error",
                               "detail": jsonable_encoder(exc.errors())}},
        )

    return app
```

(The `from . import viewers, deployments, runtime, admin` is inside `create_app` so this task's app import works before those modules exist — but they're created in later tasks. For THIS task only, temporarily create empty router stubs so the app imports.)

- [ ] **Step 8: Create empty router stubs** so `create_app()` imports cleanly this task. Create `api/viewers.py`, `api/deployments.py`, `api/runtime.py`, `api/admin.py`, each containing:

```python
from fastapi import APIRouter

router = APIRouter()
```

(Each is fleshed out in its own task; the stub `router` is replaced there.)

- [ ] **Step 9: `tests/conftest.py`**

```python
import os
import psycopg, pytest
from pathlib import Path
from testcontainers.postgres import PostgresContainer
from viewer_service.store.migrate import apply_schema

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_DIR = REPO_ROOT / "schemas"


@pytest.fixture(scope="session")
def pg_url():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url(driver=None)
        with psycopg.connect(url) as conn:
            apply_schema(conn)
            conn.commit()
        yield url


@pytest.fixture
def conn(pg_url):
    with psycopg.connect(pg_url, autocommit=False) as c:
        yield c


@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    from fastapi.testclient import TestClient
    from viewer_service.api.app import create_app
    return TestClient(create_app())


@pytest.fixture(autouse=True)
def _truncate(request):
    yield
    if "conn" not in request.fixturenames and "pg_url" not in request.fixturenames and "client" not in request.fixturenames:
        return
    url = request.getfixturevalue("pg_url")
    with psycopg.connect(url) as c:
        c.execute("TRUNCATE deployment, viewer_registry, runtime_cache CASCADE")
        c.commit()
```

- [ ] **Step 10: Install + verify healthz**

Run:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
.venv/bin/pip install -e viewer-service/[dev]
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q
```
Expected: `no tests ran` (exit 5) — no test files yet, but collection + `create_app()` import succeed. Then sanity-check the app:
```bash
.venv/bin/python -c "from viewer_service.api.app import create_app; app=create_app(); print('app OK', [r.path for r in app.routes if r.path=='/healthz'])"
```
Expected: `app OK ['/healthz']`

- [ ] **Step 11: Commit**

```bash
git add viewer-service/pyproject.toml viewer-service/src viewer-service/tests/conftest.py
git commit -m "feat(viewer-service): package scaffolding + 3-table schema + app factory

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Manifest validation (Schema 7)

**Files:**
- Create: `viewer-service/src/viewer_service/validation.py`
- Test: `viewer-service/tests/test_validation.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_validation.py`)

```python
import pytest
from jsonschema.exceptions import ValidationError
from viewer_service.validation import validate_manifest
from viewer_service.config import get_settings

S = get_settings()

VALID = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "scorer_impl_kinds": ["wasm", "http"],
}


def test_valid_manifest_passes():
    validate_manifest(VALID, S.schemas_dir)  # no raise


def test_missing_required_field_rejected():
    bad = {k: v for k, v in VALID.items() if k != "scorer_impl_kinds"}
    with pytest.raises(ValidationError):
        validate_manifest(bad, S.schemas_dir)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_validation.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.validation'`

- [ ] **Step 3: Implement `validation.py`**

```python
import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


@lru_cache(maxsize=8)
def _registry(schemas_dir_str: str) -> Registry:
    registry = Registry()
    for schema_path in Path(schemas_dir_str).glob("**/schema.json"):
        schema = json.loads(schema_path.read_text())
        if "$id" in schema:
            registry = registry.with_resource(schema["$id"], Resource.from_contents(schema))
    return registry


@lru_cache(maxsize=8)
def _schema(schemas_dir_str: str, name: str) -> dict:
    return json.loads((Path(schemas_dir_str) / name / "schema.json").read_text())


def validate_manifest(manifest: dict, schemas_dir: Path) -> None:
    """Validate a viewer conformance manifest against Schema 7. Raises ValidationError."""
    sd = str(schemas_dir)
    Draft202012Validator(_schema(sd, "viewer_conformance"), registry=_registry(sd)).validate(manifest)
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_validation.py -q`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/validation.py viewer-service/tests/test_validation.py
git commit -m "feat(viewer-service): Schema 7 manifest validation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Viewer registry store + viewers API

**Files:**
- Create: `viewer-service/src/viewer_service/store/viewers.py`
- Modify: `viewer-service/src/viewer_service/api/viewers.py` (replace the stub)
- Test: `viewer-service/tests/test_viewers_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_viewers_api.py`)

```python
MANIFEST = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "scorer_impl_kinds": ["wasm", "http"],
}


def test_register_then_get_viewer(client):
    r = client.post("/v1/viewers", json=MANIFEST)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["viewer_id"] == "behaverse-web-viewer"
    assert body["viewer_version"] == "v26.0610"
    assert len(body["manifest_hash"]) == 64

    g = client.get("/v1/viewers/behaverse-web-viewer/v26.0610")
    assert g.status_code == 200
    assert g.json()["manifest"] == MANIFEST


def test_register_invalid_manifest_422(client):
    bad = {k: v for k, v in MANIFEST.items() if k != "scorer_impl_kinds"}
    r = client.post("/v1/viewers", json=bad)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_manifest"


def test_get_unknown_viewer_404(client):
    r = client.get("/v1/viewers/nope/v1")
    assert r.status_code == 404
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_viewers_api.py -q`
Expected: FAIL (404/405 — route is still the empty stub)

- [ ] **Step 3: Implement `store/viewers.py`**

```python
import psycopg
from psycopg.types.json import Jsonb


def upsert_viewer(conn: psycopg.Connection, viewer_id: str, viewer_version: str,
                  manifest: dict, manifest_hash: str) -> None:
    conn.execute(
        "INSERT INTO viewer_registry (viewer_id, viewer_version, manifest, manifest_hash) "
        "VALUES (%s,%s,%s,%s) "
        "ON CONFLICT (viewer_id, viewer_version) DO UPDATE SET "
        "manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash, registered_at=now()",
        (viewer_id, viewer_version, Jsonb(manifest), manifest_hash),
    )
    conn.commit()


def get_viewer(conn: psycopg.Connection, viewer_id: str, viewer_version: str) -> dict | None:
    row = conn.execute(
        "SELECT manifest, manifest_hash FROM viewer_registry WHERE viewer_id=%s AND viewer_version=%s",
        (viewer_id, viewer_version)).fetchone()
    if row is None:
        return None
    return {"manifest": row[0], "manifest_hash": row[1]}
```

- [ ] **Step 4: Implement `api/viewers.py`** (replace the stub)

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from jsonschema.exceptions import ValidationError
from denormaliser import canonical_hash
from .deps import get_conn
from ..config import get_settings
from ..validation import validate_manifest
from ..store import viewers as store

router = APIRouter()


@router.post("/viewers", status_code=201)
def register(manifest: dict, conn=Depends(get_conn)):
    try:
        validate_manifest(manifest, get_settings().schemas_dir)
    except ValidationError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid_manifest", "message": e.message}})
    viewer_id = manifest["viewer_id"]
    viewer_version = manifest["viewer_version"]
    manifest_hash = canonical_hash(manifest)
    store.upsert_viewer(conn, viewer_id, viewer_version, manifest, manifest_hash)
    return {"viewer_id": viewer_id, "viewer_version": viewer_version, "manifest_hash": manifest_hash}


@router.get("/viewers/{viewer_id}/{viewer_version}")
def get(viewer_id: str, viewer_version: str, conn=Depends(get_conn)):
    v = store.get_viewer(conn, viewer_id, viewer_version)
    if v is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    return v
```

- [ ] **Step 5: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_viewers_api.py -q`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/store/viewers.py viewer-service/src/viewer_service/api/viewers.py viewer-service/tests/test_viewers_api.py
git commit -m "feat(viewer-service): viewer registry (register/get manifests)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Deployment store + deployments API

**Files:**
- Create: `viewer-service/src/viewer_service/store/deployments.py`, `viewer-service/src/viewer_service/models.py`
- Modify: `viewer-service/src/viewer_service/api/deployments.py` (replace the stub)
- Test: `viewer-service/tests/test_deployments_api.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_deployments_api.py`)

```python
def _create_body():
    return {
        "questionnaire_ref": "qst_phq9@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": False},
        "default_locale": "en",
        "available_locales": ["en", "pt"],
    }


def test_create_then_get_deployment(client):
    r = client.post("/v1/deployments", json=_create_body())
    assert r.status_code == 201, r.text
    dep_id = r.json()["deployment_id"]
    assert dep_id.startswith("dep_")

    g = client.get(f"/v1/deployments/{dep_id}")
    assert g.status_code == 200
    body = g.json()
    assert body["questionnaire_ref"] == "qst_phq9@v26.0609"
    # runtime_policy normalized to the full canonical 6-field dict
    assert body["runtime_policy"] == {
        "scorer_impl_preference": ["wasm", "http"], "show_score": False,
        "lock_show_score_timing": False, "show_score_live": False,
        "pre_fetch_all_locales": False, "disable_in_session_scoring": False,
    }


def test_create_rejects_bad_policy_422(client):
    body = _create_body()
    del body["runtime_policy"]["scorer_impl_preference"]   # required field
    r = client.post("/v1/deployments", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid"


def test_get_unknown_deployment_404(client):
    assert client.get("/v1/deployments/dep_nope").status_code == 404
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_deployments_api.py -q`
Expected: FAIL (404/405 — stub route)

- [ ] **Step 3: Implement `models.py`**

```python
from pydantic import BaseModel


class DeploymentCreate(BaseModel):
    questionnaire_ref: str
    runtime_policy: dict
    default_locale: str
    available_locales: list[str]
    theme_id: str | None = None


class RuntimeRequest(BaseModel):
    viewer_id: str
    viewer_version: str
    locale: str | None = None
```

- [ ] **Step 4: Implement `store/deployments.py`**

```python
import psycopg
from psycopg.types.json import Jsonb


def insert_deployment(conn: psycopg.Connection, deployment_id: str, questionnaire_ref: str,
                      runtime_policy: dict, default_locale: str, available_locales: list[str],
                      theme_id: str | None) -> None:
    conn.execute(
        "INSERT INTO deployment (deployment_id, questionnaire_ref, runtime_policy, "
        "default_locale, available_locales, theme_id) VALUES (%s,%s,%s,%s,%s,%s)",
        (deployment_id, questionnaire_ref, Jsonb(runtime_policy), default_locale,
         Jsonb(available_locales), theme_id),
    )
    conn.commit()


def get_deployment(conn: psycopg.Connection, deployment_id: str) -> dict | None:
    row = conn.execute(
        "SELECT deployment_id, questionnaire_ref, runtime_policy, default_locale, "
        "available_locales, theme_id FROM deployment WHERE deployment_id=%s",
        (deployment_id,)).fetchone()
    if row is None:
        return None
    cols = ["deployment_id", "questionnaire_ref", "runtime_policy", "default_locale",
            "available_locales", "theme_id"]
    return dict(zip(cols, row))
```

- [ ] **Step 5: Implement `api/deployments.py`** (replace the stub)

```python
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import RuntimePolicy
from .deps import get_conn
from ..models import DeploymentCreate
from ..store import deployments as store

router = APIRouter()


@router.post("/deployments", status_code=201)
def create(body: DeploymentCreate, conn=Depends(get_conn)):
    try:
        policy = RuntimePolicy(**body.runtime_policy).to_canonical_dict()
    except TypeError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid", "message": f"invalid runtime_policy: {e}"}})
    deployment_id = "dep_" + uuid.uuid4().hex[:8]
    store.insert_deployment(conn, deployment_id, body.questionnaire_ref, policy,
                            body.default_locale, body.available_locales, body.theme_id)
    return {"deployment_id": deployment_id}


@router.get("/deployments/{deployment_id}")
def get(deployment_id: str, conn=Depends(get_conn)):
    dep = store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return dep
```

- [ ] **Step 6: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_deployments_api.py -q`
Expected: PASS (3 passed)

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/store/deployments.py viewer-service/src/viewer_service/api/deployments.py viewer-service/tests/test_deployments_api.py
git commit -m "feat(viewer-service): deployment create/get with policy normalization

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Locale resolution

**Files:**
- Create: `viewer-service/src/viewer_service/locale.py`
- Test: `viewer-service/tests/test_locale.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_locale.py`)

```python
from viewer_service.locale import resolve_locale


def test_requested_locale_used_when_available():
    assert resolve_locale("pt", available=["en", "pt"], default="en") == "pt"


def test_falls_back_to_default_when_requested_unavailable():
    assert resolve_locale("fr", available=["en", "pt"], default="en") == "en"


def test_falls_back_to_default_when_none_requested():
    assert resolve_locale(None, available=["en", "pt"], default="en") == "en"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_locale.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.locale'`

- [ ] **Step 3: Implement `locale.py`**

```python
def resolve_locale(requested: str | None, *, available: list[str], default: str) -> str:
    """VS-A locale resolution: the requested locale if it is in the deployment's
    available_locales, otherwise the deployment default. Whether the chosen locale
    actually exists in the questionnaire is enforced downstream by the denormaliser's
    strict missing-locale check (surfaced as a 422 pre-flight error)."""
    if requested is not None and requested in available:
        return requested
    return default
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_locale.py -q`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/locale.py viewer-service/tests/test_locale.py
git commit -m "feat(viewer-service): VS-A locale resolution

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Runtime cache store (key + LRU + purge)

**Files:**
- Create: `viewer-service/src/viewer_service/store/runtime_cache.py`
- Test: `viewer-service/tests/test_runtime_cache.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_runtime_cache.py`)

```python
from viewer_service.store import runtime_cache as cache

KEY = ("qst_x", "v26.0609", "en", "a" * 64, "b" * 64)


def test_put_then_get_returns_runtime(conn):
    cache.put(conn, KEY, {"hello": "world"}, "dep_1", cap=100)
    assert cache.get(conn, *KEY) == {"hello": "world"}


def test_get_miss_returns_none(conn):
    assert cache.get(conn, "qst_none", "v26.0609", "en", "a" * 64, "b" * 64) is None


def test_purge_all(conn):
    cache.put(conn, KEY, {"a": 1}, "dep_1", cap=100)
    cache.put(conn, ("qst_y", "v26.0609", "en", "c" * 64, "d" * 64), {"a": 2}, "dep_2", cap=100)
    assert cache.purge(conn) == 2
    assert cache.get(conn, *KEY) is None


def test_purge_by_deployment(conn):
    cache.put(conn, KEY, {"a": 1}, "dep_1", cap=100)
    cache.put(conn, ("qst_y", "v26.0609", "en", "c" * 64, "d" * 64), {"a": 2}, "dep_2", cap=100)
    assert cache.purge(conn, deployment_id="dep_1") == 1
    assert cache.get(conn, *KEY) is None
    assert cache.get(conn, "qst_y", "v26.0609", "en", "c" * 64, "d" * 64) == {"a": 2}


def test_lru_evicts_oldest_when_over_cap(conn):
    # 3 entries with distinct last_accessed_at; then a 4th put with cap=2 evicts the 2 oldest.
    for i, ts in enumerate(["2026-01-01", "2026-01-02", "2026-01-03"]):
        cache.put(conn, (f"qst_{i}", "v26.0609", "en", "a" * 64, "b" * 64), {"i": i}, "dep_x", cap=100)
        conn.execute("UPDATE runtime_cache SET last_accessed_at=%s WHERE qst_id=%s",
                     (ts + "T00:00:00+00:00", f"qst_{i}"))
        conn.commit()
    cache.put(conn, ("qst_3", "v26.0609", "en", "a" * 64, "b" * 64), {"i": 3}, "dep_x", cap=2)
    present = {r[0] for r in conn.execute("SELECT qst_id FROM runtime_cache").fetchall()}
    assert present == {"qst_2", "qst_3"}   # newest two kept; qst_0, qst_1 evicted
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_runtime_cache.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.store.runtime_cache'`

- [ ] **Step 3: Implement `store/runtime_cache.py`**

```python
import psycopg
from psycopg.types.json import Jsonb

_KEY_COLS = ("qst_id", "qst_version", "locale", "viewer_conformance_hash",
             "deployment_runtime_policy_hash")
_WHERE = " AND ".join(f"{c}=%s" for c in _KEY_COLS)


def get(conn: psycopg.Connection, qst_id: str, qst_version: str, locale: str,
        viewer_hash: str, policy_hash: str) -> dict | None:
    key = (qst_id, qst_version, locale, viewer_hash, policy_hash)
    row = conn.execute(f"SELECT runtime FROM runtime_cache WHERE {_WHERE}", key).fetchone()
    if row is None:
        return None
    conn.execute(f"UPDATE runtime_cache SET last_accessed_at=now() WHERE {_WHERE}", key)
    conn.commit()
    return row[0]


def put(conn: psycopg.Connection, key: tuple, runtime: dict, deployment_id: str, cap: int) -> None:
    conn.execute(
        "INSERT INTO runtime_cache (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash, runtime, deployment_id) VALUES (%s,%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash) DO UPDATE SET runtime=EXCLUDED.runtime, "
        "last_accessed_at=now()",
        (*key, Jsonb(runtime), deployment_id),
    )
    # LRU eviction: keep the `cap` most-recently-accessed rows, delete the rest.
    conn.execute(
        "DELETE FROM runtime_cache WHERE (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash) IN ("
        "  SELECT qst_id, qst_version, locale, viewer_conformance_hash, "
        "  deployment_runtime_policy_hash FROM runtime_cache "
        "  ORDER BY last_accessed_at DESC OFFSET %s)",
        (cap,),
    )
    conn.commit()


def purge(conn: psycopg.Connection, deployment_id: str | None = None) -> int:
    if deployment_id is None:
        cur = conn.execute("DELETE FROM runtime_cache")
    else:
        cur = conn.execute("DELETE FROM runtime_cache WHERE deployment_id=%s", (deployment_id,))
    n = cur.rowcount
    conn.commit()
    return n
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_runtime_cache.py -q`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/store/runtime_cache.py viewer-service/tests/test_runtime_cache.py
git commit -m "feat(viewer-service): runtime_cache store (5-tuple key, LRU evict, purge)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Library client

**Files:**
- Create: `viewer-service/src/viewer_service/library_client.py`
- Test: `viewer-service/tests/test_library_client.py`

- [ ] **Step 1: Write the failing tests** (`tests/test_library_client.py`)

```python
import httpx
import pytest
from viewer_service.library_client import fetch_resolution_bundle, LibraryError

BUNDLE = {"definition": {"metadata": {"id": "qst_x"}}, "entities": {}}


def _client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_fetch_returns_bundle():
    def handler(request):
        assert request.url.path == "/v1/questionnaires/qst_x/versions/v26.0609/resolution-bundle"
        return httpx.Response(200, json=BUNDLE)
    out = fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert out == BUNDLE


def test_404_raises_library_error_404():
    def handler(request):
        return httpx.Response(404, json={"error": {"code": "not_found", "message": "nope"}})
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 404


def test_410_raises_library_error_410():
    def handler(request):
        return httpx.Response(410, json={"error": {"code": "gone", "message": "withdrawn"}})
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 410


def test_transport_error_raises_502():
    def handler(request):
        raise httpx.ConnectError("boom")
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 502
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_library_client.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.library_client'`

- [ ] **Step 3: Implement `library_client.py`**

```python
import httpx


class LibraryError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(f"{status}: {message}")


def fetch_resolution_bundle(base_url: str, qst_id: str, version: str, *,
                            client: httpx.Client | None = None) -> dict:
    """Fetch {definition, entities} from the Library's resolution-bundle endpoint.
    Raises LibraryError(404|410|502, ...). `client` is injectable for testing."""
    url = f"{base_url}/v1/questionnaires/{qst_id}/versions/{version}/resolution-bundle"
    owns = client is None
    client = client or httpx.Client(timeout=10.0)
    try:
        try:
            resp = client.get(url)
        except httpx.HTTPError as e:
            raise LibraryError(502, f"library unreachable: {e}")
        if resp.status_code == 404:
            raise LibraryError(404, "questionnaire not found in library")
        if resp.status_code == 410:
            raise LibraryError(410, "questionnaire withdrawn")
        if resp.status_code >= 400:
            raise LibraryError(502, f"library returned {resp.status_code}")
        return resp.json()
    finally:
        if owns:
            client.close()
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/pytest viewer-service/tests/test_library_client.py -q`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/library_client.py viewer-service/tests/test_library_client.py
git commit -m "feat(viewer-service): Library client (resolution-bundle fetch)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Mint-runtime orchestration + runtime API + admin purge

**Files:**
- Create: `viewer-service/src/viewer_service/runtime.py`
- Modify: `viewer-service/src/viewer_service/api/runtime.py` (replace the stub), `viewer-service/src/viewer_service/api/admin.py` (replace the stub)
- Test: `viewer-service/tests/test_runtime_api.py`

This task wires the whole flow. The runtime API test mocks the Library by monkeypatching `viewer_service.runtime.fetch_resolution_bundle` with a function returning a realistic, fully-resolvable bundle (so the real `denormaliser` produces — and validates — a real Schema 3).

- [ ] **Step 1: Write the failing tests** (`tests/test_runtime_api.py`)

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

# A fully-resolvable bundle: questionnaire with one ref'd prompt + ref'd option + a scorer.
BUNDLE = {
    "definition": {
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini",
                     "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}},
             "option": {"ref": "opt_1@v26.0609"}}]}],
        "scores": [{"id": "tot", "scorer": "scr_1@v26.0609", "path": "/total"}],
    },
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {
            "en": {"status": "validated", "text": "Interest?"},
            "pt": {"status": "validated", "text": "Interesse?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice",
            "measurement_type": "ordinal", "selection": "single",
            "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
            "content": {"en": {"status": "validated", "label": "L",
                               "options": [{"index": 1, "text": "No"}, {"index": 2, "text": "Yes"}]},
                        "pt": {"status": "validated", "label": "L",
                               "options": [{"index": 1, "text": "Não"}, {"index": 2, "text": "Sim"}]}}},
        "scr_1@v26.0609": {"id": "scr_1", "implementations": [
            {"kind": "wasm", "url": "https://x/s.wasm", "sha256": "a" * 64}]},
    },
}


@pytest.fixture
def setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle",
                        lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    return client, dep["deployment_id"]


def test_mint_returns_valid_schema3(setup):
    client, dep_id = setup
    r = client.post(f"/v1/deployments/{dep_id}/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"})
    assert r.status_code == 200, r.text
    rt = r.json()
    # refs inlined, locale trimmed, scorer pinned (the denormaliser also validated vs Schema 3)
    assert rt["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "en": {"status": "validated", "text": "Interest?"}}
    assert rt["scores"][0]["impl"]["kind"] == "wasm"
    assert rt["provenance"]["source_questionnaire_id"] == "qst_mini"


def test_mint_caches(setup, monkeypatch):
    client, dep_id = setup
    calls = {"n": 0}
    real = runtime_mod.fetch_resolution_bundle
    def counting(base, qid, ver):
        calls["n"] += 1
        return BUNDLE
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", counting)
    body = {"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"}
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    assert calls["n"] == 1   # second call served from cache; Library not hit again


def test_mint_missing_locale_is_422(setup):
    client, dep_id = setup
    # 'de' is not in available_locales -> falls back to default 'en' (present) -> OK.
    # Force a real missing locale: request a deployment whose default isn't in the bundle.
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"]},
        "default_locale": "de", "available_locales": ["de"]}).json()
    r = client.post(f"/v1/deployments/{dep['deployment_id']}/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610", "locale": "de"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "preflight_failed"
    assert any(p["kind"] == "missing_locale" for p in r.json()["error"]["detail"])


def test_mint_unknown_deployment_404(setup):
    client, _ = setup
    r = client.post("/v1/deployments/dep_nope/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610"})
    assert r.status_code == 404


def test_mint_unknown_viewer_404(setup):
    client, dep_id = setup
    r = client.post(f"/v1/deployments/{dep_id}/runtime",
                    json={"viewer_id": "ghost", "viewer_version": "v1"})
    assert r.status_code == 404


def test_admin_purge(setup):
    client, dep_id = setup
    body = {"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"}
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    r = client.delete("/v1/runtime_cache")
    assert r.status_code == 200
    assert r.json()["purged"] >= 1
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_runtime_api.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'viewer_service.runtime'`

- [ ] **Step 3: Implement `runtime.py`**

```python
from datetime import datetime, timezone

from denormaliser import RuntimePolicy, canonical_hash, denormalise

from .config import get_settings
from .library_client import fetch_resolution_bundle
from .locale import resolve_locale
from .store import runtime_cache as cache


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def mint_runtime(conn, deployment: dict, viewer: dict, requested_locale: str | None) -> dict:
    """The core flow: resolve locale → 5-tuple cache key → hit returns; miss fetches the
    Library bundle, denormalises, caches, returns. Raises denormaliser.PreflightError on a
    bad (questionnaire × viewer × policy) combination, or library_client.LibraryError."""
    settings = get_settings()
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    locale = resolve_locale(requested_locale, available=deployment["available_locales"],
                            default=deployment["default_locale"])
    policy_dict = deployment["runtime_policy"]
    policy_hash = canonical_hash(policy_dict)
    viewer_hash = viewer["manifest_hash"]
    key = (qst_id, qst_version, locale, viewer_hash, policy_hash)

    cached = cache.get(conn, *key)
    if cached is not None:
        return cached

    bundle = fetch_resolution_bundle(settings.library_base_url, qst_id, qst_version)
    runtime = denormalise(
        bundle["definition"],
        locale=locale,
        runtime_policy=RuntimePolicy(**policy_dict),
        viewer_manifest=viewer["manifest"],
        resolve_entity=bundle["entities"].get,
        generated_at=_now_iso(),
        denormaliser_version=settings.denormaliser_version,
        schemas_dir=settings.schemas_dir,
    )
    prov = runtime["provenance"]
    assert prov["viewer_conformance_hash"] == viewer_hash, "viewer hash mismatch (bug)"
    assert prov["deployment_runtime_policy_hash"] == policy_hash, "policy hash mismatch (bug)"
    cache.put(conn, key, runtime, deployment["deployment_id"], cap=settings.runtime_cache_cap)
    return runtime
```

- [ ] **Step 4: Implement `api/runtime.py`** (replace the stub)

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import PreflightError
from .deps import get_conn
from ..models import RuntimeRequest
from ..library_client import LibraryError
from ..store import deployments as dep_store
from ..store import viewers as viewer_store
from ..runtime import mint_runtime

router = APIRouter()


@router.post("/deployments/{deployment_id}/runtime")
def mint(deployment_id: str, body: RuntimeRequest, conn=Depends(get_conn)):
    dep = dep_store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    viewer = viewer_store.get_viewer(conn, body.viewer_id, body.viewer_version)
    if viewer is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    try:
        return mint_runtime(conn, dep, viewer, body.locale)
    except PreflightError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "preflight_failed", "message": "runtime pre-flight failed",
            "detail": [{"kind": p.kind, "where": p.where, "detail": p.detail} for p in e.problems]}})
    except LibraryError as e:
        raise HTTPException(status_code=e.status, detail=e.message)
```

- [ ] **Step 5: Implement `api/admin.py`** (replace the stub)

```python
from fastapi import APIRouter, Depends
from .deps import get_conn
from ..store import runtime_cache as cache

router = APIRouter()


@router.delete("/runtime_cache")
def purge(deployment_id: str | None = None, conn=Depends(get_conn)):
    n = cache.purge(conn, deployment_id=deployment_id)
    return {"purged": n}
```

- [ ] **Step 6: Run to verify pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/tests/test_runtime_api.py -q`
Expected: PASS (6 passed). If a test fails, it points to a real wiring/logic bug — STOP and report rather than weakening the test.

- [ ] **Step 7: Run the whole viewer-service suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q`
Expected: PASS (all tests Tasks 3–9 green).

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/runtime.py viewer-service/src/viewer_service/api/runtime.py viewer-service/src/viewer_service/api/admin.py viewer-service/tests/test_runtime_api.py
git commit -m "feat(viewer-service): mint-runtime orchestration + runtime/admin API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: CLI, README, FOLLOWUPS, final gate

**Files:**
- Create: `viewer-service/src/viewer_service/cli.py`, `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`

- [ ] **Step 1: Implement `cli.py`** (a `migrate` entrypoint, mirroring library)

```python
import sys
import psycopg
from .config import get_settings
from .store.migrate import apply_schema


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv or argv[0] != "migrate":
        print("usage: viewer-service migrate")
        return 2
    with psycopg.connect(get_settings().database_url) as conn:
        apply_schema(conn)
        conn.commit()
    print("schema applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Write `README.md`**

````markdown
# questionnaire-viewer-service (VS-A: runtime generation core)

FastAPI + Postgres service that mints **cached Schema 3 runtimes** by calling the
`questionnaire-runtime-denormaliser`, reading questionnaire + entity bodies from the
**Library** over HTTP. VS-A is the runtime-generation spine; sessions, submission
forwarding (OD-13), and deployment-management UX arrive in VS-B / VS-C.

## Endpoints (`/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /viewers` | Register a viewer by POSTing its Schema 7 manifest (validated + hashed). |
| `GET /viewers/{id}/{version}` | Fetch a stored manifest. |
| `POST /deployments` | Create a minimal deployment (questionnaire_ref + runtime_policy + locales). |
| `GET /deployments/{id}` | Fetch a deployment. |
| `POST /deployments/{id}/runtime` | Mint (or return cached) Schema 3 for `{viewer_id, viewer_version, locale?}`. |
| `DELETE /runtime_cache[?deployment_id=]` | Admin purge (OD-18f). |
| `GET /healthz` | Health. |

The runtime cache is keyed by the OD-18f 5-tuple `(qst_id, qst_version, locale,
viewer_conformance_hash, deployment_runtime_policy_hash)` with LRU eviction.

## Development

```bash
source ../.venv/bin/activate
pip install -e ../questionnaire-runtime-denormaliser   # denormaliser dep (editable)
pip install -e .[dev]
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
viewer-service migrate
export LIBRARY_BASE_URL=http://localhost:8000          # a running Library
uvicorn viewer_service.api.app:create_app --factory --reload
```

Tests (testcontainers needs the Docker config override, same as `library/`):
```bash
DOCKER_CONFIG=/tmp/lib_docker pytest -q
```
````

- [ ] **Step 3: Write `FOLLOWUPS.md`**

```markdown
# Follow-ups — questionnaire-viewer-service (VS-A)

- **Auth (Identity).** All VS-A endpoints — including `DELETE /runtime_cache` — are
  unauthenticated. Gate them once the Identity sibling lands (OD-08); admin purge and
  deployment CRUD are researcher-only operations.
- **URL-fetch manifest ingestion (OD-18c).** VS-A ingests manifests by direct POST.
  Add the fetch-from-published-URL variant when the Web Viewer ships a real manifest URL.
- **Full locale precedence.** VS-A resolves locale from deployment config only. The full
  OD chain (URL param → platform profile → deployment default → Accept-Language →
  questionnaire canonical) needs request/session context — VS-B.
- **Cache LRU under concurrency.** Eviction is a best-effort `DELETE ... OFFSET cap` per
  put; under heavy concurrent misses it can momentarily exceed the cap. Fine for MVP;
  revisit with an advisory lock or a background sweeper if it matters.
- **Library client resilience.** No retry/backoff on transient Library 5xx yet (just a
  502 passthrough). Add retry when this path goes to production load.
```

- [ ] **Step 4: Run the full verification gate**

Run each, capture output:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest viewer-service/ -q            # all VS-A tests green
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q                  # 126 (121 + 5 new bundle tests)
.venv/bin/pytest questionnaire-runtime-denormaliser/ -q                     # 56 — untouched
DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest tools/tests/ -q              # 309 — untouched
```
Expected: VS-A suite fully green; `library/` 126; denormaliser 56; tools 309.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/src/viewer_service/cli.py viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "feat(viewer-service): migrate CLI + README + FOLLOWUPS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** Library resolution-bundle endpoint (T1) ✓ · scaffolding + 3 tables + app factory (T2) ✓ · Schema 7 manifest validation (T3) ✓ · viewer registry register/get (T4) ✓ · minimal deployment + policy normalization (T5) ✓ · VS-A locale resolution (T6) ✓ · runtime_cache 5-tuple key + LRU + purge (T7) ✓ · Library client w/ 404/410/502 (T8) ✓ · mint flow + cache hit/miss + 422 PreflightError + hash-consistency assert + admin purge (T9) ✓ · README/FOLLOWUPS/CLI (T10) ✓.
- **Type consistency:** `mint_runtime(conn, deployment, viewer, requested_locale)` ✓; cache `get(conn, qst_id, qst_version, locale, viewer_hash, policy_hash)` / `put(conn, key, runtime, deployment_id, cap)` / `purge(conn, deployment_id=None)` consistent T7/T9; `fetch_resolution_bundle(base_url, qst_id, version, *, client=None)` consistent T8/T9 (monkeypatched in T9 with `(base, qid, ver)`); `get_viewer` returns `{manifest, manifest_hash}` and `get_deployment` returns the 6-key dict, both consumed correctly in T9; `RuntimePolicy(**policy_dict)` matches the normalized canonical dict from T5.
- **No placeholders:** every step has real code + exact commands + expected output.
- **Cross-package note:** T1 modifies `library/`; T2–T10 build `viewer-service/`. Both are committed on the same branch `phase2-viewer-service-vs-a` and merged together.
```
