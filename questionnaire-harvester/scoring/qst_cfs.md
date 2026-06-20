# Scoring — Cognitive Flexibility Scale (CFS) (`qst_cfs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cfs",
  "title": "Cognitive Flexibility Scale (CFS)",
  "short_title": "CFS",
  "source_url": "https://us.psytoolkit.org/survey-library/flexibility-cfs.html",
  "publication": {
    "citation": "Martin, M. M. & Rubin, R.B. (1995). A new measure of cognitive flexibility. Psychological Reports, 76 , 623-626. (Download here) .",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_cfs_agree_6",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        6
      ],
      "anchors": [
        "strongly agree",
        "agree",
        "slightly agree",
        "slightly disagree",
        "disagree",
        "strongly disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_cfs_2",
    "pr_cfs_3",
    "pr_cfs_5",
    "pr_cfs_10"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cfs_1",
      "prompt_snippet": "I can communicate an idea in many different ways.",
      "dimension": "agree",
      "values": [
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
      "prompt_id": "pr_cfs_2",
      "prompt_snippet": "I avoid new and unusual situations.",
      "dimension": "agree",
      "values": [
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_cfs_3",
      "prompt_snippet": "I feel like I never get to make decisions.",
      "dimension": "agree",
      "values": [
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_cfs_4",
      "prompt_snippet": "I can find workable solutions to seemingly unsolvable problems.",
      "dimension": "agree",
      "values": [
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
      "prompt_id": "pr_cfs_5",
      "prompt_snippet": "I seldom have choices when deciding how to behave.",
      "dimension": "agree",
      "values": [
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_cfs_6",
      "prompt_snippet": "I am willing to work at creative solutions to problems.",
      "dimension": "agree",
      "values": [
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
      "prompt_id": "pr_cfs_7",
      "prompt_snippet": "In any given situation, I am able to act appropriately.",
      "dimension": "agree",
      "values": [
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
      "prompt_id": "pr_cfs_8",
      "prompt_snippet": "My behavior is a result of conscious decisions that I make.",
      "dimension": "agree",
      "values": [
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
      "index": 9,
      "prompt_id": "pr_cfs_9",
      "prompt_snippet": "I have many possible ways of behaving in any given situation.",
      "dimension": "agree",
      "values": [
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
      "index": 10,
      "prompt_id": "pr_cfs_10",
      "prompt_snippet": "I have difficulty using my knowledge on a given topic in real life situations.",
      "dimension": "agree",
      "values": [
        6,
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_cfs_11",
      "prompt_snippet": "I am willing to listen and consider alternatives for handling a problem.",
      "dimension": "agree",
      "values": [
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
      "index": 12,
      "prompt_id": "pr_cfs_12",
      "prompt_snippet": "I have the self-confidence necessary to try different ways of behaving",
      "dimension": "agree",
      "values": [
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

- Items: 12
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_cfs_2, pr_cfs_3, pr_cfs_5, pr_cfs_10
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can communicate an idea in many different ways. | agree | 6,5,4,3,2,1 | no |
| 2 | I avoid new and unusual situations. | agree | 6,5,4,3,2,1 | yes |
| 3 | I feel like I never get to make decisions. | agree | 6,5,4,3,2,1 | yes |
| 4 | I can find workable solutions to seemingly unsolvable problems. | agree | 6,5,4,3,2,1 | no |
| 5 | I seldom have choices when deciding how to behave. | agree | 6,5,4,3,2,1 | yes |
| 6 | I am willing to work at creative solutions to problems. | agree | 6,5,4,3,2,1 | no |
| 7 | In any given situation, I am able to act appropriately. | agree | 6,5,4,3,2,1 | no |
| 8 | My behavior is a result of conscious decisions that I make. | agree | 6,5,4,3,2,1 | no |
| 9 | I have many possible ways of behaving in any given situation. | agree | 6,5,4,3,2,1 | no |
| 10 | I have difficulty using my knowledge on a given topic in real life situations. | agree | 6,5,4,3,2,1 | yes |
| 11 | I am willing to listen and consider alternatives for handling a problem. | agree | 6,5,4,3,2,1 | no |
| 12 | I have the self-confidence necessary to try different ways of behaving | agree | 6,5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/flexibility-cfs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
