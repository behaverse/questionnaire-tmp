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


def _stub_bundle(monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)


def test_dedicated_secret_rotation_invalidates(client, monkeypatch):
    monkeypatch.setenv("REPLAY_SIGNING_SECRET", "replay-secret-1")
    dep_id, sid = _setup(client, monkeypatch)
    tok = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok}").status_code == 200
    monkeypatch.setenv("REPLAY_SIGNING_SECRET", "replay-secret-2")   # rotate
    assert client.get(f"/v1/replay?token={tok}").status_code == 401


def test_revoke_then_remint(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    tok1 = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok1}").status_code == 200
    r = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link/revoke")
    assert r.status_code == 200 and r.json()["revoked_at"]
    assert client.get(f"/v1/replay?token={tok1}").status_code == 401       # revoked
    tok2 = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok2}").status_code == 200       # re-mint works


def test_revoke_requires_researcher(client, monkeypatch, auth_header):
    dep_id, sid = _setup(client, monkeypatch)
    assert client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link/revoke",
                       headers=auth_header(["participant"])).status_code == 403


def test_revoke_unknown_404(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    assert client.post(f"/v1/deployments/nope/sessions/{sid}/replay-link/revoke").status_code == 404
    assert client.post(f"/v1/deployments/{dep_id}/sessions/sess_nope/replay-link/revoke").status_code == 404


def test_revoke_is_per_session(client, monkeypatch):
    dep_id, sid_a = _setup(client, monkeypatch)
    sid_b = client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"}).json()["session_id"]
    tok_b = client.post(f"/v1/deployments/{dep_id}/sessions/{sid_b}/replay-link").json()["token"]
    client.post(f"/v1/deployments/{dep_id}/sessions/{sid_a}/replay-link/revoke")
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok_b}").status_code == 200      # B unaffected
