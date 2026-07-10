"""DB-backed sliding-window rate limiter (shared across serverless instances, unlike an in-memory
counter). Each guarded request records one hit in `rate_limit_hit` keyed by a bucket string
(`<route>:<client-ip>`); a request is blocked when the bucket already holds `limit` hits inside the
window. Per-bucket pruning on every check keeps the table bounded."""
import psycopg


def check_and_record(conn: psycopg.Connection, bucket: str, limit: int, window_seconds: int) -> bool:
    """Prune this bucket to the window, count remaining hits, and — if under `limit` — record one.
    Returns True if the request is allowed, False if it should be rejected (429). The caller commits."""
    conn.execute(
        "DELETE FROM rate_limit_hit WHERE bucket = %s AND ts < now() - make_interval(secs => %s)",
        (bucket, window_seconds))
    (count,) = conn.execute(
        "SELECT count(*) FROM rate_limit_hit WHERE bucket = %s", (bucket,)).fetchone()
    if count >= limit:
        return False
    conn.execute("INSERT INTO rate_limit_hit (bucket) VALUES (%s)", (bucket,))
    return True


def prune(conn: psycopg.Connection, max_age_seconds: int = 86_400) -> int:
    """Reaper hook: drop any hit older than max_age (well past every window). Returns rows deleted."""
    cur = conn.execute(
        "DELETE FROM rate_limit_hit WHERE ts < now() - make_interval(secs => %s)", (max_age_seconds,))
    return cur.rowcount
