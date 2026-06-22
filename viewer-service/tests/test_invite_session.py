import pytest
import viewer_service.runtime as runtime_mod
from viewer_service.invites import mint_invite

SECRET = "test-secret"
BUNDLE = {  # minimal resolvable bundle
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


def _make_dep(client, preset="invite_link"):
    client.post("/v1/viewers", json=_MANIFEST)
    return client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"], "mode_preset": preset}).json()["deployment_id"]


@pytest.fixture
def invite_env(client, monkeypatch):
    monkeypatch.setenv("INVITE_SIGNING_SECRET", SECRET)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    return client


def _mint_session(client, dep_id, invite=None):
    body = {"deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"}
    if invite is not None:
        body["invite"] = invite
    return client.post("/v1/sessions/new", json=body)


def test_invite_deploy_requires_invite(invite_env):
    dep_id = _make_dep(invite_env)
    r = _mint_session(invite_env, dep_id)
    assert r.status_code == 401 and r.json()["error"]["code"] == "invite_required"


def test_invalid_invite_rejected(invite_env):
    dep_id = _make_dep(invite_env)
    assert _mint_session(invite_env, dep_id, "garbage").status_code == 401


def test_valid_invite_tags_session(invite_env):
    dep_id = _make_dep(invite_env)
    tok = mint_invite(SECRET, participant_id="P-7", deployment_id=dep_id, ttl=3600)
    r = _mint_session(invite_env, dep_id, tok)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_sub"] == "invite:P-7" and body["agent_id"] == "P-7"
    assert body["session_index"] == 1


def test_returning_code_increments_index(invite_env):
    dep_id = _make_dep(invite_env)
    tok = mint_invite(SECRET, participant_id="P-8", deployment_id=dep_id, ttl=3600)
    _mint_session(invite_env, dep_id, tok)
    second = _mint_session(invite_env, dep_id, tok).json()
    assert second["session_index"] == 2 and second["participant_sub"] == "invite:P-8"


def test_cross_deployment_invite_rejected(invite_env):
    dep_a = _make_dep(invite_env)
    dep_b = _make_dep(invite_env)
    tok_for_a = mint_invite(SECRET, participant_id="P", deployment_id=dep_a, ttl=3600)
    assert _mint_session(invite_env, dep_b, tok_for_a).status_code == 401


def test_invite_ignored_on_anonymous_deploy(invite_env):
    dep_id = _make_dep(invite_env, preset="anonymous_link")
    tok = mint_invite(SECRET, participant_id="P", deployment_id=dep_id, ttl=3600)
    r = _mint_session(invite_env, dep_id, tok)                # invite present but mode=none
    assert r.status_code == 201 and r.json()["participant_sub"] is None
