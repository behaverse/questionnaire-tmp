"""Auth endpoints are per-IP rate limited (brute-force + email-bombing guard)."""
import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore, rate_limit as rl_store


def _bootstrap(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        c.commit()


def _client(pg_url, monkeypatch, **limits):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "1")
    for k, v in limits.items():
        monkeypatch.setenv(k, v)
    from fastapi.testclient import TestClient
    from identity_service.api.app import create_app
    return TestClient(create_app())


def test_login_is_rate_limited_per_ip(pg_url, monkeypatch):
    _bootstrap(pg_url)
    c = _client(pg_url, monkeypatch, RATE_LIMIT_LOGIN="3/3600")
    body = {"email": "nobody@e.com", "password": "wrong", "audience": "questionnaire-apps"}
    codes = [c.post("/v1/auth/login", json=body).status_code for _ in range(4)]
    assert codes[:3] == [401, 401, 401]        # wrong creds, but allowed through
    assert codes[3] == 429                       # 4th within the window is throttled
    assert c.post("/v1/auth/login", json=body).json()["error"]["code"] == "rate_limited"


def test_register_is_rate_limited_per_ip(pg_url, monkeypatch):
    _bootstrap(pg_url)
    c = _client(pg_url, monkeypatch, RATE_LIMIT_REGISTER="2/3600")
    mk = lambda i: {"email": f"u{i}@e.com", "password": "password1", "audience": "questionnaire-apps"}
    assert c.post("/v1/auth/register", json=mk(1)).status_code == 202
    assert c.post("/v1/auth/register", json=mk(2)).status_code == 202
    assert c.post("/v1/auth/register", json=mk(3)).status_code == 429   # 3rd blocked


def test_disabled_flag_bypasses_the_limiter(pg_url, monkeypatch):
    _bootstrap(pg_url)
    monkeypatch.setenv("DATABASE_URL", pg_url)
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "0")
    monkeypatch.setenv("RATE_LIMIT_LOGIN", "1/3600")   # a low limit that would trip if enforced
    from fastapi.testclient import TestClient
    from identity_service.api.app import create_app
    c = TestClient(create_app())
    body = {"email": "nobody@e.com", "password": "wrong", "audience": "questionnaire-apps"}
    assert all(c.post("/v1/auth/login", json=body).status_code == 401 for _ in range(5))


def test_distinct_ips_have_independent_budgets(pg_url, monkeypatch):
    _bootstrap(pg_url)
    c = _client(pg_url, monkeypatch, RATE_LIMIT_LOGIN="1/3600")
    body = {"email": "nobody@e.com", "password": "wrong", "audience": "questionnaire-apps"}
    assert c.post("/v1/auth/login", json=body, headers={"x-forwarded-for": "1.1.1.1"}).status_code == 401
    assert c.post("/v1/auth/login", json=body, headers={"x-forwarded-for": "1.1.1.1"}).status_code == 429
    # a different client IP is unaffected
    assert c.post("/v1/auth/login", json=body, headers={"x-forwarded-for": "2.2.2.2"}).status_code == 401


def test_trusted_header_takes_precedence_over_forwarded_for(pg_url, monkeypatch):
    """The hardened x-vercel-forwarded-for keys the bucket; a spoofed x-forwarded-for is ignored, so
    an attacker can't rotate XFF to escape a per-IP limit behind Vercel."""
    _bootstrap(pg_url)
    c = _client(pg_url, monkeypatch, RATE_LIMIT_LOGIN="1/3600")
    body = {"email": "nobody@e.com", "password": "wrong", "audience": "questionnaire-apps"}
    h1 = {"x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "1.1.1.1"}
    h2 = {"x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "2.2.2.2"}  # same trusted IP, diff XFF
    assert c.post("/v1/auth/login", json=body, headers=h1).status_code == 401
    assert c.post("/v1/auth/login", json=body, headers=h2).status_code == 429  # still the same bucket


def test_limiter_fails_open_on_db_error(pg_url, monkeypatch):
    """A limiter DB hiccup must never 500 a legitimate login — it fails open (allows the request)."""
    _bootstrap(pg_url)
    c = _client(pg_url, monkeypatch, RATE_LIMIT_LOGIN="1/3600")
    from identity_service.store import rate_limit as rl
    def boom(*a, **k):
        raise RuntimeError("db down")
    monkeypatch.setattr(rl, "check_and_record", boom)
    body = {"email": "nobody@e.com", "password": "wrong", "audience": "questionnaire-apps"}
    # would be 429 on the 2nd call if the limiter worked; with it erroring, both pass through to 401
    assert c.post("/v1/auth/login", json=body).status_code == 401
    assert c.post("/v1/auth/login", json=body).status_code == 401


def test_prune_drops_only_old_hits(conn):
    conn.execute("INSERT INTO rate_limit_hit (bucket, ts) VALUES ('b', now() - interval '2 days')")
    conn.execute("INSERT INTO rate_limit_hit (bucket, ts) VALUES ('b', now())")
    conn.commit()
    assert rl_store.prune(conn, max_age_seconds=86_400) == 1
    (n,) = conn.execute("SELECT count(*) FROM rate_limit_hit").fetchone()
    assert n == 1
