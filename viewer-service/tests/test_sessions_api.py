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
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"},
                                                     "pt": {"status": "validated", "text": "Q-pt?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}, {"index": 2, "text": "b"}]},
                        "pt": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "x"}, {"index": 2, "text": "y"}]}}},
    },
}


@pytest.fixture
def setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    return client, dep["deployment_id"]


def _new_session(client, dep_id, locale=None):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610", "locale": locale})


def test_new_session_returns_token_and_runtime(setup):
    client, dep_id = setup
    r = _new_session(client, dep_id, "en")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["session_id"]
    assert body["session_token"]
    assert body["runtime"]["provenance"]["source_questionnaire_id"] == "qst_mini"


def test_resume_requires_token(setup):
    client, dep_id = setup
    sid = _new_session(client, dep_id, "en").json()["session_id"]
    assert client.get(f"/v1/sessions/{sid}").status_code == 401
    assert client.get(f"/v1/sessions/{sid}", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_resume_returns_status_and_runtime(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    g = client.get(f"/v1/sessions/{s['session_id']}", headers=h)
    assert g.status_code == 200
    assert g.json()["status"] == "in_progress"
    assert g.json()["last_active_locale"] == "en"
    rt = client.get(f"/v1/sessions/{s['session_id']}/runtime", headers=h)
    assert rt.status_code == 200
    assert rt.json()["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "en": {"status": "validated", "text": "Q?"}}


def test_locale_switch_remints_and_persists(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    r = client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "pt"}, headers=h)
    assert r.status_code == 200
    assert r.json()["runtime"]["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "pt": {"status": "validated", "text": "Q-pt?"}}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).json()["last_active_locale"] == "pt"


def test_locale_switch_rejects_unavailable_locale(setup):
    client, dep_id = setup
    s = _new_session(client, dep_id, "en").json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    r = client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "fr"}, headers=h)
    assert r.status_code == 422
