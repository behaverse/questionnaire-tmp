# Changelog

This schema uses Calendar Versioning (`vYY.MMDD`) per the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning).

## [v26.0609] - 2026-06-09

### Added (severity: additive)

- **`instrument_id`** (optional, `^inst_[a-z0-9_]+$`): groups questionnaire forms under one instrument family (e.g. the ASRS full form + screener share `inst_asrs`). Sourced from the legacy `header_id`.
- **`variant`** (optional, default `"base"`): human-readable label distinguishing a form within its instrument family.
- Property URIs remain stable; existing v26.0605 instances validate unchanged (both fields optional).

**Severity:** `additive`.

## [v26.0605] — 2026-06-05

### Changed (severity: breaking)

- **Renamed field `authors` → `author`** at the top level. The field remains an array of Author items; only the field name changes (singular form, following schema.org / xAPI convention where `author` can hold one or many). Instruments with a single author no longer feel awkwardly named. Existing v26.0528 instances using `authors` continue to validate against the archived v26.0528 schema (per OD-06).
- All other fields unchanged.

### Migration from v26.0528

- Mechanical rename: every `authors` field in v26.0528 instances becomes `author` in v26.0605. No structural change to the field's contents.

**Severity:** `breaking` (analytically distinct from v26.0528).

**Note on Schema 2 cross-reference.** Schema 2 v26.0602 pins Schema 1 v26.0528 via `$ref` to `https://behaverse.org/schemas/instrument/v26.0528/schema.json` — Schema 2 instances continue to use `authors` until Schema 2 itself bumps and re-targets Schema 1 v26.0605.

## [v26.0528] — 2026-05-28

### Added

- Initial version of the Instrument Metadata schema.
- Required floor: `id`, `title`, `description`, `language`.
- Optional fields: `short_title`, `version`, `authors`, `available_languages`, `timestamps`, `publication`, `license`, `license_notes`, `rights_holder`, `request_url`, `usage`, `provenance`, `classification`, `psychometrics`, `translations`, `extensions`.
- BCP-47 `LanguageCode` $def with hierarchical fallback (runtime).
- `Version` $def for CalVer `vYY.MMDD(.devN)?`.
- `Author` $def with required `name` and optional `orcid`, `affiliation`, `email`.
- `InlineTranslations` $def with per-language status (G1).
- Hybrid `additionalProperties` policy: strict + `extensions{}` + `x_*` prefix.

**Severity:** `additive` (first published version).
