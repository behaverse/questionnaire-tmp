from datetime import datetime, timedelta, timezone

from denormaliser import canonical_hash

from .sinks import SinkError
from .store import outbox as outbox_store
from .store import sessions as session_store


def backoff_seconds(attempts: int) -> int:
    """Exponential back-off capped at 1 hour."""
    return min(2 ** attempts, 3600)


def process_outbox_batch(conn, sink, *, batch_size: int = 50, max_attempts: int = 8,
                         now: datetime | None = None) -> dict:
    """Claim due outbox rows (FOR UPDATE SKIP LOCKED), forward each via the sink, and
    apply back-off / max-attempts. Sessions that are 'submitted' with no remaining
    pending/failed rows transition to 'forwarded'. Commits once at the end."""
    now = now or datetime.now(timezone.utc)
    due = outbox_store.claim_due(conn, batch_size)
    summary = {"forwarded": 0, "failed": 0, "retried": 0}
    affected: set[str] = set()

    for row in due:
        affected.add(row["session_id"])
        if canonical_hash(row["payload"]) != row["payload_sha256"]:
            outbox_store.mark_failed(conn, row["id"], row["attempts"] + 1, "payload sha256 mismatch")
            summary["failed"] += 1
            continue
        try:
            sink.send(row["kind"], row["payload"])
        except SinkError as e:
            attempts = row["attempts"] + 1
            if attempts >= max_attempts:
                outbox_store.mark_failed(conn, row["id"], attempts, str(e))
                summary["failed"] += 1
            else:
                outbox_store.mark_retry(conn, row["id"], attempts, str(e),
                                        now + timedelta(seconds=backoff_seconds(attempts)))
                summary["retried"] += 1
            continue
        outbox_store.mark_forwarded(conn, row["id"])
        summary["forwarded"] += 1

    for sid in affected:
        counts = outbox_store.counts_for_session(conn, sid)
        sess = session_store.get_session(conn, sid)
        if sess is None:
            continue
        if sess["status"] == "submitted" and counts["pending"] == 0 and counts["failed"] == 0:
            session_store.set_forwarded(conn, sid)
        elif counts["failed"] > 0:
            session_store.set_failure_reason(conn, sid, f"{counts['failed']} submission(s) failed forwarding")

    conn.commit()
    return summary
