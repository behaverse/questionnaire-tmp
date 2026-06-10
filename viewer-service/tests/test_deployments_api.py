def _create_body():
    return {
        "questionnaire_ref": "qst_phq9@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": False},
        "default_locale": "en",
        "available_locales": ["en", "pt"],
    }


def test_create_then_get_deployment(client):
    r = client.post("/v1/deployments", json=_create_body())
    assert r.status_code == 201, r.text
    dep_id = r.json()["deployment_id"]
    assert dep_id.startswith("dep_")

    g = client.get(f"/v1/deployments/{dep_id}")
    assert g.status_code == 200
    body = g.json()
    assert body["questionnaire_ref"] == "qst_phq9@v26.0609"
    assert body["runtime_policy"] == {
        "scorer_impl_preference": ["wasm", "http"], "show_score": False,
        "lock_show_score_timing": False, "show_score_live": False,
        "pre_fetch_all_locales": False, "disable_in_session_scoring": False,
    }


def test_create_rejects_bad_policy_422(client):
    body = _create_body()
    del body["runtime_policy"]["scorer_impl_preference"]   # required field
    r = client.post("/v1/deployments", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid"


def test_get_unknown_deployment_404(client):
    assert client.get("/v1/deployments/dep_nope").status_code == 404
