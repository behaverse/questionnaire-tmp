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
    body = client.get("/v1/questionnaires").json()
    card = next(f for g in body["items"] for f in g["forms"] if f["id"] == "qst_min")
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
    assert card["language"] == "en"
    assert card["population"] == ["adults"]

def test_list_filters_still_work(client):
    body = client.get("/v1/questionnaires", params={"domain": "wellbeing"}).json()
    assert any(f["id"] == "qst_min" for g in body["items"] for f in g["forms"])
    assert client.get("/v1/questionnaires", params={"min_items": 5}).json()["total"] == 0
