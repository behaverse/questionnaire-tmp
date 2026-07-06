# 04 — System Architecture

This document describes the components of the Questionnaire Apps Ecosystem, their responsibilities, and how they interact. **It describes what each component does, not how each component is implemented.** Implementation-level technology choices (backend framework, database engine, web-rendering library) are recorded as open decisions in [10_open_decisions.md](10_open_decisions.md).

## Architecture overview

```
                       ┌──────────────────────────────────────────────┐
                       │  Sibling services (same operating org)        │
                       │                                              │
                       │   Behaverse Data Collection API              │
                       │   (api.behaverse.org)                        │
                       │   ─ canonical store for responses + events   │
                       │                                              │
                       │   Behaverse schema registry                  │
                       │   (behaverse.org/schemas/*)                  │
                       │                                              │
                       │   Identity (sibling)                         │
                       │   ─ federated auth for all components        │
                       └──────────────────────────────────────────────┘
                                            ▲
                                            │ responses, xAPI events,
                                            │ behavioural attachments
                                            │   (via Viewer Service)
   ┌──────────────────────┐    canonical    │
   │ Questionnaire        │    questionnaire│
   │ Library              │◄──────┐         │
   │                      │       │         │
   │ ─ catalogue          │       │         │
   │ ─ reusable           │       │         │
   │   components         │       │         │
   │ ─ metadata           │       │         │
   │ ─ peer review        │       │         │
   └──────────┬───────────┘       │         │
              │                   │         │
              │ definitions       │         │
              ▼                   │         │
   ┌──────────────────────┐       │         │
   │ Questionnaire        │       │         │
   │ Editor               │───────┘         │
   │                      │                 │
   │ ─ authoring          │                 │
   │ ─ translation        │                 │
   │ ─ logic builder      │                 │
   │ ─ preview            │                 │
   └──────────┬───────────┘                 │
              │ canonical                   │
              │ questionnaire JSON          │
              ▼                             │
   ┌──────────────────────┐                 │
   │ Viewer Service       │─────────────────┤
   │                      │                 │
   │ ─ deployments        │                 │
   │ ─ sessions           │                 │
   │ ─ submission broker  │                 │
   │ ─ monitoring         │                 │
   └──────────┬───────────┘                 │
              │ session token               │
              ▼                             │
   ┌──────────────────────┐                 │
   │ Questionnaire Viewers│                 │
   │                      │                 │
   │ ─ Web Viewer         │                 │
   │ ─ Native (Godot)     │                 │
   │ (PDF as export)      │                 │
   └──────────────────────┘                 │
              ▲                             │
              │ assignments                 │
              │                             │
   ┌──────────────────────┐                 │
   │ Participant Platform │                 │
   │                      │                 │
   │ ─ accounts           │                 │
   │ ─ study protocols    │                 │
   │ ─ scheduling         │                 │
   │ ─ consent            │                 │
   │ ─ dashboards         │                 │
   └──────────────────────┘
```

The Library, Editor, Viewer Service, Viewer family, and Participant Platform are five independent components in this project. They communicate through (1) the canonical questionnaire JSON, and (2) the Viewer Service's submission API, which forwards to the Behaverse sibling. A lab can adopt a subset (e.g. Library + Editor) without adopting the others. The submission paths through the Viewer Service are written against pluggable sink interfaces, so a lab can route data to a non-Behaverse sink if needed.

## Components

### 1. Questionnaire Library

**Responsibility.** Authoritative store for published, validated questionnaires and the reusable components they are built from (questions, option-sets, instructions, prompts, translations). Provides search, browsing, citation, and a peer-review workflow.

**Inputs.** Submissions from contributors; reviewer decisions; community comments.

**Outputs.** Canonical questionnaire JSON (with metadata), exportable in canonical, runtime-compatible, and PDF forms. Stable identifiers and DOIs for citation.

**Key responsibilities.**

- Catalogue questionnaires and their metadata (psychometrics, citations, classifications).
- Manage a pool of reusable components — questions, option-sets, instructions, prompts — each independently identified and versioned. Track which questionnaires reference each component.
- Manage translations as first-class entities tied to specific text elements.
- Provide search across all entity types.
- Run the contribution/review workflow (GitHub-backed; contributors submit pull requests, reviewers approve).
- Expose a versioned REST API for read access and authenticated write access.

**External dependencies.** GitHub (for the contribution workflow); a DOI minting service for published instruments.

See [06_library.md](06_library.md) for the detailed specification.

---

### 2. Questionnaire Editor

**Responsibility.** Visual authoring tool for creating, editing, versioning, and translating questionnaires. Outputs canonical JSON.

**Inputs.** Existing questionnaires loaded from the Library; reusable components selected from the Library pool. Imports from foreign formats are migration-assistance tooling produced by separate optional components — see [13_importers.md](13_importers.md).

**Outputs.** Canonical questionnaire JSON (the same format the Library stores), suitable for any viewer.

**Key responsibilities.**

- Visual drag-and-drop construction of groups and questions.
- Pick-from-Library for reusable components.
- Inline logic builder (skip, branching, piping).
- Translation interface (side-by-side, with translation memory drawn from the Library).
- Real-time preview using the Web Viewer's renderer, published as a shared library (resolves OD-03).
- Version control with diff visualisation.
- Optional: submit to the Library for peer review.

See [07_editor.md](07_editor.md) for the detailed specification.

---

### 3. Viewer Service

**Responsibility.** Broker between researchers' deployment configurations and participants' viewer sessions. Owns deployments, mints sessions, and forwards submissions to Behaverse.

See [08a_viewer_service.md](08a_viewer_service.md) for the detailed specification.

---

### 4. Questionnaire Viewers

**Responsibility.** Render a questionnaire to a participant and capture responses and interaction events. Two implementations cover the online and offline deployment contexts; PDF is an export format produced by the Library or the Editor (no participant data captured).

**Viewer family members.**

| Viewer | Deployment context |
|---|---|
| **Web Viewer** | Browser-based; online deployments; embedded in web pages |
| **Native Viewer (Godot)** | Desktop, mobile, kiosk, offline; embedded in games or VR |

**Inputs.** Canonical questionnaire JSON (from the Library, via the Viewer Service); resolved deployment configuration (mode, theming, locale, style/flow overrides); session token issued by the Viewer Service.

**Outputs.** Response data (Behaverse trial format) and xAPI 2.0 semantic-event statements, submitted to the Viewer Service. Optional behavioural-channel attachments (mouse trajectories, keyboard timing, future webcam/microphone) uploaded to the Viewer Service as per-session files; each channel is linked from the xAPI stream by a single `recorded` statement.

**Key responsibilities.**

- Render every question type the viewer claims to support (per its conformance manifest) consistently.
- Evaluate skip logic, branching, piping, randomisation, and scoring per the questionnaire definition.
- Enforce client-side validation rules.
- Emit xAPI statements for semantic events: page viewed, question focused, option selected, page navigated, questionnaire submitted, abandoned, …
- Submit response, event, and attachment data to the Viewer Service (or, in offline mode, queue locally and sync when connectivity returns).
- Apply the deployment's mode (resolved orthogonal dimensions per [08a_viewer_service.md](08a_viewer_service.md)).
- Capture optional behavioural channels when configured: mouse trajectory, keystroke timing, response time, future webcam/microphone.

**Cross-viewer contract.** The same canonical JSON produces semantically equivalent responses and event streams in every supporting viewer. Visual presentation is enforced as authored within the physical envelope of the participant's device (scrolling, OS accessibility scaling, dpr scaling). Supported features are declared per viewer in a conformance manifest. Divergence in semantic equivalence is a defect; visual adaptations beyond the physical envelope are not permitted.

See [08_viewer.md](08_viewer.md) for the detailed specification.

---

### 5. Participant Platform

**Responsibility.** Manage participant accounts, study protocols, scheduled assessments, consent, and personal data dashboards.

**Inputs.** Researcher-defined studies and protocols; participant registrations and consents; questionnaire references from the Library.

**Outputs.** Assignments (scheduled questionnaires for participants); notifications; compliance reports; longitudinal data exports.

**Key responsibilities.**

- Participant accounts: registration, authentication, profile, GDPR-compliant data access/erasure.
- Researcher study management: protocol builder, enrolment, randomisation, withdrawal.
- Scheduling: time-based and event-based assignment generation.
- Notifications: email and SMS, configurable cadence.
- Consent: recorded with timestamp and consent-form version.
- Compliance tracking: assignment completion, missed assessments, drop-out rates.
- Personal dashboard for participants: history, summary scores, longitudinal charts, granular sharing controls.

See [09_platform.md](09_platform.md) for the detailed specification.

---

### 6. Scoring engine

**Responsibility.** Execute external **Scorer** entities (per OD-16) to compute questionnaire scores, and cache the results. Scoring is not a formula baked into the questionnaire — each entry in `scores[]` names a pinned Scorer implementation whose output the viewers and Editor read through the OD-11 evaluator's `score(id)`.

**Engine-location options.** A Scorer runs in one of three places, transparent to callers: **WASM-embedded** in the viewer or Editor (the reference path — deterministic, offline-capable), an **HTTP scoring service**, or a **local subprocess** for a self-hosted deployment. The Viewer Service serves the reference WASM scorers.

**Caching.** Results are keyed by `(scorer_ref, canonical input hash)` so an unchanged input never recomputes, mirroring the Viewer Service's runtime cache. See [05b_scoring.md](05b_scoring.md) for the scoring model and the `questionnaire-scorer` reference engine + conformance runner.

---

## Upstream sibling services (operated by the same organisation)

| Sibling service | Role |
|---|---|
| **Behaverse Data Collection API** ([api.behaverse.org](https://api.behaverse.org/docs)) | Canonical store for response data (trial format), semantic event data (xAPI), and behavioural-channel attachment storage. The Viewer Service forwards here after lightweight validation. |
| **Behaverse Schema Registry** (`behaverse.org/schemas/*`) | Hosts the published canonical JSON Schemas for questionnaire metadata, definition, response data, session metadata, xAPI extensions, and behavioural-channel attachment manifests. |
| **Identity (sibling)** | Federated authentication for users (researchers, contributors, reviewers, participants). See [12_governance.md](12_governance.md). |

These are siblings of this project, not external third parties; the cross-project contracts are documented in [12_governance.md](12_governance.md).

## External services

| External service | Role |
|---|---|
| **GitHub** | Backs the Library's contribution and review workflow. |
| **DOI registrar (DataCite)** | Mints persistent identifiers for published instruments. |
| **Email and SMS providers** | Used by the Participant Platform for notifications. |

The ecosystem also adopts the open standards listed in [05_data_model.md](05_data_model.md) — JSON Schema, xAPI 2.0, ISO 639-1, ISO 8601, UUID v4, [Calendar Versioning (CalVer)](https://behaverse.org/schemas/#versioning) (`vYY.MMDD`), Schema.org, Dublin Core, DataCite.

## Data flows

### Authoring → publication → deployment

```
Editor ──► canonical JSON ──► Library (review) ──► Library (published)
                                                          │
                                                          ▼
                                       Researcher selects published
                                       questionnaire for a deployment
                                                          │
                                                          ▼
                              ┌───────────────────────────┴──────────────────┐
                              │                                              │
                              ▼                                              ▼
                  Anonymous deployment                          Participant Platform study
                  (link/code)                                   (assignment to enrolled users)
```

### Response and event flow

```
Participant interacts with Viewer
            │
            ├─► xAPI semantic events ─► (buffered)  ─► POST Viewer Service /events ─► Behaverse events endpoint
            │
            ├─► response per item    ─► (per item)  ─► POST Viewer Service /responses ─► Behaverse trial endpoint
            │                                          (or batched on submit)
            │
            └─► (optional) behavioural-channel attachments (mouse, keyboard, future webcam/mic)
                  ─► chunked POST Viewer Service /channels/{name}
                  ─► AttachmentStore (Behaverse / object storage)
                  ─► one xAPI `recorded` statement per channel emitted to the events stream
                       on channel close, carrying the attachment URL + integrity hash.
```

The Viewer Service brokers every submission path; viewers do not POST directly to Behaverse. This gives one auth boundary, one place for the pluggable sink interface, and the natural home for the real-time monitoring dashboard. Forwarding from the Viewer Service to Behaverse is asynchronous (queued via a Postgres outbox; see OD-13 in [10_open_decisions.md](10_open_decisions.md)) — the viewer's `submitted` ack is independent of Behaverse uptime, and end-to-end delivery is surfaced as the separate `forwarded` state. In offline mode (Native Viewer), all of the above is queued locally and synced when connectivity returns.

### Session lifecycle

```
not_started → in_progress → completed → submitted → forwarded → validated
                    │                                              │
                    └──► abandoned                                  └──► (failed validation flagged for review)
```

| State | Meaning |
|---|---|
| `submitted` | Received and durably stored at the Viewer Service |
| `forwarded` | Behaverse acknowledged receipt (delivery receipt confirmed) |
| `validated` | Behaverse passed server-side validation rules |

The `submitted → forwarded → validated` split reflects OD-13's queued forwarding model: the Viewer Service stores submissions durably and returns success to the viewer immediately, then forwards to Behaverse asynchronously with retry / back-off. See [10_open_decisions.md](10_open_decisions.md) OD-13 for the full rationale.

A session is owned by the Viewer Service ([08a_viewer_service.md](08a_viewer_service.md)) — or the local Native Viewer in offline mode, which syncs to the Viewer Service when connectivity returns. The session ID is the join key linking responses, semantic events, behavioural-channel attachments, and (where applicable) Participant Platform assignments.

## Cross-cutting concerns

### Authentication and authorisation

- **Researchers and participants** authenticate against the Identity sibling project ([12_governance.md](12_governance.md)) via OAuth2 / OIDC plus session cookies or JWT.
- **Programmatic / service-to-service** access uses API keys issued by the Identity sibling.
- **Anonymous deployments** use opaque session tokens minted by the Viewer Service; no Identity account required.
- **Authorisation** is role-based (see [02_terminology.md](02_terminology.md)) with resource-level permissions on studies, deployments, projects, and Library entries.

### Multi-tenancy and isolation

The system is **single-tenant self-hosted.** A lab runs its own instance; no cross-lab data sharing happens through shared infrastructure. The Library is the single shared surface — and it is read-mostly, with curated contributions.

### Internationalisation

The ecosystem supports any ISO 639-1 language code throughout the data model and UI. Initial UI translations target the seven languages already present in `survey_database/`: English, French, German, Luxembourgish, Portuguese, Spanish, Italian.

Participant-locale resolution at deployment time follows a precedence chain (URL query param → Platform profile → deployment default → browser `Accept-Language` → questionnaire canonical language). A language qualifies for serving only when every required field has a `validated` translation; no mixed-language rendering. Detailed in [05_data_model.md](05_data_model.md) §"Locale resolution".

### Accessibility

WCAG 2.1 AA across all interfaces. Viewers in particular must support keyboard navigation, screen readers, high-contrast modes, and user-adjustable text sizing.

### Privacy and data protection

- GDPR-aligned, with explicit consent capture, data minimisation, and the rights of access, rectification, and erasure exposed to participants.
- Pseudonymisation by default for anonymous deployments.
- Encryption in transit (TLS 1.3+) and at rest (AES-256).
- Audit logging for administrative actions and data access.

### Observability

Each component exposes structured JSON logs, application metrics (latency, throughput, error rates), and business metrics (responses collected, active sessions, completion rates). Distributed tracing is used for request flows that cross component boundaries.

## Deployment shape

The system is deployable as a set of cooperating services. The smallest useful deployment is just the Library (catalogue + content). A full deployment runs Library, Editor, Viewer Service, and the Participant Platform alongside the Behaverse sibling.

**Implementation stack** (resolved, per [10_open_decisions.md](10_open_decisions.md) OD-04):

- All four backends in this project (Library, Editor backend, Viewer Service, Participant Platform) are written in **Python + FastAPI**.
- **PostgreSQL** is the default storage engine across these backends, with `jsonb` carrying document-shaped canonical content inside a relational schema. **SQLite** is permitted as a single-machine self-hosted option.
- The **frontend** stack (Library web UI, Editor, Web Viewer) is JS/TS. The Web Viewer's renderer is published as a library and reused by the Editor preview.
- The **Native Viewer** uses Godot/GDScript.
- **Attachments** (behavioural-channel files, uploaded media) are stored in object storage (S3-compatible), referenced from the relational store.
- **Behaverse** continues to use its own storage stack (MongoDB) as a sibling project; the two projects exchange data over the network, not at the storage layer.

Per-component variation from this stack requires an explicit open-decision change; it is not a contributor's preference.

**Capacity tiers.** Realistic per-shape capacity on commodity hardware (8 vCPU / 16 GB RAM as the reference single-server profile). These numbers describe the realistic bottleneck before noticeable latency degradation; they are not contractual maximums.

| Tier | Configuration | Realistic concurrent-sessions ceiling | First bottleneck |
|---|---|---|---|
| **A. SQLite single-host** | The permitted single-machine option; one process, SQLite file with WAL mode | ~100–200 active sessions | SQLite write serialisation (single-writer) |
| **B. PostgreSQL single-host** *(default)* | One server, PostgreSQL + Gunicorn with multiple Uvicorn workers, no load balancer | ~1 000–3 000 active sessions | App-server CPU; Postgres connections |
| **C. PostgreSQL multi-instance** | Load balancer in front of N FastAPI instances; Postgres with read replicas if needed | Horizontal — scales by adding instances | Behaverse-forwarding throughput (mitigated by OD-13 queued forwarding) and downstream sink capacity |

The architectural commitment in [PERF-02](03_use_cases.md#L466) is that nothing in the design *prevents* tier C; concrete operational scaling is an ops concern handled at deployment time, not a design constraint.
