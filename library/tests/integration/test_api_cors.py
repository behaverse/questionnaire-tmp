from fastapi.testclient import TestClient
from library.api.app import create_app

def test_cors_preflight_allows_dev_origin(monkeypatch):
    monkeypatch.setenv("LIBRARY_CORS_ORIGINS", "http://localhost:5173")
    client = TestClient(create_app())
    r = client.options(
        "/v1/questionnaires",
        headers={"Origin": "http://localhost:5173",
                 "Access-Control-Request-Method": "GET"},
    )
    assert r.status_code in (200, 204)
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_simple_get_has_allow_origin(monkeypatch):
    monkeypatch.setenv("LIBRARY_CORS_ORIGINS", "http://localhost:5173")
    client = TestClient(create_app())
    r = client.get("/healthz", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_unlisted_origin_blocked(monkeypatch):
    monkeypatch.setenv("LIBRARY_CORS_ORIGINS", "http://localhost:5173")
    client = TestClient(create_app())
    r = client.get("/healthz", headers={"Origin": "http://evil.example"})
    assert r.headers.get("access-control-allow-origin") is None
