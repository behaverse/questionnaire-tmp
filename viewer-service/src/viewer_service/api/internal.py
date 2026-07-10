import hmac
import psycopg
from fastapi import APIRouter, Depends, Header, HTTPException
from ..config import get_settings, forwarding_enabled
from ..forwarding import process_outbox_batch
from ..sinks import HTTPBehaverseSink
from .. import maintenance

router = APIRouter()


def _require_cron(authorization: str | None = Header(default=None)):
    """Fail-closed cron guard. Matches Vercel Cron's `Authorization: Bearer ${CRON_SECRET}`.
    Constant-time compare so the guard doesn't leak the secret via response timing."""
    secret = get_settings().cron_secret
    if not secret or not hmac.compare_digest(authorization or "", f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="unauthorized")


def _drain_outbox(s) -> dict:
    if not forwarding_enabled(s):
        return {"skipped": "forwarding disabled (no Behaverse sink configured)"}
    sink = HTTPBehaverseSink(s.behaverse_base_url, s.behaverse_bearer_token)
    # Drain in batches until nothing due is left (a single cron tick shouldn't cap at batch_size).
    totals = {"forwarded": 0, "failed": 0, "retried": 0, "batches": 0}
    with psycopg.connect(s.database_url) as conn:          # context commits on success
        while True:
            summary = process_outbox_batch(conn, sink, batch_size=s.forward_batch_size,
                                           max_attempts=s.forward_max_attempts)
            totals["batches"] += 1
            for k in ("forwarded", "failed", "retried"):
                totals[k] += summary.get(k, 0)
            if summary.get("forwarded", 0) == 0 or totals["batches"] >= 1000:
                break
    return totals


def _reap(s) -> dict:
    with psycopg.connect(s.database_url) as conn:
        counts = maintenance.reap(conn, replay_link_ttl_seconds=s.replay_link_ttl_seconds,
                                  ephemeral_ttl_seconds=s.ephemeral_session_ttl_seconds)
        conn.commit()
    return counts


@router.get("/internal/forward")
def forward(_=Depends(_require_cron)):
    # One maintenance tick: drain the outbox AND reap dead rows. Folded into a single cron so the
    # project stays within the Vercel Hobby per-account cron limit.
    s = get_settings()
    return {"forwarded": _drain_outbox(s), "reaped": _reap(s)}


@router.get("/internal/reap")
def reap(_=Depends(_require_cron)):
    # Separately invokable (manual / external scheduler) even though the forward cron also reaps.
    return {"reaped": _reap(get_settings())}
