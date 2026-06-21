import pytest
import viewer_service.runtime as runtime_mod

BUNDLE = {  # minimal resolvable bundle (mirrors test_sessions_api)
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
_DEP_BODY = {"questionnaire_ref": "qst_mini@v26.0609",
             "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
             "default_locale": "en", "available_locales": ["en"]}


def _noauth(client):
    # a client with NO default Authorization header
    client.headers.pop("authorization", None)
    return client


def test_create_deployment_requires_token(client):
    c = _noauth(client)
    assert c.post("/v1/deployments", json=_DEP_BODY).status_code == 401


def test_create_deployment_rejects_participant_role(client, auth_header):
    c = _noauth(client)
    r = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["participant"]))
    assert r.status_code == 403


def test_create_deployment_sets_created_by_from_token(client, auth_header):
    c = _noauth(client)
    h = auth_header(["researcher"], sub="researcher-42")
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=h)
    assert dep.status_code == 201, dep.text
    got = c.get(f"/v1/deployments/{dep.json()['deployment_id']}", headers=h).json()
    assert got["created_by"] == "researcher-42"


def test_list_and_patch_require_researcher(client, auth_header):
    c = _noauth(client)
    assert c.get("/v1/deployments").status_code == 401
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["researcher"]))
    dep_id = dep.json()["deployment_id"]
    assert c.patch(f"/v1/deployments/{dep_id}", json={"quota": {"max_sessions": 5}}).status_code == 401
    ok = c.patch(f"/v1/deployments/{dep_id}", json={"quota": {"max_sessions": 5}},
                 headers=auth_header(["reviewer"]))
    assert ok.status_code == 200


def test_runtime_mint_requires_researcher(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    c = _noauth(client)
    c.post("/v1/viewers", json={"viewer_id": "web", "viewer_version": "v26.0610",
        "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
        "evaluator": {"language_version": "v1.0", "functions": ["if"]},
        "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]},
        headers=auth_header(["researcher"]))
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["researcher"]))
    dep_id = dep.json()["deployment_id"]
    assert c.post(f"/v1/deployments/{dep_id}/runtime", json={}).status_code == 401
    ok = c.post(f"/v1/deployments/{dep_id}/runtime",
                json={"viewer_id": "web", "viewer_version": "v26.0610"},
                headers=auth_header(["researcher"]))
    assert ok.status_code in (200, 201), ok.text


def test_register_viewer_requires_researcher(client, auth_header):
    c = _noauth(client)
    manifest = {"viewer_id": "web", "viewer_version": "v26.0610",
                "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
                "evaluator": {"language_version": "v1.0", "functions": ["if"]},
                "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}
    assert c.post("/v1/viewers", json=manifest).status_code == 401
    assert c.post("/v1/viewers", json=manifest, headers=auth_header(["participant"])).status_code == 403
    assert c.post("/v1/viewers", json=manifest, headers=auth_header(["researcher"])).status_code == 201


def test_themes_require_researcher(client, auth_header):
    c = _noauth(client)
    body = {"name": "T", "palette": {"background": "#ffffff", "foreground": "#111111",
            "primary": "#1a5fb4", "on_primary": "#ffffff"}, "typography": {"base_size": 16}}
    assert c.post("/v1/themes", json=body).status_code == 401
    assert c.get("/v1/themes").status_code == 401
    created = c.post("/v1/themes", json=body, headers=auth_header(["researcher"]))
    assert created.status_code == 201, created.text
    tid = created.json()["theme_id"]
    assert c.get(f"/v1/themes/{tid}").status_code == 401
    assert c.get(f"/v1/themes/{tid}", headers=auth_header(["administrator"])).status_code == 200
