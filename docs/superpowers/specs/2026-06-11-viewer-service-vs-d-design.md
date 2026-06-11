# Viewer Service VS-D (Response Export / CSV Serializer) — Design Spec

**Date drafted:** 2026-06-11
**Author:** Viewer Service VS-D brainstorming session (2026-06-11)
**Component:** **Viewer Service**, sub-project **VS-D** — the **response export / CSV serializer** (UC-11). The remaining additive Viewer Service surfaces were split: **VS-D** (this — CSV export; the Phase-2-gate-blocking deliverable) and **VS-E** (monitoring dashboard UC-12 + theme infrastructure UC-13-infra). Reconciliation + the `validated` session state are **deferred** (reconciliation needs a Behaverse query endpoint that doesn't exist yet; `validated` is a no-op stub for MVP).
**Target repo:** `questionnaire-viewer-service` — VS-D **extends the existing `viewer-service/` package** (VS-A runtime core ✅ + VS-B sessions/submission/forwarding ✅ + VS-C deployment management ✅).
**Stack:** Python 3.12 · FastAPI (`StreamingResponse`) · PostgreSQL (psycopg 3) · stdlib `csv` + `json` · pytest + testcontainers. (No new deps.)
**Authoritative source documents:**

- [plan/03_use_case_priority.md](../../../plan/03_use_case_priority.md) — UC-11 (Phase 2): researchers export collected response data.
- [plan/01_roadmap.md](../../../plan/01_roadmap.md) §"Phase 2" — the "CSV serializer" deliverable + the gate (UC-11 satisfied).
- **OD-17** + [design/05c_bdm_alignment.md](../../../design/05c_bdm_alignment.md) + [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 5" — Schema 5 is the strict BDM Response trial table; CSV is BDM-native, one-row-per-response; CSV is the Phase-2 format (Parquet/SPSS/R/JSON + codebook are later).
- [schemas/response/schema.json](../../../schemas/response/schema.json) — Schema 5; `$defs.Response` has **72 properties** (the fixed CSV column set, in declared order); `$defs.ResponseSet = {session_id, responses[]}`.
- [docs/superpowers/specs/2026-06-10-viewer-service-vs-b-design.md](2026-06-10-viewer-service-vs-b-design.md) — VS-B's `outbox` (holds the Schema 5 `responses` payloads VS-D reads).

**VS-D** adds a researcher export path to the Viewer Service: `GET /v1/deployments/{id}/export.csv` streams a **BDM-native CSV** of every collected response for a deployment — read from the VS-B `outbox`, flattened from Schema 5 `ResponseSet`/`Response` payloads, with a fixed 72-column header derived from the Schema 5 `Response` definition.

---

## 1 — Scope

### 1.1 In scope
- **`export_csv.py`** (pure): `response_columns(schemas_dir) -> list[str]` returns the 72 `Response` property names in schema-declared order (read from `schemas/response/schema.json` `$defs.Response.properties`; cached). `to_csv(rows, columns) -> Iterator[str]` yields RFC-4180 CSV lines (header first), rendering each cell via `_cell(v)`: `None` → `""`, `dict`/`list` → `json.dumps(v)`, scalar → `str(v)`.
- **`store/export.py`**: `iter_response_rows(conn, deployment_id) -> Iterator[dict]` — streams `outbox.payload` rows for the deployment (`JOIN session USING session_id WHERE deployment_id=? AND kind='responses' ORDER BY outbox.id`), flattening each payload: a `ResponseSet` (`{session_id, responses[]}`) yields each of `responses`; a bare `Response` (no `responses` key) yields itself.
- **`api/export.py`**: `GET /v1/deployments/{id}/export.csv` → **404** if the deployment is unknown, else a `StreamingResponse` (`media_type="text/csv"`, `Content-Disposition: attachment; filename=<id>_responses.csv`). Registered in `app.py`.
- **All collected responses** for the deployment are exported regardless of session status or forwarding status (delivery state ≠ data validity). Demo/ephemeral data is naturally absent (it never reached the outbox).
- **Streaming, own-connection:** the route uses the request-scoped `Depends(get_conn)` only for the 404 check; the `StreamingResponse` generator opens + `with`-closes its **own** connection for the stream (avoids the FastAPI yield-dependency-vs-streaming lifecycle pitfall).

### 1.2 Non-goals (deferred to VS-E / later)
- **No monitoring dashboard** (UC-12) and **no theme infrastructure** (UC-13) — VS-E.
- **No reconciliation, no `validated` state transition** — reconciliation is blocked on a non-existent Behaverse query endpoint; `validated` is a no-op stub. Both deferred.
- **No events export** — UC-11/this surface is response data (Schema 5) only; Schema 4a events export is later.
- **No codebook, no non-CSV formats** — Parquet / SPSS `.sav` / R `.rds` / JSON + the accompanying codebook are post-MVP (OD-17 / 05_data_model lists CSV as the Phase-2 format).
- **No per-session export endpoint, no filtering/aggregation UI** — a whole-deployment raw tabular dump is the Phase-2 bar.

---

## 2 — Module layout (additions to `viewer-service/`)

```
viewer-service/src/viewer_service/
├── export_csv.py             # NEW: response_columns(schemas_dir) + to_csv(rows, columns) + _cell
├── store/
│   └── export.py             # NEW: iter_response_rows(conn, deployment_id)
└── api/
    ├── app.py                # (modify) register the export router
    └── export.py             # NEW: GET /deployments/{id}/export.csv
tests/
├── test_export_csv.py        # columns + to_csv (pure unit)
├── test_export_store.py      # iter_response_rows (testcontainers)
└── test_export_api.py        # end-to-end export endpoint (testcontainers + TestClient)
```

---

## 3 — CSV serialization (`export_csv.py`)

```python
import csv, io, json
from functools import lru_cache
from pathlib import Path

@lru_cache(maxsize=4)
def response_columns(schemas_dir_str: str) -> tuple[str, ...]:
    schema = json.loads((Path(schemas_dir_str) / "response" / "schema.json").read_text())
    return tuple(schema["$defs"]["Response"]["properties"].keys())   # 72, in declared order

def _cell(v):
    if v is None: return ""
    if isinstance(v, (dict, list)): return json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    return str(v)

def to_csv(rows, columns) -> Iterator[str]:
    buf = io.StringIO(); w = csv.writer(buf)
    w.writerow(columns); yield _flush(buf)
    for row in rows:
        w.writerow([_cell(row.get(c)) for c in columns]); yield _flush(buf)
```

- `response_columns` derives the fixed column set from the schema, so it stays in sync with Schema 5 / BDM (no hardcoded list). Caller passes `str(get_settings().schemas_dir)`.
- `_cell`: scalars via `str()` (so `True`→`"True"`, ints/floats/timestamps as-is); objects/arrays JSON-encoded into one cell; `None`/absent → empty. Python's `csv.writer` handles RFC-4180 quoting/escaping.
- `to_csv` is a generator (one `csv.writer` over a reused `StringIO`, truncated per row) → constant-memory streaming.

## 4 — Export query (`store/export.py`)

```python
def iter_response_rows(conn, deployment_id: str) -> Iterator[dict]:
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.deployment_id = %s AND o.kind = 'responses' ORDER BY o.id", (deployment_id,))
    for (payload,) in cur:
        if isinstance(payload, dict) and "responses" in payload:   # Schema 5 ResponseSet
            yield from payload["responses"]
        else:                                                       # bare Response
            yield payload
```

- Reads only `kind='responses'` rows (ignores `events`), scoped to the deployment's sessions, ordered by insertion. Demo/ephemeral sessions have no outbox rows → naturally excluded.
- Handles both Schema 5 `oneOf` shapes (`ResponseSet` and bare `Response`). For MVP this iterates the result set; a server-side cursor / `fetchmany` batching is a later optimisation if deployments grow large (noted in FOLLOWUPS).

## 5 — Export endpoint (`api/export.py`)

```python
@router.get("/deployments/{deployment_id}/export.csv")
def export(deployment_id: str, conn=Depends(get_conn)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    columns = export_csv.response_columns(str(get_settings().schemas_dir))

    def stream():
        with psycopg.connect(get_settings().database_url) as c:    # own connection for the stream
            yield from export_csv.to_csv(export_store.iter_response_rows(c, deployment_id), columns)

    return StreamingResponse(stream(), media_type="text/csv", headers={
        "Content-Disposition": f'attachment; filename="{deployment_id}_responses.csv"'})
```

Registered in `app.py` (`from . import ... export` + `app.include_router(export.router, prefix="/v1")`).

## 6 — Error handling

| Condition | HTTP |
|---|---|
| Unknown deployment | 404 `not_found` |
| Deployment with no collected responses | 200 — CSV with the header row only |

(No auth — consistent with the rest of VS-A/B/C; gated when Identity lands.)

## 7 — Testing (TDD)

- **`export_csv` (pure unit):** `response_columns(schemas_dir)` returns 72 names, first == `response_id`, last == `extensions`; `to_csv` emits the header line then one line per row; `_cell` renders `None`→empty, a dict→JSON string, scalars→str; a row missing optional columns → empty cells (fixed header preserved).
- **`iter_response_rows` (testcontainers):** insert a `session` (deployment_id=X) + `outbox` rows — a `ResponseSet` payload with 2 responses + a bare `Response` payload + an `events` row → yields the 2 + 1 = 3 Response dicts, skips the event; a different deployment's rows are excluded.
- **Export endpoint (testcontainers + TestClient):** register viewer + create deployment (anonymous_link) + mint session + `POST /responses` (real persisted path → outbox) → `GET /deployments/{id}/export.csv` returns 200, `text/csv`, `Content-Disposition` attachment; first body line == comma-joined columns; one data row with the submitted response's values in the right columns. Unknown deployment → 404. Deployment with no responses → header-only body.
- **Verification gate** (run each suite separately): `viewer-service/` green (VS-A+B+C+D); `library/` 126; `questionnaire-runtime-denormaliser/` 56; `tools/tests` 309.

---

## 8 — Decisions locked in this session (2026-06-11)

| # | Decision | Choice |
|---|---|---|
| D1 | VS-D scope | **CSV export only** (gate-blocking); dashboard + theming → VS-E; reconciliation/`validated` deferred. |
| D2 | Non-scalar cells | **JSON-encode** object/array fields into their single cell (lossless). |
| D3 | Column set | **Fixed full BDM column set** = the 72 Schema 5 `Response` properties in schema order; derived from the schema (not hardcoded); absent fields → empty. |
| D4 | Export scope | **Whole deployment, all responses** regardless of session/forwarding status; reads the VS-B outbox; demo/ephemeral excluded (no outbox rows); events excluded. |
| D5 | Delivery | `StreamingResponse` (`text/csv` attachment); the stream generator opens its **own** DB connection (request-scoped conn only used for the 404 check). |
| D6 | Formats | CSV only for Phase 2; Parquet/SPSS/R/JSON + codebook deferred. |
