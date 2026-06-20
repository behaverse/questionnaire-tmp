# Scoring — Revised Mystical Experience Questionnaire (MEQ-30) (`qst_meq30`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_meq30",
  "title": "Revised Mystical Experience Questionnaire (MEQ-30)",
  "short_title": "MEQ-30",
  "source_url": "https://psychology-tools.com/test/meq-30",
  "publication": {
    "citation": "Maclean K A. Factor Analysis of the Mystical Experience Questionnaire: A Study of Experiences Occasioned by the Hallucinogen Psilocybin. J Sci Study Relig ( 4 ): 721-737 ( 2012 ).",
    "year": 2012
  },
  "status": "needs-research",
  "item_count": 30,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_meq30_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        0,
        5
      ],
      "anchors": [
        "none; not at all",
        "so slight cannot decide",
        "slight",
        "moderate",
        "strong",
        "extreme"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_meq30_1",
      "prompt_snippet": "Freedom from the limitations of your personal self and feeling a unity or bond w",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_2",
      "prompt_snippet": "Experience of pure being and pure awareness (beyond the world of sense impressio",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_3",
      "prompt_snippet": "Experience of oneness in relation to an “inner world” within.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_4",
      "prompt_snippet": "Experience of the fusion of your personal self into a larger whole.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_5",
      "prompt_snippet": "Experience of unity with ultimate reality.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_6",
      "prompt_snippet": "Feeling that you experienced eternity or infinity.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_7",
      "prompt_snippet": "Experience of oneness or unity with objects and/or persons perceived in your sur",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_8",
      "prompt_snippet": "Experience of the insight that “all is One.”",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_9",
      "prompt_snippet": "Awareness of the life or living presence in all things.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_10",
      "prompt_snippet": "Gain of insightful knowledge experienced at an intuitive level.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_11",
      "prompt_snippet": "Certainty of encounter with ultimate reality (in the sense of being able to “kno",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_12",
      "prompt_snippet": "You are convinced now, as you look back on your experience, that in it you encou",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_13",
      "prompt_snippet": "Sense of being at a spiritual height.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_14",
      "prompt_snippet": "Sense of reverence.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_15",
      "prompt_snippet": "Feeling that you experienced something profoundly sacred and holy.",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_meq30_16",
      "prompt_snippet": "Experience of amazement.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_meq30_17",
      "prompt_snippet": "Feelings of tenderness and gentleness.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_meq30_18",
      "prompt_snippet": "Feelings of peace and tranquility.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_meq30_19",
      "prompt_snippet": "Experience of ecstasy.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_meq30_20",
      "prompt_snippet": "Sense of awe or awesomeness.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_meq30_21",
      "prompt_snippet": "Feelings of joy.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_meq30_22",
      "prompt_snippet": "Loss of your usual sense of time.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_meq30_23",
      "prompt_snippet": "Loss of your usual sense of space.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_meq30_24",
      "prompt_snippet": "Loss of usual awareness of where you were.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_meq30_25",
      "prompt_snippet": "Sense of being “outside of” time, beyond past and future.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_meq30_26",
      "prompt_snippet": "Being in a realm with no space boundaries.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_meq30_27",
      "prompt_snippet": "Experience of timelessness.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_meq30_28",
      "prompt_snippet": "Sense that the experience cannot be described adequately in words.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_meq30_29",
      "prompt_snippet": "Feeling that you could not do justice to your experience by describing it in wor",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_meq30_30",
      "prompt_snippet": "Feeling that it would be difficult to communicate your own experience to others ",
      "dimension": "rating",
      "values": [
        0,
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

- Items: 30
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Freedom from the limitations of your personal self and feeling a unity or bond w | rating | 0,1,2,3,4,5 | no |
| 2 | Experience of pure being and pure awareness (beyond the world of sense impressio | rating | 0,1,2,3,4,5 | no |
| 3 | Experience of oneness in relation to an “inner world” within. | rating | 0,1,2,3,4,5 | no |
| 4 | Experience of the fusion of your personal self into a larger whole. | rating | 0,1,2,3,4,5 | no |
| 5 | Experience of unity with ultimate reality. | rating | 0,1,2,3,4,5 | no |
| 6 | Feeling that you experienced eternity or infinity. | rating | 0,1,2,3,4,5 | no |
| 7 | Experience of oneness or unity with objects and/or persons perceived in your sur | rating | 0,1,2,3,4,5 | no |
| 8 | Experience of the insight that “all is One.” | rating | 0,1,2,3,4,5 | no |
| 9 | Awareness of the life or living presence in all things. | rating | 0,1,2,3,4,5 | no |
| 10 | Gain of insightful knowledge experienced at an intuitive level. | rating | 0,1,2,3,4,5 | no |
| 11 | Certainty of encounter with ultimate reality (in the sense of being able to “kno | rating | 0,1,2,3,4,5 | no |
| 12 | You are convinced now, as you look back on your experience, that in it you encou | rating | 0,1,2,3,4,5 | no |
| 13 | Sense of being at a spiritual height. | rating | 0,1,2,3,4,5 | no |
| 14 | Sense of reverence. | rating | 0,1,2,3,4,5 | no |
| 15 | Feeling that you experienced something profoundly sacred and holy. | rating | 0,1,2,3,4,5 | no |
| 16 | Experience of amazement. | rating | 0,1,2,3,4,5 | no |
| 17 | Feelings of tenderness and gentleness. | rating | 0,1,2,3,4,5 | no |
| 18 | Feelings of peace and tranquility. | rating | 0,1,2,3,4,5 | no |
| 19 | Experience of ecstasy. | rating | 0,1,2,3,4,5 | no |
| 20 | Sense of awe or awesomeness. | rating | 0,1,2,3,4,5 | no |
| 21 | Feelings of joy. | rating | 0,1,2,3,4,5 | no |
| 22 | Loss of your usual sense of time. | rating | 0,1,2,3,4,5 | no |
| 23 | Loss of your usual sense of space. | rating | 0,1,2,3,4,5 | no |
| 24 | Loss of usual awareness of where you were. | rating | 0,1,2,3,4,5 | no |
| 25 | Sense of being “outside of” time, beyond past and future. | rating | 0,1,2,3,4,5 | no |
| 26 | Being in a realm with no space boundaries. | rating | 0,1,2,3,4,5 | no |
| 27 | Experience of timelessness. | rating | 0,1,2,3,4,5 | no |
| 28 | Sense that the experience cannot be described adequately in words. | rating | 0,1,2,3,4,5 | no |
| 29 | Feeling that you could not do justice to your experience by describing it in wor | rating | 0,1,2,3,4,5 | no |
| 30 | Feeling that it would be difficult to communicate your own experience to others  | rating | 0,1,2,3,4,5 | no |

## To research (fill from https://psychology-tools.com/test/meq-30)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
