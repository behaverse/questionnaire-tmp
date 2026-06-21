"""Standalone token verifier for consuming services (ID-B+ import this).

Depends only on PyJWT + httpx — never on the identity_service stores/DB.
"""
import json
import time

import httpx
import jwt
from jwt.algorithms import OKPAlgorithm


class JwksCache:
    def __init__(self, jwks_url: str, *, ttl: int = 300, fetcher=None):
        self._url = jwks_url
        self._ttl = ttl
        self._fetcher = fetcher or self._http_fetch
        self._keys: dict[str, dict] = {}
        self._fetched_at = 0.0

    def _http_fetch(self) -> dict:
        return httpx.get(self._url, timeout=5.0).json()

    def _refresh(self) -> None:
        doc = self._fetcher()
        self._keys = {k["kid"]: k for k in doc.get("keys", [])}
        self._fetched_at = time.monotonic()

    def key_for(self, kid: str) -> dict:
        stale = (time.monotonic() - self._fetched_at) >= self._ttl
        if not self._keys or stale:
            self._refresh()
        if kid not in self._keys:
            self._refresh()                    # unknown kid → one forced refetch (rotation)
        return self._keys[kid]                  # raises KeyError if still absent


def verify(token: str, *, jwks: JwksCache, audience: str, issuer: str) -> dict:
    kid = jwt.get_unverified_header(token).get("kid")
    if not kid:
        raise jwt.InvalidTokenError("token header missing kid")
    jwk = jwks.key_for(kid)
    key = OKPAlgorithm.from_jwk(json.dumps(jwk))
    return jwt.decode(token, key, algorithms=["EdDSA"], audience=audience, issuer=issuer,
                      options={"require": ["exp", "iat", "sub", "aud", "iss"]})


def require_roles(*required: str):
    """FastAPI dependency factory: pass through claims iff they carry every required role."""
    def _dep(claims: dict) -> dict:
        have = set(claims.get("roles", []))
        if not set(required) <= have:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="missing required role")
        return claims
    return _dep
