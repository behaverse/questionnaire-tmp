# Library Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Library Core — ingest canonical JSON (questionnaires + reusable entities) from a Git-tracked content tree into PostgreSQL, and serve a public read REST API with search, faceting, version history, downloadable definitions, and a dependency graph.

**Architecture:** Storage Approach C (hybrid) — an immutable `jsonb` source-of-truth table plus derived, rebuildable index tables (`catalogue_entry`, `entity_ref`, `facet`). Ingestion validates each artifact against its JSON Schema, resolves hard-pinned `@version` refs, upserts canonical rows, then projects the index. A FastAPI app serves `/v1` read endpoints. No auth, no write API, Postgres-only. Published + withdrawn lifecycle only.

**Tech Stack:** Python 3.12 · FastAPI · Uvicorn · psycopg 3 (+ psycopg_pool) · Pydantic v2 · `jsonschema` + `referencing` · pytest + httpx · testcontainers (ephemeral Postgres) · PostgreSQL 16.

**Spec:** [../specs/2026-06-05-library-core-design.md](../specs/2026-06-05-library-core-design.md)

---

## Environment notes (verified 2026-06-05)

- Python 3.12 in `.venv`. Docker daemon running (testcontainers will pull `postgres:16`). No local Postgres — tests use an ephemeral container.
- New code lives under `library/` in the current repo (becomes the `questionnaire-library-service` repo root at the deferred reorg).
- JSON Schemas live at the repo's `schemas/` (the `SCHEMAS_DIR`); validated content examples at `schemas/questionnaire/examples/library_examples/`.

## File structure

```
library/
├── pyproject.toml                  # package + deps + pytest config
├── docker-compose.yml              # local dev Postgres (optional, for `library serve`)
├── src/library/
│   ├── __init__.py
│   ├── config.py                   # Settings from env (DATABASE_URL, CONTENT_DIR, SCHEMAS_DIR, API_PREFIX)
│   ├── entity_types.py             # 14 types ↔ plural-dir ↔ id-prefix ↔ schema name
│   ├── loader.py                   # walk tree, parse, identify (type,id,version) → Artifact
│   ├── validation.py               # build schema registry from SCHEMAS_DIR; validate_artifact()
│   ├── refs.py                     # extract_refs(), parse_ref() — hard-pinned @version refs
│   ├── licensing.py                # effective_license() composite computation
│   ├── ingest.py                   # ingest_tree() orchestration + IngestReport
│   ├── query.py                    # read SQL for list/search/facets/dependents
│   ├── models.py                   # Pydantic v2 API response models
│   ├── store/
│   │   ├── __init__.py
│   │   ├── db.py                   # ConnectionPool from DATABASE_URL
│   │   ├── schema.sql              # canonical DDL (idempotent)
│   │   ├── migrate.py              # apply schema.sql
│   │   ├── entities.py             # upsert_entity(), get_entity(), withdraw_entity()
│   │   └── index.py                # rebuild_index_for() → catalogue_entry/entity_ref/facet
│   ├── api/
│   │   ├── __init__.py
│   │   ├── app.py                  # FastAPI factory, error handlers, /v1 router, /healthz
│   │   ├── questionnaires.py
│   │   ├── entities.py
│   │   └── search.py
│   └── cli.py                      # `library migrate|ingest|serve|rebuild-index`
└── tests/
    ├── conftest.py                 # testcontainers Postgres fixtures + content fixture tree
    ├── fixtures/content/           # ref-closed canonical JSON for integration tests
    ├── unit/
    └── integration/
```

**Naming contract (used across tasks — keep identical):** `Artifact(entity_type, id, version, data, path)` · `Ref(to_id, to_version, ref_kind)` · `IngestReport(ingested, skipped, errors, source_commit)` · store fns `upsert_entity(conn, art, source_commit)`, `get_entity(conn, id, version)`, `withdraw_entity(conn, id, version, when)`, `rebuild_index_for(conn, art, effective_license)` · `ImmutabilityError`, `UnresolvedRefError`, `SchemaInvalidError`.

---

## Task 1: Project scaffold, DB schema, and test harness

**Files:**
- Create: `library/pyproject.toml`
- Create: `library/src/library/__init__.py`, `library/src/library/config.py`
- Create: `library/src/library/store/__init__.py`, `db.py`, `schema.sql`, `migrate.py`
- Create: `library/tests/conftest.py`
- Test: `library/tests/integration/test_schema.py`

- [ ] **Step 1: Create `library/pyproject.toml`**

```toml
[project]
name = "library"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.110",
  "uvicorn[standard]>=0.29",
  "psycopg[binary]>=3.1",
  "psycopg_pool>=3.2",
  "pydantic>=2.6",
  "jsonschema>=4.20",
  "referencing>=0.30",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "httpx>=0.27", "testcontainers[postgres]>=4.0"]

[project.scripts]
library = "library.cli:main"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Install into the venv**

Run: `.venv/bin/pip install -e 'library[dev]'`
Expected: installs fastapi, psycopg, testcontainers, etc. (success).

- [ ] **Step 3: Write `library/src/library/config.py`**

```python
import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

@dataclass(frozen=True)
class Settings:
    database_url: str
    content_dir: Path
    schemas_dir: Path
    api_prefix: str = "/v1"

def get_settings() -> Settings:
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/library"),
        content_dir=Path(os.environ.get("CONTENT_DIR", REPO_ROOT / "schemas/questionnaire/examples/library_examples")),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR", REPO_ROOT / "schemas")),
        api_prefix=os.environ.get("API_PREFIX", "/v1"),
    )
```

- [ ] **Step 4: Write `library/src/library/store/schema.sql` (idempotent DDL)**

```sql
DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'message','context','instruction','prompt','option','placeholder','help','regex',
    'question','item','solution','subscale','scorer','questionnaire');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE entity_status AS ENUM ('published','withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS entity (
  id            text NOT NULL,
  version       text NOT NULL,
  entity_type   entity_type NOT NULL,
  severity      text,
  status        entity_status NOT NULL DEFAULT 'published',
  license       text,
  content_json  jsonb,
  withdrawn_at  timestamptz,
  source_commit text,
  ingested_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version)
);
CREATE INDEX IF NOT EXISTS entity_content_gin ON entity USING gin (content_json jsonb_path_ops);
CREATE INDEX IF NOT EXISTS entity_type_idx ON entity (entity_type, status);

CREATE TABLE IF NOT EXISTS catalogue_entry (
  id text NOT NULL, version text NOT NULL,
  entity_type entity_type NOT NULL, status entity_status NOT NULL,
  title text, short_title text, description text,
  language text, available_languages text[],
  item_count int, estimated_minutes int, effective_license text,
  search_tsv tsvector,
  PRIMARY KEY (id, version),
  FOREIGN KEY (id, version) REFERENCES entity (id, version) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS catalogue_tsv_gin ON catalogue_entry USING gin (search_tsv);

CREATE TABLE IF NOT EXISTS entity_ref (
  from_id text NOT NULL, from_version text NOT NULL,
  to_id text NOT NULL, to_version text NOT NULL, ref_kind text NOT NULL,
  PRIMARY KEY (from_id, from_version, to_id, to_version, ref_kind)
);
CREATE INDEX IF NOT EXISTS entity_ref_to_idx ON entity_ref (to_id, to_version);

CREATE TABLE IF NOT EXISTS facet (
  id text NOT NULL, version text NOT NULL,
  facet_type text NOT NULL, value text NOT NULL,
  PRIMARY KEY (id, version, facet_type, value)
);
CREATE INDEX IF NOT EXISTS facet_lookup_idx ON facet (facet_type, value);
```

- [ ] **Step 5: Write `library/src/library/store/db.py` and `migrate.py`**

```python
# db.py
from pathlib import Path
from psycopg_pool import ConnectionPool
from ..config import get_settings

_pool: ConnectionPool | None = None

def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(get_settings().database_url, open=True)
    return _pool
```

```python
# migrate.py
from pathlib import Path
import psycopg

SCHEMA_SQL = Path(__file__).with_name("schema.sql")

def apply_schema(conn: psycopg.Connection) -> None:
    conn.execute(SCHEMA_SQL.read_text())
    conn.commit()
```

- [ ] **Step 6: Write `library/tests/conftest.py`**

```python
import psycopg, pytest
from pathlib import Path
from testcontainers.postgres import PostgresContainer
from library.store.migrate import apply_schema

@pytest.fixture(scope="session")
def pg_url():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url().replace("+psycopg2", "")
        with psycopg.connect(url) as conn:
            apply_schema(conn)
        yield url

@pytest.fixture
def conn(pg_url):
    with psycopg.connect(pg_url, autocommit=False) as c:
        yield c

@pytest.fixture(autouse=True)
def _truncate(pg_url):
    yield
    with psycopg.connect(pg_url) as c:
        c.execute("TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE")
        c.commit()
```

- [ ] **Step 7: Write the failing schema test `library/tests/integration/test_schema.py`**

```python
def test_schema_tables_exist(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()
    names = {r[0] for r in rows}
    assert {"entity", "catalogue_entry", "entity_ref", "facet"} <= names
```

- [ ] **Step 8: Run it**

Run: `.venv/bin/pytest library/tests/integration/test_schema.py -v`
Expected: PASS (container starts, schema applies, tables found). First run pulls `postgres:16`.

- [ ] **Step 9: Commit**

```bash
git add library/
git commit -m "feat(library): scaffold package, Postgres schema, test harness"
```

---

## Task 2: Entity-type registry and loader

**Files:**
- Create: `library/src/library/entity_types.py`, `library/src/library/loader.py`
- Test: `library/tests/unit/test_entity_types.py`, `library/tests/unit/test_loader.py`

- [ ] **Step 1: Write `library/tests/unit/test_entity_types.py`**

```python
from library.entity_types import type_for_dir, type_for_id, DIR_BY_TYPE

def test_dir_maps_to_type():
    assert type_for_dir("prompts") == "prompt"
    assert type_for_dir("questionnaires") == "questionnaire"

def test_id_prefix_maps_to_type():
    assert type_for_id("pr_phq9_1") == "prompt"
    assert type_for_id("qst_phq9") == "questionnaire"
    assert type_for_id("opt_x") == "option"

def test_every_type_has_a_dir():
    assert len(DIR_BY_TYPE) == 14
```

- [ ] **Step 2: Run → FAIL** (`ModuleNotFoundError`). Run: `.venv/bin/pytest library/tests/unit/test_entity_types.py -v`

- [ ] **Step 3: Write `library/src/library/entity_types.py`**

```python
# (entity_type, plural_dir, id_prefix, schema_dir_name)
_ROWS = [
    ("message", "messages", "msg_", "questionnaire"),
    ("context", "contexts", "ctx_", "questionnaire"),
    ("instruction", "instructions", "ins_", "questionnaire"),
    ("prompt", "prompts", "pr_", "questionnaire"),
    ("option", "options", "opt_", "questionnaire"),
    ("placeholder", "placeholders", "ph_", "questionnaire"),
    ("help", "helps", "help_", "questionnaire"),
    ("regex", "regexes", "rx_", "questionnaire"),
    ("question", "questions", "q_", "questionnaire"),
    ("item", "items", "it_", "questionnaire"),
    ("solution", "solutions", "sol_", "questionnaire"),
    ("subscale", "subscales", "scl_", "questionnaire"),
    ("scorer", "scorers", "scr_", "questionnaire"),
    ("questionnaire", "questionnaires", "qst_", "questionnaire"),
]
ENTITY_TYPES = [r[0] for r in _ROWS]
DIR_BY_TYPE = {r[0]: r[1] for r in _ROWS}
TYPE_BY_DIR = {r[1]: r[0] for r in _ROWS}
_PREFIXES = sorted(((r[2], r[0]) for r in _ROWS), key=lambda p: -len(p[0]))

def type_for_dir(dirname: str) -> str:
    return TYPE_BY_DIR[dirname]

def type_for_id(entity_id: str) -> str:
    for prefix, etype in _PREFIXES:
        if entity_id.startswith(prefix):
            return etype
    raise ValueError(f"unknown id prefix: {entity_id}")
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Write `library/tests/unit/test_loader.py`**

```python
import json
from library.loader import identify, load_tree

def test_identify_uses_dir_and_id(tmp_path):
    p = tmp_path / "prompts" / "pr_x.json"
    p.parent.mkdir(parents=True)
    p.write_text(json.dumps({"id": "pr_x", "version": "v26.0528", "content": {}}))
    art = identify(p, json.loads(p.read_text()))
    assert art.entity_type == "prompt" and art.id == "pr_x" and art.version == "v26.0528"

def test_identify_rejects_prefix_mismatch(tmp_path):
    p = tmp_path / "prompts" / "opt_x.json"
    import pytest
    with pytest.raises(ValueError):
        identify(p, {"id": "opt_x", "version": "v26.0528"})

def test_load_tree_walks(tmp_path):
    d = tmp_path / "messages"; d.mkdir(parents=True)
    (d / "msg_a.json").write_text(json.dumps({"id": "msg_a", "version": "v26.0528", "content": {}}))
    arts = load_tree(tmp_path)
    assert [a.id for a in arts] == ["msg_a"]
```

- [ ] **Step 6: Run → FAIL.**

- [ ] **Step 7: Write `library/src/library/loader.py`**

```python
import json
from dataclasses import dataclass
from pathlib import Path
from .entity_types import type_for_dir, type_for_id, TYPE_BY_DIR

@dataclass(frozen=True)
class Artifact:
    entity_type: str
    id: str
    version: str
    data: dict
    path: Path

def identify(path: Path, data: dict) -> Artifact:
    dir_type = type_for_dir(path.parent.name)
    id_type = type_for_id(data["id"])
    if dir_type != id_type:
        raise ValueError(f"{path}: dir implies {dir_type} but id implies {id_type}")
    return Artifact(dir_type, data["id"], data["version"], data, path)

def load_tree(root: Path) -> list[Artifact]:
    out: list[Artifact] = []
    for path in sorted(root.rglob("*.json")):
        if path.parent.name not in TYPE_BY_DIR:
            continue
        out.append(identify(path, json.loads(path.read_text())))
    return out
```

- [ ] **Step 8: Run → PASS.**

- [ ] **Step 9: Commit**

```bash
git add library/src/library/entity_types.py library/src/library/loader.py library/tests/unit/
git commit -m "feat(library): entity-type registry and content-tree loader"
```

---

## Task 3: Schema validation

**Files:**
- Create: `library/src/library/validation.py`
- Test: `library/tests/integration/test_validation.py`

- [ ] **Step 1: Write `library/tests/integration/test_validation.py`**

```python
import json
from pathlib import Path
from library.config import get_settings
from library.validation import build_registry, validate_artifact, SchemaInvalidError
from library.loader import identify
import pytest

EX = get_settings().schemas_dir / "questionnaire/examples/library_examples/prompts/pr_phq9_1.json"

def test_valid_prompt_passes():
    reg = build_registry(get_settings().schemas_dir)
    art = identify(EX, json.loads(EX.read_text()))
    validate_artifact(art, reg)  # no raise

def test_invalid_prompt_fails():
    reg = build_registry(get_settings().schemas_dir)
    bad = identify(EX, {**json.loads(EX.read_text()), "content": "not-an-object"})
    with pytest.raises(SchemaInvalidError):
        validate_artifact(bad, reg)
```

- [ ] **Step 2: Inspect the existing validator to reuse its registry approach.**

Run: `.venv/bin/python -c "import ast,sys; print('build_registry' in open('tools/validate_schemas.py').read())"`
Expected: `True`. Read `tools/validate_schemas.py` `build_registry`/schema-URL mapping and mirror it (map each schema's `$id` URL → local `schema.json`, including `versions/`). The reusable entities validate against the `questionnaire` schema's `$defs`; confirm which `$id` + sub-schema the entity files declare (check `"$schema"`/`"$id"` or a `$ref` in `pr_phq9_1.json`).

- [ ] **Step 3: Write `library/src/library/validation.py`**

```python
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from .loader import Artifact

class SchemaInvalidError(Exception):
    pass

def build_registry(schemas_dir: Path) -> Registry:
    resources = []
    for schema_path in schemas_dir.glob("**/schema.json"):
        doc = json.loads(schema_path.read_text())
        if "$id" in doc:
            resources.append((doc["$id"], Resource.from_contents(doc)))
    return Registry().with_resources(resources)

def _schema_uri_for(art: Artifact) -> str:
    # Reusable entities + questionnaires validate against the questionnaire schema's
    # entity $defs. Resolve from the artifact's declared "$schema" if present, else
    # the questionnaire schema $id + a $defs pointer per entity_type.
    if "$schema" in art.data:
        return art.data["$schema"]
    raise SchemaInvalidError(f"{art.id}: no $schema declared and no default mapping")

def validate_artifact(art: Artifact, registry: Registry) -> None:
    uri = _schema_uri_for(art)
    resolver = registry.resolver()
    schema = resolver.lookup(uri).contents
    validator = Draft202012Validator(schema, registry=registry)
    errors = sorted(validator.iter_errors(art.data), key=str)
    if errors:
        raise SchemaInvalidError(f"{art.id}@{art.version}: {errors[0].message}")
```

> **Plan note:** Step 2 determines the exact `$schema`/`$defs` wiring. If the example files do **not** carry a `$schema`, replace `_schema_uri_for` with an `entity_type → (questionnaire-schema $id, "#/$defs/<EntityDef>")` table built from the questionnaire `schema.json` `$defs` keys (read them in Step 2). Keep `build_registry` as-is.

- [ ] **Step 4: Run → PASS.** Run: `.venv/bin/pytest library/tests/integration/test_validation.py -v`. If the `$schema` wiring differs, fix `_schema_uri_for` per the Step-2 findings until both tests pass.

- [ ] **Step 5: Commit**

```bash
git add library/src/library/validation.py library/tests/integration/test_validation.py
git commit -m "feat(library): JSON Schema validation against the schema registry"
```

---

## Task 4: Reference extraction and license computation

**Files:**
- Create: `library/src/library/refs.py`, `library/src/library/licensing.py`
- Test: `library/tests/unit/test_refs.py`, `library/tests/unit/test_licensing.py`

- [ ] **Step 1: Write `library/tests/unit/test_refs.py`**

```python
from library.refs import extract_refs, parse_ref, Ref

def test_parse_ref():
    assert parse_ref("pr_x@v26.0528") == ("pr_x", "v26.0528")

def test_extract_refs_infers_kind_from_key():
    data = {
        "id": "it_a", "version": "v1",
        "question": {"ref": "q_a@v26.0528"},
        "option": {"ref": "opt_a@v26.0528"},
    }
    refs = set(extract_refs(data))
    assert Ref("q_a", "v26.0528", "question") in refs
    assert Ref("opt_a", "v26.0528", "option") in refs

def test_extract_refs_handles_nested_and_arrays():
    data = {"id": "page", "version": "v1",
            "elements": [{"ref": "msg_a@v26.0528"}, {"option": {"ref": "opt_b@v26.0528"}}]}
    kinds = {r.ref_kind for r in extract_refs(data)}
    assert {"elements", "option"} <= kinds
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/refs.py`**

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Ref:
    to_id: str
    to_version: str
    ref_kind: str

def parse_ref(s: str) -> tuple[str, str]:
    entity_id, _, version = s.partition("@")
    if not version:
        raise ValueError(f"unpinned ref: {s}")
    return entity_id, version

def extract_refs(data) -> list[Ref]:
    out: list[Ref] = []
    def walk(node, parent_key):
        if isinstance(node, dict):
            if "ref" in node and isinstance(node["ref"], str) and "@" in node["ref"]:
                tid, ver = parse_ref(node["ref"])
                out.append(Ref(tid, ver, parent_key or "ref"))
            for k, v in node.items():
                if k != "ref":
                    walk(v, k)
        elif isinstance(node, list):
            for item in node:
                walk(item, parent_key)
    walk(data, None)
    return out
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Write `library/tests/unit/test_licensing.py`**

```python
from library.licensing import effective_license

def test_single_license_passthrough():
    assert effective_license(["cc_by"]) == "cc_by"

def test_strictest_wins_when_homogeneous_family():
    assert effective_license(["cc0", "cc0"]) == "cc0"

def test_mixed_returns_mixed_marker():
    assert effective_license(["cc_by", "proprietary_restricted"]) == "mixed_see_components"

def test_unknown_is_restrictive():
    assert effective_license(["cc_by", "unknown"]) == "mixed_see_components"

def test_empty_defaults_unknown():
    assert effective_license([]) == "unknown"
```

- [ ] **Step 6: Run → FAIL.**

- [ ] **Step 7: Write `library/src/library/licensing.py`**

```python
# Least → most restrictive (per design/11_content_licensing.md)
STRICTNESS = [
    "public_domain", "cc0", "cc_by", "cc_by_sa", "cc_by_nc",
    "proprietary_open_redistribution", "proprietary_restricted", "unknown",
]
_RANK = {tag: i for i, tag in enumerate(STRICTNESS)}

def effective_license(licenses: list[str]) -> str:
    tags = [t for t in licenses if t]
    if not tags:
        return "unknown"
    if len(set(tags)) == 1:
        return tags[0]
    return "mixed_see_components"
```

- [ ] **Step 8: Run → PASS.**

- [ ] **Step 9: Commit**

```bash
git add library/src/library/refs.py library/src/library/licensing.py library/tests/unit/test_refs.py library/tests/unit/test_licensing.py
git commit -m "feat(library): ref extraction and composite license computation"
```

---

## Task 5: Entity store — upsert, immutability, withdraw

**Files:**
- Create: `library/src/library/store/entities.py`
- Test: `library/tests/integration/test_entities_store.py`

- [ ] **Step 1: Write `library/tests/integration/test_entities_store.py`**

```python
import json, pytest
from datetime import datetime, timezone
from library.loader import Artifact
from library.store.entities import upsert_entity, get_entity, withdraw_entity, ImmutabilityError
from pathlib import Path

def _art(content):
    return Artifact("prompt", "pr_x", "v26.0528", {"id": "pr_x", "version": "v26.0528", "license": "cc0", **content}, Path("pr_x.json"))

def test_upsert_then_get(conn):
    upsert_entity(conn, _art({"a": 1}), "deadbeef"); conn.commit()
    row = get_entity(conn, "pr_x", "v26.0528")
    assert row["content_json"]["a"] == 1 and row["license"] == "cc0"

def test_idempotent_reingest_is_noop(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    upsert_entity(conn, _art({"a": 1}), "c2"); conn.commit()  # identical content
    assert get_entity(conn, "pr_x", "v26.0528")["content_json"]["a"] == 1

def test_changed_content_same_version_rejected(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    with pytest.raises(ImmutabilityError):
        upsert_entity(conn, _art({"a": 2}), "c2")

def test_withdraw_stubs_content(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    withdraw_entity(conn, "pr_x", "v26.0528", datetime(2026,6,5,tzinfo=timezone.utc)); conn.commit()
    row = get_entity(conn, "pr_x", "v26.0528")
    assert row["status"] == "withdrawn" and row["content_json"] is None
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/store/entities.py`**

```python
from datetime import datetime
import json
import psycopg
from psycopg.types.json import Jsonb
from ..loader import Artifact

class ImmutabilityError(Exception):
    pass

def get_entity(conn: psycopg.Connection, entity_id: str, version: str) -> dict | None:
    row = conn.execute(
        "SELECT id, version, entity_type, status, license, severity, content_json, withdrawn_at "
        "FROM entity WHERE id=%s AND version=%s", (entity_id, version)
    ).fetchone()
    if row is None:
        return None
    cols = ["id","version","entity_type","status","license","severity","content_json","withdrawn_at"]
    return dict(zip(cols, row))

def upsert_entity(conn: psycopg.Connection, art: Artifact, source_commit: str) -> None:
    existing = get_entity(conn, art.id, art.version)
    if existing is not None:
        if existing["content_json"] == art.data:
            return  # idempotent no-op
        raise ImmutabilityError(f"{art.id}@{art.version} already ingested with different content")
    conn.execute(
        "INSERT INTO entity (id, version, entity_type, severity, license, content_json, source_commit) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (art.id, art.version, art.entity_type, art.data.get("severity"),
         art.data.get("license"), Jsonb(art.data), source_commit),
    )

def withdraw_entity(conn: psycopg.Connection, entity_id: str, version: str, when: datetime) -> None:
    conn.execute(
        "UPDATE entity SET status='withdrawn', content_json=NULL, withdrawn_at=%s "
        "WHERE id=%s AND version=%s", (when, entity_id, version)
    )
```

- [ ] **Step 4: Run → PASS.** Run: `.venv/bin/pytest library/tests/integration/test_entities_store.py -v`

- [ ] **Step 5: Commit**

```bash
git add library/src/library/store/entities.py library/tests/integration/test_entities_store.py
git commit -m "feat(library): entity store with immutability + withdraw"
```

---

## Task 6: Derived index builder (catalogue_entry, entity_ref, facet)

**Files:**
- Create: `library/src/library/store/index.py`
- Test: `library/tests/integration/test_index.py`

- [ ] **Step 1: Write `library/tests/integration/test_index.py`**

```python
from pathlib import Path
from library.loader import Artifact
from library.store.entities import upsert_entity
from library.store.index import rebuild_index_for

def _q():
    data = {"id": "qst_x", "version": "v26.0601", "license": "cc_by",
            "metadata": {"title": "Test Q", "short_title": "TQ", "description": "d",
                         "language": "en", "available_languages": ["en","pt"],
                         "license": "cc_by",
                         "classification": {"domain": ["depression"], "population": ["adults"],
                                            "administration_mode": ["self_report"]},
                         "psychometrics": {"item_count": 9, "estimated_minutes": 5}},
            "pages": [{"elements": [{"option": {"ref": "opt_a@v26.0528"}}]}]}
    return Artifact("questionnaire", "qst_x", "v26.0601", data, Path("qst_x.json"))

def test_catalogue_row_derived(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    row = conn.execute("SELECT title, item_count, effective_license, language FROM catalogue_entry WHERE id='qst_x'").fetchone()
    assert row == ("Test Q", 9, "cc_by", "en")

def test_facets_and_refs(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    facets = {(r[0], r[1]) for r in conn.execute("SELECT facet_type, value FROM facet WHERE id='qst_x'").fetchall()}
    assert ("domain", "depression") in facets and ("population", "adults") in facets
    refs = conn.execute("SELECT to_id, ref_kind FROM entity_ref WHERE from_id='qst_x'").fetchall()
    assert ("opt_a", "option") in [(r[0], r[1]) for r in refs]

def test_tsv_populated(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    n = conn.execute("SELECT count(*) FROM catalogue_entry WHERE search_tsv @@ plainto_tsquery('english','Test')").fetchone()[0]
    assert n == 1
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/store/index.py`**

```python
import psycopg
from ..loader import Artifact
from ..refs import extract_refs

def _meta(art: Artifact) -> dict:
    # questionnaires carry a Schema-1-shaped metadata block; reusable entities don't
    return art.data.get("metadata", {}) if art.entity_type == "questionnaire" else {}

def rebuild_index_for(conn: psycopg.Connection, art: Artifact, effective_license: str) -> None:
    conn.execute("DELETE FROM catalogue_entry WHERE id=%s AND version=%s", (art.id, art.version))
    conn.execute("DELETE FROM entity_ref WHERE from_id=%s AND from_version=%s", (art.id, art.version))
    conn.execute("DELETE FROM facet WHERE id=%s AND version=%s", (art.id, art.version))

    m = _meta(art)
    psy = m.get("psychometrics", {})
    title = m.get("title") or art.data.get("name") or art.id
    desc = m.get("description", "")
    conn.execute(
        "INSERT INTO catalogue_entry (id, version, entity_type, status, title, short_title, description, "
        "language, available_languages, item_count, estimated_minutes, effective_license, search_tsv) "
        "VALUES (%s,%s,%s,'published',%s,%s,%s,%s,%s,%s,%s,%s, "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'A') || "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'C'))",
        (art.id, art.version, art.entity_type, title, m.get("short_title"), desc,
         m.get("language"), m.get("available_languages"),
         psy.get("item_count"), psy.get("estimated_minutes"), effective_license,
         title, desc),
    )

    for ref in extract_refs(art.data):
        conn.execute(
            "INSERT INTO entity_ref (from_id, from_version, to_id, to_version, ref_kind) "
            "VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (art.id, art.version, ref.to_id, ref.to_version, ref.ref_kind),
        )

    cls = m.get("classification", {})
    for ftype in ("domain", "population", "administration_mode"):
        for value in cls.get(ftype, []) or []:
            conn.execute(
                "INSERT INTO facet (id, version, facet_type, value) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                (art.id, art.version, ftype, value),
            )
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add library/src/library/store/index.py library/tests/integration/test_index.py
git commit -m "feat(library): derived index builder (catalogue/refs/facets/tsv)"
```

---

## Task 7: Assemble a ref-closed content fixture

**Files:**
- Create: `library/tests/fixtures/content/` (curated copies of validated examples)
- Test: `library/tests/integration/test_fixture_closure.py`

- [ ] **Step 1: Identify a ref-closed set from the existing examples.**

Run: `.venv/bin/python tools/validate_schemas.py 2>&1 | tail -5` (confirm the repo examples validate today). Then list `schemas/questionnaire/examples/library_examples/` and `schemas/questionnaire/examples/phq9.json`; pick the PHQ-9 cluster (`prompts/pr_phq9_1.json`, `options/opt_phq9_freq_4.json`, `items/it_phq9_1.json`, any `questions/` it needs, `messages/msg_aiss_welcome.json`) plus a questionnaire. Inspect each file's `version` and its `@version` refs so the set is closed (every referenced `id@version` is present).

- [ ] **Step 2: Copy the closed set into the fixture tree.**

```bash
mkdir -p library/tests/fixtures/content/{prompts,options,items,questions,messages,questionnaires}
# copy exactly the files identified in Step 1, e.g.:
cp schemas/questionnaire/examples/library_examples/prompts/pr_phq9_1.json library/tests/fixtures/content/prompts/
cp schemas/questionnaire/examples/library_examples/options/opt_phq9_freq_4.json library/tests/fixtures/content/options/
cp schemas/questionnaire/examples/library_examples/items/it_phq9_1.json library/tests/fixtures/content/items/
# ...plus every entity those refs point at, and one questionnaire under questionnaires/
```

- [ ] **Step 3: Write `library/tests/integration/test_fixture_closure.py`**

```python
from pathlib import Path
from library.loader import load_tree
from library.refs import extract_refs

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

def test_fixture_refs_are_closed():
    arts = load_tree(FIXTURE)
    present = {(a.id, a.version) for a in arts}
    for a in arts:
        for ref in extract_refs(a.data):
            assert (ref.to_id, ref.to_version) in present, f"{a.id} -> {ref.to_id}@{ref.to_version} missing"
```

- [ ] **Step 4: Run → adjust the fixture set until PASS.** Add any missing referenced entity files (copy from the examples) until refs are closed.

- [ ] **Step 5: Commit**

```bash
git add library/tests/fixtures/ library/tests/integration/test_fixture_closure.py
git commit -m "test(library): ref-closed content fixture for ingestion tests"
```

---

## Task 8: Ingestion pipeline + CLI

**Files:**
- Create: `library/src/library/ingest.py`, `library/src/library/cli.py`
- Test: `library/tests/integration/test_ingest.py`

- [ ] **Step 1: Write `library/tests/integration/test_ingest.py`**

```python
from pathlib import Path
import pytest
from library.ingest import ingest_tree, UnresolvedRefError
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

def test_ingest_fixture_tree(conn):
    report = ingest_tree(conn, FIXTURE, source_commit="abc123",
                         registry=__import__("library.validation", fromlist=["build_registry"]).build_registry(get_settings().schemas_dir))
    conn.commit()
    assert report.errors == []
    assert report.ingested > 0
    n = conn.execute("SELECT count(*) FROM catalogue_entry").fetchone()[0]
    assert n == report.ingested

def test_reingest_is_idempotent(conn):
    from library.validation import build_registry
    reg = build_registry(get_settings().schemas_dir)
    ingest_tree(conn, FIXTURE, "c1", registry=reg); conn.commit()
    before = conn.execute("SELECT count(*) FROM entity").fetchone()[0]
    ingest_tree(conn, FIXTURE, "c2", registry=reg); conn.commit()
    after = conn.execute("SELECT count(*) FROM entity").fetchone()[0]
    assert before == after

def test_unresolved_ref_raises(conn, tmp_path):
    from library.validation import build_registry
    import json
    d = tmp_path / "items"; d.mkdir(parents=True)
    (d / "it_bad.json").write_text(json.dumps(
        {"id": "it_bad", "version": "v26.0528", "question": {"ref": "q_missing@v26.0528"}, "option": {"ref": "opt_missing@v26.0528"}}))
    with pytest.raises(UnresolvedRefError):
        ingest_tree(conn, tmp_path, "c1", registry=build_registry(get_settings().schemas_dir), validate=False)
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/ingest.py`**

```python
from dataclasses import dataclass, field
from pathlib import Path
import psycopg
from .loader import load_tree
from .refs import extract_refs
from .validation import validate_artifact
from .licensing import effective_license
from .store.entities import upsert_entity, get_entity
from .store.index import rebuild_index_for

class UnresolvedRefError(Exception):
    pass

@dataclass
class IngestReport:
    ingested: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)
    source_commit: str = ""

def _license_for(conn, art) -> str:
    own = art.data.get("license") or (art.data.get("metadata", {}) or {}).get("license")
    if art.entity_type != "questionnaire":
        return own or "unknown"
    component_licenses = [own]
    for ref in extract_refs(art.data):
        row = get_entity(conn, ref.to_id, ref.to_version)
        if row and row.get("license"):
            component_licenses.append(row["license"])
    return effective_license(component_licenses)

def ingest_tree(conn: psycopg.Connection, root: Path, source_commit: str, *, registry, validate: bool = True) -> IngestReport:
    arts = load_tree(root)
    report = IngestReport(source_commit=source_commit)
    present = {(a.id, a.version) for a in arts}

    if validate:
        for art in arts:
            validate_artifact(art, registry)

    # resolve refs against this batch + already-stored entities
    for art in arts:
        for ref in extract_refs(art.data):
            if (ref.to_id, ref.to_version) not in present and get_entity(conn, ref.to_id, ref.to_version) is None:
                raise UnresolvedRefError(f"{art.id}@{art.version} -> {ref.to_id}@{ref.to_version}")

    # upsert non-questionnaires first so questionnaire license composition can read them
    arts_sorted = sorted(arts, key=lambda a: a.entity_type == "questionnaire")
    for art in arts_sorted:
        before = get_entity(conn, art.id, art.version)
        upsert_entity(conn, art, source_commit)
        if before is not None:
            report.skipped += 1
            continue
        rebuild_index_for(conn, art, effective_license=_license_for(conn, art))
        report.ingested += 1
    return report
```

- [ ] **Step 4: Write `library/src/library/cli.py`**

```python
import argparse, sys
from pathlib import Path
import psycopg
from .config import get_settings
from .store.migrate import apply_schema
from .ingest import ingest_tree
from .validation import build_registry

def main(argv=None) -> int:
    s = get_settings()
    p = argparse.ArgumentParser(prog="library")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("migrate")
    ing = sub.add_parser("ingest"); ing.add_argument("content_dir", nargs="?", default=str(s.content_dir)); ing.add_argument("--commit", default="")
    args = p.parse_args(argv)
    with psycopg.connect(s.database_url) as conn:
        if args.cmd == "migrate":
            apply_schema(conn); print("schema applied")
        elif args.cmd == "ingest":
            rep = ingest_tree(conn, Path(args.content_dir), args.commit, registry=build_registry(s.schemas_dir))
            conn.commit(); print(f"ingested={rep.ingested} skipped={rep.skipped} errors={len(rep.errors)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run → PASS.** Run: `.venv/bin/pytest library/tests/integration/test_ingest.py -v`

- [ ] **Step 6: Commit**

```bash
git add library/src/library/ingest.py library/src/library/cli.py library/tests/integration/test_ingest.py
git commit -m "feat(library): ingestion pipeline + CLI"
```

---

## Task 9: API scaffold + questionnaires list/detail/versions

**Files:**
- Create: `library/src/library/models.py`, `library/src/library/query.py`, `library/src/library/api/__init__.py`, `app.py`, `questionnaires.py`
- Test: `library/tests/integration/test_api_questionnaires.py`

- [ ] **Step 1: Write `library/tests/integration/test_api_questionnaires.py`**

```python
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    import psycopg
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(get_settings().schemas_dir)); c.commit()
    return TestClient(create_app())

def test_list_questionnaires(client):
    r = client.get("/v1/questionnaires")
    assert r.status_code == 200
    body = r.json()
    assert "items" in body and body["total"] >= 1

def test_detail_and_versions(client):
    qid = client.get("/v1/questionnaires").json()["items"][0]["id"]
    assert client.get(f"/v1/questionnaires/{qid}").status_code == 200
    assert client.get(f"/v1/questionnaires/{qid}/versions").status_code == 200

def test_unknown_404(client):
    assert client.get("/v1/questionnaires/qst_nope").status_code == 404
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/models.py`**

```python
from pydantic import BaseModel

class EntitySummary(BaseModel):
    id: str
    version: str
    entity_type: str
    title: str | None = None
    status: str
    effective_license: str | None = None

class Paginated(BaseModel):
    items: list[EntitySummary]
    total: int
    limit: int
    offset: int
```

- [ ] **Step 4: Write `library/src/library/query.py`**

```python
import psycopg

def latest_versions_cte() -> str:
    return ("WITH latest AS (SELECT id, max(version) AS version FROM catalogue_entry "
            "WHERE status='published' GROUP BY id)")

def list_entries(conn: psycopg.Connection, entity_type: str, *, q: str | None,
                 limit: int, offset: int) -> tuple[list[dict], int]:
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = [entity_type]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)")
        params.append(q)
    sql_where = " AND ".join(where)
    total = conn.execute(
        f"{latest_versions_cte()} SELECT count(*) FROM catalogue_entry c JOIN latest l "
        f"ON c.id=l.id AND c.version=l.version WHERE {sql_where}", params).fetchone()[0]
    rows = conn.execute(
        f"{latest_versions_cte()} SELECT c.id, c.version, c.entity_type, c.title, c.status, c.effective_license "
        f"FROM catalogue_entry c JOIN latest l ON c.id=l.id AND c.version=l.version "
        f"WHERE {sql_where} ORDER BY c.title NULLS LAST LIMIT %s OFFSET %s",
        params + [limit, offset]).fetchall()
    cols = ["id","version","entity_type","title","status","effective_license"]
    return [dict(zip(cols, r)) for r in rows], total

def get_versions(conn, entity_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        "WHERE id=%s ORDER BY version DESC", (entity_id,)).fetchall()
    cols = ["id","version","entity_type","title","status","effective_license"]
    return [dict(zip(cols, r)) for r in rows]
```

- [ ] **Step 5: Write `library/src/library/api/app.py`**

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import psycopg
from ..config import get_settings
from . import questionnaires

def get_conn():
    s = get_settings()
    conn = psycopg.connect(s.database_url)
    try:
        yield conn
    finally:
        conn.close()

def create_app() -> FastAPI:
    app = FastAPI(title="Questionnaire Library", version="v1")
    app.include_router(questionnaires.router, prefix="/v1")

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    @app.exception_handler(KeyError)
    async def _notfound(request: Request, exc: KeyError):
        return JSONResponse(status_code=404, content={"error": {"code": "not_found", "message": str(exc)}})

    return app
```

- [ ] **Step 6: Write `library/src/library/api/questionnaires.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from .app import get_conn
from .. import query
from ..models import Paginated, EntitySummary

router = APIRouter()

@router.get("/questionnaires", response_model=Paginated)
def list_questionnaires(q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.list_entries(conn, "questionnaire", q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/questionnaires/{qid}", response_model=EntitySummary)
def detail(qid: str, conn=Depends(get_conn)):
    versions = query.get_versions(conn, qid)
    published = [v for v in versions if v["status"] == "published"]
    if not published:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return EntitySummary(**max(published, key=lambda v: v["version"]))

@router.get("/questionnaires/{qid}/versions", response_model=list[EntitySummary])
def versions(qid: str, conn=Depends(get_conn)):
    vs = query.get_versions(conn, qid)
    if not vs:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return [EntitySummary(**v) for v in vs]
```

- [ ] **Step 7: Run → PASS.** Run: `.venv/bin/pytest library/tests/integration/test_api_questionnaires.py -v`

- [ ] **Step 8: Commit**

```bash
git add library/src/library/models.py library/src/library/query.py library/src/library/api/ library/tests/integration/test_api_questionnaires.py
git commit -m "feat(library): read API scaffold + questionnaire list/detail/versions"
```

---

## Task 10: Definition endpoint + withdrawn 410

**Files:**
- Modify: `library/src/library/api/questionnaires.py`
- Test: `library/tests/integration/test_api_definition.py`

- [ ] **Step 1: Write `library/tests/integration/test_api_definition.py`**

```python
from pathlib import Path
import psycopg, pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.store.entities import withdraw_entity
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

@pytest.fixture
def seeded(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(get_settings().schemas_dir)); c.commit()
    return pg_url

def test_definition_download(seeded):
    client = TestClient(create_app())
    item = client.get("/v1/questionnaires").json()["items"][0]
    r = client.get(f"/v1/questionnaires/{item['id']}/versions/{item['version']}/definition")
    assert r.status_code == 200 and r.json()["id"] == item["id"]

def test_withdrawn_definition_410(seeded):
    item = TestClient(create_app()).get("/v1/questionnaires").json()["items"][0]
    with psycopg.connect(seeded) as c:
        withdraw_entity(c, item["id"], item["version"], datetime(2026,6,5,tzinfo=timezone.utc)); c.commit()
    r = TestClient(create_app()).get(f"/v1/questionnaires/{item['id']}/versions/{item['version']}/definition")
    assert r.status_code == 410
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Append to `library/src/library/api/questionnaires.py`**

```python
from fastapi.responses import JSONResponse

@router.get("/questionnaires/{qid}/versions/{version}/definition")
def definition(qid: str, version: str, conn=Depends(get_conn)):
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
    return content_json
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add library/src/library/api/questionnaires.py library/tests/integration/test_api_definition.py
git commit -m "feat(library): definition download + withdrawn 410"
```

---

## Task 11: Entities, dependents, search, facets + DoD integration

**Files:**
- Create: `library/src/library/api/entities.py`, `library/src/library/api/search.py`
- Modify: `library/src/library/api/app.py`, `library/src/library/query.py`
- Test: `library/tests/integration/test_api_entities.py`, `test_api_search.py`, `test_dod.py`

- [ ] **Step 1: Write `library/tests/integration/test_api_entities.py`**

```python
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(get_settings().schemas_dir)); c.commit()
    return TestClient(create_app())

def test_list_entities_by_type(client):
    r = client.get("/v1/entities/prompt")
    assert r.status_code == 200 and r.json()["total"] >= 1

def test_dependents(client):
    # an option referenced by an item appears in the item's dependents lookup
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/{opt['version']}/dependents")
    assert r.status_code == 200
    assert any(d["id"].startswith("it_") or d["id"].startswith("qst_") for d in r.json()["items"])
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add `dependents` query to `library/src/library/query.py`**

```python
def dependents_of(conn, to_id: str, to_version: str, limit: int, offset: int) -> tuple[list[dict], int]:
    total = conn.execute(
        "SELECT count(*) FROM entity_ref WHERE to_id=%s AND to_version=%s", (to_id, to_version)).fetchone()[0]
    rows = conn.execute(
        "SELECT DISTINCT r.from_id AS id, r.from_version AS version, c.entity_type, c.title, c.status, c.effective_license "
        "FROM entity_ref r JOIN catalogue_entry c ON c.id=r.from_id AND c.version=r.from_version "
        "WHERE r.to_id=%s AND r.to_version=%s ORDER BY r.from_id LIMIT %s OFFSET %s",
        (to_id, to_version, limit, offset)).fetchall()
    cols = ["id","version","entity_type","title","status","effective_license"]
    return [dict(zip(cols, r)) for r in rows], total
```

- [ ] **Step 4: Write `library/src/library/api/entities.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from .app import get_conn
from .. import query
from ..models import Paginated, EntitySummary
from ..entity_types import ENTITY_TYPES

router = APIRouter()

@router.get("/entities/{etype}", response_model=Paginated)
def list_entities(etype: str, q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    rows, total = query.list_entries(conn, etype, q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/entities/{etype}/{eid}/versions/{version}/dependents", response_model=Paginated)
def dependents(etype: str, eid: str, version: str, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.dependents_of(conn, eid, version, limit, offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)
```

- [ ] **Step 5: Write `library/src/library/api/search.py`**

```python
from fastapi import APIRouter, Depends, Query
from .app import get_conn
from ..models import Paginated, EntitySummary

router = APIRouter()

@router.get("/search", response_model=Paginated)
def search(q: str, type: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    where = ["status='published'", "search_tsv @@ websearch_to_tsquery('english', %s)"]
    params: list = [q]
    if type:
        where.append("entity_type=%s"); params.append(type)
    w = " AND ".join(where)
    total = conn.execute(f"SELECT count(*) FROM catalogue_entry WHERE {w}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        f"WHERE {w} ORDER BY ts_rank(search_tsv, websearch_to_tsquery('english', %s)) DESC LIMIT %s OFFSET %s",
        params + [q, limit, offset]).fetchall()
    cols = ["id","version","entity_type","title","status","effective_license"]
    items = [EntitySummary(**dict(zip(cols, r))) for r in rows]
    return Paginated(items=items, total=total, limit=limit, offset=offset)

@router.get("/facets")
def facets(facet_type: str, conn=Depends(get_conn)):
    rows = conn.execute(
        "SELECT value, count(*) FROM facet WHERE facet_type=%s GROUP BY value ORDER BY count(*) DESC",
        (facet_type,)).fetchall()
    return {"facet_type": facet_type, "values": [{"value": v, "count": c} for v, c in rows]}
```

- [ ] **Step 6: Register the routers in `app.py`**

In `create_app()` add:
```python
from . import entities, search
app.include_router(entities.router, prefix="/v1")
app.include_router(search.router, prefix="/v1")
```

- [ ] **Step 7: Write `library/tests/integration/test_api_search.py`**

```python
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(get_settings().schemas_dir)); c.commit()
    return TestClient(create_app())

def test_search_returns_results(client):
    # pick a word present in a seeded title; PHQ-9 fixtures contain "PHQ"
    r = client.get("/v1/search", params={"q": "PHQ"})
    assert r.status_code == 200 and r.json()["total"] >= 1

def test_facets_endpoint(client):
    r = client.get("/v1/facets", params={"facet_type": "domain"})
    assert r.status_code == 200 and "values" in r.json()
```

- [ ] **Step 8: Write `library/tests/integration/test_dod.py` (Definition-of-Done end-to-end)**

```python
from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

def test_dod_end_to_end(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    reg = build_registry(get_settings().schemas_dir)
    with psycopg.connect(pg_url) as c:
        rep1 = ingest_tree(c, FIXTURE, "c1", registry=reg); c.commit()
        rep2 = ingest_tree(c, FIXTURE, "c2", registry=reg); c.commit()  # idempotent
    assert rep1.errors == [] and rep2.ingested == 0
    client = TestClient(create_app())
    assert client.get("/v1/questionnaires").json()["total"] >= 1
    assert client.get("/v1/search", params={"q": "PHQ"}).status_code == 200
    assert client.get("/openapi.json").status_code == 200
```

- [ ] **Step 9: Run all tests → PASS.**

Run: `.venv/bin/pytest library/ -v`
Expected: all green. Then full project: `.venv/bin/pytest library/ tools/tests/ -q` (the existing 308 schema tests stay green; library tests added).

- [ ] **Step 10: Commit**

```bash
git add library/
git commit -m "feat(library): entities/dependents/search/facets + DoD integration tests"
```

---

## Self-review checklist (completed during authoring)

1. **Spec coverage:** ingestion (T8), validation (T3), refs+graph (T4/T6/T11), storage Approach C (T1/T5/T6), composite license (T4/T8), read API incl. definition/versions/dependents/search/facets (T9–T11), withdrawn 410 (T10), immutability (T5), idempotency (T8/DoD), CLI (T8) — all mapped. Web UI / auth / contribution workflow correctly absent (non-goals).
2. **Open-question handling:** metadata source defaults to the embedded `metadata` block (T6 `_meta`); `search_tsv` = title (weight A) + description (weight C) (T6); test Postgres = testcontainers (T1); repo layer = psycopg 3 raw SQL (throughout). Each was a spec §11 open question; defaults are now explicit.
3. **Type/name consistency:** `Artifact`, `Ref`, `IngestReport`, `upsert_entity`, `get_entity`, `withdraw_entity`, `rebuild_index_for`, `ingest_tree`, `build_registry`, `validate_artifact`, `effective_license`, `EntitySummary`, `Paginated`, `list_entries`, `dependents_of` are used identically across tasks.

## Known follow-ups (out of this plan, noted for the next session)

- The `validation._schema_uri_for` wiring is finalized empirically in Task 3 Step 2 against the real example files; if examples lack `$schema`, switch to the `entity_type → $defs` table described in the plan note.
- Filter params (`domain`, `population`, `license`, item-count range) on `GET /v1/questionnaires` are implemented via `query.list_entries`; extend `list_entries` with the facet/`effective_license` joins in a fast-follow if not needed for the DoD demo.
- `library serve` (uvicorn entry) + `docker-compose.yml` dev Postgres are scaffolding for local running; add when first running outside tests.
