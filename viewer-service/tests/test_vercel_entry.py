def test_vercel_entry_exposes_healthz():
    import importlib.util, pathlib
    from fastapi.testclient import TestClient
    path = pathlib.Path(__file__).resolve().parents[1] / "api" / "index.py"
    spec = importlib.util.spec_from_file_location("vs_vercel_entry", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert TestClient(mod.app).get("/healthz").status_code == 200
