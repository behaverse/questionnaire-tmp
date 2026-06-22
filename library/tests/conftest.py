import psycopg, pytest
from testcontainers.postgres import PostgresContainer
from library.store.migrate import apply_schema
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from library.api import identity as _idmod

_ID_ISSUER = "http://id-test"
_ID_AUDIENCE = "questionnaire-apps"


@pytest.fixture(scope="session")
def id_key():
    return generate_keypair()  # (kid, public_jwk, private_pem)


def _mint(id_key, roles, sub):
    kid, jwk, pem = id_key
    return sign_access(private_pem=pem, kid=kid, sub=sub, aud=_ID_AUDIENCE,
                       roles=roles, issuer=_ID_ISSUER, ttl=900)


@pytest.fixture
def auth_header(id_key):
    def make(roles, *, sub="u-user"):
        return {"Authorization": f"Bearer {_mint(id_key, roles, sub)}"}
    return make


@pytest.fixture
def client(pg_url, id_key, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    monkeypatch.setenv("IDENTITY_ISSUER", _ID_ISSUER)
    monkeypatch.setenv("IDENTITY_AUDIENCE", _ID_AUDIENCE)
    _idmod.install_test_cache(id_key[1])
    from fastapi.testclient import TestClient
    from library.api.app import create_app
    return TestClient(create_app())

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
        c.execute("TRUNCATE entity, catalogue_entry, entity_ref, facet, comment, rating CASCADE")
        c.commit()
