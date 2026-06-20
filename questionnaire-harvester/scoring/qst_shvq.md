# Scoring — Short Hypermasculinity Values Questionnaire (HVQ) (`qst_shvq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_shvq",
  "title": "Short Hypermasculinity Values Questionnaire (HVQ)",
  "short_title": "HVQ",
  "source_url": "https://us.psytoolkit.org/survey-library/hypermasculinity-shvq.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "hvqagree"
  ],
  "option_scales": [
    {
      "ref": "opt_shvq_hvqagree_7",
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
    "pr_shvq_4",
    "pr_shvq_5",
    "pr_shvq_7",
    "pr_shvq_9",
    "pr_shvq_10",
    "pr_shvq_13",
    "pr_shvq_14",
    "pr_shvq_15"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_shvq_1",
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
      "prompt_id": "pr_shvq_2",
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
      "index": 3,
      "prompt_id": "pr_shvq_3",
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
      "index": 4,
      "prompt_id": "pr_shvq_4",
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
      "index": 5,
      "prompt_id": "pr_shvq_5",
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
      "index": 6,
      "prompt_id": "pr_shvq_6",
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
      "index": 7,
      "prompt_id": "pr_shvq_7",
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
      "index": 8,
      "prompt_id": "pr_shvq_8",
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
      "index": 9,
      "prompt_id": "pr_shvq_9",
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
      "index": 10,
      "prompt_id": "pr_shvq_10",
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
      "index": 11,
      "prompt_id": "pr_shvq_11",
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
      "index": 12,
      "prompt_id": "pr_shvq_12",
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
      "index": 13,
      "prompt_id": "pr_shvq_13",
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
      "index": 14,
      "prompt_id": "pr_shvq_14",
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
      "index": 15,
      "prompt_id": "pr_shvq_15",
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
      "index": 16,
      "prompt_id": "pr_shvq_16",
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

- Items: 16
- Dimensions: hvqagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_shvq_4, pr_shvq_5, pr_shvq_7, pr_shvq_9, pr_shvq_10, pr_shvq_13, pr_shvq_14, pr_shvq_15
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Wife-swapping is fine as long as both men agree | hvqagree | 1,2,3,4,5,6,7 | no |
| 2 | Men who take part in yoga or ballet deserve to be ridiculed | hvqagree | 1,2,3,4,5,6,7 | no |
| 3 | Real men don’t back away from barroom confrontations | hvqagree | 1,2,3,4,5,6,7 | no |
| 4 | Women do not necessarily go for macho-looking males | hvqagree | 1,2,3,4,5,6,7 | yes |
| 5 | It’s a good thing for men to cry | hvqagree | 1,2,3,4,5,6,7 | yes |
| 6 | Sex is essentially a passive activity for women | hvqagree | 1,2,3,4,5,6,7 | no |
| 7 | There’s no such thing as a good war | hvqagree | 1,2,3,4,5,6,7 | yes |
| 8 | ‘Nuke the bastards’ is the only response sometimes | hvqagree | 1,2,3,4,5,6,7 | no |
| 9 | Some of the ‘initiation’ ceremonies in all-male institutions such as the army ar | hvqagree | 1,2,3,4,5,6,7 | yes |
| 10 | Heavy drinking is a problem not a sign of masculinity | hvqagree | 1,2,3,4,5,6,7 | yes |
| 11 | A lot of nonsense is talked about sexual technique, you’re either adequate or yo | hvqagree | 1,2,3,4,5,6,7 | no |
| 12 | There are too many wimps and cowards around today | hvqagree | 1,2,3,4,5,6,7 | no |
| 13 | Nursing is a perfectly respectable occupation for a man | hvqagree | 1,2,3,4,5,6,7 | yes |
| 14 | It is acceptable for a man to complain or even cry when he is in pain | hvqagree | 1,2,3,4,5,6,7 | yes |
| 15 | Men should not regard women as sex objects | hvqagree | 1,2,3,4,5,6,7 | yes |
| 16 | There’s too much nonsense talked about so-called sexual harassment | hvqagree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/hypermasculinity-shvq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
