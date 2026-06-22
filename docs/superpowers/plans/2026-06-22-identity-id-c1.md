# ID-C1 — Library community signals (comments + ratings) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Identity-gated threaded comments + 1–5 ratings (with GDPR self-erasure) to the Library, stored in the Library's own Postgres, plus the reusable Identity consumer that the Library lacked.

**Architecture:** `library/` imports ID-A's `identity_service.identity_client` verifier (mirroring viewer-service's ID-B pattern) for a new `library/api/identity.py` (`require_user`/`require_admin`/`optional_user`, audience `questionnaire-apps`). Two new tables (`comment`, `rating`) and a `store/community.py` back a `library/api/community.py` router. Existing read endpoints stay public and unchanged; only the new community write endpoints are gated.

**Tech Stack:** Python ≥3.12, FastAPI, raw psycopg3, PyJWT[crypto] (EdDSA), testcontainers Postgres, pytest. Reuses `identity_service` (editable-installed in the venv).

## Global Constraints

- Audience is the fixed string `questionnaire-apps`; issuer + JWKS URL from config (env `IDENTITY_JWKS_URL`/`IDENTITY_ISSUER`/`IDENTITY_AUDIENCE`, audience default `questionnaire-apps`). Verify via `identity_service.identity_client.verify(token, *, jwks, audience, issuer)`.
- `require_user` = any successfully-verified token (any role). `require_admin` = claims carry `administrator`. `optional_user` = claims if a valid token is present, else `None` (never 401).
- Auth failures: `401` missing/malformed header or any verify failure; `403` wrong actor/role; `404` unknown questionnaire/comment; `422` empty body / score ∉ 1..5 / illegal `parent_id`.
- `author_sub` and `author_name` come ONLY from verified claims (`sub`; name from `name`/`display_name` claim if present else `sub`) — never from the request body.
- Ratings: one row per `(questionnaire_id, author_sub)`, `score` int 1–5, re-rating upserts. Comments: single-level threading (a `parent_id` may only point at a top-level comment). Comment deletion is SOFT (tombstone: null `body`/`author_sub`/`author_name`, set `deleted_at`). Ratings hard-delete.
- Target is the questionnaire id (`qid`), which must resolve to a `catalogue_entry` row (any version/status) else 404.
- Reuse the Library's `{"error":{"code","message"}}` envelope; extend `_CODE_FOR` with `401:"unauthorized"`, `403:"forbidden"`. Broaden CORS `allow_methods` to include POST/PUT/DELETE.
- Raw psycopg3, no ORM; tables added to `store/schema.sql` idempotently (`CREATE TABLE IF NOT EXISTS`). Run the `library/` suite in its own pytest invocation with `DOCKER_CONFIG=/tmp/lib_docker`. venv is uv-managed — use `.venv/bin/python -m pytest`/`-m pip`.
- No changes to `identity-service/` (frozen). TDD; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-22-identity-id-c1-design.md`.

---

### Task 1: Config + Identity consumer (`require_user`/`require_admin`/`optional_user`)

**Files:**
- Modify: `library/pyproject.toml` (add `pyjwt[crypto]>=2.8`)
- Modify: `library/src/library/config.py` (identity settings)
- Create: `library/src/library/api/identity.py`
- Create: `library/tests/test_identity_dep.py`

**Interfaces:**
- Consumes: `identity_service.identity_client` (`JwksCache`, `verify`); tests use `identity_service.keys.generate_keypair` + `identity_service.tokens.sign_access`.
- Produces: `Settings.identity_jwks_url`/`identity_issuer`/`identity_audience`; `api.identity.install_test_cache(public_jwk)`, `require_user(authorization)->dict`, `require_admin(authorization)->dict`, `optional_user(authorization)->dict|None`.

- [ ] **Step 1: Add `pyjwt[crypto]>=2.8`** to `library/pyproject.toml` `dependencies`. Reinstall from repo root:
  `.venv/bin/python -m pip install -e 'library[dev]'` and `.venv/bin/python -m pip install -e 'identity-service[dev]'`.

- [ ] **Step 2: Add identity settings to `config.py`** — add three fields to the `Settings` dataclass (after `cors_origins`):

```python
    identity_jwks_url: str = "http://localhost:8100/.well-known/jwks.json"
    identity_issuer: str = "http://localhost:8100"
    identity_audience: str = "questionnaire-apps"
```

And in `get_settings()` add to the `Settings(...)` call:

```python
        identity_jwks_url=os.environ.get("IDENTITY_JWKS_URL", "http://localhost:8100/.well-known/jwks.json"),
        identity_issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        identity_audience=os.environ.get("IDENTITY_AUDIENCE", "questionnaire-apps"),
```

- [ ] **Step 3: Write the failing test** (`library/tests/test_identity_dep.py`)

```python
import time
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from library.api import identity as idmod


@pytest.fixture
def key(monkeypatch):
    kid, jwk, pem = generate_keypair()
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    return kid, pem


def _token(kid, pem, roles, *, sub="u-1", aud="questionnaire-apps", iss="http://id-test", ttl=900, now=None):
    return sign_access(private_pem=pem, kid=kid, sub=sub, aud=aud, roles=roles,
                       issuer=iss, ttl=ttl, now=now)


def _app():
    app = FastAPI()

    @app.get("/u")
    def u(claims=Depends(idmod.require_user)):
        return {"sub": claims["sub"]}

    @app.get("/a")
    def a(claims=Depends(idmod.require_admin)):
        return {"sub": claims["sub"]}

    @app.get("/o")
    def o(claims=Depends(idmod.optional_user)):
        return {"sub": claims["sub"] if claims else None}

    return TestClient(app)


def test_require_user(key):
    kid, pem = key
    c = _app()
    assert c.get("/u").status_code == 401
    assert c.get("/u", headers={"Authorization": "Bearer junk"}).status_code == 401
    tok = _token(kid, pem, ["participant"])
    r = c.get("/u", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["sub"] == "u-1"


def test_require_admin(key):
    kid, pem = key
    c = _app()
    tok = _token(kid, pem, ["researcher"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 403
    tok = _token(kid, pem, ["administrator"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_optional_user(key):
    kid, pem = key
    c = _app()
    assert c.get("/o").json()["sub"] is None                      # no token → None, not 401
    assert c.get("/o", headers={"Authorization": "Bearer junk"}).json()["sub"] is None
    tok = _token(kid, pem, ["participant"], sub="abc")
    assert c.get("/o", headers={"Authorization": f"Bearer {tok}"}).json()["sub"] == "abc"


def test_rejects_wrong_aud_and_expired(key):
    kid, pem = key
    c = _app()
    bad = _token(kid, pem, ["participant"], aud="nope")
    assert c.get("/u", headers={"Authorization": f"Bearer {bad}"}).status_code == 401
    exp = _token(kid, pem, ["participant"], ttl=1, now=int(time.time()) - 10)
    assert c.get("/u", headers={"Authorization": f"Bearer {exp}"}).status_code == 401
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest library/tests/test_identity_dep.py -q`
Expected: FAIL (`ImportError`/`AttributeError` — `library.api.identity` does not exist).

- [ ] **Step 5: Write `library/src/library/api/identity.py`**

```python
from fastapi import Header, HTTPException
from identity_service.identity_client import JwksCache, verify
from ..config import get_settings

_cache: JwksCache | None = None


def install_test_cache(public_jwk: dict) -> None:
    """Test seam: install a fake-fetcher JwksCache exposing one public JWK."""
    global _cache
    _cache = JwksCache("test://jwks", fetcher=lambda: {"keys": [public_jwk]})


def _get_cache() -> JwksCache:
    global _cache
    if _cache is None:
        _cache = JwksCache(get_settings().identity_jwks_url)
    return _cache


def _verify(token: str) -> dict:
    s = get_settings()
    return verify(token, jwks=_get_cache(), audience=s.identity_audience, issuer=s.identity_issuer)


def _bearer(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[len("Bearer "):]


def require_user(authorization: str | None = Header(default=None)) -> dict:
    token = _bearer(authorization)
    if token is None:
        raise HTTPException(status_code=401, detail="missing bearer token")
    try:
        return _verify(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid access token")


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    claims = require_user(authorization)
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    """Return claims if a valid token is present, else None (never raises)."""
    token = _bearer(authorization)
    if token is None:
        return None
    try:
        return _verify(token)
    except Exception:
        return None
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest library/tests/test_identity_dep.py -q`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add library/pyproject.toml library/src/library/config.py library/src/library/api/identity.py library/tests/test_identity_dep.py
git commit -m "feat(library): identity consumer (require_user/require_admin/optional_user) + config"
```

---

### Task 2: Schema (comment + rating tables) + conftest fixtures + `questionnaire_exists`

**Files:**
- Modify: `library/src/library/store/schema.sql` (two tables)
- Create: `library/src/library/store/community.py` (with `questionnaire_exists` only — comment/rating fns land in Tasks 3–5)
- Modify: `library/tests/conftest.py` (identity fixtures + truncate list)
- Create: `library/tests/test_community_schema.py`

**Interfaces:**
- Consumes: `api.identity.install_test_cache`, `identity_service.keys.generate_keypair`, `identity_service.tokens.sign_access`.
- Produces: `comment`/`rating` tables; `store.community.questionnaire_exists(conn, qid) -> bool`; pytest fixtures `id_key`, `auth_header(roles, *, sub=...)`, `client` (plain TestClient with the fake JWKS installed + identity env set).

- [ ] **Step 1: Add the tables to `store/schema.sql`** (append at the end; idempotent, matching the file's style)

```sql
CREATE TABLE IF NOT EXISTS comment (
  id               uuid PRIMARY KEY,
  questionnaire_id text NOT NULL,
  parent_id        uuid REFERENCES comment(id) ON DELETE CASCADE,
  author_sub       text,
  author_name      text,
  body             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);
CREATE INDEX IF NOT EXISTS comment_qid_idx ON comment (questionnaire_id, created_at);
CREATE INDEX IF NOT EXISTS comment_author_idx ON comment (author_sub);

CREATE TABLE IF NOT EXISTS rating (
  questionnaire_id text NOT NULL,
  author_sub       text NOT NULL,
  score            int  NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (questionnaire_id, author_sub),
  CONSTRAINT rating_score_chk CHECK (score BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS rating_author_idx ON rating (author_sub);
```

- [ ] **Step 2: Create `store/community.py` with the existence helper**

```python
import psycopg


def questionnaire_exists(conn: psycopg.Connection, qid: str) -> bool:
    """True if any catalogue version of this questionnaire id exists (published or withdrawn)."""
    row = conn.execute(
        "SELECT 1 FROM catalogue_entry WHERE id=%s LIMIT 1", (qid,)
    ).fetchone()
    return row is not None
```

- [ ] **Step 3: Amend `library/tests/conftest.py`** — add identity fixtures and extend the truncate list. Add imports + fixtures near the top:

```python
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
```

Then update the `_truncate` autouse fixture's `TRUNCATE` statement to include the new tables:

```python
        c.execute("TRUNCATE entity, catalogue_entry, entity_ref, facet, comment, rating CASCADE")
```

- [ ] **Step 4: Write `library/tests/test_community_schema.py`**

```python
def test_community_tables_exist(conn):
    rows = conn.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()
    names = {r[0] for r in rows}
    assert {"comment", "rating"} <= names


def test_questionnaire_exists(conn):
    from library.store.community import questionnaire_exists
    assert questionnaire_exists(conn, "qst_nope") is False
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_x','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_x','v26.0101','questionnaire','published','X')")
    assert questionnaire_exists(conn, "qst_x") is True
```

- [ ] **Step 5: Run the new schema tests + the full library suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_community_schema.py library/ -q`
Expected: the new tests pass AND the full pre-existing suite stays green (the conftest additions are inert for existing tests; `comment`/`rating` added to TRUNCATE).

- [ ] **Step 6: Commit**

```bash
git add library/src/library/store/schema.sql library/src/library/store/community.py library/tests/conftest.py library/tests/test_community_schema.py
git commit -m "feat(library): comment+rating schema, community store stub, test identity fixtures"
```

---

### Task 3: Comments — store + router (POST/GET/DELETE) + app wiring

**Files:**
- Modify: `library/src/library/store/community.py` (comment functions)
- Create: `library/src/library/api/community.py` (comments router)
- Modify: `library/src/library/api/app.py` (include router + CORS methods + `_CODE_FOR` 401/403)
- Create: `library/tests/test_comments_api.py`

**Interfaces:**
- Consumes: `api.identity.require_user`/`require_admin`, `store.community.questionnaire_exists`, `api.deps.get_conn`, the `client`/`auth_header` fixtures.
- Produces store fns: `add_comment(conn, *, qid, author_sub, author_name, body, parent_id=None) -> dict`; `get_comment(conn, comment_id) -> dict | None`; `list_comments(conn, qid) -> list[dict]` (threaded); `soft_delete_comment(conn, comment_id) -> None`.
- Produces routes: `POST /v1/questionnaires/{qid}/comments`, `GET /v1/questionnaires/{qid}/comments`, `DELETE /v1/comments/{comment_id}`.

- [ ] **Step 1: Write the failing test** (`library/tests/test_comments_api.py`)

```python
import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_c','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_c','v26.0101','questionnaire','published','C')")
    conn.commit()
    return "qst_c"


def test_post_requires_token(client, qid):
    assert client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "hi"}).status_code == 401


def test_post_unknown_qid_404(client, auth_header):
    r = client.post("/v1/questionnaires/qst_missing/comments", json={"body": "hi"},
                    headers=auth_header(["participant"]))
    assert r.status_code == 404


def test_post_and_list_threaded(client, qid, auth_header):
    h = auth_header(["participant"], sub="alice")
    top = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "top"}, headers=h)
    assert top.status_code == 201, top.text
    top_id = top.json()["id"]
    reply = client.post(f"/v1/questionnaires/{qid}/comments",
                        json={"body": "reply", "parent_id": top_id}, headers=h)
    assert reply.status_code == 201
    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()
    assert len(listing["comments"]) == 1
    assert listing["comments"][0]["body"] == "top"
    assert listing["comments"][0]["author_name"] == "alice"
    assert [r["body"] for r in listing["comments"][0]["replies"]] == ["reply"]


def test_empty_body_422(client, qid, auth_header):
    r = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "  "},
                    headers=auth_header(["participant"]))
    assert r.status_code == 422


def test_reply_to_reply_rejected(client, qid, auth_header):
    h = auth_header(["participant"])
    top_id = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "t"}, headers=h).json()["id"]
    reply_id = client.post(f"/v1/questionnaires/{qid}/comments",
                           json={"body": "r", "parent_id": top_id}, headers=h).json()["id"]
    bad = client.post(f"/v1/questionnaires/{qid}/comments",
                      json={"body": "rr", "parent_id": reply_id}, headers=h)
    assert bad.status_code == 422


def test_delete_by_author_then_admin_then_stranger(client, qid, auth_header):
    owner = auth_header(["participant"], sub="alice")
    cid = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "mine"}, headers=owner).json()["id"]
    # stranger cannot delete
    assert client.delete(f"/v1/comments/{cid}", headers=auth_header(["participant"], sub="bob")).status_code == 403
    # author can (soft-delete → tombstone in listing)
    assert client.delete(f"/v1/comments/{cid}", headers=owner).status_code == 204
    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()
    assert listing["comments"][0]["deleted"] is True
    assert listing["comments"][0]["body"] is None and listing["comments"][0]["author_name"] is None
    # admin can delete anyone's
    cid2 = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "x"},
                       headers=auth_header(["participant"], sub="carol")).json()["id"]
    assert client.delete(f"/v1/comments/{cid2}", headers=auth_header(["administrator"], sub="admin")).status_code == 204


def test_tombstone_preserves_replies(client, qid, auth_header):
    h = auth_header(["participant"], sub="alice")
    top_id = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "t"}, headers=h).json()["id"]
    client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "r", "parent_id": top_id}, headers=h)
    client.delete(f"/v1/comments/{top_id}", headers=h)
    top = client.get(f"/v1/questionnaires/{qid}/comments").json()["comments"][0]
    assert top["deleted"] is True and [r["body"] for r in top["replies"]] == ["r"]
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_comments_api.py -q`
Expected: FAIL (404s / missing router).

- [ ] **Step 3: Add comment functions to `store/community.py`**

```python
import uuid
from psycopg.types.json import Jsonb  # (not used yet; safe to omit if your linter objects)


def _comment_view(row: dict) -> dict:
    deleted = row["deleted_at"] is not None
    return {
        "id": str(row["id"]),
        "questionnaire_id": row["questionnaire_id"],
        "parent_id": str(row["parent_id"]) if row["parent_id"] else None,
        "author_sub": None if deleted else row["author_sub"],
        "author_name": None if deleted else row["author_name"],
        "body": None if deleted else row["body"],
        "created_at": row["created_at"].isoformat(),
        "deleted": deleted,
    }


_COLS = "id, questionnaire_id, parent_id, author_sub, author_name, body, created_at, deleted_at"


def _row(conn, sql, args):
    cur = conn.execute(sql, args)
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


def get_comment(conn, comment_id) -> dict | None:
    return _row(conn, f"SELECT {_COLS} FROM comment WHERE id=%s", (comment_id,))


def add_comment(conn, *, qid, author_sub, author_name, body, parent_id=None) -> dict:
    cid = uuid.uuid4()
    conn.execute(
        "INSERT INTO comment (id, questionnaire_id, parent_id, author_sub, author_name, body) "
        "VALUES (%s,%s,%s,%s,%s,%s)",
        (cid, qid, parent_id, author_sub, author_name, body))
    return _comment_view(get_comment(conn, cid))


def list_comments(conn, qid) -> list[dict]:
    cur = conn.execute(
        f"SELECT {_COLS} FROM comment WHERE questionnaire_id=%s ORDER BY created_at", (qid,))
    cols = [d.name for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    tops = [r for r in rows if r["parent_id"] is None]
    out = []
    for t in tops:
        view = _comment_view(t)
        view["replies"] = [_comment_view(r) for r in rows if r["parent_id"] == t["id"]]
        out.append(view)
    return out


def soft_delete_comment(conn, comment_id) -> None:
    conn.execute(
        "UPDATE comment SET deleted_at = now(), body = NULL, author_sub = NULL, author_name = NULL "
        "WHERE id=%s AND deleted_at IS NULL", (comment_id,))
```

- [ ] **Step 4: Write `library/src/library/api/community.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from .deps import get_conn
from .identity import require_user
from ..store import community as store

router = APIRouter()


class CommentIn(BaseModel):
    body: str
    parent_id: str | None = None


def _author_name(claims: dict) -> str:
    return claims.get("name") or claims.get("display_name") or claims["sub"]


@router.post("/questionnaires/{qid}/comments", status_code=201)
def post_comment(qid: str, body: CommentIn, conn=Depends(get_conn), claims=Depends(require_user)):
    if not store.questionnaire_exists(conn, qid):
        raise HTTPException(status_code=404, detail="questionnaire not found")
    text = (body.body or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="comment body must not be empty")
    if body.parent_id is not None:
        parent = store.get_comment(conn, body.parent_id)
        if parent is None or parent["questionnaire_id"] != qid:
            raise HTTPException(status_code=422, detail="invalid parent_id")
        if parent["parent_id"] is not None:
            raise HTTPException(status_code=422, detail="replies may only target a top-level comment")
    out = store.add_comment(conn, qid=qid, author_sub=claims["sub"],
                            author_name=_author_name(claims), body=text, parent_id=body.parent_id)
    conn.commit()
    return out


@router.get("/questionnaires/{qid}/comments")
def get_comments(qid: str, conn=Depends(get_conn)):
    return {"comments": store.list_comments(conn, qid)}


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: str, conn=Depends(get_conn), claims=Depends(require_user)):
    c = store.get_comment(conn, comment_id)
    if c is None:
        raise HTTPException(status_code=404, detail="comment not found")
    is_admin = "administrator" in claims.get("roles", [])
    if c["author_sub"] != claims["sub"] and not is_admin:
        raise HTTPException(status_code=403, detail="not the author")
    store.soft_delete_comment(conn, comment_id)
    conn.commit()
```

- [ ] **Step 5: Wire the router + CORS + error codes in `api/app.py`**

(a) Add the import + include (alongside the other routers):

```python
from . import questionnaires, entities, search, community
...
    app.include_router(community.router, prefix="/v1")
```

(b) Broaden CORS methods — change `allow_methods=["GET", "OPTIONS"]` to:

```python
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
```

(c) Extend `_CODE_FOR`:

```python
_CODE_FOR = {400: "bad_request", 401: "unauthorized", 403: "forbidden",
             404: "not_found", 410: "gone", 422: "unprocessable"}
```

- [ ] **Step 6: Run the comments suite to green**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_comments_api.py -q`
Expected: 7 passed.

- [ ] **Step 7: Commit**

```bash
git add library/src/library/store/community.py library/src/library/api/community.py library/src/library/api/app.py library/tests/test_comments_api.py
git commit -m "feat(library): threaded comments (post/list/soft-delete) gated by Identity"
```

---

### Task 4: Ratings — store + endpoints (PUT/GET/DELETE)

**Files:**
- Modify: `library/src/library/store/community.py` (rating functions)
- Modify: `library/src/library/api/community.py` (rating routes)
- Create: `library/tests/test_ratings_api.py`

**Interfaces:**
- Consumes: `require_user`, `optional_user`, `questionnaire_exists`.
- Produces store fns: `upsert_rating(conn, *, qid, author_sub, score)`; `rating_summary(conn, qid) -> dict` (`{mean, count, histogram}`); `caller_rating(conn, qid, author_sub) -> int | None`; `delete_rating(conn, qid, author_sub)`.
- Produces routes: `PUT /v1/questionnaires/{qid}/rating`, `GET /v1/questionnaires/{qid}/rating`, `DELETE /v1/questionnaires/{qid}/rating`.

- [ ] **Step 1: Write the failing test** (`library/tests/test_ratings_api.py`)

```python
import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_r','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_r','v26.0101','questionnaire','published','R')")
    conn.commit()
    return "qst_r"


def test_put_requires_token(client, qid):
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 4}).status_code == 401


def test_put_unknown_qid_404(client, auth_header):
    assert client.put("/v1/questionnaires/none/rating", json={"score": 4},
                      headers=auth_header(["participant"])).status_code == 404


def test_score_out_of_range_422(client, qid, auth_header):
    h = auth_header(["participant"])
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 0}, headers=h).status_code == 422
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 6}, headers=h).status_code == 422


def test_upsert_and_summary(client, qid, auth_header):
    a = auth_header(["participant"], sub="alice")
    b = auth_header(["participant"], sub="bob")
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=a)
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 3}, headers=a)   # re-rate upserts
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 1}, headers=b)
    s = client.get(f"/v1/questionnaires/{qid}/rating").json()
    assert s["count"] == 2 and s["mean"] == 2.0
    assert s["histogram"]["3"] == 1 and s["histogram"]["1"] == 1
    assert "my_score" not in s or s.get("my_score") is None            # no token → no my_score
    mine = client.get(f"/v1/questionnaires/{qid}/rating", headers=a).json()
    assert mine["my_score"] == 3


def test_delete_own_rating(client, qid, auth_header):
    a = auth_header(["participant"], sub="alice")
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=a)
    assert client.delete(f"/v1/questionnaires/{qid}/rating", headers=a).status_code == 200
    assert client.get(f"/v1/questionnaires/{qid}/rating").json()["count"] == 0
    # idempotent
    assert client.delete(f"/v1/questionnaires/{qid}/rating", headers=a).status_code == 200
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_ratings_api.py -q`
Expected: FAIL (404 / missing routes).

- [ ] **Step 3: Add rating functions to `store/community.py`**

```python
def upsert_rating(conn, *, qid, author_sub, score) -> None:
    conn.execute(
        "INSERT INTO rating (questionnaire_id, author_sub, score) VALUES (%s,%s,%s) "
        "ON CONFLICT (questionnaire_id, author_sub) "
        "DO UPDATE SET score = EXCLUDED.score, updated_at = now()",
        (qid, author_sub, score))


def rating_summary(conn, qid) -> dict:
    cur = conn.execute(
        "SELECT score, count(*) FROM rating WHERE questionnaire_id=%s GROUP BY score", (qid,))
    hist = {str(i): 0 for i in range(1, 6)}
    total = 0
    n = 0
    for score, c in cur.fetchall():
        hist[str(score)] = c
        total += score * c
        n += c
    mean = round(total / n, 2) if n else None
    return {"mean": mean, "count": n, "histogram": hist}


def caller_rating(conn, qid, author_sub) -> int | None:
    row = conn.execute(
        "SELECT score FROM rating WHERE questionnaire_id=%s AND author_sub=%s",
        (qid, author_sub)).fetchone()
    return row[0] if row else None


def delete_rating(conn, qid, author_sub) -> None:
    conn.execute("DELETE FROM rating WHERE questionnaire_id=%s AND author_sub=%s", (qid, author_sub))
```

- [ ] **Step 4: Add rating routes to `api/community.py`**

Add the import for `optional_user` (extend the existing identity import):

```python
from .identity import require_user, optional_user
```

Add a model + the three routes:

```python
class RatingIn(BaseModel):
    score: int = Field(ge=1, le=5)


@router.put("/questionnaires/{qid}/rating")
def put_rating(qid: str, body: RatingIn, conn=Depends(get_conn), claims=Depends(require_user)):
    if not store.questionnaire_exists(conn, qid):
        raise HTTPException(status_code=404, detail="questionnaire not found")
    store.upsert_rating(conn, qid=qid, author_sub=claims["sub"], score=body.score)
    conn.commit()
    return store.rating_summary(conn, qid)


@router.get("/questionnaires/{qid}/rating")
def get_rating(qid: str, conn=Depends(get_conn), claims=Depends(optional_user)):
    summary = store.rating_summary(conn, qid)
    if claims is not None:
        summary["my_score"] = store.caller_rating(conn, qid, claims["sub"])
    return summary


@router.delete("/questionnaires/{qid}/rating")
def delete_rating(qid: str, conn=Depends(get_conn), claims=Depends(require_user)):
    store.delete_rating(conn, qid, claims["sub"])
    conn.commit()
    return store.rating_summary(conn, qid)
```

Note: `RatingIn.score` with `Field(ge=1, le=5)` makes an out-of-range score a `422` via FastAPI validation (matching the spec) before the route body runs.

- [ ] **Step 5: Run the ratings suite to green**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_ratings_api.py -q`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add library/src/library/store/community.py library/src/library/api/community.py library/tests/test_ratings_api.py
git commit -m "feat(library): 1-5 ratings (upsert/summary/delete) gated by Identity"
```

---

### Task 5: GDPR self-erasure

**Files:**
- Modify: `library/src/library/store/community.py` (purge function)
- Modify: `library/src/library/api/community.py` (erasure route)
- Create: `library/tests/test_community_erasure.py`

**Interfaces:**
- Consumes: `require_user`.
- Produces: `store.community.purge_user_community_data(conn, author_sub) -> dict` (`{comments_tombstoned, ratings_deleted}`); route `DELETE /v1/me/community-data`.

- [ ] **Step 1: Write the failing test** (`library/tests/test_community_erasure.py`)

```python
import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_e','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_e','v26.0101','questionnaire','published','E')")
    conn.commit()
    return "qst_e"


def test_erasure_requires_token(client):
    assert client.delete("/v1/me/community-data").status_code == 401


def test_erasure_removes_user_data_preserves_threads(client, qid, auth_header):
    alice = auth_header(["participant"], sub="alice")
    bob = auth_header(["participant"], sub="bob")
    top = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "alice-top"}, headers=alice).json()["id"]
    # bob replies to alice's comment
    client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "bob-reply", "parent_id": top}, headers=bob)
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=alice)

    res = client.delete("/v1/me/community-data", headers=alice).json()
    assert res["comments_tombstoned"] == 1 and res["ratings_deleted"] == 1

    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()["comments"]
    assert listing[0]["deleted"] is True and listing[0]["body"] is None       # alice's comment tombstoned
    assert [r["body"] for r in listing[0]["replies"]] == ["bob-reply"]        # bob's reply preserved
    assert client.get(f"/v1/questionnaires/{qid}/rating").json()["count"] == 0  # alice's rating gone
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_community_erasure.py -q`
Expected: FAIL (404 / missing route).

- [ ] **Step 3: Add the purge function to `store/community.py`**

```python
def purge_user_community_data(conn, author_sub) -> dict:
    cur = conn.execute(
        "UPDATE comment SET deleted_at = now(), body = NULL, author_sub = NULL, author_name = NULL "
        "WHERE author_sub = %s AND deleted_at IS NULL", (author_sub,))
    tombstoned = cur.rowcount
    cur = conn.execute("DELETE FROM rating WHERE author_sub = %s", (author_sub,))
    deleted = cur.rowcount
    return {"comments_tombstoned": tombstoned, "ratings_deleted": deleted}
```

- [ ] **Step 4: Add the erasure route to `api/community.py`**

```python
@router.delete("/me/community-data")
def erase_my_community_data(conn=Depends(get_conn), claims=Depends(require_user)):
    res = store.purge_user_community_data(conn, claims["sub"])
    conn.commit()
    return res
```

- [ ] **Step 5: Run the erasure suite to green**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/tests/test_community_erasure.py -q`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add library/src/library/store/community.py library/src/library/api/community.py library/tests/test_community_erasure.py
git commit -m "feat(library): GDPR self-erasure of community data (DELETE /me/community-data)"
```

---

### Task 6: Full-suite gate + docs

**Files:**
- Modify: `library/README.md` (Community signals + auth section)
- Create or Modify: `library/FOLLOWUPS.md` (record deferrals)

- [ ] **Step 1: Run the ENTIRE library suite (deliverable gate)**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest library/ -q`
Expected: ALL tests pass (existing read suites + the 5 new test files). If a pre-existing test fails, diagnose: the only ID-C1 change touching existing behavior is the CORS `allow_methods` broadening and the `_CODE_FOR` additions (both additive) and the TRUNCATE list. If a failure is unrelated to those, STOP and report BLOCKED with output. Capture the total count.

- [ ] **Step 2: Confirm read endpoints stay public + ungated**

Confirm (by reading the diff) that `questionnaires.py`, `entities.py`, `search.py`, `resolve.py` were NOT modified — only `app.py` (router include + CORS + codes) and the new `community.py`/`identity.py` were added. State this in the report.

- [ ] **Step 3: Update `library/README.md`**

Add a "Community signals & authentication" section: comments + ratings require an Identity access token (any role / "participant or higher"); moderation delete requires `administrator`; reads are public; `DELETE /me/community-data` is GDPR self-erasure; document `IDENTITY_JWKS_URL`/`IDENTITY_ISSUER`/`IDENTITY_AUDIENCE` (default `questionnaire-apps`); a token comes from the sibling `identity-service`. List the new endpoints.

- [ ] **Step 4: Update `library/FOLLOWUPS.md`** (create if absent)

Record the ID-C1 deferrals: usage-stats aggregation from the Viewer Service (cross-service read); surfacing community signals in search ranking; the contribution write/review workflow + `draft`/`in_review` lifecycle (ID-C2); DOI minting (ID-C3); comment editing (delete + repost only for now); use-case-suitability ratings (needs a taxonomy).

- [ ] **Step 5: Commit**

```bash
git add library/README.md library/FOLLOWUPS.md
git commit -m "docs(library): document community signals + Identity auth; record ID-C1 FOLLOWUPS; ID-C1 complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 ratings 1–5 upsert + mean/count/histogram → Task 4 (`upsert_rating`/`rating_summary`). ✓
- §2 comments single-level threading + tombstone soft-delete → Task 3 (reply-to-reply 422, `soft_delete_comment`, `_comment_view`). ✓
- §2 target = qid, must exist (404) → Task 2 (`questionnaire_exists`) + enforced in Tasks 3/4. ✓
- §2 auth floor any token; admin moderation; author_sub from claims → Task 1 deps + Task 3 delete rule. ✓
- §2 audience questionnaire-apps → Task 1 config. ✓
- §3 identity.py / community.py / community store / config / schema / app CORS+codes / pyproject → Tasks 1,2,3. ✓
- §4 schema (comment+rating exact columns + CHECK + cascade) → Task 2. ✓
- §5 every endpoint (POST/GET/DELETE comments, PUT/GET/DELETE rating, DELETE /me/community-data) → Tasks 3,4,5. ✓
- §6 authz (delete=author|admin; rating ops own; sub from token) → Tasks 3,4,5. ✓
- §7 error codes 401/403/404/422 + envelope → Task 3 (_CODE_FOR) + per-route raises. ✓
- §8 testing (dep unit, comments, ratings, erasure, public reads, full suite) → Tasks 1,3,4,5,6. ✓
- §8 out-of-scope honored (no usage-stats/ranking/contribution/DOI/edit). ✓
- §9 deliverable gate → Task 6. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every step carries concrete code or an exact edit. The one stray-import note in Task 3 Step 3 (`Jsonb` unused) is flagged inline as removable — not a placeholder.

**3. Type consistency:** `install_test_cache`/`require_user`/`require_admin`/`optional_user` (Task 1) are consumed verbatim in Tasks 2–5. `auth_header(roles, *, sub=...)` + `id_key`/`client` (Task 2) used consistently in Tasks 3–5. `questionnaire_exists` (Task 2) used in Tasks 3,4. Comment store fns (`add_comment`/`get_comment`/`list_comments`/`soft_delete_comment`, the `_comment_view` shape with `deleted`/`replies`) defined Task 3, reused by erasure assertions Task 5. Rating fns (`upsert_rating`/`rating_summary`/`caller_rating`/`delete_rating`) defined Task 4. `purge_user_community_data` Task 5. The router file `api/community.py` is created in Task 3 and extended in Tasks 4–5 (same `router`, `store`, `get_conn`, identity imports). Consistent.

Fix applied during review: Task 3 Step 3's `from psycopg.types.json import Jsonb` is unused — the implementer should omit it (noted inline); `store/community.py` needs `import uuid` (present in Task 3 Step 3) and `import psycopg` (present from Task 2 Step 2).
