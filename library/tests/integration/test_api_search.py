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

def test_search_returns_results(client):
    r = client.get("/v1/search", params={"q": "Minimal"})  # in qst_min's title
    assert r.status_code == 200 and r.json()["total"] >= 1

def test_facets_endpoint(client):
    r = client.get("/v1/facets", params={"facet_type": "domain"})
    assert r.status_code == 200 and "values" in r.json()
