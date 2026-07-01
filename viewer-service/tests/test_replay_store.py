import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as export_store


def _seed(c, sid, dep="dep_1"):
    sstore.insert_session(
        c, ephemeral=False, participant_sub="p", session_id=sid, session_index=1,
        deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id="p",
        instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _outbox(c, sid, kind, payload):
    c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) VALUES (%s,%s,%s,%s)",
              (sid, kind, Jsonb(payload), f"h_{sid}_{kind}"))


def test_events_and_recordings_scoped_to_session(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed(c, "sA"); _seed(c, "sB")
        _outbox(c, "sA", "events", {"batch_id": "b", "events": [{"verb": "bdm:started"}]})
        _outbox(c, "sA", "recording", {"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]})
        _outbox(c, "sA", "responses", {"session_id": "sA", "responses": [{"response_id": "r"}]})
        _outbox(c, "sB", "events", {"batch_id": "b2", "events": [{"verb": "bdm:started"}]})
        c.commit()
        evs = list(export_store.iter_event_rows_for_session(c, "sA"))
        recs = list(export_store.iter_recording_rows_for_session(c, "sA"))
    assert evs == [{"batch_id": "b", "events": [{"verb": "bdm:started"}]}]        # sB + responses excluded
    assert recs == [{"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]}]
