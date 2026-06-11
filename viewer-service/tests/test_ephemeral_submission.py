import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE
from test_submission_api import _response_set  # reuse the valid Schema 5 fixture


@pytest.fixture
def demo_session(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609", "mode_preset": "demo",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()["deployment_id"]
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return client, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


def test_ephemeral_responses_accepted_but_not_enqueued(demo_session):
    client, sid, h = demo_session
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 202
    assert r.json() == {"ephemeral": True}
    # nothing queued — verify via a fresh connection to the test DB
    from viewer_service.store import outbox
    import psycopg, os
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        assert outbox.counts_for_session(c, sid) == {"pending": 0, "forwarded": 0, "failed": 0}


def test_ephemeral_invalid_submission_still_422(demo_session):
    client, sid, h = demo_session
    r = client.post(f"/v1/sessions/{sid}/responses", json={"bad": 1}, headers=h)
    assert r.status_code == 422
