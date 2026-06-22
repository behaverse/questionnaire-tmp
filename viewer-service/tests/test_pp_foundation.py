from viewer_service.modes import resolve_preset
from viewer_service.store import sessions as sstore


def test_authenticated_preset_resolves_identity_auth():
    dims = resolve_preset("authenticated")
    assert dims == {"auth": "identity", "persistence": "persisted",
                    "lifecycle": "standard", "rendering_context": "standalone"}


def _insert(conn, sid, agent, idx, participant_sub=None):
    sstore.insert_session(
        conn, ephemeral=False, participant_sub=participant_sub, session_id=sid, session_index=idx,
        deployment_id="dep_1", viewer_id="web", viewer_version="v1", agent_id=agent,
        instrument_id="qst_x", instrument_version="v26.0101", status="in_progress",
        token_hash="h" + sid, initial_locale="en", last_active_locale="en")


def test_participant_sub_persists_and_reads(conn):
    _insert(conn, "s1", "u-alice", 1, participant_sub="u-alice")
    got = sstore.get_session(conn, "s1")
    assert got["participant_sub"] == "u-alice"


def test_participant_sub_defaults_null_for_anonymous(conn):
    _insert(conn, "s2", "agent_abc", 1)
    assert sstore.get_session(conn, "s2")["participant_sub"] is None


def test_count_for_agent(conn):
    _insert(conn, "s3", "u-bob", 1, participant_sub="u-bob")
    _insert(conn, "s4", "u-bob", 2, participant_sub="u-bob")
    _insert(conn, "s5", "agent_z", 1)
    assert sstore.count_for_agent(conn, "u-bob") == 2
    assert sstore.count_for_agent(conn, "nobody") == 0
