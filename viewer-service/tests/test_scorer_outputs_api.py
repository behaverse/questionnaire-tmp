import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


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


@pytest.fixture
def ephemeral_session(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609", "mode_preset": "demo",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()["deployment_id"]
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return client, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


_VALID_OUTPUTS = {"scr_phq9@v26.0602": {"total": 12, "severity": "moderate"}}


def test_stores_valid_scorer_outputs(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json=_VALID_OUTPUTS, headers=h)
    assert r.status_code in (200, 202), r.text
    g = client.get(f"/v1/sessions/{sid}", headers=h)
    assert g.status_code == 200, g.text
    assert g.json()["scorer_outputs"] == _VALID_OUTPUTS


def test_rejects_non_schema6_body(session):
    client, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json={"bad key": {"x": 1}}, headers=h)
    assert r.status_code == 422


def test_stores_x_score_display_sidecar(session):
    client, sid, h = session
    body = {**_VALID_OUTPUTS, "x_score_display": [{"id": "scr_phq9", "name": "PHQ-9", "value": 12}]}
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json=body, headers=h)
    assert r.status_code in (200, 202), r.text
    import psycopg, os
    from viewer_service.store import sessions as session_store
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        row = session_store.get_session(c, sid)
        assert row["scorer_outputs"] == _VALID_OUTPUTS              # sidecar stripped before validation
        assert row["score_display"] == [{"id": "scr_phq9", "name": "PHQ-9", "value": 12}]


def test_ephemeral_validates_but_skips_store(ephemeral_session):
    client, sid, h = ephemeral_session
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json=_VALID_OUTPUTS, headers=h)
    assert r.status_code in (200, 202), r.text
    # ephemeral sessions return 409 on GET — check scorer_outputs is not stored
    # by inspecting directly via store
    import psycopg, os
    from viewer_service.store import sessions as session_store
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        row = session_store.get_session(c, sid)
        assert row["scorer_outputs"] is None
