# PP-B — Signed invite links — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a researcher generate tamper-proof per-participant invite links for a deployment; opening one runs the questionnaire under that participant code with no login and no data recovery.

**Architecture:** The Viewer Service mints + verifies HMAC-SHA256 invite tokens (Identity stays frozen). A new `invite_link` deployment mode requires a valid invite at `POST /v1/sessions/new` and tags the session with `participant_sub = "invite:" + code` / `agent_id = code`. The Web Viewer reads `?invite=` and shows a clear error for an invalid invite (no login screen).

**Tech Stack:** viewer-service (FastAPI, raw psycopg3, stdlib hmac/hashlib/base64), web-viewer (Vite/React19/TS, vitest), testcontainers Postgres. Reuses PP-A's `participant_sub` + ID-B's `require_researcher`.

## Global Constraints

- Invite token = `base64url(payload_json).base64url(hmac_sha256(secret, payload_b64))`; payload = `{"participant_id":<str>, "deployment_id":<str>, "exp":<unix int>}` (compact, sort_keys). Verification: `hmac.compare_digest` on the signature, `exp` in the future, `deployment_id` matches; returns the payload or `None` (never raises).
- New deployment preset `invite_link` → dimensions `{auth: "invite", persistence: "persisted", lifecycle: "standard", rendering_context: "standalone"}`. Existing `anonymous_link`/`demo`/`authenticated` unchanged; an `invite` field is ignored on non-`invite` deployments.
- For an invite session: `participant_sub = "invite:" + payload["participant_id"]` (namespaced — must never collide with an Identity sub), `agent_id = payload["participant_id"]` (raw), `session_index = count_for_agent(agent_id) + 1`.
- `INVITE_SIGNING_SECRET` (env, default `""`). When empty: the invite-mint endpoint returns `503 invites_unavailable` and `verify_invite` returns `None` (fail closed). Default invite TTL = `INVITE_DEFAULT_TTL_SECONDS` (default 2592000 = 30 days).
- `POST /v1/deployments/{id}/invites` is researcher-gated (ID-B `require_researcher`). `POST /v1/sessions/new` gains `invite?: str`; for an `invite_link` deployment a missing/invalid invite → `401 {"error":{"code":"invite_required",...}}` (explicit JSONResponse). New web-viewer `MintErr` kind `invite_invalid`.
- Raw psycopg3, no ORM, no new tables/columns (invites are stateless; reuse `session.participant_sub`). VS tests: own pytest invocation, `DOCKER_CONFIG=/tmp/lib_docker`. venv uv-managed (`.venv/bin/python -m pytest`/`-m pip`). web-viewer: `cd web-viewer && npm test`.
- No changes to `identity-service/` (frozen). TDD; commit after each green step.
- Spec: `docs/superpowers/specs/2026-06-22-participant-pp-b-design.md`.

---

### Task 1: VS invite token primitives (`invites.py`) + config secret

**Files:**
- Modify: `viewer-service/src/viewer_service/config.py`
- Create: `viewer-service/src/viewer_service/invites.py`
- Create: `viewer-service/tests/test_invites.py`

**Interfaces:**
- Produces: `Settings.invite_signing_secret: str`, `Settings.invite_default_ttl_seconds: int`;
  `invites.mint_invite(secret, *, participant_id, deployment_id, ttl, now=None) -> str`;
  `invites.verify_invite(secret, token, *, deployment_id, now=None) -> dict | None`.

- [ ] **Step 1: Add config** to `config.py` — add to the `Settings` dataclass (after `identity_audience`):

```python
    invite_signing_secret: str = ""
    invite_default_ttl_seconds: int = 2_592_000
```

and to `get_settings()` (after the `identity_audience=...` line):

```python
        invite_signing_secret=os.environ.get("INVITE_SIGNING_SECRET", ""),
        invite_default_ttl_seconds=int(os.environ.get("INVITE_DEFAULT_TTL_SECONDS", "2592000")),
```

- [ ] **Step 2: Write the failing test** (`viewer-service/tests/test_invites.py`)

```python
import time
from viewer_service.invites import mint_invite, verify_invite

SECRET = "test-secret"


def _tok(**kw):
    kw.setdefault("participant_id", "P-1")
    kw.setdefault("deployment_id", "dep_1")
    kw.setdefault("ttl", 3600)
    return mint_invite(SECRET, **kw)


def test_mint_verify_roundtrip():
    tok = _tok()
    payload = verify_invite(SECRET, tok, deployment_id="dep_1")
    assert payload is not None
    assert payload["participant_id"] == "P-1" and payload["deployment_id"] == "dep_1"
    assert payload["exp"] > int(time.time())


def test_wrong_deployment_rejected():
    assert verify_invite(SECRET, _tok(), deployment_id="dep_OTHER") is None


def test_expired_rejected():
    tok = _tok(ttl=1, now=int(time.time()) - 10)
    assert verify_invite(SECRET, tok, deployment_id="dep_1") is None


def test_tampered_payload_rejected():
    tok = _tok()
    payload_b64, _, sig = tok.partition(".")
    flipped = payload_b64[:-1] + ("A" if payload_b64[-1] != "A" else "B")
    assert verify_invite(SECRET, f"{flipped}.{sig}", deployment_id="dep_1") is None


def test_tampered_signature_rejected():
    tok = _tok()
    payload_b64, _, sig = tok.partition(".")
    bad = sig[:-1] + ("A" if sig[-1] != "A" else "B")
    assert verify_invite(SECRET, f"{payload_b64}.{bad}", deployment_id="dep_1") is None


def test_wrong_secret_rejected():
    assert verify_invite("other-secret", _tok(), deployment_id="dep_1") is None


def test_garbage_and_empty():
    assert verify_invite(SECRET, "not-a-token", deployment_id="dep_1") is None
    assert verify_invite(SECRET, "", deployment_id="dep_1") is None
    assert verify_invite(SECRET, None, deployment_id="dep_1") is None


def test_empty_secret_fails_closed():
    tok = _tok()
    assert verify_invite("", tok, deployment_id="dep_1") is None
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest viewer-service/tests/test_invites.py -q`
Expected: FAIL (`ModuleNotFoundError: viewer_service.invites`).

- [ ] **Step 4: Write `invites.py`**

```python
import base64
import hashlib
import hmac
import json
import time


def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _b64u_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(secret: str, payload_b64: str) -> str:
    mac = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return _b64u(mac)


def mint_invite(secret: str, *, participant_id: str, deployment_id: str, ttl: int,
                now: int | None = None) -> str:
    iat = int(time.time()) if now is None else now
    payload = {"participant_id": participant_id, "deployment_id": deployment_id, "exp": iat + ttl}
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{payload_b64}.{_sign(secret, payload_b64)}"


def verify_invite(secret: str, token: str | None, *, deployment_id: str,
                  now: int | None = None) -> dict | None:
    """Return the payload iff the HMAC, exp, and deployment_id all check out, else None.
    Never raises. Fails closed on an empty secret."""
    if not secret or not token or "." not in token:
        return None
    payload_b64, _, sig = token.partition(".")
    try:
        if not hmac.compare_digest(sig, _sign(secret, payload_b64)):
            return None
        payload = json.loads(_b64u_decode(payload_b64))
    except Exception:
        return None
    t = int(time.time()) if now is None else now
    if not isinstance(payload, dict) or payload.get("deployment_id") != deployment_id:
        return None
    if not isinstance(payload.get("exp"), int) or payload["exp"] <= t:
        return None
    if not payload.get("participant_id"):
        return None
    return payload
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && .venv/bin/python -m pytest viewer-service/tests/test_invites.py -q`
Expected: 8 passed.

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/config.py viewer-service/src/viewer_service/invites.py viewer-service/tests/test_invites.py
git commit -m "feat(vs): HMAC invite token mint/verify + INVITE_SIGNING_SECRET config"
```

---

### Task 2: `invite_link` mode + researcher invite-mint endpoint

**Files:**
- Modify: `viewer-service/src/viewer_service/modes.py`
- Modify: `viewer-service/src/viewer_service/models.py` (`InviteCreate`)
- Create: `viewer-service/src/viewer_service/api/invites.py`
- Modify: `viewer-service/src/viewer_service/api/app.py` (include router)
- Create: `viewer-service/tests/test_invites_api.py`

**Interfaces:**
- Consumes: `invites.mint_invite`, `require_researcher`, `store.deployments.get_deployment`, `get_settings`, the conftest `auth_header`/`client`.
- Produces: `modes.PRESETS["invite_link"]`; `models.InviteCreate{participant_id:str, ttl_seconds:int|None=None}`; route `POST /v1/deployments/{deployment_id}/invites`.

- [ ] **Step 1: Add the preset to `modes.py`** — add to `PRESETS`:

```python
    "invite_link": {"auth": "invite", "persistence": "persisted",
                    "lifecycle": "standard", "rendering_context": "standalone"},
```

- [ ] **Step 2: Add `InviteCreate` to `models.py`**

```python
class InviteCreate(BaseModel):
    participant_id: str
    ttl_seconds: int | None = None
```

- [ ] **Step 3: Write the failing test** (`viewer-service/tests/test_invites_api.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod

BUNDLE = {
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
_MANIFEST = {"viewer_id": "web", "viewer_version": "v26.0610",
             "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
             "evaluator": {"language_version": "v1.0", "functions": ["if"]},
             "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}


@pytest.fixture
def invite_dep(client, monkeypatch):
    monkeypatch.setenv("INVITE_SIGNING_SECRET", "test-secret")
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"],
        "mode_preset": "invite_link"}).json()
    return client, dep["deployment_id"]


def test_mint_invite_returns_token_and_url(invite_dep):
    client, dep_id = invite_dep
    r = client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "P-42"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_id"] == "P-42" and body["deployment_id"] == dep_id
    assert "." in body["invite_token"] and f"invite={body['invite_token']}" in body["url"]


def test_mint_requires_researcher(invite_dep):
    client, dep_id = invite_dep
    client.headers.pop("authorization", None)            # strip the default researcher token
    assert client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "P"}).status_code == 401


def test_unknown_deployment_404(invite_dep):
    client, _ = invite_dep
    assert client.post("/v1/deployments/dep_nope/invites", json={"participant_id": "P"}).status_code == 404


def test_empty_participant_id_422(invite_dep):
    client, dep_id = invite_dep
    assert client.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "  "}).status_code == 422


def test_invites_unavailable_without_secret(client, monkeypatch):
    monkeypatch.delenv("INVITE_SIGNING_SECRET", raising=False)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=_MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"], "mode_preset": "invite_link"}).json()
    r = client.post(f"/v1/deployments/{dep['deployment_id']}/invites", json={"participant_id": "P"})
    assert r.status_code == 503 and r.json()["error"]["code"] == "invites_unavailable"
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_invites_api.py -q`
Expected: FAIL (404 / unsupported preset / missing router).

- [ ] **Step 5: Write `api/invites.py`**

```python
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn
from .identity import require_researcher
from ..config import get_settings
from ..models import InviteCreate
from .. import invites as invites_svc
from ..store import deployments as dep_store

router = APIRouter()


@router.post("/deployments/{deployment_id}/invites", status_code=201)
def create_invite(deployment_id: str, body: InviteCreate, conn=Depends(get_conn),
                  claims=Depends(require_researcher)):
    s = get_settings()
    if not s.invite_signing_secret:
        return JSONResponse(status_code=503, content={"error": {
            "code": "invites_unavailable", "message": "INVITE_SIGNING_SECRET is not configured"}})
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    pid = (body.participant_id or "").strip()
    if not pid:
        raise HTTPException(status_code=422, detail="participant_id must not be empty")
    ttl = body.ttl_seconds or s.invite_default_ttl_seconds
    token = invites_svc.mint_invite(s.invite_signing_secret, participant_id=pid,
                                    deployment_id=deployment_id, ttl=ttl)
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=ttl)).isoformat()
    base = s.public_base_url
    url = (f"{base}/?deployment={deployment_id}&invite={token}" if base
           else f"?deployment={deployment_id}&invite={token}")
    return {"invite_token": token, "participant_id": pid, "deployment_id": deployment_id,
            "expires_at": expires_at, "url": url}
```

- [ ] **Step 6: Include the router in `api/app.py`** — add to the router imports + includes (alongside the others):

```python
    from . import invites as invites_routes
    app.include_router(invites_routes.router, prefix="/v1")
```

(Match the file's existing import/include style — it imports the route modules inside `create_app` and calls `app.include_router(<mod>.router, prefix="/v1")`.)

- [ ] **Step 7: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_invites_api.py -q`
Expected: 5 passed.

- [ ] **Step 8: Commit**

```bash
git add viewer-service/src/viewer_service/modes.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/api/invites.py viewer-service/src/viewer_service/api/app.py viewer-service/tests/test_invites_api.py
git commit -m "feat(vs): invite_link deployment mode + researcher invite-mint endpoint"
```

---

### Task 3: Session-mint invite path

**Files:**
- Modify: `viewer-service/src/viewer_service/models.py` (`SessionNew.invite`)
- Modify: `viewer-service/src/viewer_service/sessions.py` (`new_session` invite branch)
- Modify: `viewer-service/src/viewer_service/api/sessions.py` (verify invite + 401)
- Create: `viewer-service/tests/test_invite_session.py`

**Interfaces:**
- Consumes: `invites.verify_invite`, `store.sessions.count_for_agent`, `get_settings`, conftest fixtures.
- Produces: `SessionNew.invite: str | None`; `new_session(..., invite_payload: dict | None = None)`; `POST /v1/sessions/new` honoring `auth: "invite"` (401 `invite_required` / tagged session `participant_sub="invite:"+code`).

- [ ] **Step 1: Add the field to `SessionNew` in `models.py`** — add `invite: str | None = None` to the `SessionNew` model.

- [ ] **Step 2: Write the failing test** (`viewer-service/tests/test_invite_session.py`)

```python
import pytest
import viewer_service.runtime as runtime_mod
from viewer_service.invites import mint_invite

SECRET = "test-secret"
BUNDLE = {  # minimal resolvable bundle
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
_MANIFEST = {"viewer_id": "web", "viewer_version": "v26.0610",
             "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
             "evaluator": {"language_version": "v1.0", "functions": ["if"]},
             "widgets": ["choice.ordinal.single"], "logic_actions": [], "scorer_impl_kinds": ["wasm"]}


def _make_dep(client, preset="invite_link"):
    client.post("/v1/viewers", json=_MANIFEST)
    return client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"], "mode_preset": preset}).json()["deployment_id"]


@pytest.fixture
def invite_env(client, monkeypatch):
    monkeypatch.setenv("INVITE_SIGNING_SECRET", SECRET)
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    return client


def _mint_session(client, dep_id, invite=None):
    body = {"deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"}
    if invite is not None:
        body["invite"] = invite
    return client.post("/v1/sessions/new", json=body)


def test_invite_deploy_requires_invite(invite_env):
    dep_id = _make_dep(invite_env)
    r = _mint_session(invite_env, dep_id)
    assert r.status_code == 401 and r.json()["error"]["code"] == "invite_required"


def test_invalid_invite_rejected(invite_env):
    dep_id = _make_dep(invite_env)
    assert _mint_session(invite_env, dep_id, "garbage").status_code == 401


def test_valid_invite_tags_session(invite_env):
    dep_id = _make_dep(invite_env)
    tok = mint_invite(SECRET, participant_id="P-7", deployment_id=dep_id, ttl=3600)
    r = _mint_session(invite_env, dep_id, tok)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["participant_sub"] == "invite:P-7" and body["agent_id"] == "P-7"
    assert body["session_index"] == 1


def test_returning_code_increments_index(invite_env):
    dep_id = _make_dep(invite_env)
    tok = mint_invite(SECRET, participant_id="P-8", deployment_id=dep_id, ttl=3600)
    _mint_session(invite_env, dep_id, tok)
    second = _mint_session(invite_env, dep_id, tok).json()
    assert second["session_index"] == 2 and second["participant_sub"] == "invite:P-8"


def test_cross_deployment_invite_rejected(invite_env):
    dep_a = _make_dep(invite_env)
    dep_b = _make_dep(invite_env)
    tok_for_a = mint_invite(SECRET, participant_id="P", deployment_id=dep_a, ttl=3600)
    assert _mint_session(invite_env, dep_b, tok_for_a).status_code == 401


def test_invite_ignored_on_anonymous_deploy(invite_env):
    dep_id = _make_dep(invite_env, preset="anonymous_link")
    tok = mint_invite(SECRET, participant_id="P", deployment_id=dep_id, ttl=3600)
    r = _mint_session(invite_env, dep_id, tok)                # invite present but mode=none
    assert r.status_code == 201 and r.json()["participant_sub"] is None
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_invite_session.py -q`
Expected: FAIL (invite_link mints without an invite / no participant_sub tagging).

- [ ] **Step 4: Extend `new_session` in `sessions.py`** — add the `invite_payload` param and an `invite` branch. Change the signature + the identity-branch block:

```python
def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None, participant_claims: dict | None = None,
                invite_payload: dict | None = None) -> dict:
```

Replace the existing `auth_mode` if/else block with:

```python
    auth_mode = (deployment.get("dimensions") or {}).get("auth", "none")
    if auth_mode == "identity" and participant_claims is not None:
        participant_sub = participant_claims["sub"]
        agent_id = participant_sub
        session_index = session_store.count_for_agent(conn, agent_id) + 1
    elif auth_mode == "invite" and invite_payload is not None:
        agent_id = invite_payload["participant_id"]
        participant_sub = "invite:" + agent_id
        session_index = session_store.count_for_agent(conn, agent_id) + 1
    else:
        participant_sub = None
        agent_id = "agent_" + uuid.uuid4().hex[:8]
        session_index = 1
```

(The rest of `new_session` — `insert_session(..., participant_sub=participant_sub, ..., agent_id=agent_id, session_index=session_index, ...)` and the return dict including `participant_sub` — is unchanged from PP-A.)

- [ ] **Step 5: Verify the invite in the `new` handler (`api/sessions.py`)** — add the invites import + the `invite` branch. Add at the top:

```python
from ..config import get_settings
from .. import invites as invites_svc
```

Replace the auth-dimension block (the PP-A `if (dep.get("dimensions") or {}).get("auth") == "identity":` block) with:

```python
    auth = (dep.get("dimensions") or {}).get("auth")
    participant_claims = None
    invite_payload = None
    if auth == "identity":
        participant_claims = identity.verify_participant(authorization)
        if participant_claims is None:
            return JSONResponse(status_code=401, content={"error": {
                "code": "auth_required", "message": "this deployment requires participant login"}})
    elif auth == "invite":
        invite_payload = invites_svc.verify_invite(
            get_settings().invite_signing_secret, body.invite, deployment_id=body.deployment_id)
        if invite_payload is None:
            return JSONResponse(status_code=401, content={"error": {
                "code": "invite_required", "message": "this deployment requires a valid invite link"}})
```

and change the `new_session(...)` call inside the `try` to pass both:

```python
        return sessions_svc.new_session(conn, dep, viewer, body.viewer_id, body.viewer_version,
                                        body.locale, participant_claims, invite_payload)
```

- [ ] **Step 6: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_invite_session.py viewer-service/tests/test_pp_session_auth.py viewer-service/tests/test_sessions_api.py -q`
Expected: all pass (the new invite tests + PP-A's identity tests + the anonymous session tests — confirming the three auth modes coexist).

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/sessions.py viewer-service/src/viewer_service/api/sessions.py viewer-service/tests/test_invite_session.py
git commit -m "feat(vs): invite_link session mint — verify invite, tag participant_sub=invite:<code>"
```

---

### Task 4: Web Viewer — `?invite=` support + invalid-invite error

**Files:**
- Modify: `web-viewer/src/app/bootstrap.ts`
- Modify: `web-viewer/src/app/chrome/strings.ts`
- Modify: `web-viewer/src/app/chrome/ErrorScreen.tsx`
- Modify: `web-viewer/src/app/App.tsx`
- Modify: `web-viewer/src/app/bootstrap.test.ts`
- Modify: `web-viewer/src/app/chrome/ErrorScreen.test.tsx` (create if absent)

**Interfaces:**
- Produces: `parseParams(...).invite: string | null`; `mintSession(vsBaseUrl, deploymentId, locale, accessToken?, invite?)` (adds `invite` to the body when present); `MintErr` kind gains `'invite_invalid'`; `ErrorScreen` + strings handle `invite_invalid`.

- [ ] **Step 1: Write the failing tests** (append to `web-viewer/src/app/bootstrap.test.ts`)

```typescript
test('parseParams reads invite', () => {
  expect(parseParams('?deployment=d&invite=abc.def').invite).toBe('abc.def')
})

test('mintSession sends invite in the body when given', async () => {
  const ok = { session_id: 's', session_token: 't', agent_id: 'P-1', session_index: 1,
               runtime: {}, theme: null, ephemeral: false, participant_sub: 'invite:P-1' }
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)
  await mintSession('http://vs', 'dpl_1', null, undefined, 'tok.sig')
  const [, init] = fetchMock.mock.calls[0]
  expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({ invite: 'tok.sig' })
})

test('mintSession maps 401 invite_required to kind invite_invalid', async () => {
  const body = { error: { code: 'invite_required', message: 'bad invite' } }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 401 })))
  const res = await mintSession('http://vs', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind: 'invite_invalid', code: 'invite_required' })
})
```

And add an ErrorScreen test (`web-viewer/src/app/chrome/ErrorScreen.test.tsx` — if the file exists, append; else create it mirroring the project's render-test style):

```typescript
import { test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorScreen } from './ErrorScreen'

test('ErrorScreen renders the invite_invalid message', () => {
  render(<ErrorScreen locale="en" kind="invite_invalid" code="invite_required" onRetry={() => {}} />)
  expect(screen.getByRole('heading')).toBeInTheDocument()
  // the invite_invalid title string is shown (not a crash / missing key)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- bootstrap ErrorScreen`
Expected: FAIL (`invite` undefined; 401 invite_required maps to `failed`; ErrorScreen has no `invite_invalid` key).

- [ ] **Step 3: Update `bootstrap.ts`**

In `Params` add `invite: string | null`; in `parseParams` return add `invite: q.get('invite'),`.

Widen the `MintErr` kind union to include `'invite_invalid'`:

```typescript
export type MintErr = { ok: false; kind: 'invalid_link' | 'not_open' | 'closed' | 'auth_required' | 'invite_invalid' | 'failed'; code: string }
```

Update `mintSession` to take a 5th `invite?` param, add it to the body when present, and map the new code. Signature + body + error mapping:

```typescript
export async function mintSession(vsBaseUrl: string, deploymentId: string, locale: string | null, accessToken?: string, invite?: string): Promise<MintResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/sessions/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        deployment_id: deploymentId, viewer_id: VIEWER_ID, viewer_version: VIEWER_VERSION,
        ...(locale ? { locale } : {}),
        ...(invite ? { invite } : {}),
      }),
    })
  } catch {
    return { ok: false, kind: 'failed', code: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, session_id: body.session_id, session_token: body.session_token, agent_id: body.agent_id, session_index: body.session_index, runtime: body.runtime, theme: body.theme ?? null, ephemeral: body.ephemeral ?? false, participant_sub: body.participant_sub ?? null }
  }
  const code = await resp.json().then((b) => b?.error?.code ?? String(resp.status)).catch(() => String(resp.status))
  const kind: MintErr['kind'] =
    code === 'auth_required' ? 'auth_required' :
    code === 'invite_required' ? 'invite_invalid' :
    (KIND_BY_STATUS[resp.status] ?? 'failed')
  return { ok: false, kind, code }
}
```

- [ ] **Step 4: Add the strings** in `web-viewer/src/app/chrome/strings.ts` — mirror the existing `error_failed_title`/`error_failed_body` entries: add `error_invite_invalid_title` and `error_invite_invalid_body` keys to EACH locale block (the file has `en` and `pt`). English: title `"Invalid or expired link"`, body `"This invite link is invalid or has expired. Ask the person who sent it for a new link."`. Add a Portuguese equivalent matching the file's other `pt` error strings (e.g. title `"Ligação inválida ou expirada"`, body `"Este link de convite é inválido ou expirou. Peça um novo link a quem o enviou."`).

- [ ] **Step 5: Handle `invite_invalid` in `ErrorScreen.tsx`** — add the key to both maps:

```typescript
const TITLE_KEY = { invalid_link: 'error_invalid_link_title', not_open: 'error_not_open_title', closed: 'error_closed_title', failed: 'error_failed_title', invite_invalid: 'error_invite_invalid_title' } as const
const BODY_KEY = { invalid_link: 'error_invalid_link_body', not_open: 'error_not_open_body', closed: 'error_closed_body', failed: 'error_failed_body', invite_invalid: 'error_invite_invalid_body' } as const
```

(`ErrorKind = Exclude<MintErr['kind'], 'auth_required'>` already includes `invite_invalid`, so no type change is needed there or in `session.ts`.)

- [ ] **Step 6: Pass the invite into the mint in `App.tsx`** — change the `mintSession(...)` call (the one at ~line 171) to pass `params.invite ?? undefined` as the 5th argument:

```typescript
mintSession(params.vsBaseUrl, params.deploymentId, params.locale, accessTokenRef.current, params.invite ?? undefined)
```

No other App.tsx change: an `invite_invalid` mint is `!res.ok` and not `auth_required`, so it flows through the existing `dispatch({ type: 'boot_error', kind: res.kind as ..., code: res.code })` path to the ErrorScreen.

- [ ] **Step 7: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- bootstrap ErrorScreen`
Expected: the new bootstrap + ErrorScreen tests pass.

- [ ] **Step 8: Commit**

```bash
git add web-viewer/src/app/bootstrap.ts web-viewer/src/app/chrome/strings.ts web-viewer/src/app/chrome/ErrorScreen.tsx web-viewer/src/app/App.tsx web-viewer/src/app/bootstrap.test.ts web-viewer/src/app/chrome/ErrorScreen.test.tsx
git commit -m "feat(web-viewer): ?invite= support + invalid-invite error screen"
```

---

### Task 5: Full-suite gate + docs

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`

- [ ] **Step 1: Run the full VS suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pass (existing + the 3 new PP-B test files). If a pre-existing modes test asserts the exact `SUPPORTED` set, update it to include `invite_link` (additive). Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean tsc build (the `invite_invalid` kind must be handled in ErrorScreen for tsc to pass — verify). Capture totals.

- [ ] **Step 3: Update `viewer-service/README.md` + `FOLLOWUPS.md`.** README: document the `invite_link` mode; `POST /v1/deployments/{id}/invites` (researcher) → a signed invite + shareable `url`; `POST /v1/sessions/new` with `invite` tags the session `participant_sub=invite:<code>`; `INVITE_SIGNING_SECRET`/`INVITE_DEFAULT_TTL_SECONDS` config; invites are stateless signed tokens (multi-use until expiry). FOLLOWUPS: single-use invites (needs a consumed-invite table); bulk invite generation; "attach an account to recover data" upgrade for invite participants.

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md`.** README: document `?invite=<token>` (an invite link runs the questionnaire with no login; an invalid/expired invite shows an error). FOLLOWUPS: invite participants can't recover data (no account — by design, PP-C is account-only).

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md
git commit -m "docs(pp): document signed invite links (invite_link mode + ?invite=); record PP-B FOLLOWUPS; PP-B complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 HMAC invite format + verify (sig/exp/deployment) → Task 1 (`invites.py`) + tests. ✓
- §2 `invite_link` preset (`auth: invite`) → Task 2 (modes) + Task 3 (session honoring). ✓
- §2 `participant_sub="invite:"+code`, `agent_id=code`, `session_index=count+1` → Task 3 (`new_session` branch) + tests. ✓
- §2 `INVITE_SIGNING_SECRET` fail-closed (503 mint / None verify) → Task 1 (config + verify) + Task 2 (503) + tests. ✓
- §2 invite in URL; destination on deployment → Task 2 (`url`) + Task 4 (`?invite=`). ✓
- §3 config / invites.py / modes / api invites / models / new_session / handler / app router → Tasks 1,2,3. ✓
- §3 web-viewer bootstrap invite + invite_invalid + App pass-through + ErrorScreen → Task 4. ✓
- §5 endpoints (POST invites researcher-gated 404/422/503/201; sessions/new invite 401/201) → Tasks 2,3. ✓
- §6 security (compare_digest, exp, deployment binding, secret-never-leaves, namespaced participant_sub) → Task 1 + Task 3 + tests (tamper/expired/cross-deployment). ✓
- §7 testing (invites unit; api; session matrix; web-viewer) → Tasks 1–4. ✓
- §8 deliverable gate → Task 5. ✓
- §1 out-of-scope honored (no single-use table, no bulk, no account-upgrade, no PP-C, no identity-service change). ✓

**2. Placeholder scan:** No TBD/"add validation"/"similar to". Strings (Task 4 Step 4) give the exact English text + a concrete pt suggestion + the rule "mirror the existing error_* entries" — concrete, not a placeholder. Every code step has complete code or an exact edit.

**3. Type consistency:** `mint_invite`/`verify_invite` signatures (Task 1) used verbatim in Tasks 2 (mint) + 3 (verify) + the tests. `InviteCreate{participant_id, ttl_seconds?}` (Task 2) matches the endpoint. `SessionNew.invite` (Task 3) matches the handler reading `body.invite`. `new_session(..., participant_claims=None, invite_payload=None)` (Task 3) matches the handler call passing both positionally. `mintSession(...accessToken?, invite?)` + `MintErr` kind `invite_invalid` (Task 4) match App.tsx's call + ErrorScreen's `ErrorKind`. `participant_sub`/`agent_id` semantics consistent with PP-A. Consistent.

One execution note for Task 3: `new_session`'s call site in `api/sessions.py` must pass `participant_claims` and `invite_payload` positionally in that order (matching the new signature) — both default to `None`, so the anonymous and identity paths (which leave one or both `None`) keep working.
