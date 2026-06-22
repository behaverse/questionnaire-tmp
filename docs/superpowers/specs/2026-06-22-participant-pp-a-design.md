# PP-A — Authenticated participant sessions (design)

**Date:** 2026-06-22
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `viewer-service/` (modify) + `web-viewer/` (modify); consumes `identity-service/` (ID-A, frozen).
**Decision basis:** owner goal (2026-06-22) — participants pick + complete questionnaires with data tied
to a stable user id, return later, and download their own data; plus link-driven runs. PP-A is the
keystone of the **participant-flow (PP)** track: PP-A authenticated sessions → PP-B signed invite
links → PP-C "my data" → PP-D pick-a-questionnaire. See [[project_identity_roadmap]].

---

## 0. Context

Today a completion session is **anonymous**: VS `POST /v1/sessions/new` mints a session with a fresh
`agent_id = "agent_"+uuid4hex[:8]` and `session_index = 1`, and the opaque `session_token` (Bearer,
hashed) authenticates only *that* session — it is not a user identity. There is no cross-session
participant tracking and no `participant`/`user` column on the `session` table. The deployment `auth`
dimension supports only `none` (`anonymous_link`, `demo`); other presets are rejected at create
(`modes.py`). The Web Viewer boots from `?deployment=&locale=&viewer_url=` and mints anonymously with
no `Authorization` header; it has no login UI.

Identity (ID-A) issues EdDSA-JWT access tokens (`POST /v1/auth/login {email,password,audience}` →
`{access_token, refresh_token, ...}`; claims `sub/aud/roles/iss/iat/exp/jti`). VS already consumes
the reusable verifier in `viewer-service/src/viewer_service/api/identity.py` (ID-B:
`JwksCache`/`verify`/`_claims`, config `identity_jwks_url`/`identity_issuer`/`identity_audience`).

PP-A wires participant identity through: a participant logs in, and VS tags the session with their
Identity `sub`, so returning participants accumulate sessions under one id.

---

## 1. Scope (locked)

**In scope:** an `authenticated` deployment mode; the VS session-mint participant-auth path (verify an
Identity token, record `participant_sub`, set `agent_id = sub`, increment `session_index` per
participant); a `participant_sub` column; Web Viewer login (401→login→retry-with-Bearer) + Identity
base-URL config.

**Out of scope:** "my data" list/download (PP-C); signed invite links + participant onboarding (PP-B);
catalogue "pick a questionnaire" (PP-D); a dedicated `participant` role + self-registration;
per-deployment pseudonymisation of `agent_id`; web-viewer refresh-token handling (the Identity token
is used only at mint); changes to `identity-service/` (frozen) or to session resume (session-scoped,
unchanged).

---

## 2. Decisions

- **Authenticated deployment mode.** Add `mode_preset: "authenticated"` → dimensions
  `{auth: "identity", persistence: "persisted", lifecycle: "standard", rendering_context: "standalone"}`.
  This is the buildable form of the design's deferred `platform_session` auth dimension. Existing
  `anonymous_link`/`demo` are unchanged.
- **Auth is per-deployment, not opportunistic.** An `auth: identity` deployment **requires** a valid
  Identity token (401 without). An `auth: none` deployment stays anonymous and **ignores** any token.
  (No "tag-if-logged-in-else-anonymous" hybrid — deferred.)
- **Role-agnostic at mint.** Any valid Identity access token (audience `questionnaire-apps`, signature/
  exp/iss/aud verified) suffices to complete a questionnaire; the verified `sub` is recorded. No strict
  `participant` role is required (role-based "my data" access is a PP-C concern).
- **`agent_id = participant_sub`** for authenticated sessions (BDM: agent = the participant), so the
  participant's exported/forwarded data groups under one agent. `session_index` = (their prior session
  count) + 1. Anonymous sessions keep the fresh generated `agent_id` + index 1.
- **Identity token used only at mint.** All later calls use the opaque session token; no mid-session
  refresh needed.
- **Audience `questionnaire-apps`**, issuer/JWKS from existing config.

---

## 3. Architecture & units

### Viewer Service

- **`modes.py`** — add the `authenticated` preset to `PRESETS` (and thus `SUPPORTED`).
- **`store/schema.sql`** + **`store/migrate.py`** — add `participant_sub text` (nullable) to the
  `session` table via an idempotent `ALTER TABLE session ADD COLUMN IF NOT EXISTS participant_sub text`
  (VS-C migration style: the migrate step runs idempotent ALTERs for added columns).
- **`store/sessions.py`** — `insert_session` persists `participant_sub`; add
  `count_sessions_for_agent(conn, agent_id) -> int` (for `session_index`); the GET-session/auth read
  returns `participant_sub`.
- **`api/identity.py`** — add `require_participant(authorization) -> dict`: verify via the existing
  `_claims` (any valid token; role-agnostic) → return claims. (Reuses the ID-B `JwksCache`/`_claims`
  seam verbatim; distinct from `require_researcher`/`require_admin` only in that it requires no role.)
- **`sessions.py` `new_session` + `api/sessions.py`** — read the deployment's `dimensions.auth`:
  - `auth == "identity"`: require the participant token (via `require_participant`/`_claims`); on
    missing/invalid → **401 `auth_required`**; on valid → `agent_id = participant_sub = claims["sub"]`,
    `session_index = count_sessions_for_agent(conn, agent_id) + 1`, store `participant_sub`.
  - else (`auth == "none"`): unchanged anonymous path (`agent_id` generated, `participant_sub` NULL,
    `session_index = 1`). Any provided token is ignored.
  - The mint response gains `participant_sub` (null for anonymous) so the viewer can show "logged in as".

### Web Viewer

- **`app/bootstrap.ts`** — `parseParams` gains `identityBaseUrl` (`?identity_url=` ?? `VITE_IDENTITY_BASE_URL`).
  `mintSession` accepts an optional access token → sends `Authorization: Bearer <token>` on
  `/v1/sessions/new`; it surfaces a distinct `auth_required` result when VS returns 401 with that code.
- **A login unit** (`app/auth.ts` + a `LoginView` component) — `loginParticipant(identityBaseUrl,
  email, password) -> {access_token}` calling Identity `POST /v1/auth/login` (audience
  `questionnaire-apps`); a minimal email/password form.
- **Boot orchestration** (the existing `App`/boot path) — attempt mint; on `auth_required`, render
  `LoginView`; on submit, login → retry `mintSession` with the token → continue into the normal
  renderer. Anonymous deployments never render login (unchanged).

Each unit stays small and independently testable; the login unit is pure (a fetch wrapper) + a
presentational form.

---

## 4. Data model

`session` table gains:
```sql
ALTER TABLE session ADD COLUMN IF NOT EXISTS participant_sub text;
```
Null for anonymous sessions; the participant's Identity `sub` for authenticated ones. (PP-C will query
`WHERE participant_sub = <sub>`.) No other table changes.

---

## 5. API surface

- `POST /v1/deployments` — now accepts `mode_preset: "authenticated"` (researcher-gated as in ID-B).
- `POST /v1/sessions/new` — behavior depends on the deployment's `auth` dimension (see §3). New
  optional request auth: `Authorization: Bearer <Identity access token>`. Response adds
  `participant_sub` (nullable). `401 {"error":{"code":"auth_required",...}}` when an `identity`
  deployment gets no/invalid token.
- No new VS endpoints. No Identity changes (the viewer calls Identity's existing `/v1/auth/login`).

---

## 6. Error handling

VS reuses its `{"error":{"code","message"}}` envelope; the missing/invalid-token case on an
`identity` deployment is `401` with `code: "auth_required"` (distinct from a generic 401 so the
viewer can route to login). The web viewer maps `auth_required` → show login; login failure (Identity
401) → inline "invalid email or password"; other errors → the existing error surface.

---

## 7. Testing

- **VS** (pytest; the ID-B conftest fake-JWKS + `auth_header(roles, *, sub=...)` seam):
  - `authenticated` deployment: mint with no token → 401 `auth_required`; with an invalid/expired/
    wrong-audience token → 401; with a valid token → 201, session row has `participant_sub == sub`,
    `agent_id == sub`, `session_index == 1`.
  - returning participant: a second mint with the same `sub` → `session_index == 2`.
  - anonymous deployment: mint with no token still works (anonymous, `participant_sub` null); a
    provided token is ignored (still anonymous).
  - `POST /deployments` accepts `mode_preset: "authenticated"` (researcher token) and resolves
    `auth: "identity"`.
  - Full VS suite stays green.
- **Web Viewer** (vitest + `fetch` stub):
  - `mintSession` with a token sends the `Authorization` header; without one omits it.
  - `mintSession` returns an `auth_required` signal when VS responds 401 with that code.
  - `loginParticipant` posts email/password/audience to Identity and returns the access token.
  - boot orchestration: a 401 `auth_required` mint → renders login → after a successful login, retries
    mint with the Bearer token and proceeds; anonymous deploy never renders login.

---

## 8. Deliverable gate

- A researcher can create an `authenticated` deployment; an anonymous participant mint against it is
  401; a logged-in participant completes it and the session carries their `participant_sub`/`agent_id`,
  with `session_index` incrementing across their sessions.
- Anonymous deployments are unchanged (still mint anonymously, ignore tokens).
- Full `viewer-service/` and `web-viewer/` suites pass; no `identity-service/` change.

---

## 9. References

- `viewer-service/src/viewer_service/{sessions.py,api/sessions.py,modes.py,store/sessions.py,store/schema.sql,api/identity.py}` — the mint path + ID-B identity consumer PP-A extends.
- `web-viewer/src/app/bootstrap.ts` — the boot/mint path PP-A extends with login.
- `identity-service/` — `POST /v1/auth/login` contract (frozen).
- `design/08a_viewer_service.md` — the deployment `auth` dimension vocabulary (`platform_session` etc.).
- [[project_identity_id_b]] (the VS identity-consumer pattern), [[project_viewer_service_vs_b]] (session mint), [[project_web_viewer_wv_a]] (boot), [[project_identity_roadmap]].
