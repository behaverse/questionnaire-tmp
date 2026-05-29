# Schema Versioning

This repository uses **Calendar Versioning (CalVer)** with format `vYY.MMDD[.devN]`.

- `v26.0528` = May 28, 2026
- `v26.0528.dev2` = second in-development iteration on that date

Aligned with the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning).

## Directory structure per schema

```
{schema}/
├── schema.json            # current
├── context.jsonld
├── CHANGELOG.md
├── examples/
└── versions/              # archived
    ├── v26.0513/
    │   ├── schema.json
    │   └── context.jsonld
    └── v26.0528/          # if a same-day re-stamp ever ships
```

## Severity tag

CalVer dates are pure timestamps — they don't encode breaking-vs-non-breaking.
Each entry in `CHANGELOG.md` carries a `severity` tag:

| Value | Meaning |
|---|---|
| `breaking` | Changes that alter responses or scoring (re-wording an item, changing an option-set, changing a scoring formula). Treat analytically as a different instrument. |
| `additive` | New optional field, new translation, new psychometric data. Existing instances stay valid. |
| `corrective` | Typos, formatting, comment text. |

Hard-pin references (per OD-06) ensure no version flows automatically into a referencing questionnaire — even `corrective` requires explicit author opt-in.

## How to bump

1. Copy current `{schema}/schema.json` to `{schema}/versions/v<YY.MMDD>/schema.json` (where `<YY.MMDD>` is the **old** version).
2. Copy `context.jsonld` similarly.
3. Update `version` field inside `{schema}/schema.json` to today's date.
4. Update `$id` URL inside `{schema}/schema.json` to today's date.
5. Add a new section to `CHANGELOG.md` with severity tag and description.
6. Update examples if needed.
7. Run `python tools/validate_schemas.py` — verify still green.
