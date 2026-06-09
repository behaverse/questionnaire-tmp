# Questionnaire Definition Schema

Schema 2 of the questionnaire-apps ecosystem. Structural specification of a questionnaire — pages, blocks, sections, items (Question + Option), logic, and named score declarations referencing external Scorer entities.

**Current version:** v26.0602 (per OD-16, resolved 2026-06-02)
**Spec:** [docs/superpowers/specs/2026-06-02-schema-2-v26.0602-design.md](../../docs/superpowers/specs/2026-06-02-schema-2-v26.0602-design.md)
**Authoritative entity model:** [design/05a_reusable_entities.md](../../design/05a_reusable_entities.md) (OD-15)
**Authoritative scoring model:** [design/05b_scoring.md](../../design/05b_scoring.md) (OD-16)
**Embeds:** [Schema 1 — Instrument Metadata v26.0528](../instrument/) at `metadata`

## Files

| File | Purpose |
|---|---|
| `schema.json` | Current JSON Schema (Draft 2020-12) at v26.0602 |
| `context.jsonld` | JSON-LD context (Scorer vocab; `content` uses `@container: @language`) |
| `examples/minimal.json` | Smallest valid questionnaire |
| `examples/phq9.json` | Realistic PHQ-9 with matrix Section + `scores[]` referencing `scr_phq9` |
| `examples/kitchensink.json` | Exercises every v26.0602 $def including nested JSON Pointer paths |
| `examples/library_examples/` | Per-entity Library examples (17 files across 13 entity types) |
| `versions/v26.0528/` | Archived v26.0528 schema, context, and examples |
| `versions/v26.0601/` | Archived v26.0601 schema, context, examples, CHANGELOG, README |
| `CHANGELOG.md` | Version history |

## Eleven content-bearing + procedural entities

**Content-bearing:**
- Message (`msg_`), Context (`ctx_`), Instruction (`ins_`), Prompt (`pr_`), Option (`opt_`), Placeholder (`ph_`), Help (`help_`), RegEx (`rx_`)
- Subscale (`scl_`) — pure label entity per OD-16; carries only `id`, `name`, `description`, `content`. Membership lives on `Prompt.subscales[]`.

**Ref-binding:**
- Question (`q_`), Item (`it_`), Solution (`sol_`)

**Procedural (new in v26.0602):**
- Scorer (`scr_`) — versioned scoring procedure. Declares inputs schema, output schema, conformant implementations (WASM / HTTP / Python / R), and test cases.

## Scoring model (per OD-16)

Scoring logic lives in the Scorer entity, not in the Questionnaire JSON. The Questionnaire declares named scores via:

```jsonc
"scores": [
  { "id": "phq9_total",    "scorer": "scr_phq9@v26.0602", "path": "/total" },
  { "id": "phq9_severity", "scorer": "scr_phq9@v26.0602", "path": "/severity" }
]
```

Each score declaration references a JSON Pointer path into the Scorer's structured output. LogicRule conditions and display layers consume scores by id; the engine resolves them by invoking the Scorer (or hitting cache, keyed by scorer + input hash).

The `lock_show_score_timing: true` flag at the root prevents deployments from overriding the canonical show-score timing — used for clinically-sensitive instruments.

## UI input widget derivation

The viewer picks the rendered widget from the Option's `(input_data_type, measurement_type, selection)` triple — not from a `type` field on the question. See the spec's §13 for the full derivation table.

## Validation

```bash
python tools/validate_schemas.py
```

The validator walks every example under `examples/` and `examples/library_examples/`, verifies each library entity against its `$def`, and cross-checks every `scores[]` entry's JSON Pointer path against the referenced Scorer's `output_schema`. Scorer conformance testing (running test cases against actual implementations) is stubbed with `SKIPPED` lines until the runner is built.

## See also

- [VERSIONING.md](../VERSIONING.md) — CalVer policy
- [schemas/instrument/](../instrument/) — Schema 1 (unchanged at v26.0528)
- [design/05a_reusable_entities.md](../../design/05a_reusable_entities.md) — authoritative entity model
- [design/05b_scoring.md](../../design/05b_scoring.md) — authoritative scoring model
