# 03 — Use Cases and Requirements

This document defines the scenarios the ecosystem must support. Each use case has functional requirements and success criteria.

Phasing and priority for these use cases are handled separately in [plan/03_use_case_priority.md](../plan/03_use_case_priority.md).

---

## UC-01 — Browse Validated Questionnaires

**Actor**: Researcher
**Goal**: Find a validated questionnaire suitable for a study.

### Main flow

1. Researcher opens the Questionnaire Library.
2. Searches by keyword, domain, target population, language, or psychometric properties.
3. Views details: items, validation studies, citations, psychometric metadata.
4. Reads community comments and ratings.
5. Downloads the questionnaire definition (canonical JSON).

### Requirements

- **REQ-01.1** Search across keyword, domain, population, language, item count.
- **REQ-01.2** Display psychometric metadata (reliability, validity, norms).
- **REQ-01.3** Show citation, DOI, and authoritative publication info.
- **REQ-01.4** Display usage statistics (deployments, completion time, completion rate).
- **REQ-01.5** Community ratings and comments.
- **REQ-01.6** Export questionnaire definition (canonical JSON).

### Success criteria

- Researcher locates a suitable instrument within 5 minutes.
- Download contains complete metadata, all language versions, and the canonical definition.

---

## UC-02 — Create or Adapt a Questionnaire

**Actor**: Researcher
**Goal**: Author a new questionnaire or adapt an existing one.

### Main flow

1. Open the Editor; create new or import existing.
2. Add or pick questions from the Library's reusable pool.
3. Configure option-sets and validation rules.
4. Configure logic (skip, branching, piping).
5. Add instructions and media elements.
6. Preview in viewer mode.
7. Export canonical JSON, or submit to the Library for review.

### Requirements

- **REQ-02.1** Visual editor with drag-and-drop ordering.
- **REQ-02.2** Support every question type listed in [02_terminology.md](02_terminology.md).
- **REQ-02.3** Real-time preview matching the production viewer.
- **REQ-02.4** Version control with diff visualisation.
- **REQ-02.5** Validation-rule editor (required, format, range, length, cross-question).
- **REQ-02.6** Logic builder for skip, branching, and piping.
- **REQ-02.7** Media upload (image, audio, video).
- **REQ-02.8** Reuse from Library: pick existing questions, option-sets, instructions.
- **REQ-02.9** Export canonical JSON.
- **REQ-02.10** Import from canonical JSON and SurveyJS JSON; CSV import for simple cases. Imports for other formats (Qualtrics QSF, LimeSurvey, REDCap) are migration-assistance tooling tracked separately (see [13_importers.md](13_importers.md)) and are not gated by this use case. Imports follow the gate-on-acknowledgement rule from [13_importers.md](13_importers.md).

### Success criteria

- 10-item questionnaire authored in under 30 minutes.
- Complex logic configurable without code.
- Preview matches viewer output exactly.

---

## UC-03 — Manage Translations

**Actor**: Researcher or Translator
**Goal**: Create and maintain multi-language versions of a questionnaire.

### Main flow

1. Open existing questionnaire in Editor.
2. Add a new language version.
3. Translate text elements (questions, options, instructions, prompts).
4. Translation memory suggests matches from prior translations.
5. Review side-by-side with source language.
6. Mark translation as draft / complete / validated.
7. Export multi-language definition.

### Requirements

- **REQ-03.1** Support at least the seven languages already present in `survey_database/` (EN, FR, DE, LU, PT, ES, IT) and any ISO 639-1 code.
- **REQ-03.2** Side-by-side translation interface.
- **REQ-03.3** Translation memory across the Library.
- **REQ-03.4** Status tracking (draft, complete, validated) per text element.
- **REQ-03.5** Single export contains all language versions.
- **REQ-03.6** Viewer selects language by participant locale or explicit preference.

### Success criteria

- 50-item questionnaire translated in under 3 hours with translation-memory assistance.
- Language switching in the viewer is instantaneous.

---

## UC-04 — Anonymous Online Study

**Actor**: Researcher and anonymous participants
**Goal**: Collect data from anonymous participants via a web link.

### Main flow

1. Researcher creates a deployment with anonymous access settings.
2. Shares the deployment URL.
3. Participants click the link and complete the questionnaire.
4. Data collected with pseudonymous session identifiers.
5. Researcher downloads response data and event logs.

### Requirements

- **REQ-04.1** Generate unique shareable URLs.
- **REQ-04.2** Optional access-code protection.
- **REQ-04.3** Optional response quotas (max N total, max N per condition).
- **REQ-04.4** Optional date-range restrictions (active from / active until).
- **REQ-04.5** Pseudonymous session IDs only; no identifying info collected by default.
- **REQ-04.6** Export responses as CSV (wide/long), JSON, SPSS, R.
- **REQ-04.7** Export xAPI event logs as JSON Lines.
- **REQ-04.8** Real-time response monitoring dashboard.
- **REQ-04.9** Optional completion confirmation email to participant.

### Success criteria

- Deployment link generated in under one minute.
- A single anonymous-link deployment supports at least 1 000 concurrent participants on the default PostgreSQL single-server stack on commodity hardware (8 vCPU, 16 GB RAM). For SQLite single-host deployments the realistic target is 100 concurrent participants; for PostgreSQL multi-instance deployments capacity scales horizontally. See the deployment-tier table in [04_architecture.md](04_architecture.md) §"Deployment shape".
- Export of 10 000 responses completes within five seconds.

---

## UC-05 — Longitudinal Study with Scheduling

**Actor**: Researcher and registered participants
**Goal**: Run a repeated-measures study with scheduled assessments.

### Main flow

1. Researcher creates a study protocol on the Participant Platform.
2. Defines an assessment schedule (e.g. baseline, weekly for eight weeks, follow-up).
3. Assigns participants to groups (with optional randomisation).
4. Platform notifies participants when assessments are due.
5. Participants log in and complete assignments.
6. Platform tracks completion and sends reminders.
7. Researcher monitors compliance and exports longitudinal data.

### Requirements

- **REQ-05.1** Participant account creation and authentication.
- **REQ-05.2** Study-protocol builder with scheduling rules and completion windows.
- **REQ-05.3** Automated email and SMS notifications.
- **REQ-05.4** Participant dashboard with assigned and completed questionnaires.
- **REQ-05.5** Configurable reminder cadence.
- **REQ-05.6** Compliance tracking and reporting.
- **REQ-05.7** Export longitudinal data with participant IDs and timepoints.
- **REQ-05.8** Support randomised group assignment.
- **REQ-05.9** Participant withdrawal management (record withdrawal date, preserve prior data per consent).

### Success criteria

- Study with 100 participants set up in under one hour.
- 90 % on-time notification delivery.
- Real-time compliance visible in the researcher dashboard.

---

## UC-06 — Offline Data Collection

**Actor**: Researcher and participants in low-connectivity contexts
**Goal**: Collect data on devices without reliable internet.

### Main flow

1. Researcher downloads the Native Viewer for the target platform.
2. Loads a questionnaire definition into the app.
3. Configures offline-mode settings (kiosk, sync rules).
4. Deploys to data-collection devices.
5. Participants complete questionnaires offline.
6. Data stored locally.
7. When connectivity returns, the device syncs to Behaverse.

### Requirements

- **REQ-06.1** Native Viewer for Windows, macOS, Linux, iOS, Android.
- **REQ-06.2** Load questionnaires from local file or initial sync.
- **REQ-06.3** Local storage for responses and events.
- **REQ-06.4** Queue data for sync when connectivity returns.
- **REQ-06.5** Conflict resolution for in-flight definition edits.
- **REQ-06.6** Kiosk mode (lock to app, clear participant data between sessions).
- **REQ-06.7** Local export as backup file.
- **REQ-06.8** Visual sync-status indicator.

### Success criteria

- Native Viewer functions fully offline for extended periods.
- Sync of 100 responses completes within one minute.
- Zero data loss across sync failures.

---

## UC-07 — Embedded Questionnaire in Game or VR

**Actor**: Game developer and players
**Goal**: Integrate questionnaires into a game or VR environment.

### Main flow

1. Developer integrates the Native Viewer as a Godot plugin or library.
2. Loads a questionnaire definition at runtime.
3. Triggers the questionnaire at specific game events.
4. Player completes the questionnaire within the game UI.
5. Host receives a completion event and continues.
6. Response data is sent to Behaverse and optionally exposed to game code.

### Requirements

- **REQ-07.1** Native Viewer available as a Godot plugin.
- **REQ-07.2** Programmatic API: show, hide, configure, retrieve responses.
- **REQ-07.3** Theming to match host aesthetic.
- **REQ-07.4** Non-blocking integration; host application continues running.
- **REQ-07.5** Event hooks: `on_complete`, `on_abandon`, `on_question_answered`.
- **REQ-07.6** Response data accessible to host code (for adaptive mechanics).
- **REQ-07.7** Offline queue for response submission.

### Success criteria

- Integration completed by a competent Godot developer in under one hour.
- Questionnaire loads in under two seconds.
- Seamless visual integration with the host UI.

---

## UC-08 — Demo Mode

**Actor**: Researcher or trainer
**Goal**: Demonstrate a questionnaire without collecting real data.

### Main flow

1. Researcher creates a demo deployment.
2. Shares the demo link.
3. Users complete the questionnaire in demo mode.
4. Responses are not persisted.
5. Optional: preview of what real data would look like.

### Requirements

- **REQ-08.1** Demo flag on deployment configuration.
- **REQ-08.2** Visual indicator of demo mode (banner, watermark).
- **REQ-08.3** No data persistence for demo sessions.
- **REQ-08.4** Optional mock-data preview for training.
- **REQ-08.5** Demo links do not expire by default.

### Success criteria

- Demo mode is visually distinguishable from live.
- No demo data ever contaminates real datasets.
- The participant experience matches the live experience exactly (apart from the indicator).

---

## UC-09 — Participant Data Dashboard

**Actor**: Participant
**Goal**: View personal questionnaire history and results.

### Main flow

1. Participant logs in to the Participant Platform.
2. Views list of completed questionnaires.
3. Selects a questionnaire to view summary scores (if configured).
4. Sees longitudinal charts for repeated measures.
5. Downloads personal data export.
6. Optionally shares specific data with named researchers or clinicians.

### Requirements

- **REQ-09.1** Secure participant authentication.
- **REQ-09.2** Personal questionnaire history.
- **REQ-09.3** Display scores and subscales when configured.
- **REQ-09.4** Longitudinal charts for repeated measures.
- **REQ-09.5** Personal-data export (GDPR right of access).
- **REQ-09.6** Account and data deletion (GDPR right of erasure).
- **REQ-09.7** Granular data-sharing consent management.

### Success criteria

- All personal data reachable in three clicks or fewer.
- Personal-data export completes in under ten seconds.
- Visualisations are clear without statistical training.

---

## UC-10 — Submit Questionnaire to Library

**Actor**: Researcher (Contributor)
**Goal**: Contribute a validated questionnaire to the Library.

### Main flow

1. Researcher prepares a submission package (definition, validation studies, documentation).
2. Submits to the Library.
3. Reviewers evaluate.
4. Reviewers provide feedback or approve.
5. If approved, the questionnaire is published, assigned a DOI, and indexed.
6. Community can browse, comment, cite, and use.

### Requirements

- **REQ-10.1** Submission form with metadata fields.
- **REQ-10.2** Upload supporting documents (validation studies, manuals).
- **REQ-10.3** Peer-review workflow (GitHub-backed) with reviewer assignment.
- **REQ-10.4** Review-criteria checklist.
- **REQ-10.5** Feedback and revision mechanism.
- **REQ-10.6** DOI minting integration.
- **REQ-10.7** Publication notification.
- **REQ-10.8** Version management for updates to a published instrument.

### Success criteria

- Submission package preparable in under 30 minutes.
- First review assigned within seven days.
- Feedback to authors is structured and actionable.

---

## UC-11 — Export Data for Analysis

**Actor**: Researcher
**Goal**: Export collected data for statistical analysis.

### Main flow

1. Researcher selects a deployment or study to export.
2. Chooses format (CSV wide/long, JSON, SPSS `.sav`, R `.rds`).
3. Configures inclusion (raw responses, events, computed scores, metadata).
4. Downloads the export.
5. Loads it directly into the analysis tool of choice.

### Requirements

- **REQ-11.1** Export formats: CSV (wide and long), JSON, SPSS, R.
- **REQ-11.2** Optional inclusion of metadata (timestamps, session IDs, device info).
- **REQ-11.3** Optional inclusion of xAPI event data.
- **REQ-11.4** Computed scores and subscales in the export.
- **REQ-11.5** Codebook generation with variable labels.
- **REQ-11.6** Sensible handling of missing data (consistent missing codes).
- **REQ-11.7** Streaming export for datasets exceeding 100 000 responses.

### Success criteria

- Export of 10 000 responses completes within 30 seconds.
- Data loads into SPSS or R without further transformation.
- Codebook is accurate and complete.

---

## UC-12 — Monitor Data Collection

**Actor**: Researcher
**Goal**: Track data collection in real time.

### Main flow

1. Researcher opens the study dashboard.
2. Views response counts, completion rates, time-per-question.
3. Inspects condition/group distributions.
4. Identifies problematic questions (high abandonment, long time).
5. Checks data-quality indicators (straight-lining, speeders).
6. Configures alerts for quotas or anomalies.

### Requirements

- **REQ-12.1** Real-time dashboard with key metrics.
- **REQ-12.2** Response counts and rates over time.
- **REQ-12.3** Completion vs. abandonment rates.
- **REQ-12.4** Per-question analytics (time, abandonment).
- **REQ-12.5** Condition/group distribution.
- **REQ-12.6** Data-quality indicators (straight-lining, speeders).
- **REQ-12.7** Configurable alerts and notifications.
- **REQ-12.8** Exportable analytics reports.

### Success criteria

- Dashboard updates within five seconds of a new response.
- Problematic questions are identifiable within the first 50 responses.
- Alerts deliver within one minute.

---

## UC-13 — Customise Branding and Theming

**Actor**: Researcher or institution
**Goal**: Apply institutional or study-specific visual identity.

### Main flow

1. Researcher opens theming settings.
2. Uploads a logo.
3. Configures colours, fonts, spacing.
4. Adds optional custom CSS.
5. Previews changes in the viewer.
6. Applies the theme to a deployment.

### Requirements

- **REQ-13.1** Visual theme editor (colours, fonts, spacing).
- **REQ-13.2** Logo upload and placement.
- **REQ-13.3** Custom CSS support for advanced users.
- **REQ-13.4** Theme preview before applying.
- **REQ-13.5** Reusable theme templates.
- **REQ-13.6** Accessibility checking (contrast, readability).
- **REQ-13.7** Responsive design preserved across theming.
- **REQ-13.8** Theme versioning and rollback.

### Success criteria

- Basic branding configurable in under ten minutes.
- The theme applies consistently across all question types.
- No accessibility violations introduced.

---

## UC-14 — Integrate with External Systems

**Actor**: Developer or researcher
**Goal**: Connect the ecosystem with other research tools (REDCap, Qualtrics, LimeSurvey, custom pipelines).

### Main flow

1. Developer obtains API credentials.
2. Reads API documentation.
3. Implements the integration.
4. Tests in sandbox.
5. Deploys to production.
6. Monitors integration health.

### Requirements

- **REQ-14.1** RESTful API with OpenAPI 3.1 documentation per service.
- **REQ-14.2** OAuth2 authentication for users; API keys for service-to-service.
- **REQ-14.3** Webhook support for events (response submitted, study completed).
- **REQ-14.4** Bidirectional sync capabilities where applicable.
- **REQ-14.5** Rate limiting and quotas.
- **REQ-14.6** Sandbox environment for testing.
- **REQ-14.7** Client SDKs for Python, R, and JavaScript.
- **REQ-14.8** Integration monitoring and error logging.

### Success criteria

- Complete API documentation with examples.
- A basic integration written in under two hours.
- 99.9 % API uptime over a rolling 30-day window.

---

## Cross-cutting requirements

### Performance

- **PERF-01** Questionnaire loads in under three seconds on a 3G connection.
- **PERF-02** The architecture must not impose process-wide or single-writer bottlenecks; the system must scale horizontally by adding application instances and (optionally) sharding the database. Concrete per-deployment-shape capacity targets are tabled in [04_architecture.md](04_architecture.md) §"Deployment shape" (SQLite single-host ≈ 100, PostgreSQL single-server ≈ 1 000, PostgreSQL multi-instance scales horizontally).
- **PERF-03** Response submission confirmed (at the Viewer Service — `submitted` state) within one second; end-to-end delivery to Behaverse (`forwarded` state) is asynchronous and surfaced separately per OD-13.
- **PERF-04** Search results return within 500 ms.

### Security

- **SEC-01** All data encrypted in transit (TLS 1.3 or later).
- **SEC-02** All data encrypted at rest (AES-256).
- **SEC-03** OWASP Top 10 mitigations in place.
- **SEC-04** Regular security audits and dependency scanning.
- **SEC-05** Rate limiting on all public endpoints.

### Privacy

- **PRIV-01** GDPR-compliant data handling.
- **PRIV-02** Explicit consent mechanisms.
- **PRIV-03** Right to access personal data.
- **PRIV-04** Right to delete personal data.
- **PRIV-05** Data minimisation by default.
- **PRIV-06** Anonymisation and pseudonymisation options.

### Accessibility

- **ACC-01** WCAG 2.1 AA compliance.
- **ACC-02** Screen-reader compatible.
- **ACC-03** Full keyboard navigation.
- **ACC-04** High-contrast mode support.
- **ACC-05** Minimum 14 px font, user-adjustable.

### Reliability

- **REL-01** 99.9 % uptime for hosted services.
- **REL-02** Automatic backups at least daily.
- **REL-03** Point-in-time recovery.
- **REL-04** Graceful degradation during partial outages.

### Usability

- **USE-01** Mobile-responsive design across all UIs.
- **USE-02** Any feature reachable in three clicks or fewer.
- **USE-03** Inline help and tooltips.
- **USE-04** Comprehensive user documentation.
- **USE-05** Multi-language UI support.
