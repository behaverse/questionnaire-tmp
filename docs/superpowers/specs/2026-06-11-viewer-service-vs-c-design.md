# Viewer Service VS-C (Deployment Management & Lifecycle) — Design Spec

**Date drafted:** 2026-06-11
**Author:** Viewer Service VS-C brainstorming session (2026-06-11)
**Component:** **Viewer Service**, sub-project **VS-C** — the deployment-management & lifecycle layer. The remaining Viewer Service work was split into **VS-C** (this — deployment record + mode presets + the deferred OD-14 resume/lifecycle rules + anonymous-link/demo modes; the Phase-2 critical path) and **VS-D** (export CSV serializer + monitoring dashboard + theming + reconciliation; additive researcher surfaces).
**Target repo:** `questionnaire-viewer-service` — VS-C **extends the existing `viewer-service/` package** (VS-A runtime core ✅ + VS-B sessions/submission/forwarding ✅).
**Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3, `jsonb`) · pytest + testcontainers. (No new deps.)
**Authoritative source documents:**

- [design/08a_viewer_service.md](../../../design/08a_viewer_service.md) — §"Deployments" (identity fields, modes/dimensions preset table, style/flow overrides R18), §"Sessions"→"Resume rules" (OD-14).
- **OD-14** (session resume; sub-q4 ephemeral refuse-resume, sub-q5 asymmetric `active_until`) — `project_session_resume_resolved` memory.
- [docs/superpowers/specs/2026-06-10-viewer-service-vs-a-design.md](2026-06-10-viewer-service-vs-a-design.md) + [.../2026-06-10-viewer-service-vs-b-design.md](2026-06-10-viewer-service-vs-b-design.md) — VS-A/VS-B, which VS-C extends.
- [plan/03_use_case_priority.md](../../../plan/03_use_case_priority.md) — UC-04 (anonymous-link) + UC-08 (demo) (the two gate-blocking modes VS-C delivers).
- [plan/01_roadmap.md](../../../plan/01_roadmap.md) §"Phase 2" — the Phase-2 gate (UC-04, UC-08 satisfied here).

**VS-C** turns VS-A/VS-B's minimal deployment into the **full deployment record** with **mode presets**, an **active window** (`active_from`/`active_until`), a **session quota**, and **style/flow overrides**, then wires the **deferred OD-14 lifecycle rules** (asymmetric `active_until`, ephemeral refuse-resume) into VS-B's mint/resume/submission paths — delivering the **anonymous-link (UC-04)** and **demo (UC-08)** modes.

---

## 1 — Scope

### 1.1 In scope
- **Extend the `deployment` record** (idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`): `mode_preset`, `dimensions` (jsonb), `active_from`, `active_until`, `quota` (jsonb), `style_overrides` (jsonb), `flow_overrides` (jsonb), `redirect_url`, `confirmation_message` (jsonb, translatable), `randomization_seed_strategy`, `channels` (jsonb), `created_by`, `consent_text_ref`. Add `ephemeral boolean DEFAULT false` to the **`session`** table.
- **Mode presets** (`modes.py`) — the 7-preset → 4-dimension table; `SUPPORTED = {anonymous_link, demo}` (both `auth: none`). `resolve_preset(preset)` returns the dimensions or raises `UnsupportedPreset`.
- **Deployment CRUD** — `POST /v1/deployments` (extended: requires `mode_preset`, resolves dimensions, validates override keys per R18, rejects unsupported presets → 422); `GET /v1/deployments/{id}` (full record); `GET /v1/deployments` (list summaries); `PATCH /v1/deployments/{id}` (narrow: only `active_until` + `quota` mutable). Refactor `store/deployments.py` to a `**fields` insert + `_SELECT_COLS` get (the record is now wide).
- **Active-window + quota enforcement at mint** — `check_deployable(deployment, now)`: `now > active_until` → **410 `gone`**; `now < active_from` → **409 `not_yet_open`**; sessions-for-deployment ≥ `quota.max_sessions` → **409 `quota_exhausted`**.
- **OD-14 resume rules wired into VS-B**:
  - **Asymmetric `active_until` (sub-q5):** resume paths do **not** re-check `active_until` (in-progress sessions resume past close); only *new* mints are gated.
  - **Ephemeral refuse-resume (sub-q4):** for an ephemeral session, `GET /sessions/{id}`, `/runtime`, `/locale` → **409 `ephemeral_no_resume`** (viewer mints fresh).
- **Ephemeral (demo) submission** — `/responses`·`/events` validate (Schema 5/4a) + return **202** but **skip the outbox** for ephemeral sessions ("no data leaves VS"); demo sessions never reach `forwarded`. `session.ephemeral` is set at mint from the deployment's persistence dimension (so the submission path needs no extra lookup).
- **UC-04 (anonymous-link)** + **UC-08 (demo)** delivered as the two supported presets.

### 1.2 Non-goals (deferred to VS-D / later)
- **No response export / CSV serializer** (UC-11), **no monitoring dashboard** (UC-12), **no theme infrastructure wiring** (`theme_id` stays stored-but-unused), **no Behaverse reconciliation / `validated` state** — all VS-D.
- **No ephemeral-session TTL purge sweeper** — ephemeral sessions are skip-outbox + refuse-resume now; a TTL/age-based purge of old ephemeral session rows is later.
- **No per-condition quota** — only a per-deployment `max_sessions` cap (per-condition needs Platform condition-assignment, Phase 5).
- **No non-`none`-auth presets** — access_code / platform_study / embedded / kiosk / preview are rejected at create until Identity/Platform/host integration exists (OD-08).
- **No full deployment update** — only `active_until` + `quota` are mutable via PATCH; other changes require a new deployment (questionnaire_ref is version-pinned-immutable).
- **No researcher/Identity auth** — deployment CRUD endpoints stay open (gated when Identity lands); `created_by` is stored if provided, else null.

---

## 2 — Module layout (additions / changes to `viewer-service/`)

```
viewer-service/src/viewer_service/
├── modes.py                  # NEW: PRESETS table, SUPPORTED, resolve_preset, UnsupportedPreset
├── deployments.py            # NEW: check_deployable (active window + quota) + DeploymentClosed/NotYetOpen/QuotaExhausted
├── models.py                 # (modify) extend DeploymentCreate; add DeploymentPatch
├── sessions.py               # (modify) new_session: check_deployable + set ephemeral
├── submission.py             # (modify) submit: skip outbox when ephemeral
├── store/
│   ├── schema.sql            # (modify) ALTER deployment + session (ADD COLUMN IF NOT EXISTS)
│   └── deployments.py        # (modify) **fields insert + _SELECT_COLS get + list + patch
└── api/
    ├── deployments.py        # (modify) extended create + get + list + patch
    └── sessions.py           # (modify) ephemeral → 409 on resume/runtime/locale
tests/
├── test_modes.py
├── test_deployable.py        # check_deployable: active window + quota (testcontainers)
├── test_deployments_api.py   # (modify/extend) full create, presets, override validation, list, patch
├── test_session_lifecycle.py # mint gating (410/409), ephemeral flag, ephemeral resume 409
└── test_submission_api.py    # (modify) add ephemeral skip-outbox case
```

---

## 3 — Data model evolution

Append to `store/schema.sql` (keeps the VS-A `deployment` CREATE + VS-B tables intact; idempotent on fresh and existing DBs):

```sql
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS mode_preset               text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS dimensions                jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_from               timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS active_until              timestamptz;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS quota                     jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS style_overrides           jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS flow_overrides            jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS redirect_url              text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS confirmation_message      jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS randomization_seed_strategy text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS channels                  jsonb;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS created_by                text;
ALTER TABLE deployment ADD COLUMN IF NOT EXISTS consent_text_ref          text;

ALTER TABLE session ADD COLUMN IF NOT EXISTS ephemeral boolean NOT NULL DEFAULT false;
```

All new `deployment` columns are nullable at the DB level (so `ADD COLUMN` is safe on a populated table); the create endpoint enforces `mode_preset` presence + sensible defaults (`randomization_seed_strategy='per_session'`, `channels`=OD-07 matrix `{rt:true,mouse:false,keyboard:false,webcam:false,microphone:false}`). `store/deployments.py` switches to a `_COLS`-driven `**fields` insert and a `_SELECT_COLS` `get_deployment` returning the full record (mirroring `store/sessions.py`).

`session.ephemeral` has `NOT NULL DEFAULT false` (safe `ADD COLUMN` — backfills existing rows). To avoid breaking VS-B's existing `insert_session` callers (which don't pass `ephemeral`), `store/sessions.insert_session` gains an **optional** `ephemeral: bool = False` keyword (the 12 base cols stay required via `**fields`); `ephemeral` is appended to `_SELECT_COLS` so `get_session`/`get_session_for_auth` return it. `new_session` passes `ephemeral=True` for demo deployments.

---

## 4 — Mode presets (`modes.py`)

```python
PRESETS = {
  "anonymous_link": {"auth": "none", "persistence": "persisted",  "lifecycle": "standard", "rendering_context": "standalone"},
  "demo":           {"auth": "none", "persistence": "ephemeral",  "lifecycle": "standard", "rendering_context": "standalone"},
  # access_code / platform_study / embedded / kiosk / preview exist in 08a but require
  # Identity/Platform/host integration -> NOT in SUPPORTED yet.
}
SUPPORTED = frozenset(PRESETS)   # = {"anonymous_link", "demo"}
```

`resolve_preset(preset) -> dict` returns the dimensions for a supported preset or raises `UnsupportedPreset(preset)`. (The full 7-preset table from 08a is documented; only the two `auth:none` presets are wired — others raise until their dependencies land.)

---

## 5 — Deployment CRUD

- **`POST /v1/deployments`** — body: `mode_preset` (required), `questionnaire_ref`, `runtime_policy`, `default_locale`, `available_locales`, and optional `theme_id`, `active_from`, `active_until`, `quota` (`{max_sessions}`), `style_overrides`, `flow_overrides`, `redirect_url`, `confirmation_message`, `randomization_seed_strategy`, `channels`, `created_by`, `consent_text_ref`.
  - `resolve_preset(mode_preset)` → `dimensions`; `UnsupportedPreset` → **422 `unsupported_preset`**.
  - Validate `style_overrides` keys ⊆ {`progress_bar`, `question_numbering`} and `flow_overrides` keys ⊆ {`max_time_seconds`} (R18); any other key (e.g. `allow_back`, `randomize_*`) → **422 `instrument_only_override`**.
  - Normalize `runtime_policy` via `RuntimePolicy(**policy).to_canonical_dict()` (VS-A); default `channels` + `randomization_seed_strategy`.
  - Insert; return `{deployment_id}`.
- **`GET /v1/deployments/{id}`** — full record (404 if absent).
- **`GET /v1/deployments`** — list of deployment summaries (`{deployment_id, questionnaire_ref, mode_preset, active_from, active_until, created_at}`); simple unpaginated list for MVP.
- **`PATCH /v1/deployments/{id}`** — body may carry `active_until` and/or `quota` only; updates those columns; other keys ignored. 404 if absent. (Closing a deployment = `PATCH {active_until: <now>}`.)

---

## 6 — Lifecycle wiring into sessions

**`deployments.check_deployable(deployment, now, session_count)`** (raises typed errors the route maps to HTTP):
- `active_until` set and `now > active_until` → `DeploymentClosed` → **410 `gone`**.
- `active_from` set and `now < active_from` → `NotYetOpen` → **409 `not_yet_open`**.
- `quota` has `max_sessions` and `session_count >= max_sessions` → `QuotaExhausted` → **409 `quota_exhausted`**.

**`POST /sessions/new`** (modify `sessions.new_session` + its route):
1. Load deployment + viewer (as VS-B).
2. `session_count = count(*) FROM session WHERE deployment_id = ...`; `check_deployable(deployment, now, session_count)`.
3. Mint runtime (VS-A) + allocate session/token (VS-B).
4. Set `ephemeral = (deployment.dimensions["persistence"] == "ephemeral")` on the session row.

**Resume / locale (modify `api/sessions.py`)** — `GET /sessions/{id}`, `GET /sessions/{id}/runtime`, `POST /sessions/{id}/locale`: if `session["ephemeral"]` → **409 `ephemeral_no_resume`**. They do **not** check `active_until` (asymmetric resume, sub-q5). *(This realizes OD-14 sub-q4's "refuse resume" by returning 409; the viewer re-mints via `/sessions/new`, rather than VS auto-minting inside a token-authed GET.)*

**Submission (modify `submission.submit` + routes)** — pass the session's `ephemeral` flag (already on the session dict from `require_session`). If ephemeral: validate (Schema 5/4a) + return **202 `{ephemeral: true}`** without enqueuing (no outbox row, never forwarded). Else: existing enqueue path.

---

## 7 — Error handling (additions)

| Condition | HTTP | `error.code` |
|---|---|---|
| Unsupported `mode_preset` (create) | 422 | `unsupported_preset` |
| Override of an instrument-only field (create) | 422 | `instrument_only_override` |
| New mint past `active_until` | 410 | `gone` |
| New mint before `active_from` | 409 | `not_yet_open` |
| Quota reached | 409 | `quota_exhausted` |
| Resume/runtime/locale on an ephemeral session | 409 | `ephemeral_no_resume` |

Envelope `{error:{code,message,detail?}}` (mirrors VS-A/VS-B). A `409` handler maps to code `conflict` by default; the specific codes above are set explicitly via `JSONResponse`.

---

## 8 — Testing (TDD)

- **Unit:** `modes.resolve_preset` (anonymous_link/demo resolve; unsupported raises).
- **`check_deployable` (testcontainers):** open deployment passes; past `active_until` → DeploymentClosed; before `active_from` → NotYetOpen; quota reached → QuotaExhausted.
- **Deployment API (testcontainers):** full create (all fields persist + dimensions resolved); unsupported preset → 422; instrument-only override → 422; get (full record); list; patch (active_until/quota mutate; other fields unchanged).
- **Session lifecycle (testcontainers):** mint past active_until → 410; before active_from → 409; quota exhausted → 409; demo deployment → session.ephemeral true; anonymous_link → ephemeral false; ephemeral session resume/runtime/locale → 409.
- **Submission (extend VS-B test):** ephemeral session → `/responses` returns 202 with no outbox row (`counts.pending == 0`); persisted session → existing enqueue path still works.
- **Verification gate** (run each suite separately): `viewer-service/` green (VS-A+VS-B+VS-C); `library/` 126; `questionnaire-runtime-denormaliser/` 56; `tools/tests` 309.

---

## 9 — Decisions locked in this session (2026-06-11)

| # | Decision | Choice |
|---|---|---|
| D1 | VS-C/VS-D split | VS-C = deployment management & lifecycle + OD-14 resume + anon/demo modes (critical path); VS-D = export + dashboard + theming + reconciliation. |
| D2 | Quota | **Per-deployment `max_sessions` cap** only; per-condition deferred (Platform). |
| D3 | Unsupported presets | **Support `anonymous_link` + `demo`; reject others** (auth != none) at create → 422. |
| D4 | Ephemeral (demo) data | **Validate + 202 but skip the outbox** (no forwarding); never reach `forwarded`. |
| D5 | Ephemeral resume | **409 `ephemeral_no_resume`** (viewer re-mints); resume paths don't re-check `active_until` (asymmetric). |
| D6 | Deployment mutability | Create/get/list + **narrow PATCH** (`active_until`, `quota` only); rest immutable. |
| D7 | Schema evolution | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `schema.sql` (no Alembic); new deployment columns nullable, app-enforced. |
