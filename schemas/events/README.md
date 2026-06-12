# Schema 4a — Event Data (BDM Events extension)

**Units: all durations are in SECONDS, always** (e.g. `bdm:response_time`) — owner ruling 2026-06-12, consistent across Schemas 4a/4b/5.

Per OD-19 (resolved 2026-06-05), BDM Events vocabulary covering questionnaires, cognitive tasks, and video games under a single `bdm:` namespace.

**Current version:** v26.0605
**Spec:** [docs/superpowers/specs/2026-06-05-schema-4a-design.md](../../docs/superpowers/specs/2026-06-05-schema-4a-design.md)
**Authoritative vocabulary:** [design/05e_events_vocabulary.md](../../design/05e_events_vocabulary.md)
**BDM deviations:** [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md) §§ D4, D5, D6

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0605 |
| `context.jsonld` | JSON-LD context with bdm:, xapi:, schema:, as2: prefixes |
| `examples/minimal_event.json` | Smallest valid Event |
| `examples/phq9_event_stream.json` | EventBatch for one PHQ-9 trial |
| `examples/cognitive_event_stream.json` | EventBatch for one N-back trial |
| `examples/kitchensink_event_batch.json` | EventBatch exercising all 24 verbs |
| `CHANGELOG.md` | Version history |

## Vocabulary at a glance

**24 verbs across 6 layers:** see [05e §2](../../design/05e_events_vocabulary.md).
**15 object types:** RuntimeInstance, Screen, Panel, Stimulus, Option, Trial, UIComponent, Window, Feedback, ConsentForm, Consent, Recording, Timer, Scorer, LocaleSwitch.
**5 actor types:** Agent, Group, Engine, Orchestrator, Researcher.
**~50 extension keys** under `bdm:*` prefix (open-by-design; per-key shape contracts documented in 05e §4).

## Validation

```bash
python tools/validate_schemas.py
```

The project validator runs JSON Schema validation per example plus two cross-checks: vocabulary enforcement for verbs/objects/actors, and extension-key prefix enforcement.

## See also

- [design/05e_events_vocabulary.md](../../design/05e_events_vocabulary.md) — authoritative vocabulary body
- [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md) §§ D4, D5, D6 — BDM upstream change proposals
- [schemas/response/](../response/) — Schema 5 (joins Event-stream `bdm:trial_ended` to Schema 5 Response rows via `bdm:response_id`)
