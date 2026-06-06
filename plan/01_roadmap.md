# 01 — Roadmap

This roadmap sequences the work needed to deliver the ecosystem described in [../design/](../design/00_index.md).

It is a sequencing document, not a calendar. Dates are intentionally absent until the team commits to them at MVP planning.

**Last revised.** 2026-06-06.

## Sequencing rationale

The schemas in `design/05_data_model.md` are the contract that all four components depend on. Nothing else can be built without them. The Library is the natural anchor for that contract: it is where canonical questionnaires live, it is what every viewer and the Editor read from, and it can be populated from existing content (the 793 Prompts / 64 questionnaires in `survey_database/`). Once schemas are locked and a usable Library exists, the Web Viewer becomes the next bottleneck — it makes deployments possible. Editor and Participant Platform follow.

This sequence is captured below.

## MVP — Phase 1

**Outcome.** Canonical schemas are finalised, the Library is operational and seeded with real content, and a researcher can fetch a Library questionnaire as canonical JSON via the public API. There is no end-to-end response collection yet.

Detailed in [02_mvp_scope.md](02_mvp_scope.md).

### Status as of 2026-06-06

**Schema-authoring portion: complete.** All 8 data-model schemas authored, tagged, validated:

| Schema | Tag | OD |
|---|---|---|
| 1 Instrument Metadata | `instrument-v26.0605` | (renamed `authors` → `author` 2026-06-05) |
| 2 Questionnaire Definition | `v26.0602` | OD-15, OD-16 |
| 3 Questionnaire Runtime | `runtime-v26.0603` | OD-18 |
| 4a Event Data | `events-v26.0605` | OD-19 |
| 4b Behavioural Channels — Mouse + Keyboard | `recordings-v26.0605` | OD-20 (EEG / webcam / microphone deferred) |
| 5 Response Data | `response-v26.0603` | OD-17 |
| 6 Session Metadata | `session-v26.0603` | OD-17 |
| 7 Viewer Conformance Manifest | `viewer_conformance-v26.0603` | OD-18 |

All 20 originally-tracked open decisions resolved (Resolution log in [../design/10_open_decisions.md](../design/10_open_decisions.md)). The six BDM-deviation entries D1–D6 in [../design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md) have been drafted and **filed as issues upstream** in `behaverse/data-model`.

**Library-implementation portion: Library Core + legacy importer built ✅** (merged to `master`, under `library/`). The Library Core exposes the public read API (catalogue list/detail/versions/definition, reusable entities, dependency-graph `dependents`, full-text search, facets) over Git-ingested canonical JSON, with storage Approach C (`jsonb` + derived index). The importer converts the full `survey_database/` catalogue into canonical Schema 2 JSON + provenance + loss report; its smoke test validates every artifact against the schemas and ingests all 64 questionnaires into Postgres with zero errors. 86 library + 308 schema tests pass. **Still pending:** contribution/review workflow + DOI (needs auth/Identity, OD-08), community signals (Identity), the Library web UI (sub-project 5), and deployment + persistent content seeding + public schema hosting.

**Gate to leave Phase 1.** Schemas authored ✅ (public hosting at `behaverse.org/schemas/` pending). Library public read API works ✅ (built + tested; a deployed instance is an ops step). A researcher can search/view/download a definition ✅ at the API level — the web-UI surface (sub-project 5) is not built. Net: the buildable Phase-1 capabilities are in; a *shipped* MVP additionally needs deployment + the web UI + public schema hosting.

## Phase 2 — Web Viewer + Deployments

**Outcome.** A questionnaire from the Library can be deployed for anonymous online use; participants complete it; responses and xAPI events flow into Behaverse; the researcher can export the data.

**Key deliverables.**

- **`questionnaire-runtime-denormaliser` Python library** (per OD-18; renamed from `behaverse-runtime-denormaliser` per [../design/14_repository_topology.md](../design/14_repository_topology.md)). Shared by Viewer Service and Editor preview to produce Schema 3 runtimes from Schema 2 sources.
- **Viewer Service / Orchestrator core**: Postgres-backed `runtime_cache` table with 5-tuple cache key (per OD-18f); admin purge API; viewer-registry table storing Schema 7 manifests; `/sessions/new` endpoint that mints Schema 3 runtimes; OD-13 queued-forwarding outbox with TLS+SHA-256 hop signing and pluggable Behaverse sink.
- **Web Viewer** rendering Schema 3 runtimes (per OD-01, resolved 2026-05-23 → S1 Pure custom — custom React + TypeScript renderer, no SurveyJS dependency). Publishes a Schema 7 conformance manifest.
- **Session resume semantics** (OD-14) implemented in the Web Viewer.
- **WASM expression evaluator** with `score(id)` host function (per OD-11 + OD-16 §3 architecture). Evaluates `LogicRule.condition` expressions; invokes Scorers for branching-required scores. Embedded by Web Viewer, Native Viewer, Editor.
- **Scorer conformance runner** turning the existing `check_scorer_conformance` SKIP stub into a real test runner (per OD-16).
- **CSV serializer** for Schema 5 → BDM-compliant CSV (per OD-17).
- **Anonymous-link deployment mode** (UC-04).
- **Demo mode** (UC-08).
- **Researcher response export** (UC-11).
- **Researcher monitoring dashboard, minimal version** (UC-12).

**Gate to leave Phase 2.** End-to-end pipeline works: Library → deployment → Web Viewer (rendering Schema 3) → emitted bdm: events (Schema 4a) + responses (Schema 5) + session metadata (Schema 6) → Viewer Service → Behaverse (`forwarded` state confirmed) → export. UC-04, UC-08, UC-11 satisfied.

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

- **EEG / webcam / microphone schemas** under `schemas/recordings/` (deferred from OD-20 v26.0605, which shipped only mouse + keyboard).
- Mouse and keyboard channels in the viewers (per OD-07, already resolved — opt-in per deployment; response time was already on by default and shipped in Phase 2). The *schemas* for mouse and keyboard already shipped in Phase 1 (`recordings-v26.0605`).
- Webcam and microphone channels (with explicit per-session participant consent).
- Branding and theming editor — UC-13's editor surface (logo upload, colour customisation, custom CSS, accessibility-conformance checks, theme versioning). Note: the theme *infrastructure* (deployment `theme_id`, built-in default + institutional templates) shipped in Phase 2 — see [03_use_case_priority.md](03_use_case_priority.md) UC-13 row for the 2026-05-23 phasing split.
- External integrations and SDKs (UC-14).
- Library submission workflow refinements (UC-10).

**Gate to leave Phase 6.** UC-10, UC-13, UC-14 satisfied; the advanced channels emit data compatible with the data model in `design/05_data_model.md`.

## Cross-cutting tasks running through every phase

- **Open-decision resolution.** All 20 originally-tracked design decisions are resolved (Resolution log in `design/10_open_decisions.md`). New ODs are opened as implementation surfaces new questions; they follow the same resolve-then-document pattern.
- **BDM upstream change handoff.** ✅ Done — the six deviations (D1–D6) in [../design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md) were drafted and filed as issues upstream in `behaverse/data-model`. The deviation log in 05c stays until BDM merges each change.
- **Documentation.** Every component's first release is accompanied by user docs in addition to the design docs.
- **Migration of existing content.** ✅ The importer (`library/src/library/importers/survey_db/`) converts the 793 Prompts / 64 questionnaires / 30 Contexts / 22 Instructions / 100 Messages / 35 Solutions in `survey_database/` into canonical Schema 2 JSON (+ provenance + loss report), proven end-to-end (validates + ingests in test). Persistent seeding into a deployed Library instance is pending. Per [../design/13_importers.md](../design/13_importers.md).
- **Tech-stack decisions** were resolved as OD-04 on 2026-05-15: Python + FastAPI for all four project backends; PostgreSQL as the default storage engine (SQLite permitted for single-machine self-hosted deployments). Per-component variation requires an explicit OD-change.

## What is intentionally not in this roadmap

- **Dates.** This is a sequencing roadmap, not a schedule.
- **Resource allocation.** Who works on what is a team-level decision.
- **Stretch features** beyond the design's defined scope (advanced statistical analysis, payment processing, medical device integration, real-time biometric collection — all listed as out-of-scope in `design/01_vision.md`).
