def _body(**over):
    b = {"questionnaire_ref": "qst_phq9@v26.0609",
         "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": False},
         "default_locale": "en", "available_locales": ["en", "pt"]}
    b.update(over)
    return b


def test_create_defaults_to_anonymous_link(client):
    r = client.post("/v1/deployments", json=_body())
    assert r.status_code == 201, r.text
    dep_id = r.json()["deployment_id"]
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["mode_preset"] == "anonymous_link"
    assert g["dimensions"]["persistence"] == "persisted"
    assert g["channels"]["rt"] is True
    assert g["randomization_seed_strategy"] == "per_session"
    assert g["runtime_policy"]["show_score"] is False


def test_create_demo_is_ephemeral(client):
    dep_id = client.post("/v1/deployments", json=_body(mode_preset="demo")).json()["deployment_id"]
    assert client.get(f"/v1/deployments/{dep_id}").json()["dimensions"]["persistence"] == "ephemeral"


def test_create_unsupported_preset_422(client):
    r = client.post("/v1/deployments", json=_body(mode_preset="access_code"))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "unsupported_preset"


def test_create_rejects_non_http_redirect_url(client):
    for bad in ("javascript:alert(1)", "data:text/html,x", "/relative/path", "ftp://h/x", "notaurl"):
        r = client.post("/v1/deployments", json=_body(redirect_url=bad))
        assert r.status_code == 422, f"{bad!r} should be rejected"
        assert r.json()["error"]["code"] == "invalid_redirect_url"


def test_create_accepts_https_redirect_url(client):
    r = client.post("/v1/deployments", json=_body(redirect_url="https://study.example.org/thanks"))
    assert r.status_code == 201, r.text
    dep_id = r.json()["deployment_id"]
    assert client.get(f"/v1/deployments/{dep_id}").json()["redirect_url"] == "https://study.example.org/thanks"


def test_create_rejects_instrument_only_override(client):
    r = client.post("/v1/deployments", json=_body(flow_overrides={"allow_back": True}))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "instrument_only_override"


def test_create_accepts_allowed_overrides(client):
    r = client.post("/v1/deployments", json=_body(
        style_overrides={"progress_bar": True}, flow_overrides={"max_time_seconds": 600}))
    assert r.status_code == 201


def test_create_with_active_window_and_quota(client):
    dep_id = client.post("/v1/deployments", json=_body(
        active_until="2099-01-01T00:00:00Z", quota={"max_sessions": 10})).json()["deployment_id"]
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["active_until"].startswith("2099-01-01")
    assert g["quota"]["max_sessions"] == 10


def test_list_deployments(client):
    client.post("/v1/deployments", json=_body())
    client.post("/v1/deployments", json=_body(mode_preset="demo"))
    items = client.get("/v1/deployments").json()["items"]
    assert len(items) == 2
    assert {"deployment_id", "mode_preset", "questionnaire_ref"}.issubset(items[0])


def test_patch_active_until_and_quota(client):
    dep_id = client.post("/v1/deployments", json=_body()).json()["deployment_id"]
    r = client.patch(f"/v1/deployments/{dep_id}",
                     json={"active_until": "2030-06-01T00:00:00Z", "quota": {"max_sessions": 5}})
    assert r.status_code == 200
    g = client.get(f"/v1/deployments/{dep_id}").json()
    assert g["active_until"].startswith("2030-06-01")
    assert g["quota"]["max_sessions"] == 5
    assert g["questionnaire_ref"] == "qst_phq9@v26.0609"


def test_get_unknown_404(client):
    assert client.get("/v1/deployments/dep_nope").status_code == 404
