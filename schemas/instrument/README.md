# Instrument Metadata Schema

Schema 1 of the questionnaire-apps ecosystem. Bibliographic and psychometric properties for any instrument — questionnaires, cognitive tasks, behavioural paradigms.

**Current version:** v26.0609
**Spec:** [docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md](../../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md) §2

## Files

| File | Purpose |
|---|---|
| `schema.json` | Current JSON Schema (Draft 2020-12) |
| `context.jsonld` | JSON-LD context mapping fields to Dublin Core, Schema.org, DataCite |
| `examples/` | Three examples: PHQ-9 (questionnaire), BDI-II (proprietary-restricted), IAT (cognitive task) |
| `versions/` | Archived prior versions (v26.0528, v26.0605) |
| `CHANGELOG.md` | Version history |

## Required fields

Schema floor: `id`, `title`, `description`, `language` (BCP-47).
Library publish layer additionally requires: `version`, `author` (≥1), `license`.

## Preferred vocabularies

The schema is intentionally open on a few fields where a closed enum would
risk rejecting valid emerging values. Preferred values are documented here.

### `classification.domain`

Preferred values (open list):
`anxiety`, `cognition`, `depression`, `executive_function`, `implicit_cognition`,
`memory`, `mood`, `personality`, `quality_of_life`, `screening`,
`self_efficacy`, `social_psychology`, `stress`, `trauma`, `wellbeing`.

### `classification.population`

Preferred values: `adults`, `adolescents`, `children`, `older_adults`,
`clinical`, `primary_care`, `community`, `pregnant`, `perinatal`, `veterans`.

### `psychometrics.reliability.type`

Preferred values: `cronbach_alpha`, `mcdonald_omega`, `test_retest`,
`split_half`, `kr20`, `icc`, `inter_rater`.

### `psychometrics.validity.type`

Preferred values: `content_validity`, `criterion_concurrent`, `criterion_predictive`,
`construct_convergent`, `construct_discriminant`, `cfi`, `rmsea`, `tli`.

## Validation

```bash
python tools/validate_schemas.py
```

## See also

- [VERSIONING.md](../VERSIONING.md) — CalVer policy
- [schemas/questionnaire/](../questionnaire/) — Schema 2 (Questionnaire), which embeds this schema at `metadata`
