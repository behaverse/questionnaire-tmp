# Schema 3 — Questionnaire Runtime

Per OD-18 (resolved 2026-06-03), the denormalised viewer-facing view of a Schema 2 Questionnaire. Produced server-side by the Viewer Service at session-mint via the shared `behaverse-runtime-denormaliser` Python library.

**Current version:** v26.0603

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0603 |
| `context.jsonld` | JSON-LD context |
| `examples/minimal_runtime.json` | Smallest valid runtime |
| `examples/phq9_runtime.json` | Realistic PHQ-9 runtime with scores and pinned WASM impls |
| `examples/kitchensink_runtime.json` | Exercises every field including multi-locale, blocks, logic, multiple impl kinds |
| `CHANGELOG.md` | Version history |

## Root shape

Required at root:

- **`provenance`** — denormaliser version, all cache-key inputs (questionnaire id+version, locale, viewer_conformance_hash, deployment_runtime_policy_hash), generation timestamp, stripped Scorer refs and LogicRule ids (per OD-18e).
- **`metadata`** — inline Schema 1 instrument metadata (id, title, language, plus optional Schema 1 fields).
- **`pages`** — at least one page; structurally Schema 2-shaped with refs resolved.

Optional at root: `locale`, `available_locales` (multi-locale runtimes per OD-18b kiosk opt-in), `style`, `flow`, `blocks`, `scores`, `logic`, `validation`, `lock_show_score_timing`, `extensions`.

## See also

- [design/05d_runtime.md](../../design/05d_runtime.md) — authoritative OD-18 body
- [design/05_data_model.md](../../design/05_data_model.md) §"Schema 3"
- [schemas/viewer_conformance/](../viewer_conformance/) — Schema 7 (sister schema)
- [schemas/questionnaire/](../questionnaire/) — Schema 2 (source for runtimes)
