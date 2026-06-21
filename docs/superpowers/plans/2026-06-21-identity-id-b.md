# ID-B — Gate the Viewer Service control-plane — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an Identity (ID-A) access token carrying an appropriate role on every researcher/admin control-plane endpoint of the Viewer Service, while leaving the anonymous participant session path untouched.

**Architecture:** `viewer-service` imports ID-A's standalone `identity_service.identity_client` verifier (JWKS-cached EdDSA-JWT verification — no token logic reimplemented). A new `viewer_service/api/identity.py` provides FastAPI dependencies `require_researcher` (any of researcher/reviewer/administrator) and `require_admin` (administrator), verifying the Bearer token against a configured issuer/JWKS for the fixed audience `questionnaire-apps`. Control-plane routes gain the dependency; the participant `/sessions/*` path and `GET /scorers/.../impl.wasm` stay anonymous. Tests install a fake-fetcher `JwksCache` + sign test tokens, and the shared `client` fixture carries a default researcher token so existing setup calls pass the gate unchanged.

**Tech Stack:** Python ≥3.12, FastAPI, raw psycopg3, PyJWT[crypto] (EdDSA), httpx, testcontainers Postgres, pytest. Reuses `identity_service` (installed editable in the same venv).

## Global Constraints

- Audience is the fixed string `questionnaire-apps`; issuer + JWKS URL come from config. Tokens are EdDSA JWTs verified via `identity_service.identity_client.verify(token, *, jwks, audience, issuer)`.
- Control-plane endpoints accept **any of** `{researcher, reviewer, administrator}`; `DELETE /v1/runtime_cache` requires **administrator**.
- Auth failures: `401` for missing/malformed `Authorization` header or any token-verification failure (bad signature, expired, wrong aud/iss, kid-less/unknown kid); `403` for a verified token missing the required role.
- Participant path (`POST /v1/sessions/new`, all `/v1/sessions/{id}/*`), `GET /v1/scorers/{ref}/impl.wasm`, and `GET /healthz` stay **anonymous** — do NOT add Identity auth to them.
- `POST /v1/deployments` sets `created_by = claims["sub"]` (authoritative — ignore any body-supplied `created_by`). Per-record ownership is NOT enforced (FOLLOWUP).
- Reuse VS's existing error-envelope shape. Raw psycopg3, no ORM. Run the VS suite in its own pytest invocation with `DOCKER_CONFIG=/tmp/lib_docker`. The repo `.venv` is uv-managed — use `.venv/bin/python -m pytest` / `-m pip`.
- No changes to `identity-service/` (ID-A is frozen). TDD: failing test first; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-21-identity-id-b-design.md`.

---

### Task 1: Config + Identity dependency module (`require_researcher` / `require_admin`)

**Files:**
- Modify: `viewer-service/pyproject.toml` (add `pyjwt[crypto]>=2.8` dependency)
- Modify: `viewer-service/src/viewer_service/config.py` (add identity settings)
- Create: `viewer-service/src/viewer_service/api/identity.py`
- Create: `viewer-service/tests/test_identity_dep.py`

**Interfaces:**
- Consumes: `identity_service.identity_client` (`JwksCache`, `verify`), `identity_service.keys.generate_keypair`, `identity_service.tokens.sign_access` (tests only), `config.get_settings`.
- Produces:
  - `Settings.identity_jwks_url: str`, `Settings.identity_issuer: str`, `Settings.identity_audience: str` (default `"questionnaire-apps"`).
  - `api.identity.install_test_cache(public_jwk: dict)` — test seam: sets the module `_cache` to a fake-fetcher `JwksCache`.
  - `api.identity.require_researcher(authorization: str | None) -> dict` (FastAPI dependency, returns claims).
  - `api.identity.require_admin(authorization: str | None) -> dict`.

- [ ] **Step 1: Add the dependency to `pyproject.toml`**

In `viewer-service/pyproject.toml`, add `"pyjwt[crypto]>=2.8",` to the `dependencies` list (after `"httpx>=0.27",`). Then reinstall:

Run: `cd viewer-service && .venv/../.venv/bin/python -m pip install -e '.[dev]'` — i.e. from repo root: `.venv/bin/python -m pip install -e 'viewer-service[dev]'`. Also ensure ID-A is importable: `.venv/bin/python -m pip install -e 'identity-service[dev]'`.

- [ ] **Step 2: Add identity settings to `config.py`**

In `viewer-service/src/viewer_service/config.py`, add three fields to the `Settings` dataclass (place after `cors_origins`):

```python
    identity_jwks_url: str = "http://localhost:8100/.well-known/jwks.json"
    identity_issuer: str = "http://localhost:8100"
    identity_audience: str = "questionnaire-apps"
```

And in `get_settings()`, add to the `Settings(...)` constructor call:

```python
        identity_jwks_url=os.environ.get("IDENTITY_JWKS_URL", "http://localhost:8100/.well-known/jwks.json"),
        identity_issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        identity_audience=os.environ.get("IDENTITY_AUDIENCE", "questionnaire-apps"),
```

- [ ] **Step 3: Write the failing test** (`viewer-service/tests/test_identity_dep.py`)

```python
import time
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from viewer_service.api import identity as idmod


@pytest.fixture
def key(monkeypatch):
    kid, jwk, pem = generate_keypair()
    monkeypatch.setenv("IDENTITY_ISSUER", "http://id-test")
    monkeypatch.setenv("IDENTITY_AUDIENCE", "questionnaire-apps")
    idmod.install_test_cache(jwk)
    return kid, pem


def _token(kid, pem, roles, *, aud="questionnaire-apps", iss="http://id-test", ttl=900, now=None):
    return sign_access(private_pem=pem, kid=kid, sub="u-1", aud=aud, roles=roles,
                       issuer=iss, ttl=ttl, now=now)


def _app():
    app = FastAPI()

    @app.get("/r")
    def r(claims=Depends(idmod.require_researcher)):
        return {"sub": claims["sub"]}

    @app.get("/a")
    def a(claims=Depends(idmod.require_admin)):
        return {"sub": claims["sub"]}

    return TestClient(app)


def test_researcher_paths(key):
    kid, pem = key
    c = _app()
    assert c.get("/r").status_code == 401                                   # no token
    assert c.get("/r", headers={"Authorization": "Bearer garbage"}).status_code == 401
    tok = _token(kid, pem, ["participant"])
    assert c.get("/r", headers={"Authorization": f"Bearer {tok}"}).status_code == 403   # wrong role
    for role in (["researcher"], ["reviewer"], ["administrator"]):
        tok = _token(kid, pem, role)
        r = c.get("/r", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200 and r.json()["sub"] == "u-1"


def test_admin_requires_administrator(key):
    kid, pem = key
    c = _app()
    tok = _token(kid, pem, ["researcher"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 403
    tok = _token(kid, pem, ["administrator"])
    assert c.get("/a", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_rejects_wrong_audience_and_expired(key):
    kid, pem = key
    c = _app()
    bad_aud = _token(kid, pem, ["researcher"], aud="someone-else")
    assert c.get("/r", headers={"Authorization": f"Bearer {bad_aud}"}).status_code == 401
    expired = _token(kid, pem, ["researcher"], ttl=1, now=int(time.time()) - 10)
    assert c.get("/r", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest viewer-service/tests/test_identity_dep.py -q`
Expected: FAIL (`AttributeError`/`ImportError` — `viewer_service.api.identity` does not exist).

- [ ] **Step 5: Write `viewer-service/src/viewer_service/api/identity.py`**

```python
from fastapi import Header, HTTPException
from identity_service.identity_client import JwksCache, verify
from ..config import get_settings

_RESEARCH_ROLES = frozenset({"researcher", "reviewer", "administrator"})
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


def _claims(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer "):]
    s = get_settings()
    try:
        return verify(token, jwks=_get_cache(), audience=s.identity_audience, issuer=s.identity_issuer)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid access token")


def require_researcher(authorization: str | None = Header(default=None)) -> dict:
    claims = _claims(authorization)
    if not (_RESEARCH_ROLES & set(claims.get("roles", []))):
        raise HTTPException(status_code=403, detail="researcher role required")
    return claims


def require_admin(authorization: str | None = Header(default=None)) -> dict:
    claims = _claims(authorization)
    if "administrator" not in claims.get("roles", []):
        raise HTTPException(status_code=403, detail="administrator role required")
    return claims
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest viewer-service/tests/test_identity_dep.py -q`
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/pyproject.toml viewer-service/src/viewer_service/config.py viewer-service/src/viewer_service/api/identity.py viewer-service/tests/test_identity_dep.py
git commit -m "feat(vs): identity gate dependencies (require_researcher/require_admin) + config"
```

---

### Task 2: Shared test infrastructure — fake JWKS + default researcher client

**Files:**
- Modify: `viewer-service/tests/conftest.py`

**Interfaces:**
- Consumes: `api.identity.install_test_cache`, `identity_service.keys.generate_keypair`, `identity_service.tokens.sign_access`.
- Produces (pytest fixtures + helpers, importable by every test module):
  - `id_key` (session fixture) → `(kid, public_jwk, private_pem)`; installs the fake cache + sets `IDENTITY_ISSUER`/`IDENTITY_AUDIENCE` env.
  - `auth_header(roles, *, sub="u-researcher")` → `{"Authorization": "Bearer <token>"}`.
  - The existing `client` fixture is amended to attach a **default researcher** `Authorization` header so existing control-plane setup calls keep working once routes are gated.

**Why:** Many existing suites (`test_sessions_api`, `test_submission_api`, `test_deployments_api`, `test_export_api`, `test_metrics_api`, `test_locale`, `test_ephemeral_submission`, `test_scorer_outputs_api`, `test_mint_rewrite`, `test_session_*`, `test_vsc_schema`, `test_themes_api`, …) create deployments / register viewers as setup with no auth. A default researcher token on the shared `client` makes those pass the gate without editing each file. Participant calls that pass an explicit per-request `Authorization` (session Bearer) override the default automatically.

- [ ] **Step 1: Read the current conftest**

Read `viewer-service/tests/conftest.py` to confirm the `client` fixture signature (it monkeypatches `DATABASE_URL` and returns `TestClient(create_app())`) and the `_truncate` autouse list.

- [ ] **Step 2: Amend `conftest.py`** — add the identity fixtures and a default-auth client. Insert near the top (after imports) and replace the existing `client` fixture body:

```python
from identity_service.keys import generate_keypair
from identity_service.tokens import sign_access
from viewer_service.api import identity as _idmod

_ID_ISSUER = "http://id-test"
_ID_AUDIENCE = "questionnaire-apps"


@pytest.fixture(scope="session")
def id_key():
    return generate_keypair()  # (kid, public_jwk, private_pem)


@pytest.fixture(autouse=True)
def _identity(id_key, monkeypatch):
    kid, jwk, pem = id_key
    monkeypatch.setenv("IDENTITY_ISSUER", _ID_ISSUER)
    monkeypatch.setenv("IDENTITY_AUDIENCE", _ID_AUDIENCE)
    _idmod.install_test_cache(jwk)
    yield


def _mint(id_key, roles, sub):
    kid, jwk, pem = id_key
    return sign_access(private_pem=pem, kid=kid, sub=sub, aud=_ID_AUDIENCE,
                       roles=roles, issuer=_ID_ISSUER, ttl=900)


@pytest.fixture
def auth_header(id_key):
    def make(roles, *, sub="u-researcher"):
        return {"Authorization": f"Bearer {_mint(id_key, roles, sub)}"}
    return make
```

Then amend the existing `client` fixture so it carries a default researcher token (the `id_key`/`_identity` fixtures guarantee the cache + env are set first):

```python
@pytest.fixture
def client(pg_url, id_key, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    monkeypatch.setenv("IDENTITY_ISSUER", _ID_ISSUER)
    monkeypatch.setenv("IDENTITY_AUDIENCE", _ID_AUDIENCE)
    _idmod.install_test_cache(id_key[1])
    from fastapi.testclient import TestClient
    from viewer_service.api.app import create_app
    default = {"Authorization": f"Bearer {_mint(id_key, ['researcher'], 'u-researcher')}"}
    return TestClient(create_app(), headers=default)
```

(If the current `client` fixture differs, preserve its existing body and only add the `id_key` param, the cache/env setup, and the `headers=default` kwarg on `TestClient`.)

- [ ] **Step 3: Run the full suite — it must stay green (no routes gated yet)**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pre-existing tests still pass (default header is harmless on still-ungated routes; the new `test_identity_dep.py` passes). Note the total count.

- [ ] **Step 4: Commit**

```bash
git add viewer-service/tests/conftest.py
git commit -m "test(vs): conftest fake-JWKS + default researcher client for gated control-plane"
```

---

### Task 3: Gate deployments + runtime mint (researcher) + `created_by` from token

**Files:**
- Modify: `viewer-service/src/viewer_service/api/deployments.py` (4 routes + created_by)
- Modify: `viewer-service/src/viewer_service/api/runtime.py` (1 route)
- Create: `viewer-service/tests/test_identity_gate.py`

**Interfaces:**
- Consumes: `api.identity.require_researcher`, the `auth_header` fixture.
- Produces: gated `POST/GET /v1/deployments`, `GET/PATCH /v1/deployments/{id}`, `POST /v1/deployments/{id}/runtime`; `created_by` persisted from `claims["sub"]`.

- [ ] **Step 1: Write the failing test** (`viewer-service/tests/test_identity_gate.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod

BUNDLE = {  # minimal resolvable bundle (mirrors test_sessions_api)
    "definition": {"metadata": {"id": "qst_mini", "version": "v26.0609", "title": "M",
                                "description": "d", "language": "en"},
                   "pages": [{"id": "page_1", "elements": [
                       {"id": "it_1", "question": {"prompt": {"ref": "pr_1@v26.0609"}},
                        "option": {"ref": "opt_1@v26.0609"}}]}]},
    "entities": {
        "pr_1@v26.0609": {"id": "pr_1", "content": {"en": {"status": "validated", "text": "Q?"}}},
        "opt_1@v26.0609": {"id": "opt_1", "input_data_type": "choice", "measurement_type": "ordinal",
            "selection": "single", "options": [{"index": 1, "value": 0}],
            "content": {"en": {"status": "validated", "label": "L", "options": [{"index": 1, "text": "a"}]}}},
    },
}
_DEP_BODY = {"questionnaire_ref": "qst_mini@v26.0609",
             "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
             "default_locale": "en", "available_locales": ["en"]}


def _noauth(client):
    # a client with NO default Authorization header
    client.headers.pop("authorization", None)
    return client


def test_create_deployment_requires_token(client):
    c = _noauth(client)
    assert c.post("/v1/deployments", json=_DEP_BODY).status_code == 401


def test_create_deployment_rejects_participant_role(client, auth_header):
    c = _noauth(client)
    r = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["participant"]))
    assert r.status_code == 403


def test_create_deployment_sets_created_by_from_token(client, auth_header):
    c = _noauth(client)
    h = auth_header(["researcher"], sub="researcher-42")
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=h)
    assert dep.status_code == 201, dep.text
    got = c.get(f"/v1/deployments/{dep.json()['deployment_id']}", headers=h).json()
    assert got["created_by"] == "researcher-42"


def test_list_and_patch_require_researcher(client, auth_header):
    c = _noauth(client)
    assert c.get("/v1/deployments").status_code == 401
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["researcher"]))
    dep_id = dep.json()["deployment_id"]
    assert c.patch(f"/v1/deployments/{dep_id}", json={"quota": {"max_sessions": 5}}).status_code == 401
    ok = c.patch(f"/v1/deployments/{dep_id}", json={"quota": {"max_sessions": 5}},
                 headers=auth_header(["reviewer"]))
    assert ok.status_code == 200


def test_runtime_mint_requires_researcher(client, auth_header, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    c = _noauth(client)
    c.post("/v1/viewers", json={"viewer_id": "web", "viewer_version": "v26.0610",
        "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
        "evaluator": {"language_version": "v1.0", "functions": ["if"]},
        "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]},
        headers=auth_header(["researcher"]))
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["researcher"]))
    dep_id = dep.json()["deployment_id"]
    assert c.post(f"/v1/deployments/{dep_id}/runtime", json={}).status_code == 401
    ok = c.post(f"/v1/deployments/{dep_id}/runtime", json={}, headers=auth_header(["researcher"]))
    assert ok.status_code in (200, 201), ok.text
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py -q`
Expected: FAIL — the no-token / wrong-role calls return 201/200 (routes not yet gated), and `created_by` is null.

- [ ] **Step 3: Gate the routes in `deployments.py`**

Add the import at the top of `viewer-service/src/viewer_service/api/deployments.py`:

```python
from .identity import require_researcher
```

Add `claims=Depends(require_researcher)` to each route signature and use the sub for `created_by`:

- `create(body: DeploymentCreate, conn=Depends(get_conn))` → `create(body: DeploymentCreate, conn=Depends(get_conn), claims=Depends(require_researcher))`. In the `store.insert_deployment(...)` call, change `created_by=body.created_by,` to `created_by=claims["sub"],`.
- `list_(conn=Depends(get_conn))` → add `, claims=Depends(require_researcher)`.
- `get(deployment_id: str, conn=Depends(get_conn))` → add `, claims=Depends(require_researcher)`.
- `patch`/`update` route signature → add `, claims=Depends(require_researcher)`.

- [ ] **Step 4: Gate the route in `runtime.py`**

In `viewer-service/src/viewer_service/api/runtime.py`, add `from .identity import require_researcher` and append `, claims=Depends(require_researcher)` to the `POST /deployments/{deployment_id}/runtime` route signature. (Ensure `Depends` is imported from fastapi — it already is.)

- [ ] **Step 5: Run the gate test + the deployments suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py viewer-service/tests/test_deployments_api.py viewer-service/tests/test_runtime_api.py -q`
Expected: all pass (existing deployment/runtime tests use the default-researcher `client`, so they still pass; the new gate tests pass).

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/deployments.py viewer-service/src/viewer_service/api/runtime.py viewer-service/tests/test_identity_gate.py
git commit -m "feat(vs): gate deployment CRUD + runtime mint to researcher; created_by from token"
```

---

### Task 4: Gate viewer registry + themes (researcher)

**Files:**
- Modify: `viewer-service/src/viewer_service/api/viewers.py` (2 routes)
- Modify: `viewer-service/src/viewer_service/api/themes.py` (3 routes)
- Modify: `viewer-service/tests/test_identity_gate.py` (add cases)

**Interfaces:**
- Consumes: `api.identity.require_researcher`, `auth_header`.
- Produces: gated `POST /v1/viewers`, `GET /v1/viewers/{viewer_id}/{viewer_version}`, `POST/GET /v1/themes`, `GET /v1/themes/{theme_id}`.

- [ ] **Step 1: Add failing tests** to `viewer-service/tests/test_identity_gate.py`

```python
def test_register_viewer_requires_researcher(client, auth_header):
    c = _noauth(client)
    manifest = {"viewer_id": "web", "viewer_version": "v26.0610",
                "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
                "evaluator": {"language_version": "v1.0", "functions": ["if"]},
                "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}
    assert c.post("/v1/viewers", json=manifest).status_code == 401
    assert c.post("/v1/viewers", json=manifest, headers=auth_header(["participant"])).status_code == 403
    assert c.post("/v1/viewers", json=manifest, headers=auth_header(["researcher"])).status_code == 201


def test_themes_require_researcher(client, auth_header):
    c = _noauth(client)
    body = {"name": "T", "palette": {"background": "#ffffff", "foreground": "#111111",
            "primary": "#1a5fb4", "on_primary": "#ffffff"}, "typography": {"base_size": 16}}
    assert c.post("/v1/themes", json=body).status_code == 401
    assert c.get("/v1/themes").status_code == 401
    created = c.post("/v1/themes", json=body, headers=auth_header(["researcher"]))
    assert created.status_code == 201, created.text
    tid = created.json()["theme_id"]
    assert c.get(f"/v1/themes/{tid}").status_code == 401
    assert c.get(f"/v1/themes/{tid}", headers=auth_header(["administrator"])).status_code == 200
```

- [ ] **Step 2: Run to verify the new cases fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py -q`
Expected: FAIL on `test_register_viewer_requires_researcher` / `test_themes_require_researcher` (routes return 201/200 without a token).

- [ ] **Step 3: Gate `viewers.py`**

Add `from .identity import require_researcher` to `viewer-service/src/viewer_service/api/viewers.py`, and append `, claims=Depends(require_researcher)` to both route signatures (`POST /viewers` and `GET /viewers/{viewer_id}/{viewer_version}`). Confirm `Depends` is imported from fastapi.

- [ ] **Step 4: Gate `themes.py`**

Add `from .identity import require_researcher` to `viewer-service/src/viewer_service/api/themes.py`, and append `, claims=Depends(require_researcher)` to the `create` (`POST /themes`), `list_` (`GET /themes`), and `GET /themes/{theme_id}` route signatures.

- [ ] **Step 5: Run gate + themes + viewers suites**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py viewer-service/tests/test_themes_api.py viewer-service/tests/test_viewers_api.py -q`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/api/viewers.py viewer-service/src/viewer_service/api/themes.py viewer-service/tests/test_identity_gate.py
git commit -m "feat(vs): gate viewer registry + theme endpoints to researcher"
```

---

### Task 5: Gate export + metrics (researcher) and runtime_cache purge (administrator)

**Files:**
- Modify: `viewer-service/src/viewer_service/api/export.py` (1 route)
- Modify: `viewer-service/src/viewer_service/api/metrics.py` (1 route)
- Modify: `viewer-service/src/viewer_service/api/admin.py` (1 route → admin)
- Modify: `viewer-service/tests/test_identity_gate.py` (add cases)
- Modify: `viewer-service/tests/test_runtime_cache.py` (attach admin token to the purge call)

**Interfaces:**
- Consumes: `api.identity.require_researcher`, `api.identity.require_admin`, `auth_header`.
- Produces: gated `GET /v1/deployments/{id}/export.csv`, `GET /v1/deployments/{id}/metrics` (researcher); `DELETE /v1/runtime_cache` (administrator).

- [ ] **Step 1: Add failing tests** to `viewer-service/tests/test_identity_gate.py`

```python
def test_export_and_metrics_require_researcher(client, auth_header):
    c = _noauth(client)
    dep = c.post("/v1/deployments", json=_DEP_BODY, headers=auth_header(["researcher"]))
    dep_id = dep.json()["deployment_id"]
    assert c.get(f"/v1/deployments/{dep_id}/export.csv").status_code == 401
    assert c.get(f"/v1/deployments/{dep_id}/metrics").status_code == 401
    assert c.get(f"/v1/deployments/{dep_id}/export.csv", headers=auth_header(["researcher"])).status_code == 200
    assert c.get(f"/v1/deployments/{dep_id}/metrics", headers=auth_header(["reviewer"])).status_code == 200


def test_runtime_cache_purge_requires_admin(client, auth_header):
    c = _noauth(client)
    assert c.delete("/v1/runtime_cache").status_code == 401
    assert c.delete("/v1/runtime_cache", headers=auth_header(["researcher"])).status_code == 403   # not admin
    assert c.delete("/v1/runtime_cache", headers=auth_header(["administrator"])).status_code == 200
```

- [ ] **Step 2: Run to verify the new cases fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py -q`
Expected: FAIL (export/metrics/purge respond without a token; researcher purge returns 200 instead of 403).

- [ ] **Step 3: Gate `export.py` + `metrics.py`**

In each file add `from .identity import require_researcher` and append `, claims=Depends(require_researcher)` to the single route signature. Confirm `Depends` is imported from fastapi (add `from fastapi import Depends` to the import line if absent).

- [ ] **Step 4: Gate `admin.py` to administrator**

Replace the body of `viewer-service/src/viewer_service/api/admin.py` with:

```python
from fastapi import APIRouter, Depends
from .deps import get_conn
from .identity import require_admin
from ..store import runtime_cache as cache

router = APIRouter()


@router.delete("/runtime_cache")
def purge(deployment_id: str | None = None, conn=Depends(get_conn),
          claims=Depends(require_admin)):
    n = cache.purge(conn, deployment_id=deployment_id)
    return {"purged": n}
```

- [ ] **Step 5: Update the existing purge test** (`viewer-service/tests/test_runtime_cache.py`)

Find the call that does `client.delete("/v1/runtime_cache"...)`. Add an admin token: change it to `client.delete("/v1/runtime_cache", headers=auth_header(["administrator"]))` and add `auth_header` to that test function's parameters. (The default `client` carries only a researcher token, which now gets 403 on this admin route.)

- [ ] **Step 6: Run gate + export + metrics + runtime_cache suites**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_identity_gate.py viewer-service/tests/test_export_api.py viewer-service/tests/test_metrics_api.py viewer-service/tests/test_runtime_cache.py -q`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/api/export.py viewer-service/src/viewer_service/api/metrics.py viewer-service/src/viewer_service/api/admin.py viewer-service/tests/test_identity_gate.py viewer-service/tests/test_runtime_cache.py
git commit -m "feat(vs): gate export+metrics to researcher, runtime_cache purge to administrator"
```

---

### Task 6: Full-suite gate + docs (README + FOLLOWUPS)

**Files:**
- Modify: `viewer-service/README.md` (document the gate + IDENTITY_* env)
- Modify: `viewer-service/FOLLOWUPS.md` (resolve the OD-08 marker; record deferred items)

**Interfaces:** none (docs + the deliverable gate).

- [ ] **Step 1: Run the ENTIRE viewer-service suite (the deliverable gate)**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: ALL tests pass (every prior suite + `test_identity_dep.py` + `test_identity_gate.py`). If any pre-existing test fails, it is a control-plane setup call that lost its default token (e.g. a test that built its own `TestClient` without the default header, or popped the header) — fix by attaching `auth_header(["researcher"])` to that call. Capture the total count.

- [ ] **Step 2: Confirm the participant path is still anonymous**

Confirm (by reading the diff, not by code change) that `api/sessions.py`, `api/submission.py`, `api/scoring.py`, and `api/scorers.py` were NOT modified — the participant session path and `GET /scorers/{ref}/impl.wasm` carry no Identity dependency. State this in the report.

- [ ] **Step 3: Update `viewer-service/README.md`**

Add a short "Authentication" section documenting: the control-plane (deployment CRUD, viewer registry, theme writes, runtime mint, export.csv, metrics) requires an Identity access token with any of `{researcher, reviewer, administrator}`; `DELETE /runtime_cache` requires `administrator`; the participant `/sessions/*` path and `GET /scorers/.../impl.wasm` stay anonymous. Document the env vars `IDENTITY_JWKS_URL`, `IDENTITY_ISSUER`, `IDENTITY_AUDIENCE` (default `questionnaire-apps`) and that a token is obtained from the sibling `identity-service` (`identity create-admin` then login).

- [ ] **Step 4: Update `viewer-service/FOLLOWUPS.md`**

Mark the OD-08 auth marker resolved for the control-plane, and record the deferred items: (a) per-record ownership is not enforced — any authorized researcher operates on any deployment; revisit when projects exist (ID-D); (b) `editor_session`/`platform_session` deployment-auth-dimension enforcement at `/sessions/new` is still deferred (their `mode_preset`s remain 422) — ID-D (editor) / Phase 5 (platform); (c) the JwksCache has no proactive refresh/health endpoint — acceptable (lazy + kid-miss refetch from ID-A's client).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md
git commit -m "docs(vs): document Identity gate + IDENTITY_* env; record ID-B FOLLOWUPS; ID-B complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 hard-gate / no bypass → Task 1 (config + deps, no toggle). ✓
- §2 audience `questionnaire-apps` + issuer/JWKS config → Task 1 config. ✓
- §2 roles any-of {researcher,reviewer,administrator}; admin for purge → Task 1 (`_RESEARCH_ROLES`, `require_admin`), Tasks 3–5 application. ✓
- §2 `created_by` = sub, no ownership enforcement → Task 3 (created_by) + Task 6 FOLLOWUP. ✓
- §3 new `api/identity.py` unit + config fields + dependency wiring (pyjwt + identity_service) → Task 1. ✓
- §4 every listed control-plane endpoint gated; participant path + scorers + healthz untouched → Tasks 3 (deployments/runtime), 4 (viewers/themes), 5 (export/metrics/admin); Task 6 Step 2 verifies the untouched set. ✓
- §5 401 missing/invalid, 403 wrong role → Task 1 `_claims`/role checks; tested across Tasks 1,3,4,5. ✓
- §6 fake-JWKS + signed test tokens; default researcher client; per-route 401/403/200; created_by; full suite green; the fixture-churn note → Task 2 (infra) + Tasks 3–5 (gate tests) + Task 6 (full gate). ✓
- §7 deliverable gate (every endpoint 401/403/ok; participant anonymous; whole suite green; no identity-service changes) → Task 6. ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Every step has concrete code or an exact edit instruction. The per-route edits name the exact file + signature change + the import to add.

**3. Type consistency:** `require_researcher`/`require_admin`/`install_test_cache` (Task 1) are consumed verbatim in Tasks 2–5. `auth_header(roles, *, sub=...)` and `id_key=(kid,jwk,pem)` (Task 2) are used consistently in Tasks 3–5. `_noauth(client)`/`_DEP_BODY`/`BUNDLE` are defined in Task 3's `test_identity_gate.py` and reused (same module) in Tasks 4–5. `created_by=claims["sub"]` (Task 3) matches the `created_by` store field confirmed present. The `client` fixture's `headers=` default + per-request override behavior is the load-bearing mechanism and is consistent across the plan.

One risk flagged for execution: a few existing tests may construct their own `TestClient` (not the shared fixture) or hit a control-plane route in a way the default header doesn't cover — Task 6 Step 1 is the catch-all that surfaces and fixes any such straggler by attaching `auth_header(["researcher"])`.
