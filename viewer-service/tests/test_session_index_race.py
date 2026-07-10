"""The per-agent session_index allocation must be race-free: two concurrent mints for the same
agent must get DISTINCT indices (not both N+1)."""
import threading
import psycopg
from viewer_service.store import sessions as session_store


def _mint(pg_url, agent, barrier, out, i):
    with psycopg.connect(pg_url, autocommit=False) as c:
        barrier.wait()                      # maximize overlap
        idx = session_store.next_index_for_agent(c, agent)
        session_store.insert_session(
            c, ephemeral=False, participant_sub=agent, session_id=f"s_{i}", session_index=idx,
            deployment_id="dep_x", viewer_id="web", viewer_version="v1", agent_id=agent,
            instrument_id="qst", instrument_version="v1", status="in_progress",
            token_hash=f"h_{i}", initial_locale="en", last_active_locale="en")
        c.commit()
        out[i] = idx


def test_concurrent_mints_for_one_agent_get_distinct_indices(pg_url):
    agent = "u-race"
    n = 5
    barrier = threading.Barrier(n)
    out: dict[int, int] = {}
    threads = [threading.Thread(target=_mint, args=(pg_url, agent, barrier, out, i)) for i in range(n)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    indices = sorted(out.values())
    assert indices == [1, 2, 3, 4, 5], f"expected distinct 1..{n}, got {indices}"
    # cleanup for the shared session-scoped container
    with psycopg.connect(pg_url) as c:
        c.execute("DELETE FROM session WHERE agent_id=%s", (agent,)); c.commit()
