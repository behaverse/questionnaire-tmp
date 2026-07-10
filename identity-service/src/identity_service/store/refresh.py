import uuid
from datetime import datetime
import psycopg


def _row(conn, sql, args):
    cur = conn.execute(sql, args)
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    cols = [d.name for d in cur.description]
    return dict(zip(cols, r))


def issue(conn: psycopg.Connection, user_id, client_id, token_hash: str,
          family_id, expires_at: datetime) -> uuid.UUID:
    rid = uuid.uuid4()
    conn.execute(
        "INSERT INTO refresh_tokens (id, user_id, client_id, token_hash, family_id, expires_at) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        (rid, user_id, client_id, token_hash, family_id, expires_at),
    )
    return rid


def lookup(conn: psycopg.Connection, token_hash: str) -> dict | None:
    return _row(conn,
        "SELECT id, user_id, client_id, family_id, expires_at, revoked_at, rotated_to "
        "FROM refresh_tokens WHERE token_hash = %s", (token_hash,))


def lookup_for_update(conn: psycopg.Connection, token_hash: str) -> dict | None:
    """Same as `lookup` but locks the row (FOR UPDATE) so concurrent refreshes of the same token
    serialize: the second waits, then reads the now-rotated row and is caught by reuse-detection —
    instead of both passing the reuse check and forking the family into two valid tokens."""
    return _row(conn,
        "SELECT id, user_id, client_id, family_id, expires_at, revoked_at, rotated_to "
        "FROM refresh_tokens WHERE token_hash = %s FOR UPDATE", (token_hash,))


def rotate(conn: psycopg.Connection, old_row: dict, new_token_hash: str,
           new_expires_at: datetime) -> uuid.UUID:
    new_id = issue(conn, old_row["user_id"], old_row["client_id"], new_token_hash,
                   old_row["family_id"], new_expires_at)
    conn.execute(
        "UPDATE refresh_tokens SET rotated_to = %s, revoked_at = now() WHERE id = %s",
        (new_id, old_row["id"]),
    )
    return new_id


def revoke_family(conn: psycopg.Connection, family_id) -> None:
    conn.execute(
        "UPDATE refresh_tokens SET revoked_at = now() "
        "WHERE family_id = %s AND revoked_at IS NULL", (family_id,))


def is_reuse(row: dict) -> bool:
    """A presented token is reuse/invalid if it was already rotated or revoked."""
    return row["rotated_to"] is not None or row["revoked_at"] is not None
