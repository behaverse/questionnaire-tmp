import uuid
from datetime import datetime
import psycopg


def issue(conn: psycopg.Connection, user_id, kind: str, token_hash: str,
          expires_at: datetime) -> uuid.UUID:
    tid = uuid.uuid4()
    conn.execute(
        "INSERT INTO email_tokens (id, user_id, kind, token_hash, expires_at) "
        "VALUES (%s,%s,%s,%s,%s)", (tid, user_id, kind, token_hash, expires_at))
    return tid


def consume(conn: psycopg.Connection, kind: str, token_hash: str) -> dict | None:
    """Atomically mark consumed and return the row, only if valid (right kind, unconsumed,
    unexpired). Returns None otherwise."""
    cur = conn.execute(
        "UPDATE email_tokens SET consumed_at = now() "
        "WHERE token_hash = %s AND kind = %s AND consumed_at IS NULL AND expires_at > now() "
        "RETURNING id, user_id, kind", (token_hash, kind))
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))
