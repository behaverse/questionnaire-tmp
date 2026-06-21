# ID-A — Identity Core Auth Service (design)

**Date:** 2026-06-21
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `identity-service/` (new top-level component)
**Decision basis:** OD-08 (Identity is a sibling project; governance sanctions a minimal-viable Identity service stood up alongside the first authenticated surface, migrated to the standalone project later).

---

## 0. Context & decomposition

Identity/Auth (OD-08) is the keystone that unblocks the largest remaining swath of the
platform: the Participant Platform (Phase 5), Library write/contribution + comments, the
Editor's "Propose shared version" + projects/collaboration + real preview deployment, and
gating the Viewer Service's researcher/admin operations. The design (`design/12_governance.md`,
`design/10_open_decisions.md` OD-08) treats Identity as an eventual standalone sibling at
`behaverse/identity`; this work builds it **inside this repo now**, scoped to the questionnaire
project but architected so it can later stand alone and serve multiple Behaverse projects
**without a data migration**.

Identity is too large for one spec. It is sliced like VS-A..E and the Editor:

- **ID-A — Core auth service (standalone).** Accounts, email+password, token issuance +
  verification, the 5-role RBAC model, the cross-project token contract, a reusable Python
  verifier. **No consumer changes.** ← *this spec*
- **ID-B — Gate the Viewer Service** (researcher/admin CRUD auth; `editor_session` +
  `platform_session` deployment auth dimensions).
- **ID-C — Library write/contribution + comments/ratings auth.**
- **ID-D — Editor projects/collaboration + "Propose shared" + real preview deployment.**
- *(The Participant Platform is its own Phase-5 component that **consumes** Identity — not an
  Identity slice.)*

Each subsequent slice gets its own brainstorm → spec → plan → build → review → merge.

---

## 1. Purpose & boundary

A standalone `identity-service/` (Python / FastAPI, mirroring `library/` + `viewer-service/`)
that owns **user accounts** and issues **verifiable identity tokens**.

- **API-only, no UI.** Consumer apps (editor, library-web, future platform) build their own
  login forms against this API. A hosted login UI is a later, optional slice.
- **Zero changes to other components in ID-A.** ID-A ships the service plus a thin reusable
  verifier (`identity_client`) so later slices can gate consumers cheaply.
- **Audience-aware** so it can later serve multiple Behaverse projects additively (no migration).

### Units (isolation & clarity)

| Unit | Purpose | Depends on |
|---|---|---|
| `api/` routers | HTTP surface (auth, admin, jwks, well-known) | `store/`, `tokens`, `passwords`, `models` |
| `store/` | Postgres persistence (users, clients, roles, refresh/email tokens, signing keys) | psycopg3 |
| `tokens` | JWT sign/verify, refresh-token mint/rotate/hash | `store/` (keys), `pyjwt` |
| `passwords` | Argon2id hash + verify | `argon2-cffi` |
| `mailer` | `Mailer` interface + `NullMailer` (stub) | — |
| `identity_client` | reusable JWKS-fetch + access-token verify FastAPI dep (importable by later slices) | `pyjwt`, httpx |
| `cli` | `migrate`, `generate-key`, `create-admin`, `create-client` | `store/`, `tokens` |
| `config` | dataclass settings from env | — |

Each unit is independently testable; `identity_client` is deliberately standalone so a
consumer can verify tokens without importing the whole service.

---

## 2. Token model

- **Access token — JWT, EdDSA (Ed25519), 15 min default TTL.**
  Claims: `sub` (user id, UUID), `aud` (target client slug, e.g. `questionnaire-apps`),
  `roles` (array, scoped to that audience), `iss` (configured issuer), `iat`, `exp`, `jti`.
  Header carries `kid`. Verified **locally** by consumers via JWKS — no per-request call back
  to Identity.
- **Refresh token — opaque random (≥256-bit), 30 day default TTL, rotating, revocable.**
  Stored only as a SHA-256 hash (mirrors VS session-token handling). On `refresh`, the old
  token is consumed and a new one issued (`rotated_to` chains the lineage). A `family_id`
  groups a login lineage; presenting an already-rotated (consumed) token is **reuse** →
  revoke the entire family (theft mitigation).
- **JWKS — `GET /.well-known/jwks.json`.** Publishes active public keys; supports multiple keys
  for rotation (`kid`). Private keys never leave the service.

Rationale: asymmetric JWT + JWKS is the standard for an auth provider intended to serve
multiple projects later — new services integrate by trusting the JWKS and validating `aud`,
nothing else. Opaque refresh tokens keep revocation server-side and instant.

---

## 3. Data model (Postgres, raw SQL via `migrate`)

No ORM; raw `store/schema.sql` applied by `store/migrate.apply_schema(conn)` (matches
`library/` + `viewer-service/`). Tables:

- **`users`** — `id` (uuid pk), `email` (citext, unique), `password_hash` (text, Argon2id),
  `display_name` (text), `status` (`active` | `disabled`), `email_verified` (bool),
  `created_at`, `updated_at`.
- **`clients`** — registered audiences. `id` (uuid pk), `slug` (unique, e.g.
  `questionnaire-apps`), `name`, `created_at`. Seeded with the questionnaire-apps client.
- **`user_roles`** — `(user_id, client_id, role)` composite unique; `role` ∈
  {`researcher`, `participant`, `reviewer`, `contributor`, `administrator`}. Per-audience scoping.
- **`refresh_tokens`** — `id` (uuid pk), `user_id`, `client_id`, `token_hash` (unique),
  `family_id` (uuid), `expires_at`, `revoked_at` (nullable), `rotated_to` (nullable fk),
  `created_at`.
- **`email_tokens`** — `id` (uuid pk), `user_id`, `kind` (`verify` | `reset`), `token_hash`
  (unique), `expires_at`, `consumed_at` (nullable), `created_at`.
- **`signing_keys`** — `kid` (text pk), `alg` (`EdDSA`), `public_jwk` (jsonb),
  `private_pem` (text), `active` (bool), `created_at`. Lets `migrate`/CLI generate & rotate keys.

Role enum is enforced at the application layer (and optionally a CHECK constraint) so the
vocabulary stays the 5 governance roles.

---

## 4. API surface (`/v1`)

**Auth**
- `POST /v1/auth/register` `{email, password, display_name?, audience}` → creates user; grants
  the configured default role (`researcher`) in that audience; mints a `verify` email token
  (stub-mailed). Returns the created profile (no tokens until login, or optionally auto-login —
  decided in planning; default: no auto-login).
- `POST /v1/auth/login` `{email, password, audience}` → `{access_token, refresh_token,
  expires_in, token_type: "Bearer"}`. Rejects disabled users.
- `POST /v1/auth/refresh` `{refresh_token}` → rotated `{access_token, refresh_token,
  expires_in}`. Reuse of a consumed token → 401 + family revoked.
- `POST /v1/auth/logout` `{refresh_token, all_sessions?: bool}` → revoke that token (or the
  whole family).
- `GET /v1/auth/me` (Bearer access, `aud`-checked) → profile + roles for that audience.
- `POST /v1/auth/verify-email` `{token}` → set `email_verified`.
- `POST /v1/auth/request-password-reset` `{email}` → mint `reset` token (stub-mailed); always
  202 (no account enumeration).
- `POST /v1/auth/reset-password` `{token, new_password}` → set new hash; revoke all refresh
  families for the user.

**Admin** (requires `administrator` role in the target audience)
- `GET /v1/admin/users` (paginated) · `GET /v1/admin/users/{id}`
- `POST /v1/admin/users/{id}/roles` `{client, role}` · `DELETE /v1/admin/users/{id}/roles`
  `{client, role}`
- `POST /v1/admin/clients` `{slug, name}` · `GET /v1/admin/clients`

**Discovery**
- `GET /.well-known/jwks.json` → active public keys.
- `GET /.well-known/openid-configuration` is **out of scope** for ID-A (no full OIDC yet).

Errors follow the existing components' JSON error shape; auth failures are `401`, authorization
failures `403`, validation `422`.

---

## 5. Reusable verifier — `identity_client`

A small, standalone in-repo module providing:
- `JwksCache` — fetches `/.well-known/jwks.json`, caches by `kid` with a TTL + refetch-on-unknown-kid.
- `verify_access_token(token, *, audience, issuer) -> Claims` — verifies signature, `exp`,
  `iss`, `aud`; returns typed claims (sub, roles, etc.); raises on any failure.
- `require_roles(*roles)` — a FastAPI dependency factory the later slices import to gate
  endpoints.

ID-A ships and tests this against its own JWKS (sign in service → verify with `identity_client`).
The JS/TS counterpart (for the editor / web frontends) is **out of scope** for ID-A and lands
with the slices that need it.

---

## 6. Config, CLI, conventions

**Config** — `@dataclass` + `os.environ` (matches existing components):
- `DATABASE_URL`
- `IDENTITY_ISSUER` (e.g. `https://identity.behaverse.org` or a local URL)
- `ACCESS_TOKEN_TTL` (seconds, default 900)
- `REFRESH_TOKEN_TTL` (seconds, default 2592000)
- `IDENTITY_CORS_ORIGINS`
- `DEFAULT_REGISTER_ROLE` (default `researcher`)

**CLI** (`identity ...`, click, via `[project.scripts]`):
- `identity migrate` — apply `store/schema.sql`; seed the `questionnaire-apps` client.
- `identity generate-key` — mint/rotate an Ed25519 signing key (writes `signing_keys`,
  marks active, optional `--retire-others`).
- `identity create-admin --email --password [--audience]` — bootstrap the first administrator.
- `identity create-client --slug --name` — register an audience.

**App factory** — `uvicorn identity_service.api.app:create_app --factory --reload`, CORS
middleware, routers included with `/v1` (+ `/.well-known`) prefixes, shared exception handlers.

**Dependencies added** (beyond the existing FastAPI/psycopg3/pydantic baseline):
`pyjwt[crypto]` (JWT EdDSA sign/verify; pulls `cryptography`) and `argon2-cffi` (Argon2id).
Everything else matches existing components: psycopg3 raw (`psycopg[binary]` + `psycopg_pool`),
testcontainers Postgres, `DOCKER_CONFIG=/tmp/lib_docker` for integration tests, Python ≥3.12.

---

## 7. Testing & deliverable gate

**Unit**
- JWT sign → verify round-trip; reject tampered signature, expired token, wrong `aud`, unknown
  `kid`, wrong issuer.
- Argon2id hash + verify; rehash-on-params-change not required for ID-A.
- Refresh rotation: rotate issues a new token + consumes the old; reuse of a consumed token
  revokes the family; expired/revoked rejected.
- RBAC: roles are audience-scoped; `require_roles` allows/denies correctly; admin-only routes
  reject non-admins.
- Email tokens: verify + reset consume-once, expiry honored; password reset revokes refresh
  families.

**Integration (testcontainers Postgres)**
- Full flow: `register → (verify-email) → login → me → refresh → me → logout`.
- Admin grants/revokes a role; the new role appears in the next minted access token.
- JWKS round-trip: token signed by the running service verifies via the standalone
  `identity_client` against the live `/.well-known/jwks.json`.
- Key rotation: a token signed by an old `kid` still verifies while that key is published;
  retired key stops verifying.

**Gate to call ID-A done**
- All suites green (run in their own `pytest` invocation, like the other packages).
- `identity migrate`, `generate-key`, `create-admin`, `create-client` all work end-to-end.
- A token minted by the service verifies via `identity_client`.
- No consumer wired (that is ID-B+).

---

## 8. Explicitly out of scope for ID-A

Real email sending (only the `Mailer` interface + `NullMailer` stub); social / ORCID / GitHub
federation; hosted login UI; full OAuth2 authorization-code / OIDC discovery; MFA; the JS/TS
verifier; and wiring any existing consumer (VS / Library / Editor). All are later additive
slices that build on ID-A's token contract.

---

## 9. References

- `design/10_open_decisions.md` — OD-08 (Identity sibling project).
- `design/12_governance.md` — three-project topology; role vocabulary; "minimal-viable Identity
  alongside the first authenticated surface, migrate later".
- `design/09_platform.md` — Participant Platform auth needs (downstream consumer).
- `design/06_library.md` — Library permissions + contribution/comments auth (downstream).
- `design/07_editor.md` — Editor projects/roles + "Propose shared" (downstream).
- `design/08a_viewer_service.md` — deployment `auth` dimension (`platform_session`,
  `editor_session`, …) the later slices switch on.
- Existing conventions: `library/`, `viewer-service/` (app-factory, raw psycopg3, raw-SQL
  migrate, click CLI, testcontainers).
