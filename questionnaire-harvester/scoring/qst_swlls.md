# Scoring — Satisfaction with love life scale (SWLLS) (`qst_swlls`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_swlls",
  "title": "Satisfaction with love life scale (SWLLS)",
  "short_title": "SWLLS",
  "source_url": "https://us.psytoolkit.org/survey-library/love-satisfaction-swlls.html",
  "publication": {
    "citation": "Neto, F. (2005). The Satisfaction With Love Life Scale. Measurement and evaluation in counseling and development, 38 , 2-13.",
    "year": 2005
  },
  "status": "needs-research",
  "item_count": 5,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_swlls_agree_7",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "Strongly agree",
        "Agree",
        "Slightly agree",
        "Neither agree nor disagree",
        "Slightly disagree",
        "Disagree",
        "Strongly disagree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_swlls_1",
      "prompt_snippet": "In most ways my love life is close to my ideal.",
      "dimension": "agree",
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_swlls_2",
      "prompt_snippet": "The conditions of my love life are excellent.",
      "dimension": "agree",
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_swlls_3",
      "prompt_snippet": "I am satisfied with my love life.",
      "dimension": "agree",
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_swlls_4",
      "prompt_snippet": "So far I have gotten the important things I want in love life.",
      "dimension": "agree",
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_swlls_5",
      "prompt_snippet": "If I could live my love life over, I would change almost nothing.",
      "dimension": "agree",
      "values": [
        7,
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
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

- Items: 5
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In most ways my love life is close to my ideal. | agree | 7,6,5,4,3,2,1 | no |
| 2 | The conditions of my love life are excellent. | agree | 7,6,5,4,3,2,1 | no |
| 3 | I am satisfied with my love life. | agree | 7,6,5,4,3,2,1 | no |
| 4 | So far I have gotten the important things I want in love life. | agree | 7,6,5,4,3,2,1 | no |
| 5 | If I could live my love life over, I would change almost nothing. | agree | 7,6,5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/love-satisfaction-swlls.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
