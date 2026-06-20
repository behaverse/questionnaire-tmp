# Scoring — Eating Attitudes Test - 26 Item (EAT-26) (`qst_eat26`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_eat26",
  "title": "Eating Attitudes Test - 26 Item (EAT-26)",
  "short_title": "EAT-26",
  "source_url": "https://psychology-tools.com/test/eat-26",
  "publication": null,
  "status": "needs-research",
  "item_count": 32,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_eat26_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "Always",
        "Usually",
        "Often",
        "Sometimes",
        "Rarely",
        "Never"
      ]
    },
    {
      "ref": "opt_eat26_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        0,
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
        "Always",
        "Usually",
        "Often",
        "Sometimes",
        "Rarely",
        "Never"
      ]
    },
    {
      "ref": "opt_eat26_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        0,
        1,
        1,
        1,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Never",
        "Once a month or less",
        "2-3 times a month",
        "Once a week",
        "2-6 times a week",
        "Once a day or more"
      ]
    },
    {
      "ref": "opt_eat26_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        1,
        1,
        1,
        1,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Never",
        "Once a month or less",
        "2-3 times a month",
        "Once a week",
        "2-6 times a week",
        "Once a day or more"
      ]
    },
    {
      "ref": "opt_eat26_rating_5",
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
      "prompt_id": "pr_eat26_1",
      "prompt_snippet": "I am terrified about being overweight.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_eat26_2",
      "prompt_snippet": "I avoid eating when I am hungry.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_eat26_3",
      "prompt_snippet": "I find myself preoccupied with food.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_eat26_4",
      "prompt_snippet": "I have gone on eating binges where I feel that I may not be able to stop.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_eat26_5",
      "prompt_snippet": "I cut my food into small pieces.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_eat26_6",
      "prompt_snippet": "I aware of the calorie content of foods that I eat.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_eat26_7",
      "prompt_snippet": "I particularly avoid food with a high carbohydrate content (i.e. bread, rice, po",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_eat26_8",
      "prompt_snippet": "I feel that others would prefer if I ate more.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_eat26_9",
      "prompt_snippet": "I vomit after I have eaten.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_eat26_10",
      "prompt_snippet": "I feel extremely guilty after eating.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_eat26_11",
      "prompt_snippet": "I am occupied with a desire to be thinner.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_eat26_12",
      "prompt_snippet": "I think about burning up calories when I exercise.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_eat26_13",
      "prompt_snippet": "I other people think that I am too thin.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_eat26_14",
      "prompt_snippet": "I am preoccupied with the thought of having fat on my body.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_eat26_15",
      "prompt_snippet": "I take longer than others to eat my meals.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_eat26_16",
      "prompt_snippet": "I avoid foods with sugar in them.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_eat26_17",
      "prompt_snippet": "I eat diet foods.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_eat26_18",
      "prompt_snippet": "I feel that food controls my life.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_eat26_19",
      "prompt_snippet": "I display self-control around food.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_eat26_20",
      "prompt_snippet": "I feel that others pressure me to eat.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_eat26_21",
      "prompt_snippet": "I give too much time and thought to food.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_eat26_22",
      "prompt_snippet": "I feel uncomfortable after eating sweets.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_eat26_23",
      "prompt_snippet": "I engage in dieting behavior.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_eat26_24",
      "prompt_snippet": "I like my stomach to be empty.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_eat26_25",
      "prompt_snippet": "I have the impulse to vomit after meals.",
      "dimension": "rating",
      "values": [
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_eat26_26",
      "prompt_snippet": "I enjoy trying new rich foods.",
      "dimension": "rating",
      "values": [
        0,
        0,
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_eat26_27",
      "prompt_snippet": "Gone on eating binges where you feel that you may not be able to stop? (Defined ",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_eat26_28",
      "prompt_snippet": "Ever made yourself sick (vomited) to control your weight or shape?",
      "dimension": "rating",
      "values": [
        0,
        1,
        1,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_eat26_29",
      "prompt_snippet": "Ever used laxatives, diet pills or diuretics (water pills) to control your weigh",
      "dimension": "rating",
      "values": [
        0,
        1,
        1,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_eat26_30",
      "prompt_snippet": "Exercised more than 60 minutes a day to lose or to control your weight?",
      "dimension": "rating",
      "values": [
        0,
        1,
        1,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_eat26_31",
      "prompt_snippet": "Lost 20 pounds or more in the past 6 months?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_eat26_32",
      "prompt_snippet": "Have you ever been treated for an eating disorder?",
      "dimension": "rating",
      "values": [
        1,
        0
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

- Items: 32
- Dimensions: rating
- Distinct scales: 5 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am terrified about being overweight. | rating | 3,2,1,0,0,0 | no |
| 2 | I avoid eating when I am hungry. | rating | 3,2,1,0,0,0 | no |
| 3 | I find myself preoccupied with food. | rating | 3,2,1,0,0,0 | no |
| 4 | I have gone on eating binges where I feel that I may not be able to stop. | rating | 3,2,1,0,0,0 | no |
| 5 | I cut my food into small pieces. | rating | 3,2,1,0,0,0 | no |
| 6 | I aware of the calorie content of foods that I eat. | rating | 3,2,1,0,0,0 | no |
| 7 | I particularly avoid food with a high carbohydrate content (i.e. bread, rice, po | rating | 3,2,1,0,0,0 | no |
| 8 | I feel that others would prefer if I ate more. | rating | 3,2,1,0,0,0 | no |
| 9 | I vomit after I have eaten. | rating | 3,2,1,0,0,0 | no |
| 10 | I feel extremely guilty after eating. | rating | 3,2,1,0,0,0 | no |
| 11 | I am occupied with a desire to be thinner. | rating | 3,2,1,0,0,0 | no |
| 12 | I think about burning up calories when I exercise. | rating | 3,2,1,0,0,0 | no |
| 13 | I other people think that I am too thin. | rating | 3,2,1,0,0,0 | no |
| 14 | I am preoccupied with the thought of having fat on my body. | rating | 3,2,1,0,0,0 | no |
| 15 | I take longer than others to eat my meals. | rating | 3,2,1,0,0,0 | no |
| 16 | I avoid foods with sugar in them. | rating | 3,2,1,0,0,0 | no |
| 17 | I eat diet foods. | rating | 3,2,1,0,0,0 | no |
| 18 | I feel that food controls my life. | rating | 3,2,1,0,0,0 | no |
| 19 | I display self-control around food. | rating | 3,2,1,0,0,0 | no |
| 20 | I feel that others pressure me to eat. | rating | 3,2,1,0,0,0 | no |
| 21 | I give too much time and thought to food. | rating | 3,2,1,0,0,0 | no |
| 22 | I feel uncomfortable after eating sweets. | rating | 3,2,1,0,0,0 | no |
| 23 | I engage in dieting behavior. | rating | 3,2,1,0,0,0 | no |
| 24 | I like my stomach to be empty. | rating | 3,2,1,0,0,0 | no |
| 25 | I have the impulse to vomit after meals. | rating | 3,2,1,0,0,0 | no |
| 26 | I enjoy trying new rich foods. | rating | 0,0,0,1,2,3 | no |
| 27 | Gone on eating binges where you feel that you may not be able to stop? (Defined  | rating | 0,0,1,1,1,1 | no |
| 28 | Ever made yourself sick (vomited) to control your weight or shape? | rating | 0,1,1,1,1,1 | no |
| 29 | Ever used laxatives, diet pills or diuretics (water pills) to control your weigh | rating | 0,1,1,1,1,1 | no |
| 30 | Exercised more than 60 minutes a day to lose or to control your weight? | rating | 0,1,1,1,1,1 | no |
| 31 | Lost 20 pounds or more in the past 6 months? | rating | 1,0 | no |
| 32 | Have you ever been treated for an eating disorder? | rating | 1,0 | no |

## To research (fill from https://psychology-tools.com/test/eat-26)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
