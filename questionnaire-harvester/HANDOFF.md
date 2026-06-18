# Harvester Handoff — v26.0618 (slider support)

**Date:** 2026-06-18

## State

**110 questionnaires** harvested and validated (106 Likert + 4 slider).

Validate the full tree:

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -c "from pathlib import Path; from harvester.validate import validate_tree; \
  print(validate_tree(Path('questionnaire-harvester/output'), Path('schemas'), release='v26.0618') or 'OK')"
```

Expected: `OK`.

## Slider support shipped (v26.0618)

`t: range` (PsyToolkit slider) questionnaires are now fully supported.

Each slider item gets its own per-item `Option` entity with:

- `input_data_type: "number"` (Schema-2 v26.0618 — new field on Option)
- `measurement_type: "interval"`
- `min_label` / `max_label` — the left/right endpoint labels from `{left=...,right=...}`
- `initial_value` — from `{start=N}` (optional)
- `min`, `max`, `step` — the numeric range

Identical slider options (same min/max/step/labels) are deduplicated via the fingerprint
engine — a 0–100 VAS with identical endpoint labels becomes one shared `opt_*` entity
referenced by all items that share it.

**Four slider questionnaires harvested:**

| qst_id | Instrument | Items |
|---|---|---|
| `qst_shs` | Subjective Happiness Scale (SHS) | 4 |
| `qst_rps` | Risk Perception Survey (RPS) | 7 |
| `qst_fsq` | Fear of Spiders Questionnaire (FSQ) | 18 |
| `qst_secs` | Social and Economic Conservatism Scale (SECS) | 12 |

**Two pages skipped (VAS items with no stem text):**

- `vams-mood-scales.html` — VAMS: items are pure `{left=...,right=...}` with no prompt text
- `lseq.html` — LSEQ: same format; the label params *are* the full item content

The parser refuses to fabricate stem text for these. They remain skipped cleanly (`SKIP ...`);
support would require a schema/model extension (label-only slider items) as a follow-up.

## What's next

- **Label-only slider items** (VAS format: `- {left=...,right=...}` with no stem) — VAMS and
  LSEQ use this; requires a schema/model extension to represent items without a Prompt text.
- **PsyToolkit adapter domain/population hardcoding** — currently leaves `domain`/`population`
  empty; classify downstream.
- **Fuzzy near-match dedup tier** — near-miss scale variants tracked but not auto-merged.
- **Generalise context dedup** — minted Contexts are content-addressed; fold into the
  fingerprint engine for Library-backed reuse.
- **`psychology_tools` adapter** / **`arab_psychology` adapter** — new source sites.
- **Promote to Library** — run `library ingest` against `output/` after owner sign-off.
- **Web-UI disclaimer banner** — draft in `about_licenses.md` § 6.
- **Per-questionnaire license badge** in the Library catalogue.
- **Structured license block in canonical schema** — move `x_license_*` to Schema-2 `metadata`.
