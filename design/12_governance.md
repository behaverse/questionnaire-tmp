# 12 — Governance

This document records the organisational structure under which the Questionnaire Apps Ecosystem is operated, and the contracts between this project and its sibling projects.

## Operating organisation

The Questionnaire Apps Ecosystem is operated by the same organisation that operates **Behaverse**. The two are sibling projects under a single accountability chain.

[*Operating organisation — name, principal investigator(s), institutional affiliation, contact for operational and legal matters — to be filled in by the operating organisation.*]

The operating organisation is the **data controller** for content stored in the Library and the **data processor** for participant data routed through Behaverse on behalf of researchers running studies on this stack.

## Sibling projects

Three sibling projects operate under the same organisation:

| Project | Scope |
|---|---|
| **Questionnaire Apps Ecosystem** (this repository) | Library, Editor, Viewer Service, Viewers, Participant Platform. Authoring + rendering + study orchestration. |
| **Behaverse** ([behaverse.org](https://behaverse.org), [api.behaverse.org](https://api.behaverse.org/docs)) | Data collection API, response trial-format spec, xAPI events store, schema registry. |
| **Identity** (a future sibling) | Authentication + authorisation for users (researchers, contributors, reviewers, participants) across both projects. |

Each project has its own roadmap, its own release cadence, and its own implementation stack. They coordinate via cross-project contracts (below); they do not merge plans.

## Repository topology

The ecosystem's source is split across **multiple repositories** under the existing **`github.com/behaverse`** org (multi-repo, `questionnaire-` name prefix). The full catalogue, rationale, and local-folder migration map are in [14_repository_topology.md](14_repository_topology.md); the locked highlights:

- **Design/plan** → `questionnaire-system`; **canonical schemas + validator** → `questionnaire-schemas` (migrating into `behaverse/schemas` post-MVP); **Library backend** → `questionnaire-library-service`, with canonical content in `questionnaire-library-content`.
- Each component / shared library gets its own `questionnaire-<component>` repo. **Identity** is a shared sibling at `behaverse/identity`.
- Conventions mirror `behaverse/schemas` (CalVer + per-schema `versions/` + `CHANGELOG.md` + `VERSIONING.md`); schemas licensed **CC BY 4.0**.

## Cross-project contracts

### With Behaverse

| Concern | Contract |
|---|---|
| Schema delivery | This project authors the canonical schemas ([05_data_model.md](05_data_model.md)) and delivers them to Behaverse for hosting at `behaverse.org/schemas/v{version}/...`. Schema updates flow through a coordinated release. |
| Acceptance criteria | Behaverse accepts a schema release after lightweight validation (well-formed JSON Schema, no breaking changes without major-version bump). |
| Approval authority | Schema changes require sign-off from both projects' technical leads. Disputes escalate to the operating organisation's principal investigator. |
| IRI / endpoint deprecation | Behaverse commits to a minimum 24-month deprecation window for any IRI or API endpoint published under `behaverse.org/`. |
| Data plane | Viewers in this project submit responses, events, and attachment manifests to Behaverse. Behaverse owns the canonical store and provides per-deployment / per-session read APIs back to this project's Viewer Service for the real-time monitoring dashboard. |
| URI stability | URIs under `behaverse.org/{entity-type}/{id}` are stable for a minimum of 10 years from first publication. Cited instruments remain resolvable. |

### With Identity (when it ships)

| Concern | Contract |
|---|---|
| Authentication | Both this project and Behaverse federate user authentication against the Identity sibling. |
| Required token claims | `sub` (stable user ID), `roles` (controlled vocabulary including `researcher`, `participant`, `reviewer`, `contributor`, `administrator`), `email_verified`, `orcid` (optional). |
| Identity types supported | Email/password (floor — required for participants who don't have institutional accounts), ORCID OAuth (for researchers and contributors), GitHub OAuth (optional, for Library contributors specifically). |
| Account model | Single account per user across both projects. Library auth (R15 — comments/ratings from participants) and Editor auth (R20 — projects, collaborators) federate against the same Identity. |
| Roadmap coordination | Both this project and Behaverse drive the Identity sibling's roadmap jointly. |

Until the Identity sibling exists, this project ships either (a) a minimal-viable Identity service stood up alongside the first authenticated surface (the Library's write API), or (b) a temporary in-project user table that is migrated to the Identity service when it lands. Recommendation (a) for least migration cost; sequencing tracked in [../plan/](../plan/).

## Reviewer roster

The Library's GitHub-backed contribution workflow ([06_library.md](06_library.md) §5) requires a roster of reviewers who get assignments. The operating organisation:

- Maintains the roster (recruitment, onboarding, off-boarding).
- Provides reviewer onboarding materials (review checklist, license-claim verification guide, psychometric-metadata review heuristics).
- Tracks reviewer-load fairness over time.
- Does not financially compensate reviewers by default; ORCID credits and a public reviewer profile are the recognition. (Compensation may be added later if review throughput becomes a bottleneck.)

## DOI minting

Published instruments are assigned DOIs through **DataCite**. The operating organisation:

- Maintains a DataCite institutional membership.
- Funds DOI minting from its operational budget. Per-DOI cost is small relative to membership cost; the marginal cost of an additional DOI is effectively zero once membership is paid.
- Designates a DOI registration agent (a named person responsible for the institutional account).

## Data controller / data processor

| Scenario | Data controller | Data processor |
|---|---|---|
| Researcher runs a study on a self-hosted instance of this stack with their own Behaverse instance | Researcher's institution | Operating organisation (for the software); researcher's institution (for the data) |
| Researcher runs a study on the operating organisation's shared Behaverse instance | Researcher's institution | Operating organisation (for both software and data) |
| Library contributor submits an instrument | Operating organisation | Operating organisation |
| Library user comments / rates an instrument | Operating organisation | Operating organisation |
| Participant in any study | Researcher's institution | Operating organisation, as data processor for the researcher's institution |

A **Data Processing Agreement (DPA) template** for institutions adopting the shared Behaverse instance is maintained by the operating organisation and provided on request.

## Takedown policy

Per [11_content_licensing.md](11_content_licensing.md), rights-holders may request removal or relabelling of any Library entity. The operating organisation commits to:

- Acknowledging requests within **5 working days**.
- Acting on requests within **15 working days**.
- Maintaining a public takedown log (entity ID, action taken, date) for transparency.

The takedown decision is the operating organisation's; reviewers and contributors do not have takedown authority.

## URI / IRI stability commitments

The operating organisation commits to URI stability for the following namespaces under `behaverse.org/`:

| Pattern | Minimum lifespan |
|---|---|
| `behaverse.org/schemas/v{version}/...` | Indefinite (schemas never disappear; new versions appear alongside) |
| `behaverse.org/questionnaires/{id}` | 10 years from first publication |
| `behaverse.org/questionnaires/{id}/questions/{question_id}` | 10 years |
| `behaverse.org/xapi/verbs/...` | Indefinite |
| `behaverse.org/xapi/extensions/...` | Indefinite (additive only; never repurposed) |
| `behaverse.org/types/...` | Indefinite (additive only; never repurposed) |

Withdrawn content (per takedown) leaves a stub at the same URI returning a `410 Gone` status with the takedown date and a pointer to the catalogue entry. Citations remain resolvable as citations even when the content is no longer distributed.

## Hosting lifespan commitment

The operating organisation commits to operating the shared Behaverse instance and the public Library catalogue for a minimum of [*to be confirmed — recommended floor: 10 years*] from first public availability. Should the organisation need to wind down operations, it commits to:

- A minimum 12-month notice period.
- Working with the research community to identify a successor host.
- Open-sourcing all operational tooling required to stand up a replacement instance.
- Providing data exports to all institutions running studies on the shared instance.

## Dispute escalation

When a contributor and a reviewer disagree on a Library submission, escalation runs:

1. Discussion in the GitHub PR thread.
2. Second reviewer assigned (different from the original).
3. Final decision by the operating organisation's technical lead.

When this project and Behaverse disagree on a cross-project decision (schema change, IRI policy, endpoint deprecation):

1. Discussion at the cross-project technical sync.
2. Joint decision by the two project leads.
3. Escalation to the operating organisation's principal investigator if joint decision cannot be reached.

## Funding posture

[*Funding source(s) — grant, institutional, consortium — to be filled in by the operating organisation. Disclosure of funding source(s) is recorded here for transparency to researchers adopting the stack.*]
