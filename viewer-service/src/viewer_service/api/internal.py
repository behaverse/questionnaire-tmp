import psycopg
from fastapi import APIRouter, Depends, Header, HTTPException
from ..config import get_settings
from ..forwarding import process_outbox_batch
from ..sinks import HTTPBehaverseSink

router = APIRouter()


def _require_cron(authorization: str | None = Header(default=None)):
    """Fail-closed cron guard. Matches Vercel Cron's `Authorization: Bearer ${CRON_SECRET}`."""
    secret = get_settings().cron_secret
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="unauthorized")


@router.get("/internal/forward")
def forward(_=Depends(_require_cron)):
    s = get_settings()
    sink = HTTPBehaverseSink(s.behaverse_base_url, s.behaverse_bearer_token)
    with psycopg.connect(s.database_url) as conn:          # context commits on success
        summary = process_outbox_batch(conn, sink, batch_size=s.forward_batch_size,
                                       max_attempts=s.forward_max_attempts)
    return {"forwarded": summary}
