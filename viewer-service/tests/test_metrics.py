from datetime import datetime, timezone, timedelta
from viewer_service.metrics import deployment_metrics
from viewer_service.store import sessions as ss, outbox, deployments as ds

NOW = datetime(2026, 6, 11, 12, 0, 0, tzinfo=timezone.utc)


def _dep(conn, did="dep_M", quota=None):
    ds.insert_deployment(conn, deployment_id=did, questionnaire_ref="qst_x@v26.0609",
                         runtime_policy={"scorer_impl_preference": ["wasm"]}, default_locale="en",
                         available_locales=["en"], quota=quota)
    conn.commit()


def _sess(conn, sid, did, status):
    ss.insert_session(conn, session_id=sid, session_index=1, deployment_id=did, viewer_id="web",
                      viewer_version="v", agent_id="a", instrument_id="qst_x",
                      instrument_version="v26.0609", status=status, token_hash="h",
                      initial_locale="en", last_active_locale="en")


def test_counts_completion_quota_recent(conn):
    _dep(conn, "dep_M", quota={"max_sessions": 5})
    _sess(conn, "s1", "dep_M", "in_progress")
    _sess(conn, "s2", "dep_M", "submitted")
    _sess(conn, "s3", "dep_M", "forwarded")
    conn.commit()
    m = deployment_metrics(conn, "dep_M", soft_threshold=10000, now=NOW)
    assert m["active_sessions"] == 1
    assert m["completion"] == {"started": 3, "completed": 2, "rate": 2 / 3}
    assert m["quota"] == {"max_sessions": 5, "used": 3, "remaining": 2}
    assert len(m["recent_submissions"]) == 2
    assert m["forwarding"] == {"unforwarded": 0, "oldest_unforwarded_age_seconds": None,
                               "last_error": None, "alert": False}


def test_forwarding_alert_and_age(conn):
    _dep(conn, "dep_F")
    _sess(conn, "s1", "dep_F", "submitted")
    oid = outbox.enqueue(conn, "s1", "responses", {"response_id": 1}, "h")
    conn.execute("UPDATE outbox SET status='pending', last_error='boom', created_at=%s WHERE id=%s",
                 (NOW - timedelta(seconds=30), oid))
    conn.commit()
    m = deployment_metrics(conn, "dep_F", soft_threshold=1, now=NOW)
    assert m["forwarding"]["unforwarded"] == 1
    assert m["forwarding"]["last_error"] == "boom"
    assert m["forwarding"]["oldest_unforwarded_age_seconds"] == 30.0
    assert m["forwarding"]["alert"] is True


def test_empty_deployment_zero_metrics(conn):
    _dep(conn, "dep_E")
    m = deployment_metrics(conn, "dep_E", soft_threshold=10000, now=NOW)
    assert m["active_sessions"] == 0
    assert m["completion"]["rate"] == 0.0
    assert m["quota"]["remaining"] is None
