# Scoring — Impulsivity Scale for Children (ISC) (`qst_isc`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_isc",
  "title": "Impulsivity Scale for Children (ISC)",
  "short_title": "ISC",
  "source_url": "https://us.psytoolkit.org/survey-library/impulsiveness-isc.html",
  "publication": {
    "citation": "Tsukayama, E., Duckworth, A.L. & Kim, B. (2013). Domain-specific impulsivity in school-age children. Developmental Science, 16 , 879-893.",
    "year": 2013
  },
  "status": "needs-research",
  "item_count": 8,
  "dimensions": [
    "isc"
  ],
  "option_scales": [
    {
      "ref": "opt_isc_isc_5",
      "dimension": "isc",
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
        "Almost never",
        "About once a month",
        "About 2-3 times a month",
        "About once a week",
        "At least once a day"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_isc_1",
      "prompt_snippet": "I forgot something I needed for class.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_2",
      "prompt_snippet": "I interrupted other students while they were talking.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_3",
      "prompt_snippet": "I said something rude.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_4",
      "prompt_snippet": "I couldn't find something because my desk, locker, or bedroom was messy.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_5",
      "prompt_snippet": "I lost my temper at home or at school.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_6",
      "prompt_snippet": "I did not remember what my teacher told me to do.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_7",
      "prompt_snippet": "My mind wandered when I should have been listening.",
      "dimension": "isc",
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
      "prompt_id": "pr_isc_8",
      "prompt_snippet": "I talked back to my teacher or parent when I was upset.",
      "dimension": "isc",
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

- Items: 8
- Dimensions: isc
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I forgot something I needed for class. | isc | 1,2,3,4,5 | no |
| 2 | I interrupted other students while they were talking. | isc | 1,2,3,4,5 | no |
| 3 | I said something rude. | isc | 1,2,3,4,5 | no |
| 4 | I couldn't find something because my desk, locker, or bedroom was messy. | isc | 1,2,3,4,5 | no |
| 5 | I lost my temper at home or at school. | isc | 1,2,3,4,5 | no |
| 6 | I did not remember what my teacher told me to do. | isc | 1,2,3,4,5 | no |
| 7 | My mind wandered when I should have been listening. | isc | 1,2,3,4,5 | no |
| 8 | I talked back to my teacher or parent when I was upset. | isc | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/impulsiveness-isc.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
