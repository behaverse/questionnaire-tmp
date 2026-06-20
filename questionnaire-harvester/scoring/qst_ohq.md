# Scoring — Oxford Happiness Scale (`qst_ohq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ohq",
  "title": "Oxford Happiness Scale",
  "short_title": "Oxford Happiness Scale",
  "source_url": "https://us.psytoolkit.org/survey-library/happiness-ohq.html",
  "publication": {
    "citation": "Hills, P. & Argyle, M. (2002). The Oxford Happiness Questionnaire: a compact scale for the measurement of psychological well-being. Personality and Individual Differences, 33 , 1073-1082.",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 29,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_ohq_agree_6",
      "dimension": "agree",
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
        "strongly disagree",
        "moderately disagree",
        "slightly disagree",
        "slightly agree",
        "moderately agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_ohq_1",
    "pr_ohq_5",
    "pr_ohq_6",
    "pr_ohq_10",
    "pr_ohq_13",
    "pr_ohq_14",
    "pr_ohq_19",
    "pr_ohq_23",
    "pr_ohq_24",
    "pr_ohq_27",
    "pr_ohq_28",
    "pr_ohq_29"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ohq_1",
      "prompt_snippet": "I don’t feel particularly pleased with the way I am",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_ohq_2",
      "prompt_snippet": "I am intensely interested in other people",
      "dimension": "agree",
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
      "prompt_id": "pr_ohq_3",
      "prompt_snippet": "I feel that life is very rewarding",
      "dimension": "agree",
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
      "prompt_id": "pr_ohq_4",
      "prompt_snippet": "I have very warm feelings towards almost everyone",
      "dimension": "agree",
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
      "prompt_id": "pr_ohq_5",
      "prompt_snippet": "I rarely wake up feeling rested",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_ohq_6",
      "prompt_snippet": "I am not particularly optimistic about the future",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_ohq_7",
      "prompt_snippet": "I find most things amusing",
      "dimension": "agree",
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
      "index": 8,
      "prompt_id": "pr_ohq_8",
      "prompt_snippet": "I am always committed and involved",
      "dimension": "agree",
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
      "index": 9,
      "prompt_id": "pr_ohq_9",
      "prompt_snippet": "Life is good",
      "dimension": "agree",
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
      "index": 10,
      "prompt_id": "pr_ohq_10",
      "prompt_snippet": "I do not think that the world is a good place",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_ohq_11",
      "prompt_snippet": "I laugh a lot",
      "dimension": "agree",
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
      "index": 12,
      "prompt_id": "pr_ohq_12",
      "prompt_snippet": "I am well satisfied about everything in my life",
      "dimension": "agree",
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
      "index": 13,
      "prompt_id": "pr_ohq_13",
      "prompt_snippet": "I don’t think I look attractive",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_ohq_14",
      "prompt_snippet": "There is a gap between what I would like to do and what I have done",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_ohq_15",
      "prompt_snippet": "I am very happy",
      "dimension": "agree",
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
      "index": 16,
      "prompt_id": "pr_ohq_16",
      "prompt_snippet": "I find beauty in some things",
      "dimension": "agree",
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
      "index": 17,
      "prompt_id": "pr_ohq_17",
      "prompt_snippet": "I always have a cheerful effect on others",
      "dimension": "agree",
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
      "index": 18,
      "prompt_id": "pr_ohq_18",
      "prompt_snippet": "I can fit in everything I want to",
      "dimension": "agree",
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
      "index": 19,
      "prompt_id": "pr_ohq_19",
      "prompt_snippet": "I feel that I am not especially in control of my life",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 20,
      "prompt_id": "pr_ohq_20",
      "prompt_snippet": "I feel able to take anything on",
      "dimension": "agree",
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
      "index": 21,
      "prompt_id": "pr_ohq_21",
      "prompt_snippet": "I feel fully mentally alert",
      "dimension": "agree",
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
      "index": 22,
      "prompt_id": "pr_ohq_22",
      "prompt_snippet": "I often experience joy and elation",
      "dimension": "agree",
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
      "index": 23,
      "prompt_id": "pr_ohq_23",
      "prompt_snippet": "I do not find it easy to make decisions",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 24,
      "prompt_id": "pr_ohq_24",
      "prompt_snippet": "I do not have a particular sense of meaning and purpose in my life",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 25,
      "prompt_id": "pr_ohq_25",
      "prompt_snippet": "I feel I have a great deal of energy",
      "dimension": "agree",
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
      "index": 26,
      "prompt_id": "pr_ohq_26",
      "prompt_snippet": "I usually have a good influence on events",
      "dimension": "agree",
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
      "index": 27,
      "prompt_id": "pr_ohq_27",
      "prompt_snippet": "I do not have fun with other people",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 28,
      "prompt_id": "pr_ohq_28",
      "prompt_snippet": "I don’t feel particularly healthy",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "reversed": true
    },
    {
      "index": 29,
      "prompt_id": "pr_ohq_29",
      "prompt_snippet": "I do not have particularly happy memories of the past",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6
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

- Items: 29
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_ohq_1, pr_ohq_5, pr_ohq_6, pr_ohq_10, pr_ohq_13, pr_ohq_14, pr_ohq_19, pr_ohq_23, pr_ohq_24, pr_ohq_27, pr_ohq_28, pr_ohq_29
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I don’t feel particularly pleased with the way I am | agree | 1,2,3,4,5,6 | yes |
| 2 | I am intensely interested in other people | agree | 1,2,3,4,5,6 | no |
| 3 | I feel that life is very rewarding | agree | 1,2,3,4,5,6 | no |
| 4 | I have very warm feelings towards almost everyone | agree | 1,2,3,4,5,6 | no |
| 5 | I rarely wake up feeling rested | agree | 1,2,3,4,5,6 | yes |
| 6 | I am not particularly optimistic about the future | agree | 1,2,3,4,5,6 | yes |
| 7 | I find most things amusing | agree | 1,2,3,4,5,6 | no |
| 8 | I am always committed and involved | agree | 1,2,3,4,5,6 | no |
| 9 | Life is good | agree | 1,2,3,4,5,6 | no |
| 10 | I do not think that the world is a good place | agree | 1,2,3,4,5,6 | yes |
| 11 | I laugh a lot | agree | 1,2,3,4,5,6 | no |
| 12 | I am well satisfied about everything in my life | agree | 1,2,3,4,5,6 | no |
| 13 | I don’t think I look attractive | agree | 1,2,3,4,5,6 | yes |
| 14 | There is a gap between what I would like to do and what I have done | agree | 1,2,3,4,5,6 | yes |
| 15 | I am very happy | agree | 1,2,3,4,5,6 | no |
| 16 | I find beauty in some things | agree | 1,2,3,4,5,6 | no |
| 17 | I always have a cheerful effect on others | agree | 1,2,3,4,5,6 | no |
| 18 | I can fit in everything I want to | agree | 1,2,3,4,5,6 | no |
| 19 | I feel that I am not especially in control of my life | agree | 1,2,3,4,5,6 | yes |
| 20 | I feel able to take anything on | agree | 1,2,3,4,5,6 | no |
| 21 | I feel fully mentally alert | agree | 1,2,3,4,5,6 | no |
| 22 | I often experience joy and elation | agree | 1,2,3,4,5,6 | no |
| 23 | I do not find it easy to make decisions | agree | 1,2,3,4,5,6 | yes |
| 24 | I do not have a particular sense of meaning and purpose in my life | agree | 1,2,3,4,5,6 | yes |
| 25 | I feel I have a great deal of energy | agree | 1,2,3,4,5,6 | no |
| 26 | I usually have a good influence on events | agree | 1,2,3,4,5,6 | no |
| 27 | I do not have fun with other people | agree | 1,2,3,4,5,6 | yes |
| 28 | I don’t feel particularly healthy | agree | 1,2,3,4,5,6 | yes |
| 29 | I do not have particularly happy memories of the past | agree | 1,2,3,4,5,6 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/happiness-ohq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
