import psycopg
from psycopg.types.json import Jsonb
import viewer_service.runtime as runtime_mod
from viewer_service import replay as replay_svc
from viewer_service.store import sessions as sstore
from test_sessions_api import MANIFEST, BUNDLE


def _deploy_and_session(client, monkeypatch, pg_url):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    with psycopg.connect(pg_url) as c:
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'events',%s,'he')",
                  (s["session_id"], Jsonb({"batch_id": "b", "events": [{"verb": "bdm:started"}, {"verb": "bdm:submitted"}]})))
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'recording',%s,'hr')",
                  (s["session_id"], Jsonb({"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]})))
        c.commit()
    return dep["deployment_id"], s["session_id"]


def test_build_replay_bundle(client, monkeypatch, pg_url):
    dep_id, sid = _deploy_and_session(client, monkeypatch, pg_url)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    with psycopg.connect(pg_url) as c:
        session = sstore.get_session(c, sid)
        bundle = replay_svc.build_replay_bundle(c, session)
    assert set(bundle) == {"runtime", "statements", "mouse"}
    assert bundle["runtime"]["metadata"]["id"] == "qst_mini"
    assert [s["verb"] for s in bundle["statements"]] == ["bdm:started", "bdm:submitted"]
    assert bundle["mouse"] == [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]
