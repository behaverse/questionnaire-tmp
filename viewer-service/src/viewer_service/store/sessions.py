import psycopg
from psycopg.types.json import Json, Jsonb

_INSERT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale")


def insert_session(conn: psycopg.Connection, ephemeral: bool = False,
                   participant_sub: str | None = None, **fields) -> None:
    cols = ", ".join(_INSERT_COLS + ("participant_sub", "ephemeral"))
    placeholders = ", ".join(["%s"] * (len(_INSERT_COLS) + 2))
    conn.execute(f"INSERT INTO session ({cols}) VALUES ({placeholders})",
                 tuple(fields[c] for c in _INSERT_COLS) + (participant_sub, ephemeral))


_SELECT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale", "started_at", "completed_at",
                "submitted_at", "forwarded_at", "forward_attempts", "forward_failure_reason",
                "ephemeral", "scorer_outputs", "participant_sub")


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


def set_scorer_outputs(conn: psycopg.Connection, session_id: str, outputs: dict) -> None:
    conn.execute("UPDATE session SET scorer_outputs=%s WHERE session_id=%s", (Json(outputs), session_id))


def list_sessions_for_participant(conn: psycopg.Connection, participant_sub: str) -> list[dict]:
    cur = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE participant_sub=%s "
        "ORDER BY started_at DESC", (participant_sub,))
    return [_row_to_dict(r) for r in cur.fetchall()]


def count_for_deployment(conn: psycopg.Connection, deployment_id: str) -> int:
    return conn.execute("SELECT count(*) FROM session WHERE deployment_id=%s",
                        (deployment_id,)).fetchone()[0]


def count_for_agent(conn: psycopg.Connection, agent_id: str) -> int:
    return conn.execute("SELECT count(*) FROM session WHERE agent_id=%s",
                        (agent_id,)).fetchone()[0]
