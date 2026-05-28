# Questionnaire Apps Ecosystem — Plan

This folder records **how and when** the Questionnaire Apps Ecosystem gets built. It is intentionally separate from [../design/](../design/00_index.md), which records *what the system is*.

If something here contradicts the design folder, the design folder wins. Plan documents reference the design; they never restate it.

**Last revised.** 2026-05-23.

## Contents

| # | Document | Purpose |
|---|---|---|
| 00 | [00_index.md](00_index.md) | This file |
| 01 | [01_roadmap.md](01_roadmap.md) | MVP → Phase 2 → Phase 3 sequencing and rationale |
| 02 | [02_mvp_scope.md](02_mvp_scope.md) | What is and is not in the MVP |
| 03 | [03_use_case_priority.md](03_use_case_priority.md) | Priority assigned to each use case from `design/03_use_cases.md` |
| 04 | [04_feature_priority.md](04_feature_priority.md) | Priority assigned to question types and cross-cutting features |

## Why design and plan are separated

Roadmaps and MVP scopes change as work progresses; the system's identity (what it is, who it serves, how the components fit) is far more stable. Mixing the two leads to design docs that drift with sprint planning, and to roadmaps that get buried in architectural prose. Separating them at the filesystem level keeps each focused.

In practice: when a sentence starts with "for the MVP we will…" or "in Phase 2…" — it goes in this folder. When a sentence describes a permanent property of the system — it goes in `design/`.

## How to use this folder

- **Researcher or stakeholder.** Read [01_roadmap.md](01_roadmap.md) and [02_mvp_scope.md](02_mvp_scope.md). About 15 minutes.
- **Contributor picking up an implementation task.** Read the priority docs to know what is in scope now, then go to the relevant component spec in `design/`.
- **Reviewing a proposed change.** If the proposal alters phasing, it lives here. If it alters the system itself, it lives in `design/` (and any phasing impact is reflected here afterwards).
