from viewer_service.store import sessions as store


def _insert(conn, sid="s1", status="in_progress", token_hash="h1"):
    store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id="dep_1",
        viewer_id="web", viewer_version="v26.0610", agent_id="agent_1",
        instrument_id="qst_x", instrument_version="v26.0609", status=status,
        token_hash=token_hash, initial_locale="en", last_active_locale="en")
    conn.commit()


def test_get_session(conn):
    _insert(conn)
    s = store.get_session(conn, "s1")
    assert s["status"] == "in_progress"
    assert s["viewer_id"] == "web"
    assert s["last_active_locale"] == "en"


def test_get_session_for_auth(conn):
    _insert(conn, token_hash="abc")
    assert store.get_session_for_auth(conn, "s1", "abc")["session_id"] == "s1"
    assert store.get_session_for_auth(conn, "s1", "wrong") is None
    assert store.get_session_for_auth(conn, "nope", "abc") is None


def test_set_submitted(conn):
    _insert(conn)
    store.set_submitted(conn, "s1")
    conn.commit()
    s = store.get_session(conn, "s1")
    assert s["status"] == "submitted"
    assert s["submitted_at"] is not None


def test_set_locale(conn):
    _insert(conn)
    store.set_locale(conn, "s1", "pt")
    conn.commit()
    assert store.get_session(conn, "s1")["last_active_locale"] == "pt"


def test_set_forwarded(conn):
    _insert(conn, status="submitted")
    store.set_forwarded(conn, "s1")
    conn.commit()
    s = store.get_session(conn, "s1")
    assert s["status"] == "forwarded"
    assert s["forwarded_at"] is not None


def test_set_failure_reason(conn):
    _insert(conn, status="submitted")
    store.set_failure_reason(conn, "s1", "1 failed")
    conn.commit()
    assert store.get_session(conn, "s1")["forward_failure_reason"] == "1 failed"
