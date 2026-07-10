"""Interactive docs / OpenAPI schema must be OFF unless ENABLE_DOCS is set."""
from fastapi.testclient import TestClient


def _app(monkeypatch, enable):
    if enable is None:
        monkeypatch.delenv("ENABLE_DOCS", raising=False)
    else:
        monkeypatch.setenv("ENABLE_DOCS", enable)
    from viewer_service.api.app import create_app
    return TestClient(create_app())


def test_docs_disabled_by_default(monkeypatch):
    c = _app(monkeypatch, None)
    assert c.get("/openapi.json").status_code == 404
    assert c.get("/docs").status_code == 404
    assert c.get("/healthz").status_code == 200


def test_docs_enabled_with_flag(monkeypatch):
    c = _app(monkeypatch, "1")
    assert c.get("/openapi.json").status_code == 200
    assert c.get("/docs").status_code == 200
