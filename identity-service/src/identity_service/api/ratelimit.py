"""Per-IP rate limiting for the auth endpoints (brute-force + email-bombing guard).

`rate_limit("<bucket>")` returns a FastAPI dependency that rejects with 429 once the client IP has
exceeded that bucket's configured (count, window). It uses its own short-lived DB connection so a hit
is always recorded independently of the route's own transaction. Disable wholesale with
RATE_LIMIT_ENABLED=0 (tests set this); tune per route via RATE_LIMIT_LOGIN/REGISTER/RESET/VERIFY."""
import logging
import psycopg
from fastapi import Request, HTTPException
from ..config import get_settings
from ..store import rate_limit as rl_store

_log = logging.getLogger("identity.ratelimit")


def _client_ip(request: Request) -> str:
    """Best-effort trusted client IP for keying the limiter.

    Prefer platform-hardened headers over raw X-Forwarded-For, whose leftmost hop is client-controlled
    behind an APPENDING proxy (nginx/traefik/ALB) or on the direct Docker path (`uvicorn --host 0`) —
    there an attacker could rotate it to bypass the limit or forge a victim's IP to lock them out.
    On Vercel `x-vercel-forwarded-for` is spoof-safe (and `x-forwarded-for` is overwritten to the real
    client); off-Vercel we fall back to the socket peer rather than trusting a client-supplied XFF.
    Self-hosters behind an appending proxy should terminate on a header they control."""
    for h in ("x-vercel-forwarded-for", "x-real-ip"):
        v = request.headers.get(h, "").strip()
        if v:
            return v.split(",")[0].strip()
    xff = request.headers.get("x-forwarded-for", "").strip()
    if xff:
        return xff.split(",")[0].strip()
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
        try:
            with psycopg.connect(s.database_url) as c:
                allowed = rl_store.check_and_record(c, key, limit, window)
                c.commit()
        except Exception:
            # Fail OPEN: hits are non-security-critical (schema comment) — a limiter DB hiccup must
            # never 500 a legitimate login/register. The underlying auth path has its own DB guard.
            _log.warning("rate limiter unavailable for %s; allowing request", bucket, exc_info=True)
            return
        if not allowed:
            raise HTTPException(status_code=429, detail={
                "code": "rate_limited", "message": "too many requests — please wait and try again"})
    return dep
