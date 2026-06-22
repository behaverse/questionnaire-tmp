import psycopg


def questionnaire_exists(conn: psycopg.Connection, qid: str) -> bool:
    """True if any catalogue version of this questionnaire id exists (published or withdrawn)."""
    row = conn.execute(
        "SELECT 1 FROM catalogue_entry WHERE id=%s LIMIT 1", (qid,)
    ).fetchone()
    return row is not None
