from datetime import datetime
import psycopg
from psycopg.types.json import Jsonb
from ..loader import Artifact


class ImmutabilityError(Exception):
    pass


def get_entity(conn: psycopg.Connection, entity_id: str, version: str) -> dict | None:
    row = conn.execute(
        "SELECT id, version, entity_type, status, license, severity, content_json, withdrawn_at "
        "FROM entity WHERE id=%s AND version=%s", (entity_id, version)
    ).fetchone()
    if row is None:
        return None
    cols = ["id", "version", "entity_type", "status", "license", "severity", "content_json", "withdrawn_at"]
    return dict(zip(cols, row))


def upsert_entity(conn: psycopg.Connection, art: Artifact, source_commit: str) -> bool:
    """Insert the entity. Returns True if a new row was inserted, False if an
    identical row already existed (idempotent no-op). Raises ImmutabilityError if a
    row with the same (id, version) exists with different content."""
    existing = get_entity(conn, art.id, art.version)
    if existing is not None:
        if existing["content_json"] == art.data:
            return False
        raise ImmutabilityError(f"{art.id}@{art.version} already ingested with different content")
    conn.execute(
        "INSERT INTO entity (id, version, entity_type, severity, license, content_json, source_commit) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (art.id, art.version, art.entity_type, art.data.get("severity"),
         art.data.get("license"), Jsonb(art.data), source_commit),
    )
    return True


def withdraw_entity(conn: psycopg.Connection, entity_id: str, version: str, when: datetime) -> None:
    conn.execute(
        "UPDATE entity SET status='withdrawn', content_json=NULL, withdrawn_at=%s "
        "WHERE id=%s AND version=%s", (when, entity_id, version)
    )
