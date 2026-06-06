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
    qid = client.get("/v1/questionnaires").json()["items"][0]["id"]
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
