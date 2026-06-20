# Scoring — Big 5 Personality Test (FFM) (`qst_ffm`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ffm",
  "title": "Big 5 Personality Test (FFM)",
  "short_title": "FFM",
  "source_url": "https://psychology-tools.com/test/big-5-personality-test",
  "publication": {
    "citation": "C G DeYoung, L C Quilty, and J B Peterson. Between facets and domains: 10 aspects of the Big Five. 63 J Pers Soc Psychol 880-896. 2008.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 50,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_ffm_rating_1",
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
        "Very Inaccurate",
        "Moderately Inaccurate",
        "Neither Accurate nor Inaccurate",
        "Moderately Accurate",
        "Very Accurate"
      ]
    },
    {
      "ref": "opt_ffm_rating_2",
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
        "Very Inaccurate",
        "Moderately Inaccurate",
        "Neither Accurate nor Inaccurate",
        "Moderately Accurate",
        "Very Accurate"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ffm_1",
      "prompt_snippet": "I am the life of the party.",
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
      "index": 2,
      "prompt_id": "pr_ffm_2",
      "prompt_snippet": "I feel little concern for others.",
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
      "index": 3,
      "prompt_id": "pr_ffm_3",
      "prompt_snippet": "I am always prepared.",
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
      "index": 4,
      "prompt_id": "pr_ffm_4",
      "prompt_snippet": "I get stressed out easily.",
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
      "index": 5,
      "prompt_id": "pr_ffm_5",
      "prompt_snippet": "I have a rich vocabulary.",
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
      "prompt_id": "pr_ffm_6",
      "prompt_snippet": "I don’t talk a lot.",
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
      "index": 7,
      "prompt_id": "pr_ffm_7",
      "prompt_snippet": "I am interested in people.",
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
      "prompt_id": "pr_ffm_8",
      "prompt_snippet": "I leave my belongings around.",
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
      "prompt_id": "pr_ffm_9",
      "prompt_snippet": "I am relaxed most of the time.",
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
      "prompt_id": "pr_ffm_10",
      "prompt_snippet": "I have difficulty understanding abstract ideas.",
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
      "prompt_id": "pr_ffm_11",
      "prompt_snippet": "I feel comfortable around people.",
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
      "index": 12,
      "prompt_id": "pr_ffm_12",
      "prompt_snippet": "I insult people.",
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
      "index": 13,
      "prompt_id": "pr_ffm_13",
      "prompt_snippet": "I pay attention to details.",
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
      "prompt_id": "pr_ffm_14",
      "prompt_snippet": "I worry about things.",
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
      "index": 15,
      "prompt_id": "pr_ffm_15",
      "prompt_snippet": "I have a vivid imagination.",
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
      "prompt_id": "pr_ffm_16",
      "prompt_snippet": "I keep in the background.",
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
      "index": 17,
      "prompt_id": "pr_ffm_17",
      "prompt_snippet": "I sympathize with others’ feelings.",
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
      "index": 18,
      "prompt_id": "pr_ffm_18",
      "prompt_snippet": "I make a mess of things.",
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
      "index": 19,
      "prompt_id": "pr_ffm_19",
      "prompt_snippet": "I seldom feel blue.",
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
      "index": 20,
      "prompt_id": "pr_ffm_20",
      "prompt_snippet": "I am not interested in abstract ideas.",
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
      "index": 21,
      "prompt_id": "pr_ffm_21",
      "prompt_snippet": "I start conversations.",
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
      "index": 22,
      "prompt_id": "pr_ffm_22",
      "prompt_snippet": "I am not interested in other people’s problems.",
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
      "index": 23,
      "prompt_id": "pr_ffm_23",
      "prompt_snippet": "I get chores done right away.",
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
      "index": 24,
      "prompt_id": "pr_ffm_24",
      "prompt_snippet": "I am easily disturbed.",
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
      "index": 25,
      "prompt_id": "pr_ffm_25",
      "prompt_snippet": "I have excellent ideas.",
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
      "index": 26,
      "prompt_id": "pr_ffm_26",
      "prompt_snippet": "I have little to say.",
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
      "index": 27,
      "prompt_id": "pr_ffm_27",
      "prompt_snippet": "I have a soft heart.",
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
      "index": 28,
      "prompt_id": "pr_ffm_28",
      "prompt_snippet": "I often forget to put things back in their proper place.",
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
      "index": 29,
      "prompt_id": "pr_ffm_29",
      "prompt_snippet": "I get upset easily.",
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
      "index": 30,
      "prompt_id": "pr_ffm_30",
      "prompt_snippet": "I do not have a good imagination.",
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
      "index": 31,
      "prompt_id": "pr_ffm_31",
      "prompt_snippet": "I talk to a lot of different people at parties.",
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
      "index": 32,
      "prompt_id": "pr_ffm_32",
      "prompt_snippet": "I am not really interested in others.",
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
      "index": 33,
      "prompt_id": "pr_ffm_33",
      "prompt_snippet": "I like order.",
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
      "index": 34,
      "prompt_id": "pr_ffm_34",
      "prompt_snippet": "I change my mood a lot.",
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
      "index": 35,
      "prompt_id": "pr_ffm_35",
      "prompt_snippet": "I am quick to understand things.",
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
      "index": 36,
      "prompt_id": "pr_ffm_36",
      "prompt_snippet": "I don’t like to draw attention to myself.",
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
      "index": 37,
      "prompt_id": "pr_ffm_37",
      "prompt_snippet": "I take time out for others.",
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
      "index": 38,
      "prompt_id": "pr_ffm_38",
      "prompt_snippet": "I shirk my duties.",
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
      "index": 39,
      "prompt_id": "pr_ffm_39",
      "prompt_snippet": "I have frequent mood swings.",
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
      "index": 40,
      "prompt_id": "pr_ffm_40",
      "prompt_snippet": "I use difficult words.",
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
      "index": 41,
      "prompt_id": "pr_ffm_41",
      "prompt_snippet": "I don’t mind being the center of attention.",
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
      "index": 42,
      "prompt_id": "pr_ffm_42",
      "prompt_snippet": "I feel others’ emotions.",
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
      "index": 43,
      "prompt_id": "pr_ffm_43",
      "prompt_snippet": "I follow a schedule.",
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
      "index": 44,
      "prompt_id": "pr_ffm_44",
      "prompt_snippet": "I get irritated easily.",
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
      "index": 45,
      "prompt_id": "pr_ffm_45",
      "prompt_snippet": "I spend time reflecting on things.",
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
      "index": 46,
      "prompt_id": "pr_ffm_46",
      "prompt_snippet": "I am quiet around strangers.",
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
      "index": 47,
      "prompt_id": "pr_ffm_47",
      "prompt_snippet": "I make people feel at ease.",
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
      "index": 48,
      "prompt_id": "pr_ffm_48",
      "prompt_snippet": "I am exacting in my work.",
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
      "index": 49,
      "prompt_id": "pr_ffm_49",
      "prompt_snippet": "I often feel blue.",
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
      "index": 50,
      "prompt_id": "pr_ffm_50",
      "prompt_snippet": "I am full of ideas.",
      "dimension": "rating",
      "values": [
        5,
        4,
        3,
        2,
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

- Items: 50
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am the life of the party. | rating | 1,2,3,4,5 | no |
| 2 | I feel little concern for others. | rating | 5,4,3,2,1 | no |
| 3 | I am always prepared. | rating | 1,2,3,4,5 | no |
| 4 | I get stressed out easily. | rating | 5,4,3,2,1 | no |
| 5 | I have a rich vocabulary. | rating | 1,2,3,4,5 | no |
| 6 | I don’t talk a lot. | rating | 5,4,3,2,1 | no |
| 7 | I am interested in people. | rating | 1,2,3,4,5 | no |
| 8 | I leave my belongings around. | rating | 5,4,3,2,1 | no |
| 9 | I am relaxed most of the time. | rating | 1,2,3,4,5 | no |
| 10 | I have difficulty understanding abstract ideas. | rating | 5,4,3,2,1 | no |
| 11 | I feel comfortable around people. | rating | 1,2,3,4,5 | no |
| 12 | I insult people. | rating | 5,4,3,2,1 | no |
| 13 | I pay attention to details. | rating | 1,2,3,4,5 | no |
| 14 | I worry about things. | rating | 5,4,3,2,1 | no |
| 15 | I have a vivid imagination. | rating | 1,2,3,4,5 | no |
| 16 | I keep in the background. | rating | 5,4,3,2,1 | no |
| 17 | I sympathize with others’ feelings. | rating | 1,2,3,4,5 | no |
| 18 | I make a mess of things. | rating | 5,4,3,2,1 | no |
| 19 | I seldom feel blue. | rating | 1,2,3,4,5 | no |
| 20 | I am not interested in abstract ideas. | rating | 5,4,3,2,1 | no |
| 21 | I start conversations. | rating | 1,2,3,4,5 | no |
| 22 | I am not interested in other people’s problems. | rating | 5,4,3,2,1 | no |
| 23 | I get chores done right away. | rating | 1,2,3,4,5 | no |
| 24 | I am easily disturbed. | rating | 5,4,3,2,1 | no |
| 25 | I have excellent ideas. | rating | 1,2,3,4,5 | no |
| 26 | I have little to say. | rating | 5,4,3,2,1 | no |
| 27 | I have a soft heart. | rating | 1,2,3,4,5 | no |
| 28 | I often forget to put things back in their proper place. | rating | 5,4,3,2,1 | no |
| 29 | I get upset easily. | rating | 1,2,3,4,5 | no |
| 30 | I do not have a good imagination. | rating | 5,4,3,2,1 | no |
| 31 | I talk to a lot of different people at parties. | rating | 1,2,3,4,5 | no |
| 32 | I am not really interested in others. | rating | 5,4,3,2,1 | no |
| 33 | I like order. | rating | 1,2,3,4,5 | no |
| 34 | I change my mood a lot. | rating | 5,4,3,2,1 | no |
| 35 | I am quick to understand things. | rating | 1,2,3,4,5 | no |
| 36 | I don’t like to draw attention to myself. | rating | 5,4,3,2,1 | no |
| 37 | I take time out for others. | rating | 1,2,3,4,5 | no |
| 38 | I shirk my duties. | rating | 5,4,3,2,1 | no |
| 39 | I have frequent mood swings. | rating | 1,2,3,4,5 | no |
| 40 | I use difficult words. | rating | 5,4,3,2,1 | no |
| 41 | I don’t mind being the center of attention. | rating | 1,2,3,4,5 | no |
| 42 | I feel others’ emotions. | rating | 5,4,3,2,1 | no |
| 43 | I follow a schedule. | rating | 1,2,3,4,5 | no |
| 44 | I get irritated easily. | rating | 5,4,3,2,1 | no |
| 45 | I spend time reflecting on things. | rating | 1,2,3,4,5 | no |
| 46 | I am quiet around strangers. | rating | 5,4,3,2,1 | no |
| 47 | I make people feel at ease. | rating | 1,2,3,4,5 | no |
| 48 | I am exacting in my work. | rating | 5,4,3,2,1 | no |
| 49 | I often feel blue. | rating | 1,2,3,4,5 | no |
| 50 | I am full of ideas. | rating | 5,4,3,2,1 | no |

## To research (fill from https://psychology-tools.com/test/big-5-personality-test)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
