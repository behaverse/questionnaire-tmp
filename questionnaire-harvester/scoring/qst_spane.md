# Scoring — Scale of Positive and Negative Experience (SPANE) (`qst_spane`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_spane",
  "title": "Scale of Positive and Negative Experience (SPANE)",
  "short_title": "SPANE",
  "source_url": "https://us.psytoolkit.org/survey-library/spane.html",
  "publication": {
    "citation": "Diener, E., Wirtz, D., Tov, W., Kim-Prieto, C., Choi. D., Oishi, S.,\n& Biswas-Diener, R. (2009). New measures of well-being: Flourishing\nand positive and negative feelings. Social Indicators Research,\n39 ,\n247-266. Online\navailable here .",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "howoften"
  ],
  "option_scales": [
    {
      "ref": "opt_spane_howoften_5",
      "dimension": "howoften",
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
        "Very Rarely or Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very Often or Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_spane_1",
      "prompt_snippet": "Positive",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_2",
      "prompt_snippet": "Negative",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_3",
      "prompt_snippet": "Good",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_4",
      "prompt_snippet": "Bad",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_5",
      "prompt_snippet": "Pleasant",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_6",
      "prompt_snippet": "Unpleasant",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_7",
      "prompt_snippet": "Happy",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_8",
      "prompt_snippet": "Sad",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_9",
      "prompt_snippet": "Afraid",
      "dimension": "howoften",
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
      "prompt_id": "pr_spane_10",
      "prompt_snippet": "Joyful",
      "dimension": "howoften",
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
      "index": 11,
      "prompt_id": "pr_spane_11",
      "prompt_snippet": "Angry",
      "dimension": "howoften",
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
      "index": 12,
      "prompt_id": "pr_spane_12",
      "prompt_snippet": "Contented",
      "dimension": "howoften",
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

- Items: 12
- Dimensions: howoften
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Positive | howoften | 1,2,3,4,5 | no |
| 2 | Negative | howoften | 1,2,3,4,5 | no |
| 3 | Good | howoften | 1,2,3,4,5 | no |
| 4 | Bad | howoften | 1,2,3,4,5 | no |
| 5 | Pleasant | howoften | 1,2,3,4,5 | no |
| 6 | Unpleasant | howoften | 1,2,3,4,5 | no |
| 7 | Happy | howoften | 1,2,3,4,5 | no |
| 8 | Sad | howoften | 1,2,3,4,5 | no |
| 9 | Afraid | howoften | 1,2,3,4,5 | no |
| 10 | Joyful | howoften | 1,2,3,4,5 | no |
| 11 | Angry | howoften | 1,2,3,4,5 | no |
| 12 | Contented | howoften | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/spane.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
