# Scoring — Infant-Toddler Checklist (ITC) (`qst_itc`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_itc",
  "title": "Infant-Toddler Checklist (ITC)",
  "short_title": "ITC",
  "source_url": "https://psychology-tools.com/test/infant-toddler-checklist",
  "publication": {
    "citation": "A M Wetherby, S Brosnan-Maddox, V Peace, L Newton. ( 2008 ). Validation of the Infant-Toddler Checklist as a broadband screener for autism spectrum disorders from 9 to 24 months of age. Autism, 12 ( 5 ), 487-511.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 24,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_itc_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        0,
        1,
        2
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "Not Yet",
        "Sometimes",
        "Often"
      ]
    },
    {
      "ref": "opt_itc_rating_2",
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
        "None",
        "1-2",
        "3-4",
        "5-8",
        "over 8"
      ]
    },
    {
      "ref": "opt_itc_rating_3",
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
        "None",
        "1-3",
        "4-10",
        "11-30",
        "over 30"
      ]
    },
    {
      "ref": "opt_itc_rating_4",
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
        "None",
        "2 blocks",
        "3-4 blocks",
        "5 or more"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_itc_1",
      "prompt_snippet": "Do you know when your child is happy and when your child is upset?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_itc_2",
      "prompt_snippet": "When your child plays with toys, does he/she look at you to see if you are watch",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_itc_3",
      "prompt_snippet": "Does your child smile or laugh while looking at you?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_itc_4",
      "prompt_snippet": "When you look at and point to a toy across the room, does your child look at it?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_itc_5",
      "prompt_snippet": "Does your child let you know that he/she needs help or wants an object out of re",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_itc_6",
      "prompt_snippet": "When you are not paying attention to your child, does he/she try to get your att",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_itc_7",
      "prompt_snippet": "Does your child do things just to get you to laugh?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_itc_8",
      "prompt_snippet": "Does your child try to get you to notice interesting objects—just to get you to ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_itc_9",
      "prompt_snippet": "Does your child pick up objects and give them to you?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_itc_10",
      "prompt_snippet": "Does your child show objects to you without giving you the object?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_itc_11",
      "prompt_snippet": "Does your child wave to greet people?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_itc_12",
      "prompt_snippet": "Does your child point to objects?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_itc_13",
      "prompt_snippet": "Does your child nod his/her head to indicate yes?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_itc_14",
      "prompt_snippet": "Does your child use sounds or words to get attention or help?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_itc_15",
      "prompt_snippet": "Does your child string sounds together, such as uh oh , mama , gaga , bye bye , ",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_itc_16",
      "prompt_snippet": "About how many of the following consonant sounds does your child use: ma, na, ba",
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
      "index": 17,
      "prompt_id": "pr_itc_17",
      "prompt_snippet": "About how many different words does your child use meaningfully that you recogni",
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
      "prompt_id": "pr_itc_18",
      "prompt_snippet": "Does your child put two words together (for example, more cookie , bye bye Daddy",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_itc_19",
      "prompt_snippet": "When you call your child’s name, does he/she respond by looking or turning towar",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_itc_20",
      "prompt_snippet": "About how many different words or phrases does your child understand without ges",
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
      "index": 21,
      "prompt_id": "pr_itc_21",
      "prompt_snippet": "Does your child show interest in playing with a variety of objects?",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_itc_22",
      "prompt_snippet": "About how many of the following objects does your child use appropriately: cup, ",
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
      "index": 23,
      "prompt_id": "pr_itc_23",
      "prompt_snippet": "About how many blocks (or rings) does your child stack?",
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
      "prompt_id": "pr_itc_24",
      "prompt_snippet": "Does your child pretend to play with toys (for example, feed a stuffed animal, p",
      "dimension": "rating",
      "values": [
        0,
        1,
        2
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
- Distinct scales: 4 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Do you know when your child is happy and when your child is upset? | rating | 0,1,2 | no |
| 2 | When your child plays with toys, does he/she look at you to see if you are watch | rating | 0,1,2 | no |
| 3 | Does your child smile or laugh while looking at you? | rating | 0,1,2 | no |
| 4 | When you look at and point to a toy across the room, does your child look at it? | rating | 0,1,2 | no |
| 5 | Does your child let you know that he/she needs help or wants an object out of re | rating | 0,1,2 | no |
| 6 | When you are not paying attention to your child, does he/she try to get your att | rating | 0,1,2 | no |
| 7 | Does your child do things just to get you to laugh? | rating | 0,1,2 | no |
| 8 | Does your child try to get you to notice interesting objects—just to get you to  | rating | 0,1,2 | no |
| 9 | Does your child pick up objects and give them to you? | rating | 0,1,2 | no |
| 10 | Does your child show objects to you without giving you the object? | rating | 0,1,2 | no |
| 11 | Does your child wave to greet people? | rating | 0,1,2 | no |
| 12 | Does your child point to objects? | rating | 0,1,2 | no |
| 13 | Does your child nod his/her head to indicate yes? | rating | 0,1,2 | no |
| 14 | Does your child use sounds or words to get attention or help? | rating | 0,1,2 | no |
| 15 | Does your child string sounds together, such as uh oh , mama , gaga , bye bye ,  | rating | 0,1,2 | no |
| 16 | About how many of the following consonant sounds does your child use: ma, na, ba | rating | 0,1,2,3,4 | no |
| 17 | About how many different words does your child use meaningfully that you recogni | rating | 0,1,2,3,4 | no |
| 18 | Does your child put two words together (for example, more cookie , bye bye Daddy | rating | 0,1,2 | no |
| 19 | When you call your child’s name, does he/she respond by looking or turning towar | rating | 0,1,2 | no |
| 20 | About how many different words or phrases does your child understand without ges | rating | 0,1,2,3,4 | no |
| 21 | Does your child show interest in playing with a variety of objects? | rating | 0,1,2 | no |
| 22 | About how many of the following objects does your child use appropriately: cup,  | rating | 0,1,2,3,4 | no |
| 23 | About how many blocks (or rings) does your child stack? | rating | 0,1,2,3 | no |
| 24 | Does your child pretend to play with toys (for example, feed a stuffed animal, p | rating | 0,1,2 | no |

## To research (fill from https://psychology-tools.com/test/infant-toddler-checklist)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
