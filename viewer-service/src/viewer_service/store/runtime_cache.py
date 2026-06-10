import psycopg
from psycopg.types.json import Jsonb

_KEY_COLS = ("qst_id", "qst_version", "locale", "viewer_conformance_hash",
             "deployment_runtime_policy_hash")
_WHERE = " AND ".join(f"{c}=%s" for c in _KEY_COLS)


def get(conn: psycopg.Connection, qst_id: str, qst_version: str, locale: str,
        viewer_hash: str, policy_hash: str) -> dict | None:
    key = (qst_id, qst_version, locale, viewer_hash, policy_hash)
    row = conn.execute(f"SELECT runtime FROM runtime_cache WHERE {_WHERE}", key).fetchone()
    if row is None:
        return None
    conn.execute(f"UPDATE runtime_cache SET last_accessed_at=now() WHERE {_WHERE}", key)
    conn.commit()
    return row[0]


def put(conn: psycopg.Connection, key: tuple, runtime: dict, deployment_id: str, cap: int) -> None:
    conn.execute(
        "INSERT INTO runtime_cache (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash, runtime, deployment_id) VALUES (%s,%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash) DO UPDATE SET runtime=EXCLUDED.runtime, "
        "last_accessed_at=now()",
        (*key, Jsonb(runtime), deployment_id),
    )
    # LRU eviction: keep the `cap` most-recently-accessed rows, delete the rest.
    conn.execute(
        "DELETE FROM runtime_cache WHERE (qst_id, qst_version, locale, viewer_conformance_hash, "
        "deployment_runtime_policy_hash) IN ("
        "  SELECT qst_id, qst_version, locale, viewer_conformance_hash, "
        "  deployment_runtime_policy_hash FROM runtime_cache "
        "  ORDER BY last_accessed_at DESC OFFSET %s)",
        (cap,),
    )
    conn.commit()


def purge(conn: psycopg.Connection, deployment_id: str | None = None) -> int:
    if deployment_id is None:
        cur = conn.execute("DELETE FROM runtime_cache")
    else:
        cur = conn.execute("DELETE FROM runtime_cache WHERE deployment_id=%s", (deployment_id,))
    n = cur.rowcount
    conn.commit()
    return n
