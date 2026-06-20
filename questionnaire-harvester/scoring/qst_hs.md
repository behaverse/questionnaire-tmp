# Scoring — Healthy Selfishness (HS) (`qst_hs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hs",
  "title": "Healthy Selfishness (HS)",
  "short_title": "HS",
  "source_url": "https://us.psytoolkit.org/survey-library/healthy-selfishness.html",
  "publication": {
    "citation": "Kaufman, S.B. & Jauk, E. (2020). Healthy Selfishness and Pathological Altruism: Measuring Two Paradoxical Forms of Selfishness. Frontiers in Psychology, 11. Open Access",
    "year": 2020
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "hsagree"
  ],
  "option_scales": [
    {
      "ref": "opt_hs_hsagree_5",
      "dimension": "hsagree",
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
        "Disagree strongly",
        "Disagree",
        "Neither agree nor disagree",
        "Agree",
        "Agree strongly"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hs_1",
      "prompt_snippet": "I have healthy boundaries.",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_2",
      "prompt_snippet": "I have a lot of self-care.",
      "dimension": "hsagree",
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
      "index": 3,
      "prompt_id": "pr_hs_3",
      "prompt_snippet": "I have a healthy dose of self-respect, and don’t let people take advantage of me",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_4",
      "prompt_snippet": "I balance my own needs with the needs of others.",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_5",
      "prompt_snippet": "I advocate for my own needs.",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_6",
      "prompt_snippet": "I have a healthy form of selfishness (e.g., meditation, eating healthy, exercisi",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_7",
      "prompt_snippet": "Even though I give a lot to others, I know when to recharge.",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_8",
      "prompt_snippet": "I give myself permission to enjoy myself, even if it doesn’t necessarily help ot",
      "dimension": "hsagree",
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
      "index": 9,
      "prompt_id": "pr_hs_9",
      "prompt_snippet": "I take good care of myself.",
      "dimension": "hsagree",
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
      "prompt_id": "pr_hs_10",
      "prompt_snippet": "I prioritize my own personal projects over the demands of others.",
      "dimension": "hsagree",
      "values": [
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

- Items: 10
- Dimensions: hsagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have healthy boundaries. | hsagree | 1,2,3,4,5 | no |
| 2 | I have a lot of self-care. | hsagree | 1,2,3,4,5 | no |
| 3 | I have a healthy dose of self-respect, and don’t let people take advantage of me | hsagree | 1,2,3,4,5 | no |
| 4 | I balance my own needs with the needs of others. | hsagree | 1,2,3,4,5 | no |
| 5 | I advocate for my own needs. | hsagree | 1,2,3,4,5 | no |
| 6 | I have a healthy form of selfishness (e.g., meditation, eating healthy, exercisi | hsagree | 1,2,3,4,5 | no |
| 7 | Even though I give a lot to others, I know when to recharge. | hsagree | 1,2,3,4,5 | no |
| 8 | I give myself permission to enjoy myself, even if it doesn’t necessarily help ot | hsagree | 1,2,3,4,5 | no |
| 9 | I take good care of myself. | hsagree | 1,2,3,4,5 | no |
| 10 | I prioritize my own personal projects over the demands of others. | hsagree | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/healthy-selfishness.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
