from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from library.api.app import create_app
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
S = get_settings()

def test_dod_end_to_end(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    reg = build_registry(S.schemas_dir)
    with psycopg.connect(pg_url) as c:
        rep1 = ingest_tree(c, FIXTURE, "c1", registry=reg, schemas_dir=S.schemas_dir, release="v26.0601"); c.commit()
        rep2 = ingest_tree(c, FIXTURE, "c2", registry=reg, schemas_dir=S.schemas_dir, release="v26.0601"); c.commit()
    assert rep1.errors == [] and rep2.ingested == 0
    client = TestClient(create_app())
    assert client.get("/v1/questionnaires").json()["total"] >= 1
    assert client.get("/v1/search", params={"q": "Minimal"}).status_code == 200
    # interactive docs / OpenAPI schema are gated off by default (ENABLE_DOCS unset) in prod
    assert client.get("/openapi.json").status_code == 404
