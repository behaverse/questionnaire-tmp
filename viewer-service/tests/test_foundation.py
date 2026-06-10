from viewer_service.config import get_settings


def test_new_settings_have_defaults():
    s = get_settings()
    assert s.outbox_hard_threshold == 1_000_000
    assert s.outbox_soft_threshold == 10_000
    assert s.forward_max_attempts == 8
    assert s.forward_batch_size == 50
    assert s.behaverse_base_url  # non-empty default


def test_session_and_outbox_tables_exist(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_name IN ('session','outbox')"
    ).fetchall()
    assert {r[0] for r in rows} == {"session", "outbox"}
