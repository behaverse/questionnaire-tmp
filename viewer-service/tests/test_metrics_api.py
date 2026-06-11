def _make_deployment(client):
    return client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_x@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"]},
        "default_locale": "en", "available_locales": ["en"]}).json()["deployment_id"]


def test_metrics_endpoint_snapshot(client):
    dep = _make_deployment(client)
    r = client.get(f"/v1/deployments/{dep}/metrics")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["active_sessions"] == 0
    assert set(body) == {"active_sessions", "completion", "quota", "recent_submissions", "forwarding"}
    assert body["forwarding"]["alert"] is False


def test_metrics_unknown_deployment_404(client):
    assert client.get("/v1/deployments/dep_nope/metrics").status_code == 404
