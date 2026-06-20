# Scoring — Mental Health Continuum Short Form (MHC-SF) (`qst_mhcsf`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_mhcsf",
  "title": "Mental Health Continuum Short Form (MHC-SF)",
  "short_title": "MHC-SF",
  "source_url": "https://us.psytoolkit.org/survey-library/mhc-sf.html",
  "publication": {
    "citation": "Keyes, C.L.M. (2006). Mental health in adolescence: Is America’s youth flourishing? American Journal of Orthopsychiatry, 76 , 395–402.",
    "year": 2006
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "mhcagree"
  ],
  "option_scales": [
    {
      "ref": "opt_mhcsf_mhcagree_6",
      "dimension": "mhcagree",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        0,
        5
      ],
      "anchors": [
        "Never",
        "Once or Twice",
        "About once a week",
        "About 2 or 3 times a week",
        "Almost every day",
        "Every day"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_mhcsf_1",
      "prompt_snippet": "happy",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_2",
      "prompt_snippet": "interested in life",
      "dimension": "mhcagree",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_mhcsf_3",
      "prompt_snippet": "satisfied with life",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_4",
      "prompt_snippet": "that you had something important to contribute to society",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_5",
      "prompt_snippet": "that you belonged to a community (like a social group, or your neighborhood)",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_6",
      "prompt_snippet": "that our society is a good place, or is becoming a better place, for all people",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_7",
      "prompt_snippet": "that people are basically good",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_8",
      "prompt_snippet": "that the way our society works makes sense to you",
      "dimension": "mhcagree",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_mhcsf_9",
      "prompt_snippet": "that you liked most parts of your personality",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_10",
      "prompt_snippet": "good at managing the responsibilities of your daily life",
      "dimension": "mhcagree",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_mhcsf_11",
      "prompt_snippet": "that you had warm and trusting relationships with others",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_12",
      "prompt_snippet": "that you had experiences that challenged you to grow and become a better person",
      "dimension": "mhcagree",
      "values": [
        0,
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
      "prompt_id": "pr_mhcsf_13",
      "prompt_snippet": "confident to think or express your own ideas and opinions",
      "dimension": "mhcagree",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_mhcsf_14",
      "prompt_snippet": "that your life has a sense of direction or meaning to it",
      "dimension": "mhcagree",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
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

- Items: 14
- Dimensions: mhcagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | happy | mhcagree | 0,1,2,3,4,5 | no |
| 2 | interested in life | mhcagree | 0,1,2,3,4,5 | no |
| 3 | satisfied with life | mhcagree | 0,1,2,3,4,5 | no |
| 4 | that you had something important to contribute to society | mhcagree | 0,1,2,3,4,5 | no |
| 5 | that you belonged to a community (like a social group, or your neighborhood) | mhcagree | 0,1,2,3,4,5 | no |
| 6 | that our society is a good place, or is becoming a better place, for all people | mhcagree | 0,1,2,3,4,5 | no |
| 7 | that people are basically good | mhcagree | 0,1,2,3,4,5 | no |
| 8 | that the way our society works makes sense to you | mhcagree | 0,1,2,3,4,5 | no |
| 9 | that you liked most parts of your personality | mhcagree | 0,1,2,3,4,5 | no |
| 10 | good at managing the responsibilities of your daily life | mhcagree | 0,1,2,3,4,5 | no |
| 11 | that you had warm and trusting relationships with others | mhcagree | 0,1,2,3,4,5 | no |
| 12 | that you had experiences that challenged you to grow and become a better person | mhcagree | 0,1,2,3,4,5 | no |
| 13 | confident to think or express your own ideas and opinions | mhcagree | 0,1,2,3,4,5 | no |
| 14 | that your life has a sense of direction or meaning to it | mhcagree | 0,1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/mhc-sf.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
