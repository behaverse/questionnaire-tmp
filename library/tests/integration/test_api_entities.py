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
