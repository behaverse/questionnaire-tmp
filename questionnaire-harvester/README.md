# questionnaire-harvester

Harvest questionnaires from web resources into canonical Schema-2 entities, **without
creating duplicate shared entities** (response scales, instructions).

**Isolation guarantee:** the harvester writes only to `output/` (tracked, staged for
review). It never touches the Library database. Promotion to the Library is a **separate
manual step** (`library ingest`) performed after owner review.

---

## Quick start

```bash
PYTHONPATH=library/src:questionnaire-harvester/src \
  python -m harvester.cli harvest <url>
```

### GAD-7 example

```bash
PYTHONPATH=library/src:questionnaire-harvester/src \
  python -m harvester.cli harvest \
  https://us.psytoolkit.org/survey-library/anxiety-gad7.html
```

Output:

```
harvested qst_gad7: reused=['opt_phq_frequency_4', 'ctx_past_2_weeks'] minted=['ins_gad7_instruction', 'pr_gad7_1'..'pr_gad7_7'] open_qs=3
```

The GAD-7 **reused** two shared entities: PHQ-9's `opt_phq_frequency_4` response scale
(identical 4-point frequency anchors and values) and the Library's `ctx_past_2_weeks@v26.0606`
temporal context. The adapter splits a leading temporal frame ("Over the last 2 weeks,") off the
instruction into that Context (see `contexts.py`); the remaining instruction
("How often have you been bothered by the following problems?") is **minted as new**
(`ins_gad7_instruction`) because its text differs from PHQ-9's "…any of the following problems?"
— the dedup engine correctly declined to merge them. The 8 minted entities are that instruction
plus the 7 item prompts (`pr_gad7_1..7`). Both reuses become open questions for owner
confirmation.

---

## What the pipeline does

```
<url>
  │
  ▼ PsyToolkitAdapter.fetch() + .parse()
RawQuestionnaire          (raw.py — neutral intermediate)
  │
  ▼ draft()               (draft.py — reuse/mint decision)
DraftResult               {entities, reused, minted}
  │
  ├─▶ write_draft()       → output/{options,instructions,prompts,questionnaires}/*.json
  ├─▶ validate_tree()     → validate.py — Schema-2 Ajv check against schemas/
  ├─▶ write_questions()   → questions/<qst_id>.md   (open questions for owner)
  └─▶ upsert_register_row() → register.md           (one-row harvest log)
```

All paths are relative to the repo root. Override with CLI flags:

| Flag | Default |
|---|---|
| `--out` | `questionnaire-harvester/output` |
| `--scales-index` | `questionnaire-harvester/dedup/scales-index.json` |
| `--register` | `questionnaire-harvester/register.md` |
| `--questions` | `questionnaire-harvester/questions` |
| `--schemas` | `schemas` |
| `--version` | `v26.0617` |

---

## Module reference

| Module | Responsibility |
|---|---|
| `sources/` | Source adapters — `SourceAdapter` base + `PsyToolkitAdapter` (built); extend here for new sites |
| `raw.py` | Neutral intermediate dataclasses: `RawQuestionnaire`, `RawScale`, `RawItem`; source-agnostic |
| `dedup.py` | Fingerprinting + index lookups: `option_fingerprint`, `lookup_option`, `build_instruction_index`, `lookup_instruction` |
| `contexts.py` | `split_temporal_context()` peels a leading temporal frame ("Over the last 2 weeks,") into a Context; `resolve_known_context()` reuses a known Library Context (`KNOWN_CONTEXTS` map) instead of minting a duplicate |
| `licensing.py` | `LicenseFlag` dataclass — rich license block, `canonical_enum()` mapping to Schema-2 `license` enum, `x_metadata()` for `x_*` fields |
| `draft.py` | Reuse-or-mint logic: checks dedup indexes, builds canonical entities, writes via Library writer |
| `tracking.py` | Progress surface: `upsert_register_row()` (register.md) + `write_questions()` (questions/<id>.md) |
| `validate.py` | Thin wrapper: runs `build_registry` + `validate_artifact` from `library.validation` over every entity in `output/` |
| `cli.py` | `harvest <url>` entry point; wires all stages together |

---

## Dedup index

`dedup/scales-index.json` maps Option fingerprints → `[id, ...]`.  Before minting a new
scale, `draft.py` looks up the incoming Option's fingerprint here. A hit → **reuse** the
existing id; a miss → **mint** a new `opt_*` entity.

### Rebuilding the catalogue

The committed `scales-index.json` was built from two corpora:

1. `questionnaire-harvester/_corpus/` — the survey_db baseline (**gitignored**,
   regenerable from the SQLite).
2. `questionnaire-harvester/output/` — the hand-curated harvest output (tracked).

**Before re-running `build_catalogue.py` you must regenerate `_corpus/`**, otherwise
only `output/` is indexed and the baseline dedup coverage is lost (the committed index
would be clobbered):

```bash
# 1. Regenerate the survey_db baseline into _corpus/
PYTHONPATH=library/src python3 -c "
from library.importers.survey_db.run import import_survey_db
import_survey_db(
    'survey_database/data/survey_db.sqlite',
    'questionnaire-harvester/_corpus',
    'v26.0606',
    '2026-06-06T00:00:00Z'
)"

# 2. Rebuild the index from both corpora
python3 questionnaire-harvester/dedup/build_catalogue.py
```

This writes `scales-index.json` (machine) and `scales-catalogue.md` (human table).

---

## Reviewing progress

**`register.md`** — one row per harvested questionnaire:

| Column | Meaning |
|---|---|
| Questionnaire | `qst_*` id |
| Sources | source site |
| Importance | harvester-assigned priority |
| Status | `ready` (no open questions) or `needs-review` |
| Open Qs | count of unanswered questions |
| License | `license_class` value |

**`questions/<qst_id>.md`** — answer inline under each `> answer:` prompt. The two
auto-generated question types are: unclear license (contact author?) and reused-entity
confirmation. Run `harvest` again after answering to refresh the register row.

---

## Running the tests

```bash
PYTHONPATH=library/src:questionnaire-harvester/src \
  python -m pytest questionnaire-harvester/tests -v
```

Expected: 22 tests, all passing.

---

## Reference documents

- `questionnaire-harvester/about_licenses.md` — licensing policy, taxonomy, site-wide
  disclaimer banner draft, and the `license_class` → canonical enum mapping table.
- `questionnaire-harvester/conventions.md` — canonical entity shapes, id prefixes,
  ref syntax, provenance/`x_*` placement, and validator gotchas.

---

## Explicit follow-ups (out of scope of this foundation)

These are tracked but deliberately deferred:

- **PsyToolkit adapter domain/population hardcoding** — currently hardcodes
  `domain=["anxiety"]` and `population=["adults"]` (correct only for GAD-7); real per-instrument
  classification extraction from page metadata is a follow-up.
- **Embedded newlines in harvested descriptions** — source `<p>` tags may produce
  multi-line `description` fields in canonical entities; normalization is a follow-up.
- **Fuzzy near-match tier** — a `review/dedup.md` list for fingerprint near-misses (e.g.
  anchor text differs by one word); currently only exact fingerprint matches reuse.
- **Generalise context dedup** — Context reuse currently relies on the curated
  `contexts.KNOWN_CONTEXTS` map (recognised temporal phrases → Library Context ids). Folding
  Contexts into the fingerprint engine (like Options/Instructions) and seeding the index from
  the Library would make reuse automatic for any Context, not just temporal frames.
- **`psychology_tools` adapter** — source adapter for psychologytools.com.
- **`arab_psychology` adapter** — source adapter for arabpsychology.net.
- **Promote to Library** — run `library ingest` against `output/` after owner sign-off;
  currently a manual step not automated by the harvester.
- **Web-UI disclaimer banner** — the draft text is in `about_licenses.md` § 6; wiring
  into the Library web UI is a separate frontend task.
- **Per-questionnaire license badge** — surface `x_license_class` + `x_license_status`
  as a badge in the Library catalogue; blocked on Library web UI work.
- **Structured license block in canonical schema** — extend Schema-2 `metadata` to carry
  the full `LicenseFlag` block natively instead of `x_*` fields; currently blocked on a
  schema version bump decision.
