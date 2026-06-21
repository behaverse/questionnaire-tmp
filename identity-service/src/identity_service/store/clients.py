import uuid
import psycopg


def _row(cur):
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


def create(conn: psycopg.Connection, slug: str, name: str = "") -> uuid.UUID:
    cid = uuid.uuid4()
    conn.execute("INSERT INTO clients (id, slug, name) VALUES (%s,%s,%s)", (cid, slug, name))
    return cid


def by_slug(conn: psycopg.Connection, slug: str) -> dict | None:
    return _row(conn.execute("SELECT id, slug, name FROM clients WHERE slug = %s", (slug,)))


def list_all(conn: psycopg.Connection) -> list[dict]:
    cur = conn.execute("SELECT id, slug, name FROM clients ORDER BY slug")
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]
