import os
import psycopg, pytest
from pathlib import Path
from testcontainers.postgres import PostgresContainer
from viewer_service.store.migrate import apply_schema

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_DIR = REPO_ROOT / "schemas"


@pytest.fixture(scope="session")
def pg_url():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url(driver=None)
        with psycopg.connect(url) as conn:
            apply_schema(conn)
            conn.commit()
        yield url


@pytest.fixture
def conn(pg_url):
    with psycopg.connect(pg_url, autocommit=False) as c:
        yield c


@pytest.fixture
def client(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    from fastapi.testclient import TestClient
    from viewer_service.api.app import create_app
    return TestClient(create_app())


@pytest.fixture(autouse=True)
def _truncate(request):
    yield
    if "conn" not in request.fixturenames and "pg_url" not in request.fixturenames and "client" not in request.fixturenames:
        return
    url = request.getfixturevalue("pg_url")
    with psycopg.connect(url) as c:
        c.execute("TRUNCATE deployment, viewer_registry, runtime_cache, session, outbox CASCADE")
        c.commit()
