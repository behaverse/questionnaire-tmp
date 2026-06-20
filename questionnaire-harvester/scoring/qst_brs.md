# Scoring — Resilience (BRS) (`qst_brs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_brs",
  "title": "Resilience (BRS)",
  "short_title": "BRS",
  "source_url": "https://us.psytoolkit.org/survey-library/resilience-brs.html",
  "publication": {
    "citation": "Smith, B.W., Dalen, J., Wiggins, K., Tooley, E., Christopher, P. and\nBernard, J. (2008). The Brief Resilience Scale: Assessing the\nAbility to Bounce Back. International Journal of Behavioral\nMedicine,15 , 194-200.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_brs_agree_5",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Strongly disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_brs_2",
    "pr_brs_4",
    "pr_brs_6"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_brs_1",
      "prompt_snippet": "I tend to bounce back quickly after hard times",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_brs_2",
      "prompt_snippet": "I have a hard time making it through stressful events",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_brs_3",
      "prompt_snippet": "It does not take me long to recover from a stressful event",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_brs_4",
      "prompt_snippet": "It is hard for me to snap back when something bad happens",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_brs_5",
      "prompt_snippet": "I usually come through difficult times with little trouble",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_brs_6",
      "prompt_snippet": "I tend to take a long time to get over set-backs in my life",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
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

- Items: 6
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_brs_2, pr_brs_4, pr_brs_6
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I tend to bounce back quickly after hard times | agree | 1,2,3,4,5 | no |
| 2 | I have a hard time making it through stressful events | agree | 1,2,3,4,5 | yes |
| 3 | It does not take me long to recover from a stressful event | agree | 1,2,3,4,5 | no |
| 4 | It is hard for me to snap back when something bad happens | agree | 1,2,3,4,5 | yes |
| 5 | I usually come through difficult times with little trouble | agree | 1,2,3,4,5 | no |
| 6 | I tend to take a long time to get over set-backs in my life | agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/resilience-brs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
