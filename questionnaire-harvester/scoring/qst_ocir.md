# Scoring — Obsessive Compulsive Inventory - Revised (OCI-R) (`qst_ocir`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ocir",
  "title": "Obsessive Compulsive Inventory - Revised (OCI-R)",
  "short_title": "OCI-R",
  "source_url": "https://psychology-tools.com/test/obsessive-compulsive-inventory-revised",
  "publication": {
    "citation": "EB Foa, Huppert JD, S Leiberg, G Hajcak, R Langner, et al. The Obsessive Compulsive Inventory: Development and validation of a short version. 14 Psychological Assessment 485-496 ( 2002 ).",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_ocir_rating_1",
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
        "Not at all",
        "A little",
        "Moderately",
        "A lot",
        "Extremely"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ocir_1",
      "prompt_snippet": "I have saved up so many things that they get in the way.",
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
      "prompt_id": "pr_ocir_2",
      "prompt_snippet": "I check things more often than necessary.",
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
      "prompt_id": "pr_ocir_3",
      "prompt_snippet": "I get upset if objects are not arranged properly.",
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
      "prompt_id": "pr_ocir_4",
      "prompt_snippet": "I feel compelled to count while I am doing things.",
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
      "prompt_id": "pr_ocir_5",
      "prompt_snippet": "I find it difficult to touch an object when I know it has been touched by strang",
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
      "prompt_id": "pr_ocir_6",
      "prompt_snippet": "I find it difficult to control my own thoughts.",
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
      "prompt_id": "pr_ocir_7",
      "prompt_snippet": "I collect things I don’t need.",
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
      "prompt_id": "pr_ocir_8",
      "prompt_snippet": "I repeatedly check doors, windows, drawers, etc.",
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
      "prompt_id": "pr_ocir_9",
      "prompt_snippet": "I get upset if others change the way I have arranged things.",
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
      "prompt_id": "pr_ocir_10",
      "prompt_snippet": "I feel I have to repeat certain numbers.",
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
      "prompt_id": "pr_ocir_11",
      "prompt_snippet": "I sometimes have to wash or clean myself simply because I feel contaminated.",
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
      "prompt_id": "pr_ocir_12",
      "prompt_snippet": "I am upset by unpleasant thoughts that come into my mind against my will.",
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
      "prompt_id": "pr_ocir_13",
      "prompt_snippet": "I avoid throwing things away because I am afraid I might need them later.",
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
      "prompt_id": "pr_ocir_14",
      "prompt_snippet": "I repeatedly check gas and water taps and light switches after turning them off.",
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
      "prompt_id": "pr_ocir_15",
      "prompt_snippet": "I need things to be arranged in a particular way.",
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
      "prompt_id": "pr_ocir_16",
      "prompt_snippet": "I feel that there are good and bad numbers.",
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
      "prompt_id": "pr_ocir_17",
      "prompt_snippet": "I wash my hands more often and longer than necessary.",
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
      "prompt_id": "pr_ocir_18",
      "prompt_snippet": "I frequently get nasty thoughts and have difficulty in getting rid of them.",
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

- Items: 18
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have saved up so many things that they get in the way. | rating | 0,1,2,3,4 | no |
| 2 | I check things more often than necessary. | rating | 0,1,2,3,4 | no |
| 3 | I get upset if objects are not arranged properly. | rating | 0,1,2,3,4 | no |
| 4 | I feel compelled to count while I am doing things. | rating | 0,1,2,3,4 | no |
| 5 | I find it difficult to touch an object when I know it has been touched by strang | rating | 0,1,2,3,4 | no |
| 6 | I find it difficult to control my own thoughts. | rating | 0,1,2,3,4 | no |
| 7 | I collect things I don’t need. | rating | 0,1,2,3,4 | no |
| 8 | I repeatedly check doors, windows, drawers, etc. | rating | 0,1,2,3,4 | no |
| 9 | I get upset if others change the way I have arranged things. | rating | 0,1,2,3,4 | no |
| 10 | I feel I have to repeat certain numbers. | rating | 0,1,2,3,4 | no |
| 11 | I sometimes have to wash or clean myself simply because I feel contaminated. | rating | 0,1,2,3,4 | no |
| 12 | I am upset by unpleasant thoughts that come into my mind against my will. | rating | 0,1,2,3,4 | no |
| 13 | I avoid throwing things away because I am afraid I might need them later. | rating | 0,1,2,3,4 | no |
| 14 | I repeatedly check gas and water taps and light switches after turning them off. | rating | 0,1,2,3,4 | no |
| 15 | I need things to be arranged in a particular way. | rating | 0,1,2,3,4 | no |
| 16 | I feel that there are good and bad numbers. | rating | 0,1,2,3,4 | no |
| 17 | I wash my hands more often and longer than necessary. | rating | 0,1,2,3,4 | no |
| 18 | I frequently get nasty thoughts and have difficulty in getting rid of them. | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/obsessive-compulsive-inventory-revised)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
