import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE      # reuse fixtures (pytest prepend mode)
from test_submission_api import _response_set       # valid Schema 5 ResponseSet builder


def _make_deployment(client, **over):
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    body.update(over)
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


@pytest.fixture
def deployed(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = _make_deployment(client)
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    client.post(f"/v1/sessions/{s['session_id']}/responses", json=_response_set(s["session_id"]), headers=h)
    return client, dep


def test_export_returns_csv_attachment_with_header_and_row(deployed):
    client, dep = deployed
    r = client.get(f"/v1/deployments/{dep}/export.csv")
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    lines = r.text.splitlines()
    assert lines[0].split(",")[0] == "response_id"      # header (first column)
    assert len(lines) == 2                              # header + the one submitted response
    assert lines[1].split(",")[0] == "1"                # response_id == 1 from _response_set


def test_export_unknown_deployment_404(deployed):
    client, _ = deployed
    assert client.get("/v1/deployments/dep_nope/export.csv").status_code == 404


def test_export_empty_deployment_header_only(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    dep = _make_deployment(client)
    r = client.get(f"/v1/deployments/{dep}/export.csv")
    assert r.status_code == 200
    assert len(r.text.splitlines()) == 1                # header only, no responses yet
