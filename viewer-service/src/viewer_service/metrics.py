from datetime import datetime, timezone

from .store import metrics as mstore
from .store import deployments as dep_store


def deployment_metrics(conn, deployment_id: str, *, soft_threshold: int, now: datetime | None = None) -> dict:
    """Per-deployment metrics snapshot for the monitoring dashboard (UC-12)."""
    now = now or datetime.now(timezone.utc)
    counts = mstore.session_status_counts(conn, deployment_id)
    started = sum(counts.values())
    completed = counts.get("submitted", 0) + counts.get("forwarded", 0)
    quota = (dep_store.get_deployment(conn, deployment_id) or {}).get("quota") or {}
    max_sessions = quota.get("max_sessions")
    fwd = mstore.outbox_forwarding_stats(conn, deployment_id)
    oldest_age = (now - fwd["oldest_created_at"]).total_seconds() if fwd["oldest_created_at"] else None
    return {
        "active_sessions": counts.get("in_progress", 0),
        "completion": {"started": started, "completed": completed,
                       "rate": (completed / started) if started else 0.0},
        "quota": {"max_sessions": max_sessions, "used": started,
                  "remaining": (max_sessions - started) if max_sessions is not None else None},
        "recent_submissions": mstore.recent_submitted(conn, deployment_id),
        "forwarding": {"unforwarded": fwd["unforwarded"],
                       "oldest_unforwarded_age_seconds": oldest_age,
                       "last_error": fwd["last_error"],
                       "alert": fwd["unforwarded"] >= soft_threshold},
    }
