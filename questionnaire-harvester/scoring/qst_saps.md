# Scoring — Short revised almost perfect scale (SAPS) (`qst_saps`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_saps",
  "title": "Short revised almost perfect scale (SAPS)",
  "short_title": "SAPS",
  "source_url": "https://us.psytoolkit.org/survey-library/perfectionism-saps.html",
  "publication": {
    "citation": "K. G. Rice, C. M. E. Richardson, & S. Tueller. (2014). The Short Form of the Revised\nAlmost Perfect Scale. Journal of Personality Assessment, 96(3) , 368-379.",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 8,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_saps_agree_7",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "strongly disagree",
        "disagree",
        "slightly disagree",
        "neutral",
        "slightly agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_saps_1",
      "prompt_snippet": "I have high expectations for myself",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_saps_2",
      "prompt_snippet": "Doing my best never seems to be enough.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_saps_3",
      "prompt_snippet": "I set very high standards for myself.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_saps_4",
      "prompt_snippet": "I often feel disappointment after completing a task because I know I could have ",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_saps_5",
      "prompt_snippet": "I have a strong need to strive for excellence.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_saps_6",
      "prompt_snippet": "My performance rarely measures up to my standards.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_saps_7",
      "prompt_snippet": "I expect the best from myself.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_saps_8",
      "prompt_snippet": "I am hardly ever satisfied with my performance.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
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

- Items: 8
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have high expectations for myself | agree | 1,2,3,4,5,6,7 | no |
| 2 | Doing my best never seems to be enough. | agree | 1,2,3,4,5,6,7 | no |
| 3 | I set very high standards for myself. | agree | 1,2,3,4,5,6,7 | no |
| 4 | I often feel disappointment after completing a task because I know I could have  | agree | 1,2,3,4,5,6,7 | no |
| 5 | I have a strong need to strive for excellence. | agree | 1,2,3,4,5,6,7 | no |
| 6 | My performance rarely measures up to my standards. | agree | 1,2,3,4,5,6,7 | no |
| 7 | I expect the best from myself. | agree | 1,2,3,4,5,6,7 | no |
| 8 | I am hardly ever satisfied with my performance. | agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/perfectionism-saps.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
