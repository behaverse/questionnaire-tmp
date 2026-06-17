# Questionnaire Harvester — Design

**Date:** 2026-06-17
**Status:** Approved (brainstorming) — pending implementation plan
**Owner:** pedro

## Goal

Build a standalone workflow that extracts questionnaires and their content from public web resources
and turns them into canonical Schema-2 entities for the questionnaire-library — **without creating
duplicate entities** (especially shared response scales and standard instructions) and **without
touching or destabilising the rest of the project**.

Initial source resources:

- https://us.psytoolkit.org/survey-library/ (carries item-level content — **first adapter**)
- https://psychology-tools.com/
- https://scales.arabpsychology.com/

The work proceeds **one questionnaire at a time**, with open questions surfaced for the owner to
answer inline in markdown files.

## Prior work already in place (2026-06-17)

A separate agent (the Editor agent) briefly started this work and handed over the genuinely useful,
**already-validated** pieces (see `questionnaire-harvester/HANDOFF_from_editor_agent.md`). This design
**reuses** them rather than rebuilding:

- **The de-dup engine is built** — `dedup/build_catalogue.py` + `dedup/scales-index.json` +
  `dedup/scales-catalogue.md`. It is exactly the content-fingerprint mechanism in § "De-dup" below,
  validated against the regenerated survey_db corpus (~113 baseline Options; it already surfaced 5
  genuine duplicate scales). This **replaces** the multi-module `registry/` originally sketched here.
- **`conventions.md` is the canonical conventions reference** — id prefixes, entity shapes, and
  **validator gotchas** (below) distilled from the survey_db importer + the live schema validator.
- **A PHQ-9 pilot exists** (`output/`, public-domain) — full loop capture→mint→dedup→validate→render,
  12/12 Schema-2 valid, rendered (`output/phq9-preview.png`). Kept as the worked example. **GAD-7 is
  the next instrument**, chosen specifically to exercise dedup (it should reuse `opt_phq_frequency_4`
  + `ins_phq_2weeks`).

The handoff's draft `plan.md` / `registry.md` / single-file `open-questions.md` were **not** carried
over (they used a conservative open-license-only policy and a single-question-file model). This
design's full-content+disclosure policy and per-`qst_id` question model supersede them.

### Validator gotchas (from `conventions.md`, confirmed against the live validator)

- `metadata.license` is a **fixed enum** (underscored): `public_domain | cc0 | cc_by | cc_by_nc |
  cc_by_sa | proprietary_open_redistribution | proprietary_restricted | unknown |
  mixed_see_components`. The harvester's richer license taxonomy (§ Licensing) maps onto this.
- `provenance` is **closed** to exactly `{source, imported_at, importer_version}`. All harvest-specific
  metadata (incl. the rich license block, source URL, harvest date) goes in **`x_*` keys at the
  `metadata` level** (the corpus already does this, e.g. `x_source_reference`).
- **Validate before review** using the library's own validator over the drafted batch; refs must
  resolve within the batch.

## Non-goals (YAGNI)

- No review web UI — markdown files are the review surface.
- No auto-contacting of instrument authors.
- No canonical-schema changes during harvesting (rich licensing lives in the harvester layer; a
  schema extension is a noted future follow-up).
- Not building all three site adapters up front — PsyToolkit first, others follow.
- No automatic promotion to production — promotion + `library ingest` is an explicit, owner-approved step.

## Where it lives

A new top-level directory **`questionnaire-harvester/`** (matching the existing `questionnaire-*`
naming), self-contained with its own `pyproject.toml`, venv, and CLI. It is **isolated from
production**: it writes canonical JSON into a local `staging/` area only. Promotion into the library
content tree and `library ingest` is a separate, opt-in step.

**Dependency decision (approved):** the harvester takes `library/` as a *read-only library
dependency* (editable install) and reuses `ids.py`, `writer.py`, `entity_types`, and schema
validation, rather than forking the canonical-format logic. It remains a separate directory with its
own pipeline; it does not re-implement the writer/mappers.

## Architecture

Legend: **[built]** already on disk (prior work) · **[build]** to be built by the plan.

```
questionnaire-harvester/
├── about_licenses.md            # [built] licensing primer + project policy (companion doc)
├── conventions.md               # [built] id prefixes + entity shapes + validator gotchas
├── pyproject.toml               # [build] packaging + library/ as read dependency
├── dedup/                       # [built] the de-dup engine (see below) — was "registry/"
│   ├── build_catalogue.py       #   fingerprints Options across corpora, finds duplicates
│   ├── scales-index.json        #   {fingerprint: [option_ids]} — the committed index
│   └── scales-catalogue.md      #   human-readable scale index
├── src/harvester/               # [build]
│   ├── cli.py                   #   harvest / draft / dedup / status / promote commands
│   ├── sources/                 #   one adapter per site
│   │   ├── base.py              #   SourceAdapter interface → raw extraction
│   │   ├── psytoolkit.py        #   FIRST adapter
│   │   ├── psychology_tools.py  #   later
│   │   └── arab_psychology.py   #   later
│   ├── raw.py                   #   raw-extraction intermediate model
│   ├── draft.py                 #   raw → canonical Schema-2 entities (uses library writer/IDs)
│   ├── licensing.py             #   rich license block model + heuristics + enum mapping
│   └── tracking.py              #   reads/writes register.md + questions/*.md
├── _corpus/<plural-type>/       # [built, gitignored] regenerated survey_db baseline for dedup
├── raw/<qst_id>.json            # [build, gitignored] loose pre-canonical extraction
├── output/<plural-type>/        # [built] canonical entities — PHQ-9 pilot (tracked staging area)
│   └── phq9.bundle.json         #   self-contained {questionnaire, entities} for the viewer
├── register.md                  # [build] master progress table (committed)
├── questions/<qst_id>.md         # [build] per-questionnaire open questions (committed)
└── review/dedup.md               # [build] pending near-match decisions (committed)
```

The pilot used `output/` as the canonical staging area; the spec's `staging/<qst_id>/` and this
`output/` are the same role — the plan standardises on `output/` since it already exists and is
tracked.

## Pipeline (per questionnaire)

```
pick candidate → harvest (fetch+parse) → draft (canonical) → dedup pass → questions.md
              → owner answers inline → finalize → promote + ingest
```

1. **Pick candidate** — highest-importance `candidate` row in `register.md`.
2. **Harvest** — the site adapter fetches + parses one page into `raw/<id>.json` (title, items,
   options, instructions, references, license hints, source URL). Faithful capture; no canonical
   shaping yet.
3. **Draft** — `raw → canonical entities`, reusing the library writer/ID helpers; emits a
   `loss_report.md` mirroring the survey_db importer.
4. **Dedup pass** — every content-bearing entity runs through the registry (§ De-dup).
5. **questions.md** — generated per-questionnaire open-question file (license ambiguity, unclear
   items, near-match calls) for the owner to answer inline.
6. **Finalize** — incorporate answers, resolve near-matches, mark `ready` in `register.md`.
7. **Promote + ingest** — copy approved entities into the library content tree and run
   `library ingest`. Batched and owner-approved; nothing auto-touches production.

## De-dup: curated registry + content match

The heart of the system. **Built** as `dedup/build_catalogue.py` (+ `scales-index.json`,
`scales-catalogue.md`); this section describes it and the remaining enhancement.

- **Seeded from existing library content.** The engine scans the regenerated survey_db baseline
  (`_corpus/`, gitignored) **and** the tracked harvest `output/`, so the index knows every entity
  already in the library plus everything harvested so far — we reuse what exists, not just
  newly-harvested entities. (Baseline ≈ 113 Options; PHQ-9 pilot adds one → 114.)
- **Index** (`dedup/scales-index.json`, committed): `{fingerprint: [option_ids]}`. A fingerprint with
  >1 id is a duplicate scale to collapse. Most valuable for **Options** (Likert scales).
- **Fingerprint / normalization** (`fingerprint()` in `build_catalogue.py`): sha256 of
  `(input_data_type, measurement_type, selection, values, normalized en anchor texts)`. `norm()`
  lowercases, trims, and collapses whitespace, so `"Strongly agree"` and `"strongly agree"` hash
  identically. Anchored choice scales dedup on values+anchors; choice-less inputs (free text / number)
  fall back to `dimension + units` so distinct fields (minutes ≠ weight ≠ years) don't collapse.
- **Outcomes per entity:**
  - **Exact fingerprint match** → reuse the existing `@version` ref. *(built)*
  - **No match** → mint a new entity with a consistent naming convention. *(workflow)*
    - Options: instrument- or dimension-prefixed, e.g. `opt_phq_frequency_4`, `opt_agreement_5`.
    - Instructions: `ins_<purpose>` (e.g. `ins_phq_2weeks`, `ins_agreement_likert_7`).
    - Other shared entities follow the same `<prefix>_<semantic-slug>` pattern.
  - **Near-match** (similarity below identical but above a threshold) → appended to `review/dedup.md`
    for the owner to decide *reuse vs. mint*. ***[build]*** — a fuzzy tier layered on top of the
    existing exact-match engine; not yet implemented.
- **Write-back:** rerunning `build_catalogue.py` after minting re-scans `output/`, so newly-minted
  shared entities become dedup-visible to later instruments and the catalogue compounds.
- **Extend beyond Options:** the engine currently fingerprints Options only; the plan generalises it
  to Instructions (and other recurring content entities) using the same normalize-and-hash approach.

## Licensing model

- **Per-questionnaire structured license block** (captured at harvest, stored in tracking layer):
  - `license_class`: `public_domain` | `cc_by` | `cc_by_nc` | `cc_by_sa` | `free_research` |
    `proprietary` | `unknown`
  - `license_status`: `confirmed` | `inferred` | `unknown`
  - `commercial_use`, `redistribution`, `translation`: `yes` | `no` | `unknown` (independent tri-states)
  - `source_url`, `author_contact_needed` (bool), `notes` (free text)
  - **Default for anything ambiguous = `unknown` / `author_contact_needed: true`.**
- **Content is captured in full regardless of license** (owner decision), with risk managed by
  disclosure, not omission:
  - A **site-wide disclaimer banner** on the library web UI (PsyToolkit-style: "verify copyright
    yourself; acknowledge the original authors; ethics approval is your responsibility"). Draft text
    lives in `about_licenses.md`.
  - A **per-questionnaire license badge** surfacing `license_class` + `license_status`.
- **`about_licenses.md`** (companion deliverable): the legal landscape, sources, project policy, and
  the license taxonomy above.
- **Schema unchanged for now** (owner decision): the canonical questionnaire JSON keeps its existing
  single `metadata.license` field, which is a **fixed enum** (`public_domain | cc0 | cc_by | cc_by_nc |
  cc_by_sa | proprietary_open_redistribution | proprietary_restricted | unknown |
  mixed_see_components`). `licensing.py` maps the rich `license_class` onto this enum (e.g.
  `free_research → proprietary_open_redistribution`; generic `proprietary → proprietary_restricted`).
  The full rich block (commercial_use / redistribution / translation / source_url /
  author_contact_needed / notes) lives in **`x_*` keys at `metadata`** (since `provenance` is closed).
  Extending the schema to carry the structured block natively is a noted future follow-up.

## Progress & open-questions surface (markdown-driven)

- **`register.md`** — master table the owner watches:
  `questionnaire | source(s) | importance | status | #open-questions | license-status`.
  Status flow: `candidate → harvested → drafted → needs-review → ready → ingested`.
  **Importance** is seeded from signals (appears on N source sites, is-a-known-core-instrument,
  item count) and freely overridden by the owner.
- **`questions/<qst_id>.md`** — per-questionnaire open questions answered **inline** by the owner.
- **`review/dedup.md`** — pending near-match queue.

## Error handling & faithfulness

- Adapters that cannot parse a page record the failure in the loss report rather than guessing.
- Drafting preserves source wording verbatim; any approximation or dropped field is logged in
  `loss_report.md` (same discipline as the survey_db importer).
- Malformed or partial extractions can still be staged; they surface as open questions, never as
  silent guesses.

## Testing

- **Unit:** normalization rules, hash matching, near-match thresholding, ID minting conventions,
  license heuristics.
- **Adapter:** golden tests against saved HTML fixtures of representative PsyToolkit pages (no live
  network in tests).
- **Round-trip:** drafted entities validate against the canonical Schema-2 JSON Schema and ingest
  cleanly into a throwaway library DB.
- **Dedup regression:** importing two questionnaires that share a Likert scale yields a single shared
  Option entity referenced by both.

## Open follow-ups (not blocking)

- Extend the canonical schema to carry the structured license block.
- Build the `psychology_tools` and `arab_psychology` adapters.
- Wire the disclaimer banner + license badge into the library web UI.
```
