import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore


def _bootstrap(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        c.commit()


def test_register_login_me_flow(client, pg_url):
    _bootstrap(pg_url)
    r = client.post("/v1/auth/register", json={
        "email": "a@e.com", "password": "password1", "display_name": "Ada",
        "audience": "questionnaire-apps"})
    assert r.status_code == 202, r.text                 # uniform accepted (enumeration-resistant)

    r = client.post("/v1/auth/login", json={
        "email": "a@e.com", "password": "password1", "audience": "questionnaire-apps"})
    assert r.status_code == 200
    access = r.json()["access_token"]

    r = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200 and r.json()["email"] == "a@e.com"

    r = client.get("/v1/auth/me")                       # no token
    assert r.status_code == 401


def test_register_never_grants_privileged_role(client, pg_url):
    """Regression: public self-registration must not confer researcher/reviewer/administrator
    (a privilege-escalation hole if it does — anyone could self-mint a researcher token)."""
    import psycopg
    _bootstrap(pg_url)
    r = client.post("/v1/auth/register", json={
        "email": "b@e.com", "password": "password1", "audience": "questionnaire-apps"})
    assert r.status_code == 202, r.text
    # verify the granted role directly (the 202 body carries no account info)
    with psycopg.connect(pg_url) as c:
        granted = {row[0] for row in c.execute(
            "SELECT r.role FROM user_roles r JOIN users u ON u.id=r.user_id WHERE u.email=%s",
            ("b@e.com",)).fetchall()}
    assert granted == {"participant"}
    assert not (granted & {"researcher", "reviewer", "administrator", "contributor"})


def test_jwks_endpoint(client, pg_url):
    _bootstrap(pg_url)
    r = client.get("/.well-known/jwks.json")
    assert r.status_code == 200
    assert r.json()["keys"][0]["kty"] == "OKP"


def test_bad_login_is_401(client, pg_url):
    _bootstrap(pg_url)
    client.post("/v1/auth/register", json={
        "email": "a@e.com", "password": "password1", "audience": "questionnaire-apps"})
    r = client.post("/v1/auth/login", json={
        "email": "a@e.com", "password": "nope", "audience": "questionnaire-apps"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"
    assert r.json()["error"]["message"] == "Invalid email or password."
