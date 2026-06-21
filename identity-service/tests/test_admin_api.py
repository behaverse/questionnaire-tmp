import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore, users as ustore
from identity_service import passwords


def _bootstrap_admin(pg_url):
    """Seed a key, the client, and an administrator user; return admin login creds."""
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cid = cstore.create(c, "questionnaire-apps", "QA")
        uid = ustore.create(c, "admin@e.com", passwords.hash_password("password1"))
        ustore.grant_role(c, uid, cid, "administrator")
        c.commit()


def _admin_token(client):
    r = client.post("/v1/auth/login", json={
        "email": "admin@e.com", "password": "password1", "audience": "questionnaire-apps"})
    return r.json()["access_token"]


def test_admin_grants_role(client, pg_url):
    _bootstrap_admin(pg_url)
    tok = _admin_token(client)
    H = {"Authorization": f"Bearer {tok}"}
    # register a plain researcher
    client.post("/v1/auth/register", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"})
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    target = next(u for u in users if u["email"] == "r@e.com")

    r = client.post(f"/v1/admin/users/{target['id']}/roles", headers=H,
                    json={"client": "questionnaire-apps", "role": "reviewer"})
    assert r.status_code == 204
    detail = client.get(f"/v1/admin/users/{target['id']}", headers=H).json()
    assert "reviewer" in detail["roles"]["questionnaire-apps"]


def test_non_admin_forbidden(client, pg_url):
    _bootstrap_admin(pg_url)
    client.post("/v1/auth/register", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"})
    tok = client.post("/v1/auth/login", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"}
    ).json()["access_token"]
    r = client.get("/v1/admin/users", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 403


def test_create_client(client, pg_url):
    _bootstrap_admin(pg_url)
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    r = client.post("/v1/admin/clients", headers=H, json={"slug": "platform", "name": "Platform"})
    assert r.status_code == 201
    slugs = [c["slug"] for c in client.get("/v1/admin/clients", headers=H).json()["clients"]]
    assert "platform" in slugs


def test_invalid_role_rejected(client, pg_url):
    _bootstrap_admin(pg_url)
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    uid = users[0]["id"]
    r = client.post(f"/v1/admin/users/{uid}/roles", headers=H,
                    json={"client": "questionnaire-apps", "role": "wizard"})
    assert r.status_code == 422
