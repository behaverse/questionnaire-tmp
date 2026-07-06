# Library Core — Handoff

**Path:** `library/` · **Stack:** Python / FastAPI / Postgres (jsonb source-of-truth + derived index, "Approach C") · **Status:** ✅ built + deployed LIVE ([questionnaire-library.vercel.app](https://questionnaire-library.vercel.app), Supabase eu-central-1) · **Suggested branch:** `work/library`

> The read-only canonical catalogue of questionnaires and reusable entities (Schema 2). It serves a public `/v1` REST API consumed by the Editor, the Library Web UI, and the Viewer Service, plus the `survey_db` importer and Identity-gated community signals.
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **Read-only catalogue API** (`src/library/api/`): `questionnaires.py`, `entities.py`, `search.py`, `resolve.py`, `community.py`, `identity.py`, wired in `app.py`. Public read endpoints under `/v1` (list/detail/search/stats/resolve/healthz); no auth to browse or download definitions.
- **Storage = jsonb + derived index.** Full entity bodies live in `entity.content_json` (source of truth); `catalogue_entry` (incl. a GIN-indexed `search_tsv`), `entity_ref`, and `facet` are *derived* by `store/index.py` `rebuild_index_for()`. Query layer: `query.py` `list_entries()` + `api/search.py`.
- **Git-backed read-only ingestion.** `cli.py` exposes `migrate`, `ingest <dir> --release vYY.MMDD`, `import-survey-db`. Schema applied via `store/migrate.apply_schema` (no Alembic).
- **survey_db importer** (`src/library/importers/survey_db/`): `survey_db.sqlite` → Schema-2 JSON + provenance + loss report (`mappers.py`, `writer.py`, `provenance.py`, `loss.py`). Produced the 64 imported questionnaires (8 instrument families, all `variant: "base"`).
- **Community signals (ID-C1)**: Identity-gated threaded comments + 1–5 ratings + GDPR self-erasure (`api/community.py`, `store/community.py`). First Library *write* endpoints; reads are public. JWT/JWKS verification via `identity_service`.
- **Faceting / instrument grouping** (OD-21): `domain` / `population` / `administration_mode` facets + `instrument_id` / `variant` drive the grouped catalogue.

## Run & test
```bash
source .venv/bin/activate
# Tests (testcontainers Postgres — DOCKER_CONFIG override is REQUIRED;
# run library/ in its OWN pytest invocation, NOT combined with viewer-service/):
DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q

# Local run (from repo root):
python -m library.cli migrate
python -m library.cli import-survey-db <survey_db.sqlite> --release vYY.MMDD --imported-at <ts>
python -m library.cli ingest <content-dir> --release vYY.MMDD
LIBRARY_CORS_ORIGINS="http://localhost:5173,..." uvicorn library.api.app:create_app --factory --port 8000
```
- `LIBRARY_CORS_ORIGINS` must list the consuming origins (Editor / Library-Web) or browser calls fail — test the **browser** request, not just the API.
- Community auth needs `IDENTITY_JWKS_URL` / `IDENTITY_ISSUER` / `IDENTITY_AUDIENCE` (default aud `questionnaire-apps`).
- Live data is seeded **manually** (`scripts/seed-supabase.md`) — there is no auto re-ingest on deploy.

## What's left to do
The component is feature-complete and live. Remaining items are enhancements / blocked lifecycle work.

### Now
- **Server-side content search index.** Index entity `content` text (prompt text, option anchors) into `search_tsv` so `q` matches content, not just id/title. Full implementation guide + exact code + required live re-ingest in **[HANDOFF_content_search_index.md](HANDOFF_content_search_index.md)**. Unblocks dropping the Editor picker's client-side 300-cap stopgap (ED-I·F7). Owner action: re-seed live DB after merge (§4).
- **Surface the strictest license.** `licensing.effective_license` returns `mixed_see_components` but doesn't surface the strictest component tag (spec §4.3); `STRICTNESS` is defined but unused. See [FOLLOWUPS.md](FOLLOWUPS.md) "Cleanups".

### Next
- **Resolved item-list on questionnaire detail.** Detail returns metadata only (`EntitySummary`); spec §5 wants the resolved item list. Tied to the contribution-workflow lifecycle. ([FOLLOWUPS.md](FOLLOWUPS.md) "API surface").
- **Stack drift cleanups (optional).** No Alembic / no `library serve` subcommand / no `rebuild-index` CLI (though `store/index.rebuild_index_for` exists). Acceptable simplifications; expose them only if needed.
- **Variant labels & response-scale QA.** All 64 imports are `variant: "base"`; genuine per-form variants (e.g. ASRS Full/Part-A/Inattentive; `grit8` 5-pt vs `x_grit8` 7-pt) need human-readable labels + scale-type surfaced on cards. Needs editing/curation tooling — deferred QA pass. ([FOLLOWUPS.md](FOLLOWUPS.md) "Data quality").
- **Search-ranking & usage-stats signals.** Fold comment volume / mean rating into `ts_rank`; surface VS view/start/completion counts on cards (needs a cross-service read / aggregation feed — no cross-service calls yet).

### Deferred / blocked
- 🔒 **Contribution / review workflow + `draft`/`in_review` lifecycle (ID-C2, sub-project 3).** Propose → draft → peer-review → publish → withdraw with per-entry visibility. Blocked on Identity/OD-08 (GitHub-model decision).
- 🔒 **DOI minting (ID-C3, DataCite).** Persistent DOIs on library acceptance. Blocked on the lifecycle work above.
- **Comment editing** (delete+repost works today); **use-case-suitability ratings**; **GET/DELETE rating not 404-ing on unknown qid** (deliberate idempotent minor). All in [FOLLOWUPS.md](FOLLOWUPS.md).

### Cross-cutting (NOT a Library task)
- **Classification complete** — all 222 entries carry classification (domain/population/administration_mode) + instrument_id; `/v1/facets` spans the full catalogue.

## Conventions & gotchas
- **Tests need `DOCKER_CONFIG=/tmp/lib_docker`** (testcontainers Postgres) and must run as their **own** pytest invocation — do **not** combine with `viewer-service/`.
- **Don't re-import casually.** Canonical content is live on Supabase; re-seeding TRUNCATEs + re-ingests. Always re-ingest the **full current set** (survey_db + harvested) and never drop harvested entities.
- **DEPLOY:** live Library auto-deploys from `master`. Root `requirements.txt` must keep `questionnaire-identity-service @ ./identity-service` — the Library imports `identity_service` on boot (community auth) and will 500 without it.
- **Ops follow-up:** the deployed function runs in `iad1` (US) while Supabase is `eu-central-1`; consider moving to `fra1` for latency.
- **Re-seeding a schema change:** DROP SCHEMA before migrate (per the instrument-grouping re-seed note).
- Finish branches by **merging to master locally + pushing — no PRs**. `git fetch` + ff/rebase before pushing.

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md) · [HANDOFF_content_search_index.md](HANDOFF_content_search_index.md)
- Live re-seed runbook: [../scripts/seed-supabase.md](../scripts/seed-supabase.md)
- Harvester (classification-gap owner): [../questionnaire-harvester/HANDOFF.md](../questionnaire-harvester/HANDOFF.md)
- System-wide context: root [../HANDOFF.md](../HANDOFF.md)
