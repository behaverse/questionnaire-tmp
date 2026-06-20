# Scoring — Hypermasculinity Values Questionnaire (HVQ) (`qst_hvq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hvq",
  "title": "Hypermasculinity Values Questionnaire (HVQ)",
  "short_title": "HVQ",
  "source_url": "https://us.psytoolkit.org/survey-library/hypermasculinity-hvq.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 26,
  "dimensions": [
    "hvqagree"
  ],
  "option_scales": [
    {
      "ref": "opt_hvq_hvqagree_7",
      "dimension": "hvqagree",
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
        "Strongly disagree",
        "Disagree",
        "Slightly disagree",
        "Neither agree nor disagree",
        "Slightly agree",
        "Agree",
        "Strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_hvq_5",
    "pr_hvq_6",
    "pr_hvq_7",
    "pr_hvq_8",
    "pr_hvq_9",
    "pr_hvq_12",
    "pr_hvq_15",
    "pr_hvq_16",
    "pr_hvq_22",
    "pr_hvq_23",
    "pr_hvq_24"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hvq_1",
      "prompt_snippet": "Wife-swapping is fine as long as both men agree",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_2",
      "prompt_snippet": "Real men don’t give up because of fear",
      "dimension": "hvqagree",
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
      "index": 3,
      "prompt_id": "pr_hvq_3",
      "prompt_snippet": "Men who take part in yoga or ballet deserve to be ridiculed",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_4",
      "prompt_snippet": "Real men don’t back away from barroom confrontations",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_5",
      "prompt_snippet": "There is too much emphasis on being tough for men",
      "dimension": "hvqagree",
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
      "index": 6,
      "prompt_id": "pr_hvq_6",
      "prompt_snippet": "Women do not necessarily go for macho-looking males",
      "dimension": "hvqagree",
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
      "index": 7,
      "prompt_id": "pr_hvq_7",
      "prompt_snippet": "A romantic dinner with your partner is preferable to an evening drinking with ‘t",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_8",
      "prompt_snippet": "It’s a good thing for men to cry",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_9",
      "prompt_snippet": "Physical strength is no longer an important part of manhood",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_10",
      "prompt_snippet": "Sex is essentially a passive activity for women",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_11",
      "prompt_snippet": "‘Might is right’ sums things up a lot of the time",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_12",
      "prompt_snippet": "There’s no such thing as a good war",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_13",
      "prompt_snippet": "‘Nuke the bastards’ is the only response sometimes",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_14",
      "prompt_snippet": "Men should be able to hold their drink",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_15",
      "prompt_snippet": "Some of the ‘initiation’ ceremonies in all-male institutions such as the army ar",
      "dimension": "hvqagree",
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
      "index": 16,
      "prompt_id": "pr_hvq_16",
      "prompt_snippet": "Heavy drinking is a problem not a sign of masculinity",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_17",
      "prompt_snippet": "A lot of nonsense is talked about sexual technique, you’re either adequate or yo",
      "dimension": "hvqagree",
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
      "index": 18,
      "prompt_id": "pr_hvq_18",
      "prompt_snippet": "I don’t regard homosexuals as men",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_19",
      "prompt_snippet": "A sensitive man is a weak man",
      "dimension": "hvqagree",
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
      "index": 20,
      "prompt_id": "pr_hvq_20",
      "prompt_snippet": "A cat is no sort of pet for a boy",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_21",
      "prompt_snippet": "There are too many wimps and cowards around today",
      "dimension": "hvqagree",
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
      "index": 22,
      "prompt_id": "pr_hvq_22",
      "prompt_snippet": "Nursing is a perfectly respectable occupation for a man",
      "dimension": "hvqagree",
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
      "index": 23,
      "prompt_id": "pr_hvq_23",
      "prompt_snippet": "It is acceptable for a man to complain or even cry when he is in pain",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_24",
      "prompt_snippet": "Men should not regard women as sex objects",
      "dimension": "hvqagree",
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
      "prompt_id": "pr_hvq_25",
      "prompt_snippet": "There’s too much nonsense talked about so-called sexual harassment",
      "dimension": "hvqagree",
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
      "index": 26,
      "prompt_id": "pr_hvq_26",
      "prompt_snippet": "It does not seem right for a man to let a women drive the car",
      "dimension": "hvqagree",
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

- Items: 26
- Dimensions: hvqagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_hvq_5, pr_hvq_6, pr_hvq_7, pr_hvq_8, pr_hvq_9, pr_hvq_12, pr_hvq_15, pr_hvq_16, pr_hvq_22, pr_hvq_23, pr_hvq_24
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Wife-swapping is fine as long as both men agree | hvqagree | 1,2,3,4,5,6,7 | no |
| 2 | Real men don’t give up because of fear | hvqagree | 1,2,3,4,5,6,7 | no |
| 3 | Men who take part in yoga or ballet deserve to be ridiculed | hvqagree | 1,2,3,4,5,6,7 | no |
| 4 | Real men don’t back away from barroom confrontations | hvqagree | 1,2,3,4,5,6,7 | no |
| 5 | There is too much emphasis on being tough for men | hvqagree | 1,2,3,4,5,6,7 | yes |
| 6 | Women do not necessarily go for macho-looking males | hvqagree | 1,2,3,4,5,6,7 | yes |
| 7 | A romantic dinner with your partner is preferable to an evening drinking with ‘t | hvqagree | 1,2,3,4,5,6,7 | yes |
| 8 | It’s a good thing for men to cry | hvqagree | 1,2,3,4,5,6,7 | yes |
| 9 | Physical strength is no longer an important part of manhood | hvqagree | 1,2,3,4,5,6,7 | yes |
| 10 | Sex is essentially a passive activity for women | hvqagree | 1,2,3,4,5,6,7 | no |
| 11 | ‘Might is right’ sums things up a lot of the time | hvqagree | 1,2,3,4,5,6,7 | no |
| 12 | There’s no such thing as a good war | hvqagree | 1,2,3,4,5,6,7 | yes |
| 13 | ‘Nuke the bastards’ is the only response sometimes | hvqagree | 1,2,3,4,5,6,7 | no |
| 14 | Men should be able to hold their drink | hvqagree | 1,2,3,4,5,6,7 | no |
| 15 | Some of the ‘initiation’ ceremonies in all-male institutions such as the army ar | hvqagree | 1,2,3,4,5,6,7 | yes |
| 16 | Heavy drinking is a problem not a sign of masculinity | hvqagree | 1,2,3,4,5,6,7 | yes |
| 17 | A lot of nonsense is talked about sexual technique, you’re either adequate or yo | hvqagree | 1,2,3,4,5,6,7 | no |
| 18 | I don’t regard homosexuals as men | hvqagree | 1,2,3,4,5,6,7 | no |
| 19 | A sensitive man is a weak man | hvqagree | 1,2,3,4,5,6,7 | no |
| 20 | A cat is no sort of pet for a boy | hvqagree | 1,2,3,4,5,6,7 | no |
| 21 | There are too many wimps and cowards around today | hvqagree | 1,2,3,4,5,6,7 | no |
| 22 | Nursing is a perfectly respectable occupation for a man | hvqagree | 1,2,3,4,5,6,7 | yes |
| 23 | It is acceptable for a man to complain or even cry when he is in pain | hvqagree | 1,2,3,4,5,6,7 | yes |
| 24 | Men should not regard women as sex objects | hvqagree | 1,2,3,4,5,6,7 | yes |
| 25 | There’s too much nonsense talked about so-called sexual harassment | hvqagree | 1,2,3,4,5,6,7 | no |
| 26 | It does not seem right for a man to let a women drive the car | hvqagree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/hypermasculinity-hvq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
