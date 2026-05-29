# Questionnaire Definition Schema

Schema 2 of the questionnaire-apps ecosystem. Structural specification of a questionnaire — pages, blocks, sections, questions, subscales, logic, scoring, validation.

**Current version:** v26.0528
**Spec:** [docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md](../../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md) §3
**Embeds:** [Schema 1 — Instrument Metadata](../instrument/) at `metadata`

## Files

| File | Purpose |
|---|---|
| `schema.json` | Current JSON Schema (Draft 2020-12) |
| `context.jsonld` | JSON-LD context |
| `examples/` | minimal.json, phq9.json, kitchensink.json |
| `versions/` | Archived prior versions (empty for v26.0528) |
| `CHANGELOG.md` | Version history |

## Required fields

`metadata` (embedded Instrument) and `pages` (≥1).

## Preferred vocabularies

### `style.layout` values

Per question type:
- Radio: `dropdown`, `toggle`, `buttons`
- Section: `matrix`
- Slider: `vertical`, `horizontal`

### `scoring.interpretation[].severity` values (open)

Preferred: `none`, `minimal`, `mild`, `moderate`, `moderately_severe`, `severe`, `extreme`, `subclinical`, `clinical`.

## Validation

```bash
python tools/validate_schemas.py
```

## See also

- [VERSIONING.md](../VERSIONING.md) — CalVer policy
- [schemas/instrument/](../instrument/) — Schema 1 (Instrument), embedded at `metadata`
