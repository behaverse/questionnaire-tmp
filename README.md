# Questionnaire Apps

This repository holds the design and (eventually) the implementation of the **Questionnaire Apps Ecosystem** — an open, modular platform for designing, distributing, and analysing psychological-research questionnaires.

**Status (2026-05-23):** Design phase complete — all 13 originally-tracked design decisions are resolved (see [design/10_open_decisions.md](design/10_open_decisions.md) Resolution log). Implementation has not yet begun. Versioning aligned with the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning) (Calendar Versioning `vYY.MMDD`).

## Start here

- **New agent or contributor?** → [HANDOFF.md](HANDOFF.md) — orients you in 5 minutes, names the conventions and anti-patterns, and points at the suggested next work.
- **What the system is →** [design/00_index.md](design/00_index.md)
- **How and when it gets built →** [plan/00_index.md](plan/00_index.md)

The design folder is the single authoritative source. The plan folder records roadmap, MVP scope, and phasing. HANDOFF.md is the navigation aid. Nothing else at the root is authoritative.

## Folder layout

| Path | What's there |
|---|---|
| [HANDOFF.md](HANDOFF.md) | Navigation aid for a new agent / contributor — current status, conventions, anti-patterns, suggested next work. |
| [design/](design/) | The authoritative design: vision, terminology, use cases, architecture, data model, per-component specs, open decisions. |
| [plan/](plan/) | The roadmap and phasing: MVP scope, use-case priority, feature priority. |
| [archive_do_not_edit/](archive_do_not_edit/) | Earlier scattered specs, superseded by `design/` and `plan/`. Do not edit; do not cite as authoritative. |
| [qv_godot/](qv_godot/) | Godot-based survey runner — **prototype**, reference-only. Predates the current design. |
| [survey_database/](survey_database/) | Python/SQLite survey database — **prototype**, reference-only. Contains 59 questionnaires and 792 questions to be migrated into the Library during MVP. |
| [survey_system/](survey_system/) | FastAPI + React + xAPI skeleton — **prototype**, reference-only. Abandoned. |
| `survey_database_2025.zip` | Archived snapshot of an earlier `survey_database/` state. |

## What the prototypes are for

The three prototype folders are kept as references for the implementation phase. They are **not** authoritative descriptions of the system. The design in [design/](design/) is written from clean principles; the prototypes inform tactical decisions (component-reuse model from `survey_database/`, Godot rendering patterns from `qv_godot/`, xAPI integration from `survey_system/`) but do not constrain the design.

In particular, the 792 questions catalogued in `survey_database/` will be migrated into the Library as part of the MVP (see [plan/02_mvp_scope.md](plan/02_mvp_scope.md)).
