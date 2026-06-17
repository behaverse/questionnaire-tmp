# About Licenses — Copyright & Questionnaire Content

**Status:** working primer for the questionnaire-harvester effort. Not legal advice; written to inform
project policy. Last reviewed 2026-06-17.

This document answers the questions raised when planning the harvester:

> Is the questionnaire protected as a whole? Are all its constituents? Is it the exact wording of each
> question?

and records the **policy** the harvester follows.

---

## 1. What copyright actually protects

Copyright protects **original expression**, automatically, from the moment of creation — no
registration or notice required. For a psychological questionnaire this means:

- **The questionnaire as a whole** is protected if it is an original creation of its author(s). UCL's
  copyright guidance: *"if it is the original creation of the author(s) it will benefit from copyright
  protection."*
- **The exact wording of each item** is protected. Item text is literary expression; copying the
  precise wording is the core of what copyright restricts. This is why proprietary publishers
  distribute **redacted** items — the wording itself is the protected asset.
- **Selection and arrangement** of items (which items, in what order, grouped into which subscales) is
  protected as a *compilation*, independently of the individual items.
- **Instructions, scoring keys, and accompanying prose** are protected like any other original text.
- **Translations and adaptations are separately restricted.** Translation is an "adaptation" reserved
  to the rights holder; you need permission to make/publish one. A permitted translation then earns
  **its own** copyright (held by the translator/commissioner).

### The grey zone: generic response scales

A plain, ubiquitous response scale — e.g. a 5-point `strongly disagree → strongly agree` Likert, or a
0–3 frequency scale — is **likely below the originality threshold** to be independently protected:
these are commonplace building blocks, not original expression. This matters for us: it is the legal
basis for treating standard response scales as **reusable shared Option entities** rather than
re-creating them per questionnaire.

Caveats:

- A **distinctive or unusual** scale (idiosyncratic anchors, a bespoke wording set, an original
  numeric mapping) may cross the originality line and be protected.
- Reusing a generic scale does **not** launder the protected item wording it is attached to. The item
  text is assessed separately.

## 2. Free vs. proprietary — the landscape is bimodal

There is no single answer; instruments fall into two broad camps.

**Free / public-domain / openly licensed (reusable with attribution):**

- **PHQ family (PHQ-9, PHQ-4, etc.) and GAD-7** — developed by Kroenke and colleagues; free to use,
  reproduce, translate, and display without permission.
- **DASS** (Depression Anxiety Stress Scales).
- **Government-authored instruments** (e.g. US ECLS-K questionnaires) — typically public domain.
- Instruments released under **Creative Commons** licences (increasingly encouraged by open-access
  publishers).

**Proprietary (permission and/or payment required):**

- **Beck inventories (BDI, BAI)** — owned by Pearson; licensed/paid.
- **Most Pearson / MHS / WPS catalog instruments.**
- **MMAS** (Morisky Medication Adherence Scale) — notably and aggressively enforced; published
  corrigenda/warnings exist over unlicensed use.

**Common middle ground:** many authors permit **non-commercial research and clinical use with
attribution** while prohibiting commercial use or redistribution. The permissions are frequently
**not stated clearly anywhere** — which is why "contact the author" is the honest default.

## 3. How others handle it — PsyToolkit's model

PsyToolkit (one of our source sites) does **not** assert blanket licences. It uses:

- A **global responsibility disclaimer**: *"Make sure you are not violating any copyrights. As far as
  the PsyToolkit developer is aware, all the surveys here can be used for study and research as long
  as [you] acknowledge the original authors and paper (which will be listed for each survey)."*
- A **no-warranty / your-ethics-responsibility** disclaimer.
- **Per-survey attribution** (original author + paper) rather than a standardised licence field.

This is the model the harvester adopts: full content + clear disclosure + per-item attribution and
license flagging, with the compliance burden disclosed to the end user.

## 4. Project policy (what the harvester does)

Owner decision: **capture content in full regardless of license**, and manage risk through
**disclosure and flagging**, not omission.

1. **Capture full content** (items, scales, instructions) into staging, always recording the
   `source_url` and the original author/citation.
2. **Flag a structured license block per questionnaire** (see taxonomy below). Anything ambiguous is
   `license_class: unknown`, `license_status: unknown`, `author_contact_needed: true`.
3. **Site-wide disclaimer banner** on the library web UI (draft text in § 5).
4. **Per-questionnaire license badge** surfacing `license_class` + `license_status`.
5. **Translations** carry their own flag; a translation of a protected instrument inherits the
   restriction of the source and adds the translator's rights — record both.
6. **When in doubt, escalate, don't guess.** Unclear licensing becomes an open question in
   `questions/<qst_id>.md` for the owner, who decides whether to contact the author.

## 5. License taxonomy (the per-questionnaire block)

```yaml
license:
  license_class:   public_domain | cc_by | cc_by_nc | cc_by_sa | free_research | proprietary | unknown
  license_status:  confirmed | inferred | unknown
  commercial_use:  yes | no | unknown
  redistribution:  yes | no | unknown
  translation:     yes | no | unknown
  source_url:      <where the license/permission statement was found>
  author_contact_needed: true | false
  notes:           <free text — e.g. "research use permitted per author website; commercial unclear">
```

- `confirmed` requires a concrete, citable permission statement (a license file, an explicit
  "free to use" notice, a CC tag, or a public-domain origin). Otherwise `inferred` or `unknown`.
- `free_research` = author permits non-commercial research/clinical use, typically with attribution.

> **Note:** for now this block is stored in the harvester tracking layer only (as `x_*` keys at the
> `metadata` level, since `provenance` is closed). The canonical questionnaire schema keeps its
> existing single `metadata.license` field. Extending the schema to carry this structured block is a
> tracked follow-up.

### Mapping to the canonical `metadata.license` enum

The canonical schema's `license` field is a **fixed enum**, confirmed against the validator
(see `conventions.md`). Our richer `license_class` maps onto it; the nuance the enum can't express is
preserved in the `x_*` rich block + `notes`.

| Rich `license_class` | Canonical `metadata.license` enum |
|----------------------|-----------------------------------|
| `public_domain`      | `public_domain`                   |
| `cc_by`              | `cc_by`                           |
| `cc_by_nc`           | `cc_by_nc`                        |
| `cc_by_sa`           | `cc_by_sa`                        |
| (CC0)                | `cc0`                             |
| `free_research`      | `proprietary_open_redistribution` (research/redistribution allowed; commercial nuance → `notes`) |
| `proprietary`        | `proprietary_restricted`          |
| `unknown`            | `unknown`                         |
| (mixed constituents) | `mixed_see_components`            |

## 6. Draft site-wide disclaimer banner

> **Before you use any questionnaire from this library**, confirm you are permitted to do so.
> Many instruments are copyrighted by their original authors. Listing here is not a licence. As far as
> we are aware, the instruments here may be used for study and research provided you acknowledge the
> original authors and source (shown with each questionnaire), but **you are responsible for verifying
> copyright and obtaining any permission required for your use** — particularly for commercial use,
> redistribution, or translation. You are also responsible for complying with the ethics regulations
> of your institution. Each questionnaire carries a license flag; where it is marked *unknown*, treat
> use as requiring the author's permission.

## 7. Sources

- [Psychometric scales, copyright protection and translation — UCL Copyright Queries](https://blogs.ucl.ac.uk/copyright/2017/11/17/psychometric-scales-copyright-protection-and-translation/)
- [Copyright Protection for Educational and Psychological Tests — Nebraska Law Review](https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1762&context=nlr)
- [Posting Published Psychological Scales Online With Permission — FAQ](https://www.justanswer.com/law/bs0dg-i-m-phd-student-organizational-psychology-i-m.html)
- [Copyright issues with freely published survey scales? — ResearchGate discussion](https://www.researchgate.net/post/Copyright_issues_with_freely_published_survey_scales)
- [Corrigendum and Editorial Warning Regarding Use of the MMAS Scale — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6685128/)
- [PsyToolkit Survey Library — responsibility & disclaimer notes](https://us.psytoolkit.org/survey-library/)
- [Pearson Assessments — Legal Policies](https://www.pearsonassessments.com/footer/legal-policies.html)
