# ID-C1 — Library community signals (comments + ratings) (design)

**Date:** 2026-06-22
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `library/` (modify) + consumes `identity-service/` (ID-A, frozen)
**Decision basis:** OD-08; ID-A/ID-B Identity decomposition (see [[project_identity_roadmap]]).
ID-C is split into **ID-C1 (community signals — this spec)**, ID-C2 (contribution write/review
workflow — deferred, its own brainstorm), ID-C3 (DOI minting — deferred).

---

## 0. Context

The Library (`library/`, built + merged, live on Vercel+Supabase) is **read-only for catalogue
content** — content arrives only via Git-ingest (`jsonb` source-of-truth + derived index,
"Approach C"); every HTTP endpoint today is a `GET`. The design (`design/06_library.md` §4) calls
for **community signals** — threaded comments + ratings stored in the Library's *own* database (not
Git, not GitHub), gated by an Identity account, with GDPR erasure. These are post-publish feedback,
independent of the GitHub-PR contribution workflow (§5, which is ID-C2).

ID-C1 also adds the **Identity consumer** to `library/` for the first time (the Library has no auth
wiring yet) — the reusable foundation that ID-C2/ID-D Library-write work will build on. It mirrors
ID-B's `viewer-service/src/viewer_service/api/identity.py` pattern verbatim in spirit.

The Library stays read-only for catalogue content; ID-C1 adds new *community* tables the Library
owns and writes.

---

## 1. Scope (locked)

**In scope:** Identity wiring in `library/`; threaded **comments** + 1–5 **ratings** on
questionnaires in the Library's Postgres; **GDPR self-erasure** of a caller's community data; public
reads of signals.

**Out of scope:** usage-stats aggregation from the Viewer Service (cross-service read — later);
surfacing signals in search ranking; the contribution write/review workflow + `draft`/`in_review`
lifecycle (ID-C2); DOI minting (ID-C3); comment editing (delete + repost for now); use-case-
suitability ratings (needs a use-case taxonomy that does not exist). No change to `identity-service/`
(frozen).

---

## 2. Decisions

- **Ratings = single 1–5 "overall quality"**, one per `(user, questionnaire)`, re-rating **upserts**.
  Aggregate = mean + count + histogram. Use-case suitability deferred.
- **Comments = lightweight single-level threading**: top-level comments, each with at most one level
  of replies (`parent_id` may only point at a top-level comment; a reply-to-a-reply is rejected 422).
- **Target = the questionnaire id (`qid`)**, not a specific version — community feedback is about the
  instrument and spans versions. The `qid` must resolve to a known catalogue entry (else 404).
- **Auth floor = any valid Identity token** (any role) to comment/rate ("participant or higher" in
  the design); `administrator` for moderation. `author_sub` is always the verified token `sub`, never
  body-supplied.
- **Comment deletion = soft-delete (tombstone)**: clears `body`/`author_sub`/`author_name`, sets
  `deleted_at`; replies preserved; rendered as `{deleted: true}`. This makes GDPR erasure and
  thread-preservation the same mechanism. Ratings are **hard-deleted**.
- **Audience = `questionnaire-apps`** (same as ID-A/ID-B), issuer + JWKS from config.

---

## 3. Architecture & units

### New unit — `library/src/library/api/identity.py`
Mirror ID-B: lazy module-level `JwksCache` + `install_test_cache(public_jwk)` test seam;
`_claims(authorization)` verifies the Bearer JWT via `identity_service.identity_client.verify`
(`audience=settings.identity_audience`, `issuer=settings.identity_issuer`) → 401 on
missing/invalid; dependencies:
- `require_user(authorization) -> dict` — any successfully-verified token (any role). Returns claims.
- `require_admin(authorization) -> dict` — claims must carry `administrator`, else 403.

### New unit — `library/src/library/store/community.py`
Raw psycopg3 store: comment CRUD (`add_comment`, `list_comments`, `get_comment`,
`soft_delete_comment`), rating upsert/read/delete (`upsert_rating`, `rating_summary`,
`delete_rating`, `caller_rating`), GDPR purge (`purge_user_community_data`), and a
`questionnaire_exists(conn, qid) -> bool` helper (checks `catalogue_entry` for any version of the
qid).

### New unit — `library/src/library/api/community.py`
The FastAPI router (comments + ratings + erasure endpoints), gated by the identity deps.

### Config — `library/src/library/config.py`
Add `identity_jwks_url`, `identity_issuer`, `identity_audience` (default `questionnaire-apps`) to
`Settings` + `get_settings`.

### Modifications to existing files
- `library/src/library/store/schema.sql` — add the `comment` + `rating` tables (idempotent
  `CREATE TABLE IF NOT EXISTS`, matching the file's existing style).
- `library/src/library/api/app.py` — (a) include the community router; (b) **broaden CORS
  `allow_methods`** from `["GET", "OPTIONS"]` to include `POST, PUT, DELETE`; (c) add `401`/`403` to
  the `_CODE_FOR` map (`401: "unauthorized"`, `403: "forbidden"`).
- `library/pyproject.toml` — add `pyjwt[crypto]>=2.8`; depend on `identity_service` (editable install
  in the monorepo, like viewer-service).

---

## 4. Data model (Postgres, added to `store/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS comment (
  id               uuid PRIMARY KEY,
  questionnaire_id text NOT NULL,
  parent_id        uuid REFERENCES comment(id) ON DELETE CASCADE,
  author_sub       text,                 -- nulled on tombstone
  author_name      text,                 -- snapshot from token; nulled on tombstone
  body             text,                 -- nulled on tombstone
  created_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz           -- non-null = tombstoned
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

Single-level threading is enforced in the application layer (reject a `parent_id` whose own
`parent_id` is non-null), not by a DB constraint. `ON DELETE CASCADE` on `parent_id` is a safety net
only — normal deletes are soft (tombstone), so cascades do not fire in the happy path.

---

## 5. API surface (`/v1`)

**Comments**
- `POST /v1/questionnaires/{qid}/comments` (`require_user`) `{body, parent_id?}` → `201` with the
  created comment. `404` if qid unknown; `422` if body empty or `parent_id` is itself a reply or
  belongs to a different qid.
- `GET /v1/questionnaires/{qid}/comments` (public) → threaded list (top-level comments each with a
  `replies` array, chronological); tombstoned comments appear as
  `{id, deleted: true, replies: [...]}` with `body`/author nulled.
- `DELETE /v1/comments/{id}` (`require_user`) → soft-delete (tombstone). Allowed if the caller is the
  comment's `author_sub` **or** has `administrator`. `403` otherwise; `404` if not found.

**Ratings**
- `PUT /v1/questionnaires/{qid}/rating` (`require_user`) `{score}` → upsert the caller's rating; `200`
  with the new summary. `404` if qid unknown; `422` if score ∉ 1..5.
- `GET /v1/questionnaires/{qid}/rating` (public; optional auth) → `{mean, count, histogram:{1..5},
  my_score?}` (`my_score` present only when a valid token is supplied).
- `DELETE /v1/questionnaires/{qid}/rating` (`require_user`) → delete the caller's own rating; `200`
  with the updated summary (idempotent — `200` even if none existed).

**GDPR self-erasure**
- `DELETE /v1/me/community-data` (`require_user`) → tombstone all the caller's comments + hard-delete
  all their ratings; returns `{comments_tombstoned, ratings_deleted}`.

---

## 6. Authorization rules

- Comment/rate: any verified token. Read: public.
- Delete a comment: its `author_sub` or an `administrator`.
- Rating PUT/DELETE and the erasure endpoint act only on the caller's own `sub`.
- `author_sub`/`author_name` always come from the verified claims (`sub`, and `name`/`display_name`
  if present, else `sub`), never from the request body.

---

## 7. Error handling

Reuse the Library's `{"error":{"code","message"}}` envelope (extend `_CODE_FOR` with 401/403):
`401` missing/invalid token, `403` wrong actor, `404` unknown questionnaire/comment, `422`
empty body / bad score / illegal `parent_id`.

---

## 8. Testing

Mirror ID-B's seam. A conftest helper signs tokens with a test Ed25519 key
(`identity_service.keys` + `tokens.sign_access`) and installs a fake-fetcher `JwksCache` into
`library.api.identity._cache`, with `IDENTITY_ISSUER`/`IDENTITY_AUDIENCE` env set; an
`auth_header(roles, *, sub=...)` helper mints Bearer headers.

Coverage:
- **Identity dep** (unit, no DB): `require_user` 401 (no/garbage/expired/wrong-aud token) / 200 (valid);
  `require_admin` 403 (non-admin) / 200 (admin).
- **Comments**: post + list threaded; single-level enforcement (reply-to-reply → 422); unknown qid →
  404; delete by author (200) vs by admin (200) vs by a stranger (403); tombstone preserves replies
  and nulls PII; `POST` without a token → 401.
- **Ratings**: upsert (first PUT creates, second updates — count stays 1); summary mean/count/
  histogram; `my_score` only with auth; delete own; score 0 or 6 → 422; unknown qid → 404; `PUT`
  without token → 401.
- **GDPR erasure**: a user with comments (some with replies) + ratings → comments tombstoned (PII
  gone, replies intact), ratings removed; returns correct counts.
- **Public reads** work with no token; existing `library/` read suites stay green.

Run the full `library/` suite in its own pytest invocation with `DOCKER_CONFIG=/tmp/lib_docker`.

---

## 9. Deliverable gate

- Every write endpoint rejects a no-token request (401) and enforces its role/owner rule (403);
  public reads need no token.
- Comments thread (single-level), ratings upsert + aggregate, GDPR erasure removes the caller's PII
  while preserving thread structure.
- CORS allows the new methods; the error envelope carries 401/403.
- The entire `library/` suite passes; no change to `identity-service/`.

---

## 10. References

- `design/06_library.md` §4 (community signals: comments/ratings/usage-stats, GDPR erasure) + the
  Permissions matrix.
- `design/12_governance.md` (roles; "participants who comment must have an account but do not need a
  GitHub or ORCID account").
- `identity-service/README.md` + `.../identity_client.py` — the verifier contract.
- `viewer-service/src/viewer_service/api/identity.py` — the consumer pattern ID-C1 mirrors.
- [[project_identity_id_b]] (the pattern), [[project_identity_roadmap]] (where ID-C1 sits).
