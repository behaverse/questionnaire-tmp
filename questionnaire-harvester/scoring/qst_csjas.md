# Scoring — Critical Social Justice Scale (CSJAS) (`qst_csjas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_csjas",
  "title": "Critical Social Justice Scale (CSJAS)",
  "short_title": "CSJAS",
  "source_url": "https://us.psytoolkit.org/survey-library/critical-social-justice-scale.html",
  "publication": {
    "citation": "Lahtinen, O. (2024). Construction and validation of a scale for assessing critical social justice\nattitudes. Scandinavian Journal of Psychology, 2024, 65, 693–705. https://doi.org/10.1111/sjop.13018 . Link to study",
    "year": 2024
  },
  "status": "needs-research",
  "item_count": 7,
  "dimensions": [
    "csjaslikert"
  ],
  "option_scales": [
    {
      "ref": "opt_csjas_csjaslikert_4",
      "dimension": "csjaslikert",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Completely disagree",
        "Somewhat disagree",
        "Somewhat agree",
        "Completely agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_csjas_4",
    "pr_csjas_5",
    "pr_csjas_7"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_csjas_1",
      "prompt_snippet": "If white people have on average a higher level of income than black people, it i",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_csjas_2",
      "prompt_snippet": "University reading lists should include fewer white or European authors.",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_csjas_3",
      "prompt_snippet": "Microaggressions<sup>⚹</sup> should be challenged often and actively.<BR>(<sup>⚹",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_csjas_4",
      "prompt_snippet": "Trans<sup>⚹</sup> women who compete with women in sports are not helping women's",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_csjas_5",
      "prompt_snippet": "We don't need to talk more about the color of people's skin.",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_csjas_6",
      "prompt_snippet": "A white person cannot understand how a black person feels equally well as anothe",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_csjas_7",
      "prompt_snippet": "A member of a privileged group can adopt features or cultural elements of a less",
      "dimension": "csjaslikert",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    }
  ],
  "to_research": {
    "aggregation": null,
    "subscale_definitions": null,
    "cutoffs": null,
    "notes": null
  }
}
```

## Known structure

- Items: 7
- Dimensions: csjaslikert
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_csjas_4, pr_csjas_5, pr_csjas_7
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | If white people have on average a higher level of income than black people, it i | csjaslikert | 0,1,2,3 | no |
| 2 | University reading lists should include fewer white or European authors. | csjaslikert | 0,1,2,3 | no |
| 3 | Microaggressions<sup>⚹</sup> should be challenged often and actively.<BR>(<sup>⚹ | csjaslikert | 0,1,2,3 | no |
| 4 | Trans<sup>⚹</sup> women who compete with women in sports are not helping women's | csjaslikert | 0,1,2,3 | yes |
| 5 | We don't need to talk more about the color of people's skin. | csjaslikert | 0,1,2,3 | yes |
| 6 | A white person cannot understand how a black person feels equally well as anothe | csjaslikert | 0,1,2,3 | no |
| 7 | A member of a privileged group can adopt features or cultural elements of a less | csjaslikert | 0,1,2,3 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/critical-social-justice-scale.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
