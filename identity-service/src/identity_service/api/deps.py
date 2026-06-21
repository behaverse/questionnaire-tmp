import psycopg
from fastapi import Depends, Header, HTTPException
from ..config import get_settings


def get_conn():
    conn = psycopg.connect(get_settings().database_url)
    try:
        yield conn
    finally:
        conn.close()


def require_access(authorization: str | None = Header(default=None), conn=Depends(get_conn)):
    """Verify the Bearer access JWT against the service's own active JWKS. Returns claims."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    from .. import tokens
    from ..service import jwks
    import jwt as _jwt
    s = get_settings()
    doc = jwks.public_jwks(conn)
    last_err = None
    for key in doc["keys"]:
        try:
            # audience is taken from the token itself here; per-route audience checks
            # belong to the consuming services (ID-B+). We accept any registered audience.
            unverified = _jwt.decode(token, options={"verify_signature": False})
            return tokens.verify_access(token, public_jwk=key,
                                        audience=unverified.get("aud"), issuer=s.issuer)
        except Exception as e:                          # try next kid
            last_err = e
    raise HTTPException(status_code=401, detail="invalid access token")


def require_admin(claims=Depends(require_access)):
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims
