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

def test_language_facet_counts_available_languages(client):
    # qst_min is available in en + pt -> the facet surfaces pt too (not just the primary 'en').
    vals = {v["value"] for v in client.get("/v1/facets", params={"facet_type": "language"}).json()["values"]}
    assert "pt" in vals

def test_license_facet_endpoint_ok(client):
    r = client.get("/v1/facets", params={"facet_type": "license"})
    assert r.status_code == 200
    assert r.json()["facet_type"] == "license"

def test_unknown_facet_still_422(client):
    r = client.get("/v1/facets", params={"facet_type": "nope"})
    assert r.status_code == 422
