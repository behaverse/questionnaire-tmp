from datetime import datetime, timezone, timedelta
import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore, users as ustore, handoff as hstore
from identity_service import tokens

A = {"email": "a@e.com", "password": "password1", "display_name": "Ada", "audience": "questionnaire-apps"}


def _bootstrap(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        c.commit()


def _register_login(client, pg_url):
    _bootstrap(pg_url)
    client.post("/v1/auth/register", json=A)
    return client.post("/v1/auth/login", json={"email": A["email"], "password": A["password"], "audience": A["audience"]}).json()["access_token"]


def test_handoff_round_trip_issues_a_real_session(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/handoff", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200, r.text
    assert r.json()["expires_in"] == 60
    code = r.json()["handoff_code"]
    # the player exchanges the code (no auth header) for its OWN token pair
    ex = client.post("/v1/auth/handoff/exchange", json={"handoff_code": code})
    assert ex.status_code == 200, ex.text
    body = ex.json()
    assert body["access_token"] and body["refresh_token"] and body["token_type"] == "Bearer"
    # the exchanged refresh token is a real, usable session
    assert client.post("/v1/auth/refresh", json={"refresh_token": body["refresh_token"]}).status_code == 200


def test_handoff_code_is_single_use(client, pg_url):
    access = _register_login(client, pg_url)
    code = client.post("/v1/auth/handoff", headers={"Authorization": f"Bearer {access}"}).json()["handoff_code"]
    assert client.post("/v1/auth/handoff/exchange", json={"handoff_code": code}).status_code == 200
    r2 = client.post("/v1/auth/handoff/exchange", json={"handoff_code": code})
    assert r2.status_code == 401
    assert r2.json()["error"]["code"] == "handoff_invalid"


def test_handoff_exchange_rejects_a_forged_code(client, pg_url):
    _bootstrap(pg_url)
    r = client.post("/v1/auth/handoff/exchange", json={"handoff_code": "not-a-real-code"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "handoff_invalid"


def test_handoff_exchange_rejects_an_expired_code(client, pg_url):
    _register_login(client, pg_url)
    with psycopg.connect(pg_url) as c:
        uid = ustore.by_email(c, A["email"])["id"]
        cid = cstore.by_slug(c, A["audience"])["id"]
        hstore.issue(c, uid, cid, tokens.hash_token("expired-code"), datetime.now(timezone.utc) - timedelta(seconds=1))
        c.commit()
    r = client.post("/v1/auth/handoff/exchange", json={"handoff_code": "expired-code"})
    assert r.status_code == 401


def test_handoff_mint_requires_a_valid_access_token(client, pg_url):
    _bootstrap(pg_url)
    assert client.post("/v1/auth/handoff").status_code == 401
