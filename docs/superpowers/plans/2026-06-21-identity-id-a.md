# ID-A — Identity Core Auth Service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `identity-service/` (Python/FastAPI) that owns user accounts and issues EdDSA-JWT access tokens (verified via JWKS) plus opaque rotating refresh tokens, with email+password auth and an audience-scoped 5-role RBAC model.

**Architecture:** A new top-level component mirroring `library/` and `viewer-service/` (app-factory FastAPI, raw psycopg3, raw-SQL `migrate`, click-free `argv` CLI, testcontainers Postgres). Identity signs short-lived access JWTs with Ed25519 keys it stores; consumers verify locally against `/.well-known/jwks.json`. Refresh tokens are opaque, SHA-256-hashed at rest, rotating with reuse-detection. A standalone `identity_client` module (shipped in this package) lets later slices verify tokens without importing the service.

**Tech Stack:** Python ≥3.12, FastAPI ≥0.110, uvicorn, psycopg[binary] ≥3.1 + psycopg_pool, pydantic ≥2.6, **PyJWT[crypto] ≥2.8** (EdDSA via `cryptography`), **argon2-cffi ≥23**, httpx ≥0.27. Tests: pytest ≥8, testcontainers[postgres] ≥4.

## Global Constraints

- Python `>=3.12`; package name `questionnaire-identity-service`; import package `identity_service`; source under `src/`.
- Postgres access is **raw psycopg3** — no ORM. Migrations are raw SQL in `store/schema.sql` applied by `store/migrate.apply_schema(conn)` (the caller owns the transaction/commit).
- App factory: `identity_service.api.api.app:create_app` usable as `uvicorn ... --factory`.
- CLI entry point `identity = "identity_service.cli:main"`; subcommands parsed from `argv` (match `viewer_service/cli.py` style — no click).
- Config is a frozen `@dataclass` read from `os.environ` via `get_settings()` (match `viewer_service/config.py`). No pydantic BaseSettings.
- Error responses use the shape `{"error": {"code": <slug>, "message": <str>}}`; 401 auth, 403 authz, 404 missing, 422 validation.
- **Role vocabulary is exactly:** `researcher`, `participant`, `reviewer`, `contributor`, `administrator`. Roles are scoped per `(user, client)`.
- Access token: JWT, `alg=EdDSA`, header carries `kid`; claims `sub, aud, roles, iss, iat, exp, jti`. Default TTL 900 s.
- Refresh token: opaque `secrets.token_urlsafe(32)`, stored only as SHA-256 hex, default TTL 2592000 s, rotating, family-revoke on reuse.
- Integration tests need `DOCKER_CONFIG=/tmp/lib_docker` and run in their **own** `pytest` invocation (monorepo import-mode quirk).
- TDD: every code change is preceded by a failing test. Commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-21-identity-id-a-design.md`.

---

### Task 1: Project scaffold — package, config, schema, migrate, conftest, healthz

**Files:**
- Create: `identity-service/pyproject.toml`
- Create: `identity-service/src/identity_service/__init__.py` (empty)
- Create: `identity-service/src/identity_service/config.py`
- Create: `identity-service/src/identity_service/store/__init__.py` (empty)
- Create: `identity-service/src/identity_service/store/schema.sql`
- Create: `identity-service/src/identity_service/store/migrate.py`
- Create: `identity-service/src/identity_service/api/__init__.py` (empty)
- Create: `identity-service/src/identity_service/api/app.py`
- Create: `identity-service/src/identity_service/api/deps.py`
- Create: `identity-service/tests/conftest.py`
- Create: `identity-service/tests/test_foundation.py`

**Interfaces:**
- Produces: `get_settings() -> Settings` with fields `database_url, issuer, access_ttl, refresh_ttl, cors_origins, default_register_role, verify_token_ttl, reset_token_ttl`.
- Produces: `store.migrate.apply_schema(conn)`.
- Produces: `api.app.create_app() -> FastAPI` with `GET /healthz`.
- Produces: pytest fixtures `pg_url`, `conn`, `client`.
- Produces: tables `users, clients, user_roles, refresh_tokens, email_tokens, signing_keys`.

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[project]
name = "questionnaire-identity-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.110",
  "uvicorn[standard]>=0.29",
  "psycopg[binary]>=3.1",
  "psycopg_pool>=3.2",
  "pydantic>=2.6",
  "pyjwt[crypto]>=2.8",
  "argon2-cffi>=23",
  "httpx>=0.27",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "testcontainers[postgres]>=4.0"]

[project.scripts]
identity = "identity_service.cli:main"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Write `config.py`**

```python
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    issuer: str
    access_ttl: int = 900            # seconds
    refresh_ttl: int = 2_592_000     # seconds (30 days)
    verify_token_ttl: int = 86_400   # seconds (1 day)
    reset_token_ttl: int = 3_600     # seconds (1 hour)
    default_register_role: str = "researcher"
    cors_origins: tuple[str, ...] = ()


def get_settings() -> Settings:
    raw = os.environ.get("IDENTITY_CORS_ORIGINS")
    origins = tuple(o.strip() for o in raw.split(",") if o.strip()) if raw is not None else ()
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/identity_service"),
        issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        access_ttl=int(os.environ.get("ACCESS_TOKEN_TTL", "900")),
        refresh_ttl=int(os.environ.get("REFRESH_TOKEN_TTL", "2592000")),
        verify_token_ttl=int(os.environ.get("VERIFY_TOKEN_TTL", "86400")),
        reset_token_ttl=int(os.environ.get("RESET_TOKEN_TTL", "3600")),
        default_register_role=os.environ.get("DEFAULT_REGISTER_ROLE", "researcher"),
        cors_origins=origins,
    )
```

- [ ] **Step 3: Write `store/schema.sql`** (full DDL for all six tables — used by every later task)

```sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY,
  email          citext UNIQUE NOT NULL,
  password_hash  text NOT NULL,
  display_name   text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'active',
  email_verified boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_status_chk CHECK (status IN ('active','disabled'))
);

CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY,
  slug       text UNIQUE NOT NULL,
  name       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role      text NOT NULL,
  PRIMARY KEY (user_id, client_id, role),
  CONSTRAINT user_roles_role_chk CHECK
    (role IN ('researcher','participant','reviewer','contributor','administrator'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  family_id  uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  rotated_to uuid REFERENCES refresh_tokens(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS email_tokens (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  token_hash  text UNIQUE NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_tokens_kind_chk CHECK (kind IN ('verify','reset'))
);

CREATE TABLE IF NOT EXISTS signing_keys (
  kid         text PRIMARY KEY,
  alg         text NOT NULL DEFAULT 'EdDSA',
  public_jwk  jsonb NOT NULL,
  private_pem text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signing_keys_active ON signing_keys (active);
```

- [ ] **Step 4: Write `store/migrate.py`**

```python
from pathlib import Path
import psycopg

SCHEMA_SQL = Path(__file__).with_name("schema.sql")


def apply_schema(conn: psycopg.Connection) -> None:
    """Apply the DDL. Does not commit — the caller owns the transaction."""
    conn.execute(SCHEMA_SQL.read_text())
```

- [ ] **Step 5: Write `api/deps.py`**

```python
import psycopg
from ..config import get_settings


def get_conn():
    conn = psycopg.connect(get_settings().database_url)
    try:
        yield conn
    finally:
        conn.close()
```

- [ ] **Step 6: Write `api/app.py`** (routers are added in later tasks; this is the foundation factory)

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from ..config import get_settings

_CODE_FOR = {400: "bad_request", 401: "unauthorized", 403: "forbidden",
             404: "not_found", 409: "conflict", 422: "unprocessable"}


def create_app() -> FastAPI:
    app = FastAPI(title="Questionnaire Identity Service", version="v1")
    origins = list(get_settings().cors_origins)
    if origins:
        app.add_middleware(CORSMiddleware, allow_origins=origins,
                           allow_methods=["*"], allow_headers=["*"])

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    @app.exception_handler(HTTPException)
    async def _http_exc(request: Request, exc: HTTPException):
        return JSONResponse(status_code=exc.status_code,
            content={"error": {"code": _CODE_FOR.get(exc.status_code, "error"),
                               "message": str(exc.detail)}})

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422,
            content={"error": {"code": "unprocessable", "message": "validation error",
                               "detail": jsonable_encoder(exc.errors())}})

    return app
```

- [ ] **Step 7: Write `tests/conftest.py`**

```python
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
```

- [ ] **Step 8: Write `tests/test_foundation.py`**

```python
def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_schema_creates_tables(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()
    names = {r[0] for r in rows}
    assert {"users", "clients", "user_roles", "refresh_tokens",
            "email_tokens", "signing_keys"} <= names
```

- [ ] **Step 9: Install editable + run tests**

Run: `cd identity-service && pip install -e '.[dev]' && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q`
Expected: 2 passed.

- [ ] **Step 10: Commit**

```bash
git add identity-service/
git commit -m "feat(identity): ID-A scaffold — config, schema, migrate, app factory, conftest"
```

---

### Task 2: Password hashing (Argon2id)

**Files:**
- Create: `identity-service/src/identity_service/passwords.py`
- Create: `identity-service/tests/test_passwords.py`

**Interfaces:**
- Produces: `hash_password(plain: str) -> str`, `verify_password(plain: str, hashed: str) -> bool`.

- [ ] **Step 1: Write the failing test** (`tests/test_passwords.py`)

```python
from identity_service.passwords import hash_password, verify_password


def test_hash_is_argon2id_and_verifies():
    h = hash_password("correct horse")
    assert h.startswith("$argon2id$")
    assert verify_password("correct horse", h) is True


def test_wrong_password_fails():
    h = hash_password("correct horse")
    assert verify_password("battery staple", h) is False


def test_hashes_are_salted_unique():
    assert hash_password("same") != hash_password("same")


def test_malformed_hash_returns_false():
    assert verify_password("x", "not-a-hash") is False
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_passwords.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.passwords`).

- [ ] **Step 3: Write `passwords.py`**

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

_ph = PasswordHasher()  # argon2id defaults


def hash_password(plain: str) -> str:
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, InvalidHashError, ValueError):
        return False
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd identity-service && python -m pytest tests/test_passwords.py -q`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add identity-service/src/identity_service/passwords.py identity-service/tests/test_passwords.py
git commit -m "feat(identity): Argon2id password hashing"
```

---

### Task 3: Signing keys — Ed25519 generation, JWK export, key store

**Files:**
- Create: `identity-service/src/identity_service/keys.py`
- Create: `identity-service/src/identity_service/store/keys.py`
- Create: `identity-service/tests/test_keys.py`

**Interfaces:**
- Consumes: `store.migrate` (tables exist).
- Produces: `keys.generate_keypair() -> tuple[str, dict, str]` returning `(kid, public_jwk, private_pem)`.
- Produces: `store.keys.insert_key(conn, kid, alg, public_jwk, private_pem, active=True)`,
  `store.keys.active_keys(conn) -> list[dict]` (rows with `kid, alg, public_jwk, private_pem`),
  `store.keys.signing_key(conn) -> dict | None` (the newest active key, used to sign),
  `store.keys.retire_others(conn, keep_kid)`.

- [ ] **Step 1: Write the failing test** (`tests/test_keys.py`)

```python
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore


def test_generate_keypair_shape():
    kid, jwk, pem = generate_keypair()
    assert isinstance(kid, str) and len(kid) >= 8
    assert jwk["kty"] == "OKP" and jwk["crv"] == "Ed25519"
    assert jwk["kid"] == kid and jwk["use"] == "sig" and jwk["alg"] == "EdDSA"
    assert "x" in jwk and "d" not in jwk          # public JWK only — no private scalar
    assert "BEGIN PRIVATE KEY" in pem


def test_insert_and_read_active_key(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    active = kstore.active_keys(conn)
    assert [k["kid"] for k in active] == [kid]
    assert kstore.signing_key(conn)["kid"] == kid


def test_retire_others_leaves_one_active(conn):
    a = generate_keypair(); b = generate_keypair()
    kstore.insert_key(conn, a[0], "EdDSA", a[1], a[2])
    kstore.insert_key(conn, b[0], "EdDSA", b[1], b[2])
    kstore.retire_others(conn, keep_kid=b[0])
    assert [k["kid"] for k in kstore.active_keys(conn)] == [b[0]]
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_keys.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.keys`).

- [ ] **Step 3: Write `keys.py`**

```python
import json
import secrets
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from jwt.algorithms import OKPAlgorithm


def generate_keypair() -> tuple[str, dict, str]:
    """Return (kid, public_jwk, private_pem) for a fresh Ed25519 signing key."""
    kid = secrets.token_hex(8)
    priv = Ed25519PrivateKey.generate()
    private_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    # OKPAlgorithm.to_jwk on the public key yields {"kty","crv","x"} (no private scalar).
    pub_jwk = json.loads(OKPAlgorithm.to_jwk(priv.public_key()))
    pub_jwk.update({"kid": kid, "use": "sig", "alg": "EdDSA"})
    return kid, pub_jwk, private_pem
```

- [ ] **Step 4: Write `store/keys.py`**

```python
import json
import psycopg
from psycopg.types.json import Jsonb


def insert_key(conn: psycopg.Connection, kid: str, alg: str, public_jwk: dict,
               private_pem: str, active: bool = True) -> None:
    conn.execute(
        "INSERT INTO signing_keys (kid, alg, public_jwk, private_pem, active) "
        "VALUES (%s, %s, %s, %s, %s)",
        (kid, alg, Jsonb(public_jwk), private_pem, active),
    )


def _rows(conn, sql, args=()):
    cur = conn.execute(sql, args)
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def active_keys(conn: psycopg.Connection) -> list[dict]:
    return _rows(conn,
        "SELECT kid, alg, public_jwk, private_pem FROM signing_keys "
        "WHERE active ORDER BY created_at DESC")


def signing_key(conn: psycopg.Connection) -> dict | None:
    rows = _rows(conn,
        "SELECT kid, alg, public_jwk, private_pem FROM signing_keys "
        "WHERE active ORDER BY created_at DESC LIMIT 1")
    return rows[0] if rows else None


def retire_others(conn: psycopg.Connection, keep_kid: str) -> None:
    conn.execute("UPDATE signing_keys SET active = false WHERE kid <> %s", (keep_kid,))
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_keys.py -q`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/keys.py identity-service/src/identity_service/store/keys.py identity-service/tests/test_keys.py
git commit -m "feat(identity): Ed25519 signing-key generation + key store"
```

---

### Task 4: Tokens — JWT sign/verify + opaque refresh mint/hash

**Files:**
- Create: `identity-service/src/identity_service/tokens.py`
- Create: `identity-service/tests/test_tokens.py`

**Interfaces:**
- Produces: `mint_refresh() -> str`, `hash_token(token: str) -> str` (sha256 hex).
- Produces: `sign_access(*, private_pem, kid, sub, aud, roles, issuer, ttl, now=None) -> str`.
- Produces: `verify_access(token, *, public_jwk, audience, issuer, now=None) -> dict` (claims) — raises `jwt.InvalidTokenError` subclasses on failure.

- [ ] **Step 1: Write the failing test** (`tests/test_tokens.py`)

```python
import time
import jwt
import pytest
from identity_service.keys import generate_keypair
from identity_service import tokens


def _key():
    kid, jwk, pem = generate_keypair()
    return kid, jwk, pem


def test_refresh_token_opaque_and_hashed():
    t = tokens.mint_refresh()
    assert len(t) >= 32
    h = tokens.hash_token(t)
    assert len(h) == 64 and h == tokens.hash_token(t)   # stable sha256 hex


def test_sign_then_verify_roundtrip():
    kid, jwk, pem = _key()
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=["researcher"],
                             issuer="http://id", ttl=900)
    claims = tokens.verify_access(tok, public_jwk=jwk,
                                  audience="questionnaire-apps", issuer="http://id")
    assert claims["sub"] == "u1"
    assert claims["roles"] == ["researcher"]
    assert jwt.get_unverified_header(tok)["kid"] == kid


def test_wrong_audience_rejected():
    kid, jwk, pem = _key()
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1", aud="other",
                             roles=[], issuer="http://id", ttl=900)
    with pytest.raises(jwt.InvalidAudienceError):
        tokens.verify_access(tok, public_jwk=jwk,
                             audience="questionnaire-apps", issuer="http://id")


def test_expired_rejected():
    kid, jwk, pem = _key()
    past = int(time.time()) - 10
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=[], issuer="http://id",
                             ttl=1, now=past)
    with pytest.raises(jwt.ExpiredSignatureError):
        tokens.verify_access(tok, public_jwk=jwk,
                             audience="questionnaire-apps", issuer="http://id")


def test_tampered_signature_rejected():
    kid, jwk, pem = _key()
    other = generate_keypair()                       # different key
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1",
                             aud="questionnaire-apps", roles=[], issuer="http://id", ttl=900)
    with pytest.raises(jwt.InvalidSignatureError):
        tokens.verify_access(tok, public_jwk=other[1],
                             audience="questionnaire-apps", issuer="http://id")
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_tokens.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.tokens`).

- [ ] **Step 3: Write `tokens.py`**

```python
import hashlib
import json
import secrets
import time
import uuid

import jwt
from jwt.algorithms import OKPAlgorithm


def mint_refresh() -> str:
    """High-entropy, URL-safe opaque refresh token (returned to the client once)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hex of a token. Only the hash is stored at rest."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def sign_access(*, private_pem: str, kid: str, sub: str, aud: str, roles: list[str],
                issuer: str, ttl: int, now: int | None = None) -> str:
    iat = int(time.time()) if now is None else now
    claims = {
        "sub": sub, "aud": aud, "roles": roles, "iss": issuer,
        "iat": iat, "exp": iat + ttl, "jti": str(uuid.uuid4()),
    }
    return jwt.encode(claims, private_pem, algorithm="EdDSA", headers={"kid": kid})


def verify_access(token: str, *, public_jwk: dict, audience: str, issuer: str,
                  now: int | None = None) -> dict:
    key = OKPAlgorithm.from_jwk(json.dumps(public_jwk))
    options = {"require": ["exp", "iat", "sub", "aud", "iss"]}
    kwargs = dict(algorithms=["EdDSA"], audience=audience, issuer=issuer, options=options)
    if now is not None:                              # PyJWT verifies exp against this clock
        import jwt.api_jwt as _api
    return jwt.decode(token, key, **kwargs)
```

Note: PyJWT validates `exp`/`iat` against the real clock; the `now=` arg on `sign_access`
is only used to mint already-expired tokens in tests. `verify_access` does not need a clock
injection for these tests. Remove the unused `now`/import lines if your linter objects.

- [ ] **Step 4: Simplify `verify_access`** (drop the dead `now` branch flagged above)

```python
def verify_access(token: str, *, public_jwk: dict, audience: str, issuer: str) -> dict:
    key = OKPAlgorithm.from_jwk(json.dumps(public_jwk))
    return jwt.decode(token, key, algorithms=["EdDSA"], audience=audience, issuer=issuer,
                      options={"require": ["exp", "iat", "sub", "aud", "iss"]})
```

Also remove the unused `now` parameter from the test calls' expectations: keep `now=` only on
`sign_access`. Update `test_expired_rejected` already passes `now=past` to `sign_access` only.

- [ ] **Step 5: Run to verify it passes**

Run: `cd identity-service && python -m pytest tests/test_tokens.py -q`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/tokens.py identity-service/tests/test_tokens.py
git commit -m "feat(identity): EdDSA JWT sign/verify + opaque refresh mint/hash"
```

---

### Task 5: Refresh-token store — rotate, revoke, reuse-detection

**Files:**
- Create: `identity-service/src/identity_service/store/refresh.py`
- Create: `identity-service/tests/test_refresh_store.py`

**Interfaces:**
- Consumes: `tokens.hash_token`, `tokens.mint_refresh`, tables `refresh_tokens`.
- Produces:
  - `issue(conn, user_id, client_id, token_hash, family_id, expires_at) -> uuid` (row id).
  - `lookup(conn, token_hash) -> dict | None` (row: `id, user_id, client_id, family_id, expires_at, revoked_at, rotated_to`).
  - `rotate(conn, old_row, new_token_hash, new_expires_at) -> uuid` — marks old `rotated_to`+`revoked_at`, inserts new row in same family, returns new id.
  - `revoke_family(conn, family_id)`.
  - `is_reuse(row) -> bool` — true if the presented row is already rotated or revoked.

- [ ] **Step 1: Write the failing test** (`tests/test_refresh_store.py`)

```python
import uuid
from datetime import datetime, timedelta, timezone
import psycopg
from identity_service.store import refresh as rstore
from identity_service.store import keys as kstore   # noqa: F401 (ensures store package import)


def _seed_user_client(conn):
    uid, cid = uuid.uuid4(), uuid.uuid4()
    conn.execute("INSERT INTO clients (id, slug, name) VALUES (%s,'qa','QA')", (cid,))
    conn.execute("INSERT INTO users (id, email, password_hash) VALUES (%s,%s,'x')",
                 (uid, f"{uid}@e.com"))
    return uid, cid


def _exp():
    return datetime.now(timezone.utc) + timedelta(days=30)


def test_issue_and_lookup(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rid = rstore.issue(conn, uid, cid, "h1", fam, _exp())
    row = rstore.lookup(conn, "h1")
    assert row["id"] == rid and row["family_id"] == fam
    assert rstore.is_reuse(row) is False


def test_rotate_marks_old_and_chains(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rstore.issue(conn, uid, cid, "h1", fam, _exp())
    old = rstore.lookup(conn, "h1")
    new_id = rstore.rotate(conn, old, "h2", _exp())
    old_after = rstore.lookup(conn, "h1")
    assert old_after["rotated_to"] == new_id
    assert rstore.is_reuse(old_after) is True        # presenting h1 again is reuse
    assert rstore.is_reuse(rstore.lookup(conn, "h2")) is False


def test_revoke_family(conn):
    uid, cid = _seed_user_client(conn)
    fam = uuid.uuid4()
    rstore.issue(conn, uid, cid, "h1", fam, _exp())
    rstore.issue(conn, uid, cid, "h2", fam, _exp())
    rstore.revoke_family(conn, fam)
    assert rstore.is_reuse(rstore.lookup(conn, "h1")) is True
    assert rstore.is_reuse(rstore.lookup(conn, "h2")) is True
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_refresh_store.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.store.refresh`).

- [ ] **Step 3: Write `store/refresh.py`**

```python
import uuid
from datetime import datetime
import psycopg


def _row(conn, sql, args):
    cur = conn.execute(sql, args)
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    cols = [d.name for d in cur.description]
    return dict(zip(cols, r))


def issue(conn: psycopg.Connection, user_id, client_id, token_hash: str,
          family_id, expires_at: datetime) -> uuid.UUID:
    rid = uuid.uuid4()
    conn.execute(
        "INSERT INTO refresh_tokens (id, user_id, client_id, token_hash, family_id, expires_at) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        (rid, user_id, client_id, token_hash, family_id, expires_at),
    )
    return rid


def lookup(conn: psycopg.Connection, token_hash: str) -> dict | None:
    return _row(conn,
        "SELECT id, user_id, client_id, family_id, expires_at, revoked_at, rotated_to "
        "FROM refresh_tokens WHERE token_hash = %s", (token_hash,))


def rotate(conn: psycopg.Connection, old_row: dict, new_token_hash: str,
           new_expires_at: datetime) -> uuid.UUID:
    new_id = issue(conn, old_row["user_id"], old_row["client_id"], new_token_hash,
                   old_row["family_id"], new_expires_at)
    conn.execute(
        "UPDATE refresh_tokens SET rotated_to = %s, revoked_at = now() WHERE id = %s",
        (new_id, old_row["id"]),
    )
    return new_id


def revoke_family(conn: psycopg.Connection, family_id) -> None:
    conn.execute(
        "UPDATE refresh_tokens SET revoked_at = now() "
        "WHERE family_id = %s AND revoked_at IS NULL", (family_id,))


def is_reuse(row: dict) -> bool:
    """A presented token is reuse/invalid if it was already rotated or revoked."""
    return row["rotated_to"] is not None or row["revoked_at"] is not None
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_refresh_store.py -q`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add identity-service/src/identity_service/store/refresh.py identity-service/tests/test_refresh_store.py
git commit -m "feat(identity): refresh-token store with rotation + reuse-detection"
```

---

### Task 6: Users + clients + roles store

**Files:**
- Create: `identity-service/src/identity_service/roles.py`
- Create: `identity-service/src/identity_service/store/clients.py`
- Create: `identity-service/src/identity_service/store/users.py`
- Create: `identity-service/tests/test_users_store.py`

**Interfaces:**
- Produces: `roles.ROLES: frozenset[str]`, `roles.is_valid(role) -> bool`.
- Produces: `store.clients.create(conn, slug, name) -> uuid`, `store.clients.by_slug(conn, slug) -> dict|None`, `store.clients.list_all(conn) -> list[dict]`.
- Produces: `store.users.create(conn, email, password_hash, display_name="") -> uuid`,
  `store.users.by_email(conn, email) -> dict|None`, `store.users.by_id(conn, id) -> dict|None`,
  `store.users.grant_role(conn, user_id, client_id, role)`, `store.users.revoke_role(conn, user_id, client_id, role)`,
  `store.users.roles_for(conn, user_id, client_id) -> list[str]`, `store.users.list_all(conn, limit, offset) -> list[dict]`.

- [ ] **Step 1: Write the failing test** (`tests/test_users_store.py`)

```python
import pytest
import psycopg
from identity_service.roles import ROLES, is_valid
from identity_service.store import clients as cstore
from identity_service.store import users as ustore


def test_role_vocabulary():
    assert ROLES == {"researcher", "participant", "reviewer", "contributor", "administrator"}
    assert is_valid("researcher") and not is_valid("god")


def test_create_client_and_user(conn):
    cid = cstore.create(conn, "questionnaire-apps", "Questionnaire Apps")
    assert cstore.by_slug(conn, "questionnaire-apps")["id"] == cid
    uid = ustore.create(conn, "a@e.com", "hash", "Ada")
    u = ustore.by_email(conn, "a@e.com")
    assert u["id"] == uid and u["display_name"] == "Ada"
    assert ustore.by_email(conn, "A@E.COM")["id"] == uid     # citext case-insensitive


def test_duplicate_email_raises(conn):
    ustore.create(conn, "a@e.com", "h")
    with pytest.raises(psycopg.errors.UniqueViolation):
        ustore.create(conn, "a@e.com", "h2")


def test_grant_revoke_and_read_roles(conn):
    cid = cstore.create(conn, "qa", "QA")
    uid = ustore.create(conn, "a@e.com", "h")
    ustore.grant_role(conn, uid, cid, "researcher")
    ustore.grant_role(conn, uid, cid, "researcher")          # idempotent
    ustore.grant_role(conn, uid, cid, "administrator")
    assert sorted(ustore.roles_for(conn, uid, cid)) == ["administrator", "researcher"]
    ustore.revoke_role(conn, uid, cid, "researcher")
    assert ustore.roles_for(conn, uid, cid) == ["administrator"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_users_store.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.roles`).

- [ ] **Step 3: Write `roles.py`**

```python
ROLES = frozenset({"researcher", "participant", "reviewer", "contributor", "administrator"})


def is_valid(role: str) -> bool:
    return role in ROLES
```

- [ ] **Step 4: Write `store/clients.py`**

```python
import uuid
import psycopg


def _row(cur):
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


def create(conn: psycopg.Connection, slug: str, name: str = "") -> uuid.UUID:
    cid = uuid.uuid4()
    conn.execute("INSERT INTO clients (id, slug, name) VALUES (%s,%s,%s)", (cid, slug, name))
    return cid


def by_slug(conn: psycopg.Connection, slug: str) -> dict | None:
    return _row(conn.execute("SELECT id, slug, name FROM clients WHERE slug = %s", (slug,)))


def list_all(conn: psycopg.Connection) -> list[dict]:
    cur = conn.execute("SELECT id, slug, name FROM clients ORDER BY slug")
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]
```

- [ ] **Step 5: Write `store/users.py`**

```python
import uuid
import psycopg


def _one(cur):
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


_USER_COLS = "id, email, password_hash, display_name, status, email_verified"


def create(conn: psycopg.Connection, email: str, password_hash: str,
           display_name: str = "") -> uuid.UUID:
    uid = uuid.uuid4()
    conn.execute(
        "INSERT INTO users (id, email, password_hash, display_name) VALUES (%s,%s,%s,%s)",
        (uid, email, password_hash, display_name))
    return uid


def by_email(conn: psycopg.Connection, email: str) -> dict | None:
    return _one(conn.execute(f"SELECT {_USER_COLS} FROM users WHERE email = %s", (email,)))


def by_id(conn: psycopg.Connection, user_id) -> dict | None:
    return _one(conn.execute(f"SELECT {_USER_COLS} FROM users WHERE id = %s", (user_id,)))


def list_all(conn: psycopg.Connection, limit: int = 50, offset: int = 0) -> list[dict]:
    cur = conn.execute(
        f"SELECT {_USER_COLS} FROM users ORDER BY created_at DESC LIMIT %s OFFSET %s",
        (limit, offset))
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def set_email_verified(conn: psycopg.Connection, user_id) -> None:
    conn.execute("UPDATE users SET email_verified = true, updated_at = now() WHERE id = %s",
                 (user_id,))


def set_password(conn: psycopg.Connection, user_id, password_hash: str) -> None:
    conn.execute("UPDATE users SET password_hash = %s, updated_at = now() WHERE id = %s",
                 (password_hash, user_id))


def grant_role(conn: psycopg.Connection, user_id, client_id, role: str) -> None:
    conn.execute(
        "INSERT INTO user_roles (user_id, client_id, role) VALUES (%s,%s,%s) "
        "ON CONFLICT DO NOTHING", (user_id, client_id, role))


def revoke_role(conn: psycopg.Connection, user_id, client_id, role: str) -> None:
    conn.execute(
        "DELETE FROM user_roles WHERE user_id=%s AND client_id=%s AND role=%s",
        (user_id, client_id, role))


def roles_for(conn: psycopg.Connection, user_id, client_id) -> list[str]:
    cur = conn.execute(
        "SELECT role FROM user_roles WHERE user_id=%s AND client_id=%s", (user_id, client_id))
    return [r[0] for r in cur.fetchall()]
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_users_store.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add identity-service/src/identity_service/roles.py identity-service/src/identity_service/store/clients.py identity-service/src/identity_service/store/users.py identity-service/tests/test_users_store.py
git commit -m "feat(identity): users, clients, audience-scoped roles store"
```

---

### Task 7: Email-token store + Mailer stub

**Files:**
- Create: `identity-service/src/identity_service/mailer.py`
- Create: `identity-service/src/identity_service/store/email_tokens.py`
- Create: `identity-service/tests/test_email_tokens.py`

**Interfaces:**
- Produces: `mailer.Mailer` (Protocol with `send(to, subject, body)`), `mailer.NullMailer` (records sent messages in `.sent`).
- Produces: `store.email_tokens.issue(conn, user_id, kind, token_hash, expires_at) -> uuid`,
  `store.email_tokens.consume(conn, kind, token_hash) -> dict|None` (returns the row and marks `consumed_at` only if unconsumed + unexpired; else None).

- [ ] **Step 1: Write the failing test** (`tests/test_email_tokens.py`)

```python
import uuid
from datetime import datetime, timedelta, timezone
from identity_service.mailer import NullMailer
from identity_service.store import email_tokens as et
from identity_service.store import users as ustore


def _exp(seconds=3600):
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)


def test_null_mailer_records():
    m = NullMailer()
    m.send("a@e.com", "Verify", "click here")
    assert m.sent == [("a@e.com", "Verify", "click here")]


def test_consume_once(conn):
    uid = ustore.create(conn, "a@e.com", "h")
    et.issue(conn, uid, "verify", "h1", _exp())
    row = et.consume(conn, "verify", "h1")
    assert row["user_id"] == uid
    assert et.consume(conn, "verify", "h1") is None      # already consumed


def test_consume_wrong_kind_or_expired(conn):
    uid = ustore.create(conn, "a@e.com", "h")
    et.issue(conn, uid, "reset", "h2", _exp(seconds=-10))   # already expired
    assert et.consume(conn, "reset", "h2") is None
    et.issue(conn, uid, "verify", "h3", _exp())
    assert et.consume(conn, "reset", "h3") is None          # kind mismatch
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_email_tokens.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.mailer`).

- [ ] **Step 3: Write `mailer.py`**

```python
from typing import Protocol


class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class NullMailer:
    """Stub mailer — records messages instead of sending. Real SMTP is a later slice."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append((to, subject, body))
```

- [ ] **Step 4: Write `store/email_tokens.py`**

```python
import uuid
from datetime import datetime
import psycopg


def issue(conn: psycopg.Connection, user_id, kind: str, token_hash: str,
          expires_at: datetime) -> uuid.UUID:
    tid = uuid.uuid4()
    conn.execute(
        "INSERT INTO email_tokens (id, user_id, kind, token_hash, expires_at) "
        "VALUES (%s,%s,%s,%s,%s)", (tid, user_id, kind, token_hash, expires_at))
    return tid


def consume(conn: psycopg.Connection, kind: str, token_hash: str) -> dict | None:
    """Atomically mark consumed and return the row, only if valid (right kind, unconsumed,
    unexpired). Returns None otherwise."""
    cur = conn.execute(
        "UPDATE email_tokens SET consumed_at = now() "
        "WHERE token_hash = %s AND kind = %s AND consumed_at IS NULL AND expires_at > now() "
        "RETURNING id, user_id, kind", (token_hash, kind))
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_email_tokens.py -q`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add identity-service/src/identity_service/mailer.py identity-service/src/identity_service/store/email_tokens.py identity-service/tests/test_email_tokens.py
git commit -m "feat(identity): email-token store (verify/reset) + NullMailer stub"
```

---

### Task 8: Auth service orchestration + JWKS builder + pydantic models

**Files:**
- Create: `identity-service/src/identity_service/models.py`
- Create: `identity-service/src/identity_service/service/__init__.py` (empty)
- Create: `identity-service/src/identity_service/service/jwks.py`
- Create: `identity-service/src/identity_service/service/auth.py`
- Create: `identity-service/tests/test_auth_service.py`

**Interfaces:**
- Consumes: every store from Tasks 3,5,6,7; `tokens`, `passwords`, `keys`, `config.get_settings`.
- Produces: `service.jwks.public_jwks(conn) -> dict` → `{"keys": [<public_jwk>, ...]}`.
- Produces exceptions: `service.auth.AuthError(Exception)` with `.code` + `.status`; subclasses
  `InvalidCredentials` (401), `ReuseDetected` (401), `UnknownClient` (400), `EmailInUse` (409),
  `NoSigningKey` (500).
- Produces: `service.auth.register(conn, settings, mailer, *, email, password, display_name, audience) -> dict` (profile).
- Produces: `service.auth.login(conn, settings, *, email, password, audience) -> dict` (`{access_token, refresh_token, expires_in, token_type}`).
- Produces: `service.auth.refresh(conn, settings, *, refresh_token) -> dict` (same shape as login).
- Produces: `service.auth.logout(conn, *, refresh_token, all_sessions=False)`.
- Produces: `service.auth.profile(conn, *, user_id, audience) -> dict` (`{id, email, display_name, email_verified, roles}`).
- Produces: `service.auth.request_password_reset(conn, settings, mailer, *, email)`,
  `service.auth.reset_password(conn, *, token, new_password)`,
  `service.auth.verify_email(conn, *, token)`.

- [ ] **Step 1: Write the failing test** (`tests/test_auth_service.py`)

```python
import pytest
from identity_service.config import get_settings
from identity_service.mailer import NullMailer
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore
from identity_service.service import auth, jwks


def _bootstrap(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    cstore.create(conn, "questionnaire-apps", "QA")
    return get_settings()


def test_register_login_profile_refresh(conn):
    s = _bootstrap(conn); m = NullMailer()
    prof = auth.register(conn, s, m, email="a@e.com", password="pw1",
                         display_name="Ada", audience="questionnaire-apps")
    assert prof["email"] == "a@e.com" and prof["roles"] == ["researcher"]
    assert len(m.sent) == 1                            # verify email stub-sent

    toks = auth.login(conn, s, email="a@e.com", password="pw1", audience="questionnaire-apps")
    assert toks["token_type"] == "Bearer" and toks["expires_in"] == s.access_ttl
    claims = jwks_verify(conn, toks["access_token"], s)
    assert claims["roles"] == ["researcher"] and claims["aud"] == "questionnaire-apps"

    rot = auth.refresh(conn, s, refresh_token=toks["refresh_token"])
    assert rot["refresh_token"] != toks["refresh_token"]
    with pytest.raises(auth.ReuseDetected):            # old refresh now reuse
        auth.refresh(conn, s, refresh_token=toks["refresh_token"])


def test_bad_password_and_unknown_client(conn):
    s = _bootstrap(conn)
    auth.register(conn, s, NullMailer(), email="a@e.com", password="pw1",
                  display_name="", audience="questionnaire-apps")
    with pytest.raises(auth.InvalidCredentials):
        auth.login(conn, s, email="a@e.com", password="WRONG", audience="questionnaire-apps")
    with pytest.raises(auth.UnknownClient):
        auth.login(conn, s, email="a@e.com", password="pw1", audience="nope")


def test_email_in_use(conn):
    s = _bootstrap(conn)
    auth.register(conn, s, NullMailer(), email="a@e.com", password="pw1",
                  display_name="", audience="questionnaire-apps")
    with pytest.raises(auth.EmailInUse):
        auth.register(conn, s, NullMailer(), email="A@E.COM", password="pw2",
                      display_name="", audience="questionnaire-apps")


def test_public_jwks_lists_active_key(conn):
    _bootstrap(conn)
    doc = jwks.public_jwks(conn)
    assert len(doc["keys"]) == 1 and doc["keys"][0]["kty"] == "OKP"
    assert "private_pem" not in str(doc) and "d" not in doc["keys"][0]


# helper: verify an access token against the service's own JWKS
def jwks_verify(conn, token, s):
    from identity_service import tokens
    doc = jwks.public_jwks(conn)
    return tokens.verify_access(token, public_jwk=doc["keys"][0],
                                audience="questionnaire-apps", issuer=s.issuer)
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_auth_service.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.service`).

- [ ] **Step 3: Write `models.py`**

```python
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = ""
    audience: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    audience: str


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str
    all_sessions: bool = False


class VerifyEmailIn(BaseModel):
    token: str


class RequestResetIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class RoleIn(BaseModel):
    client: str
    role: str


class ClientIn(BaseModel):
    slug: str
    name: str = ""
```

Note: `EmailStr` requires the `email-validator` package — add `"pydantic[email]>=2.6"` to
`pyproject.toml` dependencies (replace the bare `pydantic>=2.6`) and re-run `pip install -e '.[dev]'`.

- [ ] **Step 4: Write `service/jwks.py`**

```python
from ..store import keys as kstore


def public_jwks(conn) -> dict:
    """The public JWKS document — active public keys only, never private material."""
    return {"keys": [k["public_jwk"] for k in kstore.active_keys(conn)]}
```

- [ ] **Step 5: Write `service/auth.py`**

```python
import uuid
from datetime import datetime, timedelta, timezone

import psycopg

from .. import tokens, passwords
from ..store import users as ustore, clients as cstore, refresh as rstore
from ..store import keys as kstore, email_tokens as etstore


class AuthError(Exception):
    code = "auth_error"; status = 400


class InvalidCredentials(AuthError):
    code = "invalid_credentials"; status = 401


class ReuseDetected(AuthError):
    code = "refresh_reuse"; status = 401


class UnknownClient(AuthError):
    code = "unknown_client"; status = 400


class EmailInUse(AuthError):
    code = "email_in_use"; status = 409


class NoSigningKey(AuthError):
    code = "no_signing_key"; status = 500


class InvalidToken(AuthError):
    code = "invalid_token"; status = 400


def _client_or_raise(conn, slug):
    c = cstore.by_slug(conn, slug)
    if c is None:
        raise UnknownClient(slug)
    return c


def _now():
    return datetime.now(timezone.utc)


def _issue_tokens(conn, settings, user, client) -> dict:
    key = kstore.signing_key(conn)
    if key is None:
        raise NoSigningKey()
    roles = ustore.roles_for(conn, user["id"], client["id"])
    access = tokens.sign_access(
        private_pem=key["private_pem"], kid=key["kid"], sub=str(user["id"]),
        aud=client["slug"], roles=roles, issuer=settings.issuer, ttl=settings.access_ttl)
    raw_refresh = tokens.mint_refresh()
    rstore.issue(conn, user["id"], client["id"], tokens.hash_token(raw_refresh),
                 uuid.uuid4(), _now() + timedelta(seconds=settings.refresh_ttl))
    return {"access_token": access, "refresh_token": raw_refresh,
            "expires_in": settings.access_ttl, "token_type": "Bearer"}


def register(conn, settings, mailer, *, email, password, display_name, audience) -> dict:
    client = _client_or_raise(conn, audience)
    if ustore.by_email(conn, email) is not None:
        raise EmailInUse(email)
    uid = ustore.create(conn, email, passwords.hash_password(password), display_name)
    ustore.grant_role(conn, uid, client["id"], settings.default_register_role)
    raw = tokens.mint_refresh()
    etstore.issue(conn, uid, "verify", tokens.hash_token(raw),
                  _now() + timedelta(seconds=settings.verify_token_ttl))
    mailer.send(email, "Verify your email", f"verify token: {raw}")
    return profile(conn, user_id=uid, audience=audience)


def login(conn, settings, *, email, password, audience) -> dict:
    client = _client_or_raise(conn, audience)
    user = ustore.by_email(conn, email)
    if user is None or user["status"] != "active" \
            or not passwords.verify_password(password, user["password_hash"]):
        raise InvalidCredentials()
    return _issue_tokens(conn, settings, user, client)


def refresh(conn, settings, *, refresh_token) -> dict:
    row = rstore.lookup(conn, tokens.hash_token(refresh_token))
    if row is None:
        raise InvalidToken()
    if rstore.is_reuse(row):
        rstore.revoke_family(conn, row["family_id"])    # theft mitigation
        raise ReuseDetected()
    if row["expires_at"] <= _now():
        raise InvalidToken()
    user = ustore.by_id(conn, row["user_id"])
    key = kstore.signing_key(conn)
    if key is None:
        raise NoSigningKey()
    client = next(c for c in cstore.list_all(conn) if c["id"] == row["client_id"])
    roles = ustore.roles_for(conn, user["id"], client["id"])
    access = tokens.sign_access(
        private_pem=key["private_pem"], kid=key["kid"], sub=str(user["id"]),
        aud=client["slug"], roles=roles, issuer=settings.issuer, ttl=settings.access_ttl)
    new_raw = tokens.mint_refresh()
    rstore.rotate(conn, row, tokens.hash_token(new_raw),
                  _now() + timedelta(seconds=settings.refresh_ttl))
    return {"access_token": access, "refresh_token": new_raw,
            "expires_in": settings.access_ttl, "token_type": "Bearer"}


def logout(conn, *, refresh_token, all_sessions=False) -> None:
    row = rstore.lookup(conn, tokens.hash_token(refresh_token))
    if row is None:
        return
    if all_sessions:
        rstore.revoke_family(conn, row["family_id"])
    else:
        conn.execute("UPDATE refresh_tokens SET revoked_at = now() "
                     "WHERE id = %s AND revoked_at IS NULL", (row["id"],))


def profile(conn, *, user_id, audience) -> dict:
    user = ustore.by_id(conn, user_id)
    client = _client_or_raise(conn, audience)
    return {"id": str(user["id"]), "email": user["email"],
            "display_name": user["display_name"], "email_verified": user["email_verified"],
            "roles": ustore.roles_for(conn, user["id"], client["id"])}


def verify_email(conn, *, token) -> None:
    row = etstore.consume(conn, "verify", tokens.hash_token(token))
    if row is None:
        raise InvalidToken()
    ustore.set_email_verified(conn, row["user_id"])


def request_password_reset(conn, settings, mailer, *, email) -> None:
    user = ustore.by_email(conn, email)
    if user is None:
        return                                          # no account enumeration
    raw = tokens.mint_refresh()
    etstore.issue(conn, user["id"], "reset", tokens.hash_token(raw),
                  _now() + timedelta(seconds=settings.reset_token_ttl))
    mailer.send(email, "Reset your password", f"reset token: {raw}")


def reset_password(conn, *, token, new_password) -> None:
    row = etstore.consume(conn, "reset", tokens.hash_token(token))
    if row is None:
        raise InvalidToken()
    ustore.set_password(conn, row["user_id"], passwords.hash_password(new_password))
    conn.execute("UPDATE refresh_tokens SET revoked_at = now() "
                 "WHERE user_id = %s AND revoked_at IS NULL", (row["user_id"],))
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_auth_service.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add identity-service/src/identity_service/models.py identity-service/src/identity_service/service/ identity-service/tests/test_auth_service.py identity-service/pyproject.toml
git commit -m "feat(identity): auth service (register/login/refresh/logout/reset) + JWKS builder"
```

---

### Task 9: Auth API routes + well-known JWKS + access-token dependency

**Files:**
- Create: `identity-service/src/identity_service/api/wellknown.py`
- Create: `identity-service/src/identity_service/api/auth.py`
- Modify: `identity-service/src/identity_service/api/deps.py` (add `require_access`)
- Modify: `identity-service/src/identity_service/api/app.py` (include routers)
- Create: `identity-service/tests/test_auth_api.py`

**Interfaces:**
- Consumes: `service.auth`, `service.jwks`, `config.get_settings`, `mailer.NullMailer`.
- Produces routes: `POST /v1/auth/{register,login,refresh,logout,verify-email,request-password-reset,reset-password}`, `GET /v1/auth/me`, `GET /.well-known/jwks.json`.
- Produces: `api.deps.require_access(audience_optional)` dependency returning verified claims dict (verifies the Bearer access JWT against the service's own active JWKS).

- [ ] **Step 1: Write the failing test** (`tests/test_auth_api.py`)

```python
import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore


def _bootstrap(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        c.commit()


def test_register_login_me_flow(client, pg_url):
    _bootstrap(pg_url)
    r = client.post("/v1/auth/register", json={
        "email": "a@e.com", "password": "password1", "display_name": "Ada",
        "audience": "questionnaire-apps"})
    assert r.status_code == 201, r.text
    assert r.json()["roles"] == ["researcher"]

    r = client.post("/v1/auth/login", json={
        "email": "a@e.com", "password": "password1", "audience": "questionnaire-apps"})
    assert r.status_code == 200
    access = r.json()["access_token"]

    r = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200 and r.json()["email"] == "a@e.com"

    r = client.get("/v1/auth/me")                       # no token
    assert r.status_code == 401


def test_jwks_endpoint(client, pg_url):
    _bootstrap(pg_url)
    r = client.get("/.well-known/jwks.json")
    assert r.status_code == 200
    assert r.json()["keys"][0]["kty"] == "OKP"


def test_bad_login_is_401(client, pg_url):
    _bootstrap(pg_url)
    client.post("/v1/auth/register", json={
        "email": "a@e.com", "password": "password1", "audience": "questionnaire-apps"})
    r = client.post("/v1/auth/login", json={
        "email": "a@e.com", "password": "nope", "audience": "questionnaire-apps"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_auth_api.py -q`
Expected: FAIL (404s / missing routers).

- [ ] **Step 3: Add `require_access` to `api/deps.py`** (append)

```python
from fastapi import Depends, Header, HTTPException
from .. import tokens
from ..service import jwks


def require_access(authorization: str | None = Header(default=None), conn=Depends(get_conn)):
    """Verify the Bearer access JWT against the service's own active JWKS. Returns claims."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    from ..config import get_settings
    s = get_settings()
    doc = jwks.public_jwks(conn)
    last_err = None
    for key in doc["keys"]:
        try:
            # audience is taken from the token itself here; per-route audience checks
            # belong to the consuming services (ID-B+). We accept any registered audience.
            import jwt as _jwt
            unverified = _jwt.decode(token, options={"verify_signature": False})
            return tokens.verify_access(token, public_jwk=key,
                                        audience=unverified.get("aud"), issuer=s.issuer)
        except Exception as e:                          # try next kid
            last_err = e
    raise HTTPException(status_code=401, detail="invalid access token")
```

- [ ] **Step 4: Write `api/wellknown.py`**

```python
from fastapi import APIRouter, Depends
from .deps import get_conn
from ..service import jwks

router = APIRouter()


@router.get("/.well-known/jwks.json")
def jwks_doc(conn=Depends(get_conn)):
    return jwks.public_jwks(conn)
```

- [ ] **Step 5: Write `api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn, require_access
from ..config import get_settings
from ..mailer import NullMailer
from ..service import auth
from ..models import (RegisterIn, LoginIn, RefreshIn, LogoutIn, VerifyEmailIn,
                      RequestResetIn, ResetPasswordIn)

router = APIRouter()
_mailer = NullMailer()                                 # stub; swapped for SMTP in a later slice


def _handle(fn):
    try:
        return fn()
    except auth.AuthError as e:
        raise HTTPException(status_code=e.status, detail=e.code)


@router.post("/v1/auth/register", status_code=201)
def register(body: RegisterIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.register(conn, s, _mailer, email=body.email, password=body.password,
                            display_name=body.display_name, audience=body.audience)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/login")
def login(body: LoginIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.login(conn, s, email=body.email, password=body.password,
                         audience=body.audience)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/refresh")
def refresh(body: RefreshIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.refresh(conn, s, refresh_token=body.refresh_token)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/logout", status_code=204)
def logout(body: LogoutIn, conn=Depends(get_conn)):
    auth.logout(conn, refresh_token=body.refresh_token, all_sessions=body.all_sessions)
    conn.commit()


@router.get("/v1/auth/me")
def me(claims=Depends(require_access), conn=Depends(get_conn)):
    return auth.profile(conn, user_id=claims["sub"], audience=claims["aud"])


@router.post("/v1/auth/verify-email", status_code=204)
def verify_email(body: VerifyEmailIn, conn=Depends(get_conn)):
    def go():
        auth.verify_email(conn, token=body.token); conn.commit()
    return _handle(go)


@router.post("/v1/auth/request-password-reset", status_code=202)
def request_reset(body: RequestResetIn, conn=Depends(get_conn)):
    auth.request_password_reset(conn, get_settings(), _mailer, email=body.email)
    conn.commit()
    return {"status": "accepted"}


@router.post("/v1/auth/reset-password", status_code=204)
def reset_password(body: ResetPasswordIn, conn=Depends(get_conn)):
    def go():
        auth.reset_password(conn, token=body.token, new_password=body.new_password)
        conn.commit()
    return _handle(go)
```

- [ ] **Step 6: Wire routers in `api/app.py`** — inside `create_app`, after the CORS block and before `@app.get("/healthz")`:

```python
    from . import auth as auth_routes, wellknown
    app.include_router(auth_routes.router)
    app.include_router(wellknown.router)
```

- [ ] **Step 7: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_auth_api.py -q`
Expected: 3 passed.

- [ ] **Step 8: Commit**

```bash
git add identity-service/src/identity_service/api/ identity-service/tests/test_auth_api.py
git commit -m "feat(identity): auth API routes + well-known JWKS + access-token dependency"
```

---

### Task 10: Admin API — user listing + role grant/revoke + client registration

**Files:**
- Create: `identity-service/src/identity_service/api/admin.py`
- Modify: `identity-service/src/identity_service/api/app.py` (include admin router)
- Create: `identity-service/tests/test_admin_api.py`

**Interfaces:**
- Consumes: `api.deps.require_access`, `roles.is_valid`, `store.users`, `store.clients`.
- Produces: `api.deps.require_admin(claims)` dependency (claims must carry `administrator`).
- Produces routes: `GET /v1/admin/users`, `GET /v1/admin/users/{id}`,
  `POST /v1/admin/users/{id}/roles`, `DELETE /v1/admin/users/{id}/roles`,
  `GET /v1/admin/clients`, `POST /v1/admin/clients`.

- [ ] **Step 1: Write the failing test** (`tests/test_admin_api.py`)

```python
import psycopg
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore, users as ustore
from identity_service import passwords


def _bootstrap_admin(pg_url):
    """Seed a key, the client, and an administrator user; return admin login creds."""
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cid = cstore.create(c, "questionnaire-apps", "QA")
        uid = ustore.create(c, "admin@e.com", passwords.hash_password("password1"))
        ustore.grant_role(c, uid, cid, "administrator")
        c.commit()


def _admin_token(client):
    r = client.post("/v1/auth/login", json={
        "email": "admin@e.com", "password": "password1", "audience": "questionnaire-apps"})
    return r.json()["access_token"]


def test_admin_grants_role(client, pg_url):
    _bootstrap_admin(pg_url)
    tok = _admin_token(client)
    H = {"Authorization": f"Bearer {tok}"}
    # register a plain researcher
    client.post("/v1/auth/register", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"})
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    target = next(u for u in users if u["email"] == "r@e.com")

    r = client.post(f"/v1/admin/users/{target['id']}/roles", headers=H,
                    json={"client": "questionnaire-apps", "role": "reviewer"})
    assert r.status_code == 204
    detail = client.get(f"/v1/admin/users/{target['id']}", headers=H).json()
    assert "reviewer" in detail["roles"]["questionnaire-apps"]


def test_non_admin_forbidden(client, pg_url):
    _bootstrap_admin(pg_url)
    client.post("/v1/auth/register", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"})
    tok = client.post("/v1/auth/login", json={
        "email": "r@e.com", "password": "password1", "audience": "questionnaire-apps"}
    ).json()["access_token"]
    r = client.get("/v1/admin/users", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 403


def test_create_client(client, pg_url):
    _bootstrap_admin(pg_url)
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    r = client.post("/v1/admin/clients", headers=H, json={"slug": "platform", "name": "Platform"})
    assert r.status_code == 201
    slugs = [c["slug"] for c in client.get("/v1/admin/clients", headers=H).json()["clients"]]
    assert "platform" in slugs


def test_invalid_role_rejected(client, pg_url):
    _bootstrap_admin(pg_url)
    H = {"Authorization": f"Bearer {_admin_token(client)}"}
    users = client.get("/v1/admin/users", headers=H).json()["users"]
    uid = users[0]["id"]
    r = client.post(f"/v1/admin/users/{uid}/roles", headers=H,
                    json={"client": "questionnaire-apps", "role": "wizard"})
    assert r.status_code == 422
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_admin_api.py -q`
Expected: FAIL (404s / missing admin router).

- [ ] **Step 3: Add `require_admin` to `api/deps.py`** (append)

```python
def require_admin(claims=Depends(require_access)):
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims
```

- [ ] **Step 4: Write `api/admin.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn, require_admin
from ..models import RoleIn, ClientIn
from ..roles import is_valid
from ..store import users as ustore, clients as cstore

router = APIRouter()


@router.get("/v1/admin/users")
def list_users(limit: int = 50, offset: int = 0, _=Depends(require_admin),
               conn=Depends(get_conn)):
    rows = ustore.list_all(conn, limit=limit, offset=offset)
    return {"users": [{"id": str(u["id"]), "email": u["email"],
                       "display_name": u["display_name"], "status": u["status"],
                       "email_verified": u["email_verified"]} for u in rows]}


@router.get("/v1/admin/users/{user_id}")
def get_user(user_id: str, _=Depends(require_admin), conn=Depends(get_conn)):
    u = ustore.by_id(conn, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user not found")
    roles: dict[str, list[str]] = {}
    for c in cstore.list_all(conn):
        rs = ustore.roles_for(conn, u["id"], c["id"])
        if rs:
            roles[c["slug"]] = rs
    return {"id": str(u["id"]), "email": u["email"], "display_name": u["display_name"],
            "status": u["status"], "email_verified": u["email_verified"], "roles": roles}


@router.post("/v1/admin/users/{user_id}/roles", status_code=204)
def grant_role(user_id: str, body: RoleIn, _=Depends(require_admin), conn=Depends(get_conn)):
    if not is_valid(body.role):
        raise HTTPException(status_code=422, detail="unknown role")
    client = cstore.by_slug(conn, body.client)
    if client is None:
        raise HTTPException(status_code=404, detail="unknown client")
    if ustore.by_id(conn, user_id) is None:
        raise HTTPException(status_code=404, detail="user not found")
    ustore.grant_role(conn, user_id, client["id"], body.role)
    conn.commit()


@router.delete("/v1/admin/users/{user_id}/roles", status_code=204)
def revoke_role(user_id: str, body: RoleIn, _=Depends(require_admin), conn=Depends(get_conn)):
    client = cstore.by_slug(conn, body.client)
    if client is None:
        raise HTTPException(status_code=404, detail="unknown client")
    ustore.revoke_role(conn, user_id, client["id"], body.role)
    conn.commit()


@router.get("/v1/admin/clients")
def list_clients(_=Depends(require_admin), conn=Depends(get_conn)):
    return {"clients": [{"id": str(c["id"]), "slug": c["slug"], "name": c["name"]}
                        for c in cstore.list_all(conn)]}


@router.post("/v1/admin/clients", status_code=201)
def create_client(body: ClientIn, _=Depends(require_admin), conn=Depends(get_conn)):
    if cstore.by_slug(conn, body.slug) is not None:
        raise HTTPException(status_code=409, detail="client slug already exists")
    cid = cstore.create(conn, body.slug, body.name)
    conn.commit()
    return {"id": str(cid), "slug": body.slug, "name": body.name}
```

- [ ] **Step 5: Wire the admin router in `api/app.py`** — extend the router-include block from Task 9:

```python
    from . import admin as admin_routes
    app.include_router(admin_routes.router)
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_admin_api.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add identity-service/src/identity_service/api/admin.py identity-service/src/identity_service/api/deps.py identity-service/src/identity_service/api/app.py identity-service/tests/test_admin_api.py
git commit -m "feat(identity): admin API — users, role grant/revoke, client registration"
```

---

### Task 11: Reusable verifier — `identity_client`

**Files:**
- Create: `identity-service/src/identity_service/identity_client.py`
- Create: `identity-service/tests/test_identity_client.py`

**Interfaces:**
- Produces: `identity_client.JwksCache(jwks_url, *, ttl=300, fetcher=None)` with `.key_for(kid) -> dict` (refetches on unknown kid).
- Produces: `identity_client.verify(token, *, jwks, audience, issuer) -> dict` (selects the key by the token's `kid`, verifies; raises on failure).
- Produces: `identity_client.require_roles(*roles)` — a FastAPI dependency factory (returns a callable; later slices import it). For ID-A it is unit-tested directly, not mounted.

- [ ] **Step 1: Write the failing test** (`tests/test_identity_client.py`)

```python
import json
import pytest
import jwt
from identity_service.keys import generate_keypair
from identity_service import tokens, identity_client


def test_jwks_cache_selects_by_kid_and_refetches():
    kid, jwk, pem = generate_keypair()
    calls = {"n": 0}
    def fetcher():
        calls["n"] += 1
        return {"keys": [jwk]}
    cache = identity_client.JwksCache("http://id/jwks", fetcher=fetcher)
    assert cache.key_for(kid)["kid"] == kid
    assert calls["n"] == 1
    cache.key_for(kid)                       # cached, no refetch
    assert calls["n"] == 1
    with pytest.raises(KeyError):
        cache.key_for("unknown-kid")         # refetches once trying to find it
    assert calls["n"] == 2


def test_verify_happy_path_and_failures():
    kid, jwk, pem = generate_keypair()
    cache = identity_client.JwksCache("http://id/jwks", fetcher=lambda: {"keys": [jwk]})
    tok = tokens.sign_access(private_pem=pem, kid=kid, sub="u1", aud="questionnaire-apps",
                             roles=["reviewer"], issuer="http://id", ttl=900)
    claims = identity_client.verify(tok, jwks=cache, audience="questionnaire-apps",
                                    issuer="http://id")
    assert claims["roles"] == ["reviewer"]
    with pytest.raises(jwt.InvalidAudienceError):
        identity_client.verify(tok, jwks=cache, audience="other", issuer="http://id")


def test_require_roles_allows_and_denies():
    dep_ok = identity_client.require_roles("reviewer")
    assert dep_ok({"roles": ["reviewer", "researcher"]}) == {"roles": ["reviewer", "researcher"]}
    dep_bad = identity_client.require_roles("administrator")
    with pytest.raises(Exception):           # HTTPException(403)
        dep_bad({"roles": ["researcher"]})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && python -m pytest tests/test_identity_client.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.identity_client`).

- [ ] **Step 3: Write `identity_client.py`**

```python
"""Standalone token verifier for consuming services (ID-B+ import this).

Depends only on PyJWT + httpx — never on the identity_service stores/DB.
"""
import json
import time

import httpx
import jwt
from jwt.algorithms import OKPAlgorithm


class JwksCache:
    def __init__(self, jwks_url: str, *, ttl: int = 300, fetcher=None):
        self._url = jwks_url
        self._ttl = ttl
        self._fetcher = fetcher or self._http_fetch
        self._keys: dict[str, dict] = {}
        self._fetched_at = 0.0

    def _http_fetch(self) -> dict:
        return httpx.get(self._url, timeout=5.0).json()

    def _refresh(self) -> None:
        doc = self._fetcher()
        self._keys = {k["kid"]: k for k in doc.get("keys", [])}
        self._fetched_at = time.monotonic()

    def key_for(self, kid: str) -> dict:
        stale = (time.monotonic() - self._fetched_at) > self._ttl
        if not self._keys or stale:
            self._refresh()
        if kid not in self._keys:
            self._refresh()                    # unknown kid → one forced refetch (rotation)
        return self._keys[kid]                  # raises KeyError if still absent


def verify(token: str, *, jwks: JwksCache, audience: str, issuer: str) -> dict:
    kid = jwt.get_unverified_header(token).get("kid")
    jwk = jwks.key_for(kid)
    key = OKPAlgorithm.from_jwk(json.dumps(jwk))
    return jwt.decode(token, key, algorithms=["EdDSA"], audience=audience, issuer=issuer,
                      options={"require": ["exp", "iat", "sub", "aud", "iss"]})


def require_roles(*required: str):
    """FastAPI dependency factory: pass through claims iff they carry every required role."""
    def _dep(claims: dict) -> dict:
        have = set(claims.get("roles", []))
        if not set(required) <= have:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="missing required role")
        return claims
    return _dep
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd identity-service && python -m pytest tests/test_identity_client.py -q`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add identity-service/src/identity_service/identity_client.py identity-service/tests/test_identity_client.py
git commit -m "feat(identity): reusable identity_client verifier (JWKS cache + verify + require_roles)"
```

---

### Task 12: CLI + README + full-suite gate

**Files:**
- Create: `identity-service/src/identity_service/cli.py`
- Create: `identity-service/README.md`
- Create: `identity-service/tests/test_cli.py`

**Interfaces:**
- Consumes: `store.migrate`, `store.keys`, `store.clients`, `store.users`, `keys.generate_keypair`, `passwords`.
- Produces: `cli.main(argv) -> int` with subcommands `migrate`, `generate-key [--retire-others]`,
  `create-admin --email --password [--audience]`, `create-client --slug [--name]`.

- [ ] **Step 1: Write the failing test** (`tests/test_cli.py`)

```python
import psycopg
from identity_service.cli import main
from identity_service.store import clients as cstore, users as ustore, keys as kstore


def test_migrate_generate_key_create_client_and_admin(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    assert main(["migrate"]) == 0
    with psycopg.connect(pg_url) as c:                  # migrate seeds the qa client
        assert cstore.by_slug(c, "questionnaire-apps") is not None

    assert main(["generate-key"]) == 0
    with psycopg.connect(pg_url) as c:
        assert kstore.signing_key(c) is not None

    assert main(["create-client", "--slug", "platform", "--name", "Platform"]) == 0
    assert main(["create-admin", "--email", "admin@e.com", "--password", "password1"]) == 0
    with psycopg.connect(pg_url) as c:
        u = ustore.by_email(c, "admin@e.com")
        cid = cstore.by_slug(c, "questionnaire-apps")["id"]
        assert "administrator" in ustore.roles_for(c, u["id"], cid)


def test_usage_returns_2(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    assert main([]) == 2
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_cli.py -q`
Expected: FAIL (`ModuleNotFoundError: identity_service.cli`).

- [ ] **Step 3: Write `cli.py`**

```python
import sys
import psycopg

from .config import get_settings
from .store.migrate import apply_schema
from .store import clients as cstore, users as ustore, keys as kstore
from .keys import generate_keypair
from . import passwords

_USAGE = ("usage: identity {migrate | generate-key [--retire-others] | "
          "create-client --slug S [--name N] | "
          "create-admin --email E --password P [--audience A]}")


def _opt(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print(_USAGE)
        return 2
    cmd, url = argv[0], get_settings().database_url

    if cmd == "migrate":
        with psycopg.connect(url) as conn:
            apply_schema(conn)
            if cstore.by_slug(conn, "questionnaire-apps") is None:
                cstore.create(conn, "questionnaire-apps", "Questionnaire Apps")
            conn.commit()
        print("schema applied")
        return 0

    if cmd == "generate-key":
        kid, jwk, pem = generate_keypair()
        with psycopg.connect(url) as conn:
            kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
            if "--retire-others" in argv:
                kstore.retire_others(conn, keep_kid=kid)
            conn.commit()
        print(f"signing key {kid} created")
        return 0

    if cmd == "create-client":
        slug = _opt(argv, "--slug")
        if not slug:
            print(_USAGE); return 2
        with psycopg.connect(url) as conn:
            if cstore.by_slug(conn, slug) is None:
                cstore.create(conn, slug, _opt(argv, "--name", ""))
                conn.commit()
        print(f"client {slug} ready")
        return 0

    if cmd == "create-admin":
        email, pw = _opt(argv, "--email"), _opt(argv, "--password")
        audience = _opt(argv, "--audience", "questionnaire-apps")
        if not email or not pw:
            print(_USAGE); return 2
        with psycopg.connect(url) as conn:
            client = cstore.by_slug(conn, audience)
            if client is None:
                print(f"unknown client: {audience}"); return 1
            user = ustore.by_email(conn, email)
            uid = user["id"] if user else ustore.create(conn, email,
                                                         passwords.hash_password(pw))
            ustore.grant_role(conn, uid, client["id"], "administrator")
            conn.commit()
        print(f"admin {email} ready in {audience}")
        return 0

    print(_USAGE)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_cli.py -q`
Expected: 2 passed.

- [ ] **Step 5: Write `README.md`**

````markdown
# identity-service — ID-A core auth

Standalone Identity/Auth service (OD-08 keystone). Issues EdDSA-JWT access tokens
(verified via JWKS) + opaque rotating refresh tokens; email+password accounts; 5-role
audience-scoped RBAC. API-only (no UI). See `docs/superpowers/specs/2026-06-21-identity-id-a-design.md`.

## Quickstart

```bash
pip install -e '.[dev]'
export DATABASE_URL=postgresql://localhost/identity_service
export IDENTITY_ISSUER=http://localhost:8100
identity migrate            # creates tables + seeds the questionnaire-apps client
identity generate-key       # mints the first Ed25519 signing key
identity create-admin --email you@example.com --password 'change-me'
uvicorn identity_service.api.app:create_app --factory --reload --port 8100
```

## Endpoints

- `POST /v1/auth/register | login | refresh | logout`
- `GET  /v1/auth/me` (Bearer access token)
- `POST /v1/auth/verify-email | request-password-reset | reset-password`
- `GET  /v1/admin/users`, `GET /v1/admin/users/{id}`,
  `POST|DELETE /v1/admin/users/{id}/roles`, `GET|POST /v1/admin/clients` (administrator only)
- `GET  /.well-known/jwks.json`

## Tests

```bash
DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q   # run in its own invocation
```

## Consuming tokens (ID-B+)

```python
from identity_service.identity_client import JwksCache, verify, require_roles
jwks = JwksCache("http://localhost:8100/.well-known/jwks.json")
claims = verify(token, jwks=jwks, audience="questionnaire-apps", issuer="http://localhost:8100")
```

## Out of scope for ID-A
Real email sending (NullMailer stub only), social/ORCID/GitHub federation, hosted login UI,
full OAuth2/OIDC, MFA, JS/TS verifier, and wiring existing consumers — all later slices.
````

- [ ] **Step 6: Run the full suite (the deliverable gate)**

Run: `cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q`
Expected: all tests pass (foundation 2, passwords 4, keys 3, tokens 5, refresh 3, users 4, email 3, auth-service 4, auth-api 3, admin-api 4, identity_client 3, cli 2).

- [ ] **Step 7: Verify the CLI end-to-end against a throwaway container** (manual smoke; optional but recommended)

Run:
```bash
cd identity-service && DOCKER_CONFIG=/tmp/lib_docker python - <<'PY'
from testcontainers.postgres import PostgresContainer
import os, subprocess, sys
with PostgresContainer("postgres:16") as pg:
    env = {**os.environ, "DATABASE_URL": pg.get_connection_url(driver=None),
           "IDENTITY_ISSUER": "http://localhost:8100"}
    for args in (["migrate"], ["generate-key"],
                 ["create-admin","--email","a@e.com","--password","password1"]):
        subprocess.run([sys.executable,"-m","identity_service.cli",*args], env=env, check=True)
print("CLI smoke OK")
PY
```
Expected: prints each step + `CLI smoke OK`.

- [ ] **Step 8: Commit**

```bash
git add identity-service/src/identity_service/cli.py identity-service/README.md identity-service/tests/test_cli.py
git commit -m "feat(identity): CLI (migrate/generate-key/create-admin/create-client) + README; ID-A complete"
```

---

## Self-Review

**1. Spec coverage:**
- §1 boundary (standalone, API-only, audience-aware, no consumer changes) → Tasks 1–12; no consumer wiring anywhere. ✓
- §2 token model (EdDSA JWT + claims; opaque rotating refresh; JWKS multi-key) → Tasks 3,4,5,9,11. ✓
- §3 data model (6 tables, role CHECK, citext email, family/rotated_to) → Task 1 schema; exercised in 5,6,7. ✓
- §4 API surface (auth + admin + jwks; error shape; 401/403/422) → Tasks 9,10. Every listed endpoint present. ✓
- §5 reusable verifier (`JwksCache`, `verify`, `require_roles`) → Task 11. ✓
- §6 config/CLI/conventions (dataclass settings, `identity` subcommands, app-factory, deps) → Tasks 1,12; deps `pyjwt[crypto]`+`argon2-cffi`+`pydantic[email]`. ✓
- §7 testing & gate (unit: sign/verify/tamper/expiry/aud, argon2, rotation+reuse, RBAC, email-token once; integration: full flow, admin grant reflected in next token, JWKS round-trip, key rotation) → covered across Tasks 2–12. Key-rotation-verify is covered by `JwksCache` refetch test (Task 11) + multi-key JWKS (active_keys). ✓
- §8 out-of-scope (no SMTP, federation, UI, OIDC, MFA, JS verifier, consumer wiring) → honored; NullMailer only. ✓

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to" — every step has concrete code. Task 4 Steps 3→4 deliberately show a refine-after-first-write (documented), not a placeholder.

**3. Type consistency:** `hash_token`/`mint_refresh`/`sign_access`/`verify_access` (tokens) consistent across Tasks 4,8,11. `store.refresh` `issue/lookup/rotate/revoke_family/is_reuse` consistent Tasks 5,8. `store.users` `roles_for/grant_role/by_id/by_email` consistent Tasks 6,8,10,12. `service.auth` exception classes (`InvalidCredentials/ReuseDetected/UnknownClient/EmailInUse`) consistent Tasks 8,9. `public_jwks` consistent Tasks 8,9,11. `JwksCache.key_for`/`verify`/`require_roles` consistent Task 11. ✓

One known cross-task dependency to watch during execution: Task 9 Step 3 (`require_access`) does an unverified decode to read `aud`, then verifies with that audience — acceptable for ID-A (Identity trusts its own minted tokens); consuming services in ID-B+ MUST pass their own fixed `audience` to `identity_client.verify` rather than trust the token's `aud`. This is noted in the README and the `require_access` comment.
