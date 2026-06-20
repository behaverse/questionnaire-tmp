# Scoring — Childhood Autism Spectrum Test (CAST) (`qst_cast`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cast",
  "title": "Childhood Autism Spectrum Test (CAST)",
  "short_title": "CAST",
  "source_url": "https://psychology-tools.com/test/cast",
  "publication": {
    "citation": "J G Williams, C Allison, F J Scott, P F Bolton, S Baron-Cohen, F E Matthews, C Brayne. The Childhood Autism Spectrum Test (CAST): Sex Differences. 38(9): J Autism Dev Disord 1731-9. 2008.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 39,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_cast_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Yes",
        "No"
      ]
    },
    {
      "ref": "opt_cast_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        0
      ],
      "value_range": [
        0,
        0
      ],
      "anchors": [
        "Yes",
        "No"
      ]
    },
    {
      "ref": "opt_cast_rating_3",
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
      "prompt_id": "pr_cast_1",
      "prompt_snippet": "Does s/he join in playing games with other children easily?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_cast_2",
      "prompt_snippet": "Does s/he come up to you spontaneously for a chat?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_cast_3",
      "prompt_snippet": "Was s/he speaking by 2 years old?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_cast_4",
      "prompt_snippet": "Does s/he enjoy sports?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_cast_5",
      "prompt_snippet": "Is it important to him/her to fit in with the peer group?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_cast_6",
      "prompt_snippet": "Does s/he appear to notice unusual details that others miss?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_cast_7",
      "prompt_snippet": "Does s/he tend to take things literally?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_cast_8",
      "prompt_snippet": "When s/he was 3 years old, did s/he spend a lot of time pretending (e.g., play-a",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_cast_9",
      "prompt_snippet": "Does s/he like to do things over and over again, in the same way all the time?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_cast_10",
      "prompt_snippet": "Does s/he find it easy to interact with other children?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_cast_11",
      "prompt_snippet": "Can s/he keep a two-way conversation going?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_cast_12",
      "prompt_snippet": "Can s/he read appropriately for his/her age?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_cast_13",
      "prompt_snippet": "Does s/he mostly have the same interests as his/her peers?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_cast_14",
      "prompt_snippet": "Does s/he have an interest which takes up so much time that s/he does little els",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_cast_15",
      "prompt_snippet": "Does s/he have friends, rather than just acquaintances?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_cast_16",
      "prompt_snippet": "Does s/he often bring you things s/he is interested in to show you?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_cast_17",
      "prompt_snippet": "Does s/he enjoy joking around?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_cast_18",
      "prompt_snippet": "Does s/he have difficulty understanding the rules for polite behavior?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_cast_19",
      "prompt_snippet": "Does s/he appear to have an unusual memory for details?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_cast_20",
      "prompt_snippet": "Is his/her voice unusual (e.g., overly adult, flat, or very monotonous)?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_cast_21",
      "prompt_snippet": "Are people important to him/her?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_cast_22",
      "prompt_snippet": "Can s/he dress him/herself?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_cast_23",
      "prompt_snippet": "Is s/he good at turn-taking in conversation?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_cast_24",
      "prompt_snippet": "Does s/he play imaginatively with other children, and engage in role-play?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_cast_25",
      "prompt_snippet": "Does s/he often do or say things that are tactless or socially inappropriate?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_cast_26",
      "prompt_snippet": "Can s/he count to 50 without leaving out any numbers?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_cast_27",
      "prompt_snippet": "Does s/he make normal eye-contact?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_cast_28",
      "prompt_snippet": "Does s/he have any unusual and repetitive movements?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_cast_29",
      "prompt_snippet": "Is his/her social behavior very one-sided and always on his/her own terms?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_cast_30",
      "prompt_snippet": "Does s/he sometimes say “you” or “s/he” when s/he means “I”?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_cast_31",
      "prompt_snippet": "Does s/he prefer imaginative activities such as play-acting or story-telling, ra",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_cast_32",
      "prompt_snippet": "Does s/he sometimes lose the listener because of not explaining what s/he is tal",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_cast_33",
      "prompt_snippet": "Can s/he ride a bicycle (even if with stabilizers)?",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_cast_34",
      "prompt_snippet": "Does s/he try to impose routines on him/herself, or on others, in such a way tha",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_cast_35",
      "prompt_snippet": "Does s/he care how s/he is perceived by the rest of the group?",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_cast_36",
      "prompt_snippet": "Does s/he often turn conversations to his/her favorite subject rather than follo",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_cast_37",
      "prompt_snippet": "Does s/he have odd or unusual phrases?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_cast_38",
      "prompt_snippet": "Have teachers/health visitors ever expressed any concerns about his/her developm",
      "dimension": "rating",
      "values": [
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_cast_39",
      "prompt_snippet": "Has s/he ever been diagnosed with any of the following: Language delay, ADHD, he",
      "dimension": "rating",
      "values": [
        0,
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

- Items: 39
- Dimensions: rating
- Distinct scales: 3 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Does s/he join in playing games with other children easily? | rating | 0,1 | no |
| 2 | Does s/he come up to you spontaneously for a chat? | rating | 0,1 | no |
| 3 | Was s/he speaking by 2 years old? | rating | 0,0 | no |
| 4 | Does s/he enjoy sports? | rating | 0,0 | no |
| 5 | Is it important to him/her to fit in with the peer group? | rating | 0,1 | no |
| 6 | Does s/he appear to notice unusual details that others miss? | rating | 1,0 | no |
| 7 | Does s/he tend to take things literally? | rating | 1,0 | no |
| 8 | When s/he was 3 years old, did s/he spend a lot of time pretending (e.g., play-a | rating | 0,1 | no |
| 9 | Does s/he like to do things over and over again, in the same way all the time? | rating | 1,0 | no |
| 10 | Does s/he find it easy to interact with other children? | rating | 0,1 | no |
| 11 | Can s/he keep a two-way conversation going? | rating | 0,1 | no |
| 12 | Can s/he read appropriately for his/her age? | rating | 0,0 | no |
| 13 | Does s/he mostly have the same interests as his/her peers? | rating | 0,1 | no |
| 14 | Does s/he have an interest which takes up so much time that s/he does little els | rating | 1,0 | no |
| 15 | Does s/he have friends, rather than just acquaintances? | rating | 0,1 | no |
| 16 | Does s/he often bring you things s/he is interested in to show you? | rating | 0,1 | no |
| 17 | Does s/he enjoy joking around? | rating | 0,1 | no |
| 18 | Does s/he have difficulty understanding the rules for polite behavior? | rating | 1,0 | no |
| 19 | Does s/he appear to have an unusual memory for details? | rating | 1,0 | no |
| 20 | Is his/her voice unusual (e.g., overly adult, flat, or very monotonous)? | rating | 1,0 | no |
| 21 | Are people important to him/her? | rating | 0,1 | no |
| 22 | Can s/he dress him/herself? | rating | 0,0 | no |
| 23 | Is s/he good at turn-taking in conversation? | rating | 0,1 | no |
| 24 | Does s/he play imaginatively with other children, and engage in role-play? | rating | 0,1 | no |
| 25 | Does s/he often do or say things that are tactless or socially inappropriate? | rating | 1,0 | no |
| 26 | Can s/he count to 50 without leaving out any numbers? | rating | 0,0 | no |
| 27 | Does s/he make normal eye-contact? | rating | 0,1 | no |
| 28 | Does s/he have any unusual and repetitive movements? | rating | 1,0 | no |
| 29 | Is his/her social behavior very one-sided and always on his/her own terms? | rating | 1,0 | no |
| 30 | Does s/he sometimes say “you” or “s/he” when s/he means “I”? | rating | 1,0 | no |
| 31 | Does s/he prefer imaginative activities such as play-acting or story-telling, ra | rating | 0,1 | no |
| 32 | Does s/he sometimes lose the listener because of not explaining what s/he is tal | rating | 1,0 | no |
| 33 | Can s/he ride a bicycle (even if with stabilizers)? | rating | 0,0 | no |
| 34 | Does s/he try to impose routines on him/herself, or on others, in such a way tha | rating | 1,0 | no |
| 35 | Does s/he care how s/he is perceived by the rest of the group? | rating | 0,1 | no |
| 36 | Does s/he often turn conversations to his/her favorite subject rather than follo | rating | 1,0 | no |
| 37 | Does s/he have odd or unusual phrases? | rating | 1,0 | no |
| 38 | Have teachers/health visitors ever expressed any concerns about his/her developm | rating | 0,0 | no |
| 39 | Has s/he ever been diagnosed with any of the following: Language delay, ADHD, he | rating | 0,0 | no |

## To research (fill from https://psychology-tools.com/test/cast)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
