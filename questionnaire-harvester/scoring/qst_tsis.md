# Scoring — Social Intelligence (Tromsø Social Intelligence Scale, TSIS) (`qst_tsis`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_tsis",
  "title": "Social Intelligence (Tromsø Social Intelligence Scale, TSIS)",
  "short_title": "Tromsø Social Intelligence Scale, TSIS",
  "source_url": "https://us.psytoolkit.org/survey-library/social-intelligence-tsis.html",
  "publication": {
    "citation": "D.H. Silvera, M. Martinussen, & T. I. Dahl. (2001). The Tromsø\nSocial Intelligence Scale, a self-report measure of social\nintelligence. Scandinavian Journal of Psychology, 42 , 313-319.",
    "year": 2001
  },
  "status": "needs-research",
  "item_count": 21,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_tsis_agree_7",
      "dimension": "agree",
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
        "Describes me extremely poorly",
        ".",
        ".",
        ".",
        ".",
        ".",
        "Describes me extremely well"
      ]
    }
  ],
  "reversed_items": [
    "pr_tsis_2",
    "pr_tsis_4",
    "pr_tsis_5",
    "pr_tsis_8",
    "pr_tsis_11",
    "pr_tsis_12",
    "pr_tsis_13",
    "pr_tsis_15",
    "pr_tsis_16",
    "pr_tsis_20",
    "pr_tsis_21"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_tsis_1",
      "prompt_snippet": "I can predict other peoples' behavior.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_2",
      "prompt_snippet": "I often feel that it is difficult to understand others' choices.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_tsis_3",
      "prompt_snippet": "I know how my actions will make others feel.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_4",
      "prompt_snippet": "I often feel uncertain around new people who I don't know.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_tsis_5",
      "prompt_snippet": "People often surprise me with the things they do.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_tsis_6",
      "prompt_snippet": "I understand other peoples' feelings.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_7",
      "prompt_snippet": "I fit in easily in social situations.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_8",
      "prompt_snippet": "Other people become angry with me without me being able to explain why.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 9,
      "prompt_id": "pr_tsis_9",
      "prompt_snippet": "I understand others' wishes.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_10",
      "prompt_snippet": "I am good at entering new situations and meeting people for the first time.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_11",
      "prompt_snippet": "It seems as though people are often angry or irritated with me when I say what I",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 12,
      "prompt_id": "pr_tsis_12",
      "prompt_snippet": "I have a hard time getting along with other people.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_tsis_13",
      "prompt_snippet": "I find people unpredictable.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_tsis_14",
      "prompt_snippet": "I can often understand what others are trying to accomplish without the need for",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_15",
      "prompt_snippet": "It takes a long time for me to get to know others well.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_tsis_16",
      "prompt_snippet": "I have often hurt others without realizing it.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 17,
      "prompt_id": "pr_tsis_17",
      "prompt_snippet": "I can predict how others will react to my behavior.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_18",
      "prompt_snippet": "I am good at getting on good terms with new people.",
      "dimension": "agree",
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
      "prompt_id": "pr_tsis_19",
      "prompt_snippet": "I can often understand what others really mean through their expression, body la",
      "dimension": "agree",
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
      "index": 20,
      "prompt_id": "pr_tsis_20",
      "prompt_snippet": "I frequently have problems finding good conversation topics.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 21,
      "prompt_id": "pr_tsis_21",
      "prompt_snippet": "I am often surprised by others' reactions to what I do.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
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

- Items: 21
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_tsis_2, pr_tsis_4, pr_tsis_5, pr_tsis_8, pr_tsis_11, pr_tsis_12, pr_tsis_13, pr_tsis_15, pr_tsis_16, pr_tsis_20, pr_tsis_21
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can predict other peoples' behavior. | agree | 1,2,3,4,5,6,7 | no |
| 2 | I often feel that it is difficult to understand others' choices. | agree | 1,2,3,4,5,6,7 | yes |
| 3 | I know how my actions will make others feel. | agree | 1,2,3,4,5,6,7 | no |
| 4 | I often feel uncertain around new people who I don't know. | agree | 1,2,3,4,5,6,7 | yes |
| 5 | People often surprise me with the things they do. | agree | 1,2,3,4,5,6,7 | yes |
| 6 | I understand other peoples' feelings. | agree | 1,2,3,4,5,6,7 | no |
| 7 | I fit in easily in social situations. | agree | 1,2,3,4,5,6,7 | no |
| 8 | Other people become angry with me without me being able to explain why. | agree | 1,2,3,4,5,6,7 | yes |
| 9 | I understand others' wishes. | agree | 1,2,3,4,5,6,7 | no |
| 10 | I am good at entering new situations and meeting people for the first time. | agree | 1,2,3,4,5,6,7 | no |
| 11 | It seems as though people are often angry or irritated with me when I say what I | agree | 1,2,3,4,5,6,7 | yes |
| 12 | I have a hard time getting along with other people. | agree | 1,2,3,4,5,6,7 | yes |
| 13 | I find people unpredictable. | agree | 1,2,3,4,5,6,7 | yes |
| 14 | I can often understand what others are trying to accomplish without the need for | agree | 1,2,3,4,5,6,7 | no |
| 15 | It takes a long time for me to get to know others well. | agree | 1,2,3,4,5,6,7 | yes |
| 16 | I have often hurt others without realizing it. | agree | 1,2,3,4,5,6,7 | yes |
| 17 | I can predict how others will react to my behavior. | agree | 1,2,3,4,5,6,7 | no |
| 18 | I am good at getting on good terms with new people. | agree | 1,2,3,4,5,6,7 | no |
| 19 | I can often understand what others really mean through their expression, body la | agree | 1,2,3,4,5,6,7 | no |
| 20 | I frequently have problems finding good conversation topics. | agree | 1,2,3,4,5,6,7 | yes |
| 21 | I am often surprised by others' reactions to what I do. | agree | 1,2,3,4,5,6,7 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/social-intelligence-tsis.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
