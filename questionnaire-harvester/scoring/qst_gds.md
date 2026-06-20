# Scoring — Geriatric Depression Scale (GDS) (`qst_gds`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gds",
  "title": "Geriatric Depression Scale (GDS)",
  "short_title": "GDS",
  "source_url": "https://psychology-tools.com/test/geriatric-depression-scale",
  "publication": {
    "citation": "JA Yesavage, TL Brink, et al. Development and Validation of a Geriatric Depression Screening Scale: a Preliminary Report. 17(1): J Psychiatr Res. 37-49. 1983.",
    "year": 1983
  },
  "status": "needs-research",
  "item_count": 30,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_gds_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Yes",
        "No"
      ]
    },
    {
      "ref": "opt_gds_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        1,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Yes",
        "No"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gds_1",
      "prompt_snippet": "Are you basically satisfied with your life?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_gds_2",
      "prompt_snippet": "Have you dropped many of your activities and interests?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_gds_3",
      "prompt_snippet": "Do you feel that your life is empty?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_gds_4",
      "prompt_snippet": "Do you often get bored?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_gds_5",
      "prompt_snippet": "Are you hopeful about the future?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_gds_6",
      "prompt_snippet": "Are you bothered by thoughts you can’t get out of your head?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_gds_7",
      "prompt_snippet": "Are you in good spirits most of the time?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_gds_8",
      "prompt_snippet": "Are you afraid that something bad is going to happen to you?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_gds_9",
      "prompt_snippet": "Do you feel happy most of the time?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_gds_10",
      "prompt_snippet": "Do you often feel helpless?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_gds_11",
      "prompt_snippet": "Do you often get restless and fidgety?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_gds_12",
      "prompt_snippet": "Do you prefer to stay at home, rather than going out and doing new things?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_gds_13",
      "prompt_snippet": "Do you frequently worry about the future?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_gds_14",
      "prompt_snippet": "Do you feel you have more problems with memory than most?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_gds_15",
      "prompt_snippet": "Do you think it is wonderful to be alive now?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_gds_16",
      "prompt_snippet": "Do you often feel downhearted and blue?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_gds_17",
      "prompt_snippet": "Do you feel pretty worthless the way you are now?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_gds_18",
      "prompt_snippet": "Do you worry a lot about the past?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_gds_19",
      "prompt_snippet": "Do you find life very exciting?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_gds_20",
      "prompt_snippet": "Is it hard for you to get started on new projects?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_gds_21",
      "prompt_snippet": "Do you feel full of energy?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_gds_22",
      "prompt_snippet": "Do you feel that your situation is hopeless?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_gds_23",
      "prompt_snippet": "Do you think that most people are better off than you are?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_gds_24",
      "prompt_snippet": "Do you frequently get upset over little things?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_gds_25",
      "prompt_snippet": "Do you frequently feel like crying?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_gds_26",
      "prompt_snippet": "Do you have trouble concentrating?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_gds_27",
      "prompt_snippet": "Do you enjoy getting up in the morning?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_gds_28",
      "prompt_snippet": "Do you prefer to avoid social gatherings?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_gds_29",
      "prompt_snippet": "Is it easy for you to make decisions?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_gds_30",
      "prompt_snippet": "Is your mind as clear as it used to be?",
      "dimension": "rating",
      "values": [
        0,
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

- Items: 30
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Are you basically satisfied with your life? | rating | 0,1 | no |
| 2 | Have you dropped many of your activities and interests? | rating | 1,0 | no |
| 3 | Do you feel that your life is empty? | rating | 1,0 | no |
| 4 | Do you often get bored? | rating | 1,0 | no |
| 5 | Are you hopeful about the future? | rating | 0,1 | no |
| 6 | Are you bothered by thoughts you can’t get out of your head? | rating | 1,0 | no |
| 7 | Are you in good spirits most of the time? | rating | 0,1 | no |
| 8 | Are you afraid that something bad is going to happen to you? | rating | 1,0 | no |
| 9 | Do you feel happy most of the time? | rating | 0,1 | no |
| 10 | Do you often feel helpless? | rating | 1,0 | no |
| 11 | Do you often get restless and fidgety? | rating | 1,0 | no |
| 12 | Do you prefer to stay at home, rather than going out and doing new things? | rating | 1,0 | no |
| 13 | Do you frequently worry about the future? | rating | 1,0 | no |
| 14 | Do you feel you have more problems with memory than most? | rating | 1,0 | no |
| 15 | Do you think it is wonderful to be alive now? | rating | 0,1 | no |
| 16 | Do you often feel downhearted and blue? | rating | 1,0 | no |
| 17 | Do you feel pretty worthless the way you are now? | rating | 1,0 | no |
| 18 | Do you worry a lot about the past? | rating | 1,0 | no |
| 19 | Do you find life very exciting? | rating | 0,1 | no |
| 20 | Is it hard for you to get started on new projects? | rating | 1,0 | no |
| 21 | Do you feel full of energy? | rating | 0,1 | no |
| 22 | Do you feel that your situation is hopeless? | rating | 1,0 | no |
| 23 | Do you think that most people are better off than you are? | rating | 1,0 | no |
| 24 | Do you frequently get upset over little things? | rating | 1,0 | no |
| 25 | Do you frequently feel like crying? | rating | 1,0 | no |
| 26 | Do you have trouble concentrating? | rating | 1,0 | no |
| 27 | Do you enjoy getting up in the morning? | rating | 0,1 | no |
| 28 | Do you prefer to avoid social gatherings? | rating | 1,0 | no |
| 29 | Is it easy for you to make decisions? | rating | 0,1 | no |
| 30 | Is your mind as clear as it used to be? | rating | 0,1 | no |

## To research (fill from https://psychology-tools.com/test/geriatric-depression-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
