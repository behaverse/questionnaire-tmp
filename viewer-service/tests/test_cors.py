"""
CORS middleware tests — Task 14 (WV-A).

The middleware is additive: it is registered only when VS_CORS_ORIGINS is set.
We construct a fresh TestClient in each test (after patching the env) so that
create_app() reads the env at construction time, mirroring how the conftest
`client` fixture works.
"""
import pytest
from fastapi.testclient import TestClient


def test_cors_preflight_allows_configured_origin(pg_url, monkeypatch):
    monkeypatch.setenv("VS_CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("DATABASE_URL", pg_url)
    # Build the app AFTER the env is set so create_app() picks it up.
    from fastapi.testclient import TestClient
    from viewer_service.api.app import create_app
    client = TestClient(create_app())

    r = client.options(
        "/v1/sessions/new",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_no_cors_headers_when_unconfigured(pg_url, monkeypatch):
    # Ensure VS_CORS_ORIGINS is absent.
    monkeypatch.delenv("VS_CORS_ORIGINS", raising=False)
    monkeypatch.setenv("DATABASE_URL", pg_url)
    from fastapi.testclient import TestClient
    from viewer_service.api.app import create_app
    client = TestClient(create_app())

    r = client.get("/healthz", headers={"Origin": "http://localhost:5173"})
    assert r.status_code == 200
    assert "access-control-allow-origin" not in r.headers
