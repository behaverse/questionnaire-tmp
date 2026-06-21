import time
import jwt
import pytest
from identity_service.keys import generate_keypair
from identity_service import tokens


def _key():
    kid, jwk, pem = generate_keypair()
    return kid, jwk, pem


def test_refresh_token_opaque_and_hashed():
    t = tokens.mint_refresh()
    assert len(t) >= 32
    h = tokens.hash_token(t)
    assert len(h) == 64 and h == tokens.hash_token(t)   # stable sha256 hex


def test_sign_then_verify_roundtrip():
    kid, jwk, pem = _key()
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=["researcher"],
                             issuer="http://id", ttl=900)
    claims = tokens.verify_access(tok, public_jwk=jwk,
                                  audience="questionnaire-apps", issuer="http://id")
    assert claims["sub"] == "u1"
    assert claims["roles"] == ["researcher"]
    assert jwt.get_unverified_header(tok)["kid"] == kid


def test_wrong_audience_rejected():
    kid, jwk, pem = _key()
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1", aud="other",
                             roles=[], issuer="http://id", ttl=900)
    with pytest.raises(jwt.InvalidAudienceError):
        tokens.verify_access(tok, public_jwk=jwk,
                             audience="questionnaire-apps", issuer="http://id")


def test_expired_rejected():
    kid, jwk, pem = _key()
    past = int(time.time()) - 10
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=[], issuer="http://id",
                             ttl=1, now=past)
    with pytest.raises(jwt.ExpiredSignatureError):
        tokens.verify_access(tok, public_jwk=jwk,
                             audience="questionnaire-apps", issuer="http://id")


def test_tampered_signature_rejected():
    kid, jwk, pem = _key()
    other = generate_keypair()                       # different key
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=[], issuer="http://id", ttl=900)
    with pytest.raises(jwt.InvalidSignatureError):
        tokens.verify_access(tok, public_jwk=other[1],
                             audience="questionnaire-apps", issuer="http://id")
