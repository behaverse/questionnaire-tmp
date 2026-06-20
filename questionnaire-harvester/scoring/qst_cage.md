# Scoring — CAGE Alcohol Questionnaire (CAGE) (`qst_cage`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cage",
  "title": "CAGE Alcohol Questionnaire (CAGE)",
  "short_title": "CAGE",
  "source_url": "https://psychology-tools.com/test/cage-alcohol-questionnaire",
  "publication": {
    "citation": "JA Ewing. Detecting Alcoholism. The CAGE Questionnaire. 252(14): 1905-7. The Journal of the American Medical Association. 1984.",
    "year": 1984
  },
  "status": "needs-research",
  "item_count": 4,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_cage_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        1,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Yes",
        "No"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cage_1",
      "prompt_snippet": "Have you ever felt you needed to C ut down on your drinking?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_cage_2",
      "prompt_snippet": "Have people A nnoyed you by criticizing your drinking?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_cage_3",
      "prompt_snippet": "Have you ever felt G uilty about drinking?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_cage_4",
      "prompt_snippet": "Have you ever felt you needed a drink first thing in the morning ( E ye-opener) ",
      "dimension": "rating",
      "values": [
        1,
        0
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
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Have you ever felt you needed to C ut down on your drinking? | rating | 1,0 | no |
| 2 | Have people A nnoyed you by criticizing your drinking? | rating | 1,0 | no |
| 3 | Have you ever felt G uilty about drinking? | rating | 1,0 | no |
| 4 | Have you ever felt you needed a drink first thing in the morning ( E ye-opener)  | rating | 1,0 | no |

## To research (fill from https://psychology-tools.com/test/cage-alcohol-questionnaire)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
