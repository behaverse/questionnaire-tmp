# Schemas

JSON Schemas for the questionnaire-apps ecosystem. Locally authored; mirror to [behaverse/schemas](https://github.com/behaverse/schemas) for publication.

## Schemas

| # | Name | Purpose |
|---|---|---|
| 1 | [`instrument/`](instrument/) | Instrument metadata — bibliographic, psychometric, licensing, classification. Generic across instrument types (questionnaires, cognitive tasks, paradigms). |
| 2 | [`questionnaire/`](questionnaire/) | Questionnaire structural definition — pages, blocks, sections, questions, subscales, logic, scoring, validation. Embeds Schema 1 at `metadata`. |

## Validation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r tools/requirements.txt
python tools/validate_schemas.py
```

Exit code 0 if all examples pass.

## Layout per schema

```
{schema}/
  schema.json             # current version
  context.jsonld          # JSON-LD context
  examples/               # canonical examples
  versions/               # archived prior versions
  CHANGELOG.md
  README.md
```

This mirrors the [behaverse/schemas](https://github.com/behaverse/schemas) convention exactly. Eventual publication is a verbatim copy.

## Versioning

See [VERSIONING.md](VERSIONING.md).

## Design

The authoritative design lives in [../design/](../design/). The spec for the current schemas: [../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md](../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md).
