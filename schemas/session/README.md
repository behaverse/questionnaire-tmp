# Schema 6 — Session Metadata

Per OD-17g (resolved 2026-06-03), carries per-session metadata including `scorer_outputs` (per OD-16). See [design/05_data_model.md](../../design/05_data_model.md) §"Schema 6".

**Current version:** v26.0603

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0603 |
| `context.jsonld` | JSON-LD context |
| `examples/minimal_session.json` | Smallest valid session |
| `examples/phq9_session.json` | Full PHQ-9 session with scorer_outputs |
| `examples/kitchensink_session.json` | Exercises every field |
| `CHANGELOG.md` | Version history |

## Key fields

- **`session_id`** — UUID v4. Globally-unique session handle.
- **`session_index`** — integer per-agent ordering count (1-based).
- **`agent_id`**, **`instrument_id`**, **`instrument_version`** — context anchors.
- **`status`** — `not_started` / `in_progress` / `completed` / `submitted` / `forwarded` / `validated` / `abandoned`.
- **`scorer_outputs`** — object keyed by CalVer-pinned Scorer ref (`scr_…@vYY.MMDD`); each value is the full structured output the Scorer produced. Per OD-16.

## See also

- [design/05_data_model.md](../../design/05_data_model.md) §"Schema 6"
- [design/05b_scoring.md](../../design/05b_scoring.md) — Scorer contract
- [schemas/response/](../response/) — Schema 5 (Response Data) — sister schema
