# Scoring — Barratt’s Impulsiveness scale (BIS) (`qst_bis`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bis",
  "title": "Barratt’s Impulsiveness scale (BIS)",
  "short_title": "BIS",
  "source_url": "https://us.psytoolkit.org/survey-library/impulsiveness-barratt.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 30,
  "dimensions": [
    "howoften"
  ],
  "option_scales": [
    {
      "ref": "opt_bis_howoften_4",
      "dimension": "howoften",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "Rarely/Never",
        "Occasionally",
        "Often",
        "Almost Always/Always"
      ]
    }
  ],
  "reversed_items": [
    "pr_bis_1",
    "pr_bis_7",
    "pr_bis_8",
    "pr_bis_9",
    "pr_bis_10",
    "pr_bis_12",
    "pr_bis_13",
    "pr_bis_15",
    "pr_bis_20",
    "pr_bis_29",
    "pr_bis_30"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bis_1",
      "prompt_snippet": "I plan tasks carefully.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_bis_2",
      "prompt_snippet": "I do things without thinking.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_bis_3",
      "prompt_snippet": "I make-up my mind quickly.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_bis_4",
      "prompt_snippet": "I am happy-go-lucky.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_bis_5",
      "prompt_snippet": "I don't \"pay attention.\"",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_bis_6",
      "prompt_snippet": "I have \"racing\" thoughts.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_bis_7",
      "prompt_snippet": "I plan trips well ahead of time.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_bis_8",
      "prompt_snippet": "I am self controlled.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 9,
      "prompt_id": "pr_bis_9",
      "prompt_snippet": "I concentrate easily.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_bis_10",
      "prompt_snippet": "I save regularly.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_bis_11",
      "prompt_snippet": "I \"squirm\" at plays or lectures.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_bis_12",
      "prompt_snippet": "I am a careful thinker.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_bis_13",
      "prompt_snippet": "I plan for job security.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_bis_14",
      "prompt_snippet": "I say things without thinking.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_bis_15",
      "prompt_snippet": "I like to think about complex problems.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_bis_16",
      "prompt_snippet": "I change jobs.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_bis_17",
      "prompt_snippet": "I act \"on impulse\".",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_bis_18",
      "prompt_snippet": "I get easily bored when solving thought problems.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_bis_19",
      "prompt_snippet": "I act on the spur of the moment.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_bis_20",
      "prompt_snippet": "I am a steady thinker.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 21,
      "prompt_id": "pr_bis_21",
      "prompt_snippet": "I change residences.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_bis_22",
      "prompt_snippet": "I buy things on impulse.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_bis_23",
      "prompt_snippet": "I can only think about one thing at a time.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_bis_24",
      "prompt_snippet": "I change hobbies.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_bis_25",
      "prompt_snippet": "I spend or charge more than I earn.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_bis_26",
      "prompt_snippet": "I often have extraneous thoughts when thinking.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_bis_27",
      "prompt_snippet": "I am more interested in the present than the future.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_bis_28",
      "prompt_snippet": "I am restless at the theater or lectures.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_bis_29",
      "prompt_snippet": "I like puzzles.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 30,
      "prompt_id": "pr_bis_30",
      "prompt_snippet": "I am future oriented.",
      "dimension": "howoften",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
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

- Items: 30
- Dimensions: howoften
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_bis_1, pr_bis_7, pr_bis_8, pr_bis_9, pr_bis_10, pr_bis_12, pr_bis_13, pr_bis_15, pr_bis_20, pr_bis_29, pr_bis_30
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I plan tasks carefully. | howoften | 1,2,3,4 | yes |
| 2 | I do things without thinking. | howoften | 1,2,3,4 | no |
| 3 | I make-up my mind quickly. | howoften | 1,2,3,4 | no |
| 4 | I am happy-go-lucky. | howoften | 1,2,3,4 | no |
| 5 | I don't "pay attention." | howoften | 1,2,3,4 | no |
| 6 | I have "racing" thoughts. | howoften | 1,2,3,4 | no |
| 7 | I plan trips well ahead of time. | howoften | 1,2,3,4 | yes |
| 8 | I am self controlled. | howoften | 1,2,3,4 | yes |
| 9 | I concentrate easily. | howoften | 1,2,3,4 | yes |
| 10 | I save regularly. | howoften | 1,2,3,4 | yes |
| 11 | I "squirm" at plays or lectures. | howoften | 1,2,3,4 | no |
| 12 | I am a careful thinker. | howoften | 1,2,3,4 | yes |
| 13 | I plan for job security. | howoften | 1,2,3,4 | yes |
| 14 | I say things without thinking. | howoften | 1,2,3,4 | no |
| 15 | I like to think about complex problems. | howoften | 1,2,3,4 | yes |
| 16 | I change jobs. | howoften | 1,2,3,4 | no |
| 17 | I act "on impulse". | howoften | 1,2,3,4 | no |
| 18 | I get easily bored when solving thought problems. | howoften | 1,2,3,4 | no |
| 19 | I act on the spur of the moment. | howoften | 1,2,3,4 | no |
| 20 | I am a steady thinker. | howoften | 1,2,3,4 | yes |
| 21 | I change residences. | howoften | 1,2,3,4 | no |
| 22 | I buy things on impulse. | howoften | 1,2,3,4 | no |
| 23 | I can only think about one thing at a time. | howoften | 1,2,3,4 | no |
| 24 | I change hobbies. | howoften | 1,2,3,4 | no |
| 25 | I spend or charge more than I earn. | howoften | 1,2,3,4 | no |
| 26 | I often have extraneous thoughts when thinking. | howoften | 1,2,3,4 | no |
| 27 | I am more interested in the present than the future. | howoften | 1,2,3,4 | no |
| 28 | I am restless at the theater or lectures. | howoften | 1,2,3,4 | no |
| 29 | I like puzzles. | howoften | 1,2,3,4 | yes |
| 30 | I am future oriented. | howoften | 1,2,3,4 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/impulsiveness-barratt.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.
