# Handoff — dedup tooling + PHQ-9 pilot (from the editor agent)

**Date:** 2026-06-17 · **Author:** the agent working on the Editor (ED-H). I briefly started
harvesting before learning a dedicated harvester agent owns this folder. Everything I built
that's useful to you is now here; this note explains it. I've **returned to the editor** and
am not continuing harvesting — this is yours.

Nothing here conflicts with your [about_licenses.md](about_licenses.md) policy. In fact your
doc's §1 point — *"treating standard response scales as reusable shared Option entities"* — is
exactly the dedup mechanism below, built and validated against real data.

> **One policy note:** I initially used a conservative "open-license only, skip copyrighted"
> default. **Your policy supersedes it** (capture full content regardless of license + flag).
> The PHQ-9 pilot is public-domain so it's compatible either way.

---

## What's here

```
questionnaire-harvester/
├── about_licenses.md          # YOURS (unchanged)
├── conventions.md             # reused survey_db id-prefixes + Schema-2 entity shapes + GOTCHAS
├── dedup/
│   ├── build_catalogue.py     # the dedup engine — fingerprints Options, finds duplicates
│   ├── scales-index.json      # {fingerprint: [option_ids]} — check before minting a scale
│   └── scales-catalogue.md    # human-readable scale index (114 Options)
└── output/                    # TRACKED canonical output (PHQ-9 pilot) + bundle + screenshot
    ├── options/ instructions/ prompts/ questionnaires/
    ├── phq9.bundle.json        # self-contained {questionnaire, entities} for the viewer
    └── phq9-preview.png        # rendered proof
```

## 1. The dedup engine (the core thing to reuse)

**Problem:** the existing `survey_db` importer does NOT do content-based dedup (it relied on
the legacy DB pre-grouping options). Web harvesting needs real dedup so a shared Likert scale
becomes ONE `opt_*` Option that many questionnaires `@ref`, not a duplicate per instrument.

**Mechanism** (`dedup/build_catalogue.py`):
- **Fingerprint** each Option = sha256 of `(input_data_type, measurement_type, selection,
  values, normalized en anchor texts)`. Choice scales dedup on values+anchors; choice-less
  free-text/number Options fall back to `dimension + units` (so "minutes" ≠ "weight").
- **Baseline:** regenerate the survey_db corpus (see below) → **113 Options** indexed. Adding
  the PHQ-9 scale makes **114**. The fingerprinting already flagged 5 genuine duplicate scales
  in the existing corpus.
- **Before minting a scale:** compute its fingerprint, look it up in `scales-index.json`.
  Match → reuse that ref. No match → mint a new Option (instrument-prefixed name, e.g.
  `opt_phq_frequency_4`) and rebuild the index so later instruments dedup against it.

**Regenerate + rebuild (from repo root):**
```bash
PYTHONPATH=library/src python3 -c "from library.importers.survey_db.run import import_survey_db; \
  import_survey_db('survey_database/data/survey_db.sqlite','questionnaire-harvester/_corpus','v26.0606','2026-06-06T00:00:00Z')"
python3 questionnaire-harvester/dedup/build_catalogue.py        # scans _corpus + output
```
(`_corpus/` is gitignored — regenerable. The DB is at `survey_database/data/survey_db.sqlite`,
999 KB; the 0-byte sqlite files elsewhere are stale stubs.)

## 2. Conventions + gotchas (see conventions.md)

- **Id prefixes:** `opt_ pr_ ins_ ctx_ msg_ q_ it_ qst_ …` ; ids = `sanitize()` (lowercase,
  non-`[a-z0-9_]`→`_`). Refs hard-pinned `@vYY.MMDD`.
- **Page element shape** (mirrors the corpus): `{ option:{ref}, question:{ prompt:{ref},
  instruction?:{ref}, context?:{ref} }, required? }` — `question` is INLINE (no `q_` entity).
- **Validator-confirmed gotchas** (these cost me three validation rounds):
  - `license` is an **enum with underscores**: `public_domain | cc0 | cc_by | cc_by_nc |
    cc_by_sa | proprietary_open_redistribution | proprietary_restricted | unknown |
    mixed_see_components`. (Maps to your taxonomy's `license_class`.)
  - `provenance` is **closed** to `{source, imported_at, importer_version}`. Put harvest
    metadata as **`x_*` keys at the `metadata` level** (`x_source_url`, `x_harvest_date`, …),
    like the corpus's `x_source_reference`.
- **Validate before review** (catches the above): library's own validator —
  `build_registry(Path('schemas'))` + `validate_artifact` over
  `load_tree(<dir>, release)`; refs must resolve within the batch. (See conventions.md.)

## 3. The PHQ-9 pilot (a worked example — keep, redo, or delete)

Ran the full loop on PHQ-9 (public domain, in your "free" list). Output in `output/`:
`opt_phq_frequency_4` (minted — no baseline match), shared `ins_phq_2weeks`, `pr_phq9_1..9`,
`qst_phq9`. **12/12 Schema-2 valid, all refs resolve, renders correctly** (`phq9-preview.png`).

Open choices I left for the owner (your `questions/<qst_id>.md` flow may already cover these):
- **Scoring/subscales:** imported items only — no runnable Scorer or 0–27 severity bands yet.
- **PHQ-9 "item 10"** (functional-impairment, unscored): omitted.
- **GAD-7 was queued next** specifically to demonstrate dedup — it should reuse
  `opt_phq_frequency_4` + `ins_phq_2weeks`. Good first test of the engine in your hands.

## 4. Things I did NOT bring over

My draft `plan.md` / `registry.md` / `open-questions.md` used a different (conservative)
policy and a single-file question model that doesn't match your per-`qst_id` approach, so I
left them out (they're in git history at commit `harvest:` if ever useful). The dedup engine,
conventions, and pilot above are the parts worth keeping.
