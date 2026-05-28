# 11 — Content Licensing

This document defines how the ecosystem treats the licensing of questionnaire content (questionnaires, questions, option-sets, instructions, prompts, and their translations). The posture is **transparency without enforcement**: the Library catalogues and distributes content with accurate, prominent licensing metadata; it does not verify or enforce that downstream users have the rights required for their use.

## Posture

The Library's commitment is:

1. **Every entity carries a license tag.** Questionnaires, questions, option-sets, instructions, prompts, and translations each declare a license from a controlled vocabulary (see below).
2. **The license tag is displayed prominently.** On entry pages, in search results where relevant, and in any export the Library produces.
3. **The Library distributes the full text** of every entry regardless of license tag — provided the operating organisation has obtained the right to do so (or is willing to honour takedown requests; see "Takedown procedure").
4. **The Library does not verify user rights.** A researcher downloading a copyrighted instrument is responsible for ensuring they have the rights to use it in their study.
5. **The Library does not gate distribution by license tag.** Free, restricted, and unknown-licensed items are all served from the same API; only the metadata differs.

The reverse posture (refusing to distribute restricted content) was considered and rejected: it would reduce the Library's utility (researchers cannot evaluate a scale they cannot view) without measurably reducing the legal exposure that an open Library carries.

## Question vs. questionnaire

Licensing is tracked at **two distinct levels** because the legal status of an individual question is often different from that of a named questionnaire:

| Level | Examples | License notes |
|---|---|---|
| **Question** (`q_*`) | *"How often did you feel sad in the past week?"* | Often short, sometimes generic; may not be copyrightable on its own; reusable across instruments. License tagged at the question entity. |
| **Questionnaire** (`qst_*`) | *"Beck Depression Inventory-II"* | Named compilation with authorship, instructions, response options, scoring, validation. Typically copyrighted as a compilation even when individual items are not. License tagged at the questionnaire entity. |

The same rule applies to option-sets, instructions, and prompts: each entity carries its own license tag.

A questionnaire that composes copyrighted-individually items inherits the strictest license among them; a questionnaire that is itself copyrighted overrides freer items it composes. The Library computes and displays the **effective composite license** for a questionnaire, alongside the per-component licenses.

## Controlled-vocabulary license tags

Every entity's `license` field takes one of:

| Tag | Meaning |
|---|---|
| `public_domain` | No copyright restrictions (e.g. public-domain dedication, government work). |
| `cc0` | Creative Commons Zero (effectively public domain). |
| `cc_by` | Creative Commons Attribution. |
| `cc_by_nc` | Creative Commons Attribution-NonCommercial. |
| `cc_by_sa` | Creative Commons Attribution-ShareAlike. |
| `proprietary_open_redistribution` | Copyrighted; rights-holder permits open redistribution (e.g. PHQ-9 by Pfizer). |
| `proprietary_restricted` | Copyrighted; redistribution requires a license from the rights-holder (e.g. BDI-II). |
| `unknown` | Provenance unclear; no audit performed yet. Default for un-audited content. |
| `mixed_see_components` | Composite-level only; individual components have differing licenses. |

Additional metadata fields accompany the tag:

- `license_notes` — free-text qualifications (e.g. *"free for research use with attribution; commercial use requires a license"*).
- `rights_holder` — name + URL of the rights-holder.
- `request_url` — URL where a downstream user can request a license (when applicable).

## Distribution rules

| License tag | Distribution rule |
|---|---|
| `public_domain`, `cc0`, `cc_by`, `cc_by_sa` | Distributed in full. No restrictions. |
| `cc_by_nc` | Distributed in full. Display the non-commercial qualifier. |
| `proprietary_open_redistribution` | Distributed in full. Display the rights-holder and license terms prominently. |
| `proprietary_restricted` | Distributed in full **provided** the operating organisation has obtained the right to distribute (often by direct arrangement with the rights-holder) **or** is prepared to honour takedown requests. Display *"Restricted license — downstream use requires permission from the rights-holder"* prominently. |
| `unknown` | Distributed in full with a clear *"License status not audited"* warning. Treated operationally the same as `proprietary_restricted` for takedown purposes. |
| `mixed_see_components` | Applies only to composite (questionnaire) entities. Display the strictest component license as the composite restriction. |

## Takedown procedure

Rights-holders may contact the operating organisation (contact details in [12_governance.md](12_governance.md)) to request removal or relabelling of any entity. The operating organisation commits to:

- **Acknowledging the request** within five working days.
- **Acting on the request** (remove, relabel, or contest with explanation) within fifteen working days.
- **Honouring removal requests** when redistribution rights cannot be substantiated, regardless of the entity's current license tag.

The Library does not delete entity records on takedown — it marks them as `withdrawn`, removes the distributable content, and retains the metadata stub so cross-references and citations remain stable.

## Licensing of the project's own artefacts

The licensing posture above governs **content** in the Library. The project's own artefacts have separate licenses:

| Artefact | License |
|---|---|
| Design documents (this folder and [../plan/](../plan/)) | CC BY 4.0 |
| Canonical JSON Schemas (published at `behaverse.org/schemas/`) | CC0 |
| Software (Library, Editor, Viewer Service, Viewers, Participant Platform) | To be confirmed; default expectation is a permissive open-source license (Apache 2.0 or MIT) |
| Migration tooling | Same license as the software |

These are decisions for the operating organisation (see [12_governance.md](12_governance.md)). The Library does not place licensing constraints on its own implementation; it only catalogues and tags the content it serves.

## Interactions with the contribution workflow

Library contributions ([06_library.md](06_library.md) §5) require an explicit `license` tag on every entity. The peer-review workflow includes a license-claim check:

- Contributors declare the license under which they contribute and assert they have the right to do so.
- Reviewers verify the declaration is plausible (e.g. cross-checking against the cited source) but do not perform a legal audit.
- Submissions with unsatisfactory license metadata are returned for revision.

Imported content (per [13_importers.md](13_importers.md)) inherits the source's license declaration; the importer's loss report flags missing or implausible license metadata.

## Migration of existing content

The 792 questions and 59 questionnaires migrated from `survey_database/` are tagged through a one-time audit pass before they reach the Library's public catalogue. Items that cannot be confidently audited are tagged `unknown` and migrated anyway — the `unknown` tag is itself an honest declaration, not a barrier.

The audit is a tagging exercise, not a gatekeeping exercise: every audited item migrates; the metadata records what is known.
