import psycopg
from fastapi import Depends, Header, HTTPException
from ..config import get_settings
from .. import tokens
from ..store import sessions as session_store


def get_conn():
    conn = psycopg.connect(get_settings().database_url)
    try:
        yield conn
    finally:
        conn.close()


def require_session(session_id: str, authorization: str | None = Header(default=None),
                    conn=Depends(get_conn)) -> dict:
    """Validate the Bearer session token against the session's stored hash. FastAPI caches
    get_conn within a request, so this shares the route's connection."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    sess = session_store.get_session_for_auth(conn, session_id, tokens.hash_token(token))
    if sess is None:
        raise HTTPException(status_code=401, detail="invalid session token")
    return sess
