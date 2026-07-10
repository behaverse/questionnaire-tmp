"""Per-IP rate limiting for the auth endpoints (brute-force + email-bombing guard).

`rate_limit("<bucket>")` returns a FastAPI dependency that rejects with 429 once the client IP has
exceeded that bucket's configured (count, window). It uses its own short-lived DB connection so a hit
is always recorded independently of the route's own transaction. Disable wholesale with
RATE_LIMIT_ENABLED=0 (tests set this); tune per route via RATE_LIMIT_LOGIN/REGISTER/RESET/VERIFY."""
import psycopg
from fastapi import Request, HTTPException
from ..config import get_settings
from ..store import rate_limit as rl_store


def _client_ip(request: Request) -> str:
    """Vercel/proxies set X-Forwarded-For; the first hop is the real client. Fall back to the socket."""
    xff = request.headers.get("x-forwarded-for", "")
    first = xff.split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str):
    def dep(request: Request):
        s = get_settings()
        if not s.rate_limit_enabled:
            return
        limit, window = s.rate_limits.get(bucket, (0, 0))
        if limit <= 0:
            return
        key = f"{bucket}:{_client_ip(request)}"
        with psycopg.connect(s.database_url) as c:
            allowed = rl_store.check_and_record(c, key, limit, window)
            c.commit()
        if not allowed:
            raise HTTPException(status_code=429, detail={
                "code": "rate_limited", "message": "too many requests — please wait and try again"})
    return dep
