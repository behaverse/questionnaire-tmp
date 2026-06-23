# Follow-ups — questionnaire-viewer-service (VS-A)

- **Auth (Identity) — RESOLVED (ID-B, 2026-06-21).** All control-plane endpoints are now
  gated by `require_researcher` (researcher/reviewer/administrator) or `require_admin`
  (administrator only for `DELETE /runtime_cache`). Participant `/sessions/*` and
  `GET /scorers/.../impl.wasm` remain anonymous. See the README Authentication section.
- **URL-fetch manifest ingestion (OD-18c).** VS-A ingests manifests by direct POST.
  Add the fetch-from-published-URL variant when the Web Viewer ships a real manifest URL.
- **Full locale precedence.** VS-A resolves locale from deployment config only. The full
  OD chain (URL param → platform profile → deployment default → Accept-Language →
  questionnaire canonical) needs request/session context — VS-B.
- **Cache LRU under concurrency.** Eviction is a best-effort `DELETE ... OFFSET cap` per
  put; under heavy concurrent misses it can momentarily exceed the cap. Fine for MVP;
  revisit with an advisory lock or a background sweeper if it matters.
- **Library client resilience.** No retry/backoff on transient Library 5xx yet (just a
  502 passthrough). Add retry when this path goes to production load.

## ID-B follow-ups (Identity gate — 2026-06-21)

- **Per-record ownership not enforced.** Any authorized researcher can operate on any
  deployment (CRUD, export, metrics). Record-level ownership (`created_by` is stored but
  not checked) will be enforced once project scoping exists — revisit in ID-D.
- **`editor_session` / `platform_session` mode presets still deferred.** These presets
  require Identity / Platform auth dimensions at `/sessions/new` and are rejected with 422
  today. Enforcement is deferred to ID-D (editor) / Phase 5 (platform).
- **JwksCache has no proactive refresh or health endpoint.** The cache is lazy: it
  re-fetches from the JWKS URL on a kid-miss. A background refresh thread and a
  `/healthz`-style JWKS probe are acceptable deferred work; the current approach is
  sufficient for the traffic profile of Phase 2.

## VS-B follow-ups

- **`validated` state + Behaverse reconciliation.** VS-B stops at `forwarded` (sink 2xx).
  `validated` needs Behaverse validation feedback (callback or reconciliation poll) — VS-C/later.
- **`abandoned` on timeout.** No session-timeout sweeper yet; in_progress sessions live forever.
- **Outbox retention.** Forwarded/failed rows are kept indefinitely (available for VS-C export).
  Add a pruning policy (e.g. drop forwarded rows older than N days) before production.
- **Soft-threshold alerting.** The hard cap (503) is enforced; the soft threshold is config but
  only logged — the alert banner / dashboard surface is VS-C.
- **Forwarder concurrency.** A single `forward-worker` is assumed; `FOR UPDATE SKIP LOCKED` makes
  multiple workers safe, but that hasn't been load-tested.
- **mTLS / E2E encryption.** Deferred per OD-13 (TLS + SHA-256 + bearer ship now).

## VS-C follow-ups

- **Ephemeral session TTL purge.** Demo sessions skip the outbox + refuse resume, but their
  `session` rows are not yet purged; add an age-based sweeper before production.
- **Per-condition quota.** Only a per-deployment `max_sessions` cap exists; per-condition caps
  need Participant-Platform condition assignment (Phase 5).
- **Non-`none`-auth presets.** access_code / platform_study / embedded / kiosk / preview are
  rejected at create until Identity/Platform/host integration lands (OD-08).
- **Full deployment update.** Only `active_until` + `quota` are mutable via PATCH; broader edits
  would need careful in-flight-session semantics.
- **Style/flow override application.** Overrides are stored + validated, but applying them to the
  runtime (resolving instrument vs deployment values per R18) is a Web Viewer / runtime concern.

## VS-D follow-ups

- **Events export.** Only response data (Schema 5) is exported; a Schema 4a events export is later.
- **Other formats + codebook.** Parquet / SPSS `.sav` / R `.rds` / JSON exports and the accompanying
  codebook (variable/value labels) are post-MVP (CSV is the Phase-2 format per OD-17 / 05_data_model).
- **Large-export streaming.** `iter_response_rows` iterates the result set; for very large deployments,
  switch to a server-side (named) cursor / `fetchmany` batching.
- **Per-session export + filtering.** Whole-deployment raw dump only; per-session export and
  filtering/aggregation are later.
- **VS-E (next):** monitoring dashboard (UC-12) + theme infrastructure (UC-13 infra).
- **Deferred:** Behaverse reconciliation + the `validated` session state (reconciliation needs a
  Behaverse query endpoint that doesn't exist yet; `validated` is a no-op stub).

## PP-D follow-ups (participant catalogue — 2026-06-22)

- **Auto-fill title/description from the Library (cross-service).** When a deployment
  is created without an explicit `title`, the VS could fetch the questionnaire's human-readable
  name from the Library (`GET /v1/questionnaires/{id}/versions/{v}`) and store it in the
  `title` column automatically. Deferred — requires the Library to be reachable at deployment
  creation time and a caching strategy for the Library call.
- **Per-participant assignment (Phase 5).** The catalogue today is the same for every
  participant. Personalised assignment (participant enrolled in study → only their assigned
  questionnaires appear) requires a Platform/study-assignment layer — deferred to Phase 5.
- **Catalogue search and filter.** `GET /v1/catalogue` returns all listed+open deployments
  with no pagination, keyword search, or tag/category filter. Add these once the catalogue
  grows beyond a handful of entries.
- **Catalogue N+1.** The endpoint runs one `count_for_deployment` query per listed candidate
  inside the loop. Fine at the current handful-of-deployments scale; fold the counts into a
  single `GROUP BY` (or the candidates query) if the listed set grows large.
- **Quota "full" badges.** A deployment that has reached its `max_sessions` quota passes the
  `listed` filter but fails `check_deployable` (409), so it drops out of the catalogue. The
  participant portal has no way to know whether a study is "full" vs. not yet open. Add an
  optional `status` field (`open`/`full`/`not_yet_open`) to catalogue items so the portal can
  display a "study full" badge rather than silently omitting the entry.

## PP-C follow-ups (my-data participant export — 2026-06-22)

- **Human questionnaire titles.** `GET /v1/me/sessions` returns `instrument_id` and
  `instrument_version` but no human-readable title. The title lives in the Library
  (`GET /v1/questionnaires/{id}/versions/{v}`); add a Library lookup (with caching)
  so the portal can show a friendly name. Deferred — requires the Library to be
  reachable from the VS at all times.
- **JSON download.** `/v1/me/responses.csv` is CSV-only (BDM-native). A
  `GET /v1/me/responses.json` endpoint returning a structured JSON array would improve
  client-side rendering and match the researcher's future JSON export format. Deferred.
- **Participant response erasure ("delete my data").** No `DELETE /v1/me` or
  `DELETE /v1/me/sessions/{id}` endpoint exists. GDPR-style erasure needs a cascade
  through responses, events, and the outbox. Deferred to a dedicated privacy-compliance
  sprint (PP-E or later).
- **Outbox retention affects what "my data" returns.** If outbox rows are ever pruned
  (see VS-B FOLLOWUPS), and the responses table is pruned alongside them, the export
  will silently lose historical rows. Ensure the pruning policy documents what "my data"
  can guarantee, and consider a separate participant-facing archive table if long-term
  participant access is needed.

## PP-B follow-ups (signed invite links — 2026-06-22)

- **Single-use invites.** Invites are currently multi-use until expiry. Single-use enforcement
  requires a `consumed_invites` table (keyed by token hash) and an atomic check-and-insert at
  session-mint time — deferred until a study design requires single-use guarantees.
- **Bulk invite generation.** The current endpoint mints one invite per request. A bulk endpoint
  (`POST /v1/deployments/{id}/invites/bulk`, body `[{participant_id, ttl_seconds}, …]`) returning
  a list of signed tokens + URLs is deferred.
- **"Attach an account to recover data" upgrade for invite participants.** Invite sessions are
  tagged `participant_sub=invite:<code>`. Participants cannot currently link this session to an
  Identity account (which would let them resume from another device or access their data via PP-C).
  An account-attach flow (POST a token from the invite session to an Identity-owned session, merging
  `participant_sub`) is deferred to a future PP iteration.
- **`url` is relative unless `VS_PUBLIC_BASE` is set.** The `url` field in the mint response is a
  bare query string (`?deployment=<id>&invite=<token>`) unless `VS_PUBLIC_BASE` is configured, in
  which case it becomes `{VS_PUBLIC_BASE}/?deployment=<id>&invite=<token>`. The link is opened in the
  Web Viewer, so in production set `VS_PUBLIC_BASE` to the public Web-Viewer base URL.

## PP-A follow-ups (authenticated participant sessions — 2026-06-22)

- **"My data" participant export (PP-C).** Participants cannot yet request or download their
  own response data. Deferred to PP-C.
- **Signed invite links (PP-B).** Authenticated deployments currently rely on participants
  logging in via the viewer's login screen; time-limited signed invite links (eliminating the
  manual login step) are deferred to PP-B.
- **Dedicated `participant` role + self-registration.** Participants are currently verified by
  any valid Identity token (role-agnostic). A dedicated participant role and a self-service
  registration flow are deferred — decide on Identity service scope (PP-B or ID-E).
- **Per-deployment `agent_id` pseudonymisation.** `participant_sub` is stored verbatim (= the
  stable `sub` from the Identity token). Per-deployment pseudonymous `agent_id`s (so that the
  same participant appears under a different id across deployments) are deferred to a future OD.
- **Concurrent-mint race on `session_index`.** `session_index` is computed as
  `count(existing sessions for this participant_sub) + 1`. This is not a serialised transaction,
  so two near-simultaneous mints for the same participant could receive the same index. Fix with
  a `SELECT ... FOR UPDATE` on the count or a `SERIAL`-per-participant counter if collision-free
  indices are required.

## VS-E follow-ups

- **SSE dashboard transport.** The metrics endpoint is a pollable JSON snapshot; add the 08a SSE
  stream when a dashboard UI consumes it.
- **Abandonment hotspots.** Per-question drop-off (Phase-5 dashboard) needs event-level telemetry.
- **Theme editor (Phase 6, UC-13).** No logo-upload / colour-picker / custom-CSS-authoring UI,
  accessibility-conformance UI, or theme versioning; `POST /themes` is a raw create (unauthenticated).
- **Theme application.** VS-E returns the bundle at session-mint; applying it (+ the R18 style/flow
  overrides) is the Web Viewer's job.
- **Viewer Service is now feature-complete for Phase 2 (VS-A..E).** Remaining Phase-2 gate work is
  non-VS: the Web Viewer, the WASM expression evaluator, and the Scorer conformance runner.
- **Scorer artifact storage:** SP2a serves scorer wasm from a VS-local dir (`VS_SCORER_DIR`) and rewrites `impl.url` at mint (`VS_PUBLIC_BASE`). Real storage belongs in the Library (`GET /v1/scorers/{id}/versions/{v}/impl.wasm`) — SP3.
- **Scoring deploy config (SP2a):** in-session scoring requires the VS to (1) serve the scorer wasm — set `VS_SCORER_DIR` to a dir containing the binaries and `VS_SCORER_MAP` (JSON `{"scr_<id>@v<ver>": "<file>.wasm"}`) mapping each scorer ref to its file (default falls back to `<ref>.wasm`); and (2) rewrite impl URLs — set `VS_PUBLIC_BASE` to the VS's public base. Example for the reference PHQ-9: `VS_SCORER_DIR=…/questionnaire-scorer/dist-wasm VS_SCORER_MAP='{"scr_phq9@v26.0602":"phq9.wasm"}' VS_PUBLIC_BASE=https://<vs>`.
- **scorer_outputs forwarding (SP3):** SP2b stores `scorer_outputs` on the session (JSONB column) via `POST /sessions/{id}/scorer_outputs`. Forwarding it to Behaverse (the outbox sink learning the Schema 6 session-metadata payload) is deferred to SP3.

## Deployment locale validation (2026-06-23, found during PA-2 manual testing)

- **VS does not validate `available_locales` against the questionnaire's content at deployment-create.**
  A deployment created with `available_locales: ["en","pt"]` for a questionnaire that only has `en`
  content builds fine for `en` but the denormaliser raises an **unhandled `PreflightError` → 500**
  when a runtime is built for the missing locale (`missing_locale: <id> has no locale 'pt'`). This
  surfaced as a `resume_unreachable` dead-end in the web viewer. Fixes (pick one): (a) at
  `POST /v1/deployments`, fetch the questionnaire and reject `available_locales` not fully supported
  (clean 4xx); and/or (b) map the denormaliser `PreflightError` to a clean `4xx` (e.g. 422) instead of
  letting it 500. Mint with an unsupported *requested* locale already returns 422; the gap is the
  runtime build for a deployment-declared locale.
