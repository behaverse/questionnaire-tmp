import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE   # reuse fixtures (pytest prepend mode)


@pytest.fixture
def env(client, monkeypatch, pg_url):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    import psycopg
    from viewer_service.themes import seed_builtin_themes
    with psycopg.connect(pg_url) as c:
        seed_builtin_themes(c)
    client.post("/v1/viewers", json=MANIFEST)
    return client


def _dep(client, **over):
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    body.update(over)
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


def _mint(client, dep):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep, "viewer_id": "web", "viewer_version": "v26.0610"}).json()


def test_session_includes_theme_when_set(env):
    s = _mint(env, _dep(env, theme_id="default"))
    assert s["theme"]["theme_id"] == "default"
    assert s["theme"]["palette"]["primary"]


def test_session_theme_null_when_unset(env):
    s = _mint(env, _dep(env))
    assert s["theme"] is None
