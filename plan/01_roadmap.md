# 01 — Roadmap

This roadmap sequences the work needed to deliver the ecosystem described in [../design/](../design/00_index.md).

It is a sequencing document, not a calendar. Dates are intentionally absent until the team commits to them at MVP planning.

## Sequencing rationale

The schemas in `design/05_data_model.md` are the contract that all four components depend on. Nothing else can be built without them. The Library is the natural anchor for that contract: it is where canonical questionnaires live, it is what every viewer and the Editor read from, and it can be populated from existing content (the 792 questions in `survey_database/`). Once schemas are locked and a usable Library exists, the Web Viewer becomes the next bottleneck — it makes deployments possible. Editor and Participant Platform follow.

This sequence is captured below.

## MVP — Phase 1

**Outcome.** Canonical schemas are finalised, the Library is operational and seeded with real content, and a researcher can fetch a Library questionnaire as canonical JSON via the public API. There is no end-to-end response collection yet.

Detailed in [02_mvp_scope.md](02_mvp_scope.md).

**Gate to leave Phase 1.** All MVP-gating open decisions are resolved (full Resolution log in `design/10_open_decisions.md`; the schema-gating ones are OD-01 → S1 Pure custom; OD-05 → reference-with-safe-overrides; OD-06 → hard-pin all references; OD-12 → five-concept pagination model). The four open data-model questions (validation, logic, versioning, scoring — see `design/05_data_model.md`) have concrete syntax in the published schemas. The Library exposes a working public read API. At least one researcher (the owner) can search, view, and download a questionnaire definition.

## Phase 2 — Web Viewer + Deployments

**Outcome.** A questionnaire from the Library can be deployed for anonymous online use; participants complete it; responses and xAPI events flow into Behaverse; the researcher can export the data.

**Key deliverables.**

- Web Viewer rendering canonical JSON (per OD-01, resolved 2026-05-23 → S1 Pure custom — custom React + TypeScript renderer, no SurveyJS dependency).
- Viewer Service brokering deployments, sessions, and Behaverse submission (per OD-13 — queued forwarding with end-to-end delivery verification).
- Session resume semantics (already resolved as OD-14 on 2026-05-21) implemented in the Web Viewer.
- Reference expression evaluator (WASM module, already resolved as OD-11 on 2026-05-21) embedded in the Web Viewer for logic / validation / scoring.
- Anonymous-link deployment mode (UC-04).
- Demo mode (UC-08).
- Researcher response export (UC-11).
- Researcher monitoring dashboard, minimal version (UC-12).

**Gate to leave Phase 2.** End-to-end pipeline works: Library → deployment → Web Viewer → Viewer Service → Behaverse (`forwarded` state confirmed) → export. UC-04, UC-08, UC-11 satisfied.

## Phase 3 — Editor

**Outcome.** Researchers can author questionnaires (and reusable components) without writing JSON by hand, submit them to the Library, and round-trip them through the Library/Viewer pipeline.

**Key deliverables.**

- Editor visual structure builder.
- Reusable-component pick-from-Library workflow (per OD-05, already resolved — reference-with-safe-overrides).
- Logic, validation, scoring builders (using the OD-11 WASM evaluator for live evaluation).
- Preview matching Web Viewer (per OD-03, already resolved — shared renderer library).
- Version control.
- Submission to Library (per the contribution workflow in `design/06_library.md`).
- Translation interface (UC-03).

**Gate to leave Phase 3.** A researcher authors a new questionnaire end-to-end without external tooling; the new questionnaire reaches the Library, is reviewed, and is used in a Phase-2 deployment.

## Phase 4 — Native Viewer + Offline + Embedded

**Outcome.** Offline data collection (UC-06) and embedding in games/VR (UC-07) work.

**Key deliverables.**

- Native Viewer feature parity with Web Viewer for supported question types.
- Local persistence and sync queue.
- Kiosk mode.
- Godot plugin packaging for host integration.
- PDF export (produced by the Library or the Editor; not a viewer in the data-collection sense — see `design/02_terminology.md`).

**Gate to leave Phase 4.** UC-06 and UC-07 satisfied; the cross-viewer contract is verified by a parity test suite.

## Phase 5 — Participant Platform

**Outcome.** Longitudinal studies with scheduled assessments, reminders, and participant dashboards are operational.

**Key deliverables.**

- Participant accounts and authentication (per OD-08, already resolved — federates against the Identity sibling project).
- Study and protocol builder.
- Assignment scheduler (per OD-09, already resolved — DB-driven via Postgres `scheduled_assignments` table polled by one-of-N workers).
- Notifications (email by default; SMS deferred unless promoted).
- Participant dashboard.
- Researcher compliance dashboard.
- Consent management with versioning.

**Gate to leave Phase 5.** UC-05, UC-09 satisfied; a longitudinal study runs end-to-end on the Platform.

## Phase 6 — Advanced behavioural capture and integrations

**Outcome.** Optional advanced data channels are available; external-system integrations (REDCap, Qualtrics, others) work.

**Key deliverables.**

- Mouse and keyboard channels (per OD-07, already resolved — opt-in per deployment; response time was already on by default and shipped in Phase 2).
- Webcam and microphone channels (with explicit per-session participant consent).
- Branding and theming editor — UC-13's editor surface (logo upload, colour customisation, custom CSS, accessibility-conformance checks, theme versioning). Note: the theme *infrastructure* (deployment `theme_id`, built-in default + institutional templates) shipped in Phase 2 — see [03_use_case_priority.md](03_use_case_priority.md) UC-13 row for the 2026-05-23 phasing split.
- External integrations and SDKs (UC-14).
- Library submission workflow refinements (UC-10).

**Gate to leave Phase 6.** UC-10, UC-13, UC-14 satisfied; the advanced channels emit data compatible with the data model in `design/05_data_model.md`.

## Cross-cutting tasks running through every phase

- **Open-decision resolution.** Decisions in `design/10_open_decisions.md` are resolved as their gating phase approaches. When resolved, the decision moves out of OD into the relevant design doc and a row is added to the resolution log.
- **Documentation.** Every component's first release is accompanied by user docs in addition to the design docs.
- **Migration of existing content.** The 792 questions in `survey_database/` are imported into the Library during or just after Phase 1. The exact import strategy is its own task.
- **Tech-stack decisions** were resolved as OD-04 on 2026-05-15: Python + FastAPI for all four project backends; PostgreSQL as the default storage engine (SQLite permitted for single-machine self-hosted deployments). Per-component variation requires an explicit OD-change.

## What is intentionally not in this roadmap

- **Dates.** This is a sequencing roadmap, not a schedule.
- **Resource allocation.** Who works on what is a team-level decision.
- **Stretch features** beyond the design's defined scope (advanced statistical analysis, payment processing, medical device integration, real-time biometric collection — all listed as out-of-scope in `design/01_vision.md`).
