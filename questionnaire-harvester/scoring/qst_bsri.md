# Scoring — Bem sex role inventory (BSRI) (`qst_bsri`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bsri",
  "title": "Bem sex role inventory (BSRI)",
  "short_title": "BSRI",
  "source_url": "https://us.psytoolkit.org/survey-library/sex-role-bem.html",
  "publication": {
    "citation": "Bem, S. L. (1974) The measurement of psychological\nandrogyny. Journal of Consulting and Clinical Psychology, 42 ,\n155-162.",
    "year": 1974
  },
  "status": "needs-research",
  "item_count": 60,
  "dimensions": [
    "howoften"
  ],
  "option_scales": [
    {
      "ref": "opt_bsri_howoften_7",
      "dimension": "howoften",
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
        "almost<br>never true",
        "rarely true",
        "less than<br>half the times true",
        "neutral",
        "more than<br>half the times true",
        "often true",
        "almost<br>always true"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bsri_1",
      "prompt_snippet": "yielding",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_2",
      "prompt_snippet": "cheerful",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_3",
      "prompt_snippet": "shy",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_4",
      "prompt_snippet": "affectionate",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_5",
      "prompt_snippet": "flatterable",
      "dimension": "howoften",
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
      "index": 6,
      "prompt_id": "pr_bsri_6",
      "prompt_snippet": "loyal",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_7",
      "prompt_snippet": "feminine",
      "dimension": "howoften",
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
      "index": 8,
      "prompt_id": "pr_bsri_8",
      "prompt_snippet": "sympathetic",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_9",
      "prompt_snippet": "sensitive to other's needs",
      "dimension": "howoften",
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
      "index": 10,
      "prompt_id": "pr_bsri_10",
      "prompt_snippet": "understanding",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_11",
      "prompt_snippet": "compassionate",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_12",
      "prompt_snippet": "eager to soothe hurt feelings",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_13",
      "prompt_snippet": "soft spoken",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_14",
      "prompt_snippet": "warm",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_15",
      "prompt_snippet": "tender",
      "dimension": "howoften",
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
      "index": 16,
      "prompt_id": "pr_bsri_16",
      "prompt_snippet": "gullible",
      "dimension": "howoften",
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
      "index": 17,
      "prompt_id": "pr_bsri_17",
      "prompt_snippet": "childlike",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_18",
      "prompt_snippet": "does not use harsh language",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_19",
      "prompt_snippet": "loves children",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_20",
      "prompt_snippet": "gentle",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_21",
      "prompt_snippet": "self reliant",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_22",
      "prompt_snippet": "defends own beliefs",
      "dimension": "howoften",
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
      "index": 23,
      "prompt_id": "pr_bsri_23",
      "prompt_snippet": "independent",
      "dimension": "howoften",
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
      "index": 24,
      "prompt_id": "pr_bsri_24",
      "prompt_snippet": "athletic",
      "dimension": "howoften",
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
      "index": 25,
      "prompt_id": "pr_bsri_25",
      "prompt_snippet": "assertive",
      "dimension": "howoften",
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
      "prompt_id": "pr_bsri_26",
      "prompt_snippet": "strong personality",
      "dimension": "howoften",
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
      "index": 27,
      "prompt_id": "pr_bsri_27",
      "prompt_snippet": "forceful",
      "dimension": "howoften",
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
      "index": 28,
      "prompt_id": "pr_bsri_28",
      "prompt_snippet": "analytical",
      "dimension": "howoften",
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
      "index": 29,
      "prompt_id": "pr_bsri_29",
      "prompt_snippet": "leadership ability",
      "dimension": "howoften",
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
      "index": 30,
      "prompt_id": "pr_bsri_30",
      "prompt_snippet": "willing to take risks",
      "dimension": "howoften",
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
      "index": 31,
      "prompt_id": "pr_bsri_31",
      "prompt_snippet": "makes decisions easily",
      "dimension": "howoften",
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
      "index": 32,
      "prompt_id": "pr_bsri_32",
      "prompt_snippet": "self-sufficient",
      "dimension": "howoften",
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
      "index": 33,
      "prompt_id": "pr_bsri_33",
      "prompt_snippet": "dominant",
      "dimension": "howoften",
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
      "index": 34,
      "prompt_id": "pr_bsri_34",
      "prompt_snippet": "masculine",
      "dimension": "howoften",
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
      "index": 35,
      "prompt_id": "pr_bsri_35",
      "prompt_snippet": "willing to take a stand",
      "dimension": "howoften",
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
      "index": 36,
      "prompt_id": "pr_bsri_36",
      "prompt_snippet": "aggressive",
      "dimension": "howoften",
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
      "index": 37,
      "prompt_id": "pr_bsri_37",
      "prompt_snippet": "acts as a leader",
      "dimension": "howoften",
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
      "index": 38,
      "prompt_id": "pr_bsri_38",
      "prompt_snippet": "individualistic",
      "dimension": "howoften",
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
      "index": 39,
      "prompt_id": "pr_bsri_39",
      "prompt_snippet": "competitive",
      "dimension": "howoften",
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
      "index": 40,
      "prompt_id": "pr_bsri_40",
      "prompt_snippet": "ambitious",
      "dimension": "howoften",
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
      "index": 41,
      "prompt_id": "pr_bsri_41",
      "prompt_snippet": "helpful",
      "dimension": "howoften",
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
      "index": 42,
      "prompt_id": "pr_bsri_42",
      "prompt_snippet": "moody",
      "dimension": "howoften",
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
      "index": 43,
      "prompt_id": "pr_bsri_43",
      "prompt_snippet": "conscientious",
      "dimension": "howoften",
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
      "index": 44,
      "prompt_id": "pr_bsri_44",
      "prompt_snippet": "theatrical",
      "dimension": "howoften",
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
      "index": 45,
      "prompt_id": "pr_bsri_45",
      "prompt_snippet": "happy",
      "dimension": "howoften",
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
      "index": 46,
      "prompt_id": "pr_bsri_46",
      "prompt_snippet": "unpredictable",
      "dimension": "howoften",
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
      "index": 47,
      "prompt_id": "pr_bsri_47",
      "prompt_snippet": "reliable",
      "dimension": "howoften",
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
      "index": 48,
      "prompt_id": "pr_bsri_48",
      "prompt_snippet": "jealous",
      "dimension": "howoften",
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
      "index": 49,
      "prompt_id": "pr_bsri_49",
      "prompt_snippet": "truthful",
      "dimension": "howoften",
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
      "index": 50,
      "prompt_id": "pr_bsri_50",
      "prompt_snippet": "secretive",
      "dimension": "howoften",
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
      "index": 51,
      "prompt_id": "pr_bsri_51",
      "prompt_snippet": "sincere",
      "dimension": "howoften",
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
      "index": 52,
      "prompt_id": "pr_bsri_52",
      "prompt_snippet": "conceited",
      "dimension": "howoften",
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
      "index": 53,
      "prompt_id": "pr_bsri_53",
      "prompt_snippet": "likable",
      "dimension": "howoften",
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
      "index": 54,
      "prompt_id": "pr_bsri_54",
      "prompt_snippet": "solemn",
      "dimension": "howoften",
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
      "index": 55,
      "prompt_id": "pr_bsri_55",
      "prompt_snippet": "friendly",
      "dimension": "howoften",
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
      "index": 56,
      "prompt_id": "pr_bsri_56",
      "prompt_snippet": "inefficient",
      "dimension": "howoften",
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
      "index": 57,
      "prompt_id": "pr_bsri_57",
      "prompt_snippet": "adaptable",
      "dimension": "howoften",
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
      "index": 58,
      "prompt_id": "pr_bsri_58",
      "prompt_snippet": "unsystematic",
      "dimension": "howoften",
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
      "index": 59,
      "prompt_id": "pr_bsri_59",
      "prompt_snippet": "tactful",
      "dimension": "howoften",
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
      "index": 60,
      "prompt_id": "pr_bsri_60",
      "prompt_snippet": "conventional",
      "dimension": "howoften",
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

- Items: 60
- Dimensions: howoften
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | yielding | howoften | 1,2,3,4,5,6,7 | no |
| 2 | cheerful | howoften | 1,2,3,4,5,6,7 | no |
| 3 | shy | howoften | 1,2,3,4,5,6,7 | no |
| 4 | affectionate | howoften | 1,2,3,4,5,6,7 | no |
| 5 | flatterable | howoften | 1,2,3,4,5,6,7 | no |
| 6 | loyal | howoften | 1,2,3,4,5,6,7 | no |
| 7 | feminine | howoften | 1,2,3,4,5,6,7 | no |
| 8 | sympathetic | howoften | 1,2,3,4,5,6,7 | no |
| 9 | sensitive to other's needs | howoften | 1,2,3,4,5,6,7 | no |
| 10 | understanding | howoften | 1,2,3,4,5,6,7 | no |
| 11 | compassionate | howoften | 1,2,3,4,5,6,7 | no |
| 12 | eager to soothe hurt feelings | howoften | 1,2,3,4,5,6,7 | no |
| 13 | soft spoken | howoften | 1,2,3,4,5,6,7 | no |
| 14 | warm | howoften | 1,2,3,4,5,6,7 | no |
| 15 | tender | howoften | 1,2,3,4,5,6,7 | no |
| 16 | gullible | howoften | 1,2,3,4,5,6,7 | no |
| 17 | childlike | howoften | 1,2,3,4,5,6,7 | no |
| 18 | does not use harsh language | howoften | 1,2,3,4,5,6,7 | no |
| 19 | loves children | howoften | 1,2,3,4,5,6,7 | no |
| 20 | gentle | howoften | 1,2,3,4,5,6,7 | no |
| 21 | self reliant | howoften | 1,2,3,4,5,6,7 | no |
| 22 | defends own beliefs | howoften | 1,2,3,4,5,6,7 | no |
| 23 | independent | howoften | 1,2,3,4,5,6,7 | no |
| 24 | athletic | howoften | 1,2,3,4,5,6,7 | no |
| 25 | assertive | howoften | 1,2,3,4,5,6,7 | no |
| 26 | strong personality | howoften | 1,2,3,4,5,6,7 | no |
| 27 | forceful | howoften | 1,2,3,4,5,6,7 | no |
| 28 | analytical | howoften | 1,2,3,4,5,6,7 | no |
| 29 | leadership ability | howoften | 1,2,3,4,5,6,7 | no |
| 30 | willing to take risks | howoften | 1,2,3,4,5,6,7 | no |
| 31 | makes decisions easily | howoften | 1,2,3,4,5,6,7 | no |
| 32 | self-sufficient | howoften | 1,2,3,4,5,6,7 | no |
| 33 | dominant | howoften | 1,2,3,4,5,6,7 | no |
| 34 | masculine | howoften | 1,2,3,4,5,6,7 | no |
| 35 | willing to take a stand | howoften | 1,2,3,4,5,6,7 | no |
| 36 | aggressive | howoften | 1,2,3,4,5,6,7 | no |
| 37 | acts as a leader | howoften | 1,2,3,4,5,6,7 | no |
| 38 | individualistic | howoften | 1,2,3,4,5,6,7 | no |
| 39 | competitive | howoften | 1,2,3,4,5,6,7 | no |
| 40 | ambitious | howoften | 1,2,3,4,5,6,7 | no |
| 41 | helpful | howoften | 1,2,3,4,5,6,7 | no |
| 42 | moody | howoften | 1,2,3,4,5,6,7 | no |
| 43 | conscientious | howoften | 1,2,3,4,5,6,7 | no |
| 44 | theatrical | howoften | 1,2,3,4,5,6,7 | no |
| 45 | happy | howoften | 1,2,3,4,5,6,7 | no |
| 46 | unpredictable | howoften | 1,2,3,4,5,6,7 | no |
| 47 | reliable | howoften | 1,2,3,4,5,6,7 | no |
| 48 | jealous | howoften | 1,2,3,4,5,6,7 | no |
| 49 | truthful | howoften | 1,2,3,4,5,6,7 | no |
| 50 | secretive | howoften | 1,2,3,4,5,6,7 | no |
| 51 | sincere | howoften | 1,2,3,4,5,6,7 | no |
| 52 | conceited | howoften | 1,2,3,4,5,6,7 | no |
| 53 | likable | howoften | 1,2,3,4,5,6,7 | no |
| 54 | solemn | howoften | 1,2,3,4,5,6,7 | no |
| 55 | friendly | howoften | 1,2,3,4,5,6,7 | no |
| 56 | inefficient | howoften | 1,2,3,4,5,6,7 | no |
| 57 | adaptable | howoften | 1,2,3,4,5,6,7 | no |
| 58 | unsystematic | howoften | 1,2,3,4,5,6,7 | no |
| 59 | tactful | howoften | 1,2,3,4,5,6,7 | no |
| 60 | conventional | howoften | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/sex-role-bem.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
