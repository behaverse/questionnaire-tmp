# 06 — Questionnaire Library

> **What "the Library" actually refers to.** Three layers, deliberately collapsed in the rest of this document:
>
> - **(a) Library software** — the codebase that implements catalogue, search, REST API, contribution workflow, etc. Python + FastAPI + PostgreSQL backend, JS/TS web UI. Lives in a Git repository.
> - **(b) Library deployment** — one specific running instance of (a) — a server, a database, a public URL. Per OD-10 there is **exactly one** such instance, operated by the operating organisation.
> - **(c) Library content** — the questionnaires, reusable components, translations, reviews, comments, ratings, and usage statistics actually stored in the database of (b). Seeded at MVP from the 792 questions + 59 questionnaires in `survey_database/`; grows through the contribution workflow.
>
> The rest of this doc says "the Library" without specifying which sense, because OD-10 maps the three 1:1:1 (one software, one deployment, one content pool). If OD-10 is ever revisited (federated lab-Libraries, third-party deployments of the software), the (a) / (b) / (c) distinction will become load-bearing.

The Library is the catalogue and repository of validated questionnaires, the reusable components they are built from, and the metadata that makes them findable, citable, and trustworthy. It is also a **growing repository of reusable research building blocks** — questions, option-sets, instructions, prompts — that future questionnaires compose from.

## Purpose

- Be the **authoritative store** for published, validated questionnaires.
- Be a **growing pool of reusable components** — questions, option-sets, instructions, prompts, translations — that new questionnaires compose from. The Library is not just a catalogue of past instruments; it is the substrate for new research.
- Enable **discovery** through search by domain, population, language, psychometric properties, licensing status, citation.
- Run a **peer-review and contribution workflow** so the catalogue stays high-quality and grows in the open.
- Surface **transparent licensing metadata** per entity (see [11_content_licensing.md](11_content_licensing.md)). The Library distributes content with accurate license tags; it does not verify or enforce downstream rights.
- Provide **stable identifiers and citations** (DOIs) so different studies can refer unambiguously to the same instrument.

## What the Library is not

- **Not the Editor.** The Library stores finished questionnaires. Authoring happens in the Editor.
- **Not a data-collection backend.** The Library does not store participant responses or events. Those go to Behaverse via the Viewer.
- **Not a clinical decision-support system.** It may host clinical instruments and norms, but it does not produce diagnoses or treatment guidance.

## Capabilities

### 1. Catalogue and search

- Browse the catalogue with filters: domain, target population, language, item count, completion time, license tag (per [11_content_licensing.md](11_content_licensing.md)), validation status.
- Full-text search across titles, descriptions, authors, citations, keywords.
- Faceted browsing on classification fields (`domain[]`, `population[]`, `tags[]`).
- Sort by relevance, citation count, recency, usage.
- Per-entry view: metadata, full item list (paginated for long instruments), psychometric properties, citations, comments, deployment statistics, downloadable definition.

### 2. Reusable-component pool

Per OD-15 (resolved 2026-05-31; full body in [05a_reusable_entities.md](05a_reusable_entities.md)), reusable entities are first-class citizens of the Library, split into **content-bearing** (text/numeric content with per-language `content` map) and **ref-binding** (named compositions of refs to other entities).

| Category | Entity | Prefix | What the Library exposes |
|---|---|---|---|
| Content-bearing | **Message** | `msg_` | Standalone participant-facing text (welcome, end, transitions). `type` string-array; `content` language map. |
| Content-bearing | **Context** | `ctx_` | Background paragraphs that frame a Question. `content` language map. |
| Content-bearing | **Instruction** | `ins_` | How-to-respond text. Optional `dimension`; `content` language map. |
| Content-bearing | **Prompt** | `pr_` | The stem text the participant reads. `name`, `construct`, `dimension`, `topics[]`, `reversed`; `content` language map. |
| Content-bearing | **Option** | `opt_` | Response-options spec: structural fields (input/measurement type, value/index, selection, min/max/step) + `content` language map (label, units, per-choice text). Determines the UI input widget. |
| Content-bearing | **Placeholder** | `ph_` | Hint text inside an input field. `content` language map. |
| Content-bearing | **Help** | `help_` | Tooltip / "?" content. `content` language map. |
| Content-bearing | **RegEx** | `rx_` | Reusable validation patterns. `regex` + `example_input` (structural); optional `content.description` per language. |
| Ref-binding | **Question** | `q_` | Refs-only composition: Prompt-ref + optional Context-ref + optional Instruction-ref. The "asking" half of an Item. |
| Ref-binding | **Item** | `it_` | Refs-only composition: Question-ref + Option-ref. The participant-administered unit. Page elements reference saved Items (with `required` / `show_if` overrides per OD-05) or author Items inline. |
| Ref-binding (hybrid) | **Solution** | `sol_` | Correct-response record: Prompt-ref + optional Option-ref + `expected_response` value (the hybrid exception — a binding entity that carries a value). |

The Library tracks **which questionnaires reference each entity**, so changes can be surfaced as breaking, additive, or corrective (CalVer severity tag per OD-06) and so analysts can find every study that used a particular Item, Prompt, or Option.

### 3. Metadata and citation

Each questionnaire entry carries the full Questionnaire Metadata structure defined in [05_data_model.md](05_data_model.md): authors, publication, classification, psychometrics (reliability, validity, norms), usage and copyright.

Published instruments are assigned a DOI through an external registrar. The DOI is the recommended citation handle.

### 4. Community signals (post-publish feedback)

The Library has its own database for post-publish community feedback, distinct from the GitHub-backed *contribution* discussion in §5.

- **Comments and discussion** per questionnaire (lightweight, threaded). Stored in the Library's own database. Identity is the Identity sibling project ([12_governance.md](12_governance.md)) — participants who comment must have an account but do not need a GitHub or ORCID account.
- **Ratings** (overall quality, suitability per use case). Stored in the Library's own database.
- **Usage statistics** aggregated from the Viewer Service: number of deployments referencing this questionnaire, total sessions, mean completion time, completion rate.

GDPR rights of erasure apply to comments and ratings — a user's deletion request removes their comments and ratings from the Library's database. The contribution discussion in §5 lives on GitHub and is subject to GitHub's own data lifecycle.

These signals are surfaced in search ranking and on the entry page.

### 5. Contribution and review workflow

Contributions to the Library happen through a GitHub-backed workflow. The Library does not need to manage contributor accounts or run its own forums.

```
Contributor                       Library                                 Reviewers
    │                                │                                        │
    │ open PR on GitHub repo         │                                        │
    │ with new questionnaire JSON    │                                        │
    │ + metadata + validation refs   │                                        │
    │                                │                                        │
    │ ────────────────────────────►  │                                        │
    │                                │ ── triggers review assignment ──────►  │
    │                                │                                        │
    │                                │                                        │ review,
    │                                │                                        │ comment,
    │                                │                                        │ request changes
    │                                │ ◄────────────────────────────────────  │
    │                                │                                        │
    │ revise, push                   │                                        │
    │ ────────────────────────────►  │                                        │
    │                                │                                        │ approve
    │                                │ ◄────────────────────────────────────  │
    │                                │                                        │
    │                                │ ─► merge to main, publish to catalogue │
    │                                │ ─► mint DOI                            │
    │                                │ ─► notify contributor                  │
```

**Why GitHub-backed.** For *contribution* discussion specifically, GitHub provides a familiar review surface — PRs and issue threads — for reviewers and contributors. The Library reads from the canonical Git history for contribution provenance; it owns its own post-publish comments and ratings store (see §4), separate from the contribution discussion. Post-publish feedback is *not* on GitHub.

**Imported content.** Submissions whose canonical JSON was produced by an importer (see [13_importers.md](13_importers.md)) follow the same workflow with two additional reviewer checks: (a) the importer's loss report has been acknowledged and no dropped constructs invalidate the instrument's validity; (b) psychometric metadata has been filled in natively. Imported submissions may sit at `draft` indefinitely; they cannot reach `published` without these checks.

### 6. Versioning, deprecation, and the dependency graph

Every entity (questionnaire, question, option-set, instruction, prompt, translation) is versioned using **Calendar Versioning (CalVer)** with the format `vYY.MMDD`, aligned with the [Behaverse schemas versioning policy](https://behaverse.org/schemas/#versioning). Published versions are immutable. New versions create new entries.

The CalVer string itself does not encode breaking-vs-non-breaking. Each new entity version carries a `severity` metadata tag with one of three values:

- **`breaking`** — content changes that alter responses or scoring (re-wording an item, changing an option-set, changing a scoring formula).
- **`additive`** — additions that do not change existing responses (a new optional question, a new translation, a new psychometric data point).
- **`corrective`** — corrections that should not affect interpretation (typos, formatting).

**Property URIs remain stable across versions** (per the Behaverse policy), ensuring backward compatibility at the property level even when the parent entity is re-versioned.

**Hard-pinning (per OD-06, resolved 2026-05-21).** All references from a questionnaire to a Library entity carry an explicit version: `q_depression_1@v26.0523`. New versions — *regardless of `severity`* — do not silently flow into referencing questionnaires. The Editor surfaces "new version available" with a diff, the new version's `severity` tag, and an explicit upgrade action; the author chooses. The `severity` tag exists to inform that decision, not to authorise an auto-upgrade.

**Deprecation lifecycle.** An entity version may be marked `deprecated` (a flag separate from the version number itself). Deprecation:

- Does **not** remove the entity. Deployed questionnaires keep rendering against the deprecated version.
- Shows a deprecation warning in the Library catalogue and in the Editor when a referencing questionnaire is opened.
- Is reversible until the entity reaches `withdrawn` (see [11_content_licensing.md](11_content_licensing.md) takedown procedure).
- May suggest a replacement version (Editor reads this suggestion when offering the upgrade).

**Dependency-graph API.** A new endpoint exposes "which questionnaires reference this entity@version":

- `GET /questions/{id}/versions/{version}/dependents` — list of `qst_*@version` entries that pin this question version.
- Symmetric endpoints for option-sets, instructions, prompts.

Contributors proposing a new entity version use this to see the impact surface; reviewers use it to gauge whether a deprecation request is safe.

**Forking workflow (per OD-05, resolved 2026-05-21).** When a researcher edits a non-overridable field on a referenced Library entity in the Editor, the surface offers three actions:

1. **Derive locally** — fork into a new entity scoped to this questionnaire (the original reference becomes a reference to the fork). Used when the change is study-specific and won't be shared.
2. **Propose a new shared version** — open a Library PR with the proposed new version. Goes through the standard review workflow (§5).
3. **Cancel** — discard the edit and revert to the referenced entity.

Overridable fields (`position`, `required`, `show_if`) bypass the fork prompt; those edits live on the reference and don't fork the entity.

### 7. Public read API

A versioned REST API exposes:

- `GET /questionnaires` — list with pagination, filters, search query
- `GET /questionnaires/{id}` — full entry with metadata
- `GET /questionnaires/{id}/versions` — version history
- `GET /questionnaires/{id}/versions/{version}/definition` — canonical JSON definition
- `GET /questions`, `GET /questions/{id}` — reusable questions
- `GET /option-sets`, `GET /option-sets/{id}` — reusable option-sets
- `GET /search?q=...` — full-text search across all entity types

Write access (creating drafts, submitting for review) is authenticated. Read access is open.

## Inputs and outputs

**Inputs.**

- Submissions from contributors via the GitHub-backed workflow.
- Review decisions from assigned reviewers.
- Comments and ratings from authenticated users.
- Usage statistics aggregated from the Viewer Service.

**Outputs.**

- Questionnaire Definitions as canonical JSON (downloadable per version).
- Reusable-component entries (questions, option-sets, …) accessible via API.
- Search results, browse listings, entry pages.
- DOIs and citations for published instruments.

## Hosting model

Per OD-10 (resolved 2026-05-21), the ecosystem runs **a single Library instance** operated by the operating organisation. No federation, no separate lab-private instances.

**Content scope.** The Library hosts the *full lifecycle* of instruments — not just published, peer-reviewed ones. Drafts, in-review submissions, lab-specific or unpublished instruments, and withdrawn entries all live in the same Library. The distinction between "public-visible content" and "owner/team-visible content" is **per-entry**, expressed through a lifecycle-status field and the permission table below, rather than through instance separation.

Lifecycle states for an instrument (and the reusable entities it contains) at minimum:

- **`draft`** — visible to the entity's owner and explicitly-invited collaborators only; not in the public catalogue.
- **`in_review`** — submitted via the GitHub-backed PR workflow (§5); visible to assigned reviewers in addition to the owner / team.
- **`published`** — visible to everyone; DOI minted; counted in usage statistics.
- **`withdrawn`** — metadata stub remains addressable (citations resolve); distributable content removed (per [11_content_licensing.md](11_content_licensing.md)).

*(The exact state machine — who can transition between which states, and what triggers each transition — is left as a separate sub-question to resolve in a future session.)*

## Permissions

| Role | Read **published** catalogue | Read drafts (owner / team) | Read submissions (when assigned) | Comment / rate published | Submit contribution | Review submission | Curate catalogue |
|---|---|---|---|---|---|---|---|
| Guest | ✓ | | | | | | |
| Participant | ✓ | | | ✓ | | | |
| Researcher | ✓ | ✓ (own / team) | | ✓ | ✓ | (when assigned) | |
| Reviewer | ✓ | ✓ (own / team) | ✓ | ✓ | ✓ | ✓ | |
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Interactions with other components

| With | How |
|---|---|
| **Editor** | Editor loads existing questionnaires (read) and submits new versions (write). |
| **Viewer Service** | Viewer Service fetches questionnaire definitions and metadata when a deployment is created. Reports back deployment + completion counts for the Library's usage statistics. |
| **Participant Platform** | Platform references questionnaires by ID + version when defining study protocols. |
| **Behaverse** | The Library is independent of Behaverse data collection. Its own data — catalogue, comments, ratings — is stored in the Library's own database. |

## Implementation stack

Per OD-04 (resolved): Python + FastAPI backend with PostgreSQL as the default storage engine (SQLite as a permissible single-machine option). See [04_architecture.md](04_architecture.md) §"Deployment shape".

## Resolved decisions referenced from this component

- **OD-05** (resolved 2026-05-21) — Reference-with-safe-overrides; documented in §6 above and in [05_data_model.md](05_data_model.md) §"Question".
- **OD-06** (resolved 2026-05-21) — Hard-pin all references; deprecation lifecycle; dependency-graph API documented in §6 above.
- **OD-10** (resolved 2026-05-21) — Single Library hosting all instrument lifecycle states; per-entry visibility; documented in "Hosting model" above. The full lifecycle-state machine is flagged as a sub-question for a future session.

All decisions referenced from this component (OD-05, OD-06, OD-10, OD-12) are resolved; see the Resolution log in [10_open_decisions.md](10_open_decisions.md). The five-concept structural model (Block / Page / Section / Subscale / Tag) the Library's catalogue browsing surfaces depend on is documented in [05_data_model.md](05_data_model.md) §"Schema 2".
