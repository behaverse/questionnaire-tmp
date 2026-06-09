# Instrument-family grouping (`instrument_id`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class optional `instrument_id` (+ `variant`, default `"base"`) to the metadata model so the catalogue groups questionnaire forms under one instrument family (the 4 ASRS forms share `inst_asrs`), sourced from the legacy `header_id` the importer currently drops.

**Architecture:** Coordinated schema bump (Schema 1 `v26.0609` additive + Schema 2 `v26.0609` breaking, bundling the pending `authors`→`author` retarget) → importer emits the fields → Library Core indexes `instrument_id` and the catalogue list returns instrument-**grouped** results (grouped in Python; fine for the catalogue's size) + an `instrument` facet → web UI collapses the catalogue to one expandable row per instrument. Drill-down / version / language / per-form export are untouched.

**Tech Stack:** JSON Schema (Draft 2020-12) · Python 3.12 · FastAPI · psycopg 3 · pytest + testcontainers — and — Vite · React 19 · TypeScript · Tailwind · Vitest · Playwright.

**Spec:** [docs/superpowers/specs/2026-06-09-instrument-id-grouping-design.md](../specs/2026-06-09-instrument-id-grouping-design.md)

**Conventions for Python tasks:** `source .venv/bin/activate` and `export DOCKER_CONFIG=/tmp/lib_docker` (testcontainers). Schema tests: `pytest tools/tests/ -q` (308) + `python tools/validate_schemas.py`. Library tests: `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q`.
**Conventions for frontend tasks:** run from `library-web/`; `npm test` (vitest run), `npm run build`.

**Key mechanism (verified):** the schema validator's `discover_examples()` validates only **live** `schemas/<name>/examples/*.json` (archived `versions/*/examples` are frozen, never re-validated); `build_registry()` auto-registers every `schema.json` it finds, including `versions/*/schema.json`. So a version bump = (1) copy the current live `schema.json` (+`examples/`, `context.jsonld`) into `versions/<old-ver>/`, (2) edit the live `schema.json` ($id + changes), (3) migrate the live examples to conform.

---

## Phase A — Schema 1: Instrument Metadata `v26.0605` → `v26.0609`

### Task A1: Archive v26.0605 and add the two fields to the live Schema 1

**Files:**
- Create: `schemas/instrument/versions/v26.0605/schema.json` (+ `context.jsonld`, `examples/`) — archive
- Modify: `schemas/instrument/schema.json`
- Modify: `schemas/instrument/CHANGELOG.md`
- Create: `schemas/instrument/examples/asrs_screener.json`

- [ ] **Step 1: Archive the current live v26.0605**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
mkdir -p schemas/instrument/versions/v26.0605
cp schemas/instrument/schema.json      schemas/instrument/versions/v26.0605/schema.json
cp schemas/instrument/context.jsonld   schemas/instrument/versions/v26.0605/context.jsonld 2>/dev/null || true
cp -r schemas/instrument/examples       schemas/instrument/versions/v26.0605/examples 2>/dev/null || true
```

- [ ] **Step 2: Add `instrument_id` + `variant` to the live schema and bump `$id`**

In `schemas/instrument/schema.json`: change `"$id"` from `…/instrument/v26.0605/schema.json` to `…/instrument/v26.0609/schema.json`. Then add these two properties to the top-level `"properties"` object (alongside `short_title`):

```jsonc
"instrument_id": {
  "type": "string",
  "pattern": "^inst_[a-z0-9_]+$",
  "minLength": 3,
  "maxLength": 64,
  "description": "Family this instrument/form belongs to (groups variant forms; e.g. the ASRS full form + screener share inst_asrs). Optional; absent means a standalone instrument."
},
"variant": {
  "type": "string",
  "minLength": 1,
  "maxLength": 64,
  "default": "base",
  "description": "Human-readable label distinguishing this form within its instrument family (e.g. 'Screener - Part A'). Defaults to 'base' for the primary/only form."
}
```

Leave `required` and the `^x_` patternProperties / `additionalProperties:false` unchanged.

- [ ] **Step 3: Add an example exercising the new fields**

`schemas/instrument/examples/asrs_screener.json`:
```json
{
  "id": "asrs_screener",
  "title": "ASRS-v1.1",
  "description": "Adult ADHD Self-Report Scale - Part A screener (6-item).",
  "language": "en",
  "instrument_id": "inst_asrs",
  "variant": "Screener - Part A"
}
```

- [ ] **Step 4: Update the changelog**

Prepend a new section to `schemas/instrument/CHANGELOG.md` (above the `## [v26.0605]` entry):
```markdown
## [v26.0609] - 2026-06-09

### Added (severity: additive)

- **`instrument_id`** (optional, `^inst_[a-z0-9_]+$`): groups questionnaire forms under one instrument family (e.g. the ASRS full form + screener share `inst_asrs`). Sourced from the legacy `header_id`.
- **`variant`** (optional, default `"base"`): human-readable label distinguishing a form within its instrument family.
- Property URIs remain stable; existing v26.0605 instances validate unchanged (both fields optional).

**Severity:** `additive`.

```

- [ ] **Step 5: Validate**

Run: `source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -3`
Expected: all examples pass (now including `asrs_screener.json`); the archived `versions/v26.0605/schema.json` resolves via the registry.
Run: `pytest tools/tests/ -q 2>&1 | tail -2`
Expected: PASS (308+, the new example adds an instrument case).

- [ ] **Step 6: Commit**

```bash
git add schemas/instrument/
git commit -m "feat(schemas): instrument v26.0609 adds optional instrument_id + variant"
```

---

## Phase B — Schema 2: Questionnaire `v26.0602` → `v26.0609` (retarget + author rename)

### Task B1: Archive v26.0602, retarget the metadata $ref, migrate examples

**Files:**
- Create: `schemas/questionnaire/versions/v26.0602/schema.json` (+ `examples/`, `context.jsonld`) — archive
- Modify: `schemas/questionnaire/schema.json`
- Modify: `schemas/questionnaire/examples/phq9.json` (authors→author + add instrument_id)
- Modify: `schemas/questionnaire/CHANGELOG.md`

- [ ] **Step 1: Archive the current live v26.0602**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
mkdir -p schemas/questionnaire/versions/v26.0602
cp schemas/questionnaire/schema.json    schemas/questionnaire/versions/v26.0602/schema.json
cp schemas/questionnaire/context.jsonld schemas/questionnaire/versions/v26.0602/context.jsonld 2>/dev/null || true
cp -r schemas/questionnaire/examples     schemas/questionnaire/versions/v26.0602/examples 2>/dev/null || true
```

- [ ] **Step 2: Retarget the metadata `$ref` and bump `$id`**

In `schemas/questionnaire/schema.json`: change `"$id"` to `…/questionnaire/v26.0609/schema.json`. In the `metadata` definition, change the instrument `$ref` from `…/instrument/v26.0528/schema.json` to `…/instrument/v26.0609/schema.json`. (This is the single line under `properties.metadata.allOf[0].$ref`.) Leave the `id` pattern override (`^qst_[a-z0-9_]+$`) untouched.

- [ ] **Step 3: Migrate the hand-authored examples to the new instrument schema**

The live examples now validate against instrument v26.0609 (which renamed `authors`→`author`). Audit + fix:
```bash
grep -l '"authors"' schemas/questionnaire/examples/*.json
```
For **each** match (expected: `phq9.json`), rename the `"authors"` key to `"author"` (contents unchanged). Then add `instrument_id` + `variant` to `phq9.json`'s `metadata` to exercise the new field through Schema 2 — insert after its `"available_languages"` line:
```jsonc
    "instrument_id": "inst_phq9",
    "variant": "base",
```
Leave `minimal.json` / `kitchensink.json` as-is unless `grep` flags `authors` in them (then apply the same rename).

- [ ] **Step 4: Update the changelog**

Prepend to `schemas/questionnaire/CHANGELOG.md`:
```markdown
## [v26.0609] - 2026-06-09

### Changed (severity: breaking)

- **Retargeted the embedded Instrument Metadata `$ref`** from `instrument/v26.0528` to `instrument/v26.0609`. This adopts the optional `instrument_id` + `variant` fields AND the `authors`→`author` rename that Schema 1 made at v26.0605. Questionnaire instances must now use `author` (singular); imported `survey_db` content emits no author field and is unaffected.
- Property URIs otherwise stable.

**Severity:** `breaking` (the `authors`→`author` rename propagates to Schema 2).

```

- [ ] **Step 5: Validate + tag**

Run: `source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -3`
Expected: all examples pass (phq9 now uses `author` + has `instrument_id`; metadata `$ref` resolves to instrument v26.0609).
Run: `pytest tools/tests/ -q 2>&1 | tail -2`
Expected: PASS.

```bash
git add schemas/questionnaire/ schemas/instrument/
git commit -m "feat(schemas): questionnaire v26.0609 retargets instrument v26.0609 (instrument_id + author rename)"
git tag instrument-v26.0609
git tag v26.0609
```

---

## Phase C — Importer emits `instrument_id` + `variant`

### Task C1: `reconstruct()` carries the family key

**Files:**
- Modify: `library/src/library/importers/survey_db/questionnaire.py` (the `reconstruct` function)
- Test: `library/tests/unit/importers/test_questionnaire.py`

- [ ] **Step 1: Write the failing test**

Append to `library/tests/unit/importers/test_questionnaire.py`:
```python
def test_reconstruct_emits_instrument_id_and_variant():
    # the header element's header_id ('aiss') becomes the family key; variant defaults to 'base'
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"aiss_q_1": {"en"}})
    assert q["metadata"]["instrument_id"] == "inst_aiss"
    assert q["metadata"]["variant"] == "base"

def test_reconstruct_no_header_id_means_no_instrument_id():
    comps = [c for c in COMPS if c["element_type"] != "header"]  # drop the header row
    q = reconstruct("x_aiss", comps, {"survey_id": "aiss", "title": "AISS", "description": "d", "license": None},
                    release="v26.0606", imported_at="2026-06-06T00:00:00Z", prompt_langs={"aiss_q_1": {"en"}})
    assert "instrument_id" not in q["metadata"]
    assert q["metadata"]["variant"] == "base"
```
(`COMPS` / `SURVEY` are defined at the top of this test file; `COMPS` includes a header row `{element_type:'header', header_id:'aiss'}`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/unit/importers/test_questionnaire.py -q 2>&1 | tail -4`
Expected: FAIL — `instrument_id` not emitted.

- [ ] **Step 3: Emit the fields in `reconstruct`**

In `library/src/library/importers/survey_db/questionnaire.py`, find the line that computes the header/provenance (`meta["provenance"] = build_provenance(qid, (header or {}).get("header_id"), imported_at)`). Immediately **before** it, add:
```python
    hid = (header or {}).get("header_id")
    if hid:
        meta["instrument_id"] = "inst_" + _sanitize_identifier(hid)   # 'asrs' -> 'inst_asrs'
    meta["variant"] = "base"   # legacy data has no per-form labels (OD-21); real labels via hand-authoring
```
(`_sanitize_identifier` is already imported/defined in `mappers.py` and used in this module via the `from .mappers import _split` import — add `_sanitize_identifier` to that import: `from .mappers import _split, _sanitize_identifier`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/unit/importers/test_questionnaire.py -q 2>&1 | tail -3`
Expected: PASS.

- [ ] **Step 5: Run the full importer + smoke suite (re-validates all artifacts against Schema 2 v26.0609)**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_importer_run.py library/tests/unit/importers/ -q 2>&1 | tail -3`
Expected: PASS — every produced artifact validates against the new live Schema 2 (imported content has no author field, so the rename is moot).

- [ ] **Step 6: Commit**

```bash
git add library/src/library/importers/survey_db/questionnaire.py library/tests/unit/importers/test_questionnaire.py
git commit -m "feat(importer): emit instrument_id (from header_id) + variant=base"
```

---

## Phase D — Library Core: index + grouped catalogue list + facet

### Task D1: Index `instrument_id` in `catalogue_entry`

**Files:**
- Modify: `library/src/library/store/schema.sql`
- Modify: `library/src/library/store/index.py`
- Test: `library/tests/integration/test_index.py`

- [ ] **Step 1: Write the failing test**

Append to `library/tests/integration/test_index.py` (it already imports `rebuild_index_for` + builds Artifacts; mirror the existing test's setup). Add:
```python
def test_index_stores_instrument_id(conn):
    from library.loader import Artifact
    from library.store.entities import upsert_entity
    from library.store.index import rebuild_index_for
    art = Artifact(id="qst_x_asrs", version="v26.0606", entity_type="questionnaire",
                   data={"metadata": {"id": "qst_x_asrs", "version": "v26.0606", "title": "ASRS-v1.1",
                                      "description": "d", "language": "en", "instrument_id": "inst_asrs"}})
    upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, "unknown")
    row = conn.execute("SELECT instrument_id FROM catalogue_entry WHERE id='qst_x_asrs'").fetchone()
    assert row[0] == "inst_asrs"
```
(If `test_index.py`'s existing helper to build an Artifact differs, match it — the assertion is what matters: `catalogue_entry.instrument_id == "inst_asrs"`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_index.py::test_index_stores_instrument_id -q 2>&1 | tail -5`
Expected: FAIL — column `instrument_id` does not exist.

- [ ] **Step 3: Add the column + the index write**

In `library/src/library/store/schema.sql`, add `instrument_id text` to the `catalogue_entry` column list (after `effective_license text,`) and an index after the table:
```sql
CREATE INDEX IF NOT EXISTS catalogue_instrument_idx ON catalogue_entry (instrument_id);
```
In `library/src/library/store/index.py`, the `INSERT INTO catalogue_entry (...)` — add `instrument_id` to the column list and a value `m.get("instrument_id")` to the `VALUES`. (For non-questionnaire entities `m` is `{}` so it's NULL — correct.) Concretely, add `instrument_id` right after `effective_license` in both the column list and the params tuple (`m.get("instrument_id")`).

- [ ] **Step 4: Run test to verify it passes**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_index.py -q 2>&1 | tail -3`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add library/src/library/store/schema.sql library/src/library/store/index.py library/tests/integration/test_index.py
git commit -m "feat(library): index instrument_id in catalogue_entry"
```

---

### Task D2: Models + grouped query

**Files:**
- Modify: `library/src/library/models.py`
- Modify: `library/src/library/query.py`
- Test: `library/tests/integration/test_api_groups.py` (create)

- [ ] **Step 1: Write the failing test**

```python
# library/tests/integration/test_api_groups.py
from pathlib import Path
import psycopg, pytest
from library.query import list_instrument_groups
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
S = get_settings()

@pytest.fixture
def seeded(pg_url):
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(S.schemas_dir),
                    schemas_dir=S.schemas_dir, release="v26.0601")
        # two forms sharing an instrument + one singleton
        c.execute("UPDATE catalogue_entry SET instrument_id='inst_min' WHERE id='qst_min'")
        c.execute("INSERT INTO entity (id,version,entity_type,status,content_json) "
                  "VALUES ('qst_min2','v26.0601','questionnaire','published','{}')")
        c.execute("INSERT INTO catalogue_entry (id,version,entity_type,status,title,instrument_id) "
                  "VALUES ('qst_min2','v26.0601','questionnaire','published','Minimal example','inst_min')")
        c.commit()
    return pg_url

def test_groups_collapse_same_instrument(seeded):
    with psycopg.connect(seeded) as c:
        groups, total = list_instrument_groups(c, q=None, domain=None, population=None,
            language=None, license=None, instrument=None, min_items=None, max_items=None,
            sort=None, limit=20, offset=0)
    by_inst = {g["instrument_id"]: g for g in groups}
    assert "inst_min" in by_inst
    assert by_inst["inst_min"]["form_count"] == 2
    assert {f["id"] for f in by_inst["inst_min"]["forms"]} == {"qst_min", "qst_min2"}
    assert total == len(groups)

def test_singleton_when_no_instrument_id(seeded):
    with psycopg.connect(seeded) as c:
        # remove instrument grouping -> each questionnaire is its own group
        c.execute("UPDATE catalogue_entry SET instrument_id=NULL")
        c.commit()
        groups, total = list_instrument_groups(c, q=None, domain=None, population=None,
            language=None, license=None, instrument=None, min_items=None, max_items=None,
            sort=None, limit=20, offset=0)
    assert all(g["form_count"] == 1 and g["instrument_id"] is None for g in groups)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_groups.py -q 2>&1 | tail -5`
Expected: FAIL — `list_instrument_groups` does not exist (and `_CARD_COLS` lacks `instrument_id`).

- [ ] **Step 3: Add `instrument_id`/`variant` to the card select + the group models**

In `library/src/library/query.py`, extend `_CARD_COLS` and `_card_select` to include `instrument_id` and `variant`:
- Add `"instrument_id"`, `"variant"` to the end of the `_CARD_COLS` list.
- In `_card_select`, add `c.instrument_id, c.variant` to the `SELECT` column list (after `c.estimated_minutes,` and before the `domain`/`population` subqueries). *(Note: `catalogue_entry` has no `variant` column — add it.)*

Add a `variant` column too. In `library/src/library/store/schema.sql` add `variant text` after `instrument_id text`; in `store/index.py` add `variant` to the insert column list + `m.get("variant")` to the params. (Do this here so the card carries it.)

Append to `library/src/library/models.py`:
```python
class InstrumentGroup(BaseModel):
    instrument_id: str | None = None
    title: str | None = None
    form_count: int
    languages: list[str] = []
    domain: list[str] = []
    forms: list[CatalogueCard]

class PaginatedGroups(BaseModel):
    items: list[InstrumentGroup]
    total: int
    limit: int
    offset: int
```

- [ ] **Step 4: Implement `list_instrument_groups`**

Append to `library/src/library/query.py`:
```python
def _all_matching_cards(conn: psycopg.Connection, *, q, domain, population, language, license,
                        instrument, min_items, max_items, sort) -> list[dict]:
    """Every latest-published questionnaire card matching the filters (no pagination), with
    instrument_id/variant included — the grouping is done in Python (catalogue-scale data)."""
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = ["questionnaire"]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)"); params.append(q)
    if domain is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='domain' AND f.value=%s)"); params.append(domain)
    if population is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='population' AND f.value=%s)"); params.append(population)
    if language is not None:
        where.append("(c.available_languages @> ARRAY[%s] OR c.language = %s)")
        params.append(language); params.append(language)
    if license is not None:
        where.append("c.effective_license=%s"); params.append(license)
    if instrument is not None:
        where.append("c.instrument_id=%s"); params.append(instrument)
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
    rows = conn.execute(f"{_card_select(sql_where)} ORDER BY {order_by}", params + order_params).fetchall()
    return [dict(zip(_CARD_COLS, r)) for r in rows]


def list_instrument_groups(conn: psycopg.Connection, *, q, domain, population, language, license,
                           instrument, min_items, max_items, sort, limit, offset):
    """Collapse matching questionnaire forms into instrument groups. A questionnaire with no
    instrument_id is its own singleton group (grouped on COALESCE(instrument_id, id))."""
    cards = _all_matching_cards(conn, q=q, domain=domain, population=population, language=language,
                                license=license, instrument=instrument, min_items=min_items,
                                max_items=max_items, sort=sort)
    groups: dict[str, dict] = {}
    order: list[str] = []
    for c in cards:
        key = c["instrument_id"] or c["id"]
        g = groups.get(key)
        if g is None:
            g = {"instrument_id": c["instrument_id"], "title": c["title"],
                 "forms": [], "_langs": set(), "_domains": set()}
            groups[key] = g; order.append(key)
        g["forms"].append(c)
        for lang in (c.get("available_languages") or []): g["_langs"].add(lang)
        for d in (c.get("domain") or []): g["_domains"].add(d)
    out = [{"instrument_id": groups[k]["instrument_id"], "title": groups[k]["title"],
            "form_count": len(groups[k]["forms"]), "forms": groups[k]["forms"],
            "languages": sorted(groups[k]["_langs"]), "domain": sorted(groups[k]["_domains"])}
           for k in order]
    return out[offset:offset + limit], len(out)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_groups.py library/tests/integration/test_index.py -q 2>&1 | tail -3`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add library/src/library/models.py library/src/library/query.py library/src/library/store/schema.sql library/src/library/store/index.py library/tests/integration/test_api_groups.py
git commit -m "feat(library): instrument-grouped catalogue query + InstrumentGroup model"
```

---

### Task D3: Catalogue list endpoint returns groups; `instrument` facet

**Files:**
- Modify: `library/src/library/api/questionnaires.py` (the `list_questionnaires` handler)
- Modify: `library/src/library/api/search.py` (`_COLUMN_FACETS`)
- Test: `library/tests/integration/test_api_questionnaires.py`, `library/tests/integration/test_api_facets.py`

- [ ] **Step 1: Write the failing tests**

Append to `library/tests/integration/test_api_questionnaires.py`:
```python
def test_list_returns_instrument_groups(client):
    body = client.get("/v1/questionnaires").json()
    assert "items" in body and "total" in body
    g = body["items"][0]
    assert "instrument_id" in g and "form_count" in g and "forms" in g
    assert isinstance(g["forms"], list) and len(g["forms"]) == g["form_count"]
```
Append to `library/tests/integration/test_api_facets.py`:
```python
def test_instrument_facet_endpoint_ok(client):
    r = client.get("/v1/facets", params={"facet_type": "instrument"})
    assert r.status_code == 200 and r.json()["facet_type"] == "instrument"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_questionnaires.py::test_list_returns_instrument_groups library/tests/integration/test_api_facets.py::test_instrument_facet_endpoint_ok -q 2>&1 | tail -5`
Expected: FAIL — list returns flat cards; `instrument` facet 422.

- [ ] **Step 3: Return groups from the list handler**

In `library/src/library/api/questionnaires.py`, update the import and the `list_questionnaires` handler:
```python
from ..models import Paginated, EntitySummary, CatalogueCard, PaginatedCards, VersionInfo, InstrumentGroup, PaginatedGroups
```
```python
@router.get("/questionnaires", response_model=PaginatedGroups)
def list_questionnaires(
    q: str | None = None, domain: str | None = None, population: str | None = None,
    language: str | None = None, license: str | None = None, instrument: str | None = None,
    min_items: int | None = None, max_items: int | None = None, sort: str | None = None,
    limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn),
):
    groups, total = query.list_instrument_groups(
        conn, q=q, domain=domain, population=population, language=language, license=license,
        instrument=instrument, min_items=min_items, max_items=max_items, sort=sort,
        limit=limit, offset=offset,
    )
    return PaginatedGroups(
        items=[InstrumentGroup(**{**g, "forms": [CatalogueCard(**f) for f in g["forms"]]}) for g in groups],
        total=total, limit=limit, offset=offset,
    )
```

- [ ] **Step 4: Add the `instrument` column facet**

In `library/src/library/api/search.py`, add `instrument` to `_COLUMN_FACETS`:
```python
_COLUMN_FACETS = {"license": "effective_license", "instrument": "instrument_id"}
```
(The existing column-facet branch already aggregates `SELECT {col}, count(*) … WHERE status='published' AND {col} IS NOT NULL GROUP BY {col}` — `instrument_id` slots in; and the 422 allow-list message picks it up automatically.)

- [ ] **Step 5: Run tests (new + existing regressions)**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/integration/test_api_questionnaires.py library/tests/integration/test_api_facets.py library/tests/integration/test_api_cards.py -q 2>&1 | tail -4`
Expected: PASS — **note** `test_api_cards.py` asserts the OLD flat-card shape on `/v1/questionnaires`; update those assertions to read `body["items"][0]["forms"][0]` (the card now lives inside a group). Fix each failing assertion in `test_api_cards.py` to drill into `["forms"][0]`, then re-run.

- [ ] **Step 6: Full Library suite**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q 2>&1 | tail -2`
Expected: PASS (fix any remaining test that assumed the flat list shape — search/detail/versions endpoints are unchanged, so only `/v1/questionnaires` list assertions need the `["forms"]` drill-in).

- [ ] **Step 7: Commit**

```bash
git add library/src/library/api/questionnaires.py library/src/library/api/search.py library/tests/
git commit -m "feat(library): /v1/questionnaires returns instrument groups + instrument facet"
```

---

## Phase E — Web UI: collapse the catalogue

### Task E1: Types + queries for grouped results

**Files:**
- Modify: `library-web/src/api/types.ts`, `library-web/src/api/client.ts`, `library-web/src/api/queries.ts`
- Test: `library-web/src/api/client.test.ts`

- [ ] **Step 1: Write the failing test**

Append a case to `library-web/src/api/client.test.ts` (inside the existing `describe`):
```ts
  it('listQuestionnaires returns instrument groups', async () => {
    const group = { instrument_id: 'inst_asrs', title: 'ASRS-v1.1', form_count: 2, languages: ['en'], domain: ['adhd'], forms: [] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [group], total: 1, limit: 20, offset: 0 }) } as Response))
    const res = await api.listQuestionnaires({})
    expect(res.items[0].form_count).toBe(2)
    expect(res.items[0].instrument_id).toBe('inst_asrs')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- client` → FAIL (type/shape mismatch — `listQuestionnaires` still typed `Paginated<CatalogueCard>`).

- [ ] **Step 3: Add the types**

In `library-web/src/api/types.ts`: add `instrument_id: string | null` and `variant: string | null` to `CatalogueCard`; add:
```ts
export interface InstrumentGroup {
  instrument_id: string | null
  title: string | null
  form_count: number
  languages: string[]
  domain: string[]
  forms: CatalogueCard[]
}
```
In `library-web/src/api/client.ts`: change `listQuestionnaires` return type to `Paginated<InstrumentGroup>`:
```ts
  listQuestionnaires: (p: QuestionnaireQuery) =>
    get<Paginated<InstrumentGroup>>('/v1/questionnaires', p),
```
(import `InstrumentGroup` from `./types`.) Add `instrument?: string` to the `QuestionnaireQuery` type.

In `library-web/src/api/queries.ts`: `useQuestionnaires` already wraps `api.listQuestionnaires`; no signature change needed (it returns the new type via inference).

- [ ] **Step 4: Run test + build**

Run: `npm test -- client && npm run build 2>&1 | tail -2`
Expected: PASS + clean (TS picks up the new `Paginated<InstrumentGroup>`).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/api/
git commit -m "feat(library-web): typed instrument-group catalogue response"
```

---

### Task E2: Render grouped catalogue (expandable family rows)

**Files:**
- Create: `library-web/src/catalogue/CatalogueGroup.tsx`
- Modify: `library-web/src/routes/CataloguePage.tsx`, `library-web/src/catalogue/useCatalogueParams.ts` (add `instrument` facet key)
- Test: `library-web/src/catalogue/CatalogueGroup.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// library-web/src/catalogue/CatalogueGroup.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CatalogueGroup } from './CatalogueGroup'
import type { InstrumentGroup, CatalogueCard } from '../api/types'

const form = (id: string): CatalogueCard => ({
  id, version: 'v26.0606', entity_type: 'questionnaire', title: 'ASRS-v1.1', short_title: null,
  description: null, status: 'published', effective_license: 'unknown', language: 'en',
  available_languages: ['en'], item_count: 6, estimated_minutes: null, domain: ['adhd'],
  population: [], instrument_id: 'inst_asrs', variant: 'base',
})

describe('CatalogueGroup', () => {
  it('renders a single-form group as a plain row (no expander)', () => {
    const g: InstrumentGroup = { instrument_id: null, title: 'ASRS-v1.1', form_count: 1, languages: ['en'], domain: ['adhd'], forms: [form('qst_x_asrs')] }
    render(<MemoryRouter><CatalogueGroup group={g} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /ASRS-v1.1/ })).toHaveAttribute('href', '/q/qst_x_asrs')
    expect(screen.queryByRole('button', { name: /forms/i })).toBeNull()
  })

  it('collapses a multi-form group and expands to its forms on click', async () => {
    const g: InstrumentGroup = { instrument_id: 'inst_asrs', title: 'ASRS-v1.1', form_count: 2, languages: ['en'], domain: ['adhd'], forms: [form('qst_x_asrs'), form('qst_asrs_a')] }
    render(<MemoryRouter><CatalogueGroup group={g} /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: /2 forms/i })
    expect(screen.queryByText('qst_asrs_a')).toBeNull() // collapsed
    await userEvent.click(toggle)
    expect(screen.getByText('qst_x_asrs')).toBeInTheDocument()
    expect(screen.getByText('qst_asrs_a')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CatalogueGroup` → FAIL (module missing).

- [ ] **Step 3: Implement `CatalogueGroup`**

```tsx
// library-web/src/catalogue/CatalogueGroup.tsx
import { useState } from 'react'
import type { InstrumentGroup } from '../api/types'
import { ResultRow } from './ResultRow'
import { languageLabel } from '../lib/labels'

export function CatalogueGroup({ group }: { group: InstrumentGroup }) {
  const [open, setOpen] = useState(false)
  if (group.form_count === 1) return <ResultRow card={group.forms[0]} />
  return (
    <article className="border-b border-rule py-5 pl-6 pr-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span className="font-serif text-[19px] font-semibold tracking-tightish text-ink">
          {group.title ?? group.instrument_id}
        </span>
        <span className="font-sans text-sm font-medium text-accent">
          {group.form_count} forms {open ? '▾' : '▸'}
        </span>
      </button>
      <p className="mt-1 text-xs text-ink-faint">
        {group.instrument_id}
        {group.languages.length > 0 && <> · {group.languages.map(languageLabel).join(', ')}</>}
      </p>
      {open && (
        <div className="mt-2 border-l-2 border-rule pl-4">
          {group.forms.map((f) => <ResultRow key={`${f.id}@${f.version}`} card={f} />)}
        </div>
      )}
    </article>
  )
}
```

- [ ] **Step 4: Wire it into `CataloguePage`**

In `library-web/src/routes/CataloguePage.tsx`: import `CatalogueGroup`; the list currently maps `list.data.items` to `<ResultRow card={...}>` — change to map groups:
```tsx
              <div>{list.data.items.map((g) => <CatalogueGroup key={g.instrument_id ?? g.forms[0].id} group={g} />)}</div>
```
Also add an `instrument` facet group to `FACET_DEFS` (so the sidebar offers it):
```tsx
const FACET_DEFS: { key: FacetKey; title: string }[] = [
  { key: 'domain', title: 'Domain' },
  { key: 'population', title: 'Population' },
  { key: 'instrument', title: 'Instrument' },
  { key: 'language', title: 'Language' },
  { key: 'license', title: 'License' },
]
```
And in `library-web/src/catalogue/useCatalogueParams.ts`, add `'instrument'` to the `FacetKey` union and to the `CatalogueParams` reads/writes (mirror `domain`): add `instrument?: string` to `CatalogueParams`, read `sp.get('instrument')`, and the `selected` map in `CataloguePage` gains `instrument: params.instrument`. Update the `useFacets('instrument')` call + `facetData.instrument`.

(Concretely in `CataloguePage`: add `const instrumentF = useFacets('instrument')`, add `instrument: instrumentF.data?.values ?? []` to `facetData`, and `instrument: params.instrument` to the `selected` object passed to `FacetSidebar`.)

- [ ] **Step 5: Run tests + build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests " && npm run build 2>&1 | tail -2`
Expected: all PASS; build clean. **Note:** `CataloguePage.test.tsx` mocks `api.listQuestionnaires` returning flat cards — update its mock to return groups (`{ items: [{ instrument_id, title, form_count: 1, languages, domain, forms: [card] }], … }`) and adjust assertions (the card text still renders via the singleton path). Fix and re-run.

- [ ] **Step 6: Commit**

```bash
git add library-web/src/
git commit -m "feat(library-web): collapse catalogue into expandable instrument groups + instrument facet"
```

---

## Phase F — Design docs + decision record

### Task F1: OD-21 + data-model doc

**Files:**
- Modify: `design/10_open_decisions.md`, `design/05_data_model.md`

- [ ] **Step 1: Add the OD-21 entry**

In `design/10_open_decisions.md`, add a resolution-log row / entry for **OD-21 — Instrument-family grouping** (resolved 2026-06-09): first-class **optional** `instrument_id` (`^inst_[a-z0-9_]+$`) + `variant` (default `"base"`) on Schema 1 `v26.0609`; sourced from the legacy `header_id`; the catalogue **collapses** forms by family; **not** a structural Instrument entity. Schema 2 `v26.0609` retargets (bundling the `authors`→`author` rename). Match the file's existing OD entry format.

- [ ] **Step 2: Update the data-model doc**

In `design/05_data_model.md`, document `instrument_id` + `variant` in the Schema 1 metadata field list and the instrument→forms relationship; note the Schema 2 `v26.0609` retarget. Match the doc's existing style.

- [ ] **Step 3: Commit**

```bash
git add design/10_open_decisions.md design/05_data_model.md
git commit -m "docs(design): OD-21 instrument-family grouping + data-model update"
```

---

## Phase G — End-to-end verification

### Task G1: Re-seed the live stack and verify grouping

**Files:** none (verification)

- [ ] **Step 1: Re-import + re-ingest with the new importer (the live stack from this session is running on :8000/:5173)**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
source .venv/bin/activate
export DATABASE_URL="postgresql://postgres:pg@localhost:55432/library"
rm -rf /tmp/libweb_content
python -m library.cli migrate                       # picks up the new catalogue_entry columns
python -m library.cli import-survey-db survey_database/data/survey_db.sqlite --out /tmp/libweb_content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); c.execute('TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE'); c.commit()"
python -m library.cli ingest /tmp/libweb_content --release v26.0606
```
*(If `migrate` does not ALTER an existing table, drop+recreate: `python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); c.execute('DROP TABLE IF EXISTS catalogue_entry, entity_ref, facet, entity CASCADE'); c.commit()"` then `migrate` + re-ingest.)*

- [ ] **Step 2: Verify the API groups the ASRS forms**

```bash
curl -s "http://localhost:8000/v1/questionnaires?instrument=inst_asrs" | python3 -c "import sys,json; d=json.load(sys.stdin); g=d['items'][0]; print('instrument:', g['instrument_id'], '| forms:', g['form_count'], [f['id'] for f in g['forms']])"
```
Expected: `instrument: inst_asrs | forms: 4 ['qst_x_asrs','qst_asrs_a','qst_x_asrs_i','qst_x_asrs_a_i']`

Restart the API to pick up the code changes: `pkill -f 'uvicorn library.api.app'` then re-launch it (per the session's run recipe), then re-run the curl.

- [ ] **Step 3: Verify in the browser**

Open http://localhost:5173, search "ASRS" — expect **one** "ASRS-v1.1 — 4 forms" row that expands to the four forms, each linking to its own detail page (unchanged). Confirm a singleton (e.g. a non-family instrument) renders as a normal row, and the **Instrument** facet appears in the sidebar.

- [ ] **Step 4: Full test matrix**

```bash
cd library-web && npm test 2>&1 | grep -E "Tests " && npm run build 2>&1 | tail -1 && cd ..
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q 2>&1 | tail -1
pytest tools/tests/ -q 2>&1 | tail -1
```
Expected: frontend green + build clean; Library green; schema green.

- [ ] **Step 5: Commit (if any verification-driven fixes were needed)**

```bash
git add -A && git commit -m "test(instrument-id): end-to-end grouping verified against live stack" || echo "nothing to commit"
```

---

## Self-review (completed during planning)

**Spec coverage:** §2.1 Schema 1 → A1. §2.2 Schema 2 → B1. §2.3 registry → automatic (validator globs versions/); A1/B1 steps confirm. §2.4 tags → B1 step 5. §3 importer → C1. §4.1 index + facet → D1, D3. §4.2 grouped list → D2, D3. §5 web UI → E1, E2. §6 design docs → F1. §7 testing → tests in every task. §8 sequencing → phase order A→G. §9 DoD → G1.

**Placeholder scan:** the "fix the failing flat-shape assertions in `test_api_cards.py` / `CataloguePage.test.tsx`" steps (D3.5, E2.5) are real, expected breakages from the deliberate list-shape change — each says exactly what to change (drill into `["forms"][0]`), not "fix later." No TBD/placeholder code.

**Type consistency:** `instrument_id`/`variant` added to `catalogue_entry` (D1+D2), `_CARD_COLS` + `_card_select` (D2), `CatalogueCard` (TS, E1), and emitted by the importer (C1) + index (D1/D2). `InstrumentGroup`/`PaginatedGroups` defined in `models.py` (D2) and `types.ts` (E1) with matching fields (`instrument_id`, `title`, `form_count`, `languages`, `domain`, `forms`). `list_instrument_groups` signature in D2 matches its call in D3. The `instrument` facet key flows through `_COLUMN_FACETS` (D3), `FacetKey`/`useCatalogueParams` + `FACET_DEFS` (E2).

---

## Notes for the executor

- **Phase A→G order is load-bearing** — the importer/Library/UI depend on the schema bump; re-seeding (G1) needs the new `catalogue_entry` columns.
- **The list-shape change is intentional and breaking for the API** — only the web UI consumes `/v1/questionnaires`; both move together. `/v1/search`, `/versions`, `/definition`, and the detail page are untouched.
- **`variant` is `"base"` for all imported forms** — the four ASRS forms are distinguished by id + item count in the expanded family until hand-labeled (OD-21).
- Docker quirk: every `pytest library/` needs `DOCKER_CONFIG=/tmp/lib_docker`.
