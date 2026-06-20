# Scoring — The Brief Irritability Test (BITe) (`qst_bite`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bite",
  "title": "The Brief Irritability Test (BITe)",
  "short_title": "BITe",
  "source_url": "https://us.psytoolkit.org/survey-library/irritability-bite.html",
  "publication": {
    "citation": "Holtzman, S., O’Connor, B.P., Barata, P.C., and Stewart,\nD.E. (2015). The Brief Irritability Test (BITe): A Measure of\nIrritability for Use Among Men and Women. Assessment, 22 , 101-115. Read it for free via the US National Library of Medicine .",
    "year": 2015
  },
  "status": "needs-research",
  "item_count": 5,
  "dimensions": [
    "howoften"
  ],
  "option_scales": [
    {
      "ref": "opt_bite_howoften_6",
      "dimension": "howoften",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "value_range": [
        1,
        6
      ],
      "anchors": [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very often",
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
      "prompt_id": "pr_bite_1",
      "prompt_snippet": "I have been grumpy",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_bite_2",
      "prompt_snippet": "I have been feeling like I might snap",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_bite_3",
      "prompt_snippet": "Other people have been getting on my nerves",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_bite_4",
      "prompt_snippet": "Things have been bothering me more than they normally do",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_bite_5",
      "prompt_snippet": "I have been feeling irritable",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
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

- Items: 5
- Dimensions: howoften
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have been grumpy | howoften | 1,2,3,4,5,6 | no |
| 2 | I have been feeling like I might snap | howoften | 1,2,3,4,5,6 | no |
| 3 | Other people have been getting on my nerves | howoften | 1,2,3,4,5,6 | no |
| 4 | Things have been bothering me more than they normally do | howoften | 1,2,3,4,5,6 | no |
| 5 | I have been feeling irritable | howoften | 1,2,3,4,5,6 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/irritability-bite.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
