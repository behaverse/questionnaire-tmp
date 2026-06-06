import psycopg, pytest
from testcontainers.postgres import PostgresContainer
from library.store.migrate import apply_schema

@pytest.fixture(scope="session")
def pg_url():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url(driver=None)  # driver=None -> plain postgresql:// for psycopg v3
        with psycopg.connect(url) as conn:
            apply_schema(conn)
        yield url

@pytest.fixture
def conn(pg_url):
    with psycopg.connect(pg_url, autocommit=False) as c:
        yield c

@pytest.fixture(autouse=True)
def _truncate(request):
    # Only touch the database (and only start Postgres) for tests that actually use
    # it; pure unit tests request neither `conn` nor `pg_url`.
    yield
    if "conn" not in request.fixturenames and "pg_url" not in request.fixturenames:
        return
    url = request.getfixturevalue("pg_url")
    with psycopg.connect(url) as c:
        c.execute("TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE")
        c.commit()
