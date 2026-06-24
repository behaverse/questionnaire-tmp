def test_forward_requires_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/forward", headers={"Authorization": "Bearer nope"})
    assert r.status_code == 401


def test_forward_runs_with_cron_secret(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "topsecret")
    r = client.get("/internal/forward", headers={"Authorization": "Bearer topsecret"})
    assert r.status_code == 200
    assert "forwarded" in r.json()


def test_forward_fails_closed_when_secret_unset(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    r = client.get("/internal/forward", headers={"Authorization": "Bearer anything"})
    assert r.status_code == 401
