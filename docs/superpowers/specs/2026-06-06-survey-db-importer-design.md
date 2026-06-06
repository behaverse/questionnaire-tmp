# survey_database Importer — Design Spec

**Date drafted:** 2026-06-06
**Author:** survey_db importer brainstorming session (2026-06-06)
**Component:** Library — sub-project 2 (legacy content importer). Lives as a package inside `questionnaire-library-service` (built under `library/` for now).
**Stack:** Python 3.12 · stdlib `sqlite3` · reuses `library` package (loader/validation/ingest) · pytest + testcontainers.
**Authoritative source documents:**

- [design/13_importers.md](../../../design/13_importers.md) — importer posture, loss report, provenance block
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) — the 13 reusable entity types (target model)
- [design/11_content_licensing.md](../../../design/11_content_licensing.md) — licence tags (`unknown` default)
- [docs/superpowers/specs/2026-06-05-library-core-design.md](2026-06-05-library-core-design.md) — the Library Core this feeds (ingestion + schema validation)

A one-time migration tool that converts the legacy `survey_database/data/survey_db.sqlite` catalogue into canonical Schema 2 JSON (reusable entities + questionnaires), each questionnaire carrying a `provenance` block, alongside a loss report. Output feeds the Library Core's ingestion path. The tool is the deliverable; its bulk output is gitignored (regenerable; destined for `questionnaire-library-content` at the reorg).

---

## 1 — Scope

**In scope:** read the SQLite catalogue; emit canonical JSON for the 9 content/binding entity types + 64 questionnaires; emit a loss report; a CLI; TDD (unit per mapper + integration on the real DB + a full-run smoke test that validates every artifact against the schemas and ingests them into a throwaway Library DB).

**Out of scope (non-goals):** the generic foreign-format importers (SurveyJS/CSV/REDCap/… in 13_importers.md); committing the bulk output; native psychometric-metadata enrichment; the author-acknowledgement UI gate (this is a CLI batch migration); Scorer reconstruction from `scoring_code` URLs.

## 2 — Legacy → canonical relationship (established from the data)

- `compositions.questionnaire` is the questionnaire id; rows have `element_type ∈ {header, message, question}`, ordered by `id`.
- The `header` row's `header_id` → `surveys.survey_id` supplies that questionnaire's Schema 1 metadata. **64 questionnaires → 54 surveys** (variants like `x_asrs`/`asrs-a`/`x_asrs-i` share header `asrs`). All 64 header_ids resolve to a survey.
- **13 orphan surveys** (`DEBUG_*`, `aaaa`, `edit-test-survey`, `whoqol`, …) are referenced by no header → **skipped** (metadata-only, no content), listed in the loss report.

## 3 — Module layout

```
library/src/library/importers/survey_db/
├── __init__.py
├── reader.py          # open sqlite; typed row accessors per table
├── ids.py             # legacy bare id -> canonical "<prefix><sanitized>"; sanitize() + prefix_for(type)
├── content.py         # build the language-keyed `content` map from text_<lang> columns
├── mappers.py         # prompt/context/instruction/message/option/placeholder/help/regex/solution -> dict
├── questionnaire.py   # reconstruct a Schema 2 questionnaire from compositions + survey metadata
├── provenance.py      # build the provenance block
├── loss.py            # LossReport accumulator -> JSON + Markdown
├── writer.py          # write dicts to <out>/<plural>/<id>.json
└── run.py             # orchestrate: read -> map all -> write -> loss report; returns a summary
# CLI: extend library/src/library/cli.py with `import-survey-db`
```

`run.import_survey_db(sqlite_path, out_dir, release, imported_at) -> ImportSummary`. Each unit is independently unit-testable with in-memory rows; `run` is covered by the integration + smoke tests.

## 4 — ID mapping (`ids.py`)

`LANGS = ["en","fr","de","lu","pt","es","it"]`. Prefix per type: `pr_ ctx_ ins_ msg_ opt_ ph_ help_ rx_ sol_ qst_`. `sanitize(s)` = lowercase, replace any run of non-`[a-z0-9_]` with `_`, strip leading/trailing `_`. Canonical id = `prefix + sanitize(legacy_id)` (e.g. `aiss_q_1`→`pr_aiss_q_1`, `agreement_7`→`opt_agreement_7`, `acs-s`→`qst_acs_s`, `x_aiss`→`qst_x_aiss`). Every transformation that changes a char is recorded in the loss report (`approximated`).

## 5 — Entity mappers (`mappers.py`)

`content(row, fields, langs)` → `{ lang: { status: "complete", <field>: text } }` for each non-empty `text_<lang>`. Reusable entities carry **no `version`** (the Library stamps `--release`); they carry **no provenance** (kept deterministic).

| Entity | Source table | Canonical fields |
|---|---|---|
| Prompt | `prompts` | `id`, `name`, `dimension`, `topics` (`;`-split→array, trimmed), `reversed` (0/1→bool), `content{lang:{status,text}}` (7 langs); **`construct` omitted** (OD-15 Q3d) |
| Context | `contexts` | `id`, `content` (7 langs) |
| Instruction | `instructions` | `id`, `dimension`, `content` (7 langs) |
| Message | `messages` | `id`, `type` (string→array), `content` (en+fr) |
| Placeholder | `placeholders` | `id`, `content` (en+fr) |
| Help | `help_texts` | `id`, `content` (en+fr) |
| RegEx | `regex_patterns` | `id`, `regex`, `example_input` |
| Option | `options` (grouped by `option_id`) | structural from the group: `dimension`, `input_data_type`, `measurement_type`, `selection` (derive: `"single"` for choice unless data says otherwise), `min`/`max`/`step` (from `min_value`/`max_value`/`step`), `units`, `placeholder` (ref if `placeholder_id`), `help` (ref if `help_id`), `input_validation` (regex ref if present), `options[]` = `{index, value}` per row; `content{lang:{status,label?,options:[{index,text}]}}` per-lang choice text |
| Solution | `solutions` | `id` = `sol_<prompt>`, `prompt` (ref), `expected_response` |

Option grouping: rows with a NULL `option_id` → loss-report warning, skipped. Numeric inputs (no choices) → no `options[]`.

## 6 — Questionnaire reconstruction (`questionnaire.py`)

For each distinct `compositions.questionnaire`:

1. **Metadata** from `surveys[header_id]` → Schema 1 block: `title`, `short_title` = `variant`, `description`, `license` (NULL→`unknown`), `classification.domain` ← `topics` (`;`-split), `classification.population` ← `target_population` (split if present), `publication.citation` ← `reference` (trimmed), `available_languages` ← `validated_languages` (split) else inferred from non-empty prompt langs, `tags` ← `tags` (split). `scoring_code` → **dropped** + loss note. `id` = `qst_<sanitized questionnaire>`; `version` = row `version` else `--release`.
2. **Provenance** block (§7) attached to the metadata.
3. **Pages:** one Page (legacy is flat). Elements ordered by `compositions.id`:
   - `message` row → Message element `{ ref: "msg_<id>@<ver>" }`.
   - `question` row → inline Item: `{ question: { prompt: {ref}, context?: {ref}, instruction?: {ref} }, option: {ref}, required?: bool, show_if?: expr }` — `is_required`→`required`; `condition`→`show_if` (copied verbatim as an expression string; if non-empty and not obviously an expression, keep + loss-note `approximated`).
4. All refs pin the questionnaire's version (`--release` unless the row had a version). Solutions for this questionnaire's prompts are emitted as separate `sol_` entities.

## 7 — Provenance (`provenance.py`)

On each questionnaire's Schema 1 metadata:

```jsonc
"provenance": {
  "source": "survey_db_sqlite",
  "imported_at": "<--imported-at>",          // fixed input → deterministic, re-runnable output
  "importer_version": "survey-db-importer-0.1.0",
  "source_questionnaire_id": "<legacy questionnaire>",
  "source_header_id": "<legacy header_id>",
  "import_loss_report": "loss_report.md"
}
```

Reusable entities carry no provenance (keeps their content byte-stable so re-ingest stays idempotent per the Library Core's immutability rule).

## 8 — Loss report (`loss.py`)

`LossReport` accumulates entries `{category, source, detail}` with `category ∈ {dropped, approximated, preserved, warning}`. Emits `loss_report.json` + `loss_report.md` to `<out>`.

- **dropped:** `scoring_code`/`scoring_reference` URLs; `comment`, `condition_tmp`, `header_id` bookkeeping columns; orphan surveys (id + reason); junk surveys (`DEBUG_*`, `aaaa`, `*test*`).
- **approximated:** id sanitization (when a char changed); `topics`/`tags`/`population` string-splits; `condition`→`show_if` passthrough; NULL `version`→`--release`.
- **warning:** NULL `license`→`unknown`; empty/missing `text_en`; NULL `option_id`; option with no rows; unmapped `input_data_type`/`measurement_type`.
- **preserved:** per-type counts (e.g. `prompts: 793`).

## 9 — Versioning & status

- Entities/questionnaires version = explicit `compositions.version`/none → `--release` (CalVer, default `v26.0606`). Refs pin the same.
- `content[*].status = "complete"` (imported, not natively validated; cannot be `published` in the Library until reviewed, per 13_importers).

## 10 — Error handling

Per-row mapping failures are recorded as loss-report `warning`s and the row is skipped — a single bad row never aborts the run. After mapping, the run validates each produced artifact via `library.validation.validate_artifact`; a validation failure is a `warning` + the artifact is still written (so reviewers can inspect) but flagged. The full-run smoke test asserts **zero validation failures** on the real data (if any appear, they're real mapping bugs to fix).

## 11 — Testing (TDD)

- **Unit** (`tests/unit/importers/`): `ids.sanitize`/`prefix_for`; `content` map (7-lang, partial-lang, empty); each mapper from a hand-built in-memory row dict; `loss` accumulation; `questionnaire` reconstruction from a tiny in-memory compositions+survey set (header→metadata, message+question→elements, is_required/condition).
- **Integration** (`tests/integration/`, real sqlite, no DB): convert known rows — `pr_aiss_q_1` (reversed=false, name=`marry_foreign`), `pr_aiss_q_2` (reversed=true), `opt_agreement_7` (grouped), questionnaire `qst_x_aiss` (header `aiss` → ACS-style metadata, items referencing `pr_aiss_q_*`@release + `opt_agreement_7`@release) — assert exact canonical shapes + that they validate against the schemas.
- **Full-run smoke** (`tests/integration/`, testcontainers Library DB): run `import_survey_db(real_sqlite, tmp_out, release="v26.0606", imported_at="2026-06-06T00:00:00Z")`; assert produced counts (`prompts/`=793, `contexts/`=30, `instructions/`=22, `messages/`=100, `placeholders/`=11, `helps/`=21, `regexes/`=7, `solutions/`=35, `questionnaires/`=64, options ~30 sets); every artifact validates; then `ingest_tree(out, release="v26.0606")` into a fresh Postgres → zero validation/unresolved-ref errors, and the catalogue holds 64 questionnaires; a `loss_report.json` exists with the orphan/junk surveys listed.

## 12 — Definition of done

1. `library import-survey-db survey_database/data/survey_db.sqlite --out <dir> --release v26.0606` runs clean, writes the canonical tree + loss report.
2. The full-run smoke test passes: all expected counts, every artifact schema-valid, and the whole tree ingests into a Library DB with zero errors and all refs resolving.
3. Unit + integration suite green; matches house pytest conventions; existing 308 schema tests + the Library Core suite stay green.
4. Output dir is gitignored; the importer package + tests are committed.

## 13 — Open notes / deferred

- `condition`→`show_if`: passed through verbatim; real expression-language translation is deferred to when the WASM evaluator (OD-11) lands — flagged in the loss report.
- Single-page reconstruction: legacy had no pagination; curators can paginate post-import (the Library doesn't require multi-page).
- Psychometric metadata (reliability/validity/norms) is absent in the legacy source → left empty for native enrichment (per 13_importers; imported content can't be `published` until filled in + reviewed).
- Re-running with the same `--release` + `--imported-at` is deterministic (idempotent re-ingest).
