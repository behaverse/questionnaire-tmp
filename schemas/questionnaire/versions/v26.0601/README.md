# Questionnaire Definition Schema

Schema 2 of the questionnaire-apps ecosystem. Structural specification of a questionnaire — pages, blocks, sections, items (Question + Option), logic, scoring.

**Current version:** v26.0601 (per OD-15, resolved 2026-05-31)
**Spec:** [docs/superpowers/specs/2026-06-01-schema-2-v26.0601-design.md](../../docs/superpowers/specs/2026-06-01-schema-2-v26.0601-design.md)
**Entity model:** [design/05a_reusable_entities.md](../../design/05a_reusable_entities.md)
**Embeds:** [Schema 1 — Instrument Metadata v26.0528](../instrument/) at `metadata`

## Files

| File | Purpose |
|---|---|
| `schema.json` | Current JSON Schema (Draft 2020-12) at v26.0601 |
| `context.jsonld` | JSON-LD context (`content` uses `@container: @language`) |
| `examples/minimal.json` | Smallest valid questionnaire |
| `examples/phq9.json` | Realistic PHQ-9 with matrix Section + `shared_option` |
| `examples/kitchensink.json` | Exercises every v26.0601 $def |
| `examples/library_examples/` | Per-entity Library examples (15 files across 11 entity types) |
| `versions/v26.0528/` | Archived v26.0528 schema, context, and examples |
| `CHANGELOG.md` | Version history |

## Eleven reusable entity types

**Content-bearing:**
- Message (`msg_`) — standalone participant text
- Context (`ctx_`) — background paragraph framing a Question
- Instruction (`ins_`) — how-to-respond text
- Prompt (`pr_`) — the stem text the participant reads
- Option (`opt_`) — response-options spec (determines the UI input widget)
- Placeholder (`ph_`) — hint text inside an input field
- Help (`help_`) — tooltip / "?" content
- RegEx (`rx_`) — reusable validation patterns

**Ref-binding:**
- Question (`q_`) — Prompt + optional Context + optional Instruction (refs only)
- Item (`it_`) — Question + Option (refs only); the participant-administered unit
- Solution (`sol_`) — correct-response record for items with a right answer (hybrid: refs + `expected_response` value)

## Content model

All content-bearing entities carry text in a **`content` language-keyed map**:

```jsonc
"content": {
  "en": { "status": "validated", "text": "..." },
  "pt": { "status": "validated", "text": "..." }
}
```

Each language entry has a `status` (`draft` / `complete` / `validated`) and the translatable fields for that language. The canonical language is whichever key matches the instrument's `metadata.language`.

## UI input widget derivation

The viewer picks the rendered widget from the Option's `(input_data_type, measurement_type, selection)` triple — not from a `type` field on the question. See the spec's §13 for the full derivation table.

## Validation

```bash
python tools/validate_schemas.py
```

## See also

- [VERSIONING.md](../VERSIONING.md) — CalVer policy
- [schemas/instrument/](../instrument/) — Schema 1 (unchanged at v26.0528)
- [design/05a_reusable_entities.md](../../design/05a_reusable_entities.md) — authoritative entity model
