import psycopg


def revoke_session(conn: psycopg.Connection, *, deployment_id: str, session_id: str):
    """Mark all of a session's replay links revoked as of now(); returns the new revoked_at."""
    row = conn.execute(
        "INSERT INTO replay_revocation (session_id, deployment_id) VALUES (%s, %s) "
        "ON CONFLICT (session_id) DO UPDATE SET revoked_at = now(), deployment_id = EXCLUDED.deployment_id "
        "RETURNING revoked_at", (session_id, deployment_id)).fetchone()
    conn.commit()   # get_conn does not autocommit—every store write must commit explicitly.
    return row[0]


def revoked_at(conn: psycopg.Connection, session_id: str):
    row = conn.execute(
        "SELECT revoked_at FROM replay_revocation WHERE session_id=%s", (session_id,)).fetchone()
    return row[0] if row else None
