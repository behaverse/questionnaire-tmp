# 03 — Use-Case Priority

Each use case from [../design/03_use_cases.md](../design/03_use_cases.md) is assigned a phase here. The use case itself (actor, flow, requirements, success criteria) lives in `design/` and does not carry phase information.

| Use case | Title | Phase | Rationale |
|---|---|---|---|
| UC-01 | Browse Validated Questionnaires | **MVP** | This is essentially what the Library *does*. MVP without UC-01 is not an MVP. |
| UC-02 | Create or Adapt a Questionnaire | **Phase 3** | Authoring lives in the Editor, which is Phase 3. Before Phase 3, content arrives via the GitHub contribution workflow with hand-written JSON. |
| UC-03 | Manage Translations | **Phase 3** | Translation UI is an Editor feature. The Library does carry translated content from MVP; it just isn't editable in the UI yet. |
| UC-04 | Anonymous Online Study | **Phase 2** | Requires a Viewer. First feasible after Phase 2 ships the Web Viewer. |
| UC-05 | Longitudinal Study with Scheduling | **Phase 5** | Requires the Participant Platform. |
| UC-06 | Offline Data Collection | **Phase 4** | Requires the Native Viewer. |
| UC-07 | Embedded Questionnaire in Game / VR | **Phase 4** | Requires the Native Viewer plugin packaging. |
| UC-08 | Demo Mode | **Phase 2** | Trivial to add alongside the Web Viewer; useful for outreach during Phase 2. |
| UC-09 | Participant Data Dashboard | **Phase 5** | Requires the Participant Platform. |
| UC-10 | Submit Questionnaire to Library | **Phase 6** | The GitHub contribution workflow handles submissions in earlier phases. A polished researcher-facing submission UI is a Phase-6 refinement. |
| UC-11 | Export Data for Analysis | **Phase 2** | Becomes meaningful as soon as responses are collected (Phase 2). |
| UC-12 | Monitor Data Collection | **Phase 2** (minimal) → **Phase 5** (full) | A minimal real-time dashboard ships alongside the Viewer Service in Phase 2; richer compliance/quality features grow through Phase 5. |
| UC-13 | Customise Branding and Theming | **Phase 2 (infra) → Phase 6 (editor)** | Split per 2026-05-23 grilling: Phase 2 ships theme infrastructure (deployments carry `theme_id`; Viewer respects it; a small built-in set of themes). Phase 6 ships the theme *editor* (logo upload, colour customisation, custom CSS, accessibility-conformance checks, theme versioning). |
| UC-14 | Integrate with External Systems | **Phase 6** | SDKs and webhooks are valuable once the platform is mature. |

## Cross-cutting requirements (PERF/SEC/PRIV/ACC/REL/USE)

The cross-cutting requirements in `design/03_use_cases.md` apply across phases. They are not deferred to a phase — they are baseline expectations from the first deliverable. Specifically:

- **Security and privacy.** Apply from MVP. The Library handles authenticated writes and identifying participant data (citations, contributor accounts), so SEC-01..05 and PRIV-01..06 ship with MVP.
- **Accessibility.** Applies from any user-facing surface, starting with the MVP Library web interface.
- **Reliability.** Applies from MVP for the public Library API and catalogue.
- **Performance.** PERF-04 (search ≤ 500 ms) applies from MVP. PERF-01..03 apply from Phase 2 (when viewers exist).
- **Usability.** Applies wherever a user-facing surface exists; mobile-responsive Library catalogue ships with MVP.
