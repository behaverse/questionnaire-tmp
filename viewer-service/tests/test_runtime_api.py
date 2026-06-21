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
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini",
                     "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}},
             "option": {"ref": "opt_1@v26.0609"}}]}],
        "scores": [{"id": "tot", "scorer": "scr_1@v26.0609", "path": "/total"}],
    },
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {
            "en": {"status": "validated", "text": "Interest?"},
            "pt": {"status": "validated", "text": "Interesse?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice",
            "measurement_type": "ordinal", "selection": "single",
            "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
            "content": {"en": {"status": "validated", "label": "L",
                               "options": [{"index": 1, "text": "No"}, {"index": 2, "text": "Yes"}]},
                        "pt": {"status": "validated", "label": "L",
                               "options": [{"index": 1, "text": "Não"}, {"index": 2, "text": "Sim"}]}}},
        "scr_1@v26.0609": {"id": "scr_1", "implementations": [
            {"kind": "wasm", "url": "https://x/s.wasm", "sha256": "a" * 64}]},
    },
}


@pytest.fixture
def setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle",
                        lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
        "default_locale": "en", "available_locales": ["en", "pt"]}).json()
    return client, dep["deployment_id"]


def test_mint_returns_valid_schema3(setup):
    client, dep_id = setup
    r = client.post(f"/v1/deployments/{dep_id}/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"})
    assert r.status_code == 200, r.text
    rt = r.json()
    assert rt["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {
        "en": {"status": "validated", "text": "Interest?"}}
    assert rt["scores"][0]["impl"]["kind"] == "wasm"
    assert rt["provenance"]["source_questionnaire_id"] == "qst_mini"


def test_mint_caches(setup, monkeypatch):
    client, dep_id = setup
    calls = {"n": 0}
    def counting(base, qid, ver):
        calls["n"] += 1
        return BUNDLE
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", counting)
    body = {"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"}
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    assert calls["n"] == 1   # second call served from cache; Library not hit again


def test_mint_missing_locale_is_422(setup):
    client, dep_id = setup
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"]},
        "default_locale": "de", "available_locales": ["de"]}).json()
    r = client.post(f"/v1/deployments/{dep['deployment_id']}/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610", "locale": "de"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "preflight_failed"
    assert any(p["kind"] == "missing_locale" for p in r.json()["error"]["detail"])


def test_mint_unknown_deployment_404(setup):
    client, _ = setup
    r = client.post("/v1/deployments/dep_nope/runtime",
                    json={"viewer_id": "web", "viewer_version": "v26.0610"})
    assert r.status_code == 404


def test_mint_unknown_viewer_404(setup):
    client, dep_id = setup
    r = client.post(f"/v1/deployments/{dep_id}/runtime",
                    json={"viewer_id": "ghost", "viewer_version": "v1"})
    assert r.status_code == 404


def test_admin_purge(setup, auth_header):
    client, dep_id = setup
    body = {"viewer_id": "web", "viewer_version": "v26.0610", "locale": "en"}
    client.post(f"/v1/deployments/{dep_id}/runtime", json=body)
    r = client.delete("/v1/runtime_cache", headers=auth_header(["administrator"]))
    assert r.status_code == 200
    assert r.json()["purged"] >= 1
