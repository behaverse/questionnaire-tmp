# Scoring — Body Esteem Scale (BES) (`qst_bes`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bes",
  "title": "Body Esteem Scale (BES)",
  "short_title": "BES",
  "source_url": "https://us.psytoolkit.org/survey-library/body-esteem-bes.html",
  "publication": {
    "citation": "Franzoi, S.L. (1994). Further evidence of the reliability and validity of the body esteem scale. Journal of Clinical Psychology, 50 , 237-239.",
    "year": 1994
  },
  "status": "needs-research",
  "item_count": 35,
  "dimensions": [
    "feelings"
  ],
  "option_scales": [
    {
      "ref": "opt_bes_feelings_5",
      "dimension": "feelings",
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
        "strong negative feelings",
        "moderate negative feelings",
        "no feeling one way or the other",
        "moderate positive feelings",
        "strong positive feelings"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bes_1",
      "prompt_snippet": "body scent",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_2",
      "prompt_snippet": "appetite",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_3",
      "prompt_snippet": "nose",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_4",
      "prompt_snippet": "physical stamina",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_5",
      "prompt_snippet": "reflexes",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_6",
      "prompt_snippet": "lips",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_7",
      "prompt_snippet": "muscular strength",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_8",
      "prompt_snippet": "waist",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_9",
      "prompt_snippet": "energy level",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_10",
      "prompt_snippet": "thighs",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_11",
      "prompt_snippet": "ears",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_12",
      "prompt_snippet": "biceps",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_13",
      "prompt_snippet": "chin",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_14",
      "prompt_snippet": "body build",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_15",
      "prompt_snippet": "physical coordination",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_16",
      "prompt_snippet": "buttocks",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_17",
      "prompt_snippet": "agility",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_18",
      "prompt_snippet": "width of shoulders",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_19",
      "prompt_snippet": "arms",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_20",
      "prompt_snippet": "chest or breasts",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_21",
      "prompt_snippet": "appearance of eyes",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_22",
      "prompt_snippet": "cheeks/cheekbones",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_23",
      "prompt_snippet": "hips",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_24",
      "prompt_snippet": "legs",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_25",
      "prompt_snippet": "figure or physique",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_26",
      "prompt_snippet": "sex drive",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_27",
      "prompt_snippet": "feet",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_28",
      "prompt_snippet": "sex organs",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_29",
      "prompt_snippet": "appearance of stomach",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_30",
      "prompt_snippet": "health",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_31",
      "prompt_snippet": "sex activities",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_32",
      "prompt_snippet": "body hair",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_33",
      "prompt_snippet": "physical condition",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_34",
      "prompt_snippet": "face",
      "dimension": "feelings",
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
      "prompt_id": "pr_bes_35",
      "prompt_snippet": "weight",
      "dimension": "feelings",
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

- Items: 35
- Dimensions: feelings
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | body scent | feelings | 1,2,3,4,5 | no |
| 2 | appetite | feelings | 1,2,3,4,5 | no |
| 3 | nose | feelings | 1,2,3,4,5 | no |
| 4 | physical stamina | feelings | 1,2,3,4,5 | no |
| 5 | reflexes | feelings | 1,2,3,4,5 | no |
| 6 | lips | feelings | 1,2,3,4,5 | no |
| 7 | muscular strength | feelings | 1,2,3,4,5 | no |
| 8 | waist | feelings | 1,2,3,4,5 | no |
| 9 | energy level | feelings | 1,2,3,4,5 | no |
| 10 | thighs | feelings | 1,2,3,4,5 | no |
| 11 | ears | feelings | 1,2,3,4,5 | no |
| 12 | biceps | feelings | 1,2,3,4,5 | no |
| 13 | chin | feelings | 1,2,3,4,5 | no |
| 14 | body build | feelings | 1,2,3,4,5 | no |
| 15 | physical coordination | feelings | 1,2,3,4,5 | no |
| 16 | buttocks | feelings | 1,2,3,4,5 | no |
| 17 | agility | feelings | 1,2,3,4,5 | no |
| 18 | width of shoulders | feelings | 1,2,3,4,5 | no |
| 19 | arms | feelings | 1,2,3,4,5 | no |
| 20 | chest or breasts | feelings | 1,2,3,4,5 | no |
| 21 | appearance of eyes | feelings | 1,2,3,4,5 | no |
| 22 | cheeks/cheekbones | feelings | 1,2,3,4,5 | no |
| 23 | hips | feelings | 1,2,3,4,5 | no |
| 24 | legs | feelings | 1,2,3,4,5 | no |
| 25 | figure or physique | feelings | 1,2,3,4,5 | no |
| 26 | sex drive | feelings | 1,2,3,4,5 | no |
| 27 | feet | feelings | 1,2,3,4,5 | no |
| 28 | sex organs | feelings | 1,2,3,4,5 | no |
| 29 | appearance of stomach | feelings | 1,2,3,4,5 | no |
| 30 | health | feelings | 1,2,3,4,5 | no |
| 31 | sex activities | feelings | 1,2,3,4,5 | no |
| 32 | body hair | feelings | 1,2,3,4,5 | no |
| 33 | physical condition | feelings | 1,2,3,4,5 | no |
| 34 | face | feelings | 1,2,3,4,5 | no |
| 35 | weight | feelings | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/body-esteem-bes.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
