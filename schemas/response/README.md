# Schema 5 — Response Data

Per OD-17 (resolved 2026-06-03), strict adherence to the [Behaverse Data Model (BDM) Response trial table](https://github.com/behaverse/data-model/blob/main/spec/trials/1-response.qmd) with three documented deviations. See [design/05_data_model.md](../../design/05_data_model.md) §"Schema 5" and [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md).

**Current version:** v26.0603

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0603 |
| `context.jsonld` | JSON-LD context with BDM vocabulary mappings |
| `examples/minimal_single_response.json` | Smallest valid single-row Response |
| `examples/phq9_session_responses.json` | Full PHQ-9 session as a ResponseSet (9 rows) |
| `examples/kitchensink_responses.json` | Exercises every documented field |
| `CHANGELOG.md` | Version history |

## Root shape

Two top-level forms (oneOf):
- **`Response`** — single response row. Emitted per-row by viewers during a session (per OD-13 forwarding pipeline).
- **`ResponseSet`** — wrapper carrying `session_id` (UUID v4) + `responses[]`. Used for batched offline export.

## BDM column categories

Key · Context · Task · Stimulus · Option · Input · Expectation · Response · Evaluation · Feedback · Outcome · Accessory. See spec §3.1 for the full property listing.

## See also

- [design/05_data_model.md](../../design/05_data_model.md) §"Schema 5" — full BDM column mapping
- [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md) — deviations log
- [schemas/session/](../session/) — Schema 6 (Session Metadata) — sister schema
- [schemas/questionnaire/](../questionnaire/) — Schema 2 (Questionnaire Definition) — produces the data referenced here
