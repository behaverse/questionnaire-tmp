import psycopg
from datetime import datetime
from psycopg.types.json import Jsonb


def enqueue(conn: psycopg.Connection, session_id: str, kind: str, payload: dict,
            payload_sha256: str) -> int:
    row = conn.execute(
        "INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
        "VALUES (%s,%s,%s,%s) RETURNING id",
        (session_id, kind, Jsonb(payload), payload_sha256)).fetchone()
    return row[0]


def depth(conn: psycopg.Connection) -> int:
    return conn.execute("SELECT count(*) FROM outbox WHERE status='pending'").fetchone()[0]


def claim_due(conn: psycopg.Connection, limit: int) -> list[dict]:
    rows = conn.execute(
        "SELECT id, session_id, kind, payload, payload_sha256, attempts FROM outbox "
        "WHERE status='pending' AND next_attempt_at<=now() ORDER BY id LIMIT %s "
        "FOR UPDATE SKIP LOCKED", (limit,)).fetchall()
    cols = ["id", "session_id", "kind", "payload", "payload_sha256", "attempts"]
    return [dict(zip(cols, r)) for r in rows]


def mark_forwarded(conn: psycopg.Connection, outbox_id: int) -> None:
    conn.execute("UPDATE outbox SET status='forwarded', forwarded_at=now() WHERE id=%s", (outbox_id,))


def mark_retry(conn: psycopg.Connection, outbox_id: int, attempts: int, last_error: str,
               next_attempt_at: datetime) -> None:
    conn.execute("UPDATE outbox SET attempts=%s, last_error=%s, next_attempt_at=%s WHERE id=%s",
                 (attempts, last_error, next_attempt_at, outbox_id))


def mark_failed(conn: psycopg.Connection, outbox_id: int, attempts: int, last_error: str) -> None:
    conn.execute("UPDATE outbox SET status='failed', attempts=%s, last_error=%s WHERE id=%s",
                 (attempts, last_error, outbox_id))


def counts_for_session(conn: psycopg.Connection, session_id: str) -> dict:
    rows = conn.execute("SELECT status, count(*) FROM outbox WHERE session_id=%s GROUP BY status",
                        (session_id,)).fetchall()
    out = {"pending": 0, "forwarded": 0, "failed": 0}
    for status, n in rows:
        out[status] = n
    return out
