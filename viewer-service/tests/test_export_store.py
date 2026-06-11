from viewer_service.store import export as export_store
from viewer_service.store import sessions as session_store
from viewer_service.store import outbox


def _session(conn, sid, dep):
    session_store.insert_session(
        conn, session_id=sid, session_index=1, deployment_id=dep, viewer_id="web",
        viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
        instrument_version="v26.0609", status="submitted", token_hash="h",
        initial_locale="en", last_active_locale="en")
    conn.commit()


def test_flattens_responseset_and_bare_and_skips_events(conn):
    _session(conn, "s1", "dep_X")
    outbox.enqueue(conn, "s1", "responses",
                   {"session_id": "s1", "responses": [{"response_id": 1}, {"response_id": 2}]}, "h1")
    outbox.enqueue(conn, "s1", "responses", {"response_id": 3}, "h2")   # bare Response
    outbox.enqueue(conn, "s1", "events", {"id": "e1"}, "h3")            # ignored (kind != responses)
    conn.commit()
    rows = list(export_store.iter_response_rows(conn, "dep_X"))
    assert [r["response_id"] for r in rows] == [1, 2, 3]


def test_scopes_to_deployment(conn):
    _session(conn, "s1", "dep_A")
    _session(conn, "s2", "dep_B")
    outbox.enqueue(conn, "s1", "responses", {"response_id": 1}, "h1")
    outbox.enqueue(conn, "s2", "responses", {"response_id": 99}, "h2")
    conn.commit()
    assert [r["response_id"] for r in export_store.iter_response_rows(conn, "dep_A")] == [1]


def test_empty_deployment_yields_nothing(conn):
    assert list(export_store.iter_response_rows(conn, "dep_none")) == []
