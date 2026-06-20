# Scoring — Flourishing Scale (FS) (`qst_fs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_fs",
  "title": "Flourishing Scale (FS)",
  "short_title": "FS",
  "source_url": "https://us.psytoolkit.org/survey-library/flourishing-scale.html",
  "publication": {
    "citation": "Diener, E., Wirtz, D., Tov, W., Kim-Prieto, C., Choi. D., Oishi, S.,\n& Biswas-Diener, R. (2009). New measures of well-being: Flourishing\nand positive and negative feelings. Social Indicators Research,\n39 ,\n247-266. Online\navailable here .",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 8,
  "dimensions": [
    "fs_agree"
  ],
  "option_scales": [
    {
      "ref": "opt_fs_fs_agree_7",
      "dimension": "fs_agree",
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
      "prompt_id": "pr_fs_1",
      "prompt_snippet": "I lead a purposeful and meaningful life",
      "dimension": "fs_agree",
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
      "prompt_id": "pr_fs_2",
      "prompt_snippet": "My social relationships are supportive and rewarding",
      "dimension": "fs_agree",
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
      "prompt_id": "pr_fs_3",
      "prompt_snippet": "I am engaged and interested in my daily activities",
      "dimension": "fs_agree",
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
      "prompt_id": "pr_fs_4",
      "prompt_snippet": "I actively contribute to the happiness and well-being of others",
      "dimension": "fs_agree",
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
      "prompt_id": "pr_fs_5",
      "prompt_snippet": "I am competent and capable in the activities that are important to me",
      "dimension": "fs_agree",
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
      "index": 6,
      "prompt_id": "pr_fs_6",
      "prompt_snippet": "I am a good person and live a good life",
      "dimension": "fs_agree",
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
      "index": 7,
      "prompt_id": "pr_fs_7",
      "prompt_snippet": "I am optimistic about my future",
      "dimension": "fs_agree",
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
      "index": 8,
      "prompt_id": "pr_fs_8",
      "prompt_snippet": "People respect me",
      "dimension": "fs_agree",
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

- Items: 8
- Dimensions: fs_agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I lead a purposeful and meaningful life | fs_agree | 7,6,5,4,3,2,1 | no |
| 2 | My social relationships are supportive and rewarding | fs_agree | 7,6,5,4,3,2,1 | no |
| 3 | I am engaged and interested in my daily activities | fs_agree | 7,6,5,4,3,2,1 | no |
| 4 | I actively contribute to the happiness and well-being of others | fs_agree | 7,6,5,4,3,2,1 | no |
| 5 | I am competent and capable in the activities that are important to me | fs_agree | 7,6,5,4,3,2,1 | no |
| 6 | I am a good person and live a good life | fs_agree | 7,6,5,4,3,2,1 | no |
| 7 | I am optimistic about my future | fs_agree | 7,6,5,4,3,2,1 | no |
| 8 | People respect me | fs_agree | 7,6,5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/flourishing-scale.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
