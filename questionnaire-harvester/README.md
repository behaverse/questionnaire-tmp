# questionnaire-harvester

Harvest questionnaires from web resources into canonical Schema-2 entities, **without
creating duplicate shared entities** (response scales, instructions).

**Isolation guarantee:** the harvester writes only to `output/` (tracked, staged for
review). It never touches the Library database. Promotion to the Library is a **separate
manual step** (`library ingest --release v26.0618`).

**Status (2026-06-21): DEPLOYED.** All 158 are ingested and **live** on the Library web app
(`questionnaire-library.vercel.app`), alongside the survey_db catalogue. ⚠ **157/158 are
`license: unknown`** — published per an explicit owner decision *ahead of* the content-review /
licensing pass, to be corrected or withdrawn during review. See `about_licenses.md` (§4 Status)
and `HANDOFF.md`. The site-wide license disclaimer (`about_licenses.md` §6) is load-bearing while
unknown-license content is served.

**Harvested so far (158):** `psytoolkit.org` (117), `psychology-tools.com` (40),
`phqscreeners.com` (1 — PHQ-9, curated). Two source adapters (`PsyToolkitAdapter`,
`PsychologyToolsAdapter`); the CLI dispatches by host. Item formats covered include
single-Likert, sliders (`t: range`), matrix (`t: multiradio`), per-item radio, multi-select
checkbox, stem-less Beck-style (shared-prompt), and two-dimension tables (Liebowitz). Distinct
scales are kept as faithful separate entities (no false merge); the harvest list is in
`register.md`. Pages the adapter can't faithfully represent are skipped cleanly (logged), not
partially imported — see "adapter coverage" below.

Each harvested questionnaire also carries: an **authored** copyright-safe `description`
(`descriptions/`), captured source metadata (`source_metadata/`, flagged, not redistributed),
a cleaned `short_title` acronym (`short_titles.json`), a faithful scoring descriptor
(`scoring/`), and a human-readable review export (`import_review/`). See **Commands** below.

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
harvested qst_gad7: reused=['opt_phq_frequency_4', 'ins_gad7_instruction'] minted=['ctx_over_the_last_2_weeks', 'pr_gad7_1'..'pr_gad7_7'] open_qs=3
```

The GAD-7 **reused** PHQ-9's `opt_phq_frequency_4` response scale (identical 4-point frequency
anchors, case treated as cosmetic). The adapter splits the leading temporal frame
("Over the last 2 weeks,") off the instruction into a Context (see `contexts.py`); that Context is
**minted verbatim** (`ctx_over_the_last_2_weeks`) — per the faithfulness policy we keep the source
text exactly ("2 weeks", not "two weeks"), so we do NOT reuse the Library's near-but-different
`ctx_past_2_weeks` ("…two weeks,"). The trimmed instruction
("How often have you been bothered by the following problems?") is shared with prior harvests when
identical. Because the Context id is content-based, PHQ-9 and GAD-7 (whose temporal phrase is
byte-identical) share the one minted Context losslessly.

**Faithfulness policy (base imports):** the imported text is kept exactly as the source wrote it.
Reuse fires only when content is identical (capitalisation and whitespace are cosmetic); a real
word/number difference ("2" vs "two") produces a faithful near-duplicate rather than a lossy reuse.
Variant-consistency rules across questionnaires are defined later, downstream of import.

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
| `--source-metadata` | `questionnaire-harvester/source_metadata` |
| `--descriptions` | `questionnaire-harvester/descriptions` |
| `--short-titles` | `questionnaire-harvester/short_titles.json` |
| `--schemas` | `schemas` |
| `--version` | `v26.0618` |

During `harvest`, the `--descriptions` and `--short-titles` override stores are applied to the
questionnaire (so a re-harvest never reverts an authored description or curated short_title),
and captured source metadata is written to `--source-metadata` (outside `output/`).

---

## Commands

All run as `PYTHONPATH=library/src:questionnaire-harvester/src python -m harvester.cli <cmd>`.

| Command | Purpose |
|---|---|
| `harvest <url>` | Harvest one page → canonical entities in `output/` (+ source_metadata, applies overrides). |
| `review-export` | (Re)generate `import_review/<id>.md` (human-readable export) + `import_review/README.md` (a review checklist) for every questionnaire — for side-by-side comparison with the source. |
| `document-scoring` | (Re)generate `scoring/<id>.md` — a faithful scoring descriptor (weights, dimensions, reversed items) with aggregation/cut-offs flagged `needs-research` for later `scr_*` Scorer authoring. |
| `apply-descriptions` | Bulk-apply authored `descriptions/<id>.md` to canonical `metadata.description` (`x_description_source: authored`), no re-fetch. |
| `check-descriptions` | Originality/shape guard: flags any authored description with ≥8-word verbatim overlap vs the captured source (copyright), or bad shape. Non-zero exit when any flagged. |
| `apply-short-titles` | Bulk-apply curated acronyms from `short_titles.json` to canonical `metadata.short_title` (skips `TODO` entries). |
| `check-short-titles` | Flags junk short_titles (qualifier fragments / version cruft / sentence-like). Non-zero exit when any flagged. |
| `apply-classifications` | Bulk-apply curated `classifications.json` to canonical `metadata.classification.{domain,population}` + `metadata.instrument_id` (only non-empty override fields; `administration_mode` untouched). Powers the Library Domain / Population / Instrument filters. |
| `check-classifications` | Flags coverage gaps (no `domain` / no `instrument_id`), off-vocab domain/population values, and malformed `instrument_id`. Non-zero exit when any flagged. |

### Curation / override stores (durable across re-harvest)

| Path | Holds |
|---|---|
| `descriptions/<id>.md` | authored two-sentence description per questionnaire |
| `short_titles.json` | `{id: acronym}` short_title overrides (`TODO:`-prefixed = unfilled placeholder) |
| `classifications.json` | `{id: {domain[], population[], instrument_id}}` curation store. Domains use the schema-preferred vocabulary plus a disciplined snake_case extension (`addiction`, `autism`, `adhd`, …); `instrument_id` is an `inst_<slug>` family id (variant forms share one). |
| `source_metadata/<id>.json` | verbatim captured meta description / keywords / og / introduction (source-copyrighted, **internal — not redistributed**) |

### Generated review/scoring artifacts (tracked staging, regenerable)

| Path | Holds |
|---|---|
| `import_review/` | per-questionnaire readable export + review checklist |
| `scoring/` | per-questionnaire faithful scoring descriptor (`needs-research` for cut-offs) |

---

## Module reference

| Module | Responsibility |
|---|---|
| `sources/` | Source adapters — `SourceAdapter` base + `PsyToolkitAdapter` + `PsychologyToolsAdapter` (both built); the CLI dispatches by host (`dispatch_adapter`). Extend here for new sites. The `psychology-tools.com` adapter parses `/test/` radio-form pages (standard + alternate `li.question-container` layouts, stem-less Beck-style → shared prompt, and two-super-header dimension tables → per-dimension flattening), extracts `ol.sources` references with links + a Sources year, and captures meta/keywords/og/Introduction. The PsyToolkit adapter parses the survey-script DSL in the page `<pre>`: a `scale:` definition (explicit `{score=N}` or 1-based positional default) + the `t: scale` question block(s) for the single scale in use. It handles flexible directive ordering (`l:`/`o:`/`q:`/`t:`), a multi-line `q:`, `{reverse}` item markers (→ `Prompt.reversed`), merges items across multi-page same-scale blocks, derives the id from the title acronym (`(SWLS)` → `qst_swls`) else the URL, and raises `PsyToolkitParseError` (→ CLI `SKIP`) on shapes it can't faithfully represent (multi-scale, label-less numeric, non-`scale` blocks). |
| `raw.py` | Neutral intermediate dataclasses: `RawQuestionnaire`, `RawScale`, `RawItem`; source-agnostic |
| `dedup.py` | Fingerprinting + index lookups: `option_fingerprint`, `lookup_option`, `build_instruction_index`, `lookup_instruction` |
| `contexts.py` | `split_temporal_context()` peels a leading temporal frame ("Over the last 2 weeks,") off the instruction into a Context, minted verbatim (faithfulness policy — no number/word folding) |
| `licensing.py` | `LicenseFlag` dataclass — rich license block, `canonical_enum()` mapping to Schema-2 `license` enum, `x_metadata()` for `x_*` fields |
| `draft.py` | Reuse-or-mint logic: checks dedup indexes, builds canonical entities, writes via Library writer |
| `tracking.py` | Progress surface: `upsert_register_row()` (register.md) + `write_questions()` (questions/<id>.md) |
| `validate.py` | Thin wrapper: runs `build_registry` + `validate_artifact` from `library.validation` over every entity in `output/` |
| `naming.py` | `derive_short_title(title)` — shared clean-acronym derivation used by both adapters |
| `source_meta.py` | `write_source_metadata()` — flagged source-metadata sidecar (outside `output/`) |
| `descriptions.py` | authored-description override store: load / apply (harvest) / bulk-patch / originality guard |
| `short_titles.py` | short_title override store: load / apply (harvest) / bulk-patch / junk guard |
| `classifications.py` | classification override store: load / apply (harvest) / bulk-patch / coverage+vocab guard; `derive_instrument_id()` |
| `scoring_doc.py` | `scoring/<id>.md` generator (faithful descriptor; `needs-research` cut-offs) |
| `review_export.py` | `import_review/` generator (readable export + review checklist) |
| `cli.py` | subcommands: `harvest`, `review-export`, `document-scoring`, `apply-/check-descriptions`, `apply-/check-short-titles`, `apply-/check-classifications`, `normalize-versions` |

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

Expected: 30 tests, all passing.

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
- **Generalise context dedup** — split-off Contexts are currently minted (with content-based ids
  so identical phrases share losslessly). Folding Contexts into the fingerprint engine (like
  Options/Instructions) and seeding the index from the Library would let a harvested Context reuse
  an *identical* existing Library Context automatically — while still respecting the faithfulness
  policy (only byte-identical-modulo-case content reuses; "2 weeks" never folds to "two weeks").
- **PsyToolkit adapter coverage** — handles single-scale Likert questionnaires, including
  scales without explicit `{score=N}` (scored by 1-based position per PsyToolkit's default),
  and merges items across multiple pages that share one scale. It **refuses cleanly** (raises
  `PsyToolkitParseError`; the CLI prints `SKIP ...` and writes nothing) for pages it can't
  faithfully represent: genuinely multi-scale pages (>1 distinct scale), non-`scale` blocks
  (`t: radio`/`t: textline`/matrix → "no `t: scale` block"), and label-less numeric scales
  (e.g. CFQ: `- {score=4}` with no anchor text). `publication` is emitted only when both a
  citation and a year are extracted (else the reference usually remains in the description).
  Per-instrument `classification` (domain/population) is left empty — classify downstream.
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
