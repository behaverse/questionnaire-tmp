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
