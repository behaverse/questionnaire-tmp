import psycopg
from psycopg.types.json import Jsonb

_COLS = ("deployment_id", "questionnaire_ref", "runtime_policy", "default_locale",
         "available_locales", "theme_id", "mode_preset", "dimensions", "active_from",
         "active_until", "quota", "style_overrides", "flow_overrides", "redirect_url",
         "confirmation_message", "randomization_seed_strategy", "channels", "created_by",
         "consent_text_ref")
_JSONB = {"runtime_policy", "available_locales", "dimensions", "quota", "style_overrides",
          "flow_overrides", "confirmation_message", "channels"}
_SELECT_COLS = _COLS + ("created_at",)


def _wrap(col, val):
    return Jsonb(val) if (col in _JSONB and val is not None) else val


def insert_deployment(conn: psycopg.Connection, **fields) -> None:
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO deployment ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))})", vals)
    conn.commit()


def get_deployment(conn: psycopg.Connection, deployment_id: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM deployment WHERE deployment_id=%s",
        (deployment_id,)).fetchone()
    return dict(zip(_SELECT_COLS, row)) if row else None


def list_deployments(conn: psycopg.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT deployment_id, questionnaire_ref, mode_preset, active_from, active_until, "
        "created_at FROM deployment ORDER BY created_at DESC").fetchall()
    cols = ["deployment_id", "questionnaire_ref", "mode_preset", "active_from",
            "active_until", "created_at"]
    return [dict(zip(cols, r)) for r in rows]


def patch_deployment(conn: psycopg.Connection, deployment_id: str, *, active_until=..., quota=...) -> bool:
    sets, vals = [], []
    if active_until is not ...:
        sets.append("active_until=%s"); vals.append(active_until)
    if quota is not ...:
        sets.append("quota=%s"); vals.append(Jsonb(quota) if quota is not None else None)
    if not sets:
        return get_deployment(conn, deployment_id) is not None
    vals.append(deployment_id)
    cur = conn.execute(f"UPDATE deployment SET {', '.join(sets)} WHERE deployment_id=%s", tuple(vals))
    conn.commit()
    return cur.rowcount > 0
