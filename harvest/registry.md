# Questionnaire Harvest — Registry (progress dashboard)

One row per candidate instrument. This is the single place to see **what's important and
where each instrument stands**. Sort by Importance, then Status.

**Importance rubric** — High / Med / Low, scored on:
widely-used or highly-cited · clear/open license · NOT already in the library · priority domain.

**Status legend:**
`candidate` (intake only) · `capturing` (fetching source) · `extracting` · `needs-review`
(awaiting owner sign-off) · `imported` (in `content/`, DoD met) · `ingested` (pushed to live
Library) · `skipped:<reason>` (e.g. `skipped:license`, `skipped:duplicate`).

**Sources:** AP = scales.arabpsychology.com · PT = psychology-tools.com · PTK = psytoolkit.org/survey-library

| # | Instrument | Acronym | Source | Domain | Items | Scale(s) | Importance | License | Status | Dedup / notes |
|---|------------|---------|--------|--------|-------|----------|------------|---------|--------|---------------|
| 1 | Patient Health Questionnaire-9 | PHQ-9 | phqscreeners.com | depression | 9 | `opt_phq_frequency_4` (minted) | High | public_domain | **needs-review** | pilot; scale had NO match in 113-Option baseline → minted new; 12/12 schema-valid, refs resolve, renders in preview |
| 2 | Generalized Anxiety Disorder-7 | GAD-7 | phqscreeners.com | anxiety | 7 | `opt_phq_frequency_4` (reuse) | High | public_domain | candidate | next; will REUSE PHQ-9 scale + `ins_phq_2weeks` (dedup demo) |

> Candidate list is populated in the first backlog-building pass (after Q1/Q6 are answered).
> Each `imported` row must satisfy the Definition of Done (see open-questions Q10).
