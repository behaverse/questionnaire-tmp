"""Sentry init must be a safe no-op when SENTRY_DSN is unset (so it's harmless to ship enabled)."""
from identity_service.observability import init_sentry


def test_init_sentry_is_noop_without_dsn(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    # must not raise, must not import/require sentry_sdk
    init_sentry("identity-service")


def test_create_app_works_without_sentry(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    from fastapi.testclient import TestClient
    from identity_service.api.app import create_app
    assert TestClient(create_app()).get("/healthz").status_code == 200
