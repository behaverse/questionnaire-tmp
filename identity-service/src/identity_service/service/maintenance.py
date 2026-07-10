"""Maintenance / housekeeping for the token tables.

handoff_codes, email_tokens, and refresh_tokens all accumulate rows over time. Once a row is past
its expiry it is useless: an expired handoff/email token can never be consumed, and an expired
refresh token is rejected by `auth.refresh` before reuse-detection matters (reuse-detection only
needs the still-valid rotated rows, which this reaper never touches). So deleting `expires_at` in the
past — optionally with a grace window — is safe and bounds table growth. Intended to be run
periodically (cron): `identity reap`.
"""

# table names are constants (never user input) — safe to interpolate
_TABLES = ("handoff_codes", "email_tokens", "refresh_tokens")


def reap_expired(conn, *, grace_seconds: int = 0) -> dict[str, int]:
    """Delete rows whose `expires_at` is older than now minus the grace window. Returns the per-table
    deleted-row counts. The caller commits."""
    counts: dict[str, int] = {}
    for table in _TABLES:
        cur = conn.execute(
            f"DELETE FROM {table} WHERE expires_at < now() - make_interval(secs => %s)",
            (grace_seconds,))
        counts[table] = cur.rowcount
    # rate-limit hits have no expires_at; drop anything well past the longest window (1 day).
    from ..store import rate_limit as rl_store
    counts["rate_limit_hit"] = rl_store.prune(conn, max_age_seconds=86_400)
    return counts
