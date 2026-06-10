import viewer_service.cli as cli


def test_forward_worker_once_runs_a_batch(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    calls = {"n": 0}

    def fake_process(conn, sink, **kw):
        calls["n"] += 1
        return {"forwarded": 0, "failed": 0, "retried": 0}

    monkeypatch.setattr(cli, "process_outbox_batch", fake_process)
    rc = cli.main(["forward-worker", "--once"])
    assert rc == 0
    assert calls["n"] == 1


def test_unknown_command_returns_2():
    assert cli.main(["bogus"]) == 2
