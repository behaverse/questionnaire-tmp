# Scoring — Child Adolescent Bullying Scale (CABS) (`qst_cabs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cabs",
  "title": "Child Adolescent Bullying Scale (CABS)",
  "short_title": "CABS",
  "source_url": "https://us.psytoolkit.org/survey-library/cabs.html",
  "publication": {
    "citation": "Strout, T.D., Vessey, J.A., Difazio, R.L., Ludlow, L.H. (2018). The\nChild Adolescent Bullying Scale (CABS): Psychometric evaluation of a\nnew measure. Research in Nursing and Health, 41 , 1-13.",
    "year": 2018
  },
  "status": "needs-research",
  "item_count": 40,
  "dimensions": [
    "cabsscores"
  ],
  "option_scales": [
    {
      "ref": "opt_cabs_cabsscores_5",
      "dimension": "cabsscores",
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
        "strongly disagree",
        "disagree",
        "neither agree nor disagree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cabs_1",
      "prompt_snippet": "Kids try to make me feel bad on purpose",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_2",
      "prompt_snippet": "One or more kids at my school are mean to me",
      "dimension": "cabsscores",
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
      "index": 3,
      "prompt_id": "pr_cabs_3",
      "prompt_snippet": "Kids at my school make fun of me to make me feel bad",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_4",
      "prompt_snippet": "Kids at my school try to turn others against me",
      "dimension": "cabsscores",
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
      "index": 5,
      "prompt_id": "pr_cabs_5",
      "prompt_snippet": "Kids have tried to get me in trouble",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_6",
      "prompt_snippet": "I get bullied at school",
      "dimension": "cabsscores",
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
      "index": 7,
      "prompt_id": "pr_cabs_7",
      "prompt_snippet": "I have had my stuff taken or damaged on purpose by another student",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_8",
      "prompt_snippet": "I have been hurt by another student on purpose",
      "dimension": "cabsscores",
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
      "index": 9,
      "prompt_id": "pr_cabs_9",
      "prompt_snippet": "I have been threatened by another student in a mean or hurtful way",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_10",
      "prompt_snippet": "There are times that I do not want to go to school because I am being bullied",
      "dimension": "cabsscores",
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
      "index": 11,
      "prompt_id": "pr_cabs_11",
      "prompt_snippet": "I wish I could go to another school because I am being bullied",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_12",
      "prompt_snippet": "I have pretended to be sick so I could stay home from school because I am being ",
      "dimension": "cabsscores",
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
      "index": 13,
      "prompt_id": "pr_cabs_13",
      "prompt_snippet": "Kids at my school ignore me on purpose",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_14",
      "prompt_snippet": "Kids post or text mean or hurtful messages, comments, or photos about me online",
      "dimension": "cabsscores",
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
      "index": 15,
      "prompt_id": "pr_cabs_15",
      "prompt_snippet": "Kids at my school joke or tease me in a way that bothers me",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_16",
      "prompt_snippet": "I am bothered when kids at my school tease me",
      "dimension": "cabsscores",
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
      "index": 17,
      "prompt_id": "pr_cabs_17",
      "prompt_snippet": "I worry about bullying so much that I cannot pay attention at school",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_18",
      "prompt_snippet": "Kids at my school talk behind my back, share my secrets, or spread rumors about ",
      "dimension": "cabsscores",
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
      "index": 19,
      "prompt_id": "pr_cabs_19",
      "prompt_snippet": "Kids leave me out or ignore me because I am different",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_20",
      "prompt_snippet": "I have had upsetting memories of being bullied",
      "dimension": "cabsscores",
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
      "index": 21,
      "prompt_id": "pr_cabs_21",
      "prompt_snippet": "Kids at my school make fun of me to make me feel bad",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_22",
      "prompt_snippet": "I get bullied at school",
      "dimension": "cabsscores",
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
      "index": 23,
      "prompt_id": "pr_cabs_23",
      "prompt_snippet": "There are times that I do not want to go to school because I am being bullied",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_24",
      "prompt_snippet": "One or more kids at my school are mean to me",
      "dimension": "cabsscores",
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
      "index": 25,
      "prompt_id": "pr_cabs_25",
      "prompt_snippet": "Kids at my school try to turn others against me",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_26",
      "prompt_snippet": "Kids at my school talk behind my back, share my secrets, or spread rumors about ",
      "dimension": "cabsscores",
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
      "index": 27,
      "prompt_id": "pr_cabs_27",
      "prompt_snippet": "Kids leave me out or ignore me because I am different",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_28",
      "prompt_snippet": "Kids at my school joke or tease me in a way that bothers me",
      "dimension": "cabsscores",
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
      "index": 29,
      "prompt_id": "pr_cabs_29",
      "prompt_snippet": "I wish I could go to another school because I am being bullied",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_30",
      "prompt_snippet": "Kids at my school ignore me on purpose",
      "dimension": "cabsscores",
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
      "index": 31,
      "prompt_id": "pr_cabs_31",
      "prompt_snippet": "I have been threatened by another student in a mean or hurtful way",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_32",
      "prompt_snippet": "I worry about bullying so much that I cannot pay attention at school",
      "dimension": "cabsscores",
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
      "index": 33,
      "prompt_id": "pr_cabs_33",
      "prompt_snippet": "Kids try to make me feel bad on purpose",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_34",
      "prompt_snippet": "I have pretended to be sick so I could stay home from school because I am being ",
      "dimension": "cabsscores",
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
      "index": 35,
      "prompt_id": "pr_cabs_35",
      "prompt_snippet": "I have been hurt by another student on purpose",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_36",
      "prompt_snippet": "Kids post or text mean or hurtful messages, comments, or photos about me on line",
      "dimension": "cabsscores",
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
      "index": 37,
      "prompt_id": "pr_cabs_37",
      "prompt_snippet": "I have had upsetting memories of being bullied",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_38",
      "prompt_snippet": "I am bothered when kids at school tease me",
      "dimension": "cabsscores",
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
      "index": 39,
      "prompt_id": "pr_cabs_39",
      "prompt_snippet": "Kids have tried to get me in trouble",
      "dimension": "cabsscores",
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
      "prompt_id": "pr_cabs_40",
      "prompt_snippet": "I have had my stuff taken or damaged on purpose by another student",
      "dimension": "cabsscores",
      "values": [
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

- Items: 40
- Dimensions: cabsscores
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Kids try to make me feel bad on purpose | cabsscores | 1,2,3,4,5 | no |
| 2 | One or more kids at my school are mean to me | cabsscores | 1,2,3,4,5 | no |
| 3 | Kids at my school make fun of me to make me feel bad | cabsscores | 1,2,3,4,5 | no |
| 4 | Kids at my school try to turn others against me | cabsscores | 1,2,3,4,5 | no |
| 5 | Kids have tried to get me in trouble | cabsscores | 1,2,3,4,5 | no |
| 6 | I get bullied at school | cabsscores | 1,2,3,4,5 | no |
| 7 | I have had my stuff taken or damaged on purpose by another student | cabsscores | 1,2,3,4,5 | no |
| 8 | I have been hurt by another student on purpose | cabsscores | 1,2,3,4,5 | no |
| 9 | I have been threatened by another student in a mean or hurtful way | cabsscores | 1,2,3,4,5 | no |
| 10 | There are times that I do not want to go to school because I am being bullied | cabsscores | 1,2,3,4,5 | no |
| 11 | I wish I could go to another school because I am being bullied | cabsscores | 1,2,3,4,5 | no |
| 12 | I have pretended to be sick so I could stay home from school because I am being  | cabsscores | 1,2,3,4,5 | no |
| 13 | Kids at my school ignore me on purpose | cabsscores | 1,2,3,4,5 | no |
| 14 | Kids post or text mean or hurtful messages, comments, or photos about me online | cabsscores | 1,2,3,4,5 | no |
| 15 | Kids at my school joke or tease me in a way that bothers me | cabsscores | 1,2,3,4,5 | no |
| 16 | I am bothered when kids at my school tease me | cabsscores | 1,2,3,4,5 | no |
| 17 | I worry about bullying so much that I cannot pay attention at school | cabsscores | 1,2,3,4,5 | no |
| 18 | Kids at my school talk behind my back, share my secrets, or spread rumors about  | cabsscores | 1,2,3,4,5 | no |
| 19 | Kids leave me out or ignore me because I am different | cabsscores | 1,2,3,4,5 | no |
| 20 | I have had upsetting memories of being bullied | cabsscores | 1,2,3,4,5 | no |
| 21 | Kids at my school make fun of me to make me feel bad | cabsscores | 1,2,3,4,5 | no |
| 22 | I get bullied at school | cabsscores | 1,2,3,4,5 | no |
| 23 | There are times that I do not want to go to school because I am being bullied | cabsscores | 1,2,3,4,5 | no |
| 24 | One or more kids at my school are mean to me | cabsscores | 1,2,3,4,5 | no |
| 25 | Kids at my school try to turn others against me | cabsscores | 1,2,3,4,5 | no |
| 26 | Kids at my school talk behind my back, share my secrets, or spread rumors about  | cabsscores | 1,2,3,4,5 | no |
| 27 | Kids leave me out or ignore me because I am different | cabsscores | 1,2,3,4,5 | no |
| 28 | Kids at my school joke or tease me in a way that bothers me | cabsscores | 1,2,3,4,5 | no |
| 29 | I wish I could go to another school because I am being bullied | cabsscores | 1,2,3,4,5 | no |
| 30 | Kids at my school ignore me on purpose | cabsscores | 1,2,3,4,5 | no |
| 31 | I have been threatened by another student in a mean or hurtful way | cabsscores | 1,2,3,4,5 | no |
| 32 | I worry about bullying so much that I cannot pay attention at school | cabsscores | 1,2,3,4,5 | no |
| 33 | Kids try to make me feel bad on purpose | cabsscores | 1,2,3,4,5 | no |
| 34 | I have pretended to be sick so I could stay home from school because I am being  | cabsscores | 1,2,3,4,5 | no |
| 35 | I have been hurt by another student on purpose | cabsscores | 1,2,3,4,5 | no |
| 36 | Kids post or text mean or hurtful messages, comments, or photos about me on line | cabsscores | 1,2,3,4,5 | no |
| 37 | I have had upsetting memories of being bullied | cabsscores | 1,2,3,4,5 | no |
| 38 | I am bothered when kids at school tease me | cabsscores | 1,2,3,4,5 | no |
| 39 | Kids have tried to get me in trouble | cabsscores | 1,2,3,4,5 | no |
| 40 | I have had my stuff taken or damaged on purpose by another student | cabsscores | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/cabs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
