import os
import psycopg
import pytest
import viewer_service.runtime as runtime_mod
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
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return dep["deployment_id"], s["session_id"], {"Authorization": f"Bearer {s['session_token']}"}


@pytest.fixture
def session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch))


@pytest.fixture
def ephemeral_session(client, monkeypatch):
    return (client, *_make_session(client, monkeypatch, preset="demo"))


_SAMPLES = [{"t": 0, "x": 1, "y": 2, "button_state": "up"},
            {"t": 0.1, "x": 3, "y": 4, "button_state": "left_down"}]


def test_post_recording_enqueues(session):
    client, dep_id, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 202, r.text
    assert "enqueued" in r.json()
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        row = c.execute("SELECT kind, payload FROM outbox o JOIN session s ON o.session_id=s.session_id "
                        "WHERE s.deployment_id=%s", (dep_id,)).fetchone()
    assert row[0] == "recording"
    assert row[1] == {"channel": "mouse", "samples": _SAMPLES}


def test_bad_channel_rejected(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "webcam", "samples": _SAMPLES})
    assert r.status_code == 400


def test_non_list_samples_rejected(session):
    client, _dep, sid, h = session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": "nope"})
    assert r.status_code == 400


def test_requires_valid_session_token(session):
    client, _dep, sid, _h = session
    r = client.post(f"/v1/sessions/{sid}/recordings",
                    headers={"Authorization": "Bearer not-a-real-token"},
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 401


def test_ephemeral_accepts_but_skips_store(ephemeral_session):
    client, dep_id, sid, h = ephemeral_session
    r = client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                    json={"channel": "mouse", "samples": _SAMPLES})
    assert r.status_code == 202, r.text
    assert r.json() == {"ephemeral": True}
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        n = c.execute("SELECT count(*) FROM outbox o JOIN session s ON o.session_id=s.session_id "
                      "WHERE s.deployment_id=%s AND o.kind='recording'", (dep_id,)).fetchone()[0]
    assert n == 0


from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore


def _seed_recording_session(pg_url, sub, sid, dep, samples):
    with psycopg.connect(pg_url) as c:
        sstore.insert_session(
            c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
            deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id=sub,
            instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
            token_hash="h_" + sid, initial_locale="en", last_active_locale="en")
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES (%s,'recording',%s,%s)",
                  (sid, Jsonb({"channel": "mouse", "samples": samples}), "hr_" + sid))
        c.commit()


def test_me_recordings_scoped(client, auth_header, pg_url):
    _seed_recording_session(pg_url, "alice", "rA", "dep_x", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
    _seed_recording_session(pg_url, "bob", "rB", "dep_x", [{"t": 0, "x": 8, "y": 8, "button_state": "up"}])
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/recordings", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200
    recs = r.json()["recordings"]
    assert len(recs) == 1 and recs[0]["samples"][0]["x"] == 1   # bob excluded


def test_me_recordings_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/recordings").status_code == 401


def test_me_recordings_empty(client, auth_header):
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/recordings", headers=auth_header(["participant"], sub="nobody"))
    assert r.status_code == 200 and r.json() == {"recordings": []}


def test_deployment_recordings_researcher(session):
    client, dep_id, sid, h = session
    client.post(f"/v1/sessions/{sid}/recordings", headers=h,
                json={"channel": "mouse", "samples": _SAMPLES})
    g = client.get(f"/v1/deployments/{dep_id}/recordings")   # default headers carry researcher role
    assert g.status_code == 200, g.text
    recs = g.json()["recordings"]
    assert len(recs) == 1 and recs[0]["channel"] == "mouse"


def test_deployment_recordings_requires_researcher(session, auth_header):
    client, dep_id, _sid, _h = session
    assert client.get(f"/v1/deployments/{dep_id}/recordings",
                      headers=auth_header(["participant"])).status_code == 403


def test_deployment_recordings_unknown_404(client):
    assert client.get("/v1/deployments/dpl_nope/recordings").status_code == 404
