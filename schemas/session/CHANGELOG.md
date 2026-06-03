# Changelog

## [v26.0603] — 2026-06-03

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for Session Metadata.
- Required fields: `session_id` (UUID v4), `session_index` (integer per-agent ordering), `agent_id`, `instrument_id`, `instrument_version`, `status`, `started_at`.
- Optional fields: deployment_id, lifecycle timestamps, forward retry tracking, initial/last_active locale, device, `scorer_outputs`.
- `scorer_outputs` field per OD-17g: per-Scorer structured output, keyed by CalVer-pinned Scorer ref (`scr_…@vYY.MMDD`), each value conforming to the Scorer entity's `output_schema`.
- `$defs.Locale` and `$defs.Device` shared types.
- Three examples: `minimal_session.json`, `phq9_session.json`, `kitchensink_session.json`.

**Severity:** initial (no prior version).
**Authoritative source:** [design/05_data_model.md](../../design/05_data_model.md) §"Schema 6", [design/05b_scoring.md](../../design/05b_scoring.md) (Scorer contract).
