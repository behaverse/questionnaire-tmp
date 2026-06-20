# Scoring — Major Depression Inventory (MDI) (`qst_mdi`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_mdi",
  "title": "Major Depression Inventory (MDI)",
  "short_title": "MDI",
  "source_url": "https://psychology-tools.com/test/major-depression-inventory",
  "publication": null,
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_mdi_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        5
      ],
      "anchors": [
        "All The Time",
        "Most Of The Time",
        "Slightly More Than Half The Time",
        "Slightly Less Than Half The Time",
        "Some Of The Time",
        "At No Time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_mdi_1",
      "prompt_snippet": "Have you felt low in spirits or sad?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_mdi_2",
      "prompt_snippet": "Have you lost interest in your daily activities?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_mdi_3",
      "prompt_snippet": "Have you felt lacking in energy and strength?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_mdi_4",
      "prompt_snippet": "Have you felt less self-confident?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_mdi_5",
      "prompt_snippet": "Have you had a bad conscience or feelings of guilt?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_mdi_6",
      "prompt_snippet": "Have you felt that life wasn’t worth living?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_mdi_7",
      "prompt_snippet": "Have you had difficulty in concentrating?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_mdi_8",
      "prompt_snippet": "Have you felt very restless?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_mdi_9",
      "prompt_snippet": "Have you felt subdued or slowed down?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_mdi_10",
      "prompt_snippet": "Have you had trouble sleeping at night?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_mdi_11",
      "prompt_snippet": "Have you suffered from reduced appetite?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_mdi_12",
      "prompt_snippet": "Have you suffered from increased appetite?",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
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

- Items: 12
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Have you felt low in spirits or sad? | rating | 5,4,3,2,1,0 | no |
| 2 | Have you lost interest in your daily activities? | rating | 5,4,3,2,1,0 | no |
| 3 | Have you felt lacking in energy and strength? | rating | 5,4,3,2,1,0 | no |
| 4 | Have you felt less self-confident? | rating | 5,4,3,2,1,0 | no |
| 5 | Have you had a bad conscience or feelings of guilt? | rating | 5,4,3,2,1,0 | no |
| 6 | Have you felt that life wasn’t worth living? | rating | 5,4,3,2,1,0 | no |
| 7 | Have you had difficulty in concentrating? | rating | 5,4,3,2,1,0 | no |
| 8 | Have you felt very restless? | rating | 5,4,3,2,1,0 | no |
| 9 | Have you felt subdued or slowed down? | rating | 5,4,3,2,1,0 | no |
| 10 | Have you had trouble sleeping at night? | rating | 5,4,3,2,1,0 | no |
| 11 | Have you suffered from reduced appetite? | rating | 5,4,3,2,1,0 | no |
| 12 | Have you suffered from increased appetite? | rating | 5,4,3,2,1,0 | no |

## To research (fill from https://psychology-tools.com/test/major-depression-inventory)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
