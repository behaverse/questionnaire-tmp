# 13 — Importers

Importers are tools that convert questionnaires authored in other formats into the canonical JSON defined by [05_data_model.md](05_data_model.md). They are **migration-assistance tooling**, not first-class authoring features of the Editor.

## Posture

The Library and the Editor speak canonical JSON. Importers are separate components that produce canonical JSON from foreign formats. Once content has entered the canonical JSON form, the rest of the system treats it identically to natively-authored content — with one exception: imported content carries a `provenance` block in its metadata so that consumers know its origin.

Three rules govern imports:

1. **Imports are gated on author acknowledgement.** Every importer produces a loss report alongside the canonical JSON. The author reviews and acknowledges the report before the imported draft is saved into the Editor or the Library.
2. **Re-imports are refused by default.** A second import over a previously-imported-and-edited draft requires the author to explicitly choose between (a) discarding their edits and replacing with the new import, or (b) starting a new fork. Silent merge is never offered.
3. **Imported content cannot be `published` in the Library until natively reviewed.** An imported draft can sit in the Library at `draft` status, but it cannot reach `published` until psychometric metadata is filled in natively *and* a reviewer has confirmed the canonical JSON faithfully represents the source.

## Architecture

Each importer is its own component:

```
[Source-format file]
        │
        ▼
   ┌──────────────────────┐
   │ Importer (per source │      ┌─────────────────────────────┐
   │ format)              │ ──►  │ Canonical JSON (with        │
   │                      │      │  provenance block)          │
   │ ─ parses source      │      └─────────────────────────────┘
   │ ─ maps to canonical  │                  │
   │ ─ emits loss report  │ ──►  ┌─────────────────────────────┐
   │                      │      │ Loss report                 │
   └──────────────────────┘      └─────────────────────────────┘
                                                │
                                                ▼
                                ┌─────────────────────────────┐
                                │ Author acknowledgement gate │
                                └─────────────────────────────┘
                                                │
                                                ▼
                                  Editor draft / Library draft
```

Importers ship on their own release cadence, independent of the Editor and the Library. Adding, removing, or pausing an importer does not affect the canonical schema or the rest of the system.

## Conformance manifests

Each importer publishes a **conformance manifest** that declares:

- Which constructs of the source format it handles, drops, or approximates.
- Which source-format versions it supports.
- Known limitations and edge cases.
- The exact mapping it applies for each construct (so reviewers can audit).

The manifest is consumed by:

- The author, when reviewing a loss report against the manifest's known limitations.
- The Library, when surfacing an imported instrument's provenance.
- Reviewers, when checking that an imported draft is a faithful representation.

## The loss report

Every import run produces a loss report listing:

| Category | Examples |
|---|---|
| **Dropped** | Source constructs that have no canonical equivalent (e.g. Qualtrics survey-flow logic specific to its routing engine). |
| **Approximated** | Constructs mapped to a canonical equivalent with semantic loss (e.g. embedded JavaScript replaced with an equivalent declarative logic rule, or marked as unrepresentable). |
| **Preserved** | Constructs cleanly mapped (no loss expected). |
| **Warnings** | Suspected issues (e.g. duplicated question IDs, missing required metadata, implausible license declaration). |

The author cannot save the imported draft without explicitly acknowledging the loss report. A copy of the report is stored alongside the draft for later reference.

## Provenance metadata

Imported content carries a `provenance` block in its Schema 1 metadata:

```jsonc
{
  "provenance": {
    "source": "qualtrics_qsf",
    "source_version": "...",
    "imported_at": "2026-05-15T14:30:00Z",
    "imported_by": "{researcher_id}",
    "import_loss_report_url": "...",
    "importer_version": "qualtrics-importer-0.4.2"
  }
}
```

The `provenance` block is preserved through Library submission, so reviewers see at a glance that an instrument was imported and from which source.

## Library submission of imported content

Imported drafts can be submitted to the Library through the same contribution workflow as native content, with two additional checks:

- The reviewer verifies the loss report has been acknowledged and no dropped constructs invalidate the instrument's validity.
- The reviewer verifies that psychometric metadata (reliability, validity, norms, citations) has been filled in *natively* — imported content typically carries little or no psychometric metadata from its source.

An imported instrument that passes review is published with its `provenance` block intact and a clear "Imported from X" label in the Library entry.

## Supported source formats

The list of importers ships incrementally. Each importer is its own component on its own release cadence.

| Source format | Stability | Effort |
|---|---|---|
| **SurveyJS JSON** | Stable (MIT-licensed, openly documented) | Low |
| **CSV** (one question per row, type/options columns) | Trivial | Low |
| **REDCap data dictionary** | Stable | Medium |
| **LimeSurvey LSS/LSA** | Open-source but format changes across releases | High |
| **Qualtrics QSF** | Proprietary; reverse-engineering needed | High; ongoing maintenance |

The canonical recommendation: build the SurveyJS importer first (it's the easiest and the data shape is closest to canonical JSON), use it to validate the importer architecture end-to-end, then add others as partner studies require them.

Distinct from these file-format converters, the **questionnaire-harvester** (`questionnaire-harvester/`) is a *web-harvesting* pipeline — it scrapes public questionnaire sources (PsyToolkit, psychology-tools) into canonical Schema 2 entities with content-fingerprint dedup, rather than converting an uploaded file. It follows the same posture: it writes only its own output, and content is reviewed and manually ingested into the Library.

Per-format delivery phasing is tracked in [plan/04_feature_priority.md](../plan/04_feature_priority.md).

## Open decisions

- Whether an importer's conformance manifest is itself a versioned artefact published at `behaverse.org/importers/{format}/v{version}/manifest.json`. Recommendation: yes, for transparency.
- Whether import is a CLI tool or an in-Editor surface for the SurveyJS / CSV importers. Recommendation: both — the same Python library powers both surfaces.
- How long the loss report is retained when its draft is later published. Recommendation: indefinitely; the report is provenance information.
