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

def test_list_questionnaires(client):
    r = client.get("/v1/questionnaires")
    assert r.status_code == 200
    body = r.json()
    assert "items" in body and body["total"] >= 1

def test_detail_and_versions(client):
    qid = client.get("/v1/questionnaires").json()["items"][0]["forms"][0]["id"]
    assert client.get(f"/v1/questionnaires/{qid}").status_code == 200
    vr = client.get(f"/v1/questionnaires/{qid}/versions")
    assert vr.status_code == 200 and len(vr.json()) >= 1

def test_unknown_404(client):
    assert client.get("/v1/questionnaires/qst_nope").status_code == 404

def test_404_uses_error_envelope(client):
    r = client.get("/v1/questionnaires/qst_nope")
    assert r.status_code == 404
    body = r.json()
    assert body["error"]["code"] == "not_found" and "message" in body["error"]

def test_specific_version(client):
    """GET /v1/questionnaires/{qid}/versions/{version} returns that version's EntitySummary."""
    qid = client.get("/v1/questionnaires").json()["items"][0]["forms"][0]["id"]
    vs = client.get(f"/v1/questionnaires/{qid}/versions").json()
    version = vs[0]["version"]
    r = client.get(f"/v1/questionnaires/{qid}/versions/{version}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == qid and body["version"] == version

def test_specific_version_404(client):
    """Non-existent version returns 404."""
    qid = client.get("/v1/questionnaires").json()["items"][0]["forms"][0]["id"]
    r = client.get(f"/v1/questionnaires/{qid}/versions/v00.0000")
    assert r.status_code == 404

def test_filter_domain_match(client):
    """domain=wellbeing should return qst_min (enriched fixture)."""
    r = client.get("/v1/questionnaires", params={"domain": "wellbeing"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert any(f["id"] == "qst_min" for g in body["items"] for f in g["forms"])

def test_filter_domain_no_match(client):
    """domain=nonexistent should return empty list."""
    r = client.get("/v1/questionnaires", params={"domain": "nonexistent"})
    assert r.status_code == 200
    assert r.json()["total"] == 0

def test_filter_language(client):
    """language=en should return qst_min."""
    r = client.get("/v1/questionnaires", params={"language": "en"})
    assert r.status_code == 200
    assert r.json()["total"] >= 1
    assert any(f["id"] == "qst_min" for g in r.json()["items"] for f in g["forms"])

def test_filter_by_available_language(client):
    """language=pt should return qst_min via available_languages (its primary language is en)."""
    r = client.get("/v1/questionnaires", params={"language": "pt"})
    assert r.status_code == 200
    assert any(f["id"] == "qst_min" for g in r.json()["items"] for f in g["forms"])

def test_filter_min_items_excludes(client):
    """min_items=5 should exclude qst_min (item_count=1)."""
    r = client.get("/v1/questionnaires", params={"min_items": 5})
    assert r.status_code == 200
    assert all(f["id"] != "qst_min" for g in r.json()["items"] for f in g["forms"])

def test_sort_title(client):
    """sort=title should succeed and return results."""
    r = client.get("/v1/questionnaires", params={"sort": "title"})
    assert r.status_code == 200
    assert "items" in r.json()

def test_list_returns_instrument_groups(client):
    body = client.get("/v1/questionnaires").json()
    assert "items" in body and "total" in body
    g = body["items"][0]
    assert "instrument_id" in g and "form_count" in g and "forms" in g
    assert isinstance(g["forms"], list) and len(g["forms"]) == g["form_count"]

def test_group_form_count_matches_forms_length(client):
    body = client.get("/v1/questionnaires").json()
    for g in body["items"]:
        assert g["form_count"] == len(g["forms"])
        assert g["form_count"] >= 1
