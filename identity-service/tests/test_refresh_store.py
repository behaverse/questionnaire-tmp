import uuid
from datetime import datetime, timedelta, timezone
import psycopg
from identity_service.store import refresh as rstore
from identity_service.store import keys as kstore   # noqa: F401 (ensures store package import)


def _seed_user_client(conn):
    uid, cid = uuid.uuid4(), uuid.uuid4()
    conn.execute("INSERT INTO clients (id, slug, name) VALUES (%s,'qa','QA')", (cid,))
    conn.execute("INSERT INTO users (id, email, password_hash) VALUES (%s,%s,'x')",
                 (uid, f"{uid}@e.com"))
    return uid, cid


def _exp():
    return datetime.now(timezone.utc) + timedelta(days=30)


def test_issue_and_lookup(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rid = rstore.issue(conn, uid, cid, "h1", fam, _exp())
    row = rstore.lookup(conn, "h1")
    assert row["id"] == rid and row["family_id"] == fam
    assert rstore.is_reuse(row) is False


def test_rotate_marks_old_and_chains(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rstore.issue(conn, uid, cid, "h1", fam, _exp())
    old = rstore.lookup(conn, "h1")
    new_id = rstore.rotate(conn, old, "h2", _exp())
    old_after = rstore.lookup(conn, "h1")
    assert old_after["rotated_to"] == new_id
    assert rstore.is_reuse(old_after) is True        # presenting h1 again is reuse
    assert rstore.is_reuse(rstore.lookup(conn, "h2")) is False


def test_revoke_family(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rstore.issue(conn, uid, cid, "h1", fam, _exp())
    rstore.issue(conn, uid, cid, "h2", fam, _exp())
    rstore.revoke_family(conn, fam)
    assert rstore.is_reuse(rstore.lookup(conn, "h1")) is True
    assert rstore.is_reuse(rstore.lookup(conn, "h2")) is True
