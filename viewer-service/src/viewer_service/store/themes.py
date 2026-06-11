import psycopg
from psycopg.types.json import Jsonb

_COLS = ("theme_id", "name", "palette", "typography", "spacing", "logo_url", "custom_css")
_JSONB = {"palette", "typography", "spacing"}
_SELECT = _COLS + ("created_at",)


def _wrap(col, val):
    return Jsonb(val) if (col in _JSONB and val is not None) else val


def insert_theme(conn: psycopg.Connection, **fields) -> None:
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO theme ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))}) ON CONFLICT (theme_id) DO NOTHING", vals)
    conn.commit()


def get_theme(conn: psycopg.Connection, theme_id: str) -> dict | None:
    row = conn.execute(f"SELECT {', '.join(_SELECT)} FROM theme WHERE theme_id=%s", (theme_id,)).fetchone()
    return dict(zip(_SELECT, row)) if row else None


def list_themes(conn: psycopg.Connection) -> list[dict]:
    rows = conn.execute(f"SELECT {', '.join(_SELECT)} FROM theme ORDER BY theme_id").fetchall()
    return [dict(zip(_SELECT, r)) for r in rows]
