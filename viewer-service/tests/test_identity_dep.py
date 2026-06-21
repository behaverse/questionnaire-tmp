import time
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from viewer_service.api import identity as idmod


@pytest.fixture
def key(monkeypatch):
    kid, jwk, pem = generate_keypair()
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    return kid, pem


def _token(kid, pem, roles, *, aud="questionnaire-apps", iss="http://id-test", ttl=900, now=None):
    return sign_access(private_pem=pem, kid=kid, sub="u-1", aud=aud, roles=roles,
                       issuer=iss, ttl=ttl, now=now)


def _app():
    app = FastAPI()

    @app.get("/r")
    def r(claims=Depends(idmod.require_researcher)):
        return {"sub": claims["sub"]}

    @app.get("/a")
    def a(claims=Depends(idmod.require_admin)):
        return {"sub": claims["sub"]}

    return TestClient(app)


def test_researcher_paths(key):
    kid, pem = key
    c = _app()
    assert c.get("/r").status_code == 401                                   # no token
    assert c.get("/r", headers={"Authorization": "Bearer garbage"}).status_code == 401
    tok = _token(kid, pem, ["participant"])
    assert c.get("/r", headers={"Authorization": f"Bearer {tok}"}).status_code == 403   # wrong role
    for role in (["researcher"], ["reviewer"], ["administrator"]):
        tok = _token(kid, pem, role)
        r = c.get("/r", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200 and r.json()["sub"] == "u-1"


def test_admin_requires_administrator(key):
    kid, pem = key
    c = _app()
    tok = _token(kid, pem, ["researcher"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 403
    tok = _token(kid, pem, ["administrator"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_rejects_wrong_audience_and_expired(key):
    kid, pem = key
    c = _app()
    bad_aud = _token(kid, pem, ["researcher"], aud="someone-else")
    assert c.get("/r", headers={"Authorization": f"Bearer {bad_aud}"}).status_code == 401
    expired = _token(kid, pem, ["researcher"], ttl=1, now=int(time.time()) - 10)
    assert c.get("/r", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
