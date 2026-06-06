# Library Core — known follow-ups

Captured from the final whole-implementation review (2026-06-05). The DoD (spec §10) is met and the suite is green; these are deferred enhancements / spec-surface gaps, not blockers.

## API surface (spec §5) not yet built
- `GET /v1/questionnaires/{id}/versions/{version}` (specific-version detail) — only latest detail + version list exist.
- `GET /v1/entities/{type}/{id}` and `.../versions/{version}` (reusable-entity detail) — only list + dependents exist.
- Convenience aliases `GET /v1/questions`, `GET /v1/options`.
- Filter params on `GET /v1/questionnaires` (`domain`, `population`, `language`, `license`, `min_items`, `max_items`, `sort`) — the `facet` table is populated and `/facets` reads it, but no list endpoint joins it yet. Only `q` (full-text) is wired.
- Detail endpoint returns metadata only (`EntitySummary`); spec §5 wants the resolved item list on questionnaire detail.

## Cleanups
- `store/db.py:get_pool` is dead code — wire it into a FastAPI `lifespan` (per the NOTE in the file) or remove it; the API currently opens one psycopg connection per request via `api/deps.get_conn` (correct + leak-free, just not pooled).
- `licensing.effective_license` returns `mixed_see_components` without surfacing the strictest component tag (spec §4.3 wants the strictest surfaced); `STRICTNESS` is defined for this but unused.
- `/search` and `/facets` do not validate the `type`/`facet_type` argument against known values (an unknown value yields empty results rather than 404/422); `GET /v1/entities/{type}` does validate.

## Doc/stack drift (spec overstates what's built — acceptable simplifications)
- Spec §2/§8 mention Alembic migrations and a `library serve` subcommand; the implementation applies `store/schema.sql` via `store/migrate.apply_schema` (no Alembic) and is run via `uvicorn library.api.app:create_app` (no `serve` subcommand). A `rebuild-index` CLI subcommand (spec §4.2) is also not exposed, though `store/index.rebuild_index_for` exists.

## Withdraw semantics (decided here; revisit with the full lifecycle in sub-project 3)
- `withdraw_entity` now marks both `entity` and `catalogue_entry` as `withdrawn`, so withdrawn entries drop out of listings/search and `/definition` returns 410. Whether questionnaire *detail* should return a 410 stub (citations resolvable) vs 404 is deferred to the contribution-workflow lifecycle work.
