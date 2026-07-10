"""VS housekeeping reaper + requeue-failed."""
from viewer_service import maintenance


def _session(conn, sid, *, ephemeral, age_seconds, status="in_progress"):
    conn.execute(
        "INSERT INTO session (session_id, session_index, deployment_id, viewer_id, viewer_version, "
        "agent_id, instrument_id, instrument_version, status, token_hash, initial_locale, "
        "last_active_locale, ephemeral, started_at) VALUES "
        "(%s,1,'dep_x','web','v1','a','qst','v1',%s,%s,'en','en',%s, now() - make_interval(secs => %s))",
        (sid, status, "h_" + sid, ephemeral, age_seconds))


def test_reap_drops_moot_revocations_and_old_ephemeral_sessions(conn):
    # a real (kept) session + a moot revocation on it, plus an old ephemeral demo session
    _session(conn, "s_real", ephemeral=False, age_seconds=10)
    _session(conn, "s_demo_old", ephemeral=True, age_seconds=200_000)   # > 1 day
    _session(conn, "s_demo_new", ephemeral=True, age_seconds=10)
    conn.execute("INSERT INTO replay_revocation (session_id, deployment_id, revoked_at) "
                 "VALUES ('s_real','dep_x', now() - make_interval(secs => 1000000))")  # very old → moot
    conn.commit()

    counts = maintenance.reap(conn, replay_link_ttl_seconds=604_800, ephemeral_ttl_seconds=86_400)
    conn.commit()

    assert counts["replay_revocation"] == 1
    assert counts["ephemeral_session"] == 1
    # kept: real session, recent ephemeral session; gone: old ephemeral, moot revocation
    live = {r[0] for r in conn.execute("SELECT session_id FROM session").fetchall()}
    assert live == {"s_real", "s_demo_new"}
    assert conn.execute("SELECT count(*) FROM replay_revocation").fetchone()[0] == 0


def test_reap_keeps_recent_revocation(conn):
    _session(conn, "s1", ephemeral=False, age_seconds=10)
    conn.execute("INSERT INTO replay_revocation (session_id, deployment_id) VALUES ('s1','dep_x')")
    conn.commit()
    counts = maintenance.reap(conn, replay_link_ttl_seconds=604_800, ephemeral_ttl_seconds=86_400)
    conn.commit()
    assert counts["replay_revocation"] == 0
    assert conn.execute("SELECT count(*) FROM replay_revocation").fetchone()[0] == 1


def test_requeue_failed_resets_failed_to_pending(conn):
    _session(conn, "s1", ephemeral=False, age_seconds=10)
    conn.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256, status, attempts) "
                 "VALUES ('s1','response','{}'::jsonb,'h','failed',8)")
    conn.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256, status) "
                 "VALUES ('s1','response','{}'::jsonb,'h2','forwarded')")
    conn.commit()
    n = maintenance.requeue_failed(conn)
    conn.commit()
    assert n == 1
    rows = dict(conn.execute("SELECT status, count(*) FROM outbox GROUP BY status").fetchall())
    assert rows == {"pending": 1, "forwarded": 1}   # the failed row is now pending; forwarded untouched
    # the requeued row's attempts were reset
    assert conn.execute("SELECT attempts FROM outbox WHERE status='pending'").fetchone()[0] == 0
