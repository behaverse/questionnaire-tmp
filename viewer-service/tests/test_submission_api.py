import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE  # top-level import (pytest prepend mode; no tests/__init__.py)


@pytest.fixture
def session(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return client, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


# A minimal valid Schema 5 ResponseSet: one Response with EXACTLY the 12 required fields
# (Response has additionalProperties:false, so include only defined keys).
def _response_set(sid):
    return {"session_id": sid, "responses": [{
        "response_id": 1, "agent_id": "a1", "session_index": 1, "instrument_id": "qst_mini",
        "multitask_type": "", "block_index": 1, "block_type": "instruction",
        "transformation_name": "identity", "trial_index": "0",
        "trial_start_datetime": "2026-06-10T12:00:00Z", "stimulus_id": "it_1",
        "stimulus_type": "instruction"}]}


def test_submit_responses_enqueues(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 202, r.text
    assert "enqueued" in r.json()
    counts = client.get(f"/v1/sessions/{sid}", headers=h).json()["outbox"]
    assert counts["pending"] == 1


def test_submit_invalid_responses_422(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/responses", json={"not": "valid"}, headers=h)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_submission"


def test_submit_requires_token(session):
    client, sid, h = session
    assert client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid)).status_code == 401


def test_complete_marks_submitted(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/complete", headers=h)
    assert r.status_code == 200
    assert client.get(f"/v1/sessions/{sid}", headers=h).json()["status"] == "submitted"


def test_hard_cap_returns_503(session, monkeypatch):
    client, sid, h = session
    from viewer_service import submission as sub_mod
    monkeypatch.setattr(sub_mod, "_depth", lambda conn: 10**9)  # force over hard cap
    r = client.post(f"/v1/sessions/{sid}/responses", json=_response_set(sid), headers=h)
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "service_unavailable"
