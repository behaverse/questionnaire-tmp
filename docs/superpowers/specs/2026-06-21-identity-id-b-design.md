# ID-B — Gate the Viewer Service control-plane with Identity (design)

**Date:** 2026-06-21
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `viewer-service/` (modify) + consumes `identity-service/` (ID-A, frozen)
**Decision basis:** OD-08; ID-A decomposition (see [[project_identity_roadmap]]). ID-B is the second
Identity slice: it makes the Viewer Service authenticate its researcher/admin control-plane against
Identity-issued access tokens.

---

## 0. Context

The Viewer Service (`viewer-service/`, VS-A..E, built + merged) exposes two kinds of HTTP surface:

- **Participant data path** — `POST /v1/sessions/new` + `GET/POST /v1/sessions/{id}/*`
  (responses, events, complete, runtime, locale, scorer_outputs). These are anonymous-participant
  flows already gated by an **opaque session token** (`require_session` Bearer, SHA-256-hashed). They
  must **stay anonymous** — participants never authenticate via Identity.
- **Researcher/admin control-plane** — viewer registry, deployment CRUD, runtime mint, theme
  writes/reads, export.csv, metrics, and the `DELETE /runtime_cache` admin purge. These are
  **currently wide-open / unauthenticated** (`viewer-service/FOLLOWUPS.md`: "All VS-A endpoints —
  including `DELETE /runtime_cache` — are unauthenticated. Gate them once the Identity sibling lands
  (OD-08); admin purge and deployment CRUD are researcher-only operations.").

VS is built but **not deployed** (only the Library is live in Phase 1), so gating the control-plane
breaks no live participant traffic.

ID-B gates the control-plane using ID-A's reusable `identity_client` verifier. It does **not** touch
the participant path, and it does **not** enforce the deferred deployment auth dimensions
(`editor_session`, `platform_session`) at session-mint — those need the Editor (ID-D) and the
Participant Platform (Phase 5) respectively, and their `mode_preset`s stay rejected (422) as today.

---

## 1. Scope (locked)

**In scope:** require an Identity access token carrying an appropriate role on every
researcher/admin control-plane endpoint; record the authenticated user on deployment create.

**Out of scope:** per-record ownership enforcement; `editor_session`/`platform_session` mint-time
enforcement; access-code deployments; any change to `identity-service/` (ID-A is frozen); changing
the participant session-token mechanism.

---

## 2. Decisions

- **Hard-gate, no bypass flag.** There is no "disable auth" toggle (a flag that could ship to
  production is a security footgun). Local/dev runs the sibling `identity-service` and mints a token
  (`identity create-admin` / login); tests inject a fake JWKS and sign test tokens (the ID-A test
  pattern).
- **Audience.** VS verifies tokens with the fixed audience `questionnaire-apps` (the seeded ID-A
  client) and a configured issuer + JWKS URL.
- **Roles.** Control-plane endpoints accept **any of** `{researcher, reviewer, administrator}`.
  `DELETE /v1/runtime_cache` requires **administrator**. (`identity_client.require_roles` is all-of;
  VS adds a small any-of check.)
- **Ownership.** On `POST /v1/deployments`, `created_by` is set from the token's `sub`. Per-record
  ownership is **not** enforced (any authorized researcher may operate on any deployment) — deferred
  to when projects exist (ID-D). Recorded as a FOLLOWUP.

---

## 3. Architecture & units

VS depends on the `identity_service` package and imports its standalone verifier
(`identity_service.identity_client`) — VS reimplements no token logic. `identity_client` itself
depends only on pyjwt + httpx, so this adds no heavy coupling.

### New unit — `viewer-service/src/viewer_service/api/identity.py`

| Symbol | Purpose |
|---|---|
| `_get_cache()` | Lazily builds one process-wide `JwksCache(settings.identity_jwks_url)`. A module global `_cache` is the test seam (tests replace it with a fake-fetcher cache). |
| `_verify(token) -> claims` | `identity_client.verify(token, jwks=_get_cache(), audience=settings.identity_audience, issuer=settings.identity_issuer)`. |
| `require_researcher` | FastAPI dependency: parse `Authorization: Bearer`; `_verify`; assert claims `roles` intersect `{researcher, reviewer, administrator}`; return claims. 401 missing/invalid token; 403 missing role. |
| `require_admin` | As above but requires `administrator`. |

Each unit is independently testable; the cache seam lets tests run without a live Identity server.

### Config — `viewer-service/src/viewer_service/config.py`

Add to the frozen `Settings` dataclass (read from env in `get_settings`):
- `identity_jwks_url` (env `IDENTITY_JWKS_URL`, e.g. `http://localhost:8100/.well-known/jwks.json`)
- `identity_issuer` (env `IDENTITY_ISSUER`, e.g. `http://localhost:8100`)
- `identity_audience` (env `IDENTITY_AUDIENCE`, default `questionnaire-apps`)

### Dependency wiring

`viewer-service/pyproject.toml` gains `pyjwt[crypto]>=2.8` (identity_client needs it) and declares a
dependency on the `identity_service` package (editable install in dev; both packages live in the
monorepo). The README documents `pip install -e identity-service -e viewer-service`.

---

## 4. Endpoints gated

**Researcher** (`require_researcher`):
- `POST /v1/viewers`, `GET /v1/viewers/{viewer_id}/{viewer_version}`
- `POST /v1/deployments` (also set `created_by = claims["sub"]`), `GET /v1/deployments`,
  `GET /v1/deployments/{id}`, `PATCH /v1/deployments/{id}`
- `POST /v1/deployments/{id}/runtime`
- `GET /v1/deployments/{id}/export.csv`, `GET /v1/deployments/{id}/metrics`
- `POST /v1/themes`, `GET /v1/themes`, `GET /v1/themes/{id}`

**Administrator** (`require_admin`):
- `DELETE /v1/runtime_cache`

**Left untouched (anonymous, by design):**
- `POST /v1/sessions/new` and all `/v1/sessions/{id}/*` (participant session-token path)
- `GET /v1/scorers/{ref}/impl.wasm` (the web viewer fetches the scorer wasm mid-session, unauthenticated)
- `GET /healthz`

---

## 5. Error handling

Reuse VS's existing JSON error envelope. The Identity dependencies raise `HTTPException`:
- `401` — missing/malformed `Authorization` header, or token fails `identity_client.verify`
  (bad signature, expired, wrong audience/issuer, kid-less). The verifier's `jwt` exceptions are
  caught and converted to 401.
- `403` — token verified but `roles` lacks the required role.

No change to existing 404/409/410/422 handlers or the participant path's 401s.

---

## 6. Testing

New `viewer-service/tests/test_identity_gate.py` plus a small conftest helper:
- A helper signs an access token with a **test** Ed25519 key (`identity_service.keys` +
  `identity_service.tokens.sign_access`) for a given role set, audience `questionnaire-apps`, and the
  test issuer; and installs a fake-fetcher `JwksCache` (exposing the test public JWK) into
  `viewer_service.api.identity._cache`, with env `IDENTITY_ISSUER`/`IDENTITY_AUDIENCE` set.
- For a representative gated endpoint of each role tier, assert: **401** with no token, **401** with a
  tampered/expired/wrong-audience token, **403** with a valid token missing the role, and
  **200/201/204** with the right role. Cover `DELETE /runtime_cache` requires administrator (a
  researcher-only token → 403).
- `POST /v1/deployments` sets `created_by` from the token `sub` (assert via `GET`).
- The existing participant + anonymous suites must stay green unchanged (they don't touch the
  control-plane — but the gated routes they DO call, e.g. tests that create a deployment as setup,
  must be updated to pass a researcher token; this is expected churn and part of the work).

Run the full `viewer-service` suite in its own pytest invocation with `DOCKER_CONFIG=/tmp/lib_docker`.

### Test-churn note (important for planning)

Many existing VS tests create a deployment / register a viewer / post a theme as *setup* for testing
the participant path. Once those routes are gated, those setup calls need a researcher token. The plan
must update the shared test fixtures (e.g. the `setup`/`session` fixtures in `test_sessions_api.py`,
`test_submission_api.py`, etc.) to attach a researcher token to control-plane setup calls. This is the
bulk of ID-B's effort and must be sequenced so the full suite is green at the end.

---

## 7. Deliverable gate

- Every listed control-plane endpoint rejects a no-token request (401) and a wrong-role request
  (403), and accepts the right-role token.
- The participant path and `GET /scorers/.../impl.wasm` remain anonymous and green.
- The **entire** `viewer-service` suite passes (updated fixtures included).
- No change to `identity-service/`.

---

## 8. References

- `viewer-service/FOLLOWUPS.md` — the OD-08 gating markers this slice resolves.
- `identity-service/README.md` + `identity-service/src/identity_service/identity_client.py` — the
  consumer contract (`JwksCache`, `verify(token, *, jwks, audience, issuer)`, role checks).
- `design/08a_viewer_service.md` — the deployment auth-dimension model (the deferred part).
- [[project_identity_id_a]] — the frozen ID-A service ID-B consumes.
- [[project_identity_roadmap]] — where ID-B sits in the sequence (ID-A✓ → ID-B → ID-C → ID-D).
