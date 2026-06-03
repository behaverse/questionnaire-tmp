# Changelog

## [v26.0603] — 2026-06-03

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for Viewer Conformance Manifest per OD-18c.
- Required fields: `viewer_id`, `viewer_version`, `schema_support` (questionnaire/instrument), `evaluator` (language_version + functions), `widgets`, `scorer_impl_kinds`.
- Optional fields: `behavioural_channels` (response_time/mouse/keyboard/webcam/microphone), `logic_actions` (skip/visibility/piping/branch), `locale_switching`, `resume`, `max_session_duration_minutes`, `viewer_url`, `extensions`.
- Three examples: `minimal_manifest.json`, `web_viewer_manifest.json`, `native_viewer_manifest.json`.
- JSON-LD context.

**Severity:** initial.
**Authoritative source:** [design/05d_runtime.md](../../design/05d_runtime.md) §6.
