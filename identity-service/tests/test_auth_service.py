import pytest
from identity_service.config import get_settings
from identity_service.mailer import NullMailer
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore
from identity_service.service import auth, jwks


def _bootstrap(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    cstore.create(conn, "questionnaire-apps", "QA")
    return get_settings()


def test_register_login_profile_refresh(conn):
    s = _bootstrap(conn); m = NullMailer()
    auth.register(conn, s, m, email="a@e.com", password="pw1",
                  display_name="Ada", audience="questionnaire-apps")
    assert len(m.sent) == 1                            # verify email stub-sent

    toks = auth.login(conn, s, email="a@e.com", password="pw1", audience="questionnaire-apps")
    assert toks["token_type"] == "Bearer" and toks["expires_in"] == s.access_ttl
    claims = jwks_verify(conn, toks["access_token"], s)
    assert claims["roles"] == ["participant"] and claims["aud"] == "questionnaire-apps"

    rot = auth.refresh(conn, s, refresh_token=toks["refresh_token"])
    assert rot["refresh_token"] != toks["refresh_token"]
    with pytest.raises(auth.ReuseDetected):            # old refresh now reuse
        auth.refresh(conn, s, refresh_token=toks["refresh_token"])


def test_bad_password_and_unknown_client(conn):
    s = _bootstrap(conn)
    auth.register(conn, s, NullMailer(), email="a@e.com", password="pw1",
                  display_name="", audience="questionnaire-apps")
    with pytest.raises(auth.InvalidCredentials):
        auth.login(conn, s, email="a@e.com", password="WRONG", audience="questionnaire-apps")
    with pytest.raises(auth.UnknownClient):
        auth.login(conn, s, email="a@e.com", password="pw1", audience="nope")


def test_register_is_enumeration_resistant(conn):
    """A second registration with an existing email must NOT raise, must NOT create a second account
    or overwrite the password, and must notify the real owner — so registration can't probe existence."""
    s = _bootstrap(conn); m = NullMailer()
    auth.register(conn, s, m, email="a@e.com", password="pw1",
                  display_name="", audience="questionnaire-apps")
    # duplicate attempt (case-insensitive email) — no raise, no second account, password unchanged
    auth.register(conn, s, m, email="A@E.COM", password="pw2",
                  display_name="", audience="questionnaire-apps")
    assert conn.execute("SELECT count(*) FROM users").fetchone()[0] == 1
    auth.login(conn, s, email="a@e.com", password="pw1", audience="questionnaire-apps")   # original pw works
    with pytest.raises(auth.InvalidCredentials):
        auth.login(conn, s, email="a@e.com", password="pw2", audience="questionnaire-apps")  # pw2 didn't take
    # the duplicate attempt sent a "you already have an account" notice to the real owner
    assert len(m.sent) == 2 and "already have an account" in m.sent[1][1].lower()


def test_public_jwks_lists_active_key(conn):
    _bootstrap(conn)
    doc = jwks.public_jwks(conn)
    assert len(doc["keys"]) == 1 and doc["keys"][0]["kty"] == "OKP"
    assert "private_pem" not in str(doc) and "d" not in doc["keys"][0]


# helper: verify an access token against the service's own JWKS
def jwks_verify(conn, token, s):
    from identity_service import tokens
    doc = jwks.public_jwks(conn)
    return tokens.verify_access(token, public_jwk=doc["keys"][0],
                                audience="questionnaire-apps", issuer=s.issuer)


def test_verify_email_consumes_and_sets_flag(conn):
    s = _bootstrap(conn); m = NullMailer()
    auth.register(conn, s, m, email="vera@e.com", password="pw1",
                  display_name="Vera", audience="questionnaire-apps")
    # extract raw token from mailer body (link ends with ?token=<raw>)
    body = m.sent[0][2]
    raw = body.split("token=", 1)[1].strip()

    auth.verify_email(conn, token=raw)

    from identity_service.store import users as ustore
    user = ustore.by_email(conn, "vera@e.com")
    assert user["email_verified"] is True

    # consume-once: second call with same token must raise InvalidToken
    with pytest.raises(auth.InvalidToken):
        auth.verify_email(conn, token=raw)


def test_reset_password_changes_hash_and_revokes_refresh(conn):
    s = _bootstrap(conn); m = NullMailer()
    auth.register(conn, s, m, email="rex@e.com", password="oldpass1",
                  display_name="Rex", audience="questionnaire-apps")

    toks = auth.login(conn, s, email="rex@e.com", password="oldpass1",
                      audience="questionnaire-apps")
    old_refresh = toks["refresh_token"]

    m2 = NullMailer()
    auth.request_password_reset(conn, s, m2, email="rex@e.com")
    reset_body = m2.sent[0][2]
    raw_reset = reset_body.split("token=", 1)[1].strip()

    auth.reset_password(conn, token=raw_reset, new_password="newpassword9")

    # (i) old password no longer works
    with pytest.raises(auth.InvalidCredentials):
        auth.login(conn, s, email="rex@e.com", password="oldpass1",
                   audience="questionnaire-apps")

    # (ii) new password works
    new_toks = auth.login(conn, s, email="rex@e.com", password="newpassword9",
                          audience="questionnaire-apps")
    assert new_toks["token_type"] == "Bearer"

    # (iii) old refresh token is revoked — must raise an AuthError subclass
    with pytest.raises(auth.AuthError):
        auth.refresh(conn, s, refresh_token=old_refresh)


def test_request_password_reset_no_enumeration(conn):
    s = _bootstrap(conn); m = NullMailer()
    result = auth.request_password_reset(conn, s, m, email="nobody@nowhere.com")
    assert result is None
    assert m.sent == []
