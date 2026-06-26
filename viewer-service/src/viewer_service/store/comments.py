"""Per-question participant comments (QA) — owner request #5/#6.

Append-only. Deployment/instrument/participant identity is denormalised from the
session row so the player only sends what it knows about the current view.
"""
import psycopg


def insert_comment(conn: psycopg.Connection, session: dict, body: dict) -> None:
    conn.execute(
        """INSERT INTO question_comment
             (session_id, deployment_id, instrument_id, instrument_version,
              page_id, item_id, locale, comment, stars, participant_sub)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            session["session_id"],
            session["deployment_id"],
            session["instrument_id"],
            session["instrument_version"],
            body.get("page_id"),
            body.get("item_id"),
            body.get("locale") or session.get("last_active_locale"),
            body.get("comment"),
            body.get("stars"),
            session.get("participant_sub"),
        ),
    )


_LIST_COLS = ("id", "session_id", "deployment_id", "instrument_id", "instrument_version",
              "page_id", "item_id", "locale", "comment", "stars", "participant_sub", "created_at")


def list_comments(conn: psycopg.Connection, deployment_id: str) -> list[dict]:
    rows = conn.execute(
        f"SELECT {', '.join(_LIST_COLS)} FROM question_comment "
        "WHERE deployment_id=%s ORDER BY created_at DESC, id DESC",
        (deployment_id,)).fetchall()
    out = []
    for row in rows:
        d = dict(zip(_LIST_COLS, row))
        d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
        out.append(d)
    return out
