# Scoring — Shyness Scale (McCroskey) (`qst_mcss`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_mcss",
  "title": "Shyness Scale (McCroskey)",
  "short_title": "McCroskey",
  "source_url": "https://us.psytoolkit.org/survey-library/shyness-mcss.html",
  "publication": {
    "citation": "McCroskey, J. C., & Richmond, V. P. (1982). Communication apprehension\nand shyness: Conceptual and operational distinctions. Central States\nSpeech Journal, 33 , 458-468.",
    "year": 1982
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_mcss_agree_5",
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
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_mcss_2",
    "pr_mcss_3",
    "pr_mcss_5",
    "pr_mcss_8",
    "pr_mcss_10",
    "pr_mcss_13",
    "pr_mcss_14"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_mcss_1",
      "prompt_snippet": "I am a shy person.",
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
      "prompt_id": "pr_mcss_2",
      "prompt_snippet": "Other people think I talk a lot.",
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
      "prompt_id": "pr_mcss_3",
      "prompt_snippet": "I am a very talkative person.",
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
      "index": 4,
      "prompt_id": "pr_mcss_4",
      "prompt_snippet": "Other people think I am shy.",
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
      "index": 5,
      "prompt_id": "pr_mcss_5",
      "prompt_snippet": "I talk a lot.",
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
      "index": 6,
      "prompt_id": "pr_mcss_6",
      "prompt_snippet": "I tend to be very quiet in class.",
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
      "index": 7,
      "prompt_id": "pr_mcss_7",
      "prompt_snippet": "I don't talk much.",
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
      "index": 8,
      "prompt_id": "pr_mcss_8",
      "prompt_snippet": "I talk more than most people.",
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
      "index": 9,
      "prompt_id": "pr_mcss_9",
      "prompt_snippet": "I am a quiet person.",
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
      "index": 10,
      "prompt_id": "pr_mcss_10",
      "prompt_snippet": "I talk more in a small group (3-6) than others do.",
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
      "index": 11,
      "prompt_id": "pr_mcss_11",
      "prompt_snippet": "Most people talk more than I do.",
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
      "index": 12,
      "prompt_id": "pr_mcss_12",
      "prompt_snippet": "Other people think I am very quiet.",
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
      "index": 13,
      "prompt_id": "pr_mcss_13",
      "prompt_snippet": "I talk more in class than most people do.",
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
      "index": 14,
      "prompt_id": "pr_mcss_14",
      "prompt_snippet": "Most people are more shy than I am.",
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

- Items: 14
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_mcss_2, pr_mcss_3, pr_mcss_5, pr_mcss_8, pr_mcss_10, pr_mcss_13, pr_mcss_14
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am a shy person. | agree | 1,2,3,4,5 | no |
| 2 | Other people think I talk a lot. | agree | 1,2,3,4,5 | yes |
| 3 | I am a very talkative person. | agree | 1,2,3,4,5 | yes |
| 4 | Other people think I am shy. | agree | 1,2,3,4,5 | no |
| 5 | I talk a lot. | agree | 1,2,3,4,5 | yes |
| 6 | I tend to be very quiet in class. | agree | 1,2,3,4,5 | no |
| 7 | I don't talk much. | agree | 1,2,3,4,5 | no |
| 8 | I talk more than most people. | agree | 1,2,3,4,5 | yes |
| 9 | I am a quiet person. | agree | 1,2,3,4,5 | no |
| 10 | I talk more in a small group (3-6) than others do. | agree | 1,2,3,4,5 | yes |
| 11 | Most people talk more than I do. | agree | 1,2,3,4,5 | no |
| 12 | Other people think I am very quiet. | agree | 1,2,3,4,5 | no |
| 13 | I talk more in class than most people do. | agree | 1,2,3,4,5 | yes |
| 14 | Most people are more shy than I am. | agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/shyness-mcss.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
