# Scoring — Relationship satisfaction (PN-SMD) (`qst_pnsmd`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pnsmd",
  "title": "Relationship satisfaction (PN-SMD)",
  "short_title": "PN-SMD",
  "source_url": "https://us.psytoolkit.org/survey-library/relationship-satisfaction-pnsmd.html",
  "publication": {
    "citation": "Mattson, R. E., Rogge, R. D., Johnson, M. D., Davidson, E. K. B., & Fincham, F. D. (2013). The positive and negative semantic dimensions of relationship satisfaction. Personal Relationships, 20 , 328-355.",
    "year": 2013
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "howmuch"
  ],
  "option_scales": [
    {
      "ref": "opt_pnsmd_howmuch_8",
      "dimension": "howmuch",
      "measurement_type": "ordinal",
      "levels": 8,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        0,
        7
      ],
      "anchors": [
        "Not at all",
        "A tiny bit",
        "A little",
        "Somewhat",
        "Mostly",
        "Very",
        "Extremely",
        "Completely"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pnsmd_1",
      "prompt_snippet": "Interesting",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pnsmd_2",
      "prompt_snippet": "Full",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pnsmd_3",
      "prompt_snippet": "Sturdy",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pnsmd_4",
      "prompt_snippet": "Enjoyable",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_pnsmd_5",
      "prompt_snippet": "Good",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_pnsmd_6",
      "prompt_snippet": "Friendly",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_pnsmd_7",
      "prompt_snippet": "Hopeful",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_pnsmd_8",
      "prompt_snippet": "Bad",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_pnsmd_9",
      "prompt_snippet": "Lonely",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_pnsmd_10",
      "prompt_snippet": "Discouraging",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_pnsmd_11",
      "prompt_snippet": "Boring",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_pnsmd_12",
      "prompt_snippet": "Empty",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_pnsmd_13",
      "prompt_snippet": "Fragile",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_pnsmd_14",
      "prompt_snippet": "Miserable",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
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

- Items: 14
- Dimensions: howmuch
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Interesting | howmuch | 0,1,2,3,4,5,6,7 | no |
| 2 | Full | howmuch | 0,1,2,3,4,5,6,7 | no |
| 3 | Sturdy | howmuch | 0,1,2,3,4,5,6,7 | no |
| 4 | Enjoyable | howmuch | 0,1,2,3,4,5,6,7 | no |
| 5 | Good | howmuch | 0,1,2,3,4,5,6,7 | no |
| 6 | Friendly | howmuch | 0,1,2,3,4,5,6,7 | no |
| 7 | Hopeful | howmuch | 0,1,2,3,4,5,6,7 | no |
| 8 | Bad | howmuch | 0,1,2,3,4,5,6,7 | no |
| 9 | Lonely | howmuch | 0,1,2,3,4,5,6,7 | no |
| 10 | Discouraging | howmuch | 0,1,2,3,4,5,6,7 | no |
| 11 | Boring | howmuch | 0,1,2,3,4,5,6,7 | no |
| 12 | Empty | howmuch | 0,1,2,3,4,5,6,7 | no |
| 13 | Fragile | howmuch | 0,1,2,3,4,5,6,7 | no |
| 14 | Miserable | howmuch | 0,1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/relationship-satisfaction-pnsmd.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
