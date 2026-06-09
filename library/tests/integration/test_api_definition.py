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
S = get_settings()

@pytest.fixture
def seeded(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(S.schemas_dir),
                    schemas_dir=S.schemas_dir, release="v26.0601")
        c.commit()
    return pg_url

def test_definition_download(seeded):
    client = TestClient(create_app())
    item = client.get("/v1/questionnaires").json()["items"][0]["forms"][0]
    r = client.get(f"/v1/questionnaires/{item['id']}/versions/{item['version']}/definition")
    assert r.status_code == 200
    # a questionnaire's id lives under metadata, not top-level
    assert r.json()["metadata"]["id"] == item["id"]

def test_withdrawn_definition_410(seeded):
    item = TestClient(create_app()).get("/v1/questionnaires").json()["items"][0]["forms"][0]
    with psycopg.connect(seeded) as c:
        withdraw_entity(c, item["id"], item["version"], datetime(2026, 6, 5, tzinfo=timezone.utc))
        c.commit()
    r = TestClient(create_app()).get(f"/v1/questionnaires/{item['id']}/versions/{item['version']}/definition")
    assert r.status_code == 410

def test_definition_unknown_404(seeded):
    r = TestClient(create_app()).get("/v1/questionnaires/qst_nope/versions/v26.0601/definition")
    assert r.status_code == 404

def test_withdrawn_excluded_from_listing(seeded):
    item = TestClient(create_app()).get("/v1/questionnaires").json()["items"][0]["forms"][0]
    with psycopg.connect(seeded) as c:
        withdraw_entity(c, item["id"], item["version"], datetime(2026, 6, 5, tzinfo=timezone.utc))
        c.commit()
    listed = TestClient(create_app()).get("/v1/questionnaires").json()
    assert all(f["id"] != item["id"] for g in listed["items"] for f in g["forms"])
