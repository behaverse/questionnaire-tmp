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

def test_versions_carry_status_and_date(client):
    vs = client.get("/v1/questionnaires/qst_min/versions").json()
    assert len(vs) >= 1
    v = vs[0]
    assert v["version"] == "v26.0601"
    assert v["status"] == "published"
    assert "severity" in v          # may be null
    assert v["date"] is not None    # ISO date from ingested_at

def test_versions_unknown_404(client):
    assert client.get("/v1/questionnaires/qst_nope/versions").status_code == 404
