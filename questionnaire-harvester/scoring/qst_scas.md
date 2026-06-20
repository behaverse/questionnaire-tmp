# Scoring — Spence Children's Anxiety Scale (SCAS) (`qst_scas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_scas",
  "title": "Spence Children's Anxiety Scale (SCAS)",
  "short_title": "SCAS",
  "source_url": "https://psychology-tools.com/test/spence-childrens-anxiety-scale",
  "publication": {
    "citation": "S H Spence. Structure of Anxiety Symptoms Among Children: A Confirmatory Factor-Analytic Study. 106 ( 2 ): Journal of Abnormal Psychology 280-297 ( 1997 ). [ PDF ]",
    "year": 1997
  },
  "status": "needs-research",
  "item_count": 45,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_scas_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Never",
        "Sometimes",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_scas_1",
      "prompt_snippet": "I worry about things.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_scas_2",
      "prompt_snippet": "I am scared of the dark.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_scas_3",
      "prompt_snippet": "When I have a problem, I get a funny feeling in my stomach.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_scas_4",
      "prompt_snippet": "I feel afraid.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_scas_5",
      "prompt_snippet": "I would feel afraid of being on my own at home.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_scas_6",
      "prompt_snippet": "I feel scared when I have to take a test.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_scas_7",
      "prompt_snippet": "I feel afraid if I have to use public toilets or bathrooms.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_scas_8",
      "prompt_snippet": "I worry about being away from my parents.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_scas_9",
      "prompt_snippet": "I feel afraid that I will make a fool of myself in front of people.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_scas_10",
      "prompt_snippet": "I worry that I will do badly at my school work.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_scas_11",
      "prompt_snippet": "I am popular amongst other kids my own age.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_scas_12",
      "prompt_snippet": "I worry that something awful will happen to someone in my family.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_scas_13",
      "prompt_snippet": "I suddenly feel as if I can’t breathe when there is no reason for this.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_scas_14",
      "prompt_snippet": "I have to keep checking that I have done things right (like the switch is off, o",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_scas_15",
      "prompt_snippet": "I feel scared if I have to sleep on my own.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_scas_16",
      "prompt_snippet": "I have trouble going to school in the mornings because I feel nervous or afraid.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_scas_17",
      "prompt_snippet": "I am good at sports.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_scas_18",
      "prompt_snippet": "I am scared of dogs.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_scas_19",
      "prompt_snippet": "I can’t seem to get bad or silly thoughts out of my head.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_scas_20",
      "prompt_snippet": "When I have a problem, my heart beats really fast.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_scas_21",
      "prompt_snippet": "I suddenly start to tremble or shake when there is no reason for this.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_scas_22",
      "prompt_snippet": "I worry that something bad will happen to me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_scas_23",
      "prompt_snippet": "I am scared of going to the doctors or dentists.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_scas_24",
      "prompt_snippet": "When I have a problem, I feel shaky.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_scas_25",
      "prompt_snippet": "I am scared of being in high places or elevators (lifts).",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_scas_26",
      "prompt_snippet": "I am a good person.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_scas_27",
      "prompt_snippet": "I have to think of special thoughts to stop bad things from happening (like numb",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_scas_28",
      "prompt_snippet": "I feel scared if I have to travel in the car, or on a bus or a train.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_scas_29",
      "prompt_snippet": "I worry what other people think of me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_scas_30",
      "prompt_snippet": "I am afraid of being in crowded places (like shopping centers, the movies, buses",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_scas_31",
      "prompt_snippet": "I feel happy.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_scas_32",
      "prompt_snippet": "All of a sudden I feel really scared for no reason at all.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_scas_33",
      "prompt_snippet": "I am scared of insects or spiders.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_scas_34",
      "prompt_snippet": "I suddenly become dizzy or faint when there is no reason for this.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_scas_35",
      "prompt_snippet": "I feel afraid if I have to talk in front of my class.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_scas_36",
      "prompt_snippet": "My heart suddenly starts to beat too quickly for no reason.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_scas_37",
      "prompt_snippet": "I worry that I will suddenly get a scared feeling when there is nothing to be af",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_scas_38",
      "prompt_snippet": "I like myself.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_scas_39",
      "prompt_snippet": "I am afraid of being in small closed places, like tunnels or small rooms.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_scas_40",
      "prompt_snippet": "I have to do some things over and over again (like washing my hands, cleaning or",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_scas_41",
      "prompt_snippet": "I get bothered by bad or silly thoughts or pictures in my mind.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_scas_42",
      "prompt_snippet": "I have to do some things in just the right way to stop bad things happening.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_scas_43",
      "prompt_snippet": "I am proud of my school work.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 44,
      "prompt_id": "pr_scas_44",
      "prompt_snippet": "I would feel scared if I had to stay away from home overnight.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 45,
      "prompt_id": "pr_scas_45",
      "prompt_snippet": "Is there something else that you are really afraid of? How often are you afraid ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
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

- Items: 45
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I worry about things. | rating | 0,1,2,3 | no |
| 2 | I am scared of the dark. | rating | 0,1,2,3 | no |
| 3 | When I have a problem, I get a funny feeling in my stomach. | rating | 0,1,2,3 | no |
| 4 | I feel afraid. | rating | 0,1,2,3 | no |
| 5 | I would feel afraid of being on my own at home. | rating | 0,1,2,3 | no |
| 6 | I feel scared when I have to take a test. | rating | 0,1,2,3 | no |
| 7 | I feel afraid if I have to use public toilets or bathrooms. | rating | 0,1,2,3 | no |
| 8 | I worry about being away from my parents. | rating | 0,1,2,3 | no |
| 9 | I feel afraid that I will make a fool of myself in front of people. | rating | 0,1,2,3 | no |
| 10 | I worry that I will do badly at my school work. | rating | 0,1,2,3 | no |
| 11 | I am popular amongst other kids my own age. | rating | 0,1,2,3 | no |
| 12 | I worry that something awful will happen to someone in my family. | rating | 0,1,2,3 | no |
| 13 | I suddenly feel as if I can’t breathe when there is no reason for this. | rating | 0,1,2,3 | no |
| 14 | I have to keep checking that I have done things right (like the switch is off, o | rating | 0,1,2,3 | no |
| 15 | I feel scared if I have to sleep on my own. | rating | 0,1,2,3 | no |
| 16 | I have trouble going to school in the mornings because I feel nervous or afraid. | rating | 0,1,2,3 | no |
| 17 | I am good at sports. | rating | 0,1,2,3 | no |
| 18 | I am scared of dogs. | rating | 0,1,2,3 | no |
| 19 | I can’t seem to get bad or silly thoughts out of my head. | rating | 0,1,2,3 | no |
| 20 | When I have a problem, my heart beats really fast. | rating | 0,1,2,3 | no |
| 21 | I suddenly start to tremble or shake when there is no reason for this. | rating | 0,1,2,3 | no |
| 22 | I worry that something bad will happen to me. | rating | 0,1,2,3 | no |
| 23 | I am scared of going to the doctors or dentists. | rating | 0,1,2,3 | no |
| 24 | When I have a problem, I feel shaky. | rating | 0,1,2,3 | no |
| 25 | I am scared of being in high places or elevators (lifts). | rating | 0,1,2,3 | no |
| 26 | I am a good person. | rating | 0,1,2,3 | no |
| 27 | I have to think of special thoughts to stop bad things from happening (like numb | rating | 0,1,2,3 | no |
| 28 | I feel scared if I have to travel in the car, or on a bus or a train. | rating | 0,1,2,3 | no |
| 29 | I worry what other people think of me. | rating | 0,1,2,3 | no |
| 30 | I am afraid of being in crowded places (like shopping centers, the movies, buses | rating | 0,1,2,3 | no |
| 31 | I feel happy. | rating | 0,1,2,3 | no |
| 32 | All of a sudden I feel really scared for no reason at all. | rating | 0,1,2,3 | no |
| 33 | I am scared of insects or spiders. | rating | 0,1,2,3 | no |
| 34 | I suddenly become dizzy or faint when there is no reason for this. | rating | 0,1,2,3 | no |
| 35 | I feel afraid if I have to talk in front of my class. | rating | 0,1,2,3 | no |
| 36 | My heart suddenly starts to beat too quickly for no reason. | rating | 0,1,2,3 | no |
| 37 | I worry that I will suddenly get a scared feeling when there is nothing to be af | rating | 0,1,2,3 | no |
| 38 | I like myself. | rating | 0,1,2,3 | no |
| 39 | I am afraid of being in small closed places, like tunnels or small rooms. | rating | 0,1,2,3 | no |
| 40 | I have to do some things over and over again (like washing my hands, cleaning or | rating | 0,1,2,3 | no |
| 41 | I get bothered by bad or silly thoughts or pictures in my mind. | rating | 0,1,2,3 | no |
| 42 | I have to do some things in just the right way to stop bad things happening. | rating | 0,1,2,3 | no |
| 43 | I am proud of my school work. | rating | 0,1,2,3 | no |
| 44 | I would feel scared if I had to stay away from home overnight. | rating | 0,1,2,3 | no |
| 45 | Is there something else that you are really afraid of? How often are you afraid  | rating | 0,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/spence-childrens-anxiety-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
