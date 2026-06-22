import pytest
import viewer_service.runtime as runtime_mod

BUNDLE = {
    "definition": {"metadata": {"id": "qst_mini", "version": "v26.0609", "title": "M",
                                "description": "d", "language": "en"},
                   "pages": [{"id": "page_1", "elements": [
                       {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}},
                        "option": {"ref": "opt_1@v26.0609"}}]}]},
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}]}}},
    },
}
_MANIFEST = {"viewer_id": "web", "viewer_version": "v26.0610",
             "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
             "evaluator": {"language_version": "v1.0", "functions": ["if"]},
             "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}


@pytest.fixture
def auth_dep(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)  # default client carries a researcher token
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"],
        "mode_preset": "authenticated"}).json()
    return client, dep["deployment_id"]


def _mint(client, dep_id, headers=None):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"},
        headers=headers or {})


def test_authenticated_deploy_requires_token(auth_dep):
    client, dep_id = auth_dep
    r = _mint(client, dep_id)                         # no Authorization header
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "auth_required"


def test_invalid_token_rejected(auth_dep):
    client, dep_id = auth_dep
    r = _mint(client, dep_id, {"Authorization": "Bearer junk"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "auth_required"


def test_valid_token_tags_session(auth_dep, auth_header):
    client, dep_id = auth_dep
    r = _mint(client, dep_id, auth_header(["participant"], sub="alice-1"))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_sub"] == "alice-1" and body["agent_id"] == "alice-1"
    assert body["session_index"] == 1


def test_returning_participant_increments_index(auth_dep, auth_header):
    client, dep_id = auth_dep
    h = auth_header(["participant"], sub="bob-2")
    _mint(client, dep_id, h)
    second = _mint(client, dep_id, h).json()
    assert second["session_index"] == 2 and second["participant_sub"] == "bob-2"


def test_anonymous_deploy_ignores_token(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()  # default anonymous_link
    # no token → still mints anonymously
    r = _mint(client, dep["deployment_id"])
    assert r.status_code == 201 and r.json()["participant_sub"] is None
    # a token is ignored (still anonymous)
    r2 = _mint(client, dep["deployment_id"], auth_header(["participant"], sub="ignored"))
    assert r2.status_code == 201 and r2.json()["participant_sub"] is None
