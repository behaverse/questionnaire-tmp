# Scoring — Penn State Worry Questionnaire (PSWQ) (`qst_pswq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pswq",
  "title": "Penn State Worry Questionnaire (PSWQ)",
  "short_title": "PSWQ",
  "source_url": "https://psychology-tools.com/test/penn-state-worry-questionnaire",
  "publication": {
    "citation": "T J Meyer, M L Miller, R L Metzger, and T D Borkovec. Development and Validation of the Penn State Worry Questionnaire. 28 Behav Res Ther 487-495. 1990.",
    "year": 1990
  },
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_pswq_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Not at all typical of me",
        "Very typical of me"
      ]
    },
    {
      "ref": "opt_pswq_rating_2",
      "dimension": "rating",
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
        "Not at all typical of me",
        "Very typical of me"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pswq_1",
      "prompt_snippet": "If I do not have enough time to do everything, I do not worry about it.",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pswq_2",
      "prompt_snippet": "My worries overwhelm me.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_3",
      "prompt_snippet": "I do not tend to worry about things.",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pswq_4",
      "prompt_snippet": "Many situations make me worry.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_5",
      "prompt_snippet": "I know I should not worry about things, but I just cannot help it.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_6",
      "prompt_snippet": "When I am under pressure I worry a lot.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_7",
      "prompt_snippet": "I am always worrying about something.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_8",
      "prompt_snippet": "I find it easy to dismiss worrisome thoughts.",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_pswq_9",
      "prompt_snippet": "As soon as I finish one task, I start to worry about everything else I have to d",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_10",
      "prompt_snippet": "I never worry about anything.",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_pswq_11",
      "prompt_snippet": "When there is nothing more I can do about a concern, I do not worry about it any",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_pswq_12",
      "prompt_snippet": "I have been a worrier all my life.",
      "dimension": "rating",
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
      "prompt_id": "pr_pswq_13",
      "prompt_snippet": "I notice that I have been worrying about things.",
      "dimension": "rating",
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
      "index": 14,
      "prompt_id": "pr_pswq_14",
      "prompt_snippet": "Once I start worrying, I cannot stop",
      "dimension": "rating",
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
      "index": 15,
      "prompt_id": "pr_pswq_15",
      "prompt_snippet": "I worry all the time.",
      "dimension": "rating",
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
      "index": 16,
      "prompt_id": "pr_pswq_16",
      "prompt_snippet": "I worry about projects until they are all done.",
      "dimension": "rating",
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

- Items: 16
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | If I do not have enough time to do everything, I do not worry about it. | rating | 5,4,3,2,1 | no |
| 2 | My worries overwhelm me. | rating | 1,2,3,4,5 | no |
| 3 | I do not tend to worry about things. | rating | 5,4,3,2,1 | no |
| 4 | Many situations make me worry. | rating | 1,2,3,4,5 | no |
| 5 | I know I should not worry about things, but I just cannot help it. | rating | 1,2,3,4,5 | no |
| 6 | When I am under pressure I worry a lot. | rating | 1,2,3,4,5 | no |
| 7 | I am always worrying about something. | rating | 1,2,3,4,5 | no |
| 8 | I find it easy to dismiss worrisome thoughts. | rating | 5,4,3,2,1 | no |
| 9 | As soon as I finish one task, I start to worry about everything else I have to d | rating | 1,2,3,4,5 | no |
| 10 | I never worry about anything. | rating | 5,4,3,2,1 | no |
| 11 | When there is nothing more I can do about a concern, I do not worry about it any | rating | 5,4,3,2,1 | no |
| 12 | I have been a worrier all my life. | rating | 1,2,3,4,5 | no |
| 13 | I notice that I have been worrying about things. | rating | 1,2,3,4,5 | no |
| 14 | Once I start worrying, I cannot stop | rating | 1,2,3,4,5 | no |
| 15 | I worry all the time. | rating | 1,2,3,4,5 | no |
| 16 | I worry about projects until they are all done. | rating | 1,2,3,4,5 | no |

## To research (fill from https://psychology-tools.com/test/penn-state-worry-questionnaire)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
