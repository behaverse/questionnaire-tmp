import psycopg
from psycopg.types.json import Jsonb
from viewer_service.store import sessions as sstore
from viewer_service.store import export as export_store


def _seed_session(c, sub, sid, dep="dep_1"):
    sstore.insert_session(
        c, ephemeral=False, participant_sub=sub, session_id=sid, session_index=1,
        deployment_id=dep, viewer_id="web", viewer_version="v1", agent_id=sub,
        instrument_id="qst_x", instrument_version="v26.0101", status="submitted",
        token_hash="h_" + sid, initial_locale="en", last_active_locale="en")


def _seed_recording(c, sid, channel, samples):
    c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
              "VALUES (%s,'recording',%s,%s)",
              (sid, Jsonb({"channel": channel, "samples": samples}), "hr_" + sid))


def test_recordings_scoped_to_participant(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed_session(c, "alice", "sA")
        _seed_session(c, "bob", "sB")
        _seed_recording(c, "sA", "mouse", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
        _seed_recording(c, "sB", "mouse", [{"t": 0, "x": 9, "y": 9, "button_state": "up"}])
        # an events row must NOT be returned by the recording reader
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES ('sA','events',%s,'he')", (Jsonb({"batch_id": "b", "events": []}),))
        c.commit()
        rows = list(export_store.iter_recording_rows_for_participant(c, "alice"))
    assert rows == [{"channel": "mouse", "samples": [{"t": 0, "x": 1, "y": 2, "button_state": "up"}]}]


def test_recordings_for_deployment(pg_url):
    with psycopg.connect(pg_url) as c:
        _seed_session(c, "alice", "sA", dep="dep_rec")
        _seed_session(c, "bob", "sB", dep="dep_other")
        _seed_recording(c, "sA", "mouse", [{"t": 0, "x": 1, "y": 2, "button_state": "up"}])
        _seed_recording(c, "sB", "mouse", [{"t": 0, "x": 9, "y": 9, "button_state": "up"}])
        c.commit()
        rows = list(export_store.iter_recording_rows(c, "dep_rec"))
    assert len(rows) == 1 and rows[0]["channel"] == "mouse"
