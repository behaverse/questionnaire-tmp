from fastapi.testclient import TestClient
from viewer_service.api.app import create_app


def test_serves_known_scorer_wasm(tmp_path, monkeypatch):
    wasm = b"\x00asm\x01\x00\x00\x00rest"
    (tmp_path / "scr_phq9@v26.0602.wasm").write_bytes(wasm)
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    client = TestClient(create_app())
    r = client.get("/v1/scorers/scr_phq9@v26.0602/impl.wasm")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/wasm"
    assert r.content == wasm


def test_unknown_scorer_is_404(tmp_path, monkeypatch):
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    client = TestClient(create_app())
    r = client.get("/v1/scorers/scr_nope@v26.0101/impl.wasm")
    assert r.status_code == 404


def test_bad_ref_is_404(tmp_path, monkeypatch):
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    client = TestClient(create_app())
    r = client.get("/v1/scorers/..%2f..%2fetc/impl.wasm")
    assert r.status_code in (404, 400)
