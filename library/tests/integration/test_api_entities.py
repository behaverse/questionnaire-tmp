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

def test_list_entities_by_type(client):
    r = client.get("/v1/entities/prompt")
    assert r.status_code == 200 and r.json()["total"] >= 1

def test_unknown_type_404(client):
    assert client.get("/v1/entities/notatype").status_code == 404

def test_dependents(client):
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/{opt['version']}/dependents")
    assert r.status_code == 200
    assert any(d["id"].startswith("it_") or d["id"].startswith("qst_") for d in r.json()["items"])

def test_entity_detail_latest(client):
    """GET /v1/entities/{etype}/{eid} returns latest published version."""
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == opt["id"]
    assert body["entity_type"] == "option"

def test_entity_detail_specific_version(client):
    """GET /v1/entities/{etype}/{eid}/versions/{version} returns that version's summary."""
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/{opt['version']}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == opt["id"]
    assert body["version"] == opt["version"]

def test_entity_detail_unknown_id_404(client):
    r = client.get("/v1/entities/option/opt_does_not_exist")
    assert r.status_code == 404

def test_entity_version_unknown_404(client):
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/v00.0000")
    assert r.status_code == 404

def test_alias_questions(client):
    """GET /v1/questions is an alias for GET /v1/entities/question."""
    r_alias = client.get("/v1/questions")
    r_direct = client.get("/v1/entities/question")
    assert r_alias.status_code == 200
    assert r_alias.json()["total"] == r_direct.json()["total"]

def test_alias_options(client):
    """GET /v1/options is an alias for GET /v1/entities/option."""
    r_alias = client.get("/v1/options")
    r_direct = client.get("/v1/entities/option")
    assert r_alias.status_code == 200
    assert r_alias.json()["total"] == r_direct.json()["total"]

def test_entity_definition_returns_body(client):
    """GET /v1/entities/{etype}/{eid}/versions/{version}/definition returns content_json."""
    opt = client.get("/v1/entities/option").json()["items"][0]
    r = client.get(f"/v1/entities/option/{opt['id']}/versions/{opt['version']}/definition")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == opt["id"]
    assert body["input_data_type"]  # an Option body carries its structural fields

def test_entity_definition_404_unknown(client):
    assert client.get("/v1/entities/option/opt_nope/versions/v26.0601/definition").status_code == 404
    assert client.get("/v1/entities/notatype/x/versions/v26.0601/definition").status_code == 404
