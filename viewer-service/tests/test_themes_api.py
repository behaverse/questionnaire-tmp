PASS_THEME = {"name": "My Theme",
              "palette": {"primary": "#1a5fb4", "secondary": "#613583", "background": "#ffffff"},
              "typography": {"font_family": "Inter", "base_size": 16}}


def test_create_theme_passes(client):
    r = client.post("/v1/themes", json=PASS_THEME)
    assert r.status_code == 201, r.text
    tid = r.json()["theme_id"]
    assert tid.startswith("thm_")
    assert client.get(f"/v1/themes/{tid}").json()["name"] == "My Theme"


def test_create_theme_blocked_by_wcag(client):
    bad = {"name": "Bad", "palette": {"primary": "#dddddd"}, "typography": {"base_size": 16}}
    r = client.post("/v1/themes", json=bad)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "theme_inaccessible"
    assert r.json()["error"]["detail"]   # lists the failure(s)


def test_get_unknown_theme_404(client):
    assert client.get("/v1/themes/thm_nope").status_code == 404


def test_seed_builtins_then_list(client, pg_url):
    import psycopg
    from viewer_service.themes import seed_builtin_themes
    with psycopg.connect(pg_url) as c:
        seed_builtin_themes(c)
    ids = {t["theme_id"] for t in client.get("/v1/themes").json()["items"]}
    assert {"default", "institutional_blue", "institutional_green"}.issubset(ids)
