# Questionnaire Apps Ecosystem — Plan

This folder records **how and when** the Questionnaire Apps Ecosystem gets built. It is intentionally separate from [../design/](../design/00_index.md), which records *what the system is*.

If something here contradicts the design folder, the design folder wins. Plan documents reference the design; they never restate it.

**Last revised.** 2026-06-06 — Library Core + legacy importer built, tested, and merged (`library/`). Schema-authoring and the buildable Library work of Phase 1 are done; web UI + contribution workflow + deployment remain. All 20 open decisions resolved. Full status in [../HANDOFF.md](../HANDOFF.md).

## Contents

| # | Document | Purpose |
|---|---|---|
| 00 | [00_index.md](00_index.md) | This file |
| 01 | [01_roadmap.md](01_roadmap.md) | MVP → Phase 2 → Phase 3 sequencing and rationale |
| 02 | [02_mvp_scope.md](02_mvp_scope.md) | What is and is not in the MVP |
| 03 | [03_use_case_priority.md](03_use_case_priority.md) | Priority assigned to each use case from `design/03_use_cases.md` |
| 04 | [04_feature_priority.md](04_feature_priority.md) | Priority assigned to question types and cross-cutting features |

## Status as of 2026-06-06

**Done:**

- **Design phase complete.** All 20 originally-tracked open decisions resolved (full log in [../design/10_open_decisions.md](../design/10_open_decisions.md)). The six BDM-deviation entries (D1–D6) in [../design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md) were drafted and **filed as issues upstream** in `behaverse/data-model`.
- **All 8 data-model schemas authored, validated, and tagged** with examples, JSON-LD context, tests, and CHANGELOG/README:
  - Schema 1 Instrument Metadata (`instrument-v26.0605`; renamed `authors` → `author` 2026-06-05)
  - Schema 2 Questionnaire Definition (`v26.0602`; OD-15 entity model + OD-16 scoring pivot)
  - Schema 3 Questionnaire Runtime (`runtime-v26.0603`; OD-18)
  - Schema 4a Event Data (`events-v26.0605`; OD-19 — bdm: events vocabulary)
  - Schema 4b Behavioural Channels — Mouse + Keyboard (`recordings-v26.0605`; OD-20)
  - Schema 5 Response Data (`response-v26.0603`; OD-17 — strict BDM Response table)
  - Schema 6 Session Metadata (`session-v26.0603`; OD-17 — carries `scorer_outputs`)
  - Schema 7 Viewer Conformance Manifest (`viewer_conformance-v26.0603`; OD-18 sibling of Schema 3)
- **Validator** (`tools/validate_schemas.py`) covers all schemas with 9 cross-checks; 308 tests pass; 43 examples validate.
- **Library Core + legacy importer built + merged** (`library/`; Python/FastAPI/PostgreSQL). Public read API (catalogue / entities / `dependents` / search / facets / definition) over Git-ingested canonical JSON (storage Approach C); the importer converts the full `survey_database/` catalogue → canonical Schema 2 JSON + provenance + loss report, validated and ingested in test. 86 library tests pass.

**Pending — to finish Phase 1 (MVP):**

- Library **web UI** (sub-project 5) — the researcher-facing browse/search interface over the read API.
- **Contribution/review workflow + DOI** (sub-project 3) — needs auth/Identity (OD-08).
- **Deployment + persistent content seeding + public schema hosting** (ops).

**Pending — Phase 2+ (post-MVP):**

See [../HANDOFF.md](../HANDOFF.md) §"What's next" for the full status. Phase-2 highest-leverage items:

1. ✅ BDM upstream change handoff — done (D1–D6 filed upstream in `behaverse/data-model`).
2. `questionnaire-runtime-denormaliser` Python library (OD-18).
3. Viewer Service core: `runtime_cache` table, admin API, viewer registry, `/sessions/new` (OD-13 + OD-18).
4. Web Viewer (custom React + TypeScript per OD-01).
5. Editor preview integration (OD-18 — consumes the denormaliser).
6. WASM expression evaluator with `score(id)` host function (OD-11 + OD-16).
7. Scorer conformance runner (OD-16).
8. CSV serializer for Schema 5 → BDM CSV (OD-17).
9. EEG / webcam / microphone schemas under `schemas/recordings/` (deferred from OD-20).

## Why design and plan are separated

Roadmaps and MVP scopes change as work progresses; the system's identity (what it is, who it serves, how the components fit) is far more stable. Mixing the two leads to design docs that drift with sprint planning, and to roadmaps that get buried in architectural prose. Separating them at the filesystem level keeps each focused.

In practice: when a sentence starts with "for the MVP we will…" or "in Phase 2…" — it goes in this folder. When a sentence describes a permanent property of the system — it goes in `design/`.

## How to use this folder

- **Researcher or stakeholder.** Read [01_roadmap.md](01_roadmap.md) and [02_mvp_scope.md](02_mvp_scope.md). About 15 minutes.
- **Contributor picking up an implementation task.** Read the Status section above, then [../HANDOFF.md](../HANDOFF.md) for the prioritized tactical work list. Then the relevant component spec in `design/`.
- **Reviewing a proposed change.** If the proposal alters phasing, it lives here. If it alters the system itself, it lives in `design/` (and any phasing impact is reflected here afterwards).
