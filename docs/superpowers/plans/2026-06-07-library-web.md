# Library Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Library web UI — a catalogue/browse/search SPA over the Library Core read API that lets a researcher search questionnaires, view their metadata + items, and download canonical JSON — plus the five small Core API additions the UI requires.

**Architecture:** Two parts. **(1) Core additions** (Python/FastAPI in the existing `library/`): CORS, a resolved-definition endpoint that inlines referenced entity content so item text is renderable, an enriched catalogue-card list/search response, language+license facets, and version severity/date. **(2) Frontend** (`library-web/`): a Vite + React + TS SPA with a typed `fetch` client, TanStack Query for data, React Router with URL-synced catalogue state, presentational components fed by container pages, Tailwind + Radix headless primitives for UI, and Vitest/RTL + a Playwright smoke test.

**Tech Stack:** Python 3.12 · FastAPI · psycopg 3 · Pydantic v2 · pytest + testcontainers — and — Vite · React 19 · TypeScript · Tailwind CSS · Radix UI · TanStack Query · React Router · Vitest · React Testing Library · Playwright.

**Spec:** [docs/superpowers/specs/2026-06-07-library-web-design.md](../specs/2026-06-07-library-web-design.md)

**Conventions for every Python task:** activate the venv and use the Docker override the repo requires:
```bash
source .venv/bin/activate
export DOCKER_CONFIG=/tmp/lib_docker      # required for testcontainers on this machine
```
Run a single Python test file with e.g. `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_resolved.py -q`.

**Conventions for every frontend task:** run from `library-web/`. `npm test` runs Vitest once (`vitest run`); `npm run test:watch` watches.

---

## Phase A — Core API additions (`library/`)

### Task A1: CORS middleware

**Files:**
- Modify: `library/src/library/config.py`
- Modify: `library/src/library/api/app.py`
- Test: `library/tests/integration/test_api_cors.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_cors.py
from fastapi.testclient import TestClient
from library.api.app import create_app

def test_cors_preflight_allows_dev_origin(monkeypatch):
    monkeypatch.setenv("LIBRARY_CORS_ORIGINS", "http://localhost:5173")
    client = TestClient(create_app())
    r = client.options(
        "/v1/questionnaires",
        headers={"Origin": "http://localhost:5173",
                 "Access-Control-Request-Method": "GET"},
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_simple_get_has_allow_origin(monkeypatch):
    monkeypatch.setenv("LIBRARY_CORS_ORIGINS", "http://localhost:5173")
    client = TestClient(create_app())
    r = client.get("/healthz", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_cors.py -q`
Expected: FAIL — no `access-control-allow-origin` header.

- [ ] **Step 3: Add a `cors_origins` setting**

In `library/src/library/config.py`, add the field to `Settings` and populate it in `get_settings()`:

```python
@dataclass(frozen=True)
class Settings:
    database_url: str
    content_dir: Path
    schemas_dir: Path
    api_prefix: str = "/v1"
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
```

```python
def get_settings() -> Settings:
    raw = os.environ.get("LIBRARY_CORS_ORIGINS")
    origins = tuple(o.strip() for o in raw.split(",") if o.strip()) if raw else ("http://localhost:5173",)
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/library"),
        content_dir=Path(os.environ.get("CONTENT_DIR") or REPO_ROOT / "schemas/questionnaire/examples/library_examples"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        api_prefix=os.environ.get("API_PREFIX", "/v1"),
        cors_origins=origins,
    )
```

- [ ] **Step 4: Add the middleware in `app.py`**

At the top of `create_app()` in `library/src/library/api/app.py`, after `app = FastAPI(...)`:

```python
from fastapi.middleware.cors import CORSMiddleware
from ..config import get_settings
```
```python
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(get_settings().cors_origins),
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["*"],
    )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_cors.py -q`
Expected: PASS (2 passed).

- [ ] **Step 6: Commit**

```bash
git add library/src/library/config.py library/src/library/api/app.py library/tests/integration/test_api_cors.py
git commit -m "feat(library): CORS middleware for the web UI origin"
```

---

### Task A2: Resolved-definition endpoint

**Files:**
- Create: `library/src/library/api/resolve.py`
- Modify: `library/src/library/api/questionnaires.py:52-64`
- Test: `library/tests/integration/test_api_resolved.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_resolved.py
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
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

def test_raw_definition_keeps_refs(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition")
    assert r.status_code == 200
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt == {"ref": "pr_aiss_q_2@v26.0601"}  # untouched

def test_resolved_inlines_prompt_text(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    assert r.status_code == 200
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["ref"] == "pr_aiss_q_2@v26.0601"            # ref preserved
    assert prompt["content"]["en"]["text"].startswith("When the water is very cold")

def test_resolved_unknown_ref_marks_unresolved(client, pg_url):
    # repoint the prompt ref at a missing entity to exercise the fallback
    with psycopg.connect(pg_url) as c:
        c.execute("UPDATE entity SET content_json = jsonb_set(content_json, "
                  "'{pages,0,elements,0,question,prompt,ref}', '\"pr_missing@v26.0601\"') "
                  "WHERE id='qst_min'")
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["_unresolved"] is True

def test_resolved_withdrawn_still_410(client, pg_url):
    from datetime import datetime, timezone
    from library.store.entities import withdraw_entity
    with psycopg.connect(pg_url) as c:
        withdraw_entity(c, "qst_min", "v26.0601", datetime(2026, 6, 7, tzinfo=timezone.utc))
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    assert r.status_code == 410
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_resolved.py -q`
Expected: FAIL — `resolved` param ignored; `prompt` still equals `{"ref": ...}` in the resolved test.

- [ ] **Step 3: Write the resolver**

```python
# library/src/library/api/resolve.py
import psycopg
from ..refs import parse_ref


def _entity_content(conn: psycopg.Connection, ref_str: str) -> dict | None:
    """Stored content_json of the entity a hard-pinned ref points at, or None if the
    ref is unparseable / the entity is missing / the entity is withdrawn (content NULL)."""
    try:
        eid, ver = parse_ref(ref_str)
    except ValueError:
        return None
    row = conn.execute(
        "SELECT content_json FROM entity WHERE id=%s AND version=%s", (eid, ver)
    ).fetchone()
    if row is None or row[0] is None:
        return None
    return row[0]


def resolve_definition(conn: psycopg.Connection, definition: dict) -> dict:
    """Return a deep copy of a Schema-2 definition where every {"ref": "id@ver"} object
    is augmented in place with the referenced entity's stored fields (its `content` map,
    structural fields, etc.) so a viewer has the text locally. The original `ref` string
    is preserved; existing sibling keys win over merged-in ones (setdefault). Refs that do
    not resolve get `_unresolved: True`. Resolution recurses into merged content, so a
    saved Item ref's nested Prompt/Option refs resolve too. References are hard-pinned and
    acyclic (CalVer), so this terminates."""
    def walk(node):
        if isinstance(node, dict):
            merged = dict(node)
            ref = node.get("ref")
            if isinstance(ref, str) and "@" in ref:
                content = _entity_content(conn, ref)
                if content is None:
                    merged["_unresolved"] = True
                else:
                    for k, v in content.items():
                        merged.setdefault(k, v)
            return {k: walk(v) for k, v in merged.items()}
        if isinstance(node, list):
            return [walk(x) for x in node]
        return node
    return walk(definition)
```

- [ ] **Step 4: Wire the `resolved` flag into the route**

Replace the `definition` handler in `library/src/library/api/questionnaires.py` (lines 52–64) with:

```python
@router.get("/questionnaires/{qid}/versions/{version}/definition")
def definition(qid: str, version: str, resolved: bool = False, conn=Depends(get_conn)):
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
    if resolved:
        from .resolve import resolve_definition
        return resolve_definition(conn, content_json)
    return content_json
```

- [ ] **Step 5: Run test to verify it passes**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_resolved.py -q`
Expected: PASS (4 passed).

- [ ] **Step 6: Commit**

```bash
git add library/src/library/api/resolve.py library/src/library/api/questionnaires.py library/tests/integration/test_api_resolved.py
git commit -m "feat(library): resolved-definition endpoint inlining referenced entity content"
```

---

### Task A3: Enriched catalogue card (list + search)

**Files:**
- Modify: `library/src/library/models.py`
- Modify: `library/src/library/query.py`
- Modify: `library/src/library/api/questionnaires.py:10-29`
- Modify: `library/src/library/api/search.py:10-26`
- Test: `library/tests/integration/test_api_cards.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_cards.py
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
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

def test_list_card_has_enriched_fields(client):
    card = next(i for i in client.get("/v1/questionnaires").json()["items"]
                if i["id"] == "qst_min")
    assert card["description"].startswith("Smallest valid questionnaire")
    assert card["item_count"] == 1
    assert card["language"] == "en"
    assert card["domain"] == ["wellbeing"]
    assert card["population"] == ["adults"]

def test_search_card_has_enriched_fields(client):
    card = next(i for i in client.get("/v1/search", params={"q": "Minimal"}).json()["items"]
                if i["id"] == "qst_min")
    assert card["item_count"] == 1
    assert card["domain"] == ["wellbeing"]

def test_list_filters_still_work(client):
    body = client.get("/v1/questionnaires", params={"domain": "wellbeing"}).json()
    assert any(i["id"] == "qst_min" for i in body["items"])
    assert client.get("/v1/questionnaires", params={"min_items": 5}).json()["total"] == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_cards.py -q`
Expected: FAIL — response items lack `description`/`item_count`/`domain`.

- [ ] **Step 3: Add the `CatalogueCard` model and a `Paginated`-cards type**

Append to `library/src/library/models.py`:

```python
class CatalogueCard(BaseModel):
    id: str
    version: str
    entity_type: str
    title: str | None = None
    short_title: str | None = None
    description: str | None = None
    status: str
    effective_license: str | None = None
    language: str | None = None
    available_languages: list[str] | None = None
    item_count: int | None = None
    estimated_minutes: int | None = None
    domain: list[str] = []
    population: list[str] = []

class PaginatedCards(BaseModel):
    items: list[CatalogueCard]
    total: int
    limit: int
    offset: int
```

- [ ] **Step 4: Add `list_cards` to `query.py`**

Append to `library/src/library/query.py`:

```python
_CARD_COLS = ["id", "version", "entity_type", "title", "short_title", "description",
              "status", "effective_license", "language", "available_languages",
              "item_count", "estimated_minutes", "domain", "population"]

def _card_select(extra_where: str) -> str:
    return (
        f"{latest_versions_cte()} "
        "SELECT c.id, c.version, c.entity_type, c.title, c.short_title, c.description, "
        "c.status, c.effective_license, c.language, c.available_languages, "
        "c.item_count, c.estimated_minutes, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='domain'), '{}') AS domain, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='population'), '{}') AS population "
        "FROM catalogue_entry c JOIN latest l ON c.id=l.id AND c.version=l.version "
        f"WHERE {extra_where}"
    )

def list_cards(conn: psycopg.Connection, entity_type: str, *, q: str | None,
               limit: int, offset: int,
               domain: str | None = None, population: str | None = None,
               language: str | None = None, license: str | None = None,
               min_items: int | None = None, max_items: int | None = None,
               sort: str | None = None) -> tuple[list[dict], int]:
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = [entity_type]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)"); params.append(q)
    if domain is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='domain' AND f.value=%s)"); params.append(domain)
    if population is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='population' AND f.value=%s)"); params.append(population)
    if language is not None:
        where.append("c.language=%s"); params.append(language)
    if license is not None:
        where.append("c.effective_license=%s"); params.append(license)
    if min_items is not None:
        where.append("c.item_count >= %s"); params.append(min_items)
    if max_items is not None:
        where.append("c.item_count <= %s"); params.append(max_items)
    sql_where = " AND ".join(where)
    effective_sort = sort or ("relevance" if q else "title")
    if effective_sort == "relevance" and q:
        order_by = "ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) DESC"; order_params: list = [q]
    elif effective_sort == "recency":
        order_by = "c.version DESC NULLS LAST"; order_params = []
    else:
        order_by = "c.title NULLS LAST"; order_params = []
    total = conn.execute(
        f"{latest_versions_cte()} SELECT count(*) FROM catalogue_entry c "
        f"JOIN latest l ON c.id=l.id AND c.version=l.version WHERE {sql_where}", params).fetchone()[0]
    rows = conn.execute(
        f"{_card_select(sql_where)} ORDER BY {order_by} LIMIT %s OFFSET %s",
        params + order_params + [limit, offset]).fetchall()
    return [dict(zip(_CARD_COLS, r)) for r in rows], total
```

- [ ] **Step 5: Use `list_cards` in the questionnaires list route**

In `library/src/library/api/questionnaires.py` change the imports and the list handler:

```python
from ..models import Paginated, EntitySummary, CatalogueCard, PaginatedCards
```
```python
@router.get("/questionnaires", response_model=PaginatedCards)
def list_questionnaires(
    q: str | None = None,
    domain: str | None = None,
    population: str | None = None,
    language: str | None = None,
    license: str | None = None,
    min_items: int | None = None,
    max_items: int | None = None,
    sort: str | None = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    conn=Depends(get_conn),
):
    rows, total = query.list_cards(
        conn, "questionnaire", q=q, limit=limit, offset=offset,
        domain=domain, population=population, language=language, license=license,
        min_items=min_items, max_items=max_items, sort=sort,
    )
    return PaginatedCards(items=[CatalogueCard(**r) for r in rows], total=total, limit=limit, offset=offset)
```

- [ ] **Step 6: Enrich the search route to return cards**

Replace the body of `search` in `library/src/library/api/search.py` so it selects the card columns. Update imports and the handler:

```python
from ..models import PaginatedCards, CatalogueCard
```
```python
@router.get("/search", response_model=PaginatedCards)
def search(q: str, type: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    if type is not None and type not in ENTITY_TYPES:
        raise HTTPException(status_code=422, detail=f"unknown type: {type!r}; must be one of {ENTITY_TYPES}")
    where = ["c.status='published'", "c.search_tsv @@ websearch_to_tsquery('english', %s)"]
    params: list = [q]
    if type:
        where.append("c.entity_type=%s"); params.append(type)
    w = " AND ".join(where)
    total = conn.execute(f"SELECT count(*) FROM catalogue_entry c WHERE {w}", params).fetchone()[0]
    rows = conn.execute(
        "SELECT c.id, c.version, c.entity_type, c.title, c.short_title, c.description, "
        "c.status, c.effective_license, c.language, c.available_languages, "
        "c.item_count, c.estimated_minutes, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='domain'), '{}') AS domain, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='population'), '{}') AS population "
        f"FROM catalogue_entry c WHERE {w} "
        "ORDER BY ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) DESC LIMIT %s OFFSET %s",
        params + [q, limit, offset]).fetchall()
    cols = ["id", "version", "entity_type", "title", "short_title", "description", "status",
            "effective_license", "language", "available_languages", "item_count",
            "estimated_minutes", "domain", "population"]
    items = [CatalogueCard(**dict(zip(cols, r))) for r in rows]
    return PaginatedCards(items=items, total=total, limit=limit, offset=offset)
```

- [ ] **Step 7: Run the tests (new + existing list/search regressions)**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_cards.py library/tests/integration/test_api_questionnaires.py library/tests/integration/test_api_search.py -q`
Expected: PASS (all green — existing list/search tests only assert on `items`/`total` and filters, which still hold).

- [ ] **Step 8: Commit**

```bash
git add library/src/library/models.py library/src/library/query.py library/src/library/api/questionnaires.py library/src/library/api/search.py library/tests/integration/test_api_cards.py
git commit -m "feat(library): enriched CatalogueCard for list + search responses"
```

---

### Task A4: Language + license facets

**Files:**
- Modify: `library/src/library/api/search.py:6,28-35`
- Test: `library/tests/integration/test_api_facets.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_facets.py
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
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

def test_language_facet(client):
    body = client.get("/v1/facets", params={"facet_type": "language"}).json()
    assert body["facet_type"] == "language"
    assert any(v["value"] == "en" and v["count"] >= 1 for v in body["values"])

def test_license_facet_endpoint_ok(client):
    r = client.get("/v1/facets", params={"facet_type": "license"})
    assert r.status_code == 200
    assert r.json()["facet_type"] == "license"

def test_unknown_facet_still_422(client):
    r = client.get("/v1/facets", params={"facet_type": "nope"})
    assert r.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_facets.py -q`
Expected: FAIL — `language`/`license` currently 422.

- [ ] **Step 3: Extend the facets handler**

In `library/src/library/api/search.py` replace the `_VALID_FACET_TYPES` line and the `facets` handler:

```python
_TABLE_FACETS = {"domain", "population", "administration_mode", "tag"}
_COLUMN_FACETS = {"language": "language", "license": "effective_license"}
```
```python
@router.get("/facets")
def facets(facet_type: str, conn=Depends(get_conn)):
    if facet_type in _TABLE_FACETS:
        rows = conn.execute(
            "SELECT value, count(*) FROM facet WHERE facet_type=%s GROUP BY value ORDER BY count(*) DESC",
            (facet_type,)).fetchall()
    elif facet_type in _COLUMN_FACETS:
        col = _COLUMN_FACETS[facet_type]   # fixed allow-list value, not user input -> safe to interpolate
        rows = conn.execute(
            f"SELECT {col}, count(*) FROM catalogue_entry "
            f"WHERE status='published' AND {col} IS NOT NULL GROUP BY {col} ORDER BY count(*) DESC"
        ).fetchall()
    else:
        allowed = sorted(_TABLE_FACETS | set(_COLUMN_FACETS))
        raise HTTPException(status_code=422, detail=f"unknown facet_type: {facet_type!r}; must be one of {allowed}")
    return {"facet_type": facet_type, "values": [{"value": v, "count": c} for v, c in rows]}
```

- [ ] **Step 4: Run tests (new + existing facets)**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_facets.py library/tests/integration/test_api_search.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add library/src/library/api/search.py library/tests/integration/test_api_facets.py
git commit -m "feat(library): language + license facets from catalogue_entry"
```

---

### Task A5: Version history enrichment (severity + date)

**Files:**
- Modify: `library/src/library/models.py`
- Modify: `library/src/library/query.py`
- Modify: `library/src/library/api/questionnaires.py:38-43`
- Test: `library/tests/integration/test_api_versions.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_versions.py
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
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

def test_versions_carry_status_and_date(client):
    vs = client.get("/v1/questionnaires/qst_min/versions").json()
    assert len(vs) >= 1
    v = vs[0]
    assert v["version"] == "v26.0601"
    assert v["status"] == "published"
    assert "severity" in v          # may be null
    assert v["date"] is not None    # ISO date from ingested_at

def test_versions_unknown_404(client):
    assert client.get("/v1/questionnaires/qst_nope/versions").status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_versions.py -q`
Expected: FAIL — response items have no `date`/`severity`/`status` shape (currently `EntitySummary`).

- [ ] **Step 3: Add `VersionInfo` model**

Append to `library/src/library/models.py`:

```python
class VersionInfo(BaseModel):
    id: str
    version: str
    status: str
    severity: str | None = None
    date: str | None = None
```

- [ ] **Step 4: Add `get_version_history` to `query.py`**

Append to `library/src/library/query.py`:

```python
def get_version_history(conn: psycopg.Connection, entity_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT c.id, c.version, c.status, e.severity, e.ingested_at "
        "FROM catalogue_entry c JOIN entity e ON e.id=c.id AND e.version=c.version "
        "WHERE c.id=%s ORDER BY c.version DESC", (entity_id,)).fetchall()
    return [{"id": r[0], "version": r[1], "status": r[2], "severity": r[3],
             "date": r[4].date().isoformat() if r[4] else None} for r in rows]
```

- [ ] **Step 5: Update the versions route**

In `library/src/library/api/questionnaires.py` add `VersionInfo` to the models import and replace the `versions` handler:

```python
from ..models import Paginated, EntitySummary, CatalogueCard, PaginatedCards, VersionInfo
```
```python
@router.get("/questionnaires/{qid}/versions", response_model=list[VersionInfo])
def versions(qid: str, conn=Depends(get_conn)):
    vs = query.get_version_history(conn, qid)
    if not vs:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return [VersionInfo(**v) for v in vs]
```

- [ ] **Step 6: Run tests (new + regression on the questionnaires suite)**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_versions.py library/tests/integration/test_api_questionnaires.py -q`
Expected: PASS (the existing `test_detail_and_versions` only checks status 200 + len ≥ 1).

- [ ] **Step 7: Commit**

```bash
git add library/src/library/models.py library/src/library/query.py library/src/library/api/questionnaires.py library/tests/integration/test_api_versions.py
git commit -m "feat(library): version history carries status, severity, date"
```

---

### Task A6: Full Core suite green + capture OpenAPI

**Files:**
- Create: `library-web/openapi.snapshot.json` (generated artifact, committed for reference/codegen)

- [ ] **Step 1: Run the entire library suite**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q`
Expected: PASS — the prior ~86 plus the new CORS/resolved/cards/facets/versions tests, zero failures.

- [ ] **Step 2: Dump the OpenAPI document to a snapshot**

```bash
mkdir -p library-web
source .venv/bin/activate
python - <<'PY'
import json
from library.api.app import create_app
open("library-web/openapi.snapshot.json", "w").write(json.dumps(create_app().openapi(), indent=2))
print("wrote library-web/openapi.snapshot.json")
PY
```

- [ ] **Step 3: Commit**

```bash
git add library-web/openapi.snapshot.json
git commit -m "chore(library-web): snapshot OpenAPI after Core additions"
```

---

## Phase B — Frontend scaffold (`library-web/`)

### Task B1: Scaffold Vite + React + TS + Tailwind + Vitest

**Files:**
- Create: `library-web/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.env.example`, `.gitignore`, `src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/vitest.setup.ts`, `src/smoke.test.ts`

- [ ] **Step 1: Create the project files**

`library-web/package.json`:
```json
{
  "name": "questionnaire-library-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173",
    "test": "vitest run",
    "test:watch": "vitest",
    "codegen": "openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@tanstack/react-query": "^5.62.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "openapi-typescript": "^7.4.4",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

`library-web/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
```

`library-web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`library-web/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`library-web/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { accent: { DEFAULT: '#2563eb', fg: '#1e3a8a' } },
    },
  },
  plugins: [],
} satisfies Config
```

`library-web/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`library-web/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Questionnaire Library</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`library-web/.env.example`:
```
VITE_API_BASE_URL=http://localhost:8000
```

`library-web/.gitignore`:
```
node_modules
dist
.env
test-results
playwright-report
```

`library-web/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`library-web/src/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

`library-web/src/App.tsx`:
```tsx
export default function App() {
  return <div className="p-8 text-slate-800">Questionnaire Library</div>
}
```

`library-web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`library-web/src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Install dependencies**

Run (from `library-web/`): `npm install`
Expected: dependencies install, `node_modules/` created.

- [ ] **Step 3: Run the smoke test to verify the toolchain**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`
Expected: `tsc -b` clean + Vite writes `dist/`.

- [ ] **Step 5: Commit**

```bash
git add library-web/
git commit -m "chore(library-web): scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task B2: Typed API client + response types

**Files:**
- Create: `library-web/src/api/types.ts`, `library-web/src/api/client.ts`
- Test: `library-web/src/api/client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// library-web/src/api/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError, rawDefinitionUrl } from './client'

beforeEach(() => { vi.restoreAllMocks() })

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'x',
    json: async () => body,
  } as Response)
}

describe('api client', () => {
  it('builds query params and returns json', async () => {
    const f = mockFetch(200, { items: [], total: 0, limit: 20, offset: 0 })
    vi.stubGlobal('fetch', f)
    const res = await api.listQuestionnaires({ q: 'phq', domain: 'depression' })
    expect(res.total).toBe(0)
    const calledUrl = (f.mock.calls[0][0] as URL).toString()
    expect(calledUrl).toContain('/v1/questionnaires')
    expect(calledUrl).toContain('q=phq')
    expect(calledUrl).toContain('domain=depression')
  })

  it('throws ApiError carrying the envelope code on non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetch(410, { error: { code: 'gone', message: 'withdrawn' } }))
    await expect(api.resolvedDefinition('qst_x', 'v26.0601')).rejects.toMatchObject({
      status: 410, code: 'gone',
    })
  })

  it('rawDefinitionUrl points at the unresolved definition', () => {
    expect(rawDefinitionUrl('qst_x', 'v26.0601')).toContain('/v1/questionnaires/qst_x/versions/v26.0601/definition')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- client`
Expected: FAIL — `./client` does not exist.

- [ ] **Step 3: Write the response types**

```ts
// library-web/src/api/types.ts
export interface CatalogueCard {
  id: string
  version: string
  entity_type: string
  title: string | null
  short_title: string | null
  description: string | null
  status: string
  effective_license: string | null
  language: string | null
  available_languages: string[] | null
  item_count: number | null
  estimated_minutes: number | null
  domain: string[]
  population: string[]
}

export interface Paginated<T> { items: T[]; total: number; limit: number; offset: number }

export interface VersionInfo {
  id: string
  version: string
  status: string
  severity: string | null
  date: string | null
}

export interface FacetValue { value: string; count: number }
export interface FacetResponse { facet_type: string; values: FacetValue[] }

// Resolved Schema-2 definition (only the fields the UI reads; unknown keys allowed).
export interface LangContent {
  status?: string
  text?: string
  label?: string
  options?: { index: number; text?: string; units?: string }[]
  [k: string]: unknown
}
export interface ResolvedPrompt {
  ref?: string
  _unresolved?: boolean
  name?: string
  dimension?: string
  reversed?: boolean
  subscales?: string[]
  content?: Record<string, LangContent>
}
export interface ResolvedOption {
  ref?: string
  _unresolved?: boolean
  input_data_type?: string
  measurement_type?: string
  selection?: string
  options?: { index: number; value?: number }[]
  content?: Record<string, LangContent>
}
export interface ResolvedMessage {
  ref?: string
  _unresolved?: boolean
  type?: string[]
  content?: Record<string, LangContent>
}
export interface ResolvedQuestion {
  ref?: string
  prompt?: ResolvedPrompt
  context?: { content?: Record<string, LangContent> }
  instruction?: { content?: Record<string, LangContent> }
}
export interface DefElement {
  // one of: message ref | item (question+option) | section (nested elements + shared_option)
  ref?: string
  _unresolved?: boolean
  content?: Record<string, LangContent>   // message
  question?: ResolvedQuestion
  option?: ResolvedOption
  required?: boolean
  id?: string
  shared_option?: ResolvedOption
  elements?: DefElement[]
  style?: { layout?: string }
}
export interface DefPage { id?: string; title?: string; elements?: DefElement[] }
export interface ScoreDecl { id: string; scorer: string; path: string; name?: string }
export interface DefAuthor { name: string }
export interface DefMetadata {
  id: string
  title: string
  short_title?: string
  description?: string
  version: string
  language?: string
  available_languages?: string[]
  authors?: DefAuthor[]
  publication?: { year?: number; citation?: string; doi?: string }
  license?: string
  rights_holder?: string
  classification?: {
    domain?: string[]; population?: string[]; age_range?: number[]; administration_mode?: string[]
  }
  psychometrics?: { item_count?: number; estimated_minutes?: number; reliability?: unknown[] }
}
export interface ResolvedDefinition {
  metadata: DefMetadata
  pages?: DefPage[]
  scores?: ScoreDecl[]
}
```

- [ ] **Step 4: Write the client**

```ts
// library-web/src/api/client.ts
import type {
  CatalogueCard, Paginated, VersionInfo, FacetResponse, ResolvedDefinition,
} from './types'

export const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type Params = Record<string, string | number | boolean | undefined | null>

async function get<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(BASE_URL + path)
  if (params) for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url)
  if (!res.ok) {
    let code = 'error'
    let message = res.statusText
    try {
      const body = await res.json()
      code = body?.error?.code ?? code
      message = body?.error?.message ?? message
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, code, message)
  }
  return (await res.json()) as T
}

export type QuestionnaireQuery = {
  q?: string; domain?: string; population?: string; language?: string; license?: string
  min_items?: number; max_items?: number; sort?: string; limit?: number; offset?: number
}

export function rawDefinitionUrl(id: string, version: string): string {
  return `${BASE_URL}/v1/questionnaires/${id}/versions/${version}/definition`
}

export const api = {
  listQuestionnaires: (p: QuestionnaireQuery) =>
    get<Paginated<CatalogueCard>>('/v1/questionnaires', p),
  search: (p: { q: string; limit?: number; offset?: number }) =>
    get<Paginated<CatalogueCard>>('/v1/search', p),
  resolvedDefinition: (id: string, version: string) =>
    get<ResolvedDefinition>(`/v1/questionnaires/${id}/versions/${version}/definition`, { resolved: true }),
  versions: (id: string) =>
    get<VersionInfo[]>(`/v1/questionnaires/${id}/versions`),
  facets: (facet_type: string) =>
    get<FacetResponse>('/v1/facets', { facet_type }),
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- client`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add library-web/src/api/
git commit -m "feat(library-web): typed fetch API client + response types"
```

---

### Task B3: App shell, router, query provider

**Files:**
- Create: `library-web/src/shell/Header.tsx`, `library-web/src/shell/Footer.tsx`, `library-web/src/components/ErrorBoundary.tsx`
- Modify: `library-web/src/App.tsx`, `library-web/src/main.tsx`
- Create: `library-web/src/routes/CataloguePage.tsx`, `library-web/src/routes/DetailPage.tsx`, `library-web/src/routes/NotFoundPage.tsx` (placeholder bodies; filled in later phases)
- Test: `library-web/src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// library-web/src/App.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderAt(path: string) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App shell', () => {
  it('renders the header wordmark on the catalogue route', () => {
    renderAt('/')
    expect(screen.getByRole('banner')).toHaveTextContent(/Questionnaire Library/i)
  })

  it('renders a not-found page for unknown routes', () => {
    renderAt('/totally/unknown')
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL — `App` has no router/header.

- [ ] **Step 3: Create the shell + placeholder routes**

`library-web/src/shell/Header.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { BASE_URL } from '../api/client'

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Questionnaire Library
        </Link>
        <a className="text-sm text-accent hover:underline" href={`${BASE_URL}/docs`} target="_blank" rel="noreferrer">
          API docs
        </a>
      </div>
    </header>
  )
}
```

`library-web/src/shell/Footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500">
        Behaverse Questionnaire Library — read-only catalogue.
      </div>
    </footer>
  )
}
```

`library-web/src/components/ErrorBoundary.tsx`:
```tsx
import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-slate-600">{this.state.error.message}</p>
          <button className="mt-4 rounded bg-accent px-4 py-2 text-white" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

`library-web/src/routes/NotFoundPage.tsx`:
```tsx
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl p-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
      <p className="mt-2 text-slate-600">That page or questionnaire does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-accent hover:underline">Back to the catalogue</Link>
    </div>
  )
}
```

`library-web/src/routes/CataloguePage.tsx` (placeholder, filled in Phase C):
```tsx
export function CataloguePage() {
  return <main className="mx-auto max-w-6xl px-6 py-8">Catalogue</main>
}
```

`library-web/src/routes/DetailPage.tsx` (placeholder, filled in Phase D):
```tsx
export function DetailPage() {
  return <main className="mx-auto max-w-6xl px-6 py-8">Detail</main>
}
```

- [ ] **Step 4: Wire `App.tsx` routes + shell**

`library-web/src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import { Header } from './shell/Header'
import { Footer } from './shell/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CataloguePage } from './routes/CataloguePage'
import { DetailPage } from './routes/DetailPage'
import { NotFoundPage } from './routes/NotFoundPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<CataloguePage />} />
            <Route path="/q/:id" element={<DetailPage />} />
            <Route path="/q/:id/:version" element={<DetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5: Wire providers in `main.tsx`**

`library-web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- App`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add library-web/src/
git commit -m "feat(library-web): app shell, router, query provider, error boundary"
```

---

## Phase C — Catalogue page

### Task C1: URL-synced catalogue params hook

**Files:**
- Create: `library-web/src/catalogue/useCatalogueParams.ts`
- Test: `library-web/src/catalogue/useCatalogueParams.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// library-web/src/catalogue/useCatalogueParams.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useCatalogueParams } from './useCatalogueParams'

const wrapper =
  (initial: string) =>
  ({ children }: { children: React.ReactNode }) =>
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>

describe('useCatalogueParams', () => {
  it('reads params from the URL query string', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?q=phq&domain=depression&sort=recency&page=2'),
    })
    expect(result.current.params).toMatchObject({
      q: 'phq', domain: 'depression', sort: 'recency', page: 2,
    })
    expect(result.current.offset).toBe(20) // (page 2 - 1) * limit 20
  })

  it('setParam writes to the URL and resets page to 1', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?page=3'),
    })
    act(() => result.current.setParam('q', 'anxiety'))
    expect(result.current.params.q).toBe('anxiety')
    expect(result.current.params.page).toBe(1)
  })

  it('toggleFacet adds then removes a facet value', () => {
    const { result } = renderHook(() => useCatalogueParams(), { wrapper: wrapper('/') })
    act(() => result.current.toggleFacet('domain', 'depression'))
    expect(result.current.params.domain).toBe('depression')
    act(() => result.current.toggleFacet('domain', 'depression'))
    expect(result.current.params.domain).toBeUndefined()
  })

  it('clearAll resets everything', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?q=x&domain=y&page=4'),
    })
    act(() => result.current.clearAll())
    expect(result.current.params).toMatchObject({ page: 1 })
    expect(result.current.params.q).toBeUndefined()
    expect(result.current.params.domain).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useCatalogueParams`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the hook**

```ts
// library-web/src/catalogue/useCatalogueParams.ts
import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export const LIMIT = 20

export type FacetKey = 'domain' | 'population' | 'language' | 'license'
export type ScalarKey = 'q' | 'sort'

export interface CatalogueParams {
  q?: string
  domain?: string
  population?: string
  language?: string
  license?: string
  sort?: string
  page: number
}

function read(sp: URLSearchParams): CatalogueParams {
  const page = Number(sp.get('page') ?? '1')
  return {
    q: sp.get('q') || undefined,
    domain: sp.get('domain') || undefined,
    population: sp.get('population') || undefined,
    language: sp.get('language') || undefined,
    license: sp.get('license') || undefined,
    sort: sp.get('sort') || undefined,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  }
}

export function useCatalogueParams() {
  const [sp, setSp] = useSearchParams()
  const params = useMemo(() => read(sp), [sp])

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(sp)
      mutate(next)
      setSp(next, { replace: false })
    },
    [sp, setSp],
  )

  const setParam = useCallback(
    (key: ScalarKey | FacetKey, value: string | undefined) =>
      write((next) => {
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete('page') // any filter/search change returns to page 1
      }),
    [write],
  )

  const toggleFacet = useCallback(
    (key: FacetKey, value: string) =>
      write((next) => {
        if (next.get(key) === value) next.delete(key)
        else next.set(key, value)
        next.delete('page')
      }),
    [write],
  )

  const setPage = useCallback(
    (page: number) => write((next) => next.set('page', String(page))),
    [write],
  )

  const clearAll = useCallback(() => setSp(new URLSearchParams(), { replace: false }), [setSp])

  return {
    params,
    offset: (params.page - 1) * LIMIT,
    limit: LIMIT,
    setParam,
    toggleFacet,
    setPage,
    clearAll,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useCatalogueParams`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/catalogue/useCatalogueParams.ts library-web/src/catalogue/useCatalogueParams.test.tsx
git commit -m "feat(library-web): URL-synced catalogue params hook"
```

---

### Task C2: Presentational catalogue components

**Files:**
- Create: `library-web/src/components/Badge.tsx`, `library-web/src/components/Skeleton.tsx`, `library-web/src/components/EmptyState.tsx`, `library-web/src/components/ErrorState.tsx`
- Create: `library-web/src/lib/labels.ts`
- Create: `library-web/src/catalogue/ResultRow.tsx`, `library-web/src/catalogue/FacetSidebar.tsx`, `library-web/src/catalogue/Pagination.tsx`
- Test: `library-web/src/lib/labels.test.ts`, `library-web/src/catalogue/ResultRow.test.tsx`, `library-web/src/catalogue/FacetSidebar.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// library-web/src/lib/labels.test.ts
import { describe, it, expect } from 'vitest'
import { licenseLabel, languageLabel } from './labels'

describe('labels', () => {
  it('humanises known license tags', () => {
    expect(licenseLabel('cc_by')).toBe('CC BY')
    expect(licenseLabel('public_domain')).toBe('Public domain')
  })
  it('falls back to the raw tag when unknown', () => {
    expect(licenseLabel('weird_tag')).toBe('weird_tag')
  })
  it('humanises ISO language codes', () => {
    expect(languageLabel('en')).toBe('English')
    expect(languageLabel('pt')).toBe('Portuguese')
    expect(languageLabel('zz')).toBe('zz')
  })
})
```

```tsx
// library-web/src/catalogue/ResultRow.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResultRow } from './ResultRow'
import type { CatalogueCard } from '../api/types'

const card: CatalogueCard = {
  id: 'qst_phq9', version: 'v26.0602', entity_type: 'questionnaire',
  title: 'Patient Health Questionnaire-9', short_title: 'PHQ-9',
  description: 'Self-report depression severity.', status: 'published',
  effective_license: 'cc_by', language: 'en', available_languages: ['en', 'pt'],
  item_count: 9, estimated_minutes: 5, domain: ['depression'], population: ['adults'],
}

describe('ResultRow', () => {
  it('renders title, item count, language and license, linking to the detail route', () => {
    render(<MemoryRouter><ResultRow card={card} /></MemoryRouter>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/q/qst_phq9')
    expect(screen.getByText(/Patient Health Questionnaire-9/)).toBeInTheDocument()
    expect(screen.getByText(/9 items/)).toBeInTheDocument()
    expect(screen.getByText(/CC BY/)).toBeInTheDocument()
    expect(screen.getByText(/depression/)).toBeInTheDocument()
  })
})
```

```tsx
// library-web/src/catalogue/FacetSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FacetSidebar } from './FacetSidebar'

describe('FacetSidebar', () => {
  it('renders facet groups and calls onToggle when a value is clicked', async () => {
    const onToggle = vi.fn()
    render(
      <FacetSidebar
        groups={[{ key: 'domain', title: 'Domain', values: [{ value: 'depression', count: 3 }] }]}
        selected={{ domain: undefined, population: undefined, language: undefined, license: undefined }}
        onToggle={onToggle}
        onClear={() => {}}
      />,
    )
    expect(screen.getByText('Domain')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/depression/))
    expect(onToggle).toHaveBeenCalledWith('domain', 'depression')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- labels ResultRow FacetSidebar`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement labels + shared components**

`library-web/src/lib/labels.ts`:
```ts
const LICENSE_LABELS: Record<string, string> = {
  public_domain: 'Public domain',
  cc0: 'CC0',
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
  cc_by_nc: 'CC BY-NC',
  proprietary_open_redistribution: 'Proprietary (open redistribution)',
  proprietary_restricted: 'Proprietary (restricted)',
  mixed_see_components: 'Mixed (see components)',
  unknown: 'Unknown',
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', fr: 'French', de: 'German', lb: 'Luxembourgish',
  pt: 'Portuguese', es: 'Spanish', it: 'Italian',
}

export const licenseLabel = (tag: string | null | undefined): string =>
  tag ? (LICENSE_LABELS[tag] ?? tag) : '—'

export const languageLabel = (code: string | null | undefined): string =>
  code ? (LANGUAGE_LABELS[code] ?? code) : '—'
```

`library-web/src/components/Badge.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    accent: 'bg-blue-50 text-accent-fg',
    warn: 'bg-amber-100 text-amber-800',
  }
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}
```

`library-web/src/components/Skeleton.tsx`:
```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}
```

`library-web/src/components/EmptyState.tsx`:
```tsx
export function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-600">
      <p>{message}</p>
      {actionLabel && onAction && (
        <button className="mt-3 text-accent hover:underline" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
```

`library-web/src/components/ErrorState.tsx`:
```tsx
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
      <p>{message}</p>
      {onRetry && <button className="mt-3 rounded bg-red-600 px-3 py-1.5 text-white" onClick={onRetry}>Retry</button>}
    </div>
  )
}
```

- [ ] **Step 4: Implement ResultRow, FacetSidebar, Pagination**

`library-web/src/catalogue/ResultRow.tsx`:
```tsx
import { Link } from 'react-router-dom'
import type { CatalogueCard } from '../api/types'
import { Badge } from '../components/Badge'
import { licenseLabel, languageLabel } from '../lib/labels'

export function ResultRow({ card }: { card: CatalogueCard }) {
  const meta: string[] = []
  if (card.item_count != null) meta.push(`${card.item_count} items`)
  if (card.estimated_minutes != null) meta.push(`~${card.estimated_minutes} min`)
  if (card.language) meta.push(languageLabel(card.language))
  return (
    <article className="border-b border-slate-200 py-5">
      <Link to={`/q/${card.id}`} className="text-lg font-medium text-slate-900 hover:text-accent">
        {card.title ?? card.id}
        {card.short_title && card.short_title !== card.title && (
          <span className="ml-2 text-sm font-normal text-slate-500">({card.short_title})</span>
        )}
      </Link>
      {card.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{card.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {meta.length > 0 && <span>{meta.join(' · ')}</span>}
        {card.effective_license && <Badge>{licenseLabel(card.effective_license)}</Badge>}
        {card.domain.map((d) => <Badge key={d} tone="accent">{d}</Badge>)}
        {card.population.map((p) => <Badge key={p}>{p}</Badge>)}
      </div>
    </article>
  )
}
```

`library-web/src/catalogue/FacetSidebar.tsx`:
```tsx
import type { FacetKey } from './useCatalogueParams'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface FacetGroup {
  key: FacetKey
  title: string
  values: { value: string; count: number }[]
}

export interface FacetSidebarProps {
  groups: FacetGroup[]
  selected: Record<FacetKey, string | undefined>
  onToggle: (key: FacetKey, value: string) => void
  onClear: () => void
}

function display(key: FacetKey, value: string): string {
  if (key === 'license') return licenseLabel(value)
  if (key === 'language') return languageLabel(value)
  return value
}

export function FacetSidebar({ groups, selected, onToggle, onClear }: FacetSidebarProps) {
  const anySelected = Object.values(selected).some(Boolean)
  return (
    <aside className="w-60 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
        {anySelected && <button className="text-xs text-accent hover:underline" onClick={onClear}>Clear</button>}
      </div>
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h3>
          <ul className="space-y-1">
            {g.values.map((v) => (
              <li key={v.value}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={selected[g.key] === v.value}
                    onChange={() => onToggle(g.key, v.value)}
                  />
                  <span className="flex-1">{display(g.key, v.value)}</span>
                  <span className="text-xs text-slate-400">{v.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
```

`library-web/src/catalogue/Pagination.tsx`:
```tsx
export function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  return (
    <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
      <button className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-slate-600">Page {page} of {pages}</span>
      <button className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- labels ResultRow FacetSidebar`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add library-web/src/components/ library-web/src/lib/ library-web/src/catalogue/
git commit -m "feat(library-web): catalogue presentational components + labels"
```

---

### Task C3: Catalogue page container (data + states)

**Files:**
- Create: `library-web/src/api/queries.ts`, `library-web/src/catalogue/SearchBar.tsx`, `library-web/src/catalogue/SortSelect.tsx`
- Modify: `library-web/src/routes/CataloguePage.tsx`
- Test: `library-web/src/routes/CataloguePage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// library-web/src/routes/CataloguePage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CataloguePage } from './CataloguePage'
import { api } from '../api/client'

vi.mock('../api/client', async (orig) => {
  const real = await orig<typeof import('../api/client')>()
  return { ...real, api: { ...real.api, listQuestionnaires: vi.fn(), facets: vi.fn() } }
})

const card = {
  id: 'qst_phq9', version: 'v26.0602', entity_type: 'questionnaire',
  title: 'PHQ-9', short_title: null, description: 'Depression.', status: 'published',
  effective_license: 'cc_by', language: 'en', available_languages: ['en'],
  item_count: 9, estimated_minutes: 5, domain: ['depression'], population: ['adults'],
}

function setup(path = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <CataloguePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.mocked(api.facets).mockResolvedValue({ facet_type: 'domain', values: [{ value: 'depression', count: 1 }] })
})

describe('CataloguePage', () => {
  it('renders results from the API', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [card], total: 1, limit: 20, offset: 0 })
    setup()
    await waitFor(() => expect(screen.getByText('PHQ-9')).toBeInTheDocument())
  })

  it('shows the empty state when there are no results', async () => {
    vi.mocked(api.listQuestionnaires).mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 })
    setup()
    await waitFor(() => expect(screen.getByText(/No questionnaires match/i)).toBeInTheDocument())
  })

  it('shows an error state when the list query fails', async () => {
    vi.mocked(api.listQuestionnaires).mockRejectedValue(new Error('boom'))
    setup()
    await waitFor(() => expect(screen.getByText(/Retry/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CataloguePage`
Expected: FAIL — `queries.ts`/`SearchBar`/`SortSelect` missing and page is a placeholder.

- [ ] **Step 3: Implement query hooks**

`library-web/src/api/queries.ts`:
```ts
import { useQuery } from '@tanstack/react-query'
import { api, type QuestionnaireQuery } from './client'

export const useQuestionnaires = (q: QuestionnaireQuery) =>
  useQuery({ queryKey: ['questionnaires', q], queryFn: () => api.listQuestionnaires(q) })

export const useFacets = (facetType: string) =>
  useQuery({ queryKey: ['facets', facetType], queryFn: () => api.facets(facetType) })

export const useResolvedDefinition = (id: string, version: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['definition', id, version],
    queryFn: () => api.resolvedDefinition(id, version!),
    enabled: enabled && !!version,
  })

export const useVersions = (id: string) =>
  useQuery({ queryKey: ['versions', id], queryFn: () => api.versions(id) })
```

- [ ] **Step 4: Implement SearchBar + SortSelect**

`library-web/src/catalogue/SearchBar.tsx`:
```tsx
import { useEffect, useState } from 'react'

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    const id = setTimeout(() => { if (text !== value) onChange(text) }, 300)
    return () => clearTimeout(id)
  }, [text, value, onChange])
  return (
    <input
      type="search"
      aria-label="Search questionnaires"
      placeholder="Search questionnaires…"
      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  )
}
```

`library-web/src/catalogue/SortSelect.tsx`:
```tsx
const OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'title', label: 'Title' },
  { value: 'recency', label: 'Recency' },
]

export function SortSelect({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  return (
    <select
      aria-label="Sort results"
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
```

- [ ] **Step 5: Implement the CataloguePage container**

`library-web/src/routes/CataloguePage.tsx`:
```tsx
import { useCatalogueParams, type FacetKey } from '../catalogue/useCatalogueParams'
import { useQuestionnaires, useFacets } from '../api/queries'
import { ResultRow } from '../catalogue/ResultRow'
import { FacetSidebar, type FacetGroup } from '../catalogue/FacetSidebar'
import { SearchBar } from '../catalogue/SearchBar'
import { SortSelect } from '../catalogue/SortSelect'
import { Pagination } from '../catalogue/Pagination'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'

const FACET_DEFS: { key: FacetKey; title: string }[] = [
  { key: 'domain', title: 'Domain' },
  { key: 'population', title: 'Population' },
  { key: 'language', title: 'Language' },
  { key: 'license', title: 'License' },
]

export function CataloguePage() {
  const { params, offset, limit, setParam, toggleFacet, setPage, clearAll } = useCatalogueParams()
  const list = useQuestionnaires({
    q: params.q, domain: params.domain, population: params.population,
    language: params.language, license: params.license, sort: params.sort,
    limit, offset,
  })

  const domain = useFacets('domain')
  const population = useFacets('population')
  const language = useFacets('language')
  const license = useFacets('license')
  const facetData: Record<FacetKey, { value: string; count: number }[]> = {
    domain: domain.data?.values ?? [],
    population: population.data?.values ?? [],
    language: language.data?.values ?? [],
    license: license.data?.values ?? [],
  }
  const groups: FacetGroup[] = FACET_DEFS
    .map((d) => ({ key: d.key, title: d.title, values: facetData[d.key] }))
    .filter((g) => g.values.length > 0)

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1"><SearchBar value={params.q ?? ''} onChange={(v) => setParam('q', v || undefined)} /></div>
        <SortSelect value={params.sort} onChange={(v) => setParam('sort', v)} />
      </div>
      <div className="flex gap-8">
        <FacetSidebar
          groups={groups}
          selected={{ domain: params.domain, population: params.population, language: params.language, license: params.license }}
          onToggle={toggleFacet}
          onClear={clearAll}
        />
        <section className="min-w-0 flex-1">
          {list.isLoading && (
            <div className="space-y-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          )}
          {list.isError && <ErrorState message="Could not load questionnaires." onRetry={() => list.refetch()} />}
          {list.isSuccess && list.data.total === 0 && (
            <EmptyState message="No questionnaires match these filters." actionLabel="Clear filters" onAction={clearAll} />
          )}
          {list.isSuccess && list.data.total > 0 && (
            <>
              <p className="mb-2 text-sm text-slate-500">{list.data.total} result{list.data.total === 1 ? '' : 's'}</p>
              <div>{list.data.items.map((c) => <ResultRow key={`${c.id}@${c.version}`} card={c} />)}</div>
              <Pagination page={params.page} total={list.data.total} limit={limit} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- CataloguePage`
Expected: PASS (3 tests).

- [ ] **Step 7: Run the full frontend suite + typecheck**

Run: `npm test && npm run build`
Expected: all tests PASS; build compiles.

- [ ] **Step 8: Commit**

```bash
git add library-web/src/
git commit -m "feat(library-web): catalogue page container with data, facets, states"
```

---

## Phase D — Detail page

### Task D1: Definition render model

**Files:**
- Create: `library-web/src/definition/renderModel.ts`
- Test: `library-web/src/definition/renderModel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// library-web/src/definition/renderModel.test.ts
import { describe, it, expect } from 'vitest'
import { buildRenderModel } from './renderModel'
import type { ResolvedDefinition } from '../api/types'

const def: ResolvedDefinition = {
  metadata: { id: 'qst_x', title: 'X', version: 'v26.0601', language: 'en', available_languages: ['en', 'pt'] },
  pages: [
    {
      id: 'p1', title: 'Page one',
      elements: [
        { content: { en: { text: 'Welcome' }, pt: { text: 'Bem-vindo' } } }, // message
        {
          question: { prompt: { ref: 'pr_1@v', content: { en: { text: 'How are you?' }, pt: { text: 'Como está?' } } } },
          option: {
            content: { en: { label: 'Mood', options: [{ index: 1, text: 'Bad' }, { index: 2, text: 'Good' }] } },
            options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
          },
          required: true,
        },
        {
          id: 'sec1',
          shared_option: { content: { en: { options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } } },
          elements: [
            { question: { prompt: { ref: 'pr_2@v', content: { en: { text: 'Item A' } } } } },
            { question: { prompt: { ref: 'pr_3@v', _unresolved: true } } },
          ],
        },
      ],
    },
  ],
}

describe('buildRenderModel', () => {
  it('flattens messages, items and matrix sections, numbering items continuously', () => {
    const model = buildRenderModel(def, 'en')
    expect(model.pages).toHaveLength(1)
    const blocks = model.pages[0].blocks
    expect(blocks[0]).toMatchObject({ kind: 'message', text: 'Welcome' })
    expect(blocks[1]).toMatchObject({ kind: 'item', number: 1, stem: 'How are you?', required: true })
    expect((blocks[1] as any).options.map((o: any) => o.text)).toEqual(['Bad', 'Good'])
    const section = blocks[2] as any
    expect(section.kind).toBe('section')
    expect(section.items[0]).toMatchObject({ number: 2, stem: 'Item A' })
    expect(section.sharedOptions.map((o: any) => o.text)).toEqual(['No', 'Yes'])
  })

  it('marks unresolved prompts so the UI can show a fallback', () => {
    const model = buildRenderModel(def, 'en')
    const section = model.pages[0].blocks[2] as any
    expect(section.items[1].unresolved).toBe(true)
  })

  it('falls back to the primary language text when the requested language is missing', () => {
    const model = buildRenderModel(def, 'pt')
    const item = model.pages[0].blocks[1] as any
    expect(item.stem).toBe('Como está?')           // pt present
    const section = model.pages[0].blocks[2] as any
    expect(section.items[0].stem).toBe('Item A')    // pt missing -> falls back to en
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- renderModel`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the render model**

```ts
// library-web/src/definition/renderModel.ts
import type {
  ResolvedDefinition, DefElement, DefPage, ResolvedOption, LangContent,
} from '../api/types'

export interface OptionChoice { index: number; text: string; value?: number }
export interface ItemBlock {
  kind: 'item'
  number: number
  stem: string
  context?: string
  instruction?: string
  required: boolean
  options: OptionChoice[]
  dimension?: string
  reversed?: boolean
  subscales?: string[]
  unresolved: boolean
}
export interface MessageBlock { kind: 'message'; text: string; unresolved: boolean }
export interface SectionBlock { kind: 'section'; id?: string; sharedOptions: OptionChoice[]; items: ItemBlock[] }
export type Block = ItemBlock | MessageBlock | SectionBlock
export interface RenderPage { id?: string; title?: string; blocks: Block[] }
export interface RenderModel { pages: RenderPage[] }

function pick(content: Record<string, LangContent> | undefined, lang: string, primary: string): LangContent | undefined {
  if (!content) return undefined
  return content[lang] ?? content[primary] ?? content[Object.keys(content)[0]]
}

function optionsOf(option: ResolvedOption | undefined, lang: string, primary: string): OptionChoice[] {
  const c = pick(option?.content, lang, primary)
  if (!c?.options) return []
  return c.options.map((o) => ({
    index: o.index,
    text: o.text ?? '',
    value: option?.options?.find((v) => v.index === o.index)?.value,
  }))
}

export function buildRenderModel(def: ResolvedDefinition, lang: string): RenderModel {
  const primary = def.metadata.language ?? 'en'
  let counter = 0

  function item(el: DefElement, sharedOption?: ResolvedOption): ItemBlock {
    counter += 1
    const prompt = el.question?.prompt
    const stemC = pick(prompt?.content, lang, primary)
    const option = el.option ?? sharedOption
    return {
      kind: 'item',
      number: counter,
      stem: stemC?.text ?? '',
      context: pick(el.question?.context?.content, lang, primary)?.text,
      instruction: pick(el.question?.instruction?.content, lang, primary)?.text,
      required: el.required ?? false,
      options: optionsOf(option, lang, primary),
      dimension: prompt?.dimension,
      reversed: prompt?.reversed,
      subscales: prompt?.subscales,
      unresolved: prompt?._unresolved === true,
    }
  }

  function block(el: DefElement): Block {
    if (el.elements && (el.shared_option || el.id)) {
      // Section (matrix): shared option once, child items beneath
      return {
        kind: 'section',
        id: el.id,
        sharedOptions: optionsOf(el.shared_option, lang, primary),
        items: el.elements.map((child) => item(child, el.shared_option)),
      }
    }
    if (el.question) return item(el)
    // message (has content, no question)
    const c = pick(el.content, lang, primary)
    return { kind: 'message', text: c?.text ?? '', unresolved: el._unresolved === true }
  }

  const pages: RenderPage[] = (def.pages ?? []).map((p: DefPage) => ({
    id: p.id,
    title: p.title,
    blocks: (p.elements ?? []).map(block),
  }))
  return { pages }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- renderModel`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/definition/
git commit -m "feat(library-web): resolved-definition render model"
```

---

### Task D2: Download helper

**Files:**
- Create: `library-web/src/lib/download.ts`
- Test: `library-web/src/lib/download.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// library-web/src/lib/download.test.ts
import { describe, it, expect } from 'vitest'
import { definitionFilename } from './download'

describe('definitionFilename', () => {
  it('names the file by id and version', () => {
    expect(definitionFilename('qst_phq9', 'v26.0602')).toBe('qst_phq9@v26.0602.json')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- download`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the helper**

```ts
// library-web/src/lib/download.ts
export const definitionFilename = (id: string, version: string): string => `${id}@${version}.json`

/** Trigger a browser download of a URL under a chosen filename. */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- download`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add library-web/src/lib/download.ts library-web/src/lib/download.test.ts
git commit -m "feat(library-web): canonical-definition download helper"
```

---

### Task D3: Detail presentational blocks

**Files:**
- Create: `library-web/src/detail/ItemsBlock.tsx`, `library-web/src/detail/MetadataHeader.tsx`, `library-web/src/detail/VersionList.tsx`, `library-web/src/detail/MetaBlocks.tsx`
- Test: `library-web/src/detail/ItemsBlock.test.tsx`, `library-web/src/detail/MetadataHeader.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// library-web/src/detail/ItemsBlock.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemsBlock } from './ItemsBlock'
import type { RenderModel } from '../definition/renderModel'

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Page one',
    blocks: [
      { kind: 'message', text: 'Welcome', unresolved: false },
      { kind: 'item', number: 1, stem: 'How are you?', required: true, options: [{ index: 1, text: 'Bad' }, { index: 2, text: 'Good' }], unresolved: false },
      { kind: 'section', id: 's', sharedOptions: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }], items: [
        { kind: 'item', number: 2, stem: 'Item A', required: false, options: [], unresolved: false },
        { kind: 'item', number: 3, stem: '', required: false, options: [], unresolved: true },
      ] },
    ],
  }],
}

describe('ItemsBlock', () => {
  it('renders messages, items with their options, and a required marker', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('How are you?')).toBeInTheDocument()
    expect(screen.getByText('Bad')).toBeInTheDocument()
    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getAllByText('required').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a fallback for unresolved items', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText(/content unavailable/i)).toBeInTheDocument()
  })

  it('renders a matrix section scale once', () => {
    render(<ItemsBlock model={model} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })
})
```

```tsx
// library-web/src/detail/MetadataHeader.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MetadataHeader } from './MetadataHeader'
import type { DefMetadata } from '../api/types'

const meta: DefMetadata = {
  id: 'qst_phq9', title: 'PHQ-9', version: 'v26.0602', language: 'en',
  available_languages: ['en', 'pt'], license: 'cc_by',
}

describe('MetadataHeader', () => {
  it('shows the title, a download button, and a language switcher when multilingual', () => {
    render(
      <MemoryRouter>
        <MetadataHeader meta={meta} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /PHQ-9/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download json/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
  })

  it('fires onDownload when the button is clicked', async () => {
    const onDownload = vi.fn()
    render(
      <MemoryRouter>
        <MetadataHeader meta={meta} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={onDownload} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /download json/i }))
    expect(onDownload).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ItemsBlock MetadataHeader`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement ItemsBlock**

`library-web/src/detail/ItemsBlock.tsx`:
```tsx
import type { RenderModel, ItemBlock as ItemT, OptionChoice } from '../definition/renderModel'
import { Badge } from '../components/Badge'

function Options({ options }: { options: OptionChoice[] }) {
  if (options.length === 0) return null
  return (
    <ol className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <li key={o.index} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
          {o.text || `(${o.index})`}
        </li>
      ))}
    </ol>
  )
}

function Item({ item, hideOptions = false }: { item: ItemT; hideOptions?: boolean }) {
  if (item.unresolved) {
    return (
      <div className="py-3 text-sm text-slate-400">
        <span className="mr-2 font-mono">{item.number}.</span>content unavailable
      </div>
    )
  }
  return (
    <div className="py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm text-slate-400">{item.number}.</span>
        <p className="text-slate-800">{item.stem}</p>
        {item.required && <Badge tone="warn">required</Badge>}
        {item.reversed && <Badge>reversed</Badge>}
      </div>
      {item.context && <p className="ml-6 mt-1 text-sm italic text-slate-500">{item.context}</p>}
      {!hideOptions && <div className="ml-6"><Options options={item.options} /></div>}
    </div>
  )
}

export function ItemsBlock({ model }: { model: RenderModel }) {
  return (
    <div className="space-y-8">
      {model.pages.map((page, pi) => (
        <section key={page.id ?? pi}>
          {page.title && <h3 className="mb-2 border-b border-slate-200 pb-1 text-base font-semibold text-slate-700">{page.title}</h3>}
          <div className="divide-y divide-slate-100">
            {page.blocks.map((block, bi) => {
              if (block.kind === 'message') {
                return block.unresolved
                  ? <p key={bi} className="py-3 text-sm text-slate-400">content unavailable</p>
                  : <p key={bi} className="py-3 text-sm text-slate-600">{block.text}</p>
              }
              if (block.kind === 'item') return <Item key={bi} item={block} />
              // section (matrix): shared scale shown once
              return (
                <div key={bi} className="py-3">
                  {block.sharedOptions.length > 0 && (
                    <div className="mb-1 ml-6"><Options options={block.sharedOptions} /></div>
                  )}
                  <div className="divide-y divide-slate-100">
                    {block.items.map((it, ii) => <Item key={ii} item={it} hideOptions />)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement MetadataHeader + VersionList + MetaBlocks**

`library-web/src/detail/MetadataHeader.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
import type { DefMetadata, VersionInfo } from '../api/types'
import { Badge } from '../components/Badge'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface MetadataHeaderProps {
  meta: DefMetadata
  version: string
  allVersions: VersionInfo[]
  lang: string
  onLang: (l: string) => void
  onDownload: () => void
}

export function MetadataHeader({ meta, version, allVersions, lang, onLang, onDownload }: MetadataHeaderProps) {
  const navigate = useNavigate()
  const langs = meta.available_languages ?? (meta.language ? [meta.language] : [])
  return (
    <header className="border-b border-slate-200 pb-6">
      <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
      {meta.short_title && meta.short_title !== meta.title && (
        <p className="mt-0.5 text-slate-500">{meta.short_title}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {meta.license && <Badge>{licenseLabel(meta.license)}</Badge>}
        {meta.publication?.doi && (
          <a className="text-sm text-accent hover:underline" href={`https://doi.org/${meta.publication.doi}`} target="_blank" rel="noreferrer">
            doi:{meta.publication.doi}
          </a>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {allVersions.length > 0 && (
          <label className="text-sm text-slate-600">
            Version{' '}
            <select
              aria-label="Version"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={version}
              onChange={(e) => navigate(`/q/${meta.id}/${e.target.value}`)}
            >
              {allVersions.map((v) => <option key={v.version} value={v.version}>{v.version}{v.status !== 'published' ? ` (${v.status})` : ''}</option>)}
            </select>
          </label>
        )}
        {langs.length > 1 && (
          <label className="text-sm text-slate-600">
            Language{' '}
            <select
              aria-label="Language"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={lang}
              onChange={(e) => onLang(e.target.value)}
            >
              {langs.map((l) => <option key={l} value={l}>{languageLabel(l)}</option>)}
            </select>
          </label>
        )}
        <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90" onClick={onDownload}>
          Download JSON
        </button>
      </div>
    </header>
  )
}
```

`library-web/src/detail/VersionList.tsx`:
```tsx
import { Link } from 'react-router-dom'
import type { VersionInfo } from '../api/types'
import { Badge } from '../components/Badge'

export function VersionList({ id, versions, current }: { id: string; versions: VersionInfo[]; current: string }) {
  if (versions.length === 0) return null
  return (
    <ul className="space-y-1 text-sm">
      {versions.map((v) => (
        <li key={v.version} className="flex items-center gap-2">
          <Link to={`/q/${id}/${v.version}`} className={v.version === current ? 'font-semibold text-slate-900' : 'text-accent hover:underline'}>
            {v.version}
          </Link>
          {v.date && <span className="text-slate-400">{v.date}</span>}
          {v.severity && <Badge>{v.severity}</Badge>}
          {v.status !== 'published' && <Badge tone="warn">{v.status}</Badge>}
        </li>
      ))}
    </ul>
  )
}
```

`library-web/src/detail/MetaBlocks.tsx`:
```tsx
import type { DefMetadata, ScoreDecl } from '../api/types'

function Chips({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null
  return <>{items.map((i) => <span key={i} className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{i}</span>)}</>
}

export function ClassificationBlock({ meta }: { meta: DefMetadata }) {
  const c = meta.classification
  if (!c) return null
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {c.domain && <><dt className="text-slate-500">Domain</dt><dd><Chips items={c.domain} /></dd></>}
      {c.population && <><dt className="text-slate-500">Population</dt><dd><Chips items={c.population} /></dd></>}
      {c.administration_mode && <><dt className="text-slate-500">Administration</dt><dd><Chips items={c.administration_mode} /></dd></>}
      {c.age_range && <><dt className="text-slate-500">Age range</dt><dd className="text-slate-700">{c.age_range.join('–')}</dd></>}
    </dl>
  )
}

export function PsychometricsBlock({ meta }: { meta: DefMetadata }) {
  const p = meta.psychometrics
  if (!p) return null
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {p.item_count != null && <><dt className="text-slate-500">Items</dt><dd className="text-slate-700">{p.item_count}</dd></>}
      {p.estimated_minutes != null && <><dt className="text-slate-500">Time</dt><dd className="text-slate-700">~{p.estimated_minutes} min</dd></>}
    </dl>
  )
}

export function CitationBlock({ meta }: { meta: DefMetadata }) {
  if (!meta.authors && !meta.publication) return null
  return (
    <div className="text-sm text-slate-700">
      {meta.authors && <p>{meta.authors.map((a) => a.name).join(', ')}</p>}
      {meta.publication?.citation && <p className="mt-1 text-slate-600">{meta.publication.citation}</p>}
    </div>
  )
}

export function ScoresBlock({ scores }: { scores?: ScoreDecl[] }) {
  if (!scores || scores.length === 0) return null
  return (
    <ul className="space-y-1 text-sm">
      {scores.map((s) => (
        <li key={s.id} className="text-slate-700">
          <span className="font-medium">{s.name ?? s.id}</span>
          <span className="ml-2 font-mono text-xs text-slate-400">{s.scorer}</span>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- ItemsBlock MetadataHeader`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add library-web/src/detail/
git commit -m "feat(library-web): detail presentational blocks (items, header, versions, metadata)"
```

---

### Task D4: Detail page container

**Files:**
- Create: `library-web/src/detail/SectionNav.tsx`
- Modify: `library-web/src/routes/DetailPage.tsx`
- Test: `library-web/src/routes/DetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// library-web/src/routes/DetailPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DetailPage } from './DetailPage'
import { api, ApiError } from '../api/client'
import type { ResolvedDefinition } from '../api/types'

vi.mock('../api/client', async (orig) => {
  const real = await orig<typeof import('../api/client')>()
  return { ...real, api: { ...real.api, resolvedDefinition: vi.fn(), versions: vi.fn() } }
})

const def: ResolvedDefinition = {
  metadata: { id: 'qst_phq9', title: 'PHQ-9', version: 'v26.0602', language: 'en', available_languages: ['en'] },
  pages: [{ id: 'p', title: 'Items', elements: [
    { question: { prompt: { ref: 'pr_1@v', content: { en: { text: 'Little interest?' } } } }, option: { content: { en: { options: [{ index: 1, text: 'Not at all' }] } } } },
  ] }],
}

function setup(path = '/q/qst_phq9') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/q/:id" element={<DetailPage />} />
          <Route path="/q/:id/:version" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.mocked(api.versions).mockResolvedValue([{ id: 'qst_phq9', version: 'v26.0602', status: 'published', severity: null, date: '2026-06-02' }])
})

describe('DetailPage', () => {
  it('renders metadata + items from the resolved definition', async () => {
    vi.mocked(api.resolvedDefinition).mockResolvedValue(def)
    setup()
    await waitFor(() => expect(screen.getByRole('heading', { name: /PHQ-9/ })).toBeInTheDocument())
    expect(screen.getByText('Little interest?')).toBeInTheDocument()
    expect(screen.getByText('Not at all')).toBeInTheDocument()
  })

  it('shows a withdrawn notice on 410', async () => {
    vi.mocked(api.resolvedDefinition).mockRejectedValue(new ApiError(410, 'gone', 'withdrawn'))
    setup()
    await waitFor(() => expect(screen.getByText(/withdrawn/i)).toBeInTheDocument())
  })

  it('shows not-found on 404', async () => {
    vi.mocked(api.resolvedDefinition).mockRejectedValue(new ApiError(404, 'not_found', 'nope'))
    setup()
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- DetailPage`
Expected: FAIL — page is a placeholder; `SectionNav` missing.

- [ ] **Step 3: Implement SectionNav**

`library-web/src/detail/SectionNav.tsx`:
```tsx
export interface NavItem { id: string; label: string }

export function SectionNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky top-6 hidden w-44 shrink-0 lg:block">
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-slate-500 hover:text-accent">{i.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Implement the DetailPage container**

`library-web/src/routes/DetailPage.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResolvedDefinition, useVersions } from '../api/queries'
import { ApiError, rawDefinitionUrl } from '../api/client'
import { buildRenderModel } from '../definition/renderModel'
import { MetadataHeader } from '../detail/MetadataHeader'
import { ItemsBlock } from '../detail/ItemsBlock'
import { VersionList } from '../detail/VersionList'
import { SectionNav } from '../detail/SectionNav'
import { ClassificationBlock, PsychometricsBlock, CitationBlock, ScoresBlock } from '../detail/MetaBlocks'
import { Skeleton } from '../components/Skeleton'
import { ErrorState } from '../components/ErrorState'
import { NotFoundPage } from './NotFoundPage'
import { definitionFilename, downloadUrl } from '../lib/download'

const SECTIONS = [
  { id: 'description', label: 'Description' },
  { id: 'classification', label: 'Classification' },
  { id: 'psychometrics', label: 'Psychometrics' },
  { id: 'citation', label: 'Authors & citation' },
  { id: 'items', label: 'Items' },
  { id: 'scores', label: 'Scores' },
  { id: 'versions', label: 'Versions' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-slate-200 pt-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

export function DetailPage() {
  const { id = '', version } = useParams()
  const versionsQ = useVersions(id)
  const latest = version ?? versionsQ.data?.find((v) => v.status === 'published')?.version
  const defQ = useResolvedDefinition(id, latest, true)
  const [lang, setLang] = useState<string | null>(null)

  const meta = defQ.data?.metadata
  const effectiveLang = lang ?? meta?.language ?? 'en'
  const model = useMemo(
    () => (defQ.data ? buildRenderModel(defQ.data, effectiveLang) : null),
    [defQ.data, effectiveLang],
  )

  if (defQ.error instanceof ApiError && defQ.error.status === 404) return <NotFoundPage />
  if (defQ.error instanceof ApiError && defQ.error.status === 410) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Withdrawn</h1>
        <p className="mt-2 text-slate-600">This questionnaire version has been withdrawn; its definition is no longer available.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {(versionsQ.isLoading || defQ.isLoading) && (
        <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full" /></div>
      )}
      {defQ.isError && !(defQ.error instanceof ApiError) && (
        <ErrorState message="Could not load this questionnaire." onRetry={() => defQ.refetch()} />
      )}
      {defQ.isSuccess && meta && model && latest && (
        <div className="flex gap-10">
          <div className="min-w-0 flex-1 space-y-8">
            <MetadataHeader
              meta={meta}
              version={latest}
              allVersions={versionsQ.data ?? []}
              lang={effectiveLang}
              onLang={setLang}
              onDownload={() => downloadUrl(rawDefinitionUrl(id, latest), definitionFilename(id, latest))}
            />
            {meta.description && <Section id="description" title="Description"><p className="text-slate-700">{meta.description}</p></Section>}
            <Section id="classification" title="Classification"><ClassificationBlock meta={meta} /></Section>
            <Section id="psychometrics" title="Psychometrics"><PsychometricsBlock meta={meta} /></Section>
            <Section id="citation" title="Authors & citation"><CitationBlock meta={meta} /></Section>
            <Section id="items" title="Items"><ItemsBlock model={model} /></Section>
            <Section id="scores" title="Scores"><ScoresBlock scores={defQ.data.scores} /></Section>
            <Section id="versions" title="Versions"><VersionList id={id} versions={versionsQ.data ?? []} current={latest} /></Section>
          </div>
          <SectionNav items={SECTIONS} />
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- DetailPage`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full frontend suite + build**

Run: `npm test && npm run build`
Expected: all PASS; build compiles clean.

- [ ] **Step 7: Commit**

```bash
git add library-web/src/
git commit -m "feat(library-web): detail page container (metadata + items + versions + download)"
```

---

## Phase E — End-to-end + polish

### Task E1: Playwright smoke test

**Files:**
- Create: `library-web/playwright.config.ts`, `library-web/tests/e2e/catalogue.spec.ts`, `library-web/scripts/seed-and-serve.md`

- [ ] **Step 1: Install the Playwright browser**

Run (from `library-web/`): `npx playwright install chromium`
Expected: Chromium downloaded.

- [ ] **Step 2: Write the Playwright config**

`library-web/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Document the API-seeding prerequisite**

`library-web/scripts/seed-and-serve.md`:
```markdown
# Run the API for the e2e test

The Playwright smoke test needs the Library Core running on :8000, seeded with content,
and CORS allowing the preview origin.

```bash
source ../.venv/bin/activate
export DOCKER_CONFIG=/tmp/lib_docker
# start Postgres (docker) and export DATABASE_URL=postgresql://…
export LIBRARY_CORS_ORIGINS=http://localhost:4173
python -m library.cli migrate
python -m library.cli import-survey-db ../survey_database/data/survey_db.sqlite --out content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
python -m library.cli ingest content --release v26.0606
uvicorn library.api.app:create_app --factory --port 8000
```

Then, in `library-web/`, with `VITE_API_BASE_URL=http://localhost:8000`:
`npm run e2e`
```

- [ ] **Step 4: Write the smoke test**

`library-web/tests/e2e/catalogue.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

// Requires the seeded Library Core on :8000 (see scripts/seed-and-serve.md) and
// VITE_API_BASE_URL pointing at it at build time.
test('search → open a questionnaire → see items → download JSON', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toContainText('Questionnaire Library')

  // there should be results without any filter
  const firstResult = page.locator('article a').first()
  await expect(firstResult).toBeVisible()
  await firstResult.click()

  // detail page shows a heading and an Items section
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible()

  // download triggers a file
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download json/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/@v\d{2}\.\d{4}\.json$/)
})
```

- [ ] **Step 5: Run the e2e test against a seeded API**

Bring up the seeded API per `scripts/seed-and-serve.md`, then run (from `library-web/`, with `VITE_API_BASE_URL=http://localhost:8000`):
`npm run e2e`
Expected: PASS (1 test) — search results visible, detail + Items render, a `*@vYY.MMDD.json` download fires.

- [ ] **Step 6: Commit**

```bash
git add library-web/playwright.config.ts library-web/tests/e2e/ library-web/scripts/
git commit -m "test(library-web): Playwright e2e smoke (search → view → download)"
```

---

### Task E2: Visual polish pass + final verification

**Files:**
- Modify: any of `library-web/src/**` (visual refinement only — no contract changes)

- [ ] **Step 1: Run the frontend-design skill over the rendered UI**

Use the `frontend-design` skill to refine the clean-academic visual direction (typography scale, spacing rhythm, badge/license color system, sticky-nav active state, responsive breakpoints, focus-visible states). Constraint: change classNames/markup only — do **not** alter component props, exported types, or the render model, so all tests stay green.

- [ ] **Step 2: Run the app and review against the live API**

Use the `run`/`verify` skills: bring up the seeded API + `npm run dev`, walk the catalogue → filter → open a multilingual instrument (e.g. PHQ-9) → switch language → switch version → download. Confirm loading skeletons, the empty state (search a nonsense term), and a 404 (visit `/q/qst_nope`).

- [ ] **Step 3: Run the full test matrix**

```bash
# frontend
cd library-web && npm test && npm run build && cd ..
# core (unchanged + new)
source .venv/bin/activate && DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q
```
Expected: frontend suite green + build clean; `library/` suite green.

- [ ] **Step 4: Commit**

```bash
git add library-web/src/
git commit -m "style(library-web): frontend-design polish pass (clean academic)"
```

---

## Self-review checklist (completed during planning)

**Spec coverage:**
- §3.1 CORS → Task A1. §3.2 resolved-definition → Task A2. §3.3 CatalogueCard → Task A3. §3.4 language/license facets → Task A4. §3.5 versions enrichment → Task A5.
- §4 architecture (router/query/URL-state/typed client/render model) → B2, B3, C1, D1.
- §5.1 catalogue page (rows, facet sidebar, search, sort, pagination, empty) → C2, C3.
- §5.2 detail page (single-scroll + sticky nav, header, version selector, download, items, scores, version list) → D3, D4.
- §6.1 states (loading/empty/404/410/error/boundary) → B3 (boundary), C3 (loading/empty/error), D4 (404/410).
- §6.2 i18n (primary + switcher) → D1 (lang fallback) + D3/D4 (switcher).
- §6.3 visual direction → E2.
- §8 testing (core pytest, unit, component, e2e) → A1–A5, C/D unit+component, E1.
- §9 DoD → A6 (suite + OpenAPI), E1 (walkthrough), E2 (final matrix).

**Placeholder scan:** the `CataloguePage`/`DetailPage` "placeholder bodies" in B3 are intentional, named as such, and fully replaced in C3/D4 — not TODOs. No "add error handling"/"similar to"/"TBD" left.

**Type consistency:** `CatalogueCard`, `Paginated<T>`, `VersionInfo`, `FacetResponse`, `ResolvedDefinition` (TS) mirror the Pydantic `CatalogueCard`/`PaginatedCards`/`VersionInfo` shapes. `useCatalogueParams` returns `{params, offset, limit, setParam, toggleFacet, setPage, clearAll}` — consumed exactly so in `CataloguePage`. `buildRenderModel(def, lang)` → `RenderModel{pages[].blocks[]}` consumed by `ItemsBlock`. `api.*` method names match `queries.ts` usage. `rawDefinitionUrl`/`definitionFilename`/`downloadUrl` names consistent across D2/D4.

---

## Notes for the executor

- **Run Phase A first** — the frontend's typed client and tests assume the enriched/resolved responses exist. A6 snapshots the OpenAPI for optional `npm run codegen`.
- **Docker quirk:** every `pytest library/` invocation needs `DOCKER_CONFIG=/tmp/lib_docker` (testcontainers Postgres) — see [HANDOFF.md](../../../HANDOFF.md).
- **Do not** add SurveyJS or any interactive form rendering — the item display is a read-only depiction (spec §1.2).
- **Resolution recursion** in `resolve.py` relies on hard-pinned acyclic refs (CalVer). If a future cyclic ref is ever introduced, add a visited-set guard — out of scope for MVP.
- **`content/` stays gitignored** (importer output) — only commit code, never seeded content.
```
