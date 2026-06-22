# PP-B — Signed invite links (design)

**Date:** 2026-06-22
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `viewer-service/` (modify) + `web-viewer/` (modify). Identity (ID-A) stays FROZEN.
**Decision basis:** owner goal (2026-06-22) — participant-flow track; the "(b)/(c)" mode agreed in the
PP-A brainstorm (a researcher-generated tamper-proof link that runs a questionnaire under a given id
and collects data, with no login and no data recovery). PP-B follows PP-A ([[project_participant_pp_a]]).
See [[project_identity_roadmap]].

---

## 0. Context

PP-A added authenticated participant sessions: an `authenticated` deployment (`auth: "identity"`)
requires an Identity login token at `POST /v1/sessions/new`, and the session is tagged with the
participant's Identity `sub` (`participant_sub` = `agent_id`, `session_index = count_for_agent+1`).
Anonymous deployments are unchanged; the auth path branches on the deployment's `dimensions.auth`.
The VS consumes ID-B's identity verifier; VS researcher endpoints are gated by `require_researcher`.
VS has no token-signing of its own beyond opaque session tokens (`tokens.py`: `mint_token` +
`hash_token`).

PP-B adds a third participant-identification mode: a **signed invite link**. A researcher generates a
tamper-proof per-participant link for a deployment; opening it mints a session tagged with the
invite's participant code — no login, no account, no data recovery. This is also the practical
participant-onboarding path (PP-A's login assumes accounts already exist).

---

## 1. Scope (locked)

**In scope:** VS mints + verifies HMAC-signed invite tokens; a researcher-gated invite-minting
endpoint; a new `invite_link` deployment mode that requires an invite at session-start and tags the
session with the invite's participant code; Web Viewer support for `?invite=` (no login screen;
invalid-invite error).

**Out of scope:** single-use invites (valid until expiry for now); bulk invite generation; an
"attach an account to recover my data" upgrade for invite participants; the external-forwarding
destination (deferred per-deployment option, as in PP-A); PP-C "my data"; any change to
`identity-service/` (frozen) or to the existing anonymous/`authenticated`/`demo` modes.

---

## 2. Decisions

- **Invites are signed by the Viewer Service (symmetric HMAC-SHA256), not Identity.** An invite is a
  researcher-generated *deployment access grant* for someone who has not logged in; VS is the sole
  verifier and owns deployments + sessions, so it mints + verifies invites with an
  `INVITE_SIGNING_SECRET`. Identity stays frozen; no participant account is required.
- **Invite token format:** `base64url(payload_json) + "." + base64url(hmac_sha256(secret, payload_b64))`.
  Payload = `{"participant_id": <str>, "deployment_id": <str>, "exp": <unix int>}`. Verification:
  constant-time HMAC compare, `exp` in the future, `deployment_id` matches the target deployment.
- **Participant identity = an opaque researcher-assigned code** (e.g. `P-042`), not an Identity
  account. The session's `participant_sub = "invite:" + participant_id` (namespaced so it can never
  collide with an Identity `sub` — important for PP-C "my data"). `agent_id = participant_id` (raw, so
  researcher exports read naturally). `session_index = count_for_agent(agent_id) + 1`.
- **New deployment mode `invite_link`** → dimensions `{auth: "invite", persistence: "persisted",
  lifecycle: "standard", rendering_context: "standalone"}`. Requires a valid invite at mint
  (`401 invite_required` otherwise). Existing modes unchanged; an `invite` field is ignored on
  non-`invite` deployments.
- **The invite lives in the URL** (`?invite=<token>`) — that is the point (the researcher shares the
  link); tamper-resistance comes from the HMAC, not from hiding it. The destination/"where data goes"
  stays on the deployment (PP-A decision), referenced by the invite's `deployment_id`.

---

## 3. Architecture & units

### Viewer Service

- **`config.py`** — add `invite_signing_secret` (env `INVITE_SIGNING_SECRET`, default `""`). When
  empty, the invite endpoints/verification fail closed (mint → 503-style error; verify → invalid).
- **`invites.py`** (new, pure) — `mint_invite(secret, *, participant_id, deployment_id, ttl, now) -> str`
  and `verify_invite(secret, token, *, deployment_id, now) -> dict | None` (returns the payload if the
  HMAC + `exp` + `deployment_id` all check out, else `None`; never raises). Uses stdlib `hmac` +
  `hashlib` + `base64` + `json`; constant-time compare via `hmac.compare_digest`.
- **`modes.py`** — add the `invite_link` preset (`auth: "invite"`).
- **`api/invites.py`** (new router) — `POST /v1/deployments/{deployment_id}/invites`
  (`require_researcher`): body `{participant_id: str, ttl_seconds?: int}` (default ttl from config,
  e.g. 30 days); 404 if the deployment is unknown; mints the token; returns `{invite_token,
  participant_id, deployment_id, expires_at, url}` where `url` = `f"{VS_PUBLIC_BASE}/?deployment=
  {id}&invite={token}"` if a public base is configured, else just the query string.
- **`models.py`** — `InviteCreate {participant_id: str, ttl_seconds: int | None = None}`;
  `SessionNew` gains `invite: str | None = None`.
- **`sessions.py` `new_session`** — extend the auth branch: when `dimensions.auth == "invite"` and an
  invite payload is provided, set `participant_sub = "invite:" + payload["participant_id"]`,
  `agent_id = payload["participant_id"]`, `session_index = count_for_agent(agent_id) + 1`. Add a param
  for the verified invite payload (alongside the existing `participant_claims`).
- **`api/sessions.py` `new`** — when `dimensions.auth == "invite"`: `verify_invite(secret, body.invite,
  deployment_id=...)`; if `None` → `401 {"error":{"code":"invite_required",...}}`; else pass the
  payload to `new_session`. The `identity` and `none` branches are unchanged (an `invite` field is
  ignored there).
- **`api/app.py`** — include the new invites router.

### Web Viewer

- **`app/bootstrap.ts`** — `parseParams` gains `invite: q.get('invite')`. `mintSession(vsBaseUrl,
  deploymentId, locale, accessToken?, invite?)` adds `invite` to the POST body when present. A
  `401 invite_required` response maps to a new `MintErr` kind `'invite_invalid'`.
- **boot orchestration (`App.tsx`)** — pass `params.invite` to the mint. An `invite_invalid` mint →
  the existing `ErrorScreen` with a clear message ("This invite link is invalid or expired"). No login
  screen for invite deployments. The anonymous + `authenticated`(login) paths are unchanged.

Each unit is small and independently testable; `invites.py` is pure (no DB/HTTP) and the security core.

---

## 4. Data model

No new tables or columns. Reuses PP-A's `session.participant_sub` (set to `invite:<code>` for invite
sessions). Invites themselves are **stateless** (self-contained signed tokens) — not persisted —
which is why single-use enforcement is deferred (would need a consumed-invite table).

---

## 5. API surface

- `POST /v1/deployments/{deployment_id}/invites` (researcher) `{participant_id, ttl_seconds?}` →
  `201 {invite_token, participant_id, deployment_id, expires_at, url}`. `404` unknown deployment;
  `422` empty `participant_id`; `503 invites_unavailable` if `INVITE_SIGNING_SECRET` is unset.
- `POST /v1/sessions/new` gains `invite?: str`. For an `invite_link` deployment: `401 invite_required`
  if the invite is missing/invalid/expired/for-another-deployment; else `201` with the session tagged
  (`participant_sub = "invite:"+code`, returned in the response as today). For `none`/`identity`/`demo`
  deployments the `invite` field is ignored.

Error envelope: VS's `{"error":{"code","message"}}` (explicit JSONResponse, as the other mint-gate
errors). New codes: `invite_required` (401), `invites_unavailable` (503).

---

## 6. Security

- Tamper-resistance is the HMAC over the full payload; a changed `participant_id`/`deployment_id`/`exp`
  invalidates the signature. `hmac.compare_digest` prevents timing leaks. `exp` bounds the link's
  lifetime. `deployment_id` binding prevents replaying an invite against a different deployment.
- The secret never leaves VS; it is not in any token or response. With the secret unset, invites fail
  closed (mint refused, verification fails) — no accidental unsigned acceptance.
- The participant code is researcher-namespaced and stored as `invite:<code>`, disjoint from Identity
  subs, so an invite can never impersonate a logged-in participant nor (in future PP-C) read an
  account holder's data.
- Quota/active-window gating (VS-C) still applies to invite sessions (the deploy gate runs before
  tagging).

---

## 7. Testing

- **VS `invites.py`** (pure unit): mint→verify round-trip; reject tampered payload, tampered
  signature, expired token, wrong-deployment token, and an empty/garbage token; verify returns `None`
  (never raises); empty secret → verify `None`.
- **VS API** (pytest + ID-B `auth_header` for the researcher mint): `POST …/invites` researcher-gated
  (401 without a researcher token — reuse ID-B's pattern), 404 unknown deployment, 422 empty
  participant_id, 201 returns a usable token + `url`; mint on an `invite_link` deployment with no
  invite → 401 `invite_required`; with a valid invite → 201, `participant_sub == "invite:<code>"`,
  `agent_id == <code>`, returning-code `session_index` increments; an invite minted for deployment A
  rejected on deployment B (401); an `invite` field on an anonymous deployment is ignored (still
  anonymous). Full VS suite stays green.
- **Web Viewer** (vitest + `fetch` stub): `parseParams` reads `?invite=`; `mintSession` adds `invite`
  to the body when present and omits it otherwise; a `401 invite_required` maps to `invite_invalid`;
  the boot renders the error screen (not login) for an `invite_invalid` mint. Anonymous + login paths
  unchanged.

---

## 8. Deliverable gate

- A researcher mints an invite for a deployment + participant code and gets a shareable URL.
- Opening that URL completes the questionnaire with the session tagged `participant_sub = invite:<code>`
  (no login); a missing/forged/expired/cross-deployment invite is refused (401 `invite_required`).
- Anonymous, `authenticated` (PP-A login), and `demo` modes are unchanged.
- Full `viewer-service/` and `web-viewer/` suites pass; no `identity-service/` change.

---

## 9. References

- `viewer-service/src/viewer_service/{sessions.py,api/sessions.py,modes.py,config.py,api/deployments.py,api/identity.py,tokens.py}` — the mint path + researcher gate + the `participant_sub` PP-A added.
- `web-viewer/src/app/{bootstrap.ts,App.tsx}` — the boot/mint path PP-A extended with login (PP-B adds the invite path alongside).
- [[project_participant_pp_a]] (the session-tag mechanism PP-B reuses), [[project_identity_id_b]] (`require_researcher`), [[project_identity_roadmap]].
