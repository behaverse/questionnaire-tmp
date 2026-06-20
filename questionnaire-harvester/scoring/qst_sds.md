# Scoring — Zung Self-Rating Depression Scale (SDS) (`qst_sds`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sds",
  "title": "Zung Self-Rating Depression Scale (SDS)",
  "short_title": "SDS",
  "source_url": "https://psychology-tools.com/test/zung-depression-scale",
  "publication": {
    "citation": "William W K Zung. A Self-Rating Depression Scale. 12: Arch Gen Psychiatry 63-70. 1965.",
    "year": 1965
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_sds_rating_1",
      "dimension": "rating",
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
        "A Little Of The Time",
        "Some Of The Time",
        "Good Part Of The Time",
        "Most Of The Time"
      ]
    },
    {
      "ref": "opt_sds_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "A Little Of The Time",
        "Some Of The Time",
        "Good Part Of The Time",
        "Most Of The Time"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sds_1",
      "prompt_snippet": "I feel down hearted and blue.",
      "dimension": "rating",
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
      "prompt_id": "pr_sds_2",
      "prompt_snippet": "Morning is when I feel the best.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_sds_3",
      "prompt_snippet": "I have crying spells or feel like it.",
      "dimension": "rating",
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
      "prompt_id": "pr_sds_4",
      "prompt_snippet": "I have trouble sleeping at night.",
      "dimension": "rating",
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
      "prompt_id": "pr_sds_5",
      "prompt_snippet": "I eat as much as I used to.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_sds_6",
      "prompt_snippet": "I still enjoy sex.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_sds_7",
      "prompt_snippet": "I notice that I am losing weight.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_sds_8",
      "prompt_snippet": "I have trouble with constipation.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_sds_9",
      "prompt_snippet": "My heart beats faster than usual.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_sds_10",
      "prompt_snippet": "I get tired for no reason.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_sds_11",
      "prompt_snippet": "My mind is as clear as it used to be.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_sds_12",
      "prompt_snippet": "I find it easy to do the things I used to.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_sds_13",
      "prompt_snippet": "I am restless and can’t keep still.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_sds_14",
      "prompt_snippet": "I feel hopeful about the future.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_sds_15",
      "prompt_snippet": "I am more irritable than usual.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_sds_16",
      "prompt_snippet": "I find it easy to make decisions.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_sds_17",
      "prompt_snippet": "I feel that I am useful and needed.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_sds_18",
      "prompt_snippet": "My life is pretty full.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_sds_19",
      "prompt_snippet": "I feel that others would be better off if I were dead.",
      "dimension": "rating",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_sds_20",
      "prompt_snippet": "I still enjoy the things I used to do.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1
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

- Items: 20
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I feel down hearted and blue. | rating | 1,2,3,4 | no |
| 2 | Morning is when I feel the best. | rating | 4,3,2,1 | no |
| 3 | I have crying spells or feel like it. | rating | 1,2,3,4 | no |
| 4 | I have trouble sleeping at night. | rating | 1,2,3,4 | no |
| 5 | I eat as much as I used to. | rating | 4,3,2,1 | no |
| 6 | I still enjoy sex. | rating | 4,3,2,1 | no |
| 7 | I notice that I am losing weight. | rating | 1,2,3,4 | no |
| 8 | I have trouble with constipation. | rating | 1,2,3,4 | no |
| 9 | My heart beats faster than usual. | rating | 1,2,3,4 | no |
| 10 | I get tired for no reason. | rating | 1,2,3,4 | no |
| 11 | My mind is as clear as it used to be. | rating | 4,3,2,1 | no |
| 12 | I find it easy to do the things I used to. | rating | 4,3,2,1 | no |
| 13 | I am restless and can’t keep still. | rating | 1,2,3,4 | no |
| 14 | I feel hopeful about the future. | rating | 4,3,2,1 | no |
| 15 | I am more irritable than usual. | rating | 1,2,3,4 | no |
| 16 | I find it easy to make decisions. | rating | 4,3,2,1 | no |
| 17 | I feel that I am useful and needed. | rating | 4,3,2,1 | no |
| 18 | My life is pretty full. | rating | 4,3,2,1 | no |
| 19 | I feel that others would be better off if I were dead. | rating | 1,2,3,4 | no |
| 20 | I still enjoy the things I used to do. | rating | 4,3,2,1 | no |

## To research (fill from https://psychology-tools.com/test/zung-depression-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
