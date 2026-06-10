from datetime import datetime, timezone
from denormaliser import canonical_hash
from viewer_service.forwarding import backoff_seconds, process_outbox_batch
from viewer_service.sinks import SinkError
from viewer_service.store import outbox
from viewer_service.store import sessions as session_store

NOW = datetime(2026, 6, 10, 12, 0, 0, tzinfo=timezone.utc)


class FakeSink:
    def __init__(self, fail_times=0):
        self.fail_times = fail_times
        self.calls = 0

    def send(self, kind, payload):
        self.calls += 1
        if self.calls <= self.fail_times:
            raise SinkError("temporary")


def _session(conn, sid="s1", status="submitted"):
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1", viewer_id="web",
        viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
        instrument_version="v26.0609", status=status, token_hash="h",
        initial_locale="en", last_active_locale="en")
    conn.commit()


def _enqueue(conn, sid="s1", payload=None):
    payload = payload or {"x": 1}
    oid = outbox.enqueue(conn, sid, "responses", payload, canonical_hash(payload))
    conn.commit()
    return oid


def test_backoff_caps_at_3600():
    assert backoff_seconds(1) == 2
    assert backoff_seconds(2) == 4
    assert backoff_seconds(20) == 3600


def test_successful_forward_marks_forwarded_and_session(conn):
    _session(conn)
    _enqueue(conn)
    summary = process_outbox_batch(conn, FakeSink(), batch_size=10, max_attempts=8, now=NOW)
    assert summary["forwarded"] == 1
    assert outbox.counts_for_session(conn, "s1") == {"pending": 0, "forwarded": 1, "failed": 0}
    assert session_store.get_session(conn, "s1")["status"] == "forwarded"


def test_failure_retries_with_backoff(conn):
    _session(conn)
    oid = _enqueue(conn)
    summary = process_outbox_batch(conn, FakeSink(fail_times=1), batch_size=10, max_attempts=8, now=NOW)
    assert summary["retried"] == 1
    row = conn.execute("SELECT attempts, next_attempt_at FROM outbox WHERE id=%s", (oid,)).fetchone()
    assert row[0] == 1
    assert row[1] == NOW.replace(second=2)  # NOW + 2s backoff
    assert session_store.get_session(conn, "s1")["status"] == "submitted"


def test_max_attempts_marks_failed(conn):
    _session(conn)
    oid = _enqueue(conn)
    conn.execute("UPDATE outbox SET attempts=7 WHERE id=%s", (oid,))
    conn.commit()
    summary = process_outbox_batch(conn, FakeSink(fail_times=1), batch_size=10, max_attempts=8, now=NOW)
    assert summary["failed"] == 1
    assert outbox.counts_for_session(conn, "s1")["failed"] == 1
    s = session_store.get_session(conn, "s1")
    assert s["status"] == "submitted"
    assert "fail" in (s["forward_failure_reason"] or "").lower()


def test_tamper_detection_fails_row(conn):
    _session(conn)
    outbox.enqueue(conn, "s1", "responses", {"x": 1}, "0" * 64)  # WRONG sha256
    conn.commit()
    summary = process_outbox_batch(conn, FakeSink(), batch_size=10, max_attempts=8, now=NOW)
    assert summary["failed"] == 1
    assert outbox.counts_for_session(conn, "s1")["failed"] == 1
