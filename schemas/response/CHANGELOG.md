# Changelog

## [v26.0603] — 2026-06-03

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for Response Data.
- 70+ properties spanning the BDM Response trial table categories: Key, Context, Task, Stimulus, Option, Input, Expectation, Response, Evaluation, Feedback, Outcome, Accessory.
- Root oneOf accepts either a single `Response` object (single-row emission) or a `ResponseSet` wrapper (batched session emission).
- Three examples: `minimal_single_response.json`, `phq9_session_responses.json`, `kitchensink_responses.json`.
- JSON-LD context with BDM vocabulary mappings.

### BDM deviations (per OD-17, see design/05c_bdm_alignment.md)

- **D1** `stimulus_id` is `string` (not BDM's `integer`); carries a synthetic concatenation of Question-side entity ids.
- **D3** Our `session_id` is UUID v4 (globally-unique handle); new `session_index` column carries BDM's per-agent integer ordering. (BDM's existing `session_id` column should be renamed `session_index` upstream — proposal pending.)

**Severity:** initial (no prior version).
**Authoritative source:** [design/05_data_model.md](../../design/05_data_model.md) §"Schema 5", [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md).
