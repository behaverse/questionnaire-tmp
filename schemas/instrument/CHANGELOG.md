# Changelog

This schema uses Calendar Versioning (`vYY.MMDD`) per the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning).

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
