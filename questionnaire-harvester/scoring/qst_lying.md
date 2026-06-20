# Scoring — Lying in Everyday Situations Scale (LiES) (`qst_lying`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_lying",
  "title": "Lying in Everyday Situations Scale (LiES)",
  "short_title": "LiES",
  "source_url": "https://us.psytoolkit.org/survey-library/everyday-lying.html",
  "publication": {
    "citation": "Christian L. Hart, Jelisa M. Jones, John A. Terrizzi, Drew A. Curtis. (2019). Development of the Lying in Everyday Situations Scale. The American Journal of Psychology, 132 (3) , 343-352. doi: https://doi.org/10.5406/amerjpsyc.132.3.0343 . Download for free",
    "year": 2019
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_lying_agree_7",
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
        "Strongly *disagree*<br>1",
        "<br><br>2",
        "<br><br>3",
        "Neither agree nor disagree<br>4",
        "<br><br>5",
        "<br><br>6",
        "Strongly *agree*<br>7"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_lying_1",
      "prompt_snippet": "I lie in order to escape conflicts or disagreements with other people.",
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
      "prompt_id": "pr_lying_2",
      "prompt_snippet": "I lie to hide the bad things I've done.",
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
      "prompt_id": "pr_lying_3",
      "prompt_snippet": "I tell lies so I will not have confrontations with people.",
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
      "prompt_id": "pr_lying_4",
      "prompt_snippet": "I lie in order to hide shameful things about myself.",
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
      "prompt_id": "pr_lying_5",
      "prompt_snippet": "I lie to stay out of arguments with people.",
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
      "prompt_id": "pr_lying_6",
      "prompt_snippet": "I lie in order to be friendly and cordial with others.",
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
      "prompt_id": "pr_lying_7",
      "prompt_snippet": "I tell lies in order to spare another's feelings.",
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
      "prompt_id": "pr_lying_8",
      "prompt_snippet": "I lie in order to punish people.",
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
      "index": 9,
      "prompt_id": "pr_lying_9",
      "prompt_snippet": "I lie in order to take people down.",
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
      "index": 10,
      "prompt_id": "pr_lying_10",
      "prompt_snippet": "I lie for revenge.",
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
      "index": 11,
      "prompt_id": "pr_lying_11",
      "prompt_snippet": "I use lies to attack people I don't like.",
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
      "index": 12,
      "prompt_id": "pr_lying_12",
      "prompt_snippet": "I tell lies in order to hurt, annoy, or upset others.",
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
      "index": 13,
      "prompt_id": "pr_lying_13",
      "prompt_snippet": "I lie because it is exciting.",
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
      "index": 14,
      "prompt_id": "pr_lying_14",
      "prompt_snippet": "I lie to people because it is amusing.",
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

- Items: 14
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I lie in order to escape conflicts or disagreements with other people. | agree | 1,2,3,4,5,6,7 | no |
| 2 | I lie to hide the bad things I've done. | agree | 1,2,3,4,5,6,7 | no |
| 3 | I tell lies so I will not have confrontations with people. | agree | 1,2,3,4,5,6,7 | no |
| 4 | I lie in order to hide shameful things about myself. | agree | 1,2,3,4,5,6,7 | no |
| 5 | I lie to stay out of arguments with people. | agree | 1,2,3,4,5,6,7 | no |
| 6 | I lie in order to be friendly and cordial with others. | agree | 1,2,3,4,5,6,7 | no |
| 7 | I tell lies in order to spare another's feelings. | agree | 1,2,3,4,5,6,7 | no |
| 8 | I lie in order to punish people. | agree | 1,2,3,4,5,6,7 | no |
| 9 | I lie in order to take people down. | agree | 1,2,3,4,5,6,7 | no |
| 10 | I lie for revenge. | agree | 1,2,3,4,5,6,7 | no |
| 11 | I use lies to attack people I don't like. | agree | 1,2,3,4,5,6,7 | no |
| 12 | I tell lies in order to hurt, annoy, or upset others. | agree | 1,2,3,4,5,6,7 | no |
| 13 | I lie because it is exciting. | agree | 1,2,3,4,5,6,7 | no |
| 14 | I lie to people because it is amusing. | agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/everyday-lying.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
