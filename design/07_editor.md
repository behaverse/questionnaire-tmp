# 07 — Questionnaire Editor

The Editor is the authoring tool researchers use to create, adapt, version, and translate questionnaires. It produces canonical questionnaire JSON ([05_data_model.md](05_data_model.md)) and optionally submits it to the Library for review.

## Purpose

- Provide a **visual, low-friction surface** for authoring questionnaires without writing JSON by hand.
- Make **reuse the default**: picking an existing question from the Library should be at least as fast as writing a new one. The Editor is the principal authoring surface for new reusable entities, not only for new questionnaires.
- Support **translations and versioning** as first-class workflows, not afterthoughts.
- Provide a **WYSIWYG preview** that uses the Web Viewer's renderer (resolved OD-03 — the preview is the deployed renderer, not a separate engine).
- Support **logic, validation, and scoring** through structured builders rather than free-text expressions where possible.

## What the Editor is not

- **Not a runtime.** The Editor's preview is the closest possible match to viewer output, but the Editor never collects participant responses.
- **Not the Library.** The Editor can submit a finished questionnaire *to* the Library, but it does not own the catalogue.
- **Not a translation-management product.** It includes a translation interface tuned for questionnaire content; it is not a general localisation platform.

## Capabilities

### 1. Project and questionnaire management

- A researcher creates **projects** that contain one or more questionnaires (often: a study uses several instruments).
- Within a project, the researcher can create a new questionnaire, import an existing one (from the Library, from disk, from a supported import format), or fork a Library entry to adapt it.
- Collaborators can be invited per project with roles (owner, editor, viewer).

### 2. Visual structure editor

- Blocks, Pages, Sections, and Questions arranged in a left-rail tree with drag-and-drop reordering (per the five-concept structural model in [05_data_model.md](05_data_model.md) and OD-12 in [10_open_decisions.md](10_open_decisions.md)).
- A main canvas showing the currently selected block, page, section, or question, with type-appropriate property panels on the right.
- Each level (questionnaire / block / page / section / question) has its own `style` and `flow` panel where authored declarations apply per the inheritance rules in [05_data_model.md](05_data_model.md).
- Add a question by either:
  - **Picking from the Library** — a Library browser is embedded; selecting a question creates a reference to that versioned entity in the questionnaire.
  - **Creating inline** — type-aware new-question dialog; on save, the new question can optionally be promoted into the Library so other questionnaires can reuse it.

### 3. Reusable-component workflow

The Editor treats reusable entities the same way the Library does. Specifically:

- Questions, option-sets, instructions, and prompts can be selected from the Library pool.
- **Hard-pinning** (per OD-06): every reference carries an explicit `@version`. When a referenced entity has a newer version, the Editor surfaces a notification with a diff and an explicit upgrade action — never silently upgrades.
- **Override surface** (per OD-05): on a reference, the author may freely edit `position`, `required`, and `show_if`. Any edit to a non-overridable field (`prompt`, `type`, `properties`, `validation`, `tags`, default option-set, per-question `style`) opens a fork dialog with three actions: (a) **derive locally** — create a study-scoped fork in this questionnaire only, (b) **propose a new shared version** — open a Library PR through the contribution workflow, or (c) **cancel** — discard the edit.
- The "pool overview" tab shows every entity the questionnaire references, with their versions, deprecation status, and reuse counts elsewhere.

### 4. Logic builder

A structured editor for the logic types defined in [02_terminology.md](02_terminology.md):

- **Skip logic** — "If question X = Y, skip to page Z."
- **Visibility** — "Show question X (or section / page / block) when condition is true."
- **Piping** — "Insert answer to question X into the prompt of question Y."
- **Branching** — "After page X, go to page A if condition else page B."
- **Randomization** — page order, question order within a page, question order within a section, option order within a question, page order within a block. (Seed strategy is set on the deployment, not the questionnaire — see [08a_viewer_service.md](08a_viewer_service.md).)

The builder offers a drop-down / form-based UI for common rules; advanced users can drop into the canonical expression language directly. A live evaluator — the **same WASM module** embedded by the Web Viewer (per OD-11, resolved 2026-05-21) — validates that conditions reference real question IDs, produce valid types, and evaluate consistently with what the deployed viewer will compute at run time.

### 5. Validation builder

Per-question validation (required, format, range, length) is configurable in the question's property panel.

Cross-question validation rules are configured in a dedicated panel with the same expression language as logic conditions.

Validation messages are translatable text fields.

### 6. Scoring builder

For each defined score (subscale, total, derived):

- Name and identifier.
- Formula expression with autocomplete over question IDs (`sum(q_depression_*)`, `mean(scl_anxiety)`, weighted sums).
- Output type (numeric, categorical).
- Optional interpretation bands (cutoffs, severity labels).

The builder shows a live evaluation against a synthetic sample response — computed by the same WASM evaluator (OD-11) so the displayed score is exactly what the viewer will produce at run time.

### 7. Translation interface

- Side-by-side: source language on the left, target language on the right.
- One row per translatable text element (question prompt, option text, instruction, validation message, scoring interpretation label).
- **Translation memory** suggests translations from prior work on the same Library entities. Suggestions display source confidence and frequency.
- Each row carries a status: `draft` / `complete` / `validated`.
- Bulk operations: mark page complete, accept all memory suggestions for an entity.
- A completeness indicator shows the percentage of text elements translated and validated.

### 8. Preview

- Inline preview pane (split view) that uses the **Web Viewer's rendering library** directly. The preview is the deployed renderer; there is no separate preview engine (resolves OD-03).
- Language picker in the preview to flip between translations.
- Device-frame picker (mobile portrait, mobile landscape, tablet, desktop) to verify behaviour at different viewports. The strict-presentation rule from [08_viewer.md](08_viewer.md) applies: presentation is reproduced as authored within the physical envelope of the chosen viewport.
- "Open in viewer" option creates a **Preview deployment** in the Viewer Service (preset `preview`, dimensions: `editor_session` / `ephemeral` / `preview_short_lived` / `standalone`) — a full-page preview URL for sharing with non-Editor collaborators. Preview deployments hold no data and expire on a short TTL.

### 9. Version control

- Every save creates a versioned snapshot of the canonical JSON.
- Side-by-side diff between any two versions.
- Branching: create a derived version (e.g. a short form) from any prior version.
- Versions can be tagged (`draft`, `internal-review`, `published`).
- Optional: import the version history as a Git repository for power users (the canonical JSON is human-readable JSON anyway).

### 10. Import / export

**Imports.** Imports are *migration-assistance tooling* — see [13_importers.md](13_importers.md). Each importer is a separate optional component that produces canonical JSON; the Editor's UI surface is a generic "load canonical JSON" entry point that delegates to importer tools. Imports are gated on author acknowledgement of the loss report; re-imports are refused by default.

Per-format phasing is tracked in [plan/04_feature_priority.md](../plan/04_feature_priority.md).

**Exports.** Canonical JSON; PDF (paper form, per [11_content_licensing.md](11_content_licensing.md) the entity's license tag is included in the PDF footer); printable summary (item list with metadata).

### 11. Submission to Library

Once a questionnaire is judged ready, the researcher can submit it to the Library for peer review.

- The Editor prepares a submission package: canonical JSON, metadata, supporting documents (validation studies, manuals).
- Submission opens a pull request in the Library's GitHub-backed workflow ([06_library.md](06_library.md)).
- Subsequent review feedback comes back into the Editor as comments threaded against questions or sections.

## User flows

### A — Adapt an existing instrument for a study

1. Researcher creates a project.
2. Browses the Library inside the Editor, finds the instrument, clicks "Fork into project".
3. Adjusts wording on two items; the Editor proposes either deriving local copies of those questions or proposing a new shared version.
4. Adds a custom demographics page using questions from the Library's question pool.
5. Configures a skip rule.
6. Previews in English and the lab's two target translation languages.
7. Exports canonical JSON. Hands it to the Viewer Service for deployment.

### B — Translate an existing instrument

1. Researcher opens an existing questionnaire.
2. Adds a new language version.
3. Walks down the translation interface row by row.
4. Accepts translation-memory suggestions where confidence is high.
5. Marks the translation as complete; submits to a reviewer.
6. Reviewer marks rows as validated.
7. The new language version is part of the questionnaire's next version.

### C — Build a new short form

1. Researcher opens an existing 21-item questionnaire.
2. Creates a derived version `qst_phq9_short`.
3. Removes 11 items.
4. Adjusts the scoring formula and interpretation bands.
5. Submits both the derived questionnaire and a validation note to the Library for peer review.

## Interactions with other components

| With | How |
|---|---|
| **Library** | Read entities (questionnaires, questions, option-sets, …) and their versions. Submit new versions via the contribution workflow. |
| **Viewer Service** | Trigger preview deployments. (Editor does not push to viewers directly; it produces JSON the Viewer Service consumes.) |
| **Participant Platform** | None directly. The Platform discovers questionnaires via the Library. |
| **Behaverse** | None. Editor produces no participant data. |

## Permissions

| Role | Create projects | Edit own questionnaires | Edit team questionnaires | Submit to Library |
|---|---|---|---|---|
| Researcher | ✓ | ✓ | (when invited) | ✓ |
| Reviewer | ✓ | ✓ | (when invited) | ✓ |
| Administrator | ✓ | ✓ | ✓ | ✓ |

Participants and Guests do not access the Editor.

## Implementation stack

Per OD-03 (resolved) and OD-04 (resolved): the preview shares the Web Viewer's renderer as a library (no independent preview engine — drift would violate the strict-presentation rule); backend uses Python + FastAPI; frontend uses JS/TS; storage is PostgreSQL with `jsonb`. See [04_architecture.md](04_architecture.md) §"Deployment shape".

## Resolved decisions referenced from this component

- **OD-01** (resolved 2026-05-23) — **S1 (Pure custom).** Editor authoring UI is custom React + TypeScript; preview embeds the Web Viewer renderer library directly. No SurveyJS dependency (no SurveyJS Form Library and no SurveyJS Creator).
- **OD-03** (resolved 2026-05-15) — Editor preview shares the Web Viewer's renderer as a library.
- **OD-05** (resolved 2026-05-21) — Reference-with-safe-overrides; the Editor's fork-prompt UX in §3 above implements the rule. Non-overridable edits open the fork dialog.
- **OD-11** (resolved 2026-05-21) — Single WASM expression evaluator embedded in the Editor preview; same binary as the Web Viewer.

## Open decisions referenced from this component

The frontend component library is an implementation-level choice not gated by an OD; the Editor team selects when Editor implementation begins (phasing tracked in [plan/04_feature_priority.md](../plan/04_feature_priority.md)).
