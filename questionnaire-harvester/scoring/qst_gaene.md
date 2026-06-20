# Scoring — Generalized Acceptance of EvolutioN Evaluation (GAENE) (`qst_gaene`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gaene",
  "title": "Generalized Acceptance of EvolutioN Evaluation (GAENE)",
  "short_title": "GAENE",
  "source_url": "https://us.psytoolkit.org/survey-library/evolution-gaene.html",
  "publication": {
    "citation": "Smith, M.U., Snyder, S.W., and Devereaux, R.S. (2016). The\nGAENE—Generalized Acceptance of EvolutioN Evaluation: Development of a\nNew Measure of Evolution Acceptance. Journal of Research in Science\nTeaching, 53(9) , 1289-1315.",
    "year": 2016
  },
  "status": "needs-research",
  "item_count": 13,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_gaene_agree_5",
      "dimension": "agree",
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
        "Strongly disagree",
        "Disagree",
        "I don't know / no opinion",
        "Agree",
        "Strongly Agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gaene_1",
      "prompt_snippet": "Everyone should understand evolution.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_2",
      "prompt_snippet": "It is important to let people know about how strong the evidence that supports e",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_3",
      "prompt_snippet": "Some parts of evolution theory could be true.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_4",
      "prompt_snippet": "Evolutionary theory applies to all plants and animals, including humans.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_5",
      "prompt_snippet": "People who plan to become biologists need to understand evolution.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_6",
      "prompt_snippet": "I would be willing to argue in favor of evolutionary in a public forum such as a",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_7",
      "prompt_snippet": "Simple organisms such as bacteria change over time.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_8",
      "prompt_snippet": "Nothing in biology makes sense without evolution.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_9",
      "prompt_snippet": "Understanding evolution helps me understand the other parts of biology.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_10",
      "prompt_snippet": "I would be willing to argue in favor of evolution in a small group of friends.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_11",
      "prompt_snippet": "Evolution is a good explanation of how humans first emerged on the earth.",
      "dimension": "agree",
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
      "prompt_id": "pr_gaene_12",
      "prompt_snippet": "Evolution is a scientific fact.",
      "dimension": "agree",
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
      "index": 13,
      "prompt_id": "pr_gaene_13",
      "prompt_snippet": "Evolution is a good explanation of how new species arise.",
      "dimension": "agree",
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

- Items: 13
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Everyone should understand evolution. | agree | 1,2,3,4,5 | no |
| 2 | It is important to let people know about how strong the evidence that supports e | agree | 1,2,3,4,5 | no |
| 3 | Some parts of evolution theory could be true. | agree | 1,2,3,4,5 | no |
| 4 | Evolutionary theory applies to all plants and animals, including humans. | agree | 1,2,3,4,5 | no |
| 5 | People who plan to become biologists need to understand evolution. | agree | 1,2,3,4,5 | no |
| 6 | I would be willing to argue in favor of evolutionary in a public forum such as a | agree | 1,2,3,4,5 | no |
| 7 | Simple organisms such as bacteria change over time. | agree | 1,2,3,4,5 | no |
| 8 | Nothing in biology makes sense without evolution. | agree | 1,2,3,4,5 | no |
| 9 | Understanding evolution helps me understand the other parts of biology. | agree | 1,2,3,4,5 | no |
| 10 | I would be willing to argue in favor of evolution in a small group of friends. | agree | 1,2,3,4,5 | no |
| 11 | Evolution is a good explanation of how humans first emerged on the earth. | agree | 1,2,3,4,5 | no |
| 12 | Evolution is a scientific fact. | agree | 1,2,3,4,5 | no |
| 13 | Evolution is a good explanation of how new species arise. | agree | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/evolution-gaene.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
