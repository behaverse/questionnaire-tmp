# Questionnaire Apps Ecosystem — Design

This folder is the **single authoritative source** for what the Questionnaire Apps Ecosystem is. Every other doc, code repo, or piece of communication should match what is here. If something is inconsistent with the design folder, the design folder is right.

**Companion folder.** Roadmap, MVP scope, and phasing live in [../plan/](../plan/00_index.md). Design describes *what the system is*; plan describes *how and when it gets built*. The two folders are deliberately separate.

**Last revised.** 2026-06-05 (**OD-20 resolved** — Schema 4b shape: family-per-source architecture, mouse + keyboard for MVP, minimal sample schemas, manifest in event extensions only, `.jsonl.gz` default; **OD-19 resolved** — BDM Events vocabulary for Schema 4a: own `bdm:` namespace, 24 verbs across 6 layers, 15 object types, 5 actor types, ~50 extension keys covering questionnaires + cognitive tasks + video games. Three BDM upstream-change deviations logged in [05c_bdm_alignment.md](05c_bdm_alignment.md) for handoff. Body in [05e_events_vocabulary.md](05e_events_vocabulary.md), Resolution-log row in [10_open_decisions.md](10_open_decisions.md)). All open decisions (OD-01…OD-21) are resolved (OD-21 resolved 2026-06-09; OD-19 resolved 2026-06-05; OD-18 resolved 2026-06-03; OD-17 resolved 2026-06-03; OD-16 resolved 2026-06-02; OD-15 resolved 2026-05-31; OD-01, OD-12, OD-13 resolved 2026-05-23; OD-05/06/07/09/10/11/14 resolved 2026-05-21; OD-03/04/08 resolved 2026-05-15). Versioning aligned with the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning) — Calendar Versioning (`vYY.MMDD`) replaces SemVer across schemas, questionnaires, and reusable entities.

## Reading order

| # | Document | Purpose | Status |
|---|---|---|---|
| 01 | [01_vision.md](01_vision.md) | What the project is, who it's for, success criteria | Draft |
| 02 | [02_terminology.md](02_terminology.md) | Consistent naming and definitions | Draft |
| 03 | [03_use_cases.md](03_use_cases.md) | The scenarios the system must support, with requirements | Draft |
| 04 | [04_architecture.md](04_architecture.md) | Components, responsibilities, data flows, sibling services | Draft |
| 05 | [05_data_model.md](05_data_model.md) | Canonical schemas (definition, metadata, response, event, session) | Draft |
| 05a | [05a_reusable_entities.md](05a_reusable_entities.md) | OD-15 (resolved 2026-05-31) — Schema 2 reusable-entity model: 11 entities in two categories; Item / Question / Option / Solution / etc.; `content` language map; widget derivation from Option | Live |
| 05b | [05b_scoring.md](05b_scoring.md) | OD-16 (resolved 2026-06-02) — Schema 2 scoring runtime semantics: external `Scorer` Library entity, structured output + JSON Pointer paths, reversed-value pipeline, two-trigger evaluation, per-item correctness | Live |
| 05c | [05c_bdm_alignment.md](05c_bdm_alignment.md) | OD-17 (resolved 2026-06-03) — BDM alignment & proposed upstream changes: per-deviation log (stimulus_id typing; session-level scorer outputs; session_id naming) with copy-pasteable BDM change proposals | Live |
| 05d | [05d_runtime.md](05d_runtime.md) | OD-18 (resolved 2026-06-03) — Schema 3 (Questionnaire Runtime) model: server-side Viewer Service production via shared Python denormaliser; single-locale + kiosk multi-locale opt-in; new Schema 7 Conformance Manifest; Scorer impl pinning; selective scoring stripping; Postgres-backed cache | Live |
| 05e | [05e_events_vocabulary.md](05e_events_vocabulary.md) | OD-19 (resolved 2026-06-05) — BDM Events vocabulary: own `bdm:` namespace, 24 verbs across 6 layers, 15 object types, 5 actor types, ~50 extension keys; covers questionnaires + cognitive tasks + video games; designed for BDM upstream extension | Live |
| 06 | [06_library.md](06_library.md) | Library component — catalogue, reusable components, peer review | Draft |
| 07 | [07_editor.md](07_editor.md) | Editor component — authoring, translations, logic, version control | Draft |
| 08 | [08_viewer.md](08_viewer.md) | Viewer family — Web, Native (Godot) | Draft |
| 08a | [08a_viewer_service.md](08a_viewer_service.md) | Viewer Service — deployments, sessions, submission brokering | Draft |
| 09 | [09_platform.md](09_platform.md) | Participant Platform — accounts, studies, scheduling, dashboards | Draft |
| 10 | [10_open_decisions.md](10_open_decisions.md) | Decisions intentionally deferred, with options and trade-offs | Live |
| 11 | [11_content_licensing.md](11_content_licensing.md) | Licensing posture for Library content; question-vs-questionnaire model | Draft |
| 12 | [12_governance.md](12_governance.md) | Operating organisation, sibling projects, cross-project contracts | Draft |
| 13 | [13_importers.md](13_importers.md) | Migration assistance from foreign formats; provenance | Draft |
| 14 | [14_repository_topology.md](14_repository_topology.md) | Repository topology — `behaverse` org, multi-repo split, names, folder migration | Locked |
| 15 | [15_expression_language.md](15_expression_language.md) | OD-11 — normative `Expression` grammar: value lattice, precedence, function set, determinism (code-point order, `/0`→Null, no dates/RNG), sentinel-Null error model + null-is-false truthiness, `score(id)` lookup, `reversed_value` + `compare_solution`; single WASM binary as the cross-viewer contract | Live |

## What lives here vs. in plan/

| design/ — what the system *is* | plan/ — how it *gets built* |
|---|---|
| The 14 use cases (UC-01 .. UC-14) | Which use cases are MVP vs. Phase 2 vs. Phase 3 |
| The data model and all schemas | The order in which schemas get authored |
| The four components and their contracts | Which component is built first |
| Open design decisions and trade-offs | Milestones, dates, sequencing |
| Architectural principles | Operational decisions (when to lock tech, when to seed content) |

If you find yourself wanting to add a "Phase 2" tag inside a design doc — it belongs in [../plan/04_feature_priority.md](../plan/04_feature_priority.md), not here.

## Reading guides

- **Stakeholders / funders.** Read 01 → 03 → 04. About 25 minutes.
- **Researchers evaluating fit.** Read 01 → 03 → 06 → 09. About 40 minutes.
- **Developers picking up a component.** Read 02 → 04 → 05 → the component-specific doc (06–09, 08a) → 10.
- **Anyone resolving an open question.** Start at 10 (the open-decisions log), then back up to the docs that reference it.
- **Anyone evaluating legal / operational fit.** Read 11 (content licensing), 12 (governance), and 14 (repository topology).

## Document conventions

- **Identifiers** follow the patterns in [02_terminology.md](02_terminology.md): `qst_`, `q_`, `os_`, `ins_`, `pr_`, `scl_`, `page_`, `dep_`.
- **Open decisions** are numbered `OD-NN` and live in [10_open_decisions.md](10_open_decisions.md). Other docs reference them, not re-decide them.
- **External standards** (xAPI, JSON Schema, ISO 639-1, …) are adopted; we never redefine them.
- **Tech-stack choices** that would constrain implementation are deliberately absent from design docs. They live in [10_open_decisions.md](10_open_decisions.md) until resolved.

## Archived material

Earlier scattered specs and prototype design notes (`SPECIFICATION_READONLY.md`, `SYSTEM_DESIGN.md`, `system_design.md`, `data_standards.md`, the old `specs/` and `schemas/` folders) have been moved to [../archive_do_not_edit/](../archive_do_not_edit/). They are kept for historical reference. **Do not edit them; do not cite them as authoritative.** This folder supersedes them in full.

The three prototype codebases (`qv_godot/`, `survey_database/`, `survey_system/`) remain in place under the project root. They are **reference-only** for the design phase; the design is written from clean principles, not from inherited code constraints. Migration of existing content (notably the 793 questions in `survey_database/`) is a future task.
