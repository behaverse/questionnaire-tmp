import psycopg

def latest_versions_cte() -> str:
    return ("WITH latest AS (SELECT id, max(version) AS version FROM catalogue_entry "
            "WHERE status='published' GROUP BY id)")

def list_entries(conn: psycopg.Connection, entity_type: str, *, q: str | None,
                 limit: int, offset: int) -> tuple[list[dict], int]:
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = [entity_type]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)")
        params.append(q)
    sql_where = " AND ".join(where)
    total = conn.execute(
        f"{latest_versions_cte()} SELECT count(*) FROM catalogue_entry c JOIN latest l "
        f"ON c.id=l.id AND c.version=l.version WHERE {sql_where}", params).fetchone()[0]
    rows = conn.execute(
        f"{latest_versions_cte()} SELECT c.id, c.version, c.entity_type, c.title, c.status, c.effective_license "
        f"FROM catalogue_entry c JOIN latest l ON c.id=l.id AND c.version=l.version "
        f"WHERE {sql_where} ORDER BY c.title NULLS LAST LIMIT %s OFFSET %s",
        params + [limit, offset]).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return [dict(zip(cols, r)) for r in rows], total

def get_versions(conn: psycopg.Connection, entity_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        "WHERE id=%s ORDER BY version DESC", (entity_id,)).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return [dict(zip(cols, r)) for r in rows]

def dependents_of(conn: psycopg.Connection, to_id: str, to_version: str, limit: int, offset: int) -> tuple[list[dict], int]:
    total = conn.execute(
        "SELECT count(*) FROM entity_ref WHERE to_id=%s AND to_version=%s", (to_id, to_version)).fetchone()[0]
    rows = conn.execute(
        "SELECT DISTINCT r.from_id AS id, r.from_version AS version, c.entity_type, c.title, c.status, c.effective_license "
        "FROM entity_ref r JOIN catalogue_entry c ON c.id=r.from_id AND c.version=r.from_version "
        "WHERE r.to_id=%s AND r.to_version=%s ORDER BY r.from_id LIMIT %s OFFSET %s",
        (to_id, to_version, limit, offset)).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return [dict(zip(cols, r)) for r in rows], total
