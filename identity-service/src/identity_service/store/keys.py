import psycopg
from psycopg.types.json import Jsonb


def insert_key(conn: psycopg.Connection, kid: str, alg: str, public_jwk: dict,
               private_pem: str, active: bool = True) -> None:
    conn.execute(
        "INSERT INTO signing_keys (kid, alg, public_jwk, private_pem, active) "
        "VALUES (%s, %s, %s, %s, %s)",
        (kid, alg, Jsonb(public_jwk), private_pem, active),
    )


def _rows(conn, sql, args=()):
    cur = conn.execute(sql, args)
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def active_keys(conn: psycopg.Connection) -> list[dict]:
    return _rows(conn,
        "SELECT kid, alg, public_jwk, private_pem FROM signing_keys "
        "WHERE active ORDER BY created_at DESC")


def signing_key(conn: psycopg.Connection) -> dict | None:
    rows = _rows(conn,
        "SELECT kid, alg, public_jwk, private_pem FROM signing_keys "
        "WHERE active ORDER BY created_at DESC LIMIT 1")
    return rows[0] if rows else None


def retire_others(conn: psycopg.Connection, keep_kid: str) -> None:
    conn.execute("UPDATE signing_keys SET active = false WHERE kid <> %s", (keep_kid,))
