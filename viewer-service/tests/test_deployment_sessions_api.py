import psycopg
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return dep["deployment_id"], s["session_id"]


def test_researcher_lists_deployment_sessions_without_token_hash(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    r = client.get(f"/v1/deployments/{dep_id}/sessions")
    assert r.status_code == 200, r.text
    body = r.json()
    assert [s["session_id"] for s in body["sessions"]] == [sid]
    row = body["sessions"][0]
    assert set(row) == {"session_id", "session_index", "status", "participant_sub",
                        "started_at", "completed_at", "submitted_at"}
    assert "token_hash" not in row


def test_sessions_requires_researcher(client, monkeypatch, auth_header):
    dep_id, _ = _setup(client, monkeypatch)
    assert client.get(f"/v1/deployments/{dep_id}/sessions",
                      headers=auth_header(["participant"])).status_code == 403


def test_sessions_unknown_deployment_404(client):
    assert client.get("/v1/deployments/nope/sessions").status_code == 404


def test_sessions_scoped_to_deployment(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    other = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()["deployment_id"]
    r = client.get(f"/v1/deployments/{other}/sessions")
    assert r.status_code == 200
    assert r.json()["sessions"] == []   # the session belongs to dep_id, not `other`
