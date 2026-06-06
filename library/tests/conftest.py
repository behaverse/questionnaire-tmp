import psycopg
import pytest
from testcontainers.postgres import PostgresContainer
from library.store.migrate import apply_schema

@pytest.fixture(scope="session")
def pg_url():
    with PostgresContainer("postgres:16") as pg:
        url = pg.get_connection_url(driver=None)
        with psycopg.connect(url) as conn:
            apply_schema(conn)
        yield url

@pytest.fixture
def conn(pg_url):
    with psycopg.connect(pg_url, autocommit=False) as c:
        yield c

@pytest.fixture(autouse=True)
def _truncate(pg_url):
    yield
    with psycopg.connect(pg_url) as c:
        c.execute("TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE")
        c.commit()
