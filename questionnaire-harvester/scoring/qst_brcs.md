# Scoring — Resilience (BRCS) (`qst_brcs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_brcs",
  "title": "Resilience (BRCS)",
  "short_title": "BRCS",
  "source_url": "https://us.psytoolkit.org/survey-library/resilience-brcs.html",
  "publication": {
    "citation": "Sinclair, V. G., & Wallston, K.A. (2004). The development and psychometric evaluation of the\nBrief Resilient Coping Scale. Assessment, 11 (1) , 94-101.",
    "year": 2004
  },
  "status": "needs-research",
  "item_count": 4,
  "dimensions": [
    "true"
  ],
  "option_scales": [
    {
      "ref": "opt_brcs_true_5",
      "dimension": "true",
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
        "Does <b>not</b> describe me at all",
        "Does not describe me",
        "Neutral",
        "Describes me",
        "Describes me <b>very well</b>"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_brcs_1",
      "prompt_snippet": "I look for creative ways to alter difficult situations.",
      "dimension": "true",
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
      "prompt_id": "pr_brcs_2",
      "prompt_snippet": "Regardless of what happens to me, I believe I can control my reaction to it.",
      "dimension": "true",
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
      "prompt_id": "pr_brcs_3",
      "prompt_snippet": "I believe that I can grow in positive ways by dealing with difficult situations.",
      "dimension": "true",
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
      "prompt_id": "pr_brcs_4",
      "prompt_snippet": "I actively look for ways to replace the losses I encounter in life.",
      "dimension": "true",
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

- Items: 4
- Dimensions: true
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I look for creative ways to alter difficult situations. | true | 1,2,3,4,5 | no |
| 2 | Regardless of what happens to me, I believe I can control my reaction to it. | true | 1,2,3,4,5 | no |
| 3 | I believe that I can grow in positive ways by dealing with difficult situations. | true | 1,2,3,4,5 | no |
| 4 | I actively look for ways to replace the losses I encounter in life. | true | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/resilience-brcs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
