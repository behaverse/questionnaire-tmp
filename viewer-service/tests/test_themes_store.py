from viewer_service.store import themes as store


def test_insert_get_list_theme(conn):
    store.insert_theme(conn, theme_id="thm_x", name="X",
                       palette={"primary": "#1a5fb4"}, typography={"font_family": "Inter", "base_size": 16},
                       spacing={"unit": 8}, logo_url=None, custom_css=None)
    t = store.get_theme(conn, "thm_x")
    assert t["name"] == "X"
    assert t["palette"]["primary"] == "#1a5fb4"
    assert t["typography"]["base_size"] == 16
    assert store.get_theme(conn, "nope") is None
    assert [x["theme_id"] for x in store.list_themes(conn)] == ["thm_x"]


def test_insert_is_idempotent(conn):
    store.insert_theme(conn, theme_id="thm_x", name="X", palette={}, typography={},
                       spacing=None, logo_url=None, custom_css=None)
    store.insert_theme(conn, theme_id="thm_x", name="Y", palette={}, typography={},
                       spacing=None, logo_url=None, custom_css=None)
    assert store.get_theme(conn, "thm_x")["name"] == "X"   # ON CONFLICT DO NOTHING
