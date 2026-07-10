def test_reap_requires_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    # wrong secret
    r = client.get("/internal/reap", headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_reap_runs_with_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/reap", headers={"Authorization": "Bearer topsecret"})
    assert r.status_code == 200
    body = r.json()["reaped"]
    assert set(body) == {"handoff_codes", "email_tokens", "refresh_tokens", "rate_limit_hit"}


def test_reap_fails_closed_when_secret_unset(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    r = client.get("/internal/reap", headers={"Authorization": "Bearer anything"})
    assert r.status_code == 401
