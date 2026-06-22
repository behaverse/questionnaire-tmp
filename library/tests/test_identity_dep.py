import time
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from library.api import identity as idmod


@pytest.fixture
def key(monkeypatch):
    kid, jwk, pem = generate_keypair()
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    return kid, pem


def _token(kid, pem, roles, *, sub="u-1", aud="questionnaire-apps", iss="http://id-test", ttl=900, now=None):
    return sign_access(private_pem=pem, kid=kid, sub=sub, aud=aud, roles=roles,
                       issuer=iss, ttl=ttl, now=now)


def _app():
    app = FastAPI()

    @app.get("/u")
    def u(claims=Depends(idmod.require_user)):
        return {"sub": claims["sub"]}

    @app.get("/a")
    def a(claims=Depends(idmod.require_admin)):
        return {"sub": claims["sub"]}

    @app.get("/o")
    def o(claims=Depends(idmod.optional_user)):
        return {"sub": claims["sub"] if claims else None}

    return TestClient(app)


def test_require_user(key):
    kid, pem = key
    c = _app()
    assert c.get("/u").status_code == 401
    assert c.get("/u", headers={"Authorization": "Bearer junk"}).status_code == 401
    tok = _token(kid, pem, ["participant"])
    r = c.get("/u", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["sub"] == "u-1"


def test_require_admin(key):
    kid, pem = key
    c = _app()
    tok = _token(kid, pem, ["researcher"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 403
    tok = _token(kid, pem, ["administrator"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_optional_user(key):
    kid, pem = key
    c = _app()
    assert c.get("/o").json()["sub"] is None                      # no token → None, not 401
    assert c.get("/o", headers={"Authorization": "Bearer junk"}).json()["sub"] is None
    tok = _token(kid, pem, ["participant"], sub="abc")
    assert c.get("/o", headers={"Authorization": f"Bearer {tok}"}).json()["sub"] == "abc"


def test_rejects_wrong_aud_and_expired(key):
    kid, pem = key
    c = _app()
    bad = _token(kid, pem, ["participant"], aud="nope")
    assert c.get("/u", headers={"Authorization": f"Bearer {bad}"}).status_code == 401
    exp = _token(kid, pem, ["participant"], ttl=1, now=int(time.time()) - 10)
    assert c.get("/u", headers={"Authorization": f"Bearer {exp}"}).status_code == 401
