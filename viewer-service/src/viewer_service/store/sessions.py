import psycopg
from psycopg.types.json import Jsonb

_INSERT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale")


def insert_session(conn: psycopg.Connection, **fields) -> None:
    cols = ", ".join(_INSERT_COLS)
    placeholders = ", ".join(["%s"] * len(_INSERT_COLS))
    conn.execute(f"INSERT INTO session ({cols}) VALUES ({placeholders})",
                 tuple(fields[c] for c in _INSERT_COLS))


_SELECT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale", "started_at", "completed_at",
                "submitted_at", "forwarded_at", "forward_attempts", "forward_failure_reason")


def _row_to_dict(row) -> dict:
    return dict(zip(_SELECT_COLS, row))


def get_session(conn: psycopg.Connection, session_id: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE session_id=%s", (session_id,)).fetchone()
    return _row_to_dict(row) if row else None


def get_session_for_auth(conn: psycopg.Connection, session_id: str, token_hash: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE session_id=%s AND token_hash=%s",
        (session_id, token_hash)).fetchone()
    return _row_to_dict(row) if row else None


def set_submitted(conn: psycopg.Connection, session_id: str) -> None:
    conn.execute("UPDATE session SET status='submitted', completed_at=now(), submitted_at=now() "
                 "WHERE session_id=%s", (session_id,))


def set_locale(conn: psycopg.Connection, session_id: str, locale: str) -> None:
    conn.execute("UPDATE session SET last_active_locale=%s WHERE session_id=%s", (locale, session_id))


def set_forwarded(conn: psycopg.Connection, session_id: str) -> None:
    conn.execute("UPDATE session SET status='forwarded', forwarded_at=now() WHERE session_id=%s",
                 (session_id,))


def set_failure_reason(conn: psycopg.Connection, session_id: str, reason: str) -> None:
    conn.execute("UPDATE session SET forward_failure_reason=%s WHERE session_id=%s",
                 (reason, session_id))
