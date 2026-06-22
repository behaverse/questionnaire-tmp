def test_community_tables_exist(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()
    names = {r[0] for r in rows}
    assert {"comment", "rating"} <= names


def test_questionnaire_exists(conn):
    from library.store.community import questionnaire_exists
    assert questionnaire_exists(conn, "qst_nope") is False
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_x','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_x','v26.0101','questionnaire','published','X')")
    assert questionnaire_exists(conn, "qst_x") is True
