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

def test_instrument_facet_endpoint_ok(client):
    r = client.get("/v1/facets", params={"facet_type": "instrument"})
    assert r.status_code == 200 and r.json()["facet_type"] == "instrument"

def test_instrument_facet_labels_by_title(client, pg_url):
    # the instrument facet labels each family by its (shared) title, so the UI shows the
    # instrument name (e.g. "Attentional Control Scale") instead of the inst_* slug.
    import psycopg
    with psycopg.connect(pg_url) as c:
        c.execute(
            "UPDATE catalogue_entry SET instrument_id='inst_acs', title='Attentional Control Scale' "
            "WHERE entity_type='questionnaire' "
            "AND id IN (SELECT id FROM catalogue_entry WHERE entity_type='questionnaire' LIMIT 1)")
        c.commit()
    body = client.get("/v1/facets", params={"facet_type": "instrument"}).json()
    match = [v for v in body["values"] if v["value"] == "inst_acs"]
    assert match and match[0]["label"] == "Attentional Control Scale"
