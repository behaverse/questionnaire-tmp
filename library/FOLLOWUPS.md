# Library Core — known follow-ups

Captured from the final whole-implementation review (2026-06-05). The DoD (spec §10) is met and the suite is green; these are deferred enhancements / spec-surface gaps, not blockers.

Updated 2026-06-06: completed items from the first follow-up pass have been removed.

## API surface — still deferred
- Detail endpoint returns metadata only (`EntitySummary`); spec §5 wants the resolved item list on questionnaire detail — deferred to the contribution-workflow lifecycle work (sub-project 3).

## Cleanups
- `licensing.effective_license` returns `mixed_see_components` without surfacing the strictest component tag (spec §4.3 wants the strictest surfaced); `STRICTNESS` is defined for this but unused.

## Doc/stack drift (spec overstates what's built — acceptable simplifications)
- Spec §2/§8 mention Alembic migrations and a `library serve` subcommand; the implementation applies `store/schema.sql` via `store/migrate.apply_schema` (no Alembic) and is run via `uvicorn library.api.app:create_app` (no `serve` subcommand). A `rebuild-index` CLI subcommand (spec §4.2) is also not exposed, though `store/index.rebuild_index_for` exists.

## Withdraw semantics (decided here; revisit with the full lifecycle in sub-project 3)
- `withdraw_entity` now marks both `entity` and `catalogue_entry` as `withdrawn`, so withdrawn entries drop out of listings/search and `/definition` returns 410. Whether questionnaire *detail* should return a 410 stub (citations resolvable) vs 404 is deferred to the contribution-workflow lifecycle work.

## Data quality — deferred to a QA pass (needs editing features)

Surfaced during the OD-21 instrument/variant follow-up (2026-06-10):

- **Variant labels for legacy imports.** All 64 imported questionnaires have `variant: "base"`; the genuine per-form variants (8 instrument families) are distinguished only by id + item count. Curating human-readable variant labels (e.g. ASRS "Full" / "Part A screener" / "Inattentive" / "Part A + Inattentive") needs editing/curation tooling.
- **Surface the response-scale distinction.** The multi-form families are genuine variants differing by their answer scale (e.g. `grit8` 5-pt similarity vs `x_grit8` 7-pt agreement; ASRS Part-A's 5-pt ARCES frequency vs the full form's 7-pt frequency). This scale / measurement-type distinction is not surfaced on cards; surfacing it is a QA-pass enhancement.
