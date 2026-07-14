# Questionnaire Apps Ecosystem — Plan

This folder records **how and when** the Questionnaire Apps Ecosystem gets built. It is intentionally separate from [../design/](../design/00_index.md), which records *what the system is*.

If something here contradicts the design folder, the design folder wins. Plan documents reference the design; they never restate it.

**Last revised.** 2026-07-11 — Phases 1 and 2 are complete and **deployed live** (Library, Identity, Viewer Service, player, portal, editor on Vercel + Supabase); the full participant experience and the owner QA/research (replay) track are done. Phase 3 (Editor) is built but its gate is not fully met; Phases 4–6 remain. All open decisions (OD-01…OD-21) resolved. A whole-repo review (2026-07-10) produced [05_completion_plan.md](05_completion_plan.md); **its Phase 0 (critical security) and Phase 1 (production hardening) are DONE + LIVE (2026-07-11)** — see that doc's status tracker. Full status in [../HANDOFF.md](../HANDOFF.md).

## Contents

| # | Document | Purpose |
|---|---|---|
| 00 | [00_index.md](00_index.md) | This file |
| 01 | [01_roadmap.md](01_roadmap.md) | MVP → Phase 2 → Phase 3 sequencing and rationale |
| 02 | [02_mvp_scope.md](02_mvp_scope.md) | What is and is not in the MVP |
| 03 | [03_use_case_priority.md](03_use_case_priority.md) | Priority assigned to each use case from `design/03_use_cases.md` |
| 04 | [04_feature_priority.md](04_feature_priority.md) | Priority assigned to question types and cross-cutting features |
| 05 | [05_completion_plan.md](05_completion_plan.md) | Completion + production-hardening plan for the built web platform (from the 2026-07-10 review) |

## Status as of 2026-07-06

**Done:**

- **Design phase complete.** All 20 originally-tracked open decisions resolved (full log in [../design/10_open_decisions.md](../design/10_open_decisions.md)). The six BDM-deviation entries (D1–D6) in [../design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md) were drafted and **filed as issues upstream** in `behaverse/data-model`.
- **All 8 data-model schemas authored, validated, and tagged** with examples, JSON-LD context, tests, and CHANGELOG/README:
  - Schema 1 Instrument Metadata (`instrument-v26.0609`; `authors` → `author`; + `instrument_id`/`variant`, OD-21)
  - Schema 2 Questionnaire Definition (`v26.0618`; OD-15 entity model + OD-16 scoring)
  - Schema 3 Questionnaire Runtime (`runtime-v26.0603`; OD-18)
  - Schema 4a Event Data (`events-v26.0605`; OD-19 — bdm: events vocabulary)
  - Schema 4b Behavioural Channels — Mouse + Keyboard (`recordings-v26.0605`; OD-20)
  - Schema 5 Response Data (`response-v26.0603`; OD-17 — strict BDM Response table)
  - Schema 6 Session Metadata (`session-v26.0603`; OD-17 — carries `scorer_outputs`)
  - Schema 7 Viewer Conformance Manifest (`viewer_conformance-v26.0603`; OD-18 sibling of Schema 3)
- **Validator** (`tools/validate_schemas.py`) covers all schemas with 9 cross-checks; 308 tests pass; 43 examples validate.
- **Phase 1 — Library, live.** Library Core public read API + `survey_database` importer + the Library web UI, deployed at https://questionnaire-library.vercel.app (222 questionnaires); Identity-gated community signals built.
- **Phase 2 — Viewer + deployments, live.** The runtime denormaliser, the full Viewer Service (VS-A..E), the Web Viewer player (WV-A..F), the WASM expression evaluator + scorer conformance runner, and the whole participant experience (portal + player + Identity + SSO handoff) are built, merged, and deployed on Vercel + Supabase — the end-to-end pipeline runs live. The owner **QA / research-tooling** track (per-question comments, score-progression, xAPI export, respondent-bot, and the **replay** feature — record/replay, researcher `/studies`, revocation, live-follow) is complete.

**Remaining:**

- **Phase 3 (Editor)** — built (ED-A..K) + deployed, but the gate ("reaches the Library, reviewed, used in a deployment") needs Identity write-back (OD-08) + a real Viewer-Service preview deployment — both blocked.
- **Phase 4 (Native / Godot viewer)** — not started (sequenced LAST).
- **Phase 5 (Participant Platform — studies / scheduling)** — not started.
- **Phase 6 (advanced capture + integrations)** — EEG / webcam / microphone schemas (deferred from OD-20); external integrations.

See [../HANDOFF.md](../HANDOFF.md) and [01_roadmap.md](01_roadmap.md) for the full tactical status.

## Why design and plan are separated

Roadmaps and MVP scopes change as work progresses; the system's identity (what it is, who it serves, how the components fit) is far more stable. Mixing the two leads to design docs that drift with sprint planning, and to roadmaps that get buried in architectural prose. Separating them at the filesystem level keeps each focused.

In practice: when a sentence starts with "for the MVP we will…" or "in Phase 2…" — it goes in this folder. When a sentence describes a permanent property of the system — it goes in `design/`.

## How to use this folder

- **Researcher or stakeholder.** Read [01_roadmap.md](01_roadmap.md) and [02_mvp_scope.md](02_mvp_scope.md). About 15 minutes.
- **Contributor picking up an implementation task.** Read the Status section above, then [../HANDOFF.md](../HANDOFF.md) for the prioritized tactical work list. Then the relevant component spec in `design/`.
- **Reviewing a proposed change.** If the proposal alters phasing, it lives here. If it alters the system itself, it lives in `design/` (and any phasing impact is reflected here afterwards).
