# Scoring — Problems with executive control (webexec) (`qst_webexec`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_webexec",
  "title": "Problems with executive control (webexec)",
  "short_title": "webexec",
  "source_url": "https://us.psytoolkit.org/survey-library/webexec.html",
  "publication": {
    "citation": "Buchanan, T., Heffernan, T. M., Parrott, A. C., Ling, J., Rodgers, J., & Scholey, A. B. (2010). A short self-report measure of problems with executive function suitable for administration via the Internet. Behavior Research Methods, 42 , 709-714.",
    "year": 2010
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "problems"
  ],
  "option_scales": [
    {
      "ref": "opt_webexec_problems_4",
      "dimension": "problems",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "no problems experienced",
        "a few problems experienced",
        "more than a few problems experienced",
        "a great many problems experienced"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_webexec_1",
      "prompt_snippet": "Do you find it difficult to keep your attention on a particular task?",
      "dimension": "problems",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_webexec_2",
      "prompt_snippet": "Do you find yourself having problems concentrating on a task?",
      "dimension": "problems",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_webexec_3",
      "prompt_snippet": "Do you have difficulty carrying out more than one task at a time?",
      "dimension": "problems",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_webexec_4",
      "prompt_snippet": "Do you tend to “lose” your train of thoughts?",
      "dimension": "problems",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_webexec_5",
      "prompt_snippet": "Do you have difficulty seeing through something that you have started?",
      "dimension": "problems",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_webexec_6",
      "prompt_snippet": "Do you find yourself acting on “impulse”?",
      "dimension": "problems",
      "values": [
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

- Items: 6
- Dimensions: problems
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Do you find it difficult to keep your attention on a particular task? | problems | 1,2,3,4 | no |
| 2 | Do you find yourself having problems concentrating on a task? | problems | 1,2,3,4 | no |
| 3 | Do you have difficulty carrying out more than one task at a time? | problems | 1,2,3,4 | no |
| 4 | Do you tend to “lose” your train of thoughts? | problems | 1,2,3,4 | no |
| 5 | Do you have difficulty seeing through something that you have started? | problems | 1,2,3,4 | no |
| 6 | Do you find yourself acting on “impulse”? | problems | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/webexec.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
