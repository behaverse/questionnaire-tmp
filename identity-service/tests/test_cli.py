import psycopg
from identity_service.cli import main
from identity_service.store import clients as cstore, users as ustore, keys as kstore


def test_migrate_generate_key_create_client_and_admin(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    assert main(["migrate"]) == 0
    with psycopg.connect(pg_url) as c:                  # migrate seeds the qa client
        assert cstore.by_slug(c, "questionnaire-apps") is not None

    assert main(["generate-key"]) == 0
    with psycopg.connect(pg_url) as c:
        assert kstore.signing_key(c) is not None

    assert main(["create-client", "--slug", "platform", "--name", "Platform"]) == 0
    assert main(["create-admin", "--email", "admin@e.com", "--password", "password1"]) == 0
    with psycopg.connect(pg_url) as c:
        u = ustore.by_email(c, "admin@e.com")
        cid = cstore.by_slug(c, "questionnaire-apps")["id"]
        assert "administrator" in ustore.roles_for(c, u["id"], cid)


def test_usage_returns_2(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    assert main([]) == 2
