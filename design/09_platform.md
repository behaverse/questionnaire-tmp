# 09 — Participant Platform

The Participant Platform is the service that manages participant accounts, study protocols, scheduled assessments, consent, and personal dashboards. It is the "longitudinal study" surface of the ecosystem.

## Purpose

- **Manage participants** as accounts with consent, profile, and a personal data store.
- **Orchestrate studies** — researchers define protocols (instruments, schedule, randomisation) and the platform turns them into participant assignments.
- **Schedule and notify** — assessments arrive on time; reminders go out when assignments are missed.
- **Track compliance** — researchers see who has completed what, when, and what is overdue.
- **Provide participant dashboards** — participants see their history, summary scores, and longitudinal charts, and control sharing of their data.

## What the Platform is not

- **Not the Viewer.** Participants complete questionnaires *through* a Viewer (typically the Web Viewer). The Platform issues an assignment and a link.
- **Not a data store for responses.** Responses go to Behaverse via the Viewer. The Platform stores assignment status and references to the resulting sessions.
- **Not a clinical patient-management system.** It is a research participation platform, not an EHR.

## Capabilities

### 1. Participant accounts

- Self-service registration with email verification.
- Authentication (OAuth2 + session cookies / JWT).
- Profile: identifying information minimised by default; researcher studies may request additional fields per their consent forms.
- GDPR rights: full personal-data export; account and data deletion; rectification.
- Granular data-sharing consent — participants choose, per study or per data type, who can access their data.

### 2. Studies and protocols

A **study** is a longitudinal research project owned by a researcher (or a team).

A **protocol** is the operational definition of a study: which questionnaires, in what order, on what schedule, with what completion windows, with what optional randomisation.

Researchers can:

- Create a study with metadata (title, description, principal investigator, IRB approval reference).
- Build a protocol via a structured builder (instrument from the Library, timepoint label, days from enrolment, completion window, reminder cadence).
- Configure randomisation rules (assign enrollee to a randomised group; group determines protocol variant).
- Configure consent: the consent text or document participants see at enrolment, with versioning.
- Configure withdrawal rules: what happens to a participant's prior data when they withdraw.

### 3. Enrolment

Two enrolment models, both supported:

- **Researcher-initiated.** Researcher invites a participant by email; participant clicks the invitation, reviews consent, accepts, and is enrolled.
- **Self-enrolment.** Public study link or code; participant browses, reviews consent, accepts, and enrols.

On enrolment, the platform records the consent decision (with timestamp and consent-form version), randomises into a group if configured, and creates the initial assignments based on the protocol.

### 4. Assignments

An **assignment** is "this participant should complete this questionnaire by this date". Each assignment carries:

- The participant ID, study ID, protocol entry, questionnaire ID and version.
- The deployment URL (the link the participant follows) — a personalised URL tied to the participant's session.
- A due date and a completion window.
- A status (`pending`, `available`, `completed`, `missed`, `withdrawn`).
- Reminder configuration.

Assignments are generated automatically as a participant's enrolment progresses through the protocol's timeline.

**Scheduler implementation (per OD-09, resolved 2026-05-21).** The Platform uses a **database-driven scheduler** in PostgreSQL — no Redis / Celery / Kafka dependency in MVP. Concrete design:

- A `scheduled_assignments` table holds each `(participant_id, study_id, protocol_entry, due_at, status)` row.
- A worker process (or one-of-N workers with row-level locking via `SELECT ... FOR UPDATE SKIP LOCKED`) polls for due rows every 60 seconds by default (configurable per deployment).
- Each tick: claim due rows, generate the corresponding assignment records, mark the scheduled-row processed, dispatch notifications.
- Matches the Postgres-outbox forwarding pattern from OD-13 ([08a_viewer_service.md](08a_viewer_service.md)) — the Platform reuses the same operational muscle.

If scheduling load ever exceeds Postgres polling comfort, the migration target is option B (Celery + Redis); the `scheduled_assignments` table remains a clean queue source for an external worker pool.

### 5. Notifications and reminders

- Email by default; SMS when a phone number is on file and consent for SMS is granted.
- Initial notification when an assignment becomes available.
- Reminders at configurable intervals before the due date; final-chance reminder near the close of the completion window.
- A participant can adjust notification preferences (channels, time of day, frequency caps).
- All notifications are localised to the participant's preferred language.

### 6. Compliance dashboard (researcher)

For each study, researchers see:

- A roster of enrolled participants with current status (active, withdrawn, completed).
- Per-protocol completion rates and overdue counts.
- Per-participant timeline of assignments and outcomes.
- Aggregate compliance metrics; drop-out analytics; time-to-complete distributions.
- Configurable alerts: "notify me when N participants miss an assignment", "notify me when completion rate falls below X".

### 7. Participant dashboard

For each participant, they see:

- Their current assignments (what to complete next, due dates).
- Their history (every completed questionnaire, when, with summary scores if the questionnaire defines them).
- Longitudinal charts for repeated-measures instruments.
- A data-sharing panel: who currently has access to which of their data.
- Their personal-data export and deletion controls.

### 8. Consent and ethics

- Consent forms are versioned. A participant's consent is recorded against a specific version.
- When a consent form is updated, existing participants are prompted to re-consent before their next assignment.
- Withdrawal is honoured immediately: pending assignments are cancelled; previously collected data is retained or deleted per the consent's prior agreement.

### 9. Data export (researcher)

For each study, the researcher can export longitudinal data:

- All responses and computed scores, with participant ID and timepoint columns.
- Compliance metadata (assignment due dates, completion dates, time-to-complete).
- The same export formats as elsewhere (CSV wide/long, JSON, SPSS, R).

Personal identifying information is included only when the consent and the researcher's role permit.

## Session lifecycle inside a Platform study

A Platform study uses authenticated viewer sessions:

```
Participant logs into the Platform
            │
            ▼
Sees an available assignment
            │  click
            ▼
Platform mints an authenticated session token
            │
            ▼
Redirected to a Viewer deployment with the token
            │
            ▼
Participant completes the questionnaire in the Viewer
            │
            ▼
Viewer submits responses + events to Behaverse
            │
            ▼
Viewer notifies the Platform of completion (webhook / callback)
            │
            ▼
Platform marks the assignment completed
            │
            ▼
Platform schedules the next assignment per protocol
```

## Roles and permissions

| Role | Create studies | Edit own studies | Enrol participants | View own data | View study data | Withdraw |
|---|---|---|---|---|---|---|
| Researcher | ✓ | ✓ | ✓ | ✓ | (own studies) | n/a |
| Reviewer | ✓ | ✓ | ✓ | ✓ | (own studies) | n/a |
| Participant | | | (self-enrol) | ✓ | | ✓ |
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | (any) |
| Guest | | | | | | |

## Interactions with other components

| With | How |
|---|---|
| **Library** | The Platform references questionnaires by `qst_{id}@version`. It does not store definitions itself. |
| **Editor** | None directly. |
| **Viewer Service** | The Platform creates authenticated viewer sessions for assignments and consumes completion callbacks. |
| **Behaverse** | The Platform does not write response data. It reads assignment-status information about its assignments' sessions (e.g. via Behaverse session status APIs) and stores enrolment / scheduling / compliance data in its own database. |
| **Notification providers** | Email and SMS providers send participant notifications. |

## Compliance and data protection

- **GDPR-aligned.** Participants have explicit rights to access, rectification, and deletion exposed through the dashboard.
- **Data minimisation.** Profile fields are kept to the minimum required by the studies a participant is enrolled in.
- **Consent versioning.** Every consent decision is timestamped and tied to a specific consent-form version.
- **Audit logging.** Administrative and data-access actions are logged.

## Resolved decisions referenced from this component

- **OD-08** (resolved 2026-05-15) — Identity is a sibling project ([12_governance.md](12_governance.md)). The Platform federates against it for participant authentication, alongside the Library and Editor.
- **OD-09** (resolved 2026-05-21) — Database-driven scheduler; implementation documented in §"Assignments" above.

## Open decisions referenced from this component

- The exact storage and retention rules for personal data per regulatory context.
- Whether SMS notification is in scope at first delivery or deferred.
