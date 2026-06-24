import pytest
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE  # reuse fixtures (pytest prepend mode)


@pytest.fixture
def env(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    def make_dep(**over):
        body = {"questionnaire_ref": "qst_mini@v26.0609",
                "runtime_policy": {"scorer_impl_preference": ["wasm", "http"], "show_score": True},
                "default_locale": "en", "available_locales": ["en", "pt"]}
        body.update(over)
        return client.post("/v1/deployments", json=body).json()["deployment_id"]
    return client, make_dep


def _mint(client, dep_id):
    return client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"})


def test_mint_past_active_until_is_410(env):
    client, make_dep = env
    dep = make_dep(active_until="2000-01-01T00:00:00Z")
    r = _mint(client, dep)
    assert r.status_code == 410
    assert r.json()["error"]["code"] == "gone"


def test_mint_before_active_from_is_409(env):
    client, make_dep = env
    dep = make_dep(active_from="2099-01-01T00:00:00Z")
    r = _mint(client, dep)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "not_yet_open"


def test_quota_exhausted_is_409(env):
    client, make_dep = env
    dep = make_dep(quota={"max_sessions": 1})
    assert _mint(client, dep).status_code == 201
    r = _mint(client, dep)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "quota_exhausted"


def test_anonymous_link_session_not_ephemeral(env):
    client, make_dep = env
    s = _mint(client, make_dep()).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).status_code == 200


def test_demo_session_refuses_resume_409(env):
    client, make_dep = env
    dep = make_dep(mode_preset="demo")
    s = _mint(client, dep).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}
    assert client.get(f"/v1/sessions/{s['session_id']}", headers=h).status_code == 409
    assert client.get(f"/v1/sessions/{s['session_id']}/runtime", headers=h).status_code == 409
    assert client.post(f"/v1/sessions/{s['session_id']}/locale", json={"locale": "pt"}, headers=h).status_code == 409


def test_resume_runtime_preflight_is_422_not_500(env, monkeypatch):
    # a misconfigured deployment (e.g. a locale the questionnaire lacks) makes the denormaliser
    # raise PreflightError on the resume runtime fetch — it must surface as a clean 422, not a 500
    # (the 500 was what stranded the participant on "resume_unreachable").
    import viewer_service.sessions as svc
    from denormaliser import PreflightError
    from denormaliser.errors import Problem
    client, make_dep = env
    s = _mint(client, make_dep()).json()
    h = {"Authorization": f"Bearer {s['session_token']}"}

    def boom(conn, session):
        raise PreflightError([Problem(kind="missing_locale", where="de", detail="no de content")])
    monkeypatch.setattr(svc, "session_runtime", boom)
    r = client.get(f"/v1/sessions/{s['session_id']}/runtime", headers=h)
    assert r.status_code == 422, r.text
    assert r.json()["error"]["code"] == "preflight_failed"
