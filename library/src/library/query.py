import psycopg

def latest_versions_cte() -> str:
    return ("WITH latest AS (SELECT id, max(version) AS version FROM catalogue_entry "
            "WHERE status='published' GROUP BY id)")

_VALID_SORTS = {"relevance", "title", "recency"}

def list_entries(conn: psycopg.Connection, entity_type: str, *, q: str | None,
                 limit: int, offset: int,
                 domain: str | None = None, population: str | None = None,
                 language: str | None = None, license: str | None = None,
                 min_items: int | None = None, max_items: int | None = None,
                 sort: str | None = None) -> tuple[list[dict], int]:
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = [entity_type]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)")
        params.append(q)
    if domain is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version AND f.facet_type='domain' AND f.value=%s)")
        params.append(domain)
    if population is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version AND f.facet_type='population' AND f.value=%s)")
        params.append(population)
    if language is not None:
        where.append("c.language=%s")
        params.append(language)
    if license is not None:
        where.append("c.effective_license=%s")
        params.append(license)
    if min_items is not None:
        where.append("c.item_count >= %s")
        params.append(min_items)
    if max_items is not None:
        where.append("c.item_count <= %s")
        params.append(max_items)
    sql_where = " AND ".join(where)
    # Determine ORDER BY
    effective_sort = sort or ("relevance" if q else "title")
    if effective_sort == "relevance" and q:
        order_by = "ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) DESC"
        order_params: list = [q]
    elif effective_sort == "recency":
        order_by = "c.version DESC NULLS LAST"
        order_params = []
    else:
        order_by = "c.title NULLS LAST"
        order_params = []
    total = conn.execute(
        f"{latest_versions_cte()} SELECT count(*) FROM catalogue_entry c JOIN latest l "
        f"ON c.id=l.id AND c.version=l.version WHERE {sql_where}", params).fetchone()[0]
    rows = conn.execute(
        f"{latest_versions_cte()} SELECT c.id, c.version, c.entity_type, c.title, c.status, c.effective_license "
        f"FROM catalogue_entry c JOIN latest l ON c.id=l.id AND c.version=l.version "
        f"WHERE {sql_where} ORDER BY {order_by} LIMIT %s OFFSET %s",
        params + order_params + [limit, offset]).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return [dict(zip(cols, r)) for r in rows], total

def get_version(conn: psycopg.Connection, entity_id: str, version: str) -> dict | None:
    row = conn.execute(
        "SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        "WHERE id=%s AND version=%s", (entity_id, version)).fetchone()
    if row is None:
        return None
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return dict(zip(cols, row))

def get_versions(conn: psycopg.Connection, entity_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        "WHERE id=%s ORDER BY version DESC", (entity_id,)).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    return [dict(zip(cols, r)) for r in rows]

_CARD_COLS = ["id", "version", "entity_type", "title", "short_title", "description",
              "status", "effective_license", "language", "available_languages",
              "item_count", "estimated_minutes", "domain", "population"]

def _card_select(extra_where: str) -> str:
    return (
        f"{latest_versions_cte()} "
        "SELECT c.id, c.version, c.entity_type, c.title, c.short_title, c.description, "
        "c.status, c.effective_license, c.language, c.available_languages, "
        "c.item_count, c.estimated_minutes, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='domain'), '{}') AS domain, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='population'), '{}') AS population "
        "FROM catalogue_entry c JOIN latest l ON c.id=l.id AND c.version=l.version "
        f"WHERE {extra_where}"
    )

def list_cards(conn: psycopg.Connection, entity_type: str, *, q: str | None,
               limit: int, offset: int,
               domain: str | None = None, population: str | None = None,
               language: str | None = None, license: str | None = None,
               min_items: int | None = None, max_items: int | None = None,
               sort: str | None = None) -> tuple[list[dict], int]:
    where = ["c.entity_type=%s", "c.status='published'"]
    params: list = [entity_type]
    if q:
        where.append("c.search_tsv @@ websearch_to_tsquery('english', %s)"); params.append(q)
    if domain is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='domain' AND f.value=%s)"); params.append(domain)
    if population is not None:
        where.append("EXISTS (SELECT 1 FROM facet f WHERE f.id=c.id AND f.version=c.version "
                     "AND f.facet_type='population' AND f.value=%s)"); params.append(population)
    if language is not None:
        # match any questionnaire AVAILABLE in this language (not just its primary language);
        # fall back to the primary language column when available_languages is unset.
        where.append("(c.available_languages @> ARRAY[%s] OR c.language = %s)")
        params.append(language); params.append(language)
    if license is not None:
        where.append("c.effective_license=%s"); params.append(license)
    if min_items is not None:
        where.append("c.item_count >= %s"); params.append(min_items)
    if max_items is not None:
        where.append("c.item_count <= %s"); params.append(max_items)
    sql_where = " AND ".join(where)
    effective_sort = sort or ("relevance" if q else "title")
    if effective_sort == "relevance" and q:
        order_by = "ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) DESC"; order_params: list = [q]
    elif effective_sort == "recency":
        order_by = "c.version DESC NULLS LAST"; order_params = []
    else:
        order_by = "c.title NULLS LAST"; order_params = []
    total = conn.execute(
        f"{latest_versions_cte()} SELECT count(*) FROM catalogue_entry c "
        f"JOIN latest l ON c.id=l.id AND c.version=l.version WHERE {sql_where}", params).fetchone()[0]
    rows = conn.execute(
        f"{_card_select(sql_where)} ORDER BY {order_by} LIMIT %s OFFSET %s",
        params + order_params + [limit, offset]).fetchall()
    return [dict(zip(_CARD_COLS, r)) for r in rows], total

def get_version_history(conn: psycopg.Connection, entity_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT c.id, c.version, c.status, e.severity, e.ingested_at "
        "FROM catalogue_entry c JOIN entity e ON e.id=c.id AND e.version=c.version "
        "WHERE c.id=%s ORDER BY c.version DESC", (entity_id,)).fetchall()
    return [{"id": r[0], "version": r[1], "status": r[2], "severity": r[3],
             "date": r[4].date().isoformat() if r[4] else None} for r in rows]

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
