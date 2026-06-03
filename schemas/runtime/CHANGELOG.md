# Changelog

## [v26.0603] — 2026-06-03

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for Questionnaire Runtime per OD-18.
- Root shape with required `provenance`, `metadata`, `pages`; optional `locale`, `available_locales`, `style`, `flow`, `blocks`, `scores`, `logic`, `validation`, `lock_show_score_timing`, `extensions`.
- `$defs`: `RuntimeProvenance` (denormaliser metadata + cache-key inputs + stripped refs); `EmbeddedInstrument` (inline Schema 1 metadata); `PinnedScore` (with embedded chosen `impl`); `PinnedScorerImpl` (oneOf wasm/http/python/r).
- Three examples: `minimal_runtime.json`, `phq9_runtime.json`, `kitchensink_runtime.json`.
- JSON-LD context with vocabulary mappings.
- Two new cross-checks in the project validator: `check_pinned_scorer_consistency` (verifies pinned `impl.kind` is declared by the referenced Scorer); `check_runtime_provenance_completeness` (verifies all required provenance fields present).

**Severity:** initial (no prior version).
**Authoritative source:** [design/05d_runtime.md](../../design/05d_runtime.md), [design/05_data_model.md](../../design/05_data_model.md) §"Schema 3".
