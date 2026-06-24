import uuid
from datetime import datetime
import psycopg


def issue(conn: psycopg.Connection, user_id, client_id, code_hash: str,
          expires_at: datetime) -> uuid.UUID:
    hid = uuid.uuid4()
    conn.execute(
        "INSERT INTO handoff_codes (id, user_id, client_id, code_hash, expires_at) "
        "VALUES (%s,%s,%s,%s,%s)", (hid, user_id, client_id, code_hash, expires_at))
    return hid


def consume(conn: psycopg.Connection, code_hash: str) -> dict | None:
    """Atomically mark consumed and return the row, only if valid (unconsumed, unexpired).
    Single-use: a second consume of the same code returns None."""
    cur = conn.execute(
        "UPDATE handoff_codes SET consumed_at = now() "
        "WHERE code_hash = %s AND consumed_at IS NULL AND expires_at > now() "
        "RETURNING id, user_id, client_id", (code_hash,))
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))
