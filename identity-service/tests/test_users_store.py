import pytest
import psycopg
from identity_service.roles import ROLES, is_valid
from identity_service.store import clients as cstore
from identity_service.store import users as ustore


def test_role_vocabulary():
    assert ROLES == {"researcher", "participant", "reviewer", "contributor", "administrator"}
    assert is_valid("researcher") and not is_valid("god")


def test_create_client_and_user(conn):
    cid = cstore.create(conn, "questionnaire-apps", "Questionnaire Apps")
    assert cstore.by_slug(conn, "questionnaire-apps")["id"] == cid
    uid = ustore.create(conn, "a@e.com", "hash", "Ada")
    u = ustore.by_email(conn, "a@e.com")
    assert u["id"] == uid and u["display_name"] == "Ada"
    assert ustore.by_email(conn, "A@E.COM")["id"] == uid     # citext case-insensitive


def test_duplicate_email_raises(conn):
    ustore.create(conn, "a@e.com", "h")
    with pytest.raises(psycopg.errors.UniqueViolation):
        ustore.create(conn, "a@e.com", "h2")


def test_grant_revoke_and_read_roles(conn):
    cid = cstore.create(conn, "qa", "QA")
    uid = ustore.create(conn, "a@e.com", "h")
    ustore.grant_role(conn, uid, cid, "researcher")
    ustore.grant_role(conn, uid, cid, "researcher")          # idempotent
    ustore.grant_role(conn, uid, cid, "administrator")
    assert sorted(ustore.roles_for(conn, uid, cid)) == ["administrator", "researcher"]
    ustore.revoke_role(conn, uid, cid, "researcher")
    assert ustore.roles_for(conn, uid, cid) == ["administrator"]
