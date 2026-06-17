# Reused Conventions (from the survey_db importer)

Distilled from `library/src/library/importers/survey_db/` + `design/05a_reusable_entities.md`.
Harvested entities MUST follow these so the Library Core ingests them identically.

## Entity id prefixes (`ids.py`)
| Entity | Prefix | Example | Notes |
|--------|--------|---------|-------|
| Message | `msg_` | `msg_aiss_m_1` | content-bearing |
| Context | `ctx_` | `ctx_activity_definition` | content-bearing |
| Instruction | `ins_` | `ins_agreement_likert_7` | content-bearing |
| Prompt | `pr_` | `pr_aiss_q_2` | content-bearing (the item stem) |
| Option | `opt_` | `opt_agreement_7` | the response scale — **main dedup target** |
| Placeholder | `ph_` | `ph_hours_per_week` | |
| Help | `help_` | `help_orcid_format` | |
| RegEx | `rx_` | `rx_year_4digit` | |
| Solution | `sol_` | `sol_attention_check_3` | correct-answer (cognitive items) |
| Subscale | `scl_` | `scl_aiss_total` | label entity (OD-16) |
| Scorer | `scr_` | `scr_phq9` | external scoring (OD-16) |
| Question | `q_` | `q_aiss_2` | refs-only (prompt+instruction+context) |
| Item | `it_` | `it_aiss_2` | refs-only (question+option) |
| Questionnaire | `qst_` | `qst_aiss` | top-level |

**Id minting:** `sanitize(s)` = lowercase, non-`[a-z0-9_]` → `_`, strip edges. Deterministic.
**Refs:** `{ "ref": "<id>@v<YY>.<MMDD>" }` (CalVer, hard-pinned, OD-06).
**Output:** one JSON file per entity in `content/<plural-type>/<id>.json` (sorted keys, UTF-8).

## Option (scale) shape — the dedup target
```json
{
  "id": "opt_agreement_7",
  "dimension": "agreement",
  "input_data_type": "choice",
  "measurement_type": "ordinal",
  "selection": "single",
  "options": [ { "index": 1, "value": -1.0 }, ... { "index": 7, "value": 1.0 } ],
  "content": { "en": { "status": "validated", "label": "7-point agreement scale",
    "options": [ { "index": 1, "text": "strongly disagree" }, ... ] } }
}
```
**Fingerprint for dedup** = hash of `(input_data_type, measurement_type, selection,
[values...], [normalized en anchor texts...])`.

## Prompt / Question / Item / Questionnaire
- **Prompt:** `{ id, content:{ en:{ status, text } }, reversed?, construct?, dimension?, topics? }`
- **Question (refs-only):** `{ id, prompt:{ref}, instruction?:{ref}, context?:{ref} }`
- **Item (refs-only):** `{ id, question:{ref}, option:{ref} }`
- **Questionnaire:** `{ @context, metadata:{ id, version, title, description, language,
  available_languages, classification, publication, license, provenance }, pages:[
  { id, elements:[ {ref} | { question:{ref}, option:{ref}, required } ] } ] }`

## Provenance + custom fields (validator-confirmed placement)
`provenance` is **closed** to exactly `{source, imported_at, importer_version}` — extra keys
fail validation. Put harvest-specific data as **`x_*` keys at the `metadata` level** (the
corpus already does this, e.g. `x_source_reference`):
```json
"metadata": {
  ...,
  "license": "public_domain",          // ENUM (underscore!): public_domain | cc0 | cc_by |
                                        //   cc_by_nc | cc_by_sa | proprietary_open_redistribution |
                                        //   proprietary_restricted | unknown | mixed_see_components
  "x_source_url": "...", "x_source_site": "...", "x_harvest_date": "...", "x_license": "public_domain",
  "provenance": { "source": "web_harvest", "imported_at": "...", "importer_version": "web-harvest-0.1.0" }
}
```

## Output location
- **`questionnaire-harvester/output/{type}/<id>.json`** — TRACKED, hand-curated harvested
  entities (not regenerable). This is the curated library contribution.
- **`questionnaire-harvester/_corpus/`** — gitignored, regenerable survey_db dedup baseline.
- Validate with the library before review: `PYTHONPATH=library/src python3` → `build_registry`
  + `validate_artifact` over `load_tree(<dir>, release)`; refs must resolve within the batch.

## Loss report
Append per import: `entries:[{category: dropped|approximated|warning, source, detail}]`
+ `preserved:{type: count}`. Human + machine (`loss_report.md` / `.json`).
