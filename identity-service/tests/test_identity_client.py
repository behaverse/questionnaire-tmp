import json
import time
import pytest
import jwt
from identity_service.keys import generate_keypair
from identity_service import tokens, identity_client


def test_jwks_cache_selects_by_kid_and_refetches():
    kid, jwk, pem = generate_keypair()
    calls = {"n": 0}
    def fetcher():
        calls["n"] += 1
        return {"keys": [jwk]}
    cache = identity_client.JwksCache("http://id/jwks", fetcher=fetcher)
    assert cache.key_for(kid)["kid"] == kid
    assert calls["n"] == 1
    cache.key_for(kid)                       # cached, no refetch
    assert calls["n"] == 1
    with pytest.raises(KeyError):
        cache.key_for("unknown-kid")         # refetches once trying to find it
    assert calls["n"] == 2


def test_verify_happy_path_and_failures():
    kid, jwk, pem = generate_keypair()
    cache = identity_client.JwksCache("http://id/jwks", fetcher=lambda: {"keys": [jwk]})
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1", aud="questionnaire-apps",
                             roles=["reviewer"], issuer="http://id", ttl=900)
    claims = identity_client.verify(tok, jwks=cache, audience="questionnaire-apps",
                                    issuer="http://id")
    assert claims["roles"] == ["reviewer"]
    with pytest.raises(jwt.InvalidAudienceError):
        identity_client.verify(tok, jwks=cache, audience="other", issuer="http://id")


def test_verify_rejects_token_without_kid():
    kid, jwk, pem = generate_keypair()
    cache = identity_client.JwksCache("http://id/jwks", fetcher=lambda: {"keys": [jwk]})
    now = int(time.time())
    token = jwt.encode(
        {"sub": "u1", "aud": "questionnaire-apps", "iss": "http://id",
         "iat": now, "exp": now + 900, "roles": []},
        pem,
        algorithm="EdDSA",
    )  # no headers={"kid": ...} → no kid in header
    with pytest.raises(jwt.InvalidTokenError):
        identity_client.verify(token, jwks=cache, audience="questionnaire-apps", issuer="http://id")


def test_require_roles_allows_and_denies():
    dep_ok = identity_client.require_roles("reviewer")
    assert dep_ok({"roles": ["reviewer", "researcher"]}) == {"roles": ["reviewer", "researcher"]}
    dep_bad = identity_client.require_roles("administrator")
    with pytest.raises(Exception):           # HTTPException(403)
        dep_bad({"roles": ["researcher"]})
