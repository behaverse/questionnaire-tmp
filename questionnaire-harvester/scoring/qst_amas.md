# Scoring — Abbreviated Math Anxiety Scale (AMAS) (`qst_amas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_amas",
  "title": "Abbreviated Math Anxiety Scale (AMAS)",
  "short_title": "AMAS",
  "source_url": "https://us.psytoolkit.org/survey-library/math-anxiety-amas.html",
  "publication": {
    "citation": "D.R. Hopko, R. Mahadevan, R.L. Bare, & Melassa K. Hunt. (2003). The\nAbbreviated Math Anxiety Scale (AMAS): Construction, Validity, and\nReliability. Assessment, 10 , 178-182.",
    "year": 2003
  },
  "status": "needs-research",
  "item_count": 9,
  "dimensions": [
    "amas_scale"
  ],
  "option_scales": [
    {
      "ref": "opt_amas_amas_scale_5",
      "dimension": "amas_scale",
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
        "Low Anxiety",
        "Some Anxiety",
        "Moderate Anxiety",
        "Quite a bit of Anxiety",
        "High Anxiety"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_amas_1",
      "prompt_snippet": "Having to use the tables in the back of a mathematics book.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_2",
      "prompt_snippet": "Thinking about an upcoming mathematics test one day before.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_3",
      "prompt_snippet": "Watching a teacher work an algebraic equation on the blackboard.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_4",
      "prompt_snippet": "Taking an examination in a mathematics course.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_5",
      "prompt_snippet": "Being given a homework assignment of many difficult problems which is due the ne",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_6",
      "prompt_snippet": "Listening to a lecture in mathematics class.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_7",
      "prompt_snippet": "Listening to another student explain a mathematics formula.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_8",
      "prompt_snippet": "Being given a “pop” quiz in a mathematics class.",
      "dimension": "amas_scale",
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
      "prompt_id": "pr_amas_9",
      "prompt_snippet": "Starting a new chapter in a mathematics book.",
      "dimension": "amas_scale",
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

- Items: 9
- Dimensions: amas_scale
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Having to use the tables in the back of a mathematics book. | amas_scale | 1,2,3,4,5 | no |
| 2 | Thinking about an upcoming mathematics test one day before. | amas_scale | 1,2,3,4,5 | no |
| 3 | Watching a teacher work an algebraic equation on the blackboard. | amas_scale | 1,2,3,4,5 | no |
| 4 | Taking an examination in a mathematics course. | amas_scale | 1,2,3,4,5 | no |
| 5 | Being given a homework assignment of many difficult problems which is due the ne | amas_scale | 1,2,3,4,5 | no |
| 6 | Listening to a lecture in mathematics class. | amas_scale | 1,2,3,4,5 | no |
| 7 | Listening to another student explain a mathematics formula. | amas_scale | 1,2,3,4,5 | no |
| 8 | Being given a “pop” quiz in a mathematics class. | amas_scale | 1,2,3,4,5 | no |
| 9 | Starting a new chapter in a mathematics book. | amas_scale | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/math-anxiety-amas.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
