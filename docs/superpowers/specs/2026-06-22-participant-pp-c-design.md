# PP-C — "My data" participant self-service (design)

**Date:** 2026-06-22
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `viewer-service/` (modify) + `web-viewer/` (modify; new `mydata.html` entry). Identity (ID-A) stays FROZEN.
**Decision basis:** owner goal (2026-06-22) — participants can later "see / download their own data".
PP-C is the third participant-flow (PP) slice; follows PP-A ([[project_participant_pp_a]]) + PP-B
([[project_participant_pp_b]]). See [[project_identity_roadmap]].

---

## 0. Context

PP-A tags authenticated sessions with `participant_sub = <Identity sub>` (PP-B tags invite sessions
`participant_sub = "invite:<code>"`). The Viewer Service owns the `session` rows + the `outbox`
(Schema 5 response payloads). The existing `GET /v1/deployments/{id}/export.csv` (researcher-gated,
ID-B) streams a BDM CSV via a reusable serializer (`export_csv.response_columns` + `to_csv`) over a
deployment-scoped row iterator (`store/export.iter_response_rows` joins `outbox → session` on
`session_id`). `api/identity.verify_participant(authorization) -> dict | None` (PP-A) verifies any
valid Identity token. The Web Viewer is a single-page renderer with a second Vite entry pattern
already in use (`gallery.html`; the editor uses `preview.html`); `loginParticipant` + `LoginView`
(PP-A) handle participant login; `library-web/src/lib/download.ts` is a proven browser blob-download.

PP-C lets a logged-in participant list **their own** sessions and download **their own** responses —
almost entirely by reusing the above.

---

## 1. Scope (locked)

**In scope:** two participant-scoped VS endpoints (list my sessions; download my responses CSV) gated
by a valid Identity token and strictly scoped to the caller's `sub`; the supporting store query +
participant-scoped export iterator; a small `MyDataApp` Web Viewer portal (new `mydata.html` entry)
that logs in and shows the list + a download button.

**Out of scope:** human questionnaire titles in the list (needs a Library lookup); a JSON download
variant; participant "delete my data" / response erasure (a larger Behaverse-data question); invite-
participant data access (no account, by design); merging with PP-D's pick-a-questionnaire; any change
to `identity-service/` (frozen) or to the existing researcher export.

---

## 2. Decisions

- **Strict self-scope.** The me-endpoints return ONLY rows where `session.participant_sub =
  claims["sub"]`. A participant can never see another participant's data. Invite sessions
  (`participant_sub` like `invite:<code>`) are naturally excluded because a logged-in user's `sub` is
  their Identity UUID, never an `invite:` value.
- **Download = BDM CSV**, reusing `export_csv.response_columns` + `to_csv`. Only a participant-scoped
  row iterator is new. (A JSON variant is deferred.)
- **Session list** shows `instrument_id` + `instrument_version`, `deployment_id`, `status`,
  `started_at`, `completed_at`/`submitted_at`, `session_index`. (Human title enrichment deferred.)
- **Auth = any valid Identity token** (role-agnostic, audience `questionnaire-apps`); a new
  `require_participant` FastAPI dependency raises `401` on a missing/invalid token and returns claims.
- **The "My data" portal is a second Vite entry** (`mydata.html` → `src/mydata/main.tsx` →
  `MyDataApp`), isolated from the questionnaire renderer; reuses `loginParticipant` + `LoginView`.

---

## 3. Architecture & units

### Viewer Service

- **`api/identity.py`** — add `require_participant(authorization=Header(...)) -> dict`: reuse `_claims`
  (raises `401` on missing/invalid token) and return the verified claims. (Distinct from
  `verify_participant`, which returns `None`; this one is a route dependency that 401s.)
- **`store/sessions.py`** — add `list_sessions_for_participant(conn, participant_sub) -> list[dict]`
  (`SELECT _SELECT_COLS FROM session WHERE participant_sub=%s ORDER BY started_at DESC`, mapped via the
  existing `_row_to_dict`).
- **`store/export.py`** — add `iter_response_rows_for_participant(conn, participant_sub) -> Iterator[dict]`
  (the existing join with `WHERE s.participant_sub = %s AND o.kind = 'responses' ORDER BY o.id`,
  flattening ResponseSet/bare-Response exactly like the deployment variant).
- **`api/me.py`** (new router) —
  - `GET /v1/me/sessions` (`require_participant`) → `{"sessions": [ {session_id, instrument_id,
    instrument_version, deployment_id, status, started_at, completed_at, submitted_at, session_index}
    , … ]}` for `claims["sub"]` (timestamps ISO strings; null when absent).
  - `GET /v1/me/responses.csv` (`require_participant`) → `StreamingResponse(text/csv)` of the caller's
    responses via `export_csv.to_csv(iter_response_rows_for_participant(c, sub), columns)`,
    `Content-Disposition: attachment; filename="my_responses.csv"` (own-connection stream, mirroring
    the researcher export).
- **`api/app.py`** — include the `me` router.

### Web Viewer

- **`mydata.html`** (new entry) + **`src/mydata/main.tsx`** (mounts `<MyDataApp />`) + **`vite.config.ts`**
  (add `mydata: resolve(__dirname, 'mydata.html')` to the prod + dev `rollupOptions.input`).
- **`src/mydata/client.ts`** — `fetchMySessions(vsBaseUrl, token) -> {ok, sessions} | {ok:false,error}`
  (GET `/v1/me/sessions`, Bearer); `downloadMyData(vsBaseUrl, token)` (authenticated fetch →
  blob → object URL → `<a download="my_responses.csv">`, adapting `library-web`'s pattern with the
  `Authorization` header).
- **`src/mydata/MyDataApp.tsx`** — boot: read `identityBaseUrl`/`vsBaseUrl` from params (reuse
  `parseParams`); if no token yet, render `LoginView` (reuse) → `loginParticipant` → on success fetch
  the sessions; render the session list (or a friendly empty state) + a "Download my data (CSV)"
  button wired to `downloadMyData`.

Each unit is small and independently testable; the VS data access reuses the proven serializer.

---

## 4. Data model

No new tables/columns. Reuses `session.participant_sub` + the `outbox`. (Note: demo/ephemeral sessions
have no outbox rows and so contribute nothing to the export — consistent with the researcher export.)

---

## 5. API surface

- `GET /v1/me/sessions` (Identity token) → `200 {"sessions":[…]}` scoped to `claims["sub"]`; `401`
  without/invalid token.
- `GET /v1/me/responses.csv` (Identity token) → `200 text/csv` (BDM columns) of the caller's
  responses; `401` without/invalid token. Empty data → a header-only CSV (still 200).
- No new Identity calls (the portal uses Identity's existing `/v1/auth/login`). Error envelope unchanged.

---

## 6. Security

- Both me-endpoints derive the participant id ONLY from the verified token `claims["sub"]` — never from
  a query/path/body parameter — so a participant cannot request another's data by changing an id.
- The store queries are parameterized by `participant_sub`; reads only. No write surface.
- The portal holds the access token in memory (not persisted) and sends it as `Authorization: Bearer`
  only to the VS me-endpoints.

---

## 7. Testing

- **VS store** (testcontainers): `list_sessions_for_participant` returns only the matching
  participant's sessions (a second participant's excluded), newest-first;
  `iter_response_rows_for_participant` yields only that participant's flattened responses (ResponseSet
  + bare-Response) and excludes another participant's + demo sessions.
- **VS API** (the PP-A conftest `auth_header(roles, *, sub=...)` seam): `GET /v1/me/sessions` with a
  token for participant A returns A's sessions only (B's absent); no token → 401; `GET
  /v1/me/responses.csv` streams A's rows with the BDM header, 401 without a token; empty participant →
  header-only CSV. Full VS suite stays green.
- **Web Viewer** (vitest + `fetch` stub): `client.fetchMySessions` sends the Bearer + parses the list;
  `MyDataApp` renders `LoginView` first, then the session list after a stubbed login + fetch; the empty
  state renders; the download button calls the authenticated download. `npm run build` adds the
  `mydata` entry cleanly.

---

## 8. Deliverable gate

- A logged-in participant can list their own sessions and download their own responses CSV; a second
  participant's data is never returned; no token → 401.
- The researcher export + the questionnaire renderer are unchanged.
- Full `viewer-service/` + `web-viewer/` suites pass + clean build; no `identity-service/` change.

---

## 9. References

- `viewer-service/src/viewer_service/{export_csv.py,store/export.py,store/sessions.py,api/export.py,api/identity.py,api/app.py}` — the export serializer + session store + identity verifier PP-C reuses/extends.
- `web-viewer/{vite.config.ts,gallery.html}` + `src/app/{auth.ts,chrome/LoginView.tsx,bootstrap.ts}` — the second-entry pattern + login PP-C reuses.
- `library-web/src/lib/download.ts` — the browser blob-download pattern.
- [[project_participant_pp_a]] (participant_sub + login), [[project_participant_pp_b]] (invite namespacing), [[project_identity_roadmap]].
