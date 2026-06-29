import os
import psycopg
import pytest
import viewer_service.runtime as runtime_mod
from viewer_service.store import comments as comment_store
from test_sessions_api import MANIFEST, BUNDLE


def _make_session(client, monkeypatch, *, preset=None):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    body = {"questionnaire_ref": "qst_mini@v26.0609",
            "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
            "default_locale": "en", "available_locales": ["en", "pt"]}
    if preset:
        body["mode_preset"] = preset
    dep = client.post("/v1/deployments", json=body).json()
    dep_id = dep["deployment_id"]
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return dep_id, s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


@pytest.fixture
def session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch))


@pytest.fixture
def ephemeral_session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch, preset="demo"))


def test_stores_comment_and_researcher_can_read(session):
    client, dep_id, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/comments", headers=h,
                    json={"page_id": "pg_1", "item_id": "it_1", "locale": "en",
                          "comment": "This wording is confusing.", "stars": 2})
    assert r.status_code == 202, r.text
    assert r.json() == {"stored": True}

    # researcher GET (client default headers carry the researcher role)
    g = client.get(f"/v1/deployments/{dep_id}/comments")
    assert g.status_code == 200, g.text
    rows = g.json()["comments"]
    assert len(rows) == 1
    row = rows[0]
    assert row["comment"] == "This wording is confusing."
    assert row["stars"] == 2
    assert row["page_id"] == "pg_1"
    assert row["item_id"] == "it_1"
    assert row["instrument_id"] and row["instrument_version"]


def test_stars_only_comment_is_accepted(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/comments", headers=h, json={"stars": 5})
    assert r.status_code == 202, r.text


def test_empty_body_rejected(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/comments", headers=h, json={"comment": "   "})
    assert r.status_code == 422


def test_stars_out_of_range_rejected(session):
    client, _dep, sid, h = session
    assert client.post(f"/v1/sessions/{sid}/comments", headers=h,
                       json={"comment": "x", "stars": 6}).status_code == 422
    assert client.post(f"/v1/sessions/{sid}/comments", headers=h,
                       json={"comment": "x", "stars": 0}).status_code == 422


def test_post_requires_valid_session_token(session):
    client, _dep, sid, _h = session
    r = client.post(f"/v1/sessions/{sid}/comments",
                    headers={"Authorization": "Bearer not-a-real-token"},
                    json={"comment": "x"})
    assert r.status_code == 401


def test_researcher_read_requires_role(session, auth_header):
    client, dep_id, _sid, _h = session
    r = client.get(f"/v1/deployments/{dep_id}/comments", headers=auth_header(["participant"]))
    assert r.status_code == 403


def test_unknown_deployment_404(client):
    r = client.get("/v1/deployments/dpl_does_not_exist/comments")
    assert r.status_code == 404


def test_comments_csv_export(session):
    client, dep_id, sid, h = session
    client.post(f"/v1/sessions/{sid}/comments", headers=h,
                json={"page_id": "pg_1", "item_id": "it_1", "comment": "wording, unclear", "stars": 2})
    r = client.get(f"/v1/deployments/{dep_id}/comments.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    lines = r.text.strip().splitlines()
    assert lines[0].startswith("id,created_at,deployment_id")  # header
    assert len(lines) == 2
    # comment with an embedded comma is CSV-quoted, stars preserved
    assert '"wording, unclear"' in lines[1] and ",2," in lines[1]


def test_comments_csv_requires_researcher(session, auth_header):
    client, dep_id, _sid, _h = session
    assert client.get(f"/v1/deployments/{dep_id}/comments.csv",
                      headers=auth_header(["participant"])).status_code == 403


def test_ephemeral_validates_but_skips_store(ephemeral_session):
    client, _dep, sid, h = ephemeral_session
    r = client.post(f"/v1/sessions/{sid}/comments", headers=h, json={"comment": "x", "stars": 3})
    assert r.status_code == 202, r.text
    assert r.json() == {"ephemeral": True}
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        assert comment_store.list_comments(c, _dep) == []
