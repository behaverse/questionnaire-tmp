import uuid
from datetime import datetime, timedelta, timezone
from identity_service.mailer import NullMailer
from identity_service.store import email_tokens as et
from identity_service.store import users as ustore


def _exp(seconds=3600):
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)


def test_null_mailer_records():
    m = NullMailer()
    m.send("a@e.com", "Verify", "click here")
    assert m.sent == [("a@e.com", "Verify", "click here")]


def test_consume_once(conn):
    uid = ustore.create(conn, "a@e.com", "h")
    et.issue(conn, uid, "verify", "h1", _exp())
    row = et.consume(conn, "verify", "h1")
    assert row["user_id"] == uid
    assert et.consume(conn, "verify", "h1") is None      # already consumed


def test_consume_wrong_kind_or_expired(conn):
    uid = ustore.create(conn, "a@e.com", "h")
    et.issue(conn, uid, "reset", "h2", _exp(seconds=-10))   # already expired
    assert et.consume(conn, "reset", "h2") is None
    et.issue(conn, uid, "verify", "h3", _exp())
    assert et.consume(conn, "reset", "h3") is None          # kind mismatch
