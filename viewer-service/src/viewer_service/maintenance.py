"""Housekeeping for the Viewer Service tables (run via the `/internal/reap` cron or the CLI).

DELIBERATELY CONSERVATIVE about what it deletes. The `outbox` is the ONLY store of response/event
data and is what `export.csv` streams — so it is NEVER pruned here, not even `forwarded` rows. Only
rows that are provably dead are removed:

- `replay_revocation`: a revocation only needs to outlive the links it revokes. Once a row is older
  than the replay-link TTL, every link it could revoke has already expired on its own, so the row is
  moot and safe to drop.
- ephemeral (demo) sessions: these can never be resumed (`/sessions/{id}` returns `ephemeral_no_resume`)
  and never enqueue outbox/comment rows, so an old one is inert. Dropped after a TTL; dependents are
  cleared first, defensively, in case that invariant is ever broken by future code.
"""


def reap(conn, *, replay_link_ttl_seconds: int, ephemeral_ttl_seconds: int) -> dict[str, int]:
    """Delete moot replay revocations and aged-out ephemeral sessions. Returns per-item counts.
    The caller commits."""
    counts: dict[str, int] = {}

    cur = conn.execute(
        "DELETE FROM replay_revocation WHERE revoked_at < now() - make_interval(secs => %s)",
        (replay_link_ttl_seconds,))
    counts["replay_revocation"] = cur.rowcount

    # Target aged ephemeral sessions once; clear any dependents (should be none) before the row.
    conn.execute(
        "CREATE TEMP TABLE _reap_sids ON COMMIT DROP AS "
        "SELECT session_id FROM session "
        "WHERE ephemeral AND started_at < now() - make_interval(secs => %s)",
        (ephemeral_ttl_seconds,))
    conn.execute("DELETE FROM outbox WHERE session_id IN (SELECT session_id FROM _reap_sids)")
    conn.execute("DELETE FROM question_comment WHERE session_id IN (SELECT session_id FROM _reap_sids)")
    conn.execute("DELETE FROM replay_revocation WHERE session_id IN (SELECT session_id FROM _reap_sids)")
    cur = conn.execute("DELETE FROM session WHERE session_id IN (SELECT session_id FROM _reap_sids)")
    counts["ephemeral_session"] = cur.rowcount
    return counts


def requeue_failed(conn) -> int:
    """Reset terminally-`failed` outbox rows back to `pending` so the forwarder retries them (e.g.
    after the Behaverse sink outage that failed them is resolved). Returns rows requeued. Caller commits."""
    cur = conn.execute(
        "UPDATE outbox SET status='pending', attempts=0, last_error=NULL, next_attempt_at=now() "
        "WHERE status='failed'")
    return cur.rowcount
