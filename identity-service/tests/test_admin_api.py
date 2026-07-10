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
    # register a plain user (participant by default), then an admin elevates them
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
    assert r.status_code == 201 and r.json()["slug"] == "platform"
    # duplicate → 409
    assert client.post("/v1/admin/clients", headers=H,
                       json={"slug": "platform", "name": "P"}).status_code == 409
    # admin reads are audience-scoped: the caller (aud=questionnaire-apps) sees only its own client
    slugs = [c["slug"] for c in client.get("/v1/admin/clients", headers=H).json()["clients"]]
    assert slugs == ["questionnaire-apps"]


def test_admin_reads_are_audience_scoped(client, pg_url):
    """An administrator of one client must not enumerate another client's users (PII) or registry."""
    _bootstrap_admin(pg_url)  # admin@e.com is administrator of questionnaire-apps
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    # a second client with its own user, none of which touch questionnaire-apps
    with __import__("psycopg").connect(pg_url) as c:
        other = cstore.create(c, "other-client", "Other")
        oid = ustore.create(c, "outsider@e.com", passwords.hash_password("password1"))
        ustore.grant_role(c, oid, other, "researcher")
        c.commit()
    emails = {u["email"] for u in client.get("/v1/admin/users", headers=H).json()["users"]}
    assert "outsider@e.com" not in emails            # cross-client user is invisible
    # and the outsider is a 404 by id (existence not confirmable)
    assert client.get(f"/v1/admin/users/{oid}", headers=H).status_code == 404


def test_invalid_role_rejected(client, pg_url):
    _bootstrap_admin(pg_url)
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    uid = users[0]["id"]
    r = client.post(f"/v1/admin/users/{uid}/roles", headers=H,
                    json={"client": "questionnaire-apps", "role": "wizard"})
    assert r.status_code == 422


def test_admin_cannot_grant_in_other_audience(client, pg_url):
    """Admin of questionnaire-apps must NOT be able to grant roles in another client."""
    _bootstrap_admin(pg_url)

    # Create a second client directly via the store
    with psycopg.connect(pg_url) as c:
        cstore.create(c, "other-project", "Other Project")
        c.commit()

    # Admin token is scoped to questionnaire-apps (that is where they hold administrator)
    tok = _admin_token(client)
    H = {"Authorization": f"Bearer {tok}"}

    # Register a plain user to be the target of the grant attempt
    client.post("/v1/auth/register", json={
        "email": "plain@e.com", "password": "password1", "audience": "questionnaire-apps"})
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    target = next(u for u in users if u["email"] == "plain@e.com")

    # Attempt to grant a role in other-project — must be 403
    r = client.post(f"/v1/admin/users/{target['id']}/roles", headers=H,
                    json={"client": "other-project", "role": "reviewer"})
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

    # Granting in questionnaire-apps (where caller IS admin) must still work
    r2 = client.post(f"/v1/admin/users/{target['id']}/roles", headers=H,
                     json={"client": "questionnaire-apps", "role": "reviewer"})
    assert r2.status_code == 204
