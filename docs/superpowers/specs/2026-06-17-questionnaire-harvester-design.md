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

```
questionnaire-harvester/
├── pyproject.toml
├── about_licenses.md            # licensing primer + project policy (see companion doc)
├── src/harvester/
│   ├── cli.py                   # harvest / draft / dedup / status / promote commands
│   ├── sources/                 # one adapter per site
│   │   ├── base.py              # SourceAdapter interface → raw extraction
│   │   ├── psytoolkit.py        # FIRST adapter
│   │   ├── psychology_tools.py  # later
│   │   └── arab_psychology.py   # later
│   ├── raw.py                   # raw-extraction intermediate model
│   ├── draft.py                 # raw → canonical Schema-2 entities (uses library writer/IDs)
│   ├── registry/                # de-dup engine (see below)
│   │   ├── index.py             # normalized-content-hash → entity id + ref
│   │   ├── normalize.py         # per-entity normalization rules
│   │   ├── match.py             # exact / near-match / mint decision
│   │   └── seed.py              # seed index from existing library content
│   ├── licensing.py             # structured license block model + heuristics
│   └── tracking.py              # reads/writes register.md + questions/*.md
├── raw/<qst_id>.json            # loose pre-canonical extraction (gitignored)
├── staging/<qst_id>/            # canonical entities + loss_report.md (gitignored)
├── registry/index.json          # the curated shared-entity catalogue (committed)
├── register.md                  # master progress table (committed)
├── questions/<qst_id>.md         # per-questionnaire open questions (committed)
└── review/dedup.md               # pending near-match decisions (committed)
```

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

The heart of the system.

- **Seeded from existing library content.** On first run, `registry/seed.py` ingests the survey_db
  import output and `schemas/questionnaire/examples/library_examples` so the index already knows
  every entity currently in the library — we reuse what exists, not just newly-harvested entities.
- **Index** (`registry/index.json`, committed): per entity type, a map of
  `normalized-content-hash → {canonical_id, ref}`. Most valuable for **Options** (Likert scales) and
  **Instructions**, which recur across questionnaires.
- **Normalization** (`normalize.py`): lowercase, trim, collapse internal whitespace, sort option rows
  by `index`, and fold punctuation/quote variants — so `"Strongly agree"` and `"strongly agree"`
  hash identically.
- **Three outcomes per entity:**
  - **Exact hash match** → reuse the existing `@version` ref.
  - **Near-match** (similarity above a configured threshold) → appended to `review/dedup.md` with both
    candidates for the owner to decide *reuse vs. mint*.
  - **No match** → mint a new entity with a consistent naming convention:
    - Options: `opt_<dimension>_<n>` (e.g. `opt_agreement_5`, `opt_frequency_7`).
    - Instructions: `ins_<purpose>` (e.g. `ins_agreement_likert_7`).
    - Other shared entities follow the same `<prefix>_<semantic-slug>` pattern.
- **Write-back:** confirmed new shared entities are added to the index, so the catalogue compounds
  across questionnaires.

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
  single `license` field; the rich block lives in the harvester tracking layer. Extending the schema
  to carry the structured block is a noted future follow-up.

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
