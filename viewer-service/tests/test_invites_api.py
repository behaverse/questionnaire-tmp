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
def invite_dep(client, monkeypatch):
    monkeypatch.setenv("INVITE_SIGNING_SECRET", "test-secret")
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"],
        "mode_preset": "invite_link"}).json()
    return client, dep["deployment_id"]


def test_mint_invite_returns_token_and_url(invite_dep):
    client, dep_id = invite_dep
    r = client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "P-42"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_id"] == "P-42" and body["deployment_id"] == dep_id
    assert "." in body["invite_token"] and f"invite={body['invite_token']}" in body["url"]


def test_mint_requires_researcher(invite_dep):
    client, dep_id = invite_dep
    client.headers.pop("authorization", None)            # strip the default researcher token
    assert client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "P"}).status_code == 401


def test_unknown_deployment_404(invite_dep):
    client, _ = invite_dep
    assert client.post("/v1/deployments/dep_nope/invites", json={"participant_id": "P"}).status_code == 404


def test_empty_participant_id_422(invite_dep):
    client, dep_id = invite_dep
    assert client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "  "}).status_code == 422


def test_invites_unavailable_without_secret(client, monkeypatch):
    monkeypatch.delenv("INVITE_SIGNING_SECRET", raising=False)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"], "mode_preset": "invite_link"}).json()
    r = client.post(f"/v1/deployments/{dep['deployment_id']}/invites", json={"participant_id": "P"})
    assert r.status_code == 503 and r.json()["error"]["code"] == "invites_unavailable"
