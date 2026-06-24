from fastapi import APIRouter, Depends, Header, HTTPException
from .deps import get_conn
from ..config import get_settings
from ..service import maintenance

router = APIRouter()


def _require_cron(authorization: str | None = Header(default=None)):
    """Fail-closed: rejects unless Authorization is exactly `Bearer <CRON_SECRET>` and the
    secret is configured. Matches Vercel Cron's `Authorization: Bearer ${CRON_SECRET}`."""
    secret = get_settings().cron_secret
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="unauthorized")


@router.get("/internal/reap")
def reap(_=Depends(_require_cron), conn=Depends(get_conn)):
    counts = maintenance.reap_expired(conn, grace_seconds=0)
    conn.commit()
    return {"reaped": counts}
