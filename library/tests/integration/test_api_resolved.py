# library/tests/integration/test_api_resolved.py
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

def test_raw_definition_keeps_refs(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition")
    assert r.status_code == 200
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt == {"ref": "pr_aiss_q_2@v26.0601"}  # untouched

def test_resolved_inlines_prompt_text(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    assert r.status_code == 200
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["ref"] == "pr_aiss_q_2@v26.0601"            # ref preserved
    assert prompt["content"]["en"]["text"].startswith("When the water is very cold")

def test_resolved_unknown_ref_marks_unresolved(client, pg_url):
    # repoint the prompt ref at a missing entity to exercise the fallback
    with psycopg.connect(pg_url) as c:
        c.execute("UPDATE entity SET content_json = jsonb_set(content_json, "
                  "'{pages,0,elements,0,question,prompt,ref}', '\"pr_missing@v26.0601\"') "
                  "WHERE id='qst_min'")
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    prompt = r.json()["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["_unresolved"] is True

def test_resolved_withdrawn_still_410(client, pg_url):
    from datetime import datetime, timezone
    from library.store.entities import withdraw_entity
    with psycopg.connect(pg_url) as c:
        withdraw_entity(c, "qst_min", "v26.0601", datetime(2026, 6, 7, tzinfo=timezone.utc))
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/definition",
                   params={"resolved": "true"})
    assert r.status_code == 410
