import uuid
import psycopg


def questionnaire_exists(conn: psycopg.Connection, qid: str) -> bool:
    """True if any catalogue version of this questionnaire id exists (published or withdrawn)."""
    row = conn.execute(
        "SELECT 1 FROM catalogue_entry WHERE id=%s LIMIT 1", (qid,)
    ).fetchone()
    return row is not None


def _comment_view(row: dict) -> dict:
    deleted = row["deleted_at"] is not None
    return {
        "id": str(row["id"]),
        "questionnaire_id": row["questionnaire_id"],
        "parent_id": str(row["parent_id"]) if row["parent_id"] else None,
        "author_sub": None if deleted else row["author_sub"],
        "author_name": None if deleted else row["author_name"],
        "body": None if deleted else row["body"],
        "created_at": row["created_at"].isoformat(),
        "deleted": deleted,
    }


_COLS = "id, questionnaire_id, parent_id, author_sub, author_name, body, created_at, deleted_at"


def _row(conn, sql, args):
    cur = conn.execute(sql, args)
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


def get_comment(conn, comment_id) -> dict | None:
    return _row(conn, f"SELECT {_COLS} FROM comment WHERE id=%s", (comment_id,))


def add_comment(conn, *, qid, author_sub, author_name, body, parent_id=None) -> dict:
    cid = uuid.uuid4()
    conn.execute(
        "INSERT INTO comment (id, questionnaire_id, parent_id, author_sub, author_name, body) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        (cid, qid, parent_id, author_sub, author_name, body))
    return _comment_view(get_comment(conn, cid))


def list_comments(conn, qid) -> list[dict]:
    cur = conn.execute(
        f"SELECT {_COLS} FROM comment WHERE questionnaire_id=%s ORDER BY created_at", (qid,))
    cols = [d.name for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    tops = [r for r in rows if r["parent_id"] is None]
    out = []
    for t in tops:
        view = _comment_view(t)
        view["replies"] = [_comment_view(r) for r in rows if r["parent_id"] == t["id"]]
        out.append(view)
    return out


def soft_delete_comment(conn, comment_id) -> None:
    conn.execute(
        "UPDATE comment SET deleted_at = now(), body = NULL, author_sub = NULL, author_name = NULL "
        "WHERE id=%s AND deleted_at IS NULL", (comment_id,))


def upsert_rating(conn, *, qid, author_sub, score) -> None:
    conn.execute(
        "INSERT INTO rating (questionnaire_id, author_sub, score) VALUES (%s,%s,%s) "
        "ON CONFLICT (questionnaire_id, author_sub) "
        "DO UPDATE SET score = EXCLUDED.score, updated_at = now()",
        (qid, author_sub, score))


def rating_summary(conn, qid) -> dict:
    cur = conn.execute(
        "SELECT score, count(*) FROM rating WHERE questionnaire_id=%s GROUP BY score", (qid,))
    hist = {str(i): 0 for i in range(1, 6)}
    total = 0
    n = 0
    for score, c in cur.fetchall():
        hist[str(score)] = c
        total += score * c
        n += c
    mean = round(total / n, 2) if n else None
    return {"mean": mean, "count": n, "histogram": hist}


def caller_rating(conn, qid, author_sub) -> int | None:
    row = conn.execute(
        "SELECT score FROM rating WHERE questionnaire_id=%s AND author_sub=%s",
        (qid, author_sub)).fetchone()
    return row[0] if row else None


def delete_rating(conn, qid, author_sub) -> None:
    conn.execute("DELETE FROM rating WHERE questionnaire_id=%s AND author_sub=%s", (qid, author_sub))


def purge_user_community_data(conn, author_sub) -> dict:
    cur = conn.execute(
        "UPDATE comment SET deleted_at = now(), body = NULL, author_sub = NULL, author_name = NULL "
        "WHERE author_sub = %s AND deleted_at IS NULL", (author_sub,))
    tombstoned = cur.rowcount
    cur = conn.execute("DELETE FROM rating WHERE author_sub = %s", (author_sub,))
    deleted = cur.rowcount
    return {"comments_tombstoned": tombstoned, "ratings_deleted": deleted}
