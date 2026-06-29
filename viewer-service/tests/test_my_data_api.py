import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore


def _seed(pg_url, sub, sid):
    with psycopg.connect(pg_url) as c:
        sstore.insert_session(
            c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
            deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=sub,
            instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
            token_hash="h_" + sid, initial_locale="en", last_active_locale="en")
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES (%s,'responses',%s,%s)",
                  (sid, Jsonb({"session_id": sid, "responses": [{"response_id": "r_" + sid, "value": 1}]}),
                   "sha_" + sid))
        c.commit()


def test_my_sessions_scoped_to_caller(client, auth_header, pg_url):
    _seed(pg_url, "alice", "sA")
    _seed(pg_url, "bob", "sB")
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/sessions", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200
    sids = [s["session_id"] for s in r.json()["sessions"]]
    assert sids == ["sA"]                                  # bob's session excluded
    s0 = r.json()["sessions"][0]
    assert s0["instrument_id"] == "qst_x" and s0["status"] == "submitted"


def test_my_sessions_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/sessions").status_code == 401


def test_my_responses_csv_scoped(client, auth_header, pg_url):
    _seed(pg_url, "alice", "sA")
    _seed(pg_url, "bob", "sB")
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/responses.csv", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    body = r.text
    assert "id" in body.splitlines()[0]                    # BDM header present
    assert "r_sA" in body and "r_sB" not in body           # only alice's responses


def test_my_responses_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/responses.csv").status_code == 401


def test_my_responses_empty_is_header_only(client, auth_header):
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/responses.csv", headers=auth_header(["participant"], sub="nobody"))
    assert r.status_code == 200
    assert len(r.text.strip().splitlines()) == 1           # header row only


def test_me_sessions_includes_score_display(client, auth_header, pg_url):
    _seed(pg_url, "carol", "sC")
    with psycopg.connect(pg_url) as c:
        sstore.set_score_display(c, "sC", [{"id": "sc", "name": "PHQ-9", "value": 9}])
        c.commit()
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/sessions", headers=auth_header(["participant"], sub="carol"))
    assert r.status_code == 200
    assert r.json()["sessions"][0]["score_display"] == [{"id": "sc", "name": "PHQ-9", "value": 9}]
