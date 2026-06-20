# Scoring — Quantitative Checklist for Autism in Toddlers (Q-CHAT) (`qst_qchat`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_qchat",
  "title": "Quantitative Checklist for Autism in Toddlers (Q-CHAT)",
  "short_title": "Q-CHAT",
  "source_url": "https://psychology-tools.com/test/qchat-quantitative-checklist-for-autism-in-toddlers",
  "publication": {
    "citation": "C Allison, S Baron-Cohen, S Wheelwright, T Charman, J Richler, G Pasco, and C Brayne. The Q-CHAT (Quantitative CHecklist for Autism in Toddlers): A Normally Distributed Quantitative Measure of Autistic Traits at 18-24 Months of Age: Preliminary Report. J Autism Dev Disord 38 ( 8 ): 1414-1425 ( 2008 ).",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 25,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_qchat_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Always",
        "Usually",
        "Sometimes",
        "Rarely",
        "Never"
      ]
    },
    {
      "ref": "opt_qchat_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Very easy",
        "Quite easy",
        "Quite difficult",
        "Very difficult",
        "Impossible"
      ]
    },
    {
      "ref": "opt_qchat_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Always",
        "Usually",
        "Sometimes",
        "Rarely",
        "Never"
      ]
    },
    {
      "ref": "opt_qchat_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        1,
        2,
        3,
        4,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Always",
        "Usually",
        "Sometimes",
        "Rarely",
        "Never",
        "My child does not speak"
      ]
    },
    {
      "ref": "opt_qchat_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Many times a day",
        "A few times a day",
        "A few times a week",
        "Less than once a week",
        "Never"
      ]
    },
    {
      "ref": "opt_qchat_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Several hours",
        "Half an hour",
        "Ten minutes",
        "A couple of minutes",
        "Less than a minute"
      ]
    },
    {
      "ref": "opt_qchat_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "None - s/he has not started speaking yet",
        "Less than 10 words",
        "10 - 50 words",
        "51 - 100 words",
        "Over 100 words"
      ]
    },
    {
      "ref": "opt_qchat_rating_8",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Many times a day",
        "A few times a day",
        "A few times a week",
        "Less than once a week",
        "Never"
      ]
    },
    {
      "ref": "opt_qchat_rating_9",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Very typical",
        "Quite typical",
        "Slightly unusual",
        "Very unusual",
        "My child doesn’t speak"
      ]
    },
    {
      "ref": "opt_qchat_rating_10",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Most of the day",
        "Several hours",
        "Half an hour",
        "Ten minutes",
        "A couple of minutes"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_qchat_1",
      "prompt_snippet": "Does your child look at you when you call his/her name?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_qchat_2",
      "prompt_snippet": "How easy is it for you to get eye contact with your child?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_qchat_3",
      "prompt_snippet": "When your child is playing alone, does s/he line objects up?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_qchat_4",
      "prompt_snippet": "Can other people easily understand your child’s speech?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_qchat_5",
      "prompt_snippet": "Does your child point to indicate that s/he wants something (e.g. a toy that is ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_qchat_6",
      "prompt_snippet": "Does your child point to share interest with you (e.g. pointing at an interestin",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_qchat_7",
      "prompt_snippet": "How long can your child’s interest be maintained by a spinning object (e.g. wash",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_qchat_8",
      "prompt_snippet": "How many words can your child say?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_qchat_9",
      "prompt_snippet": "Does your child pretend (egg care for dolls, talk on a toy phone)?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_qchat_10",
      "prompt_snippet": "Does your child follow where you’re looking?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_qchat_11",
      "prompt_snippet": "How often does your child sniff or lick unusual objects?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_qchat_12",
      "prompt_snippet": "Does your child place your hand on an object when s/he wants you to use it (e.g.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_qchat_13",
      "prompt_snippet": "Does your child walk on tiptoe?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_qchat_14",
      "prompt_snippet": "How easy is it for your child to adapt when his/her routine changes or when thin",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_qchat_15",
      "prompt_snippet": "If you or someone else in the family is visibly upset, does your child show sign",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_qchat_16",
      "prompt_snippet": "Does your child do the same thing over and over again (e.g. running the tap, tur",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_qchat_17",
      "prompt_snippet": "Would you describe your child’s first words as:",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_qchat_18",
      "prompt_snippet": "Does your child echo things s/he hears (e.g. things that you say, lines from son",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_qchat_19",
      "prompt_snippet": "Does your child use simple gestures (e.g. wave goodbye)?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_qchat_20",
      "prompt_snippet": "Does your child make unusual finger movements near his/her eyes?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_qchat_21",
      "prompt_snippet": "Does your child spontaneously look at your face to check your reaction when face",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_qchat_22",
      "prompt_snippet": "How long can your child’s interest be maintained by just one or two objects?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_qchat_23",
      "prompt_snippet": "Does your child twiddle objects repetitively (e.g. pieces of string)?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_qchat_24",
      "prompt_snippet": "Does your child seem oversensitive to noise?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_qchat_25",
      "prompt_snippet": "Does your child stare at nothing with no apparent purpose?",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
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

- Items: 25
- Dimensions: rating
- Distinct scales: 10 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Does your child look at you when you call his/her name? | rating | 0,1,2,3,4 | no |
| 2 | How easy is it for you to get eye contact with your child? | rating | 0,1,2,3,4 | no |
| 3 | When your child is playing alone, does s/he line objects up? | rating | 4,3,2,1,0 | no |
| 4 | Can other people easily understand your child’s speech? | rating | 0,1,2,3,4,4 | no |
| 5 | Does your child point to indicate that s/he wants something (e.g. a toy that is  | rating | 0,1,2,3,4 | no |
| 6 | Does your child point to share interest with you (e.g. pointing at an interestin | rating | 0,1,2,3,4 | no |
| 7 | How long can your child’s interest be maintained by a spinning object (e.g. wash | rating | 4,3,2,1,0 | no |
| 8 | How many words can your child say? | rating | 4,3,2,1,0 | no |
| 9 | Does your child pretend (egg care for dolls, talk on a toy phone)? | rating | 0,1,2,3,4 | no |
| 10 | Does your child follow where you’re looking? | rating | 0,1,2,3,4 | no |
| 11 | How often does your child sniff or lick unusual objects? | rating | 4,3,2,1,0 | no |
| 12 | Does your child place your hand on an object when s/he wants you to use it (e.g. | rating | 4,3,2,1,0 | no |
| 13 | Does your child walk on tiptoe? | rating | 4,3,2,1,0 | no |
| 14 | How easy is it for your child to adapt when his/her routine changes or when thin | rating | 0,1,2,3,4 | no |
| 15 | If you or someone else in the family is visibly upset, does your child show sign | rating | 0,1,2,3,4 | no |
| 16 | Does your child do the same thing over and over again (e.g. running the tap, tur | rating | 4,3,2,1,0 | no |
| 17 | Would you describe your child’s first words as: | rating | 0,1,2,3,4 | no |
| 18 | Does your child echo things s/he hears (e.g. things that you say, lines from son | rating | 4,3,2,1,0 | no |
| 19 | Does your child use simple gestures (e.g. wave goodbye)? | rating | 0,1,2,3,4 | no |
| 20 | Does your child make unusual finger movements near his/her eyes? | rating | 4,3,2,1,0 | no |
| 21 | Does your child spontaneously look at your face to check your reaction when face | rating | 0,1,2,3,4 | no |
| 22 | How long can your child’s interest be maintained by just one or two objects? | rating | 4,3,2,1,0 | no |
| 23 | Does your child twiddle objects repetitively (e.g. pieces of string)? | rating | 4,3,2,1,0 | no |
| 24 | Does your child seem oversensitive to noise? | rating | 4,3,2,1,0 | no |
| 25 | Does your child stare at nothing with no apparent purpose? | rating | 4,3,2,1,0 | no |

## To research (fill from https://psychology-tools.com/test/qchat-quantitative-checklist-for-autism-in-toddlers)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
