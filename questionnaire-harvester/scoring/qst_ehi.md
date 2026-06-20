# Scoring — The Edinburgh Handedness Inventory (short form) (`qst_ehi`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ehi",
  "title": "The Edinburgh Handedness Inventory (short form)",
  "short_title": "short form",
  "source_url": "https://us.psytoolkit.org/survey-library/handedness-ehi.html",
  "publication": {
    "citation": "Oldfield, R.C. (1971). The assessment and analysis of handedness: The Edinburgh inventory. Neuropsychologia, 9 , 97-113.",
    "year": 1971
  },
  "status": "needs-research",
  "item_count": 4,
  "dimensions": [
    "side"
  ],
  "option_scales": [
    {
      "ref": "opt_ehi_side_5",
      "dimension": "side",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        -100,
        -50,
        0,
        50,
        100
      ],
      "value_range": [
        -100,
        100
      ],
      "anchors": [
        "Always left",
        "Usually left",
        "Both equally",
        "Usually right",
        "Always right"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ehi_1",
      "prompt_snippet": "Writing",
      "dimension": "side",
      "values": [
        -100,
        -50,
        0,
        50,
        100
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_ehi_2",
      "prompt_snippet": "Throwing",
      "dimension": "side",
      "values": [
        -100,
        -50,
        0,
        50,
        100
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_ehi_3",
      "prompt_snippet": "Toothbrush",
      "dimension": "side",
      "values": [
        -100,
        -50,
        0,
        50,
        100
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_ehi_4",
      "prompt_snippet": "Spoon",
      "dimension": "side",
      "values": [
        -100,
        -50,
        0,
        50,
        100
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
- Dimensions: side
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Writing | side | -100,-50,0,50,100 | no |
| 2 | Throwing | side | -100,-50,0,50,100 | no |
| 3 | Toothbrush | side | -100,-50,0,50,100 | no |
| 4 | Spoon | side | -100,-50,0,50,100 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/handedness-ehi.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
