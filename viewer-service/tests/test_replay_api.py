import psycopg
from psycopg.types.json import Jsonb
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _setup(client, monkeypatch, pg_url):
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
                  (s["session_id"], Jsonb({"batch_id": "b", "events": [{"verb": "bdm:started"}]})))
        c.commit()
    return dep["deployment_id"], s["session_id"]


def test_mint_then_fetch_bundle(client, monkeypatch, pg_url):
    dep_id, sid = _setup(client, monkeypatch, pg_url)
    # researcher mints (client default headers carry the researcher role)
    r = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link")
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert r.json()["bundle_url"].endswith(f"/v1/replay?token={token}")

    # unauthenticated bundle fetch with the token (re-stub the bundle for the runtime mint)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    g = client.get(f"/v1/replay?token={token}")
    assert g.status_code == 200, g.text
    b = g.json()
    assert set(b) == {"runtime", "statements", "mouse"}
    assert b["runtime"]["metadata"]["id"] == "qst_mini"
    assert [s["verb"] for s in b["statements"]] == ["bdm:started"]


def test_mint_requires_researcher(client, monkeypatch, pg_url, auth_header):
    dep_id, sid = _setup(client, monkeypatch, pg_url)
    assert client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link",
                       headers=auth_header(["participant"])).status_code == 403


def test_mint_unknown_deployment_404(client):
    assert client.post("/v1/deployments/nope/sessions/s/replay-link").status_code == 404


def test_mint_foreign_session_404(client, monkeypatch, pg_url):
    dep_id, _sid = _setup(client, monkeypatch, pg_url)
    # a session id that does not belong to dep_id
    assert client.post(f"/v1/deployments/{dep_id}/sessions/sess_not_here/replay-link").status_code == 404


def test_bundle_bad_token_401(client):
    assert client.get("/v1/replay?token=garbage").status_code == 401
