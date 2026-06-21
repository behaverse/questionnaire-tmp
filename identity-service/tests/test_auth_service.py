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
    prof = auth.register(conn, s, m, email="a@e.com", password="pw1",
                         display_name="Ada", audience="questionnaire-apps")
    assert prof["email"] == "a@e.com" and prof["roles"] == ["researcher"]
    assert len(m.sent) == 1                            # verify email stub-sent

    toks = auth.login(conn, s, email="a@e.com", password="pw1", audience="questionnaire-apps")
    assert toks["token_type"] == "Bearer" and toks["expires_in"] == s.access_ttl
    claims = jwks_verify(conn, toks["access_token"], s)
    assert claims["roles"] == ["researcher"] and claims["aud"] == "questionnaire-apps"

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


def test_email_in_use(conn):
    s = _bootstrap(conn)
    auth.register(conn, s, NullMailer(), email="a@e.com", password="pw1",
                  display_name="", audience="questionnaire-apps")
    with pytest.raises(auth.EmailInUse):
        auth.register(conn, s, NullMailer(), email="A@E.COM", password="pw2",
                      display_name="", audience="questionnaire-apps")


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
