from viewer_service.store import runtime_cache as cache

KEY = ("qst_x", "v26.0609", "en", "a" * 64, "b" * 64)


def test_put_then_get_returns_runtime(conn):
    cache.put(conn, KEY, {"hello": "world"}, "dep_1", cap=100)
    assert cache.get(conn, *KEY) == {"hello": "world"}


def test_get_miss_returns_none(conn):
    assert cache.get(conn, "qst_none", "v26.0609", "en", "a" * 64, "b" * 64) is None


def test_purge_all(conn):
    cache.put(conn, KEY, {"a": 1}, "dep_1", cap=100)
    cache.put(conn, ("qst_y", "v26.0609", "en", "c" * 64, "d" * 64), {"a": 2}, "dep_2", cap=100)
    assert cache.purge(conn) == 2
    assert cache.get(conn, *KEY) is None


def test_purge_by_deployment(conn):
    cache.put(conn, KEY, {"a": 1}, "dep_1", cap=100)
    cache.put(conn, ("qst_y", "v26.0609", "en", "c" * 64, "d" * 64), {"a": 2}, "dep_2", cap=100)
    assert cache.purge(conn, deployment_id="dep_1") == 1
    assert cache.get(conn, *KEY) is None
    assert cache.get(conn, "qst_y", "v26.0609", "en", "c" * 64, "d" * 64) == {"a": 2}


def test_lru_evicts_oldest_when_over_cap(conn):
    # 3 entries with distinct last_accessed_at; then a 4th put with cap=2 evicts the 2 oldest.
    for i, ts in enumerate(["2026-01-01", "2026-01-02", "2026-01-03"]):
        cache.put(conn, (f"qst_{i}", "v26.0609", "en", "a" * 64, "b" * 64), {"i": i}, "dep_x", cap=100)
        conn.execute("UPDATE runtime_cache SET last_accessed_at=%s WHERE qst_id=%s",
                     (ts + "T00:00:00+00:00", f"qst_{i}"))
        conn.commit()
    cache.put(conn, ("qst_3", "v26.0609", "en", "a" * 64, "b" * 64), {"i": 3}, "dep_x", cap=2)
    present = {r[0] for r in conn.execute("SELECT qst_id FROM runtime_cache").fetchall()}
    assert present == {"qst_2", "qst_3"}   # newest two kept; qst_0, qst_1 evicted
