# Scoring — Spheres of Control Scale (SOC-3) (`qst_soc3`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_soc3",
  "title": "Spheres of Control Scale (SOC-3)",
  "short_title": "SOC-3",
  "source_url": "https://us.psytoolkit.org/survey-library/spheres-of-control-scale.html",
  "publication": {
    "citation": "Paulhus, D.L., & Van Selst, M. (1990). The Spheres of Control scale: Ten years of research. Personality and Individual Differences, 11, 1029-1036.",
    "year": 1990
  },
  "status": "needs-research",
  "item_count": 30,
  "dimensions": [
    "agree_socs"
  ],
  "option_scales": [
    {
      "ref": "opt_soc3_agree_socs_7",
      "dimension": "agree_socs",
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
        "strongly disagree",
        "disagree",
        "somewhat disagree",
        "neither agree nor disagree",
        "somewhat agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_soc3_2",
    "pr_soc3_7",
    "pr_soc3_8",
    "pr_soc3_9",
    "pr_soc3_12",
    "pr_soc3_16",
    "pr_soc3_17",
    "pr_soc3_19",
    "pr_soc3_21",
    "pr_soc3_23",
    "pr_soc3_24",
    "pr_soc3_25",
    "pr_soc3_26",
    "pr_soc3_27",
    "pr_soc3_28"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_soc3_1",
      "prompt_snippet": "I can usually achieve what I want if I work hard for it.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_2",
      "prompt_snippet": "In my personal relationships, the other person usually has more control than I d",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_3",
      "prompt_snippet": "By taking an active part in political and social affairs,   we the people can in",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_4",
      "prompt_snippet": "Once I make plans, I am almost certain to make them work.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_5",
      "prompt_snippet": "I have no trouble making and keeping friends.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_6",
      "prompt_snippet": "The average citizen can have an influence on government decisions.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_7",
      "prompt_snippet": "I prefer games involving some luck over games requiring pure skill.",
      "dimension": "agree_socs",
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
      "index": 8,
      "prompt_id": "pr_soc3_8",
      "prompt_snippet": "I'm not good at guiding the course of a conversation with several others.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_9",
      "prompt_snippet": "It is difficult for us to have much control over the things politicians do in of",
      "dimension": "agree_socs",
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
      "index": 10,
      "prompt_id": "pr_soc3_10",
      "prompt_snippet": "I can learn almost anything if I set my mind to it.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_11",
      "prompt_snippet": "I can usually develop a personal relationship with someone I find appealing.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_12",
      "prompt_snippet": "Bad economic conditions are caused by world events that are beyond our control.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_13",
      "prompt_snippet": "My major accomplishments are entirely due to my hard work and ability.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_14",
      "prompt_snippet": "I can usually steer a conversation toward the topics I want to talk about.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_15",
      "prompt_snippet": "With enough effort we can wipe out political corruption.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_16",
      "prompt_snippet": "I usually do not set goals because I have a hard time following through on them.",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_17",
      "prompt_snippet": "When I need assistance with something, I often find it difficult to get others t",
      "dimension": "agree_socs",
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
      "index": 18,
      "prompt_id": "pr_soc3_18",
      "prompt_snippet": "One of the major reasons we have wars is because people don't take enough intere",
      "dimension": "agree_socs",
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
      "prompt_id": "pr_soc3_19",
      "prompt_snippet": "Bad luck has sometimes prevented me from achieving things.",
      "dimension": "agree_socs",
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
      "index": 20,
      "prompt_id": "pr_soc3_20",
      "prompt_snippet": "If there's someone I want to meet, I can usually arrange it.",
      "dimension": "agree_socs",
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
      "index": 21,
      "prompt_id": "pr_soc3_21",
      "prompt_snippet": "There is nothing we, as consumers, can do to keep the cost of living from going ",
      "dimension": "agree_socs",
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
      "index": 22,
      "prompt_id": "pr_soc3_22",
      "prompt_snippet": "Almost anything is possible for me if I really want it.",
      "dimension": "agree_socs",
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
      "index": 23,
      "prompt_id": "pr_soc3_23",
      "prompt_snippet": "I often find it hard to get my point of view across to others.",
      "dimension": "agree_socs",
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
      "index": 24,
      "prompt_id": "pr_soc3_24",
      "prompt_snippet": "It is impossible to have any real influence over what big businesses do.",
      "dimension": "agree_socs",
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
      "index": 25,
      "prompt_id": "pr_soc3_25",
      "prompt_snippet": "Most of what happens in my career is beyond my control.",
      "dimension": "agree_socs",
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
      "index": 26,
      "prompt_id": "pr_soc3_26",
      "prompt_snippet": "In attempting to smooth over a disagreement, I sometimes make it worse.",
      "dimension": "agree_socs",
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
      "index": 27,
      "prompt_id": "pr_soc3_27",
      "prompt_snippet": "I prefer to concentrate my energy on other things rather than on solving the wor",
      "dimension": "agree_socs",
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
      "index": 28,
      "prompt_id": "pr_soc3_28",
      "prompt_snippet": "I find it pointless to keep working on something that's too difficult for me.",
      "dimension": "agree_socs",
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
      "index": 29,
      "prompt_id": "pr_soc3_29",
      "prompt_snippet": "I find it easy to play an important part in most group situations.",
      "dimension": "agree_socs",
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
      "index": 30,
      "prompt_id": "pr_soc3_30",
      "prompt_snippet": "In the long run, we the voters are responsible for bad government on a national ",
      "dimension": "agree_socs",
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

- Items: 30
- Dimensions: agree_socs
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_soc3_2, pr_soc3_7, pr_soc3_8, pr_soc3_9, pr_soc3_12, pr_soc3_16, pr_soc3_17, pr_soc3_19, pr_soc3_21, pr_soc3_23, pr_soc3_24, pr_soc3_25, pr_soc3_26, pr_soc3_27, pr_soc3_28
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can usually achieve what I want if I work hard for it. | agree_socs | 1,2,3,4,5,6,7 | no |
| 2 | In my personal relationships, the other person usually has more control than I d | agree_socs | 1,2,3,4,5,6,7 | yes |
| 3 | By taking an active part in political and social affairs,   we the people can in | agree_socs | 1,2,3,4,5,6,7 | no |
| 4 | Once I make plans, I am almost certain to make them work. | agree_socs | 1,2,3,4,5,6,7 | no |
| 5 | I have no trouble making and keeping friends. | agree_socs | 1,2,3,4,5,6,7 | no |
| 6 | The average citizen can have an influence on government decisions. | agree_socs | 1,2,3,4,5,6,7 | no |
| 7 | I prefer games involving some luck over games requiring pure skill. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 8 | I'm not good at guiding the course of a conversation with several others. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 9 | It is difficult for us to have much control over the things politicians do in of | agree_socs | 1,2,3,4,5,6,7 | yes |
| 10 | I can learn almost anything if I set my mind to it. | agree_socs | 1,2,3,4,5,6,7 | no |
| 11 | I can usually develop a personal relationship with someone I find appealing. | agree_socs | 1,2,3,4,5,6,7 | no |
| 12 | Bad economic conditions are caused by world events that are beyond our control. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 13 | My major accomplishments are entirely due to my hard work and ability. | agree_socs | 1,2,3,4,5,6,7 | no |
| 14 | I can usually steer a conversation toward the topics I want to talk about. | agree_socs | 1,2,3,4,5,6,7 | no |
| 15 | With enough effort we can wipe out political corruption. | agree_socs | 1,2,3,4,5,6,7 | no |
| 16 | I usually do not set goals because I have a hard time following through on them. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 17 | When I need assistance with something, I often find it difficult to get others t | agree_socs | 1,2,3,4,5,6,7 | yes |
| 18 | One of the major reasons we have wars is because people don't take enough intere | agree_socs | 1,2,3,4,5,6,7 | no |
| 19 | Bad luck has sometimes prevented me from achieving things. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 20 | If there's someone I want to meet, I can usually arrange it. | agree_socs | 1,2,3,4,5,6,7 | no |
| 21 | There is nothing we, as consumers, can do to keep the cost of living from going  | agree_socs | 1,2,3,4,5,6,7 | yes |
| 22 | Almost anything is possible for me if I really want it. | agree_socs | 1,2,3,4,5,6,7 | no |
| 23 | I often find it hard to get my point of view across to others. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 24 | It is impossible to have any real influence over what big businesses do. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 25 | Most of what happens in my career is beyond my control. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 26 | In attempting to smooth over a disagreement, I sometimes make it worse. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 27 | I prefer to concentrate my energy on other things rather than on solving the wor | agree_socs | 1,2,3,4,5,6,7 | yes |
| 28 | I find it pointless to keep working on something that's too difficult for me. | agree_socs | 1,2,3,4,5,6,7 | yes |
| 29 | I find it easy to play an important part in most group situations. | agree_socs | 1,2,3,4,5,6,7 | no |
| 30 | In the long run, we the voters are responsible for bad government on a national  | agree_socs | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/spheres-of-control-scale.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
