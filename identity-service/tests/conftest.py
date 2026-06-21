import psycopg, pytest
from testcontainers.postgres import PostgresContainer
from identity_service.store.migrate import apply_schema


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
    from identity_service.api.app import create_app
    return TestClient(create_app())


@pytest.fixture(autouse=True)
def _truncate(request):
    yield
    names = request.fixturenames
    if not ({"conn", "pg_url", "client"} & set(names)):
        return
    url = request.getfixturevalue("pg_url")
    with psycopg.connect(url) as c:
        c.execute("TRUNCATE users, clients, user_roles, refresh_tokens, "
                  "email_tokens, signing_keys CASCADE")
        c.commit()
