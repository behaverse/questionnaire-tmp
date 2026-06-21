from fastapi import Header, HTTPException
from identity_service.identity_client import JwksCache, verify
from ..config import get_settings

_RESEARCH_ROLES = frozenset({"researcher", "reviewer", "administrator"})
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


def _claims(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    s = get_settings()
    try:
        return verify(token, jwks=_get_cache(), audience=s.identity_audience, issuer=s.identity_issuer)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid access token")


def require_researcher(authorization: str | None = Header(default=None)) -> dict:
    claims = _claims(authorization)
    if not (_RESEARCH_ROLES & set(claims.get("roles", []))):
        raise HTTPException(status_code=403, detail="researcher role required")
    return claims


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    claims = _claims(authorization)
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims
