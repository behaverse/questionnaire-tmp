import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore

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


def _login_status(client, password):
    return client.post("/v1/auth/login", json={"email": A["email"], "password": password, "audience": A["audience"]}).status_code


def test_change_password_succeeds_and_rotates_the_password(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "password1", "new_password": "newpassword2"})
    assert r.status_code == 204, r.text
    assert _login_status(client, "password1") == 401          # old rejected
    assert _login_status(client, "newpassword2") == 200       # new works


def test_change_password_wrong_old_returns_403(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "WRONGpass1", "new_password": "newpassword2"})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "wrong_password"


def test_change_password_short_new_returns_422(client, pg_url):
    access = _register_login(client, pg_url)
    r = client.post("/v1/auth/change-password", headers={"Authorization": f"Bearer {access}"},
                    json={"old_password": "password1", "new_password": "short"})
    assert r.status_code == 422


def test_change_password_without_token_returns_401(client, pg_url):
    _bootstrap(pg_url)
    r = client.post("/v1/auth/change-password", json={"old_password": "x", "new_password": "newpassword2"})
    assert r.status_code == 401
