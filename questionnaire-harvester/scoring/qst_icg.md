# Scoring — Inventory of Complicated Grief (ICG) (`qst_icg`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_icg",
  "title": "Inventory of Complicated Grief (ICG)",
  "short_title": "ICG",
  "source_url": "https://psychology-tools.com/test/inventory-complicated-grief",
  "publication": {
    "citation": "Prigerson H G, Maciejewski P K, Reynolds C F 3rd, et al. Inventory of Complicated Grief: A Scale to Measure Maladaptive Symptoms of Loss. 59 ( 1 ): Psychiatry Res 65 - 79 ( 1995 ).",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 19,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_icg_rating_1",
      "dimension": "rating",
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
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_icg_1",
      "prompt_snippet": "I think about this person so much that it’s hard for me to do the things I norma",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_2",
      "prompt_snippet": "Memories of the person who died upset me",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_3",
      "prompt_snippet": "I feel I cannot accept the death of the person who died",
      "dimension": "rating",
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
      "index": 4,
      "prompt_id": "pr_icg_4",
      "prompt_snippet": "I feel myself longing for the person who died",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_5",
      "prompt_snippet": "I feel drawn to places and things associated with the person who died",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_6",
      "prompt_snippet": "I can’t help feeling angry about his/her death",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_7",
      "prompt_snippet": "I feel disbelief over what happened",
      "dimension": "rating",
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
      "index": 8,
      "prompt_id": "pr_icg_8",
      "prompt_snippet": "I feel stunned or dazed over what happened",
      "dimension": "rating",
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
      "prompt_id": "pr_icg_9",
      "prompt_snippet": "Ever since he/she died, it is hard for me to trust people...",
      "dimension": "rating",
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
      "index": 10,
      "prompt_id": "pr_icg_10",
      "prompt_snippet": "Ever since he/she died, I feel as if I have lost the ability to care about other",
      "dimension": "rating",
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
      "index": 11,
      "prompt_id": "pr_icg_11",
      "prompt_snippet": "I feel lonely a great deal of the time ever since he/she died",
      "dimension": "rating",
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
      "index": 12,
      "prompt_id": "pr_icg_12",
      "prompt_snippet": "I have pain in the same area of my body or have some of the same symptoms as the",
      "dimension": "rating",
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
      "index": 13,
      "prompt_id": "pr_icg_13",
      "prompt_snippet": "I got out of my way to avoid reminders of the person who died",
      "dimension": "rating",
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
      "index": 14,
      "prompt_id": "pr_icg_14",
      "prompt_snippet": "I feel that life is empty without the person who died",
      "dimension": "rating",
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
      "index": 15,
      "prompt_id": "pr_icg_15",
      "prompt_snippet": "I hear the voice of the person who died speak to me",
      "dimension": "rating",
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
      "index": 16,
      "prompt_id": "pr_icg_16",
      "prompt_snippet": "I see the person who died stand before me",
      "dimension": "rating",
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
      "index": 17,
      "prompt_id": "pr_icg_17",
      "prompt_snippet": "I feel that is is unfair that I should live when this person died",
      "dimension": "rating",
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
      "index": 18,
      "prompt_id": "pr_icg_18",
      "prompt_snippet": "I feel bitter over this person’s death",
      "dimension": "rating",
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
      "index": 19,
      "prompt_id": "pr_icg_19",
      "prompt_snippet": "I feel envious of other who have not lost someone close",
      "dimension": "rating",
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

- Items: 19
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I think about this person so much that it’s hard for me to do the things I norma | rating | 0,1,2,3,4 | no |
| 2 | Memories of the person who died upset me | rating | 0,1,2,3,4 | no |
| 3 | I feel I cannot accept the death of the person who died | rating | 0,1,2,3,4 | no |
| 4 | I feel myself longing for the person who died | rating | 0,1,2,3,4 | no |
| 5 | I feel drawn to places and things associated with the person who died | rating | 0,1,2,3,4 | no |
| 6 | I can’t help feeling angry about his/her death | rating | 0,1,2,3,4 | no |
| 7 | I feel disbelief over what happened | rating | 0,1,2,3,4 | no |
| 8 | I feel stunned or dazed over what happened | rating | 0,1,2,3,4 | no |
| 9 | Ever since he/she died, it is hard for me to trust people... | rating | 0,1,2,3,4 | no |
| 10 | Ever since he/she died, I feel as if I have lost the ability to care about other | rating | 0,1,2,3,4 | no |
| 11 | I feel lonely a great deal of the time ever since he/she died | rating | 0,1,2,3,4 | no |
| 12 | I have pain in the same area of my body or have some of the same symptoms as the | rating | 0,1,2,3,4 | no |
| 13 | I got out of my way to avoid reminders of the person who died | rating | 0,1,2,3,4 | no |
| 14 | I feel that life is empty without the person who died | rating | 0,1,2,3,4 | no |
| 15 | I hear the voice of the person who died speak to me | rating | 0,1,2,3,4 | no |
| 16 | I see the person who died stand before me | rating | 0,1,2,3,4 | no |
| 17 | I feel that is is unfair that I should live when this person died | rating | 0,1,2,3,4 | no |
| 18 | I feel bitter over this person’s death | rating | 0,1,2,3,4 | no |
| 19 | I feel envious of other who have not lost someone close | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/inventory-complicated-grief)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
