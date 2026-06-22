from fastapi import Header, HTTPException
from identity_service.identity_client import JwksCache, verify
from ..config import get_settings

_cache: JwksCache | None = None


def install_test_cache(public_jwk: dict) -> None:
    """Test seam: install a fake-fetcher JwksCache exposing one public JWK."""
    global _cache
    _cache = JwksCache("test://jwks", fetcher=lambda: {"keys": [public_jwk]})


def _get_cache() -> JwksCache:
    global _cache
    if _cache is None:
        _cache = JwksCache(get_settings().identity_jwks_url)
    return _cache


def _verify(token: str) -> dict:
    s = get_settings()
    return verify(token, jwks=_get_cache(), audience=s.identity_audience, issuer=s.identity_issuer)


def _bearer(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[len("Bearer "):]


def require_user(authorization: str | None = Header(default=None)) -> dict:
    token = _bearer(authorization)
    if token is None:
        raise HTTPException(status_code=401, detail="missing bearer token")
    try:
        return _verify(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid access token")


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    claims = require_user(authorization)
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    """Return claims if a valid token is present, else None (never raises)."""
    token = _bearer(authorization)
    if token is None:
        return None
    try:
        return _verify(token)
    except Exception:
        return None
