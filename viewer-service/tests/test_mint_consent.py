import pytest
import viewer_service.runtime as runtime_mod

MANIFEST = {
    "viewer_id": "behaverse-web-viewer", "viewer_version": "v26.0612",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "logic_actions": ["skip", "visibility", "piping", "branch"],
    "scorer_impl_kinds": ["wasm", "http"],
}
BUNDLE = {
    "definition": {
        "metadata": {"id": "qst_min", "version": "v26.0101", "title": "Mini", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}}, "option": {"ref": "opt_1@v26.0609"}}]}],
    },
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}]}}},
    },
}
_RP = {"scorer_impl_preference": ["wasm"], "show_score": False}
_VIEWER = {"viewer_id": "behaverse-web-viewer", "viewer_version": "v26.0612"}


@pytest.fixture(autouse=True)
def _register_viewer(client):
    client.post("/v1/viewers", json=MANIFEST)


@pytest.fixture(autouse=True)
def _seed_runtime(monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda *a, **k: BUNDLE)


def test_mint_returns_consent_confirmation_redirect(client):
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_min@v26.0101", "runtime_policy": _RP, "default_locale": "en",
        "available_locales": ["en"], "mode_preset": "anonymous_link",
        "consent": {"en": "Please consent."}, "confirmation_message": {"en": "All done."},
        "redirect_url": "https://example.org/done"}).json()["deployment_id"]
    r = client.post("/v1/sessions/new", json={"deployment_id": dep, **_VIEWER, "locale": "en"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["consent"] == {"en": "Please consent."}
    assert body["confirmation_message"] == {"en": "All done."}
    assert body["redirect_url"] == "https://example.org/done"


def test_mint_consent_null_when_absent(client):
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_min@v26.0101", "runtime_policy": _RP, "default_locale": "en",
        "available_locales": ["en"], "mode_preset": "anonymous_link"}).json()["deployment_id"]
    body = client.post("/v1/sessions/new", json={"deployment_id": dep, **_VIEWER, "locale": "en"}).json()
    assert body["consent"] is None and body["confirmation_message"] is None and body["redirect_url"] is None
