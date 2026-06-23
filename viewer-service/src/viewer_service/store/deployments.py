import psycopg
from psycopg.types.json import Jsonb

_COLS = ("deployment_id", "questionnaire_ref", "runtime_policy", "default_locale",
         "available_locales", "theme_id", "mode_preset", "dimensions", "active_from",
         "active_until", "quota", "style_overrides", "flow_overrides", "redirect_url",
         "confirmation_message", "randomization_seed_strategy", "channels", "created_by",
         "consent_text_ref", "listed", "title", "description", "consent")
_JSONB = {"runtime_policy", "available_locales", "dimensions", "quota", "style_overrides",
          "flow_overrides", "confirmation_message", "channels", "consent"}
_SELECT_COLS = _COLS + ("created_at",)


def _wrap(col, val):
    return Jsonb(val) if (col in _JSONB and val is not None) else val


def insert_deployment(conn: psycopg.Connection, **fields) -> None:
    fields.setdefault("listed", False)
    vals = tuple(_wrap(c, fields.get(c)) for c in _COLS)
    conn.execute(f"INSERT INTO deployment ({', '.join(_COLS)}) "
                 f"VALUES ({', '.join(['%s'] * len(_COLS))})", vals)
    conn.commit()


def get_deployment(conn: psycopg.Connection, deployment_id: str) -> dict | None:
    row = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM deployment WHERE deployment_id=%s",
        (deployment_id,)).fetchone()
    return dict(zip(_SELECT_COLS, row)) if row else None


def list_catalogue_candidates(conn: psycopg.Connection) -> list[dict]:
    """Listed, browse-startable deployments (auth none/identity), newest first. The active-window +
    quota filter is applied by the caller via check_deployable."""
    cols = ["deployment_id", "questionnaire_ref", "title", "description", "dimensions",
            "active_from", "active_until", "quota"]
    rows = conn.execute(
        f"SELECT {', '.join(cols)} FROM deployment "
        "WHERE listed AND (dimensions->>'auth') IN ('none','identity') "
        "ORDER BY created_at DESC").fetchall()
    return [dict(zip(cols, r)) for r in rows]


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
