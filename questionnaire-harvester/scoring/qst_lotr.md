# Scoring — Optimism (LOT-R) (`qst_lotr`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_lotr",
  "title": "Optimism (LOT-R)",
  "short_title": "LOT-R",
  "source_url": "https://us.psytoolkit.org/survey-library/optimism-lotr.html",
  "publication": {
    "citation": "Scheier, M. F., & Carver, C. S. (1992). Effects of optimism on psychological and physical well-being:\nTheoretical overview and empirical update. Cognitive Therapy and Research, 16 , 201-228.",
    "year": 1992
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_lotr_agree_5",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "strongly disagree",
        "disagree",
        "neutral",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_lotr_3",
    "pr_lotr_7",
    "pr_lotr_9"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_lotr_1",
      "prompt_snippet": "In uncertain times, I usually expect the best.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_lotr_2",
      "prompt_snippet": "It's easy for me to relax.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_lotr_3",
      "prompt_snippet": "If something can go wrong for me, it will.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_lotr_4",
      "prompt_snippet": "I'm always optimistic about my future.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_lotr_5",
      "prompt_snippet": "I enjoy my friends a lot.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_lotr_6",
      "prompt_snippet": "It's important for me to keep busy.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_lotr_7",
      "prompt_snippet": "I hardly ever expect things to go my way.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_lotr_8",
      "prompt_snippet": "I don't get upset too easily.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_lotr_9",
      "prompt_snippet": "I rarely count on good things happening to me.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_lotr_10",
      "prompt_snippet": "Overall, I expect more good things to happen to me than bad.",
      "dimension": "agree",
      "values": [
        0,
        1,
        2,
        3,
        4
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
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_lotr_3, pr_lotr_7, pr_lotr_9
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In uncertain times, I usually expect the best. | agree | 0,1,2,3,4 | no |
| 2 | It's easy for me to relax. | agree | 0,1,2,3,4 | no |
| 3 | If something can go wrong for me, it will. | agree | 0,1,2,3,4 | yes |
| 4 | I'm always optimistic about my future. | agree | 0,1,2,3,4 | no |
| 5 | I enjoy my friends a lot. | agree | 0,1,2,3,4 | no |
| 6 | It's important for me to keep busy. | agree | 0,1,2,3,4 | no |
| 7 | I hardly ever expect things to go my way. | agree | 0,1,2,3,4 | yes |
| 8 | I don't get upset too easily. | agree | 0,1,2,3,4 | no |
| 9 | I rarely count on good things happening to me. | agree | 0,1,2,3,4 | yes |
| 10 | Overall, I expect more good things to happen to me than bad. | agree | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/optimism-lotr.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
