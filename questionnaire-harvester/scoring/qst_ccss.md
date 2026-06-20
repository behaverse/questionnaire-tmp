# Scoring — Cooperative/Competitive Strategy Scale (CCSS) (`qst_ccss`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ccss",
  "title": "Cooperative/Competitive Strategy Scale (CCSS)",
  "short_title": "CCSS",
  "source_url": "https://us.psytoolkit.org/survey-library/coop-comp-ccss.html",
  "publication": {
    "citation": "Tang, S. (1999). Cooperation or competition: A comparison of U.S. and Chinese College students. The Journal of Psychology, 133 , 413-423.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 19,
  "dimensions": [
    "often"
  ],
  "option_scales": [
    {
      "ref": "opt_ccss_often_7",
      "dimension": "often",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "always",
        ".",
        ".",
        ".",
        ".",
        ".",
        "never"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ccss_1",
      "prompt_snippet": "Individual success can be achieved while working with others",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_2",
      "prompt_snippet": "Joint effort is the best way to achieve success",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_3",
      "prompt_snippet": "To succeed, one must cooperate with others",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_4",
      "prompt_snippet": "Success is only achieved through individual effort",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_5",
      "prompt_snippet": "Success is best achieved through cooperation rather than through competition",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_6",
      "prompt_snippet": "In the end, cooperation with others is not compatible with success",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_7",
      "prompt_snippet": "Shared efforts can lead to both individual and group success",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_8",
      "prompt_snippet": "I enjoy working with others to achieve joint success",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_9",
      "prompt_snippet": "It is important to me to do better than others",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_10",
      "prompt_snippet": "Success is not very important to me",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_11",
      "prompt_snippet": "By achieving success I also get other things which are important to me",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_12",
      "prompt_snippet": "To succeed, one must compete against others",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_13",
      "prompt_snippet": "People who succeed are more likely to have satisfying lives",
      "dimension": "often",
      "values": [
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
      "prompt_id": "pr_ccss_14",
      "prompt_snippet": "Success is something I am willing to work hard for",
      "dimension": "often",
      "values": [
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
      "index": 15,
      "prompt_id": "pr_ccss_15",
      "prompt_snippet": "I enjoy the challenge of competing against others to succeed",
      "dimension": "often",
      "values": [
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
      "index": 16,
      "prompt_id": "pr_ccss_16",
      "prompt_snippet": "The rewards of success outweigh the costs",
      "dimension": "often",
      "values": [
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
      "index": 17,
      "prompt_id": "pr_ccss_17",
      "prompt_snippet": "Success is my major goal in life",
      "dimension": "often",
      "values": [
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
      "index": 18,
      "prompt_id": "pr_ccss_18",
      "prompt_snippet": "I am happier when I am not striving to succeed",
      "dimension": "often",
      "values": [
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
      "index": 19,
      "prompt_id": "pr_ccss_19",
      "prompt_snippet": "I feel better about myself when I am working toward success",
      "dimension": "often",
      "values": [
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

- Items: 19
- Dimensions: often
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Individual success can be achieved while working with others | often | 1,2,3,4,5,6,7 | no |
| 2 | Joint effort is the best way to achieve success | often | 1,2,3,4,5,6,7 | no |
| 3 | To succeed, one must cooperate with others | often | 1,2,3,4,5,6,7 | no |
| 4 | Success is only achieved through individual effort | often | 1,2,3,4,5,6,7 | no |
| 5 | Success is best achieved through cooperation rather than through competition | often | 1,2,3,4,5,6,7 | no |
| 6 | In the end, cooperation with others is not compatible with success | often | 1,2,3,4,5,6,7 | no |
| 7 | Shared efforts can lead to both individual and group success | often | 1,2,3,4,5,6,7 | no |
| 8 | I enjoy working with others to achieve joint success | often | 1,2,3,4,5,6,7 | no |
| 9 | It is important to me to do better than others | often | 1,2,3,4,5,6,7 | no |
| 10 | Success is not very important to me | often | 1,2,3,4,5,6,7 | no |
| 11 | By achieving success I also get other things which are important to me | often | 1,2,3,4,5,6,7 | no |
| 12 | To succeed, one must compete against others | often | 1,2,3,4,5,6,7 | no |
| 13 | People who succeed are more likely to have satisfying lives | often | 1,2,3,4,5,6,7 | no |
| 14 | Success is something I am willing to work hard for | often | 1,2,3,4,5,6,7 | no |
| 15 | I enjoy the challenge of competing against others to succeed | often | 1,2,3,4,5,6,7 | no |
| 16 | The rewards of success outweigh the costs | often | 1,2,3,4,5,6,7 | no |
| 17 | Success is my major goal in life | often | 1,2,3,4,5,6,7 | no |
| 18 | I am happier when I am not striving to succeed | often | 1,2,3,4,5,6,7 | no |
| 19 | I feel better about myself when I am working toward success | often | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/coop-comp-ccss.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
