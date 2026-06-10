import psycopg
from psycopg.types.json import Jsonb


def upsert_viewer(conn: psycopg.Connection, viewer_id: str, viewer_version: str,
                  manifest: dict, manifest_hash: str) -> None:
    conn.execute(
        "INSERT INTO viewer_registry (viewer_id, viewer_version, manifest, manifest_hash) "
        "VALUES (%s,%s,%s,%s) "
        "ON CONFLICT (viewer_id, viewer_version) DO UPDATE SET "
        "manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash, registered_at=now()",
        (viewer_id, viewer_version, Jsonb(manifest), manifest_hash),
    )
    conn.commit()


def get_viewer(conn: psycopg.Connection, viewer_id: str, viewer_version: str) -> dict | None:
    row = conn.execute(
        "SELECT manifest, manifest_hash FROM viewer_registry WHERE viewer_id=%s AND viewer_version=%s",
        (viewer_id, viewer_version)).fetchone()
    if row is None:
        return None
    return {"manifest": row[0], "manifest_hash": row[1]}
