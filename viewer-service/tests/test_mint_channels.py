import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _mint(client, monkeypatch, channels=None):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    if channels is not None:
        body["channels"] = channels
    dep = client.post("/v1/deployments", json=body).json()
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()


def test_mint_returns_default_channels(client, monkeypatch):
    s = _mint(client, monkeypatch)
    assert "channels" in s
    assert s["channels"]["mouse"] is False          # default opt-out


def test_mint_returns_requested_channels(client, monkeypatch):
    s = _mint(client, monkeypatch, channels={"rt": True, "mouse": True, "keyboard": False,
                                             "webcam": False, "microphone": False})
    assert s["channels"]["mouse"] is True
