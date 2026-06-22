import pytest
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as estore


def _session(conn, sid, sub, *, status="submitted"):
    sstore.insert_session(
        conn, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
        deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=sub,
        instrument_id="qst_x", instrument_version="v26.0101", status=status,
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _responses(conn, sid, responses):
    conn.execute(
        "INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,'responses',%s,%s)",
        (sid, Jsonb({"session_id": sid, "responses": responses}), "sha_" + sid))


def test_list_sessions_for_participant_scoped(conn):
    _session(conn, "sA1", "alice")
    _session(conn, "sA2", "alice")
    _session(conn, "sB1", "bob")
    got = sstore.list_sessions_for_participant(conn, "alice")
    assert {s["session_id"] for s in got} == {"sA1", "sA2"}
    assert all(s["participant_sub"] == "alice" for s in got)


def test_iter_responses_for_participant_scoped(conn):
    _session(conn, "sA1", "alice")
    _session(conn, "sB1", "bob")
    _responses(conn, "sA1", [{"id": "rA", "value": 1}])
    _responses(conn, "sB1", [{"id": "rB", "value": 2}])
    rows = list(estore.iter_response_rows_for_participant(conn, "alice"))
    assert [r["id"] for r in rows] == ["rA"]


def test_require_participant_dep(id_key, monkeypatch):
    from fastapi import FastAPI, Depends
    from fastapi.testclient import TestClient
    from viewer_service.api import identity as idmod
    from identity_service.tokens import sign_access
    kid, jwk, pem = id_key
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    app = FastAPI()

    @app.get("/p")
    def p(claims=Depends(idmod.require_participant)):
        return {"sub": claims["sub"]}

    c = TestClient(app)
    assert c.get("/p").status_code == 401
    tok = sign_access(private_pem=pem, kid=kid, sub="alice", aud="questionnaire-apps",
                      roles=["participant"], issuer="http://id-test", ttl=900)
    r = c.get("/p", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["sub"] == "alice"
