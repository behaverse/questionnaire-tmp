# Viewer Service VS-E (Monitoring Dashboard + Theme Infrastructure) — Design Spec

**Date drafted:** 2026-06-11
**Author:** Viewer Service VS-E brainstorming session (2026-06-11)
**Component:** **Viewer Service**, sub-project **VS-E** — the final Viewer Service stage. Two independent additive surfaces: (A) a minimal **monitoring dashboard** (UC-12) and (B) **theme infrastructure** (UC-13 Phase-2 infra). Completing VS-E makes the Viewer Service feature-complete for Phase 2 (VS-A runtime · VS-B sessions/submission/forwarding · VS-C deployment lifecycle · VS-D export · VS-E dashboard+theming).
**Target repo:** `questionnaire-viewer-service` — extends the existing `viewer-service/` package.
**Stack:** Python 3.12 · FastAPI · PostgreSQL (psycopg 3, `jsonb`) · pytest + testcontainers. (No new deps; pure-Python WCAG contrast.)
**Authoritative source documents:**

- [design/08a_viewer_service.md](../../../design/08a_viewer_service.md) — §"Real-time monitoring dashboard" (metrics + SSE + the OD-13 alert) and §"Theming" (theme bundle + WCAG-at-save + the Phase-2-infra/Phase-6-editor split).
- [plan/03_use_case_priority.md](../../../plan/03_use_case_priority.md) — UC-12 (minimal in Phase 2) + UC-13 (infra in Phase 2, editor in Phase 6).
- **OD-13** (the dashboard's unforwarded-queue alert) + **OD-07** (the deployment `channels` matrix, already on the deployment).
- [docs/superpowers/specs/2026-06-11-viewer-service-vs-c-design.md](2026-06-11-viewer-service-vs-c-design.md) — the deployment record (carries `theme_id`, `quota`) + sessions VS-E reads.

**VS-E** adds two read/store surfaces to the Viewer Service: a per-deployment **metrics snapshot** (`GET /v1/deployments/{id}/metrics`) computed from the existing `session`/`outbox` tables, and a **theme store** (CRUD + WCAG-at-save + built-in themes) whose bundle is returned to the viewer at session-mint.

---

## 1 — Scope

### 1.1 In scope — A. Monitoring dashboard
- **`store/metrics.py`** + **`metrics.py`** (service): `deployment_metrics(conn, deployment_id, *, soft_threshold) -> dict` returning a JSON snapshot:
  - `active_sessions` — count of `status='in_progress'` sessions for the deployment.
  - `completion` — `{started, completed, rate}` where `started` = total sessions, `completed` = `status IN ('submitted','forwarded')`, `rate` = `completed/started` (0.0 if `started==0`).
  - `quota` — `{max_sessions, used, remaining}` from `deployment.quota.max_sessions` (nullable) + the session count.
  - `recent_submissions` — the latest ≤10 submitted/forwarded sessions, **anonymised**: `[{session_id, session_index, status, submitted_at, forwarded_at}]` (no token, no `device`).
  - `forwarding` (OD-13) — `{unforwarded, oldest_unforwarded_age_seconds, last_error, alert}`: `unforwarded` = pending `outbox` rows for the deployment's sessions; `oldest_unforwarded_age_seconds` = `now - min(created_at)` of those (or `null`); `last_error` = most recent `outbox.last_error` for the deployment (or `null`); `alert = unforwarded >= soft_threshold`.
- **`api/metrics.py`**: `GET /v1/deployments/{id}/metrics` → **404** if the deployment is unknown, else the snapshot. Registered in `app.py`.

### 1.2 In scope — B. Theme infrastructure
- New Postgres **`theme`** table (idempotent `CREATE TABLE IF NOT EXISTS`): `theme_id` (text PK — slug for built-ins, `thm_{uuid8}` for created), `name`, `palette` (jsonb), `typography` (jsonb), `spacing` (jsonb), `logo_url` (text), `custom_css` (text), `created_at`.
- **`themes.py`** (service): pure `contrast_ratio(hex_fg, hex_bg) -> float` (WCAG 2.1 relative-luminance ratio) + `check_accessibility(palette, typography) -> None` raising `ThemeAccessibilityError(failures: list[str])` when any of `palette.{primary,secondary,success,warning,error}` is `< 4.5:1` against the background (`palette.background` or default `#ffffff`) **or** `typography.base_size < 14`. Plus `BUILTIN_THEMES` (a `default` + 2 institutional templates, all WCAG-passing) and `seed_builtin_themes(conn)` (idempotent upsert).
- **`store/themes.py`**: `insert_theme(conn, **fields)`, `get_theme(conn, theme_id) -> dict | None`, `list_themes(conn) -> list[dict]`.
- **`api/themes.py`**: `POST /v1/themes` (run `check_accessibility` → **422 `theme_inaccessible`** with the failing colours/size on fail, else insert with a generated `thm_` id → `{theme_id}`); `GET /v1/themes` (`{items:[...]}`); `GET /v1/themes/{id}` (404 if absent). Registered in `app.py`.
- **`seed_builtin_themes`** is invoked by `cli.py migrate` (so a migrated DB has the built-ins) and by tests that need them.

### 1.3 In scope — C. Session-mint theme injection
- `sessions.new_session` resolves `deployment.theme_id` → the theme bundle (via `store/themes.get_theme`) and adds it to the `/sessions/new` response: `{session_id, session_token, runtime, theme}` (`theme` = the bundle dict, or `null` when `theme_id` is null/unknown). Additive to the existing response.

### 1.4 Non-goals (deferred)
- **No SSE / push transport** — the metrics endpoint is a pollable JSON snapshot; SSE (per 08a) is added when a dashboard UI consumes it.
- **No abandonment-hotspots metric** — needs per-question event-level telemetry; a Phase-5 dashboard feature.
- **No dashboard UI** — VS-E ships the metrics API; the researcher-facing dashboard page is a later frontend (like `library-web`).
- **No theme editor** (UC-13 Phase 6) — no logo-upload UI, colour-picker, custom-CSS-authoring UI, accessibility-conformance UI, or theme versioning. `custom_css` is a stored field but there is no editor; `POST /themes` is a raw create (admin-style, unauthenticated for now).
- **No theme application in the runtime** — VS-E returns the bundle; *applying* it (and the R18 style/flow overrides) is the Web Viewer's job.
- **No reconciliation / `validated` state** — deferred (Behaverse-blocked).
- **No auth** — consistent with VS-A..D; gated when Identity lands.

---

## 2 — Module layout (additions to `viewer-service/`)

```
viewer-service/src/viewer_service/
├── metrics.py                # NEW: deployment_metrics(conn, deployment_id, *, soft_threshold)
├── themes.py                 # NEW: contrast_ratio, check_accessibility, ThemeAccessibilityError,
│                             #      BUILTIN_THEMES, seed_builtin_themes
├── sessions.py               # (modify) new_session: resolve + return theme
├── cli.py                    # (modify) migrate also seeds built-in themes
├── store/
│   ├── schema.sql            # (modify) + theme table
│   ├── metrics.py            # NEW: per-deployment session/outbox metric queries
│   └── themes.py             # NEW: insert_theme / get_theme / list_themes
└── api/
    ├── app.py                # (modify) register metrics + themes routers
    ├── metrics.py            # NEW: GET /deployments/{id}/metrics
    └── themes.py             # NEW: POST/GET /themes
tests/
├── test_themes_unit.py       # contrast_ratio + check_accessibility (pure)
├── test_themes_api.py        # create (pass/blocked), list, get, built-ins (testcontainers)
├── test_metrics.py           # deployment_metrics over seeded data (testcontainers)
├── test_metrics_api.py       # endpoint + 404 (testcontainers + TestClient)
└── test_session_theme.py     # /sessions/new theme injection (testcontainers + TestClient)
```

---

## 3 — Monitoring dashboard

`store/metrics.py` provides the raw queries (all scoped to the deployment's sessions):
- `session_status_counts(conn, deployment_id) -> dict[str,int]` — `GROUP BY status`.
- `recent_submitted(conn, deployment_id, limit=10) -> list[dict]` — submitted/forwarded sessions ordered by `submitted_at DESC`.
- `outbox_forwarding_stats(conn, deployment_id) -> dict` — `{unforwarded, oldest_created_at, last_error}` over the deployment's outbox rows (`unforwarded` = `status='pending'`).

`metrics.deployment_metrics(conn, deployment_id, *, soft_threshold, now)` assembles the snapshot (above), computing `rate`, `quota.remaining`, `oldest_unforwarded_age_seconds = (now - oldest_created_at).total_seconds()`, and `alert`. `now` is injectable for deterministic tests. The deployment must exist (the API does the 404 check first; `deployment_metrics` reads `deployment.quota`).

`api/metrics.py`: `GET /v1/deployments/{id}/metrics` → load deployment (404 if `None`); else `deployment_metrics(conn, id, soft_threshold=get_settings().outbox_soft_threshold, now=datetime.now(timezone.utc))`.

## 4 — Theme infrastructure

`theme` DDL (appended to `schema.sql`):
```sql
CREATE TABLE IF NOT EXISTS theme (
  theme_id    text PRIMARY KEY,
  name        text NOT NULL,
  palette     jsonb NOT NULL,
  typography  jsonb NOT NULL,
  spacing     jsonb,
  logo_url    text,
  custom_css  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

`themes.py`:
- `contrast_ratio(hex_fg, hex_bg) -> float` — parse `#rrggbb` → sRGB → WCAG relative luminance `L` → `(L_lighter + 0.05) / (L_darker + 0.05)`.
- `check_accessibility(palette, typography)` — for each of `primary, secondary, success, warning, error` present in `palette`, require `contrast_ratio(color, palette.get("background", "#ffffff")) >= 4.5`; require `typography.get("base_size", 0) >= 14`. Collect all failures; raise `ThemeAccessibilityError(failures)` if any.
- `BUILTIN_THEMES` — `default` (neutral, WCAG-passing) + 2 institutional templates; `seed_builtin_themes(conn)` upserts them (`ON CONFLICT (theme_id) DO NOTHING`).

`api/themes.py`:
- `POST /v1/themes` body `{name, palette, typography, spacing?, logo_url?, custom_css?}` → `check_accessibility` (422 `theme_inaccessible` + `detail: failures` on fail) → `insert_theme(theme_id="thm_"+uuid4().hex[:8], ...)` → `{theme_id}`.
- `GET /v1/themes` → `{items: [theme...]}`; `GET /v1/themes/{id}` → theme or 404.

## 5 — Session-mint theme injection (`sessions.new_session`)

After minting + persisting (unchanged), resolve the theme and extend the return:
```python
theme = themes_store.get_theme(conn, deployment["theme_id"]) if deployment.get("theme_id") else None
return {"session_id": session_id, "session_token": token, "runtime": runtime, "theme": theme}
```

## 6 — Error handling (additions)

| Condition | HTTP | `error.code` |
|---|---|---|
| Metrics for unknown deployment | 404 | `not_found` |
| Theme fails WCAG / min-font check (create) | 422 | `theme_inaccessible` (`detail` = failures) |
| Get unknown theme | 404 | `not_found` |

## 7 — Testing (TDD)

- **`themes` unit (pure):** `contrast_ratio("#000000","#ffffff") ≈ 21`, `("#ffffff","#ffffff") == 1`; `check_accessibility` passes a WCAG-OK palette, raises on a low-contrast colour (e.g. `#dddddd` text on white) listing it, raises on `base_size=10`; every `BUILTIN_THEMES` entry passes `check_accessibility`.
- **theme API (testcontainers):** `POST` a passing theme → 201 `{theme_id}` (prefix `thm_`); `POST` a low-contrast theme → 422 `theme_inaccessible`; `GET /themes` after `seed_builtin_themes` lists ≥3 built-ins; `GET /themes/{id}` returns one; unknown → 404.
- **metrics (testcontainers):** seed a deployment + sessions in mixed statuses + outbox rows → `deployment_metrics` returns correct `active_sessions`, `completion.rate`, `quota`, `recent_submissions` (≤10, anonymised), `forwarding` (unforwarded count, oldest age via injected `now`, last_error); `alert` true when `unforwarded >= soft_threshold` (use a tiny `soft_threshold`).
- **metrics API (testcontainers + TestClient):** create deployment → `GET /metrics` 200 snapshot; unknown deployment → 404.
- **session-mint theme (testcontainers + TestClient):** deployment with `theme_id` (a seeded built-in) → `/sessions/new` response `theme` is that bundle; deployment without `theme_id` → `theme` is `null`.
- **Verification gate** (run each suite separately): `viewer-service/` green (VS-A..E); `library/` 126; `questionnaire-runtime-denormaliser/` 56; `tools/tests` 309.

---

## 8 — Decisions locked in this session (2026-06-11)

| # | Decision | Choice |
|---|---|---|
| D1 | VS-E scope | Dashboard **metrics API** + **theme infrastructure** — finishes the Viewer Service. |
| D2 | Abandonment hotspots | **Deferred to Phase 5** (needs event-level telemetry); ship the 4 readily-computable metrics + the OD-13 alert. |
| D3 | Dashboard transport | **JSON snapshot endpoint now; SSE deferred** (no UI consumer yet; computation is the durable value). |
| D4 | WCAG check | **Focused AA**: palette text colours ≥ 4.5:1 vs background (default white) + `base_size ≥ 14`; pure contrast-ratio fn, no dep. |
| D5 | Theme application | VS-E **returns** the bundle at session-mint; *applying* it (+ R18 overrides) is the Web Viewer's job. |
| D6 | Built-ins + editor | Seed a default + 2 institutional templates via `migrate`; the **theme editor** (uploads, custom-CSS authoring, versioning) is Phase 6. |
