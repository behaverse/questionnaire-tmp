from viewer_service.store import outbox
from viewer_service.store import sessions as session_store


def _mk_session(conn, sid="s1"):
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1",
        viewer_id="web", viewer_version="v26.0610", agent_id="agent_1",
        instrument_id="qst_x", instrument_version="v26.0609", status="in_progress",
        token_hash="h", initial_locale="en", last_active_locale="en")
    conn.commit()


def test_enqueue_and_depth(conn):
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    assert isinstance(oid, int)
    assert outbox.depth(conn) == 1


def test_claim_due_returns_pending_rows(conn):
    _mk_session(conn)
    outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    due = outbox.claim_due(conn, 10)
    assert len(due) == 1
    assert due[0]["kind"] == "responses"
    assert due[0]["payload"] == {"a": 1}
    conn.commit()


def test_mark_forwarded_and_counts(conn):
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    outbox.mark_forwarded(conn, oid)
    conn.commit()
    assert outbox.depth(conn) == 0
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 1, "failed": 0}


def test_mark_failed_and_retry(conn):
    from datetime import datetime, timezone
    _mk_session(conn)
    oid = outbox.enqueue(conn, "s1", "responses", {"a": 1}, "sha")
    conn.commit()
    nxt = datetime(2030, 1, 1, tzinfo=timezone.utc)
    outbox.mark_retry(conn, oid, attempts=1, last_error="boom", next_attempt_at=nxt)
    conn.commit()
    assert outbox.claim_due(conn, 10) == []   # future next_attempt_at -> not due
    conn.commit()
    outbox.mark_failed(conn, oid, attempts=8, last_error="dead")
    conn.commit()
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 0, "failed": 1}
