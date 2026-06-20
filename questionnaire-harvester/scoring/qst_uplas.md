# Scoring — Loneliness (UPLAS) (`qst_uplas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_uplas",
  "title": "Loneliness (UPLAS)",
  "short_title": "UPLAS",
  "source_url": "https://us.psytoolkit.org/survey-library/loneliness-uplas.html",
  "publication": {
    "citation": "Tharayil, D.P. (2012). Developing the University of the Philippines\nLoneliness Assessment Scale: A Cross-Cultural Measurement. Social\nIndicators Research, 106 (2) , 307-321.",
    "year": 2012
  },
  "status": "needs-research",
  "item_count": 25,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_uplas_agree_4",
      "dimension": "agree",
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
        "Strongly Disagree",
        "Disagree",
        "Agree",
        "Strongly Agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_uplas_5",
    "pr_uplas_10",
    "pr_uplas_15",
    "pr_uplas_20",
    "pr_uplas_25"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_uplas_1",
      "prompt_snippet": "I feel that I am always being left alone.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_2",
      "prompt_snippet": "I feel that I am misunderstood.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_uplas_3",
      "prompt_snippet": "I feel that others reject me.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_4",
      "prompt_snippet": "I sense that people are not interested in making friends with me.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_5",
      "prompt_snippet": "I feel happy for who I am.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_uplas_6",
      "prompt_snippet": "I feel that nobody likes me.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_uplas_7",
      "prompt_snippet": "I don’t have a meaningful relationship with people.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_8",
      "prompt_snippet": "I pity myself.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_9",
      "prompt_snippet": "I feel that nobody appreciates me.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_10",
      "prompt_snippet": "I am happy for myself.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_uplas_11",
      "prompt_snippet": "I am dissatisfied with my relationships.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_uplas_12",
      "prompt_snippet": "I feel alone even in a group.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_uplas_13",
      "prompt_snippet": "I feel hopeless about the misfortunes of my life.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_14",
      "prompt_snippet": "I feel worthless.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_uplas_15",
      "prompt_snippet": "I am satisfied with my life.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_uplas_16",
      "prompt_snippet": "I have no confidence to get involved in relationships.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_uplas_17",
      "prompt_snippet": "I feel that others always look at my faults.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_uplas_18",
      "prompt_snippet": "I feel that I am a failure in life.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_uplas_19",
      "prompt_snippet": "I feel disconnected with people.",
      "dimension": "agree",
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
      "prompt_id": "pr_uplas_20",
      "prompt_snippet": "I feel that my life is meaningful.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 21,
      "prompt_id": "pr_uplas_21",
      "prompt_snippet": "I usually think of sad things in life.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_uplas_22",
      "prompt_snippet": "I am helpless when I think about the future.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_uplas_23",
      "prompt_snippet": "I feel inadequate when it comes to relationships.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_uplas_24",
      "prompt_snippet": "I feel empty even if I do many things.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_uplas_25",
      "prompt_snippet": "I feel confident about the future.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
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

- Items: 25
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_uplas_5, pr_uplas_10, pr_uplas_15, pr_uplas_20, pr_uplas_25
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I feel that I am always being left alone. | agree | 1,2,3,4 | no |
| 2 | I feel that I am misunderstood. | agree | 1,2,3,4 | no |
| 3 | I feel that others reject me. | agree | 1,2,3,4 | no |
| 4 | I sense that people are not interested in making friends with me. | agree | 1,2,3,4 | no |
| 5 | I feel happy for who I am. | agree | 1,2,3,4 | yes |
| 6 | I feel that nobody likes me. | agree | 1,2,3,4 | no |
| 7 | I don’t have a meaningful relationship with people. | agree | 1,2,3,4 | no |
| 8 | I pity myself. | agree | 1,2,3,4 | no |
| 9 | I feel that nobody appreciates me. | agree | 1,2,3,4 | no |
| 10 | I am happy for myself. | agree | 1,2,3,4 | yes |
| 11 | I am dissatisfied with my relationships. | agree | 1,2,3,4 | no |
| 12 | I feel alone even in a group. | agree | 1,2,3,4 | no |
| 13 | I feel hopeless about the misfortunes of my life. | agree | 1,2,3,4 | no |
| 14 | I feel worthless. | agree | 1,2,3,4 | no |
| 15 | I am satisfied with my life. | agree | 1,2,3,4 | yes |
| 16 | I have no confidence to get involved in relationships. | agree | 1,2,3,4 | no |
| 17 | I feel that others always look at my faults. | agree | 1,2,3,4 | no |
| 18 | I feel that I am a failure in life. | agree | 1,2,3,4 | no |
| 19 | I feel disconnected with people. | agree | 1,2,3,4 | no |
| 20 | I feel that my life is meaningful. | agree | 1,2,3,4 | yes |
| 21 | I usually think of sad things in life. | agree | 1,2,3,4 | no |
| 22 | I am helpless when I think about the future. | agree | 1,2,3,4 | no |
| 23 | I feel inadequate when it comes to relationships. | agree | 1,2,3,4 | no |
| 24 | I feel empty even if I do many things. | agree | 1,2,3,4 | no |
| 25 | I feel confident about the future. | agree | 1,2,3,4 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/loneliness-uplas.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
