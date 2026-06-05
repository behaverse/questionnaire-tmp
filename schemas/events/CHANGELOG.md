# Changelog

## [v26.0605] — 2026-06-05

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for BDM Event Data per OD-19.
- Root oneOf: single `Event` (for per-event NDJSON-line emission) or `EventBatch` (for batched JSON-document delivery).
- Strict enums on `verb` (24 values), `object.objectType` (15 values), `actor.objectType` (5 values) per locked vocabulary in [design/05e_events_vocabulary.md](../../design/05e_events_vocabulary.md).
- Open `bdm:*` extension keys under `result.extensions` and `context.extensions` (xAPI-style open extensions; per-key shape contracts documented in 05e §4).
- Four examples: `minimal_event`, `phq9_event_stream`, `cognitive_event_stream`, `kitchensink_event_batch`.
- JSON-LD context with `bdm:`, `xapi:`, `schema:`, `as2:` prefixes.
- Two validator cross-checks: `check_event_vocabulary` (enforces verb / object type / actor type enums) and `check_event_extension_key_prefixes` (enforces bdm:* key prefix on extensions).

### BDM deviations logged (per [05c_bdm_alignment.md](../../design/05c_bdm_alignment.md))

- **D4** `bdm:` namespace + full 24-verb / 15-object-type / 5-actor-type vocabulary.
- **D5** Field name `agent` → `actor` (xAPI alignment).
- **D6** Scoping hierarchy with Activity vs RuntimeInstance distinction.

**Severity:** initial (no prior version).
**Authoritative source:** [design/05e_events_vocabulary.md](../../design/05e_events_vocabulary.md), [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md).
