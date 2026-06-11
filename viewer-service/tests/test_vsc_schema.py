from viewer_service.store import sessions as session_store


def test_deployment_has_new_columns(conn):
    cols = {r[0] for r in conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name='deployment'").fetchall()}
    assert {"mode_preset", "dimensions", "active_from", "active_until", "quota",
            "style_overrides", "flow_overrides", "channels"}.issubset(cols)


def test_session_has_ephemeral_column(conn):
    cols = {r[0] for r in conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name='session'").fetchall()}
    assert "ephemeral" in cols


def _insert(conn, sid, **over):
    fields = dict(session_id=sid, session_index=1, deployment_id="dep_1", viewer_id="web",
                  viewer_version="v26.0610", agent_id="a1", instrument_id="qst_x",
                  instrument_version="v26.0609", status="in_progress", token_hash="h",
                  initial_locale="en", last_active_locale="en")
    session_store.insert_session(conn, **fields, **over)
    conn.commit()


def test_insert_session_defaults_ephemeral_false(conn):
    _insert(conn, "s_def")
    assert session_store.get_session(conn, "s_def")["ephemeral"] is False


def test_insert_session_ephemeral_true(conn):
    _insert(conn, "s_eph", ephemeral=True)
    assert session_store.get_session(conn, "s_eph")["ephemeral"] is True


def test_count_for_deployment(conn):
    _insert(conn, "s1")
    _insert(conn, "s2")
    assert session_store.count_for_deployment(conn, "dep_1") == 2
    assert session_store.count_for_deployment(conn, "dep_other") == 0
