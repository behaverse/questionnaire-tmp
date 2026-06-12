"""Tests that session mint and GET expose agent_id + session_index (WV-B additive)."""
import pytest
import viewer_service.runtime as runtime_mod

MANIFEST = {
    "viewer_id": "web", "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "logic_actions": ["skip", "visibility", "piping", "branch"],
    "scorer_impl_kinds": ["wasm", "http"],
}
BUNDLE = {
    "definition": {
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}}, "option": {"ref": "opt_1@v26.0609"}}]}],
    },
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
            "content": {"en": {"status": "validated", "label": "L",
                               "options": [{"index": 1, "text": "a"}, {"index": 2, "text": "b"}]}}},
    },
}


@pytest.fixture
def setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()
    return client, dep["deployment_id"]


def _new_session(client, dep_id):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"})


def test_mint_returns_agent_identity(setup):
    client, dep_id = setup
    r = _new_session(client, dep_id)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["agent_id"].startswith("agent_")
    assert body["session_index"] == 1


def test_session_get_returns_agent_identity(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    r = client.get(f"/v1/sessions/{s['session_id']}", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["agent_id"].startswith("agent_")
    assert body["session_index"] == 1
