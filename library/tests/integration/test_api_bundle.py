from pathlib import Path
import psycopg, pytest
from fastapi.testclient import TestClient
from psycopg.types.json import Jsonb
from library.api.app import create_app
from library.api.resolve import build_resolution_bundle
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


def test_bundle_keeps_definition_refs_and_collects_entities(client):
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/resolution-bundle")
    assert r.status_code == 200
    body = r.json()
    prompt = body["definition"]["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt == {"ref": "pr_aiss_q_2@v26.0601"}
    assert "pr_aiss_q_2@v26.0601" in body["entities"]
    assert body["entities"]["pr_aiss_q_2@v26.0601"]["content"]["en"]["text"].startswith("When the water is very cold")


def test_bundle_unknown_is_404(client):
    r = client.get("/v1/questionnaires/qst_nope/versions/v26.0601/resolution-bundle")
    assert r.status_code == 404


def test_bundle_withdrawn_is_410(client, pg_url):
    from datetime import datetime, timezone
    from library.store.entities import withdraw_entity
    with psycopg.connect(pg_url) as c:
        withdraw_entity(c, "qst_min", "v26.0601", datetime(2026, 6, 7, tzinfo=timezone.utc))
        c.commit()
    r = client.get("/v1/questionnaires/qst_min/versions/v26.0601/resolution-bundle")
    assert r.status_code == 410


def test_build_bundle_collects_scorer_bodies(conn):
    conn.execute(
        "INSERT INTO entity (id, version, entity_type, content_json) VALUES (%s,%s,%s,%s)",
        ("scr_demo", "v26.0609", "scorer",
         Jsonb({"id": "scr_demo", "implementations": [{"kind": "wasm", "url": "https://x/s.wasm", "sha256": "a" * 64}]})),
    )
    conn.commit()
    definition = {
        "metadata": {"id": "qst_s", "version": "v26.0609", "title": "S", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": []}],
        "scores": [{"id": "tot", "scorer": "scr_demo@v26.0609", "path": "/total"}],
    }
    bundle = build_resolution_bundle(conn, definition)
    assert "scr_demo@v26.0609" in bundle["entities"]
    assert bundle["entities"]["scr_demo@v26.0609"]["implementations"][0]["kind"] == "wasm"


def test_build_bundle_omits_missing_entities(conn):
    definition = {"metadata": {"id": "qst_x"}, "pages": [{"id": "p", "elements": [
        {"question": {"prompt": {"ref": "pr_ghost@v26.0609"}}}]}]}
    bundle = build_resolution_bundle(conn, definition)
    assert bundle["entities"] == {}
    assert bundle["definition"] == definition
