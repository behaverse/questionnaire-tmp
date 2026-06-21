import hashlib
import json
import secrets
import time
import uuid

import jwt
from jwt.algorithms import OKPAlgorithm


def mint_refresh() -> str:
    """High-entropy, URL-safe opaque refresh token (returned to the client once)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hex of a token. Only the hash is stored at rest."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def sign_access(*, private_pem: str, kid: str, sub: str, aud: str, roles: list[str],
                issuer: str, ttl: int, now: int | None = None) -> str:
    iat = int(time.time()) if now is None else now
    claims = {
        "sub": sub, "aud": aud, "roles": roles, "iss": issuer,
        "iat": iat, "exp": iat + ttl, "jti": str(uuid.uuid4()),
    }
    return jwt.encode(claims, private_pem, algorithm="EdDSA", headers={"kid": kid})


def verify_access(token: str, *, public_jwk: dict, audience: str, issuer: str) -> dict:
    key = OKPAlgorithm.from_jwk(json.dumps(public_jwk))
    return jwt.decode(token, key, algorithms=["EdDSA"], audience=audience, issuer=issuer,
                      options={"require": ["exp", "iat", "sub", "aud", "iss"]})
