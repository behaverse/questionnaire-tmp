import psycopg
from identity_service.config import get_settings
from identity_service.mailer import NullMailer
from identity_service.service import auth
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore

AUD = "questionnaire-apps"


def _settings():
    return get_settings()  # web_viewer_base_url default http://localhost:5173


def _bootstrap(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    cstore.create(conn, AUD, "QA")
    conn.commit()


def test_register_email_contains_verify_link(conn):
    _bootstrap(conn); s = _settings(); m = NullMailer()
    auth.register(conn, s, m, email="a@e.com", password="password1", display_name="A", audience=AUD)
    body = m.sent[0][2]
    assert f"{s.web_viewer_base_url}/verify-email?token=" in body
    raw = body.split("token=", 1)[1].strip()
    auth.verify_email(conn, token=raw)  # the linked token still verifies


def test_request_reset_email_contains_reset_link(conn):
    _bootstrap(conn); s = _settings()
    auth.register(conn, s, NullMailer(), email="b@e.com", password="password1", display_name="B", audience=AUD)
    m = NullMailer()
    auth.request_password_reset(conn, s, m, email="b@e.com")
    body = m.sent[0][2]
    assert f"{s.web_viewer_base_url}/reset-password?token=" in body
    raw = body.split("token=", 1)[1].strip()
    auth.reset_password(conn, token=raw, new_password="newpassword9")  # the linked token still resets


def test_request_reset_swallows_a_failing_mailer(conn):
    _bootstrap(conn); s = _settings()
    auth.register(conn, s, NullMailer(), email="c@e.com", password="password1", display_name="C", audience=AUD)

    class Boom:
        def send(self, *a): raise RuntimeError("smtp down")

    auth.request_password_reset(conn, s, Boom(), email="c@e.com")  # must NOT raise
