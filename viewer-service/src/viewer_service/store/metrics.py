import psycopg


def session_status_counts(conn: psycopg.Connection, deployment_id: str) -> dict:
    rows = conn.execute("SELECT status, count(*) FROM session WHERE deployment_id=%s GROUP BY status",
                        (deployment_id,)).fetchall()
    return {status: n for status, n in rows}


def recent_submitted(conn: psycopg.Connection, deployment_id: str, limit: int = 10) -> list[dict]:
    rows = conn.execute(
        "SELECT session_id, session_index, status, submitted_at, forwarded_at FROM session "
        "WHERE deployment_id=%s AND status IN ('submitted','forwarded') "
        "ORDER BY submitted_at DESC NULLS LAST LIMIT %s", (deployment_id, limit)).fetchall()
    cols = ["session_id", "session_index", "status", "submitted_at", "forwarded_at"]
    return [dict(zip(cols, r)) for r in rows]


def outbox_forwarding_stats(conn: psycopg.Connection, deployment_id: str) -> dict:
    row = conn.execute(
        "SELECT count(*) FILTER (WHERE o.status='pending'), "
        "min(o.created_at) FILTER (WHERE o.status='pending') "
        "FROM outbox o JOIN session s ON o.session_id=s.session_id WHERE s.deployment_id=%s",
        (deployment_id,)).fetchone()
    err = conn.execute(
        "SELECT o.last_error FROM outbox o JOIN session s ON o.session_id=s.session_id "
        "WHERE s.deployment_id=%s AND o.last_error IS NOT NULL ORDER BY o.id DESC LIMIT 1",
        (deployment_id,)).fetchone()
    return {"unforwarded": row[0] or 0, "oldest_created_at": row[1],
            "last_error": err[0] if err else None}
