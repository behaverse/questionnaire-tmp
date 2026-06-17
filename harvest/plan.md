# Questionnaire Harvest — Organizing Plan (DRAFT)

**Created:** 2026-06-17 · **Status:** ACTIVE — defaults adopted (owner "go" 2026-06-17); dedup
baseline built (113 Options). Decisions tracked in [open-questions.md](open-questions.md).

Goal: harvest questionnaires + their content from external web resources into the
`questionnaire-library`, **without creating duplicate entities** (shared Likert scales
etc. become refs to a single canonical Option), and **without compromising the rest of
the project**. Work proceeds **one questionnaire at a time**, with clear progress
visibility and an explicit list of open decisions.

This plan reuses the conventions already built for the `survey_db` importer
(`library/src/library/importers/survey_db/`) — same entity id prefixes, same canonical
Schema 2 shapes, same one-file-per-entity `content/` output, same provenance + loss
reporting. See [conventions.md](conventions.md) for the reused id-prefix table and entity shapes.

---

## 1. Isolation — where the work lives (don't compromise the project)

```
harvest/                         # this workspace — curation process only, isolated
├── plan.md                      # this file
├── open-questions.md            # owner answers inline; the decision log
├── registry.md                  # the progress dashboard (one row per instrument)
├── conventions.md               # reused id/naming/entity-shape cheatsheet
├── scales-catalogue.md          # human-readable index of known shared scales (dedup aid)
├── sources/<acronym>/           # per-instrument raw capture (fetched HTML/text) — GITIGNORED
│   └── source.md                #   source URL(s), captured text, license note
├── output/                      # TRACKED canonical output — hand-curated, NOT regenerable
│   ├── options/  instructions/  prompts/  questionnaires/  ...   # one JSON per entity
└── _corpus/                     # GITIGNORED regenerable survey_db dedup baseline
```

Harvested entities are **tracked** under `harvest/output/` (unlike the regenerable survey_db
corpus). The Library ingests from `harvest/output/` + the corpus; this becomes the
`questionnaire-library-content` contribution. Validated with the library's own
`validate_artifact` + ref resolution before owner review.

- `harvest/` is **process + working files**; it never imports `library/` internals.
- Canonical entity JSON is written into the **existing `content/` tree** (one file per
  entity, per [conventions.md](conventions.md)) so harvested instruments are ingested by the Library
  Core exactly like survey_db output — no special-casing in the service.
- When we add automation, it becomes a parallel importer module
  `library/src/library/importers/web/` reusing survey_db's `ids.py`/`writer.py`/etc.
  Until then, harvesting is agent-curated (see §3).

## 2. Deduplication — the core requirement

The survey_db importer does **not** do content-based dedup (the legacy DB pre-grouped
options by id). Web harvesting needs real dedup. Mechanism:

1. **Fingerprint** each candidate shared entity. For an Option (scale):
   normalize `input_data_type` + `measurement_type` + `selection` + the ordered
   `value` array + the ordered per-language anchor `text`s (lowercased, trimmed) →
   stable hash.
2. **Look up** the fingerprint in the **scale catalogue** (built from the existing
   library corpus + everything harvested so far). The catalogue is both a machine index
   and a human-readable file ([scales-catalogue.md](scales-catalogue.md)) so the owner can eyeball it.
3. **Match → reuse** the existing `@vYY.MMDD` ref. **No match → mint** a new entity with
   a consistent name (convention TBD — see open-questions Q4) and add it to the catalogue.
4. **Borderline cases** (same structure, slightly different anchor wording) are flagged
   for owner review rather than auto-merged (strictness policy — open-questions Q5).

Dedup applies primarily to **Options** (scales) but also to **Instructions**, common
**Messages/Contexts**, and identical **Prompts** across instruments.

## 3. Per-instrument workflow (the loop)

For each questionnaire, one at a time:

1. **Intake** — add a row to [registry.md](registry.md) (name, source, domain, importance, license).
2. **Capture** — fetch the source page(s) into `harvest/sources/<acronym>/source.md`
   (raw item text, response scale, scoring/subscales, license/attribution).
3. **Extract** — structure into `extraction.json` (items, scale, subscales) — pre-canonical.
4. **Dedup + map** — fingerprint the scale(s) → reuse-or-mint Options; mint Prompts/
   Questions/Items/Questionnaire per [conventions.md](conventions.md); pin refs `@vYY.MMDD`.
5. **Write** — emit canonical JSON into `content/...`; append to the loss report.
6. **Validate** — Schema 2 valid + all refs resolve (reuse the Library ingest validators).
7. **Preview** — render in the editor/web-viewer; capture a screenshot for owner review.
8. **Review** — owner signs off in the registry; status → `imported`.

Batched decisions are recorded in [open-questions.md](open-questions.md), not asked one-by-one mid-loop.

## 4. Progress visibility

[registry.md](registry.md) is the single dashboard. Columns: instrument · acronym · source ·
domain · #items · scale(s) · **importance (High/Med/Low)** · **license** · **status** ·
dedup notes. Status legend + importance rubric live at the top of that file. "Which
questionnaires are important and how" = the importance column + its rubric.

## 5. Definition of done (per instrument)

Schema-2-valid · all refs resolve · no duplicate scale introduced (dedup checked) ·
renders in preview · license recorded · owner sign-off in registry. (Confirm in Q10.)

## 6. What this plan deliberately does NOT do (yet)

- No generic multi-site scraper (sites are heterogeneous; quality matters more than speed).
- No automatic ingestion to the live Library until a batch review gate (Q12).
- No copyrighted-instrument import until the license policy is set (Q1).
- No translation harvesting unless the source provides it and Q7 says yes.

## 7. First actions once questions are answered

1. Confirm the dedup corpus (regenerate survey_db `content/` if needed — Q3).
2. Build `scales-catalogue.md` from the existing Options.
3. Pilot the loop end-to-end on **one** owner-chosen, clearly-licensed instrument.
4. Review the pilot together; lock the convention; then proceed down the registry.
