# Scoring — Trauma-Related Shame Inventory (TRSI-24) (`qst_trsi24`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_trsi24",
  "title": "Trauma-Related Shame Inventory (TRSI-24)",
  "short_title": "TRSI-24",
  "source_url": "https://psychology-tools.com/test/trauma-related-shame-inventory",
  "publication": {
    "citation": "T Øktedalen, KA Hagtvet, A Hoffart, TF Langkaas, M Smucker. The Trauma Related Shame Inventory: Measuring Trauma-Related Shame Among Patients with PTSD. J Psychopathol Behav Assess ( 36 ): 4, 600-615. ( 2014 )",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 24,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_trsi24_rating_1",
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
        "Not true of me",
        "Somewhat true of me",
        "Mostly true of me",
        "Completely true of me"
      ]
    },
    {
      "ref": "opt_trsi24_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        1,
        2,
        3
      ],
      "value_range": [
        1,
        3
      ],
      "anchors": [
        "Not true of me",
        "Somewhat true of me",
        "Mostly true of me",
        "Completely true of me"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_trsi24_1",
      "prompt_snippet": "As a result of my traumatic experience, I have lost respect for myself.",
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
      "prompt_id": "pr_trsi24_2",
      "prompt_snippet": "Because of what happened to me, others find me less desirable.",
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
      "prompt_id": "pr_trsi24_3",
      "prompt_snippet": "I am ashamed of myself because of what happened to me.",
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
      "prompt_id": "pr_trsi24_4",
      "prompt_snippet": "As a result of my traumatic experience, others have seen parts of me that they w",
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
      "prompt_id": "pr_trsi24_5",
      "prompt_snippet": "As a result of my traumatic experience, I cannot accept myself.",
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
      "prompt_id": "pr_trsi24_6",
      "prompt_snippet": "If others knew what happened to me, they would view me as inferior.",
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
      "prompt_id": "pr_trsi24_7",
      "prompt_snippet": "If others knew what happened to me, they would be disgusted with me.",
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
      "prompt_id": "pr_trsi24_8",
      "prompt_snippet": "I am ashamed of the way I behaved during my traumatic experience.",
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
      "prompt_id": "pr_trsi24_9",
      "prompt_snippet": "I am so ashamed of what happened to me that I sometimes want to escape from myse",
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
      "prompt_id": "pr_trsi24_10",
      "prompt_snippet": "As a result of my traumatic experience, I find myself less desirable.",
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
      "prompt_id": "pr_trsi24_11",
      "prompt_snippet": "I am ashamed of the way I felt during my traumatic experience.",
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
      "prompt_id": "pr_trsi24_12",
      "prompt_snippet": "If others knew what had happened to me, they would look down on me.",
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
      "prompt_id": "pr_trsi24_13",
      "prompt_snippet": "As a result of my traumatic experience, there are parts of me that I want to get",
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
      "prompt_id": "pr_trsi24_14",
      "prompt_snippet": "If others knew what happened to me, they would not like me.",
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
      "prompt_id": "pr_trsi24_15",
      "prompt_snippet": "Because of my traumatic experience, I feel inferior to others.",
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
      "prompt_id": "pr_trsi24_16",
      "prompt_snippet": "If others knew what happened to me, they would be ashamed of me.",
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
      "prompt_id": "pr_trsi24_17",
      "prompt_snippet": "If others knew what happened to me, they would find me unacceptable.",
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
      "prompt_id": "pr_trsi24_18",
      "prompt_snippet": "As a result of my traumatic experience, a part of me has been exposed that other",
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
      "prompt_id": "pr_trsi24_19",
      "prompt_snippet": "If otherslist knew how I behaved during my traumatic experience, they would be a",
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
      "prompt_id": "pr_trsi24_20",
      "prompt_snippet": "My traumatic experience has revealed a part of me that I am ashamed of.",
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
      "prompt_id": "pr_trsi24_21",
      "prompt_snippet": "As a result of my traumatic experience, I don’t like myself.",
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
      "prompt_id": "pr_trsi24_22",
      "prompt_snippet": "If others knew how I felt during my traumatic experience, they would be ashamed ",
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
      "prompt_id": "pr_trsi24_23",
      "prompt_snippet": "Because of what happened to me, I am disgusted with myself.",
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
      "prompt_id": "pr_trsi24_24",
      "prompt_snippet": "I am so ashamed of what happened to me that I sometimes want to become invisible",
      "dimension": "rating",
      "values": [
        1,
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

- Items: 24
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | As a result of my traumatic experience, I have lost respect for myself. | rating | 0,1,2,3 | no |
| 2 | Because of what happened to me, others find me less desirable. | rating | 0,1,2,3 | no |
| 3 | I am ashamed of myself because of what happened to me. | rating | 0,1,2,3 | no |
| 4 | As a result of my traumatic experience, others have seen parts of me that they w | rating | 0,1,2,3 | no |
| 5 | As a result of my traumatic experience, I cannot accept myself. | rating | 0,1,2,3 | no |
| 6 | If others knew what happened to me, they would view me as inferior. | rating | 0,1,2,3 | no |
| 7 | If others knew what happened to me, they would be disgusted with me. | rating | 0,1,2,3 | no |
| 8 | I am ashamed of the way I behaved during my traumatic experience. | rating | 0,1,2,3 | no |
| 9 | I am so ashamed of what happened to me that I sometimes want to escape from myse | rating | 0,1,2,3 | no |
| 10 | As a result of my traumatic experience, I find myself less desirable. | rating | 0,1,2,3 | no |
| 11 | I am ashamed of the way I felt during my traumatic experience. | rating | 0,1,2,3 | no |
| 12 | If others knew what had happened to me, they would look down on me. | rating | 0,1,2,3 | no |
| 13 | As a result of my traumatic experience, there are parts of me that I want to get | rating | 0,1,2,3 | no |
| 14 | If others knew what happened to me, they would not like me. | rating | 0,1,2,3 | no |
| 15 | Because of my traumatic experience, I feel inferior to others. | rating | 0,1,2,3 | no |
| 16 | If others knew what happened to me, they would be ashamed of me. | rating | 0,1,2,3 | no |
| 17 | If others knew what happened to me, they would find me unacceptable. | rating | 0,1,2,3 | no |
| 18 | As a result of my traumatic experience, a part of me has been exposed that other | rating | 0,1,2,3 | no |
| 19 | If otherslist knew how I behaved during my traumatic experience, they would be a | rating | 0,1,2,3 | no |
| 20 | My traumatic experience has revealed a part of me that I am ashamed of. | rating | 0,1,2,3 | no |
| 21 | As a result of my traumatic experience, I don’t like myself. | rating | 0,1,2,3 | no |
| 22 | If others knew how I felt during my traumatic experience, they would be ashamed  | rating | 0,1,2,3 | no |
| 23 | Because of what happened to me, I am disgusted with myself. | rating | 0,1,2,3 | no |
| 24 | I am so ashamed of what happened to me that I sometimes want to become invisible | rating | 1,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/trauma-related-shame-inventory)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
