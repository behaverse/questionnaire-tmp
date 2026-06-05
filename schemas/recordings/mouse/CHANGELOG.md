# Changelog

## [v26.0605] — 2026-06-05

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for Mouse recording samples per OD-20.
- Single-sample validation; the JSONL file format wraps many such samples in temporal order.
- Manifest data (URL, sha256, sample rate, duration, source) lives in the corresponding Schema 4a `bdm:recording_ended` event extensions — no sidecar manifest file.

**Severity:** initial (no prior version).
**Authoritative source:** [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 4b", [design/05e_events_vocabulary.md](../../../design/05e_events_vocabulary.md) §2.5.
