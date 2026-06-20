# Scoring — Rosenberg Self-Esteem Scale (RSES) (`qst_rses`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_rses",
  "title": "Rosenberg Self-Esteem Scale (RSES)",
  "short_title": "RSES",
  "source_url": "https://us.psytoolkit.org/survey-library/self-esteem-rosenberg.html",
  "publication": {
    "citation": "Robins, R.W., Hendin, H.M., and Trzesniewski, K.H. (2001). Measuring\nGlobal Self-Esteem: Construct Validation of a Single-Item Measure\nand the Rosenberg Self-Esteem Scale. Personality and Social\nPsychology Bulletin, 27 , 151-161.",
    "year": 2001
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_rses_agree_4",
      "dimension": "agree",
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
        "strongly agree",
        "agree",
        "disagree",
        "strongly disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_rses_1",
    "pr_rses_3",
    "pr_rses_4",
    "pr_rses_7",
    "pr_rses_10"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_rses_1",
      "prompt_snippet": "On the whole, I am satisfied with myself.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_rses_2",
      "prompt_snippet": "At times, I think I am no good at all.",
      "dimension": "agree",
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
      "prompt_id": "pr_rses_3",
      "prompt_snippet": "I feel that I have a number of good qualities.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_rses_4",
      "prompt_snippet": "I am able to do things as well as most other people.",
      "dimension": "agree",
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
      "prompt_id": "pr_rses_5",
      "prompt_snippet": "I feel I do not have much to be proud of.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_rses_6",
      "prompt_snippet": "I certainly feel useless at times.",
      "dimension": "agree",
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
      "prompt_id": "pr_rses_7",
      "prompt_snippet": "I feel that I’m a person of worth, at least on an equal plane with others.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_rses_8",
      "prompt_snippet": "I wish I could have more respect for myself.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_rses_9",
      "prompt_snippet": "All in all, I am inclined to feel that I am a failure.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_rses_10",
      "prompt_snippet": "I take a positive attitude toward myself.",
      "dimension": "agree",
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

- Items: 10
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_rses_1, pr_rses_3, pr_rses_4, pr_rses_7, pr_rses_10
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | On the whole, I am satisfied with myself. | agree | 0,1,2,3 | yes |
| 2 | At times, I think I am no good at all. | agree | 0,1,2,3 | no |
| 3 | I feel that I have a number of good qualities. | agree | 0,1,2,3 | yes |
| 4 | I am able to do things as well as most other people. | agree | 0,1,2,3 | yes |
| 5 | I feel I do not have much to be proud of. | agree | 0,1,2,3 | no |
| 6 | I certainly feel useless at times. | agree | 0,1,2,3 | no |
| 7 | I feel that I’m a person of worth, at least on an equal plane with others. | agree | 0,1,2,3 | yes |
| 8 | I wish I could have more respect for myself. | agree | 0,1,2,3 | no |
| 9 | All in all, I am inclined to feel that I am a failure. | agree | 0,1,2,3 | no |
| 10 | I take a positive attitude toward myself. | agree | 0,1,2,3 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/self-esteem-rosenberg.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
